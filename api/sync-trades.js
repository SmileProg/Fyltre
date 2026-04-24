export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { accountId, startDate } = req.body;
  if (!accountId) return res.status(400).json({ error: "accountId requis" });

  const TOKEN = process.env.METAAPI_TOKEN;
  const from = startDate ? new Date(startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const to = new Date();

  try {
    // Vérifier l'état du compte
    const stateRes = await fetch(`https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts/${accountId}`, {
      headers: { "auth-token": TOKEN },
    });
    const stateData = await stateRes.json();
    if (!stateRes.ok) return res.status(stateRes.status).json({ error: stateData.message || "Compte introuvable" });
    if (stateData.state !== "DEPLOYED") return res.status(202).json({ status: stateData.state, message: "Compte en cours de connexion, réessaie dans quelques minutes." });

    // Récupérer l'historique des deals
    const histRes = await fetch(
      `https://metaapi.cloud/users/current/accounts/${accountId}/history-deals/time/${from.toISOString()}/${to.toISOString()}`,
      { headers: { "auth-token": TOKEN } }
    );
    const histData = await histRes.json();
    if (!histRes.ok) return res.status(histRes.status).json({ error: histData.message || "Erreur récupération historique" });

    // Convertir les deals MetaAPI en format Fyltra
    const trades = (histData.deals || [])
      .filter(d => d.type === "DEAL_TYPE_BUY" || d.type === "DEAL_TYPE_SELL")
      .filter(d => d.entryType === "DEAL_ENTRY_OUT" || d.entryType === "DEAL_ENTRY_INOUT")
      .map(d => ({
        date: d.time ? d.time.slice(0, 10) : new Date().toISOString().slice(0, 10),
        instrument: d.symbol || "",
        direction: d.type === "DEAL_TYPE_BUY" ? "LONG" : "SHORT",
        pnl: d.profit || 0,
        result: (d.profit || 0) > 0 ? "WIN" : (d.profit || 0) < 0 ? "LOSS" : "BREAKEVEN",
        session: "New York",
        emotion: "Neutre",
        notes: `Importé MT5 · ticket #${d.id}`,
        rr: null,
        size: d.volume || null,
        entry: d.price ? String(d.price) : "",
        tradeMode: "swing",
      }));

    return res.status(200).json({ trades, total: trades.length });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
