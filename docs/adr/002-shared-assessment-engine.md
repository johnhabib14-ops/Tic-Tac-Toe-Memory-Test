# ADR-002: Shared assessment engine invariance

## Status

Accepted

## Date

2026-07-30

## Context

Clinician, research, and public modes need different UX, permissions, and reports. If each mode forked its own task protocol or scoring, normative data would fragment and mode-specific bias would enter the corpus.

## Options Considered

### Option A: Separate batteries per mode

- Pros: Faster mode-specific UX tweaks
- Cons: Incomparable data; duplicate maintenance; invalidates the “living norms” vision

### Option B: One engine; mode wraps entry, copy, and storage routing only

- Pros: Identical raw behavioral data; single psychometrics pipeline; themes already proven not to affect scores
- Cons: Mode UX must not sneak protocol changes into engines

### Option C: Shared engines with mode-specific optional blocks

- Pros: Flexible
- Cons: Optional blocks become de-facto forks unless carefully gated

## Decision

We chose **Option B**. GMT 2.2, RIT, and CFT engines stay mode-agnostic. Mode affects assessment-link claims, surrounding copy (later phases), report language, and which database schema receives identifiable vs de-identified rows.

## Consequences

- Linked administrations take mode from the link; ModeSelect is skipped for linked runs
- Visual themes remain copy/CSS only
- No combined EF composite score until a separate psychometric ADR
- Protocol freezes (e.g. GMT 2.2) apply equally to all modes
