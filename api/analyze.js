module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { summary, stratCtx, tradeCount, customSystem } = req.body;
  if (!summary) return res.status(400).json({ error: "summary requis" });

  const KEY = process.env.GROQ_API_KEY;
  const systemMsg = customSystem || (
    "Tu es un coach de trading professionnel et exigeant.\n"
    + (stratCtx ? "\nSTRATÉGIE DU TRADER:\n" + stratCtx + "\n" : "")
    + "\nAnalyse le journal de trading. Donne:\n1) Ce qui fonctionne\n2) Erreurs récurrentes"
    + (stratCtx ? " (déviations de la stratégie aussi)" : "")
    + "\n3) 3 règles concrètes pour demain\nSois direct, sans fioritures. Réponds en français."
  );

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${KEY}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 1024,
        messages: [
          { role: "system", content: systemMsg },
          { role: "user", content: tradeCount ? `${tradeCount} trades:\n\n${summary}` : summary }
        ]
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || "Erreur Groq" });

    const text = data.choices?.[0]?.message?.content;
    if (!text) return res.status(500).json({ error: "Réponse vide" });

    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
