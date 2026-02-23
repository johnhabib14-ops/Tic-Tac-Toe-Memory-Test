/**
 * Vercel serverless: GET /api/sessions?pin=XXXX
 * If pin matches DATA_SECRET, returns all rows from Supabase submissions table.
 * Otherwise 401.
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    return res.status(204).end();
  }
  if (req.method !== 'GET') {
    return res.status(405).setHeader('Access-Control-Allow-Origin', '*').json({ error: 'Method not allowed' });
  }

  const pin = req.query.pin;
  const secret = process.env.DATA_SECRET;
  if (!secret || pin !== secret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/submissions?order=created_at.desc`, {
    method: 'GET',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('Supabase select failed', response.status, text);
    return res.status(502).json({ error: 'Failed to fetch submissions' });
  }

  const rows = await response.json();

  // Map snake_case to camelCase for frontend
  const sessions = rows.map((r) => ({
    id: r.id,
    createdAt: r.created_at,
    participantId: r.participant_id,
    name: r.name,
    age: r.age,
    gender: r.gender,
    location: r.location,
    timestamp: r.timestamp,
    memoryPoints: r.memory_points,
    highestLevelPassed: r.highest_level_passed,
    overallAccuracyPercent: r.overall_accuracy_percent,
    meanReactionTimeMs: r.mean_reaction_time_ms,
    totalIncorrectPlacements: r.total_incorrect_placements,
    totalWrongShapeUsed: r.total_wrong_shape_used,
    copyScore: r.copy_score,
    copyTimeMs: r.copy_time_ms,
  }));

  return res.status(200).setHeader('Access-Control-Allow-Origin', '*').json(sessions);
}
