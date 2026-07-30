/**
 * Assessment link context for linked administrations (Phase 1 spine).
 * Stored in sessionStorage so battery/task routes can read mode + token.
 */

const LINK_KEY = 'ef_assessment_link_v1';

export type LinkAdministrationMode = 'clinical' | 'research' | 'public';

/** Maps platform link mode → RIT/CFT AdministrationMode */
export type EngineAdministrationMode =
  | 'supervised_clinical'
  | 'research'
  | 'public';

export interface AssessmentLinkContext {
  token: string;
  linkId: string;
  mode: LinkAdministrationMode;
  metadata: Record<string, unknown>;
  startedAt: string;
}

export function linkModeToEngineMode(
  mode: LinkAdministrationMode
): EngineAdministrationMode {
  if (mode === 'clinical') return 'supervised_clinical';
  if (mode === 'research') return 'research';
  return 'public';
}

export function setAssessmentLinkContext(ctx: AssessmentLinkContext): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(LINK_KEY, JSON.stringify(ctx));
}

export function clearAssessmentLinkContext(): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(LINK_KEY);
}

export function readAssessmentLinkContext(): AssessmentLinkContext | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(LINK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AssessmentLinkContext;
    if (!parsed?.token || !parsed?.mode) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getAssessmentLinkToken(): string | null {
  return readAssessmentLinkContext()?.token ?? null;
}

export function isLinkedAdministration(): boolean {
  return readAssessmentLinkContext() != null;
}
