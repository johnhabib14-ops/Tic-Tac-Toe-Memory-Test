/**
 * Vercel serverless: POST /api/gmt2-submit
 * Body: JSON (session_id, participant_id, birth_year, gender, education, device_type,
 *       copy_hits, copy_total_rt_ms, copy_target_map, copy_response_map,
 *       memory_trials[], mean_accuracy_per_condition, mean_rt_per_condition,
 *       global_accuracy, global_mean_rt)
 * Inserts one row into Supabase gmt2_submissions table.
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).setHeader('Access-Control-Allow-Origin', '*').json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const row = {
    session_id: body.session_id ?? '',
    participant_id: body.participant_id ?? '',
    birth_year: Number(body.birth_year) || 0,
    gender: body.gender ?? '',
    education: body.education ?? '',
    device_type: body.device_type ?? '',
    copy_hits: Number(body.copy_hits) || 0,
    copy_total_rt_ms: Number(body.copy_total_rt_ms) || 0,
    copy_target_map: Array.isArray(body.copy_target_map) ? body.copy_target_map : [],
    copy_response_map: Array.isArray(body.copy_response_map) ? body.copy_response_map : [],
    memory_trials: Array.isArray(body.memory_trials) ? body.memory_trials : [],
    mean_accuracy_per_condition:
      body.mean_accuracy_per_condition && typeof body.mean_accuracy_per_condition === 'object'
        ? body.mean_accuracy_per_condition
        : {},
    mean_rt_per_condition:
      body.mean_rt_per_condition && typeof body.mean_rt_per_condition === 'object'
        ? body.mean_rt_per_condition
        : {},
    global_accuracy: Number(body.global_accuracy) || 0,
    global_mean_rt: Number(body.global_mean_rt) || 0,
  };

  const response = await fetch(`${supabaseUrl}/rest/v1/gmt2_submissions`, {
    method: 'POST',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(row),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('Supabase gmt2 insert failed', response.status, text);
    return res.status(502).json({ error: 'Failed to save submission' });
  }

  return res.status(200).setHeader('Access-Control-Allow-Origin', '*').json({ ok: true });
}
