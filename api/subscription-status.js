const Stripe = require("stripe");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).end();

  const email = (req.query.email || "").toLowerCase().trim();
  if (!email) return res.status(400).json({ error: "email required" });

  const SUPA_URL = process.env.SUPABASE_URL || "https://yxvkedyhykhajcivsgal.supabase.co";
  const SUPA_KEY = process.env.SUPABASE_ANON_KEY;

  try {
    // 1. Récupérer stripe_subscription_id depuis Supabase
    const dbRes = await fetch(
      `${SUPA_URL}/rest/v1/purchases?select=order_id,plan&email=eq.${encodeURIComponent(email)}&limit=1`,
      { headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` } }
    );
    const dbData = await dbRes.json();
    const purchase = Array.isArray(dbData) && dbData[0];
    if (!purchase) return res.status(404).json({ error: "no subscription" });

    const subscriptionId = purchase.order_id;
    const plan = purchase.plan;
    const planLabel = plan === "early_bird" ? "Early Bird" : "Pro Trader";
    const priceLabel = plan === "early_bird" ? "19,99€ / mois" : "24,99€ / mois";

    // 2. Si pas de subscription ID, retourner les infos minimales
    if (!subscriptionId) {
      return res.status(200).json({
        id: null, status: "active",
        productName: planLabel, variantName: priceLabel,
        renewsAt: null, cancelled: false,
      });
    }

    // 3. Récupérer l'abonnement Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    let sub;
    try {
      sub = await stripe.subscriptions.retrieve(subscriptionId);
    } catch (stripeErr) {
      console.error("Stripe retrieve error:", stripeErr.message);
      return res.status(200).json({
        id: null, status: "active",
        productName: planLabel, variantName: priceLabel,
        renewsAt: null, cancelled: false,
        _debug: stripeErr.message,
      });
    }

    const toIso = ts => (ts && !isNaN(ts)) ? new Date(ts * 1000).toISOString() : null;

    const cpe = sub.current_period_end ?? sub["current_period_end"];
    console.log("current_period_end raw:", cpe, typeof cpe);

    return res.status(200).json({
      id: sub.id,
      status: sub.status,
      productName: planLabel,
      variantName: priceLabel,
      renewsAt: toIso(cpe),
      endsAt: toIso(sub.cancel_at),
      cancelled: sub.cancel_at_period_end,
      _debug_cpe: cpe,
    });
  } catch (e) {
    console.error("subscription-status error:", e.message);
    return res.status(500).json({ error: e.message });
  }
};
