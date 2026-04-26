module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { patternData, stratCtx, tradeCount, coachInstructions } = req.body;
  if (!patternData) return res.status(400).json({ error: "patternData requis" });

  const KEY = process.env.GROQ_API_KEY;

  const systemMsg = `Tu es un analyste de trading quantitatif et coach professionnel. Tu as accès à des données structurées et statistiques d'un journal de trading.

Ton rôle : détecter des patterns réels dans les chiffres et transformer chaque insight en règle concrète.

${stratCtx ? `STRATÉGIE DU TRADER:\n${stratCtx}\n` : ""}
${coachInstructions ? `INSTRUCTIONS DU TRADER:\n${coachInstructions}\n` : ""}

FORMAT DE RÉPONSE OBLIGATOIRE — respecte exactement ces sections :

🔍 PATTERNS DÉTECTÉS
Pour chaque pattern trouvé dans les données, cite les chiffres exacts. Ex: "London: 68% WR vs New York: 41% WR → tu es 1.6x plus efficace le matin". Analyse au moins : jours, sessions, émotions, instruments. Sois factuel.

✂️ COUPE-TU TES WINNERS ?
Analyse le RR moyen sur trades gagnants et le % de winners fermés avant 1:1. Dis clairement si l'utilisateur coupe trop tôt ou non, avec les chiffres.

⚠️ DANGER ZONES
Les 2-3 combinaisons (jour + émotion, session + instrument, etc.) qui génèrent le plus de pertes. Chiffres à l'appui.

🏆 EDGE CONFIRMÉ
La combinaison où le trader performe vraiment bien (ex: "MNQ + London + Confiant = +X€, 75% WR"). Ce sont ses conditions optimales.

📌 3 RÈGLES POUR DEMAIN
Règles mesurables et directement issues des données. Pas de généralités. Ex: "Ne trade pas le Vendredi (P&L cumulé: -X€)" ou "Si émotion = Anxieux, passe ton tour (WR: 22%)".

Réponds en français. Direct, chiffres d'abord, conclusions ensuite.`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${KEY}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 1800,
        messages: [
          { role: "system", content: systemMsg },
          { role: "user", content: `${tradeCount} trades analysés :\n\n${patternData}` }
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
