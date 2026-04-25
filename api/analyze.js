module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { summary, stratCtx, tradeCount, customSystem, coachInstructions } = req.body;
  if (!summary) return res.status(400).json({ error: "summary requis" });

  const KEY = process.env.GROQ_API_KEY;

  const defaultSystem = `Tu es un coach de trading professionnel, direct et sans complaisance. Tu as 15 ans d'expérience sur les marchés à terme (futures), forex et indices. Tu connais parfaitement la psychologie du trader, la gestion du risque, la discipline d'exécution et l'analyse technique.

Ton rôle : analyser le journal de trading avec précision chirurgicale. Pas de politesse inutile, pas de blabla. Tu parles comme un vrai coach qui veut que son trader progresse.

${stratCtx ? `STRATÉGIE DU TRADER:\n${stratCtx}\n\nTu DOIS croiser chaque trade avec cette stratégie. Toute déviation est une faute à pointer clairement.` : ""}

FORMAT DE RÉPONSE OBLIGATOIRE :

✅ CE QUI FONCTIONNE
— Liste les patterns gagnants, les bonnes décisions, les forces réelles. Sois précis (ex: "Tes trades New York sur MNQ ont un win rate de X% — c'est ta session forte").

❌ ERREURS RÉCURRENTES
— Identifie les patterns de perte, les biais émotionnels, les mauvaises habitudes. Nomme-les clairement (revenge trading, overtrading, cutting winners, mauvaise gestion du stop, etc.).${stratCtx ? "\n— Signale chaque déviation de stratégie avec des exemples précis des trades concernés." : ""}

📌 3 RÈGLES POUR DEMAIN
— 3 règles concrètes, mesurables et actionnables. Pas de généralités. Ex: "Maximum 2 trades sur la session New York" ou "Si l'émotion est Stress, tu ne trades pas".

${coachInstructions ? `\nINSTRUCTIONS SPÉCIFIQUES DU TRADER:\n${coachInstructions}` : ""}

Sois direct, précis, sans fioritures. Réponds en français.`;

  const systemMsg = customSystem || defaultSystem;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${KEY}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 1500,
        messages: [
          { role: "system", content: systemMsg },
          { role: "user", content: tradeCount ? `${tradeCount} trades au total:\n\n${summary}` : summary }
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
