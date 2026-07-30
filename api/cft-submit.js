/**
 * Vercel serverless: POST /api/cft-submit
 * Inserts one row into Supabase cft_submissions.
 * Field names align with src/cft/lib/submissionPayload.ts / sessionToFlatRow.
 */

function numOrNull(v) {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function buildRow(body) {
  const session = body.session && typeof body.session === "object" ? body.session : body;
  const trials = Array.isArray(body.trials)
    ? body.trials
    : Array.isArray(session.trials)
      ? session.trials
      : [];
  const demographics = body.demographics ?? session.demographics ?? {};
  const components =
    session.provisionalScore?.components ??
    session.secondaryScores ??
    session.provisional_score?.components ??
    {};
  const blockSummaries = Array.isArray(session.blockSummaries)
    ? session.blockSummaries
    : Array.isArray(session.block_summaries)
      ? session.block_summaries
      : [];
  const byBlock = {};
  for (const b of blockSummaries) {
    if (b && b.blockType) byBlock[b.blockType] = b;
  }
  const validityFlags = Array.isArray(session.validityFlags)
    ? session.validityFlags
    : Array.isArray(session.validity_flags_list)
      ? session.validity_flags_list
      : [];
  const flags = {};
  for (const f of validityFlags) {
    if (f && f.code) flags[f.code] = !!f.triggered;
  }
  const triggered = validityFlags
    .filter((f) => f && f.triggered)
    .map((f) => f.code)
    .join("|");

  const device = session.device ?? {};

  return {
    session_id: String(session.sessionId ?? session.session_id ?? ""),
    anonymous_participant_id: String(
      session.anonymousParticipantId ?? session.anonymous_participant_id ?? ""
    ),
    study_id: String(session.studyId ?? session.study_id ?? ""),
    administration_mode: String(
      session.administrationMode ?? session.administration_mode ?? ""
    ),
    visual_mode: String(session.visualMode ?? session.visual_mode ?? ""),
    task_version: String(session.taskVersion ?? session.task_version ?? ""),
    scoring_version: String(session.scoringVersion ?? session.scoring_version ?? ""),
    study_version: String(session.studyVersion ?? session.study_version ?? ""),
    consent_version: String(session.consentVersion ?? session.consent_version ?? ""),
    randomization_seed: Number(session.randomizationSeed ?? session.randomization_seed) || 0,
    start_time: session.startTime ?? session.start_time ?? null,
    completion_time: session.completionTime ?? session.completion_time ?? null,
    total_duration_ms: numOrNull(session.totalDurationMs ?? session.total_duration_ms),
    device_type: String(device.deviceType ?? session.device_type ?? ""),
    input_method: String(device.inputMethod ?? session.input_method ?? ""),
    practice_repetitions: Number(session.practiceRepetitions ?? session.practice_repetitions) || 0,
    timing_quality: String(session.timingQuality ?? session.timing_quality ?? ""),
    completion_status: String(session.completionStatus ?? session.completion_status ?? ""),
    provisional_cfs: numOrNull(
      session.provisionalScore?.cognitiveFlexibilityScore ?? session.provisional_cfs
    ),
    switch_accuracy: numOrNull(components.switchAccuracy ?? session.switch_accuracy),
    stay_accuracy: numOrNull(components.stayAccuracy ?? session.stay_accuracy),
    switch_cost_rt_ms: numOrNull(components.switchCostRtMs ?? session.switch_cost_rt_ms),
    switch_cost_accuracy: numOrNull(
      components.switchCostAccuracy ?? session.switch_cost_accuracy
    ),
    perseverative_error_rate: numOrNull(
      components.perseverativeErrorRate ?? session.perseverative_error_rate
    ),
    rule_maintenance_error_rate: numOrNull(
      components.ruleMaintenanceErrorRate ?? session.rule_maintenance_error_rate
    ),
    cue_processing_error_rate: numOrNull(
      components.cueProcessingErrorRate ?? session.cue_processing_error_rate
    ),
    conflict_accuracy: numOrNull(components.conflictAccuracy ?? session.conflict_accuracy),
    omission_error_rate: numOrNull(components.omissionErrorRate ?? session.omission_error_rate),
    mean_correct_rt_ms: numOrNull(components.meanCorrectRtMs ?? session.mean_correct_rt_ms),
    median_correct_rt_ms: numOrNull(components.medianCorrectRtMs ?? session.median_correct_rt_ms),
    rt_sd_ms: numOrNull(components.rtSdMs ?? session.rt_sd_ms),
    rt_cv: numOrNull(components.rtCv ?? session.rt_cv),
    anticipatory_count: Number(components.anticipatoryCount ?? session.anticipatory_count) || 0,
    post_error_recovery: numOrNull(components.postErrorRecovery ?? session.post_error_recovery),
    high_interference_accuracy: numOrNull(
      components.highInterferenceAccuracy ?? session.high_interference_accuracy
    ),
    accuracy_practice: byBlock.practice?.accuracy ?? null,
    mean_rt_practice: byBlock.practice?.meanCorrectRtMs ?? null,
    accuracy_rule_learning: byBlock.rule_learning?.accuracy ?? null,
    mean_rt_rule_learning: byBlock.rule_learning?.meanCorrectRtMs ?? null,
    accuracy_predictable_switch: byBlock.predictable_switch?.accuracy ?? null,
    mean_rt_predictable_switch: byBlock.predictable_switch?.meanCorrectRtMs ?? null,
    accuracy_cued_switch: byBlock.cued_switch?.accuracy ?? null,
    mean_rt_cued_switch: byBlock.cued_switch?.meanCorrectRtMs ?? null,
    accuracy_interference: byBlock.interference?.accuracy ?? null,
    mean_rt_interference: byBlock.interference?.meanCorrectRtMs ?? null,
    validity_flags: triggered || String(session.validity_flags ?? ""),
    flag_excessive_omissions: !!flags.excessive_omissions,
    flag_chance_accuracy: !!flags.chance_accuracy,
    flag_extremely_rapid: !!flags.extremely_rapid,
    flag_repeated_anticipatory: !!flags.repeated_anticipatory,
    flag_excessive_focus_loss: !!flags.excessive_focus_loss,
    flag_incomplete_session: !!flags.incomplete_session,
    flag_abnormal_timing: !!flags.abnormal_timing,
    flag_unsupported_device: !!flags.unsupported_device,
    flag_repeated_response_pattern: !!flags.repeated_response_pattern,
    flag_practice_failed: !!flags.practice_failed,
    flag_rule_not_understood: !!flags.rule_not_understood,
    flag_excessive_perseveration: !!flags.excessive_perseveration,
    trials,
    demographics,
    examiner_notes: session.examinerNotes ?? session.examiner_notes ?? null,
    data_retention_policy: String(
      session.dataRetentionPolicy ?? session.data_retention_policy ?? ""
    ),
    submitted_at: body.submitted_at ?? new Date().toISOString(),
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    return res
      .status(405)
      .setHeader("Access-Control-Allow-Origin", "*")
      .json({ error: "Method not allowed" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return res
      .status(500)
      .setHeader("Access-Control-Allow-Origin", "*")
      .json({ error: "Server misconfiguration" });
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return res
      .status(400)
      .setHeader("Access-Control-Allow-Origin", "*")
      .json({ error: "Invalid JSON" });
  }

  const row = buildRow(body || {});
  const sessionId = row.session_id;
  if (!sessionId) {
    return res
      .status(400)
      .setHeader("Access-Control-Allow-Origin", "*")
      .json({ error: "session_id required" });
  }

  const checkRes = await fetch(
    `${supabaseUrl}/rest/v1/cft_submissions?session_id=eq.${encodeURIComponent(sessionId)}&select=session_id`,
    { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
  );
  if (checkRes.ok) {
    const existing = await checkRes.json();
    if (Array.isArray(existing) && existing.length > 0) {
      return res
        .status(409)
        .setHeader("Access-Control-Allow-Origin", "*")
        .json({ error: "Duplicate submission", code: "CONFLICT" });
    }
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/cft_submissions`, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(row),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Supabase cft insert failed", response.status, text);
    let detail = "";
    try {
      const parsed = text ? JSON.parse(text) : null;
      const msg =
        parsed?.message ?? parsed?.error_description ?? (typeof text === "string" ? text : "");
      detail = String(msg).slice(0, 200).replace(/\s+/g, " ").trim();
    } catch {
      if (text && typeof text === "string") detail = text.slice(0, 200).replace(/\s+/g, " ").trim();
    }
    return res
      .status(502)
      .setHeader("Access-Control-Allow-Origin", "*")
      .json({ error: "Failed to save submission", detail: detail || undefined });
  }

  return res.status(200).setHeader("Access-Control-Allow-Origin", "*").json({ ok: true });
}
