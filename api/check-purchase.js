module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();

  const email = (req.query.email || '').toLowerCase().trim();
  if (!email) return res.status(400).json({ authorized: false });

  const SUPA_URL = process.env.SUPABASE_URL || 'https://yxvkedyhykhajcivsgal.supabase.co';
  const SUPA_KEY = process.env.SUPABASE_ANON_KEY
    || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4dmtlZHloeWtoYWpjaXZzZ2FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4OTE3NzksImV4cCI6MjA5MjQ2Nzc3OX0.5KghDy_LrBJzGpxJIca6OzQL_h1NLh7L284BR4Sgeus';

  const resp = await fetch(
    `${SUPA_URL}/rest/v1/purchases?select=id&email=eq.${encodeURIComponent(email)}&active=eq.true&limit=1`,
    { headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` } }
  );

  if (!resp.ok) return res.status(500).json({ authorized: false });
  const data = await resp.json();
  return res.status(200).json({ authorized: Array.isArray(data) && data.length > 0 });
};
