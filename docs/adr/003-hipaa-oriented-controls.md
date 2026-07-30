# ADR-003: HIPAA-oriented controls on Vercel + Supabase

## Status

Accepted

## Date

2026-07-30

## Context

Clinician Mode will handle PHI. The product must be designed for HIPAA-compatible controls (or equivalent privacy regimes), without claiming that shipping code alone makes Habib Labs HIPAA-certified.

## Options Considered

### Option A: Build custom auth + self-hosted Postgres

- Pros: Full control
- Cons: Slow; security burden on a small team

### Option B: Stay on Vercel + Supabase with explicit control layer

- Pros: Matches existing stack; managed TLS/at-rest encryption; Auth + RLS; fast Phase 1
- Cons: Requires vendor BAAs and org policies outside the repo

### Option C: Defer all security until Clinician Mode UI

- Pros: Faster spine prototypes
- Cons: Retrofitting auth/de-id is costly and risky

## Decision

We chose **Option B**. Phase 1 implements: Supabase Auth, role tables + server-set `app_metadata`, RLS, assessment-link tokens for participants, service-role-only cross-schema writes, de-identification before research inserts, consent events, and audit logs.

**Out of band (org):** Execute BAAs with subprocessors, access policies, retention schedules, workforce training, and incident response. This repository documents hooks (e.g. `data_retention_policy` fields) but does not replace a compliance program.

## Consequences

- Never put `SUPABASE_SERVICE_ROLE_KEY` in Vite client env
- Never authorize from user-editable `user_metadata`
- Legacy open anon inserts on old `*_submissions` tables are transitional; new platform tables deny anon insert
- README and architecture docs must not claim HIPAA certification
