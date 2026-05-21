const Stripe = require("stripe");

const PRICES = {
  starter: "price_1TZ4uIAiOhWjahUBo0I6gPAQ",
  trader:  "price_1TZ4vvAiOhWjahUBreCczmFg",
  pro:     "price_1TZ4xMAiOhWjahUBYcfhXYqM",
};

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const { subscriptionId, plan } = req.body || {};
  if (!subscriptionId || !plan) return res.status(400).json({ error: "subscriptionId and plan required" });

  const priceId = PRICES[plan];
  if (!priceId) return res.status(400).json({ error: "Plan invalide" });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });

  try {
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    const itemId = sub.items.data[0]?.id;
    if (!itemId) return res.status(400).json({ error: "Abonnement introuvable" });

    // Changement au prochain cycle de facturation, prix plein
    const updated = await stripe.subscriptions.update(subscriptionId, {
      items: [{ id: itemId, price: priceId }],
      proration_behavior: "none",
    });

    // Mettre à jour le plan dans Supabase
    const SUPA_URL = process.env.SUPABASE_URL || "https://yxvkedyhykhajcivsgal.supabase.co";
    const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
    await fetch(`${SUPA_URL}/rest/v1/purchases?order_id=eq.${encodeURIComponent(subscriptionId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, Prefer: "return=minimal" },
      body: JSON.stringify({ plan }),
    });

    return res.status(200).json({ ok: true, plan, renewsAt: new Date(updated.current_period_end * 1000).toISOString() });
  } catch (e) {
    console.error("change-plan error:", e.message);
    return res.status(500).json({ error: e.message });
  }
};
