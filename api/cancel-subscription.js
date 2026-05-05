module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const { subscriptionId } = req.body || {};
  if (!subscriptionId) return res.status(400).json({ error: "subscriptionId required" });

  const LS_KEY = process.env.LS_API_KEY;
  if (!LS_KEY) return res.status(500).json({ error: "LS_API_KEY not configured" });

  try {
    // DELETE cancels at end of current billing period
    const resp = await fetch(`https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${LS_KEY}`, Accept: "application/vnd.api+json" },
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      return res.status(resp.status).json({ error: err.errors?.[0]?.detail || "Lemon Squeezy API error" });
    }

    const data = await resp.json().catch(() => ({}));
    const endsAt = data.data?.attributes?.ends_at ?? null;
    return res.status(200).json({ ok: true, endsAt });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
