# Full App Explanation for Critique (Grid Memory Test)

This document describes the **Tic-Tac-Toe Memory Test** web application in enough detail for an external reviewer (e.g. ChatGPT) to critique its design, implementation, and research validity. The app exists in two versions: **GMT 1.0** (original) and **GMT 2** (streamlined research version). The explanation focuses on GMT 2 as the primary research protocol; GMT 1.0 is summarized for context.

**Protocol freeze:** The GMT 2 research protocol (span 2–7, four conditions, discontinue, span-centered summary) is frozen as of app version **1.0.0**. Task logic, scoring, and summary structure are stable for data collection. **Version 1.1.0** adds PWA support (installable app, icon, “GMT” on home screen); the protocol is unchanged.

---

## 1. Purpose and Research Context

- **Goal:** Measure **visual spatial working memory** via grid reconstruction.
- **Task:** Participants see 4×4 grids with symbols (X, O, and sometimes a distractor “Plus”), then reconstruct the layout by placing symbols from a palette into an empty grid.
- **Output:** One submission per participant (demographics, practice trials, copy task, memory trials, summary stats) stored in a database (Supabase) or sent to Google Sheets/Form when no API is configured.

---

## 2. Tech Stack and Deployment

- **Frontend:** React 18, Vite, TypeScript, React Router 6.
- **No backend in repo:** Data is in-memory until submission. Submission is sent to:
  - **Option A:** Vercel serverless API → Supabase (recommended for research).
  - **Option B:** Google Apps Script → Google Sheet (if `VITE_API_URL` is not set).
  - **Option C:** Pre-filled Google Form (fallback).
- **Env:** `VITE_API_URL` (app URL for API calls, required for Supabase save), `VITE_BASE_PATH` (e.g. `/` on Vercel, `/Tic-Tac-Toe-Memory-Test/` on GitHub Pages), `SUPABASE_URL`, `SUPABASE_ANON_KEY` on Vercel for the API.
- **Routing:** Single-page app. GMT 2 lives at `/gmt2` and `/gmt22` (both render the same shell). GMT 1.0 uses `/`, `/demographics`, `/intro`, `/copy`, `/test`, `/results`, etc.
- **PWA (installable app):** A web app manifest (`public/manifest.json`) and icon (`public/icon.svg`) allow “Add to Home Screen” / “Install app.” **Name** “Grid Memory Test,” **short_name** “GMT” (label under the icon on phone). **start_url** `/` (opens landing page). **display** `standalone`. One icon serves both the favicon (browser tab) and the installed app icon.

---

## 3. Two Versions: GMT 1.0 vs GMT 2

| Aspect | GMT 1.0 | GMT 2 |
|--------|---------|-------|
| **Entry** | Landing → Demographics → Intro → Copy instructions → Practice → Test → Copy → Results | Intro → Consent → Demographics → Practice (2 trials) → Copy instructions → Copy → Memory instructions → Memory → Results |
| **Memory task** | Levels 1–10, 2 trials per level; advance on 100% correct; discontinue after 3 imperfect in a row; 2 min/trial | 4 conditions in one of two fixed orders (Order A or B); spans 2–7, 2 trials per span; **every condition starts at span 2**; discontinue when 0/2 pass at a span; no global early stop — task ends only when all four conditions complete or discontinue. Variable trial count. |
| **Conditions** | Difficulty via display time, delay, distractors, decoys | Four named conditions: baseline, ignore_distractor, remember_distractor, delay |
| **Data** | Stored in `submissions` (Supabase) or Google Form/Sheet | Stored in `gmt22_submissions` (Supabase) via `/api/gmt22-submit` |
| **Demographics** | Name, age, gender, location (education) | Participant ID, date of birth (full date; age computed), gender (with “Self describe” text), education 10–20 years, device type |

The rest of this document details **GMT 2** unless noted.

---

## 4. GMT 2 User Flow (High Level)

1. **Intro** – Purpose (visual/spatial memory research) and what will happen: practice (2 trials), copy task, memory task. “Continue” to consent.
2. **Consent** – Short description and “I agree, continue.”
3. **Demographics** – Participant ID, date of birth (full date; age computed), gender (including “Self describe” with free text), years of education (10–20), device type. All required.
4. **Practice** – Intro screen (2 trials, grid disappears then place symbols; first trial X/O only, second may show + but place only X/O; time limit). Then 2 trials: baseline span 2, ignore_distractor span 2. If both fail, clarification screen and one “Try again”; if both fail again, proceed with `practice_failed` set.
5. **Copy instructions** – Then **Copy task**: reference grid from a small bank (8 targets: X and O), selected by session seed; 30 s; Submit or auto-submit on timeout. `copy_item_id` stored.
6. **Memory instructions** – Then **Memory task**: one **attention check** (“Place X in the top left cell then press Submit”), then 4 conditions, spans 2–7, 2 trials per span; every condition starts at span 2; discontinue within each condition only (no global early stop). Each trial: encoding → optional delay fixation (“Brief pause”) → reconstruction with countdown; Submit or auto-record on timeout.
7. **Results** – Title: “Thank you for completing GMT 2” (one line). Under it: **Overall: X% accuracy** (hits/targets across all memory trials), then a neutral line: “This task measures visual–spatial memory span under different task demands.” Copy: Hits / 8, Time (seconds). Memory: per condition (Block 1–4 in run order): Span, Consistency (Stable / Boundary), Mean Accuracy, Mean RT. Costs: Interference Cost, Binding Cost, Delay Cost. Participant ID and Condition order (e.g. “Order A”). No internal condition names. “Submit results” (if backend configured); duplicate submission prevented (button disabled, 409 from server if session_id already exists).

---

## 5. State and Architecture (GMT 2)

- **State:** React Context (`GMT22State`) holds: `phase`, `participant` (includes `condition_order`: 'A' or 'B'), `copyResult`, `memoryTrials`, `practiceTrials`, `practiceFailed`, `practicePassedFirstTry`, `attentionCheckFailed`, and setters. No global early stop state. Phase drives which page component renders.
- **Shell:** `GMT22Shell` wraps content in `GMT22StateProvider` and renders one of: `GMT22Intro`, `GMT22Consent`, `GMT22Demographics`, `GMT22Practice`, `GMT22CopyInstructions`, `GMT22Copy`, `GMT22MemoryInstructions`, `GMT22Memory`, `GMT22Results` based on `phase`.
- **Types:** Central in `src/gmt22/types.ts`: participant (birth_year, age, condition_order, etc.), copy result (includes `copy_item_id`), memory trial record (condition, span, trial_index, item_id, target_map, distractor_map, response_map, hits, commissions, omissions, binding_errors, total_targets, accuracy_raw, passed, recon_rt_ms, timeout — **no near_passed**), practice trial record (same shape). **Condition summary** (span-centered): `span_estimate`, `span_consistency_flag`, `mean_accuracy`, `mean_rt_ms` only. **Summary**: `by_condition` (that reduced set), plus `baseline_span`, `ignore_span`, `remember_span`, `delay_span`, `interference_cost`, `binding_cost`, `delay_cost`, `practice_failed`, `practice_passed_first_try`, `attention_check_failed`, `condition_order`. **getConditionOrder(order)** returns condition array: Order A = baseline, ignore_distractor, remember_distractor, delay; Order B = baseline, delay, ignore_distractor, remember_distractor.

---

## 6. Demographics (GMT 2)

- **Participant ID:** Free text, required (e.g. study ID).
- **Date of birth:** Full date via `<input type="date">`; validated to age 10–90 (min/max dates). **Age** is computed from date of birth vs today (whole years; if birthday not yet reached this year, age is reduced by 1). **Hard stop:** If computed age &lt; 10 or &gt; 90, submit is blocked and an inline error is shown; validation runs again inside the submit handler before proceeding. Stored in payload as `birth_year` (year from date) and `age` (computed).
- **Gender:** Select: Male, Female, Nonbinary, Prefer not to say, Self describe. If “Self describe,” a required text field appears; stored as `"Self describe: <text>"` or `"Self describe"` if empty.
- **Education:** Dropdown 10–20 years (single value per option).
- **Device type:** Desktop, Tablet, Phone, Other, Prefer not to say.
- **Session:** On submit, a `session_id` is generated (`Date.now()` + random suffix), `session_seed` is `Date.now()`, and **condition_order** is randomly set to `'A'` or `'B'` (50/50). Condition order determines the sequence of memory conditions (see Memory task).

---

## 7. Copy Task (GMT 2)

- **Stimulus:** 4×4 grid from a **copy item bank** (`copy_item_bank.json`), **8 targets** (X and O), max 2 per row/column. Item selected deterministically by **getCopyItemForSession(session_seed)**. `COPY_NUM_TARGETS = 8`.
- **Procedure:** Reference grid shown; participant uses a palette (X, O only) to fill a second 4×4 grid (click or drag-and-drop). Time limit **30 seconds**. Countdown by recursive `setTimeout` (1 s steps). On timeout or “Submit,” response is recorded.
- **Scoring:** `copy_hits` = number of cells where response symbol matches target (max 8). `copy_total_rt_ms` = time from start to submit/timeout. `copy_item_id`, `copy_target_map`, and `copy_response_map` (length 16) stored.
- **Recording:** Response grid is stored as `copy_response_map`. On Submit the current **state** (`responseMap`) is passed into the submit handler; on timeout a ref in sync with `responseMap` is used. **Hardening:** On timeout the grid is effectively locked by transitioning immediately; `copy_total_rt_ms` is computed as `Math.max(0, now - startTime)` so it is never negative; a ref ensures only one record is written (no duplicate scoring).

---

## 8. Memory Task (GMT 2) — Design

- **Attention check:** Immediately after memory instructions, one screen: “Place X in the top left cell then press Submit.” Empty reconstruction grid, X and O palette only. Pass = X in cell 0 and all other cells empty. If failed, `attention_check_failed` is set **and never flipped back to false** (immutability); the task continues (no termination).
- **Trial count and order:** **Variable** (per-condition discontinue only). Spans 2–7; 2 trials per span per condition. **Condition order** is counterbalanced: at session init (after demographics), one of two orders is assigned. **Order A:** baseline → ignore_distractor → remember_distractor → delay. **Order B:** baseline → delay → ignore_distractor → remember_distractor. Baseline is always first. **Every condition always starts at span 2** (no smart start).
- **Item bank:** Pre-generated JSON bank (`gmt22_item_bank.json`); **getItemForTrial(condition, span, trialIndex, sessionSeed)** returns one item; the two trials at the same span get two different items (deterministic seeded choice). For **remember_distractor**, only items with at least one "Plus" in `target_map` are used (via **getOptionsForCondition**), so the encoding grid always shows the plus. For spans 6 and 7, item pairs are matched on metadata when possible (pairing fallback logged if used). Practice uses **getPracticeItems(sessionSeed)** (baseline span 2, ignore_distractor span 2).
- **Conditions (participant-facing text only; no internal labels shown):** Instructions describe behavior only: “Place the symbols you saw.” / “Ignore the plus signs.” / “Remember the plus signs.” / “Brief pause — then you will place the symbols.” Internal names (baseline, ignore_distractor, remember_distractor, delay) are never displayed in UI or results. **Instruction colors (color-blind friendly):** "Ignore the plus signs" is shown in **blue** (#1f77b4, bold); "Remember the plus signs" in **orange** (#ff7f0e, bold) on both the memory-instructions page and the in-task encoding screen.
  - **baseline:** Encoding shows only target positions (X, O). Reconstruction: place X and O only.
  - **ignore_distractor:** Encoding shows target + distractor “Plus”; instruction: ignore plus signs (blue). Reconstruction: place only X and O (no Plus in palette).
  - **remember_distractor:** Encoding shows target + Plus; participant must remember where Plus was. **Item bank:** Every remember_distractor item has at least one "Plus" in `target_map`; selection filters to such items (getOptionsForCondition) so the encoding grid always shows +. Instruction: remember the plus signs (orange). Reconstruction: palette includes Plus; response must match target and distractor positions.
  - **delay:** Same as baseline but after encoding a **fixation cross** is shown for 4 s with text “Brief pause — then you will place the symbols,” then reconstruction.
- **Timing:** `encodingMs(span) = 450 * span + 500` ms. Delay fixation 4000 ms. `reconLimitMs(span) = 2500 + 1700 * span` ms. Countdown displayed in seconds.
- **Pass rule:** passed = (commissions === 0) && (accuracy_raw >= 0.85). **near_passed is not used** (removed from trial records and summary).
- **Discontinue:** At each span, 2 trials are run. If at least 1 passes, advance to next span (up to 7). If 0 pass, discontinue the condition and move to the next condition. **No global early stop** — the memory task ends only when all four conditions have either completed span 7 or discontinued.

---

## 9. Memory Task — Per-Trial Flow (Implementation)

- **Encoding phase:** Display grid from item (`target_map` only for baseline/delay; for ignore/remember, distractor “Plus” merged into display where present). After `encodingMs(span)`, either go to **delay_fixation** (delay condition) or **reconstructing**.
- **Delay fixation:** Fixation cross for 4000 ms with short text so it is not perceived as a freeze; then **reconstructing**.
- **Encoding phase:** Display is non-interactive (`pointer-events: none` on grid container); no grid is clickable until reconstruction begins.
- **Reconstructing:** Empty 4×4 grid; palette X, O (and Plus for remember_distractor). Participant places symbols (click cell with selected symbol, or drag-drop). Countdown uses a **ref-stored timeout id**; any existing timer is cleared when entering reconstructing; on unmount or phase change the timer is cleared to avoid stray execution. When time hits 0 or user clicks “Submit”:
  - **Single-record guard:** Before recording, a ref keyed by condition/span/trialIndex is checked; if already set, return immediately. The ref is set to true **before** any state update so timeout + Submit cannot both record.
  - **Freeze on Submit:** On Submit click, a **local copy** of the response map is captured, grid and palette are disabled immediately (no further placements), then recording runs with the captured map to avoid race with UI state.
  - **Recording:** Response grid is normalized via **normalizeResponseMap** (always returns length 16, fills undefined with `''`, never null), then scored. Trial record includes `trial_index`, `item_id`, `distractor_map`, `passed`, `omissions`, `binding_errors`, `total_targets` (no near_passed).
  - **Scoring:** For each cell: if target has a symbol, count hit when response matches; if target empty but response has a symbol, count commission; if target has a symbol and response has a different symbol, count binding error; if target has a symbol and response is empty, count omission. `accuracy_raw = hits / total_targets` (0 if no targets). `recon_rt_ms` = time from start of reconstruction to record.
  - **State update:** Trial record is appended via `addMemoryTrial`; `flushSync` is used so the next phase/trial index update happens immediately; response grid state is cleared; then either next trial (encoding), next condition (with discontinue), or results phase when all four conditions are done.

---

## 10. Scoring and Summary (GMT 2)

- **Per trial (full trial-level logs kept):** `hits`, `commissions`, `omissions`, `binding_errors`, `total_targets`, `accuracy_raw`, `passed`, `recon_rt_ms`, `timeout` (boolean). No near_passed.
- **Summary (span-centered, deterministic):** `computeGMT22Summary(trials, { practice_failed, practice_passed_first_try, attention_check_failed, condition_order })` returns **GMT22Summary**. Trials are grouped strictly by condition and **sorted by span ascending** before computing span_estimate (no reliance on array order of memoryTrials).
  - **by_condition** (per condition only): `span_estimate`, `span_consistency_flag` (true iff both trials at span_estimate passed), `mean_accuracy`, `mean_rt_ms`.
  - **Global:** `baseline_span`, `ignore_span`, `remember_span`, `delay_span` (span estimates per condition), `interference_cost` = baseline_span − ignore_span, `binding_cost` = baseline_span − remember_span, `delay_cost` = baseline_span − delay_span, `practice_failed`, `practice_passed_first_try`, `attention_check_failed`, `condition_order`. No global accuracy, global mean RT, total commissions, or early-stop flags.

---

## 11. Submission Payload and API (GMT 2)

- **Payload (JSON):** `session_id`, `participant_id`, `birth_year`, `age`, `gender`, `education`, `device_type`, **condition_order** ('A' or 'B'), **practice_failed**, **practice_passed_first_try**, `practice_trials` (array of practice trial objects), **copy_item_id**, `copy_hits`, `copy_total_rt_ms`, `copy_target_map`, `copy_response_map`, `memory_trials` (variable length). Each trial object: condition, span, trial_index, item_id, target_map, distractor_map, response_map, recon_rt_ms, hits, commissions, omissions, binding_errors, total_targets, accuracy_raw, passed, timeout (no near_passed). **summary** object: by_condition (per condition: span_estimate, span_consistency_flag, mean_accuracy, mean_rt_ms only), baseline_span, ignore_span, remember_span, delay_span, interference_cost, binding_cost, delay_cost, practice_failed, practice_passed_first_try, attention_check_failed, condition_order.
- **Client:** `buildGMT22Payload(participant, copyResult, memoryTrials, practiceTrials, summary)` builds this; `submitGMT22(payload)` POSTs to `VITE_API_URL/api/gmt22-submit`. **Double-submit prevention:** Submit button is disabled immediately on click; a `submitting` state blocks a second POST; “Submitting…” is shown during the request. On failure the user sees **“Submission failed. Please try again.”**; error detail is logged to console only (no backend internals exposed).
- **Server (Vercel):** `api/gmt22-submit.js` parses body; **duplicate check:** if a row with the same `session_id` already exists, returns **409 Conflict** instead of inserting again. Otherwise accepts the simplified summary (span-centered) and inserts one row into Supabase **gmt22_submissions** including baseline_span, ignore_span, remember_span, delay_span, interference_cost, binding_cost, delay_cost. Does not expect near_passed or memory_early_stopped from the client. On Supabase error, returns 502 with sanitized `detail`.
- **Database:** Table **gmt22_submissions**; columns include participant fields, condition_order, practice_failed, practice_passed_first_try, copy_item_id, copy_*, memory_trials (JSONB, full trial-level logs), mean_accuracy_per_condition, span_consistency_flag_* , baseline_span, ignore_span, remember_span, delay_span, interference_cost, binding_cost, delay_cost, attention_check_failed. Run **scripts/gmt22_submissions_validity_columns.sql** and **scripts/gmt22_submissions_span_summary_columns.sql** if the table was created earlier. RLS: anon can INSERT and SELECT (script in `scripts/gmt22_submissions_rls.sql`).

---

## 12. Notable Implementation Details

- **Response map capture:** On Submit, a **local copy** of the response map is taken and grid/palette are disabled before recording. `useEffect` syncs `responseMap` to a ref so the timeout path also sees the latest placements. **normalizeResponseMap** always returns a 16-length array, fills undefined cells with `''`, and never returns null.
- **Timer:** Reconstruction countdown stores the timeout id in a ref; on entering reconstructing any existing timer is cleared; on unmount or phase change the ref’s timer is cleared. Copy uses a similar pattern. `flushSync` is used when updating phase/trial so the next screen is committed immediately.
- **Practice:** Intro screen before first practice trial; clarification screen after both practice trials fail, with one "Try again". Encoding and reconstruction timers start only after the user clicks "Start practice" (or "Try again"), so they do not run while the intro or clarification screen is shown. **practice_passed_first_try** is true only if at least one of the two practice trials passed on the first attempt (no retry); if the participant uses “Try again,” it remains false.
- **CORS:** API sets `Access-Control-Allow-Origin: *` and handles OPTIONS for POST.

---

## 13. File Structure (Relevant to GMT 2)

- **Entry/routing:** `src/App.tsx` (routes `/gmt2` and `/gmt22` → `GMT22Shell`).
- **State:** `src/gmt22/GMT22State.tsx` (context + provider).
- **Shell:** `src/gmt22/GMT22Shell.tsx` (phase → page).
- **Pages:** `src/gmt22/pages/` — `GMT22Intro`, `GMT22Consent`, `GMT22Demographics`, `GMT22Practice`, `GMT22CopyInstructions`, `GMT22Copy`, `GMT22MemoryInstructions`, `GMT22Memory`, `GMT22Results`.
- **Types:** `src/gmt22/types.ts`.
- **Logic:** `src/gmt22/lib/memoryTask.ts` (item bank, getItemForTrial, getOptionsForCondition, getPracticeItems, encodingMs, reconLimitMs, normalizeResponseMap, scoreTrial, isPassed; span 6–7 pairing with getPairingFallbackUsed), `src/gmt22/lib/copyTask.ts` (getCopyItemForSession, copy_item_bank.json, scoreCopyTask, toResponseGridMap), `src/gmt22/lib/summary.ts` (computeGMT22Summary(trials, options) with condition_order required), `src/gmt22/lib/submitGmt22.ts` (buildGMT22Payload, submitGMT22).
- **Components:** `src/gmt22/components/` — display grid, reconstruction grid (with drag/drop and click), shape palette, SymbolPlus, etc.
- **Data:** `src/gmt22/gmt22_item_bank.json` (pre-generated items), `src/gmt22/copy_item_bank.json` (copy patterns).
- **PWA:** `public/manifest.json` (name, short_name “GMT”, start_url, icons), `public/icon.svg` (favicon and app icon), `index.html` (manifest and favicon links, theme-color).
- **API:** `api/gmt22-submit.js` (Vercel serverless).
- **DB scripts:** `scripts/gmt22_submissions_table.sql`, `scripts/gmt22_submissions_add_flat_columns.sql`, `scripts/gmt22_submissions_refinement_columns.sql`, `scripts/gmt22_submissions_validity_columns.sql`, `scripts/gmt22_submissions_span_summary_columns.sql`, `scripts/gmt22_submissions_rls.sql`, `gmt22_submissions` table.

---

## 14. What to Critique

A reviewer may consider:

1. **Research design:** Appropriateness of the **span-centered model**: all conditions start at span 2, no smart start, no global early stop; per-condition discontinue only; two-order counterbalance (Order A/B); span_consistency_flag; practice block; attention check; cost metrics (interference_cost, binding_cost, delay_cost).
2. **Validity:** Whether copy task (8 targets, item bank) and four conditions (baseline, ignore, remember, delay) operationalize the intended constructs; scoring (hits, commissions, omissions, binding_errors, accuracy_raw, passed only) and span-centered summary (span estimates and costs, no global accuracy/RT/commissions).
3. **UX and bias:** Intro and instruction screens; practice intro and clarification; attention check; instruction colors (blue = ignore, orange = remember, color-blind friendly); delay-screen text; timing visibility; effect of countdown on strategy; accessibility (keyboard, screen readers, touch vs mouse).
4. **Data quality:** Full date of birth and age calculation; session seed and item selection (getItemForTrial, getPracticeItems, getCopyItemForSession); handling of timeouts (recording partial response); risk of double-submit or duplicate records; RLS and security of Supabase.
5. **Code quality:** State vs ref usage; timer and flushSync patterns; error handling and user feedback on submit failure.
6. **Deployment and config:** Reliance on env vars (`VITE_API_URL`, base path); behavior when backend is not configured; Google Form/Sheet fallbacks.

Use this document as the single source of truth for the app’s behavior and structure when requesting a critique.
