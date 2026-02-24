/**
 * Vercel serverless: POST /api/gmt22-submit
 * GMT 2 submissions. Inserts one row into Supabase gmt22_submissions table.
 * Accepts new payload shape: summary.by_condition, practice_failed, practice_trials.
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

  const summary = body.summary && typeof body.summary === 'object' ? body.summary : null;
  let acc, rt, comm, clean, spanConsistency = {};
  let globalAccuracy, globalMeanRt, globalCleanTrialRate;

  if (summary && summary.by_condition) {
    acc = {};
    rt = {};
    comm = {};
    clean = {};
    spanConsistency = {};
    for (const [c, s] of Object.entries(summary.by_condition)) {
      if (s && typeof s.mean_accuracy === 'number') acc[c] = s.mean_accuracy;
      if (s && typeof s.mean_rt_ms === 'number') rt[c] = s.mean_rt_ms / 1000;
      if (s && typeof s.total_commissions === 'number') comm[c] = s.total_commissions;
      clean[c] = 0;
      spanConsistency[c] = !!(s && s.span_consistency_flag === true);
    }
    globalAccuracy = Number(summary.global_accuracy) || 0;
    globalMeanRt = Number(summary.global_mean_rt_ms) != null ? Number(summary.global_mean_rt_ms) / 1000 : 0;
    globalCleanTrialRate = 0;
  } else {
    acc = body.mean_accuracy_per_condition && typeof body.mean_accuracy_per_condition === 'object' ? body.mean_accuracy_per_condition : {};
    rt = body.mean_rt_per_condition && typeof body.mean_rt_per_condition === 'object' ? body.mean_rt_per_condition : {};
    comm = body.total_commissions_per_condition && typeof body.total_commissions_per_condition === 'object' ? body.total_commissions_per_condition : {};
    clean = body.clean_trial_rate_per_condition && typeof body.clean_trial_rate_per_condition === 'object' ? body.clean_trial_rate_per_condition : {};
    spanConsistency = {};
    globalAccuracy = Number(body.global_accuracy) || 0;
    globalMeanRt = Number(body.global_mean_rt) || 0;
    globalCleanTrialRate = Number(body.global_clean_trial_rate) || 0;
  }

  const practiceFailed = typeof body.practice_failed === 'boolean' ? body.practice_failed : (summary && typeof summary.practice_failed === 'boolean' ? summary.practice_failed : false);
  const practicePassedFirstTry = typeof body.practice_passed_first_try === 'boolean' ? body.practice_passed_first_try : (summary && typeof summary.practice_passed_first_try === 'boolean' ? summary.practice_passed_first_try : false);

  const attentionCheckFailed = typeof body.attention_check_failed === 'boolean' ? body.attention_check_failed : (summary && typeof summary.attention_check_failed === 'boolean' ? summary.attention_check_failed : false);
  const pairingFallbackUsed = typeof body.pairing_fallback_used === 'boolean' ? body.pairing_fallback_used : (summary && typeof summary.pairing_fallback_used === 'boolean' ? summary.pairing_fallback_used : false);

  const row = {
    session_id: body.session_id ?? '',
    participant_id: body.participant_id ?? '',
    birth_year: Number(body.birth_year) || 0,
    age: Number(body.age) || 0,
    gender: body.gender ?? '',
    education: body.education ?? '',
    device_type: body.device_type ?? '',
    condition_order: String(body.condition_order ?? ''),
    practice_failed: practiceFailed,
    practice_passed_first_try: practicePassedFirstTry,
    copy_item_id: String(body.copy_item_id ?? ''),
    copy_hits: Number(body.copy_hits) || 0,
    copy_total_rt_ms: Number(body.copy_total_rt_ms) || 0,
    copy_rt_sec: Number(body.copy_total_rt_ms) ? Number(body.copy_total_rt_ms) / 1000 : 0,
    copy_target_map: Array.isArray(body.copy_target_map) ? body.copy_target_map : [],
    copy_response_map: Array.isArray(body.copy_response_map) ? body.copy_response_map : [],
    memory_trials: Array.isArray(body.memory_trials) ? body.memory_trials : [],
    mean_accuracy_per_condition: acc,
    mean_rt_per_condition: rt,
    total_commissions_per_condition: comm,
    clean_trial_rate_per_condition: clean,
    global_accuracy: globalAccuracy,
    global_mean_rt: globalMeanRt,
    global_clean_trial_rate: globalCleanTrialRate,
    mean_accuracy_baseline: Number(acc.baseline) || 0,
    mean_accuracy_ignore_distractor: Number(acc.ignore_distractor) || 0,
    mean_accuracy_remember_distractor: Number(acc.remember_distractor) || 0,
    mean_accuracy_delay: Number(acc.delay) || 0,
    mean_rt_baseline: Number(rt.baseline) || 0,
    mean_rt_ignore_distractor: Number(rt.ignore_distractor) || 0,
    mean_rt_remember_distractor: Number(rt.remember_distractor) || 0,
    mean_rt_delay: Number(rt.delay) || 0,
    total_commissions_baseline: Number(comm.baseline) || 0,
    total_commissions_ignore_distractor: Number(comm.ignore_distractor) || 0,
    total_commissions_remember_distractor: Number(comm.remember_distractor) || 0,
    total_commissions_delay: Number(comm.delay) || 0,
    clean_trial_rate_baseline: Number(clean.baseline) || 0,
    clean_trial_rate_ignore_distractor: Number(clean.ignore_distractor) || 0,
    clean_trial_rate_remember_distractor: Number(clean.remember_distractor) || 0,
    clean_trial_rate_delay: Number(clean.delay) || 0,
    span_consistency_flag_baseline: !!spanConsistency.baseline,
    span_consistency_flag_ignore_distractor: !!spanConsistency.ignore_distractor,
    span_consistency_flag_remember_distractor: !!spanConsistency.remember_distractor,
    span_consistency_flag_delay: !!spanConsistency.delay,
    attention_check_failed: attentionCheckFailed,
    pairing_fallback_used: pairingFallbackUsed,
  };

  const response = await fetch(`${supabaseUrl}/rest/v1/gmt22_submissions`, {
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
    console.error('Supabase gmt22 insert failed', response.status, text);
    let detail = '';
    try {
      const parsed = text ? JSON.parse(text) : null;
      const msg = parsed?.message ?? parsed?.error_description ?? (typeof text === 'string' ? text : '');
      detail = String(msg).slice(0, 200).replace(/\s+/g, ' ').trim();
    } catch {
      if (text && typeof text === 'string') detail = text.slice(0, 200).replace(/\s+/g, ' ').trim();
    }
    return res.status(502).setHeader('Access-Control-Allow-Origin', '*').json({ error: 'Failed to save submission', detail: detail || undefined });
  }

  return res.status(200).setHeader('Access-Control-Allow-Origin', '*').json({ ok: true });
}
