const crypto = require('crypto');

module.exports.config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => (data += chunk));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Signature, X-Event-Name');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const rawBody = await getRawBody(req);

  // Verify Lemon Squeezy HMAC signature
  const secret = process.env.LS_WEBHOOK_SECRET;
  const sig = req.headers['x-signature'];
  if (secret && sig) {
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    if (sig !== expected) return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = req.headers['x-event-name'];
  if (event !== 'order_created') return res.status(200).json({ ok: true, skipped: event });

  let body;
  try { body = JSON.parse(rawBody); } catch { return res.status(400).json({ error: 'Invalid JSON' }); }

  const attrs   = body?.data?.attributes;
  const email   = (attrs?.user_email || '').toLowerCase().trim();
  const orderId = String(body?.data?.id || '');
  const variantId = String(attrs?.first_order_item?.variant_id || '');
  const plan = variantId === '1600495' ? 'early_bird' : variantId === '1600608' ? 'pro' : 'unknown';

  if (!email) return res.status(400).json({ error: 'No email in payload' });

  const SUPA_URL = process.env.SUPABASE_URL || 'https://yxvkedyhykhajcivsgal.supabase.co';
  const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
    || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4dmtlZHloeWtoYWpjaXZzZ2FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4OTE3NzksImV4cCI6MjA5MjQ2Nzc3OX0.5KghDy_LrBJzGpxJIca6OzQL_h1NLh7L284BR4Sgeus';

  const resp = await fetch(`${SUPA_URL}/rest/v1/purchases`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPA_KEY,
      'Authorization': `Bearer ${SUPA_KEY}`,
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify({ email, order_id: orderId, variant_id: variantId, plan }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    console.error('Supabase insert error:', err);
    return res.status(500).json({ error: 'DB error', detail: err });
  }

  return res.status(200).json({ ok: true, email, plan });
};
