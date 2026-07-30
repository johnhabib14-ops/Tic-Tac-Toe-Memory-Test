/**
 * POST /api/platform/submit
 * Token-gated submit: routes to clinical / research / public_data + de-id.
 */
import { createHash } from 'node:crypto';
import {
  handleOptions,
  parseBody,
  sendJson,
  supabaseRest,
  writeAuditLog,
  clientIp,
  clientUa,
} from '../_lib/supabase.js';
import {
  toResearchRow,
  toPublicRow,
  findPhiLeaks,
  CONSENT_VERSION,
} from '../_lib/deidentify.js';

function isLinkUsable(link) {
  if (!link) return false;
  if (link.revoked_at) return false;
  if (link.expires_at && new Date(link.expires_at).getTime() < Date.now()) return false;
  if (link.max_uses != null && link.use_count >= link.max_uses) return false;
  return true;
}

function extractSessionFields(body) {
  const session = body.session && typeof body.session === 'object' ? body.session : body;
  const task = String(body.task || session.task || '').toLowerCase();
  const sessionId = String(
    session.sessionId || session.session_id || body.session_id || body.sessionId || ''
  );
  const demographics =
    body.demographics ?? session.demographics ?? {};
  const trials = Array.isArray(body.trials)
    ? body.trials
    : Array.isArray(session.trials)
      ? session.trials
      : [];
  const device = session.device || body.device || {};
  const scores =
    body.scores ||
    session.provisionalScore ||
    session.provisional_score ||
    session.summary ||
    {};
  const validity = {
    flags: session.validityFlags || session.validity_flags_list || body.validityFlags || [],
    timingQuality: session.timingQuality || session.timing_quality || '',
    completionStatus: session.completionStatus || session.completion_status || '',
  };
  const timing = {
    startTime: session.startTime || session.start_time || null,
    completionTime: session.completionTime || session.completion_time || null,
    totalDurationMs: session.totalDurationMs || session.total_duration_ms || null,
  };

  return {
    task: task || 'unknown',
    sessionId,
    anonymousParticipantId: String(
      session.anonymousParticipantId || session.anonymous_participant_id || ''
    ),
    studyCode: String(
      body.studyCode ||
        session.studyId ||
        session.study_id ||
        (body.metadata && body.metadata.studyCode) ||
        ''
    ),
    batterySessionId: String(
      body.batterySessionId || session.batterySessionId || session.battery_session_id || ''
    ),
    taskVersion: String(session.taskVersion || session.task_version || ''),
    scoringVersion: String(session.scoringVersion || session.scoring_version || ''),
    consentVersion: String(body.consentVersion || CONSENT_VERSION),
    demographics,
    device,
    timing,
    scores,
    validity,
    trials,
    examinerNotes: String(session.examinerNotes || session.examiner_notes || body.examinerNotes || ''),
    rawPayload: body,
    researchConsent: Boolean(body.researchConsent),
    dataRetentionPolicy: String(
      session.dataRetentionPolicy || session.data_retention_policy || ''
    ),
  };
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const body = parseBody(req);
  if (body == null) return sendJson(res, 400, { error: 'Invalid JSON' });

  const token = String(body.token || body.linkToken || '').trim();
  if (!token) {
    return sendJson(res, 401, { error: 'Assessment link token required', code: 'TOKEN_REQUIRED' });
  }

  const linkRes = await supabaseRest({
    schema: 'platform',
    path: `assessment_links?token=eq.${encodeURIComponent(token)}&select=*`,
    method: 'GET',
    prefer: null,
  });
  const link = Array.isArray(linkRes.data) ? linkRes.data[0] : null;
  if (!link || !isLinkUsable(link)) {
    return sendJson(res, 404, { error: 'Invalid or expired link', code: 'LINK_INVALID' });
  }

  const fields = extractSessionFields(body);
  if (!fields.sessionId) {
    return sendJson(res, 400, { error: 'session_id required' });
  }

  const tokenHash = createHash('sha256').update(token).digest('hex');
  const meta = link.metadata && typeof link.metadata === 'object' ? link.metadata : {};
  if (!fields.studyCode && meta.studyCode) fields.studyCode = String(meta.studyCode);
  if (!fields.batterySessionId && meta.batterySessionId) {
    fields.batterySessionId = String(meta.batterySessionId);
  }

  const researchInput = {
    sourceMode: link.mode,
    task: fields.task,
    sessionId: fields.sessionId,
    anonymousParticipantId: fields.anonymousParticipantId,
    studyCode: fields.studyCode,
    batterySessionId: fields.batterySessionId,
    taskVersion: fields.taskVersion,
    scoringVersion: fields.scoringVersion,
    consentVersion: fields.consentVersion,
    demographics: fields.demographics,
    device: fields.device,
    timing: fields.timing,
    scores: fields.scores,
    validity: fields.validity,
    trials: fields.trials,
    dataRetentionPolicy: fields.dataRetentionPolicy,
    linkTokenHash: tokenHash,
    researchConsent: fields.researchConsent,
  };

  const researchRow = toResearchRow(researchInput);
  const leaks = findPhiLeaks(researchRow);
  if (leaks.length) {
    console.error('PHI leak blocked', leaks);
    return sendJson(res, 500, { error: 'De-identification failed', code: 'PHI_LEAK' });
  }

  // Duplicate check across research by session_id when applicable
  if (link.mode === 'clinical') {
    const patientId = meta.patientId || meta.patient_id || null;
    const clinicalRow = {
      patient_id: patientId,
      clinician_user_id: link.owner_user_id,
      link_id: link.id,
      battery_session_id: fields.batterySessionId,
      task: fields.task,
      session_id: fields.sessionId,
      status: 'completed',
      demographics: fields.demographics,
      scores: fields.scores,
      trials: fields.trials,
      device: fields.device,
      validity: fields.validity,
      examiner_notes: fields.examinerNotes,
      raw_payload: fields.rawPayload,
      completed_at: new Date().toISOString(),
    };

    const clinicalInsert = await supabaseRest({
      schema: 'clinical',
      path: 'administrations',
      method: 'POST',
      prefer: 'return=minimal',
      body: clinicalRow,
    });
    if (!clinicalInsert.ok) {
      console.error('clinical insert failed', clinicalInsert.status, clinicalInsert.text);
      return sendJson(res, 502, {
        error: 'Failed to save clinical administration',
        detail: String(clinicalInsert.text).slice(0, 200),
      });
    }

    const researchInsert = await supabaseRest({
      schema: 'research',
      path: 'administrations',
      method: 'POST',
      prefer: 'return=minimal',
      body: researchRow,
    });
    if (!researchInsert.ok && researchInsert.status !== 409) {
      // Unique violation → already contributed
      const isConflict =
        researchInsert.status === 409 ||
        String(researchInsert.text).includes('duplicate') ||
        String(researchInsert.text).includes('unique');
      if (!isConflict) {
        console.error('research insert failed', researchInsert.status, researchInsert.text);
        return sendJson(res, 502, {
          error: 'Failed to save research administration',
          detail: String(researchInsert.text).slice(0, 200),
        });
      }
    }
  } else if (link.mode === 'research') {
    const researchInsert = await supabaseRest({
      schema: 'research',
      path: 'administrations',
      method: 'POST',
      prefer: 'return=minimal',
      body: researchRow,
    });
    if (!researchInsert.ok) {
      const isConflict =
        researchInsert.status === 409 ||
        String(researchInsert.text).includes('duplicate') ||
        String(researchInsert.text).includes('unique');
      if (isConflict) {
        return sendJson(res, 409, { error: 'Duplicate submission', code: 'CONFLICT' });
      }
      console.error('research insert failed', researchInsert.status, researchInsert.text);
      return sendJson(res, 502, {
        error: 'Failed to save research administration',
        detail: String(researchInsert.text).slice(0, 200),
      });
    }
  } else {
    // public
    const publicRow = toPublicRow(researchInput);
    const publicInsert = await supabaseRest({
      schema: 'public_data',
      path: 'administrations',
      method: 'POST',
      prefer: 'return=minimal',
      body: publicRow,
    });
    if (!publicInsert.ok) {
      const isConflict =
        publicInsert.status === 409 ||
        String(publicInsert.text).includes('duplicate') ||
        String(publicInsert.text).includes('unique');
      if (isConflict) {
        return sendJson(res, 409, { error: 'Duplicate submission', code: 'CONFLICT' });
      }
      console.error('public insert failed', publicInsert.status, publicInsert.text);
      return sendJson(res, 502, {
        error: 'Failed to save public administration',
        detail: String(publicInsert.text).slice(0, 200),
      });
    }

    if (fields.researchConsent) {
      await supabaseRest({
        schema: 'research',
        path: 'administrations',
        method: 'POST',
        prefer: 'return=minimal',
        body: researchRow,
      });
    }
  }

  // Increment use_count (best-effort)
  await supabaseRest({
    schema: 'platform',
    path: `assessment_links?id=eq.${link.id}`,
    method: 'PATCH',
    prefer: 'return=minimal',
    body: { use_count: (link.use_count || 0) + 1 },
  });

  await writeAuditLog({
    actorUserId: link.owner_user_id,
    action: 'administration.submit',
    resourceType: 'administration',
    resourceId: fields.sessionId,
    ip: clientIp(req),
    userAgent: clientUa(req),
    metadata: { mode: link.mode, task: fields.task, linkId: link.id },
  });

  return sendJson(res, 200, { ok: true, mode: link.mode, sessionId: fields.sessionId });
}
