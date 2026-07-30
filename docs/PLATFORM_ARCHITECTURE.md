# EF Assessment Battery — Platform Architecture

Habib Labs LLC. Experimental research platform. Not diagnostic or clinically validated.

## Vision

A research ecosystem with **three user modes** sharing one assessment engine (GMT 2.2, RIT, CFT). Every administration produces identical raw behavioral data; only the surrounding experience, permissions, and reporting change.

| Mode | Audience | Goal |
|------|----------|------|
| **Clinician** | Licensed clinicians | Free clinical use in exchange for de-identified normative data |
| **Research** | Labs, universities, trials | Remote studies, Study IDs, dataset export |
| **Public** | General public | Educational cognitive wellness (non-diagnostic) |

## Phase status

| Phase | Status |
|-------|--------|
| **1 — Shared spine** | In progress (this document) |
| 2 — Clinician Mode | Planned |
| 3 — Research Mode | Planned |
| 4 — Public Mode reports | Planned |
| 5 — Psychometrics / living norms | Planned |
| 6 — Domain expansion | Planned |

Phase 1 ships: auth, RBAC, three-schema data separation, assessment links, de-identifying submit pipeline, audit/consent hooks. It does **not** ship full mode dashboards, clinical PDFs, SPSS exporters, educational narrative reports, or published norms.

## Shared assessment engine

- Battery sequence: GMT → RIT → CFT ([`src/lib/batterySession.ts`](../src/lib/batterySession.ts))
- Scoring engines remain mode-agnostic; themes/copy never change scores
- Linked runs take administration mode from the assessment link (no ModeSelect override)
- Unlinked landing/demo/solo flows remain for local use and public direct entry

See [ADR-002](adr/002-shared-assessment-engine.md).

## Data architecture

One Supabase project, four Postgres schemas:

```text
platform/     identities, roles, links, consent, audit
clinical/     PHI — patients, administrations (clinician-owned)
research/     de-identified behavioral data only
public_data/  anonymous public administrations (schema name avoids Postgres "public")
```

PostgREST must expose `platform`, `clinical`, `research`, and `public_data` (Dashboard → Settings → API → Exposed schemas). API routes set `Accept-Profile` / `Content-Profile` headers.

Physical multi-project isolation is a later compliance option; see [ADR-001](adr/001-three-schema-data-separation.md).

### Write paths

```text
Clinical link submit
  → clinical.administrations (+ task payloads)
  → de-identify
  → research.administrations (no PHI, no clinician/patient FKs)

Research link submit
  → research.administrations only

Public link / public direct (when consented path is used)
  → public_data.administrations
  → research only if research_consent = true (reserved; UI later)
```

### De-identification

Strip: names, emails, MRNs, free-text examiner notes, clinician IDs, patient IDs, IP addresses.

Keep (research): age, sex, education, language, handedness, country, cultural background (as provided), device/timing, raw trials, accuracy, RTs, error patterns, EF indices/validity flags.

## Identity and RBAC

| Role | Auth | Phase 1 access |
|------|------|----------------|
| `clinician` | Email/password | Profile, mint clinical links, research agreement |
| `researcher` | Email/password | Profile, mint research links |
| `admin` | Elevated `app_metadata` | Platform ops |
| Participant / public | Opaque link token | Run battery; submit via token |

Authorization uses `platform.profiles.role` and server-set `app_metadata.role` — never editable `user_metadata`. See [ADR-003](adr/003-hipaa-oriented-controls.md).

## Assessment links

1. Authenticated professional: `POST /api/platform/links`
2. Participant opens `/a/:token`
3. Client validates via `GET /api/platform/links?token=`
4. Session context stored; battery starts with link-derived mode
5. Task submits include the link token → `POST /api/platform/submit`

## Security baseline (HIPAA-oriented)

This codebase aims at controls compatible with a HIPAA program. **Certification and BAAs are organizational responsibilities**, not guaranteed by this repo alone.

- Encryption in transit (TLS via Vercel)
- Encryption at rest (Supabase managed Postgres)
- Role-based access + RLS
- Secure auth (Supabase Auth)
- Audit logs on link create and submit
- Consent event recording
- Automatic de-identification before research writes
- Service role key only on the server

See [ADR-003](adr/003-hipaa-oriented-controls.md).

## API surface (Phase 1)

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `POST /api/platform/profile` | JWT | Create/update profile + set role |
| `POST /api/platform/links` | JWT | Mint assessment link |
| `GET /api/platform/links?token=` | Public | Validate link |
| `POST /api/platform/consent` | Token or JWT | Record consent event |
| `POST /api/platform/submit` | Link token | Schema-routed submit + de-id |

Legacy `api/*-submit.js` routes remain for unlinked/legacy traffic.

## Environment variables

**Client (Vite):** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`

**Vercel server:** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATA_SECRET` (legacy PIN)

## Related ADRs

- [ADR-001: Three-schema data separation](adr/001-three-schema-data-separation.md)
- [ADR-002: Shared assessment engine invariance](adr/002-shared-assessment-engine.md)
- [ADR-003: HIPAA-oriented controls on Vercel + Supabase](adr/003-hipaa-oriented-controls.md)
