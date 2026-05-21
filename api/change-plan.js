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

  const { plan, oldSubscriptionId } = req.body || {};
  if (!plan) return res.status(400).json({ error: "plan required" });

  const priceId = PRICES[plan];
  if (!priceId) return res.status(400).json({ error: "Plan invalide" });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });

  try {
    // Nouveau checkout — paiement immédiat du nouveau plan
    // L'ancien abonnement sera annulé dans le webhook après paiement réussi
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `https://fyltra.app/setup?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://fyltra.app/dashboard`,
      allow_promotion_codes: true,
      metadata: { plan, oldSubscriptionId: oldSubscriptionId || "" },
    });

    return res.status(200).json({ url: session.url });
  } catch (e) {
    console.error("change-plan error:", e.message);
    return res.status(500).json({ error: e.message });
  }
};
