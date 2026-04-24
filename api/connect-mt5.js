export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { login, password, server, name, platform = "mt5" } = req.body;
  if (!login || !password || !server) return res.status(400).json({ error: "login, password et server sont requis" });

  const TOKEN = process.env.METAAPI_TOKEN;

  try {
    const response = await fetch("https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json", "auth-token": TOKEN },
      body: JSON.stringify({
        login: String(login),
        password,
        server,
        name: name || `Compte ${login}`,
        platform,
        type: "cloud",
        magic: 0,
        application: "MetaApi",
        quoteStreamingIntervalInSeconds: 2.5,
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.message || "Erreur MetaAPI" });

    return res.status(200).json({ accountId: data.id, state: data.state });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
