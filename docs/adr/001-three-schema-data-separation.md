# ADR-001: Three-schema data separation

## Status

Accepted

## Date

2026-07-30

## Context

The platform must serve clinicians (PHI), researchers (de-identified datasets), and the public (anonymous wellness runs) while contributing to a growing normative research corpus. Identifiable clinical data must never mix with research exports. Public data must stay separate from clinician-collected norms unless the user explicitly consents to research participation.

## Options Considered

### Option A: Three physical Supabase projects

- Pros: Strong isolation, clearer BAA boundaries
- Cons: Cross-project ETL complexity, higher ops cost for Phase 1

### Option B: One project, three Postgres schemas (+ platform)

- Pros: Transactional de-id writes, one migration story, RLS + schema grants, fits current Vercel APIs
- Cons: Shared infra blast radius; requires exposing schemas in PostgREST

### Option C: Single `public` schema with table prefixes only

- Pros: Default PostgREST exposure
- Cons: Weaker mental model; easier accidental joins across trust boundaries

## Decision

We chose **Option B**: schemas `platform`, `clinical`, `research`, and `public_data` (Public database; avoids colliding with Postgres `public`) in one Supabase project. Document a later move to Option A if compliance requires physical isolation.

## Consequences

- API routes must set PostgREST profile headers when reading/writing non-`public` schemas
- Operators must add schemas to Supabase “Exposed schemas”
- De-identification runs in the API (service role) before any research insert
- No foreign keys from `research` back to `clinical` patients or clinicians
