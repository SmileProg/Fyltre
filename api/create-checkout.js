const Stripe = require("stripe");

const PRICES = {
  early_bird: process.env.STRIPE_PRICE_EARLY_BIRD,
  pro: process.env.STRIPE_PRICE_PRO,
};

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const { plan } = req.body || {};
  const priceId = PRICES[plan];
  if (!priceId) return res.status(400).json({ error: "Plan invalide" });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `https://fyltra.app/setup?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://fyltra.app/`,
      allow_promotion_codes: true,
      metadata: { plan },
    });

    return res.status(200).json({ url: session.url });
  } catch (e) {
    console.error("Stripe error:", e.message);
    return res.status(500).json({ error: e.message });
  }
};
