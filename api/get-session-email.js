const Stripe = require("stripe");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).end();

  const { session_id } = req.query;
  if (!session_id) return res.status(400).json({ error: "session_id required" });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    const email = session.customer_email || session.customer_details?.email || "";
    return res.status(200).json({ email });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
