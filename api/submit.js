/**
 * Vercel serverless: POST /api/submit
 * Body: JSON submission (participantId, name, age, gender, location, timestamp,
 *       memoryPoints, highestLevelPassed, overallAccuracyPercent, meanReactionTimeMs,
 *       totalIncorrectPlacements, totalWrongShapeUsed, copyScore, copyTimeMs)
 * Inserts one row into Supabase submissions table.
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
    participant_id: body.participantId ?? '',
    name: body.name ?? '',
    age: Number(body.age) || 0,
    gender: body.gender ?? '',
    location: body.education ?? body.location ?? '',
    timestamp: body.timestamp ?? '',
    memory_points: Number(body.memoryPoints) || 0,
    highest_level_passed: Number(body.highestLevelPassed) || 0,
    overall_accuracy_percent: Number(body.overallAccuracyPercent) || 0,
    mean_reaction_time_ms: Number(body.meanReactionTimeMs) || 0,
    total_incorrect_placements: Number(body.totalIncorrectPlacements) || 0,
    total_wrong_shape_used: Number(body.totalWrongShapeUsed) || 0,
    copy_score: Number(body.copyScore) || 0,
    copy_time_ms: Number(body.copyTimeMs) || 0,
  };

  const response = await fetch(`${supabaseUrl}/rest/v1/submissions`, {
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
    console.error('Supabase insert failed', response.status, text);
    return res.status(502).json({ error: 'Failed to save submission' });
  }

  return res.status(200).setHeader('Access-Control-Allow-Origin', '*').json({ ok: true });
}
