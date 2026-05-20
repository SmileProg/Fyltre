module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { accountId, startDate } = req.body;
  if (!accountId) return res.status(400).json({ error: "accountId requis" });

  const TOKEN = process.env.METAAPI_TOKEN;
  const BASE  = "https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai";

  try {
    // 1. Récupérer l'état du compte
    const stateRes = await fetch(`${BASE}/users/current/accounts/${accountId}`, {
      headers: { "auth-token": TOKEN },
    });
    let stateData;
    try {
      const txt = await stateRes.text();
      stateData = JSON.parse(txt);
    } catch {
      return res.status(502).json({ error: "Réponse MetaAPI illisible" });
    }
    if (!stateRes.ok) {
      if (stateRes.status === 404) return res.status(404).json({ error: "not found" });
      return res.status(stateRes.status).json({ error: stateData.message || "Erreur MetaAPI" });
    }

    const state = stateData.state;

    // 2. Pas déployé → déclencher le déploiement et demander au client de reessayer
    if (state === "UNDEPLOYED" || state === "ERROR") {
      await fetch(`${BASE}/users/current/accounts/${accountId}/deploy`, {
        method: "POST",
        headers: { "auth-token": TOKEN },
      }).catch(() => {});
      return res.status(202).json({ status: "deploying" });
    }

    // 3. En cours de déploiement → attendre
    if (state !== "DEPLOYED") {
      return res.status(202).json({ status: "deploying" });
    }

    // 4. DEPLOYED → récupérer l'historique
    const from   = startDate ? new Date(startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const to     = new Date();
    const region = stateData.region || "new-york";
    const histUrl = `https://mt-client-api-v1.${region}.agiliumtrade.ai/users/current/accounts/${accountId}/history-deals/time/${from.toISOString()}/${to.toISOString()}`;

    let histData;
    try {
      const histRes  = await fetch(histUrl, { headers: { "auth-token": TOKEN } });
      const histText = await histRes.text();
      try { histData = JSON.parse(histText); }
      catch { return res.status(502).json({ error: `MetaAPI history (région: ${region}): ${histText.slice(0, 120)}` }); }
      if (!histRes.ok) {
        const msg = histData.message || "";
        if (msg.includes("not connected to broker") || msg.includes("account region") || msg.includes("does not match")) {
          return res.status(202).json({ status: "deploying" });
        }
        return res.status(histRes.status).json({ error: msg || "Erreur récupération historique" });
      }
    } catch (e) {
      return res.status(502).json({ error: `Connexion history impossible: ${e.message}` });
    }

    // 5. Undeploy en fire-and-forget — ne pas bloquer la réponse
    fetch(`${BASE}/users/current/accounts/${accountId}/undeploy`, {
      method: "POST",
      headers: { "auth-token": TOKEN },
    }).catch(() => {});

    // 6. Convertir les deals MetaAPI → format Fyltra
    const rawDeals = Array.isArray(histData) ? histData : (histData.deals || histData.historyDeals || []);
    const trades = rawDeals
      .filter(d => d.type === "DEAL_TYPE_BUY" || d.type === "DEAL_TYPE_SELL")
      .filter(d => d.entryType === "DEAL_ENTRY_OUT" || d.entryType === "DEAL_ENTRY_INOUT" || d.entryType === "DEAL_ENTRY_OUT_BY")
      .map(d => ({
        date:      d.time ? d.time.slice(0, 10) : new Date().toISOString().slice(0, 10),
        instrument:d.symbol || "",
        direction: d.type === "DEAL_TYPE_BUY" ? "LONG" : "SHORT",
        pnl:       d.profit || 0,
        result:    (d.profit || 0) > 0 ? "WIN" : (d.profit || 0) < 0 ? "LOSS" : "BREAKEVEN",
        session:   "New York",
        emotion:   "Neutre",
        notes:     `Importé MT5 · ticket #${d.id}`,
        rr:        null,
        size:      d.volume || null,
        entry:     d.price ? String(d.price) : "",
        tradeMode: "swing",
      }));

    return res.status(200).json({ trades, total: trades.length });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
