module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).end();

  const email = (req.query.email || "").toLowerCase().trim();
  if (!email) return res.status(400).json({ error: "email required" });

  const LS_KEY   = process.env.LS_API_KEY;
  const SUPA_URL = process.env.SUPABASE_URL || "https://yxvkedyhykhajcivsgal.supabase.co";
  const SUPA_KEY = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4dmtlZHloeWtoYWpjaXZzZ2FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4OTE3NzksImV4cCI6MjA5MjQ2Nzc3OX0.5KghDy_LrBJzGpxJIca6OzQL_h1NLh7L284BR4Sgeus";

  try {
    // 1. Get order_id from Supabase
    const dbRes = await fetch(
      `${SUPA_URL}/rest/v1/purchases?select=order_id,plan&email=eq.${encodeURIComponent(email)}&limit=1`,
      { headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` } }
    );
    const dbData = await dbRes.json();
    const purchase = Array.isArray(dbData) && dbData[0];
    if (!purchase) return res.status(404).json({ error: "no subscription" });

    // 2. If no LS key, return minimal info from DB
    if (!LS_KEY) {
      return res.status(200).json({
        id: null,
        status: "active",
        productName: purchase.plan === "early_bird" ? "Early Bird" : "Pro Trader",
        variantName: purchase.plan === "early_bird" ? "19,99€ / mois" : "24,99€ / mois",
        renewsAt: null,
        cancelled: false,
        noLsKey: true,
      });
    }

    // 3. Find subscription in Lemon Squeezy by order_id
    const lsRes = await fetch(
      `https://api.lemonsqueezy.com/v1/subscriptions?filter[order_id]=${purchase.order_id}`,
      { headers: { Authorization: `Bearer ${LS_KEY}`, Accept: "application/vnd.api+json" } }
    );

    if (!lsRes.ok) {
      const errText = await lsRes.text();
      console.error("LS error:", lsRes.status, errText);
      // Fallback to DB data
      return res.status(200).json({
        id: null,
        status: "active",
        productName: purchase.plan === "early_bird" ? "Early Bird" : "Pro Trader",
        variantName: purchase.plan === "early_bird" ? "19,99€ / mois" : "24,99€ / mois",
        renewsAt: null,
        cancelled: false,
        lsError: true,
      });
    }

    const lsData = await lsRes.json();
    const sub = lsData.data?.[0];

    if (!sub) {
      // No subscription object yet, return DB data
      return res.status(200).json({
        id: null,
        status: "active",
        productName: purchase.plan === "early_bird" ? "Early Bird" : "Pro Trader",
        variantName: purchase.plan === "early_bird" ? "19,99€ / mois" : "24,99€ / mois",
        renewsAt: null,
        cancelled: false,
      });
    }

    const a = sub.attributes;
    return res.status(200).json({
      id: sub.id,
      status: a.status,
      productName: a.product_name || (purchase.plan === "early_bird" ? "Early Bird" : "Pro Trader"),
      variantName: a.variant_name || "",
      renewsAt: a.renews_at,
      endsAt: a.ends_at,
      cancelled: a.cancelled,
    });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
