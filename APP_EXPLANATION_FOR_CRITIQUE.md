# Full App Explanation for Critique (Grid Memory Test)

This document describes the **Tic-Tac-Toe Memory Test** web application in enough detail for an external reviewer (e.g. ChatGPT) to critique its design, implementation, and research validity. The app exists in two versions: **GMT 1.0** (original) and **GMT 2.1** (streamlined research version). The explanation focuses on GMT 2.1 as the primary research protocol; GMT 1.0 is summarized for context.

---

## 1. Purpose and Research Context

- **Goal:** Measure **visual spatial working memory** via grid reconstruction.
- **Task:** Participants see 4×4 grids with symbols (X, O, and sometimes a distractor “Plus”), then reconstruct the layout by placing symbols from a palette into an empty grid.
- **Output:** One submission per participant (demographics, copy task, memory trials, summary stats) stored in a database (Supabase) or sent to Google Sheets/Form when no API is configured.

---

## 2. Tech Stack and Deployment

- **Frontend:** React 18, Vite, TypeScript, React Router 6.
- **No backend in repo:** Data is in-memory until submission. Submission is sent to:
  - **Option A:** Vercel serverless API → Supabase (recommended for research).
  - **Option B:** Google Apps Script → Google Sheet (if `VITE_API_URL` is not set).
  - **Option C:** Pre-filled Google Form (fallback).
- **Env:** `VITE_API_URL` (app URL for API calls, required for Supabase save), `VITE_BASE_PATH` (e.g. `/` on Vercel, `/Tic-Tac-Toe-Memory-Test/` on GitHub Pages), `SUPABASE_URL`, `SUPABASE_ANON_KEY` on Vercel for the API.
- **Routing:** Single-page app. GMT 2.1 lives at `/gmt2`; GMT 1.0 uses `/`, `/demographics`, `/intro`, `/copy`, `/test`, `/results`, etc.

---

## 3. Two Versions: GMT 1.0 vs GMT 2.1

| Aspect | GMT 1.0 | GMT 2.1 |
|--------|---------|---------|
| **Entry** | Landing → Demographics → Intro → Copy instructions → Practice → Test → Copy → Results | Single route `/gmt2`: Consent → Demographics → Copy → Memory → Results |
| **Memory task** | Levels 1–10, 2 trials per level; advance on 100% correct; discontinue after 3 imperfect in a row; 2 min/trial | Fixed 16 trials: 4 conditions × 4 spans (2,3,4,5); no discontinue rule; time limit per trial by span |
| **Conditions** | Difficulty via display time, delay, distractors, decoys | Four named conditions: baseline, ignore_distractor, remember_distractor, delay |
| **Data** | Stored in `submissions` (Supabase) or Google Form/Sheet | Stored in `gmt2_submissions` (Supabase) via `/api/gmt2-submit` |
| **Demographics** | Name, age, gender, location (education) | Participant ID, birth year, gender (with “Self describe” text), education 10–20 years, device type |

The rest of this document details **GMT 2.1** unless noted.

---

## 4. GMT 2.1 User Flow (High Level)

1. **Consent** – Short description and “I agree, continue.”
2. **Demographics** – Participant ID, birth year, gender (including “Self describe” with free text), years of education (10–20), device type. All required.
3. **Copy task** – One fixed 4×4 reference grid (6 targets: 3 X, 3 O); participant has 30 s to copy it into an empty grid; Submit or auto-submit on timeout.
4. **Memory task** – 16 trials in fixed order (see below). Each trial: encoding → optional delay fixation → reconstruction with countdown; Submit or auto-record on timeout.
5. **Results** – Copy score and time; mean accuracy and mean RT per condition; overall accuracy; participant ID; “Submit results” button (if backend configured).

---

## 5. State and Architecture (GMT 2.1)

- **State:** React Context (`GMT2State`) holds: `phase`, `participant`, `copyResult`, `memoryTrials`, and setters (`setPhase`, `setParticipant`, `setCopyResult`, `addMemoryTrial`, etc.). No global store; phase drives which page component renders.
- **Shell:** `GMT2Shell` wraps content in `GMT2StateProvider` and renders one of: `GMT2Consent`, `GMT2Demographics`, `GMT2Copy`, `GMT2Memory`, `GMT2Results` based on `phase`.
- **Types:** Central in `src/gmt2/types.ts`: participant, copy result, memory trial record (condition, span, target/response maps, RT, hits, commissions, accuracy, timeout), summary (mean accuracy/RT per condition, global accuracy/RT), grid maps (16-cell arrays), item bank entry (target_map, distractor_map).

---

## 6. Demographics (GMT 2.1)

- **Participant ID:** Free text, required (e.g. study ID).
- **Birth year:** Number, validated between (current year − 90) and (current year − 10).
- **Gender:** Select: Male, Female, Nonbinary, Prefer not to say, Self describe. If “Self describe,” a required text field appears; stored as `"Self describe: <text>"` or `"Self describe"` if empty.
- **Education:** Dropdown 10–20 years (single value per option).
- **Device type:** Desktop, Tablet, Phone, Other, Prefer not to say.
- **Session:** On submit, a `session_id` is generated (`Date.now()` + random suffix) and `session_seed` is `Date.now()` for reproducible trial selection from the item bank.

---

## 7. Copy Task (GMT 2.1)

- **Stimulus:** One fixed 4×4 grid, 6 filled cells: 3 X, 3 O (max 2 per row/column). Defined in code as `COPY_TARGET_MAP` (16-element array).
- **Procedure:** Reference grid shown; participant uses a palette (X, O) to fill a second 4×4 grid (click or drag-and-drop). Time limit **30 seconds**. Countdown by recursive `setTimeout` (1 s steps). On timeout or “Submit,” response is recorded.
- **Scoring:** `copy_hits` = number of cells where response symbol matches target (max 6). `copy_total_rt_ms` = time from start to submit/timeout.
- **Recording:** Response grid is stored as `copy_response_map` (16-element array). To avoid stale refs: on Submit the current **state** (`responseMap`) is passed into the submit handler; on timeout a `useEffect` keeps a ref in sync with `responseMap` so the timeout callback reads the latest placements. Same pattern as memory (see below).

---

## 8. Memory Task (GMT 2.1) — Design

- **Trial count and order:** Exactly **16 trials**: for each of the 4 conditions (`baseline`, `ignore_distractor`, `remember_distractor`, `delay`), spans 2, 3, 4, 5. Order: baseline (2,3,4,5), ignore_distractor (2,3,4,5), remember_distractor (2,3,4,5), delay (2,3,4,5).
- **Item bank:** Pre-generated JSON bank; multiple items per (condition, span). For a session, one item per (condition, span) is chosen with a **seeded RNG** (mulberry32) using `session_seed` so the same participant always gets the same 16 items.
- **Conditions:**
  - **baseline:** Encoding shows only target positions (X, O). Reconstruction: place X and O only.
  - **ignore_distractor:** Encoding shows target + distractor “Plus” in some cells; instruction is to ignore Plus. Reconstruction: place only X and O (no Plus in palette).
  - **remember_distractor:** Encoding shows target + Plus; participant must remember where Plus was. Reconstruction: palette includes Plus; response must match target and distractor positions.
  - **delay:** Same as baseline but after encoding a **fixation cross** is shown for 4 s, then reconstruction.
- **Encoding duration:** `encodingMs(span) = 600 * span + 600` ms (e.g. span 2 → 1800 ms, span 5 → 3600 ms).
- **Reconstruction time limit:** `reconLimitMs(span) = 3000 + 2000 * span` ms (e.g. span 2 → 7 s, span 5 → 13 s). Countdown displayed in seconds.
- **No discontinue rule:** All 16 trials run regardless of accuracy.

---

## 9. Memory Task — Per-Trial Flow (Implementation)

- **Encoding phase:** Display grid from item (`target_map` only for baseline/delay; for ignore/remember, distractor “Plus” merged into display where present). After `encodingMs(span)`, either go to **delay_fixation** (delay condition) or **reconstructing**.
- **Delay fixation:** Fixation cross for 4000 ms, then **reconstructing**.
- **Reconstructing:** Empty 4×4 grid; palette X, O (and Plus for remember_distractor). Participant places symbols (click cell with selected symbol, or drag-drop). Countdown via recursive `setTimeout` (not setInterval) so that “time hit 0” logic runs in a normal callback. When time hits 0 or user clicks “Submit”:
  - **Recording:** Current response grid is read (from **state** when Submit is used, from a **ref** kept in sync with state when timeout is used), normalized to a 16-element array, then scored.
  - **Scoring:** For each cell: if target has a symbol, count hit when response matches; if target empty but response has a symbol, count commission. `accuracy_raw = hits / total_targets` (0 if no targets). `recon_rt_ms` = time from start of reconstruction to record.
  - **State update:** Trial record is appended via `addMemoryTrial`; `flushSync` is used so the next phase/trial index update happens immediately; response grid state is cleared; then either next trial (encoding) or results phase.
- **Double-record guard:** A ref `recordedForTrialRef` ensures we do not record the same trial twice (e.g. if timeout and Submit both fire).

---

## 10. Scoring and Summary (GMT 2.1)

- **Per trial:** `hits`, `commissions`, `total_targets`, `accuracy_raw`, `recon_rt_ms`, `timeout` (boolean).
- **Summary:** Over all 16 trials: `mean_accuracy_per_condition`, `mean_rt_per_condition` (per condition), `global_accuracy` (mean of per-trial accuracy_raw), `global_mean_rt` (mean of per-trial recon_rt_ms). Computed in `computeGMT2Summary(memoryTrials)`.

---

## 11. Submission Payload and API (GMT 2.1)

- **Payload (JSON):** `session_id`, `participant_id`, `birth_year`, `gender`, `education`, `device_type`, `copy_hits`, `copy_total_rt_ms`, `copy_target_map` (16 strings), `copy_response_map` (16 strings), `memory_trials` (array of 16 trial objects: condition, span, target_map, response_map, recon_rt_ms, hits, commissions, accuracy_raw, timeout), `mean_accuracy_per_condition`, `mean_rt_per_condition`, `global_accuracy`, `global_mean_rt`.
- **Client:** `buildGMT2Payload(participant, copyResult, memoryTrials, summary)` builds this; `submitGMT2(payload)` POSTs to `VITE_API_URL/api/gmt2-submit`. On non-OK response, 502 body is parsed for a `detail` field (e.g. Supabase RLS message) and shown to the user.
- **Server (Vercel):** `api/gmt2-submit.js` parses body, normalizes types (arrays for maps and memory_trials, numbers for scalars, objects for mean maps), inserts one row into Supabase `gmt2_submissions` via REST API. On Supabase error, returns 502 with sanitized `detail`.
- **Database:** Table `gmt2_submissions`; columns match payload (e.g. JSONB for `copy_target_map`, `copy_response_map`, `memory_trials`). RLS: anon can INSERT and SELECT (script in `scripts/gmt2_submissions_rls.sql`).

---

## 12. Notable Implementation Details

- **Response map capture:** Previously, recording could read a stale ref and submit empty response maps. Fix: (1) On Submit, pass current state (`responseMap`) into `recordTrial`/`submitCopy` so the recorded response is the one on screen. (2) `useEffect` syncs `responseMap` to a ref so the timeout path also sees the latest placements.
- **Timer:** Reconstruction/copy countdown uses recursive `setTimeout` (not setInterval) so “time hit 0” runs in a normal callback; `flushSync` is used when updating phase/trial so the next screen is committed immediately.
- **Debug instrumentation:** Some `pushDebugLog` and `fetch` calls to an external debug endpoint remain in memory/copy pages; they can be removed for production.
- **CORS:** API sets `Access-Control-Allow-Origin: *` and handles OPTIONS for POST.

---

## 13. File Structure (Relevant to GMT 2.1)

- **Entry/routing:** `src/App.tsx` (route `/gmt2` → `GMT2Shell`).
- **State:** `src/gmt2/GMT2State.tsx` (context + provider).
- **Shell:** `src/gmt2/GMT2Shell.tsx` (phase → page).
- **Pages:** `src/gmt2/pages/` — `GMT2Consent`, `GMT2Demographics`, `GMT2Copy`, `GMT2Memory`, `GMT2Results`.
- **Types:** `src/gmt2/types.ts`.
- **Logic:** `src/gmt2/lib/memoryTask.ts` (item bank, getTrialsForSession, encoding/recon timing, normalizeResponseMap, scoreTrial), `src/gmt2/lib/copyTask.ts` (COPY_TARGET_MAP, scoreCopyTask, toResponseGridMap), `src/gmt2/lib/summary.ts` (computeGMT2Summary), `src/gmt2/lib/submitGmt2.ts` (buildGMT2Payload, submitGMT2).
- **Components:** `src/gmt2/components/` — display grid, reconstruction grid (with drag/drop and click), shape palette, SymbolPlus, etc.
- **Data:** `src/gmt2/gmt2_item_bank.json` (pre-generated items).
- **API:** `api/gmt2-submit.js` (Vercel serverless).
- **DB scripts:** `scripts/gmt2_submissions_table.sql`, `scripts/gmt2_submissions_rls.sql`.

---

## 14. What to Critique

A reviewer may consider:

1. **Research design:** Appropriateness of 16 trials, condition order, span levels, encoding/recon timing, and lack of discontinue rule for a working-memory measure.
2. **Validity:** Whether copy task and four conditions (baseline, ignore, remember, delay) operationalize the intended constructs; scoring (hits, commissions, accuracy_raw) and summary metrics.
3. **UX and bias:** Instructions, timing visibility, effect of countdown on strategy; accessibility (keyboard, screen readers, touch vs mouse).
4. **Data quality:** Session seed and item selection; handling of timeouts (recording partial response); risk of double-submit or duplicate records; RLS and security of Supabase.
5. **Code quality:** State vs ref usage; timer and flushSync patterns; error handling and user feedback on submit failure; presence of debug code in production paths.
6. **Deployment and config:** Reliance on env vars (`VITE_API_URL`, base path); behavior when backend is not configured; Google Form/Sheet fallbacks.

Use this document as the single source of truth for the app’s behavior and structure when requesting a critique.
