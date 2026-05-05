const Stripe = require("stripe");

module.exports.config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = Buffer.alloc(0);
    req.on("data", chunk => { data = Buffer.concat([data, chunk]); });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const rawBody = await getRawBody(req);
  const sig = req.headers["stripe-signature"];
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    console.error("Webhook signature error:", e.message);
    return res.status(400).json({ error: `Webhook Error: ${e.message}` });
  }

  if (event.type !== "checkout.session.completed") {
    return res.status(200).json({ ok: true, skipped: event.type });
  }

  const session = event.data.object;
  const email = (session.customer_email || "").toLowerCase().trim();
  const plan = session.metadata?.plan || "unknown";
  const stripeCustomerId = session.customer || "";
  const stripeSubscriptionId = session.subscription || "";

  if (!email) return res.status(400).json({ error: "No email in session" });

  const SUPA_URL = process.env.SUPABASE_URL || "https://yxvkedyhykhajcivsgal.supabase.co";
  const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

  const resp = await fetch(`${SUPA_URL}/rest/v1/purchases`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPA_KEY,
      Authorization: `Bearer ${SUPA_KEY}`,
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({
      email,
      order_id: stripeSubscriptionId,
      variant_id: stripeCustomerId,
      plan,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    console.error("Supabase insert error:", err);
    return res.status(500).json({ error: "DB error", detail: err });
  }

  return res.status(200).json({ ok: true, email, plan });
};
