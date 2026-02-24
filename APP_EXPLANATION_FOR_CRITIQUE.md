# Full App Explanation for Critique (Grid Memory Test)

This document describes the **Tic-Tac-Toe Memory Test** web application in enough detail for an external reviewer (e.g. ChatGPT) to critique its design, implementation, and research validity. The app exists in two versions: **GMT 1.0** (original) and **GMT 2** (streamlined research version). The explanation focuses on GMT 2 as the primary research protocol; GMT 1.0 is summarized for context.

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

---

## 3. Two Versions: GMT 1.0 vs GMT 2

| Aspect | GMT 1.0 | GMT 2 |
|--------|---------|-------|
| **Entry** | Landing → Demographics → Intro → Copy instructions → Practice → Test → Copy → Results | Intro → Consent → Demographics → Practice (2 trials) → Copy instructions → Copy → Memory instructions → Memory → Results |
| **Memory task** | Levels 1–10, 2 trials per level; advance on 100% correct; discontinue after 3 imperfect in a row; 2 min/trial | 4 conditions in one of two fixed orders (Order A or B); spans 2–7, 2 trials per span; discontinue when 0/2 pass at a span; smart start; global early stop if discontinued at span ≤ 2 in two conditions. Variable trial count. |
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
5. **Copy instructions** – Then **Copy task**: one fixed 4×4 reference grid (8 targets: X and O); 30 s; Submit or auto-submit on timeout.
6. **Memory instructions** – Then **Memory task**: 4 conditions, spans 2–7, 2 trials per span; discontinue, smart start, early stop. Each trial: encoding → optional delay fixation (with “Brief pause” text) → reconstruction with countdown; Submit or auto-record on timeout.
7. **Results** – Copy score (hits/8) and time; per-condition stats (start span, span estimate, mean accuracy, mean RT, total commissions, discontinued_at_span if any); overall accuracy, mean RT, total commissions; note if memory ended early; “Submit results” (if backend configured).

---

## 5. State and Architecture (GMT 2)

- **State:** React Context (`GMT22State`) holds: `phase`, `participant` (includes `condition_order`: 'A' or 'B'), `copyResult`, `memoryTrials`, `practiceTrials`, `practiceFailed`, `practicePassedFirstTry`, `memoryEarlyStopped`, and setters. No global store; phase drives which page component renders.
- **Shell:** `GMT22Shell` wraps content in `GMT22StateProvider` and renders one of: `GMT22Intro`, `GMT22Consent`, `GMT22Demographics`, `GMT22Practice`, `GMT22CopyInstructions`, `GMT22Copy`, `GMT22MemoryInstructions`, `GMT22Memory`, `GMT22Results` based on `phase`.
- **Types:** Central in `src/gmt22/types.ts`: participant (birth_year, age, condition_order, etc.), copy result, memory trial record (condition, span, trial_index, item_id, target_map, distractor_map, response_map, hits, commissions, total_targets, accuracy_raw, passed, near_passed, recon_rt_ms, timeout), practice trial record (same shape), condition summary (start_span, span_estimate, span_reached, discontinued_at_span, trials_completed_count, mean_accuracy, mean_rt_ms, total_commissions, span_consistency_flag), summary (by_condition, global_*, memory_early_stopped, practice_failed, practice_passed_first_try), grid maps (16-cell arrays), item bank entry (item_id, target_map, distractor_map). **getConditionOrder(order)** returns condition array: Order A = baseline, ignore_distractor, remember_distractor, delay; Order B = baseline, delay, ignore_distractor, remember_distractor.

---

## 6. Demographics (GMT 2)

- **Participant ID:** Free text, required (e.g. study ID).
- **Date of birth:** Full date via `<input type="date">`; validated to age 10–90 (min/max dates). **Age** is computed from date of birth vs today (whole years; if birthday not yet reached this year, age is reduced by 1). Stored in payload as `birth_year` (year from date) and `age` (computed).
- **Gender:** Select: Male, Female, Nonbinary, Prefer not to say, Self describe. If “Self describe,” a required text field appears; stored as `"Self describe: <text>"` or `"Self describe"` if empty.
- **Education:** Dropdown 10–20 years (single value per option).
- **Device type:** Desktop, Tablet, Phone, Other, Prefer not to say.
- **Session:** On submit, a `session_id` is generated (`Date.now()` + random suffix), `session_seed` is `Date.now()`, and **condition_order** is randomly set to `'A'` or `'B'` (50/50). Condition order determines the sequence of memory conditions (see Memory task).

---

## 7. Copy Task (GMT 2)

- **Stimulus:** One fixed 4×4 grid, **8 targets** (e.g. 4 X, 4 O); max 2 per row/column. Defined in code as `COPY_TARGET_MAP` (16-element array); `COPY_NUM_TARGETS = 8`.
- **Procedure:** Reference grid shown; participant uses a palette (X, O only) to fill a second 4×4 grid (click or drag-and-drop). Time limit **30 seconds**. Countdown by recursive `setTimeout` (1 s steps). On timeout or “Submit,” response is recorded.
- **Scoring:** `copy_hits` = number of cells where response symbol matches target (max 8). `copy_total_rt_ms` = time from start to submit/timeout. `copy_target_map` and `copy_response_map` (length 16).
- **Recording:** Response grid is stored as `copy_response_map` (16-element array). On Submit the current **state** (`responseMap`) is passed into the submit handler; on timeout a `useEffect` keeps a ref in sync with `responseMap` so the timeout callback reads the latest placements. Same pattern as memory (see below).

---

## 8. Memory Task (GMT 2) — Design

- **Trial count and order:** **Variable** (discontinue and early stop). Spans 2–7; 2 trials per span per condition. **Condition order** is counterbalanced: at session init (after demographics), one of two orders is assigned. **Order A:** baseline → ignore_distractor → remember_distractor → delay. **Order B:** baseline → delay → ignore_distractor → remember_distractor. Baseline is always first. Each non-baseline condition starts at `max(2, baseline_span_estimate − 1)`.
- **Item bank:** Pre-generated JSON bank; **getItemForTrial(condition, span, trialIndex, sessionSeed)** returns one item; the two trials at the same span get two different items (deterministic seeded choice). Practice uses **getPracticeItems(sessionSeed)** (baseline span 2, ignore_distractor span 2).
- **Conditions:**
  - **baseline:** Encoding shows only target positions (X, O). Reconstruction: place X and O only.
  - **ignore_distractor:** Encoding shows target + distractor “Plus” in some cells; instruction is to ignore Plus. Reconstruction: place only X and O (no Plus in palette).
  - **remember_distractor:** Encoding shows target + Plus; participant must remember where Plus was. Reconstruction: palette includes Plus; response must match target and distractor positions.
  - **delay:** Same as baseline but after encoding a **fixation cross** is shown for 4 s with text “Brief pause — then you will place the symbols,” then reconstruction.
- **Timing:** `encodingMs(span) = 450 * span + 500` ms. Delay fixation 4000 ms. `reconLimitMs(span) = 2500 + 1700 * span` ms. Countdown displayed in seconds.
- **Pass rule:** passed = (commissions === 0) && (accuracy_raw >= 0.85). near_passed = (accuracy_raw >= 0.85) for analysis only (not used for discontinue).
- **Discontinue:** At each span, 2 trials are run. If at least 1 passes, advance to next span (up to 7). If 0 pass, discontinue the condition and move to the next condition.
- **Smart start:** Baseline always starts at span 2. After baseline, baseline_span_estimate = highest span with ≥1 pass; other conditions start at max(2, baseline_span_estimate − 1).
- **Global early stop:** If the participant discontinues at span ≤ 2 in two conditions, the memory task stops and the flow goes to Results; `memory_early_stopped` is set.

---

## 9. Memory Task — Per-Trial Flow (Implementation)

- **Encoding phase:** Display grid from item (`target_map` only for baseline/delay; for ignore/remember, distractor “Plus” merged into display where present). After `encodingMs(span)`, either go to **delay_fixation** (delay condition) or **reconstructing**.
- **Delay fixation:** Fixation cross for 4000 ms with short text so it is not perceived as a freeze; then **reconstructing**.
- **Reconstructing:** Empty 4×4 grid; palette X, O (and Plus for remember_distractor). Participant places symbols (click cell with selected symbol, or drag-drop). Countdown via recursive `setTimeout` (not setInterval) so that “time hit 0” logic runs in a normal callback. When time hits 0 or user clicks “Submit”:
  - **Recording:** Current response grid is read (from **state** when Submit is used, from a **ref** kept in sync with state when timeout is used), normalized to a 16-element array, then scored. Trial record includes `trial_index`, `item_id`, `distractor_map`, `passed`, `near_passed`, `total_targets`.
  - **Scoring:** For each cell: if target has a symbol, count hit when response matches; if target empty but response has a symbol, count commission. `accuracy_raw = hits / total_targets` (0 if no targets). `recon_rt_ms` = time from start of reconstruction to record.
  - **State update:** Trial record is appended via `addMemoryTrial`; `flushSync` is used so the next phase/trial index update happens immediately; response grid state is cleared; then either next trial (encoding), next condition (with discontinue/smart start), or results phase (including early stop).
- **Double-record guard:** A ref keyed by condition/span/trialIndex ensures the same trial is not recorded twice (e.g. if timeout and Submit both fire).

---

## 10. Scoring and Summary (GMT 2)

- **Per trial:** `hits`, `commissions`, `total_targets`, `accuracy_raw`, `passed`, `near_passed`, `recon_rt_ms`, `timeout` (boolean).
- **Summary:** `computeGMT22Summary(trials, { memory_early_stopped, practice_failed, practice_passed_first_try })` returns **GMT22Summary**: **by_condition** (per condition: start_span, span_estimate, span_reached, discontinued_at_span, trials_completed_count, mean_accuracy, mean_rt_ms, total_commissions, **span_consistency_flag** — true iff both trials at span_estimate passed); **global_accuracy**, **global_mean_rt_ms**, **global_total_commissions**; **memory_early_stopped**, **practice_failed**, **practice_passed_first_try** (true iff at least 1 of 2 practice trials passed on first attempt, i.e. no retry).

---

## 11. Submission Payload and API (GMT 2)

- **Payload (JSON):** `session_id`, `participant_id`, `birth_year`, `age`, `gender`, `education`, `device_type`, **condition_order** ('A' or 'B'), **practice_failed**, **practice_passed_first_try**, `practice_trials` (array of practice trial objects), `copy_hits`, `copy_total_rt_ms`, `copy_target_map`, `copy_response_map`, `memory_trials` (variable length). Each trial object: condition, span, trial_index, item_id, target_map, distractor_map, response_map, recon_rt_ms, hits, commissions, total_targets, accuracy_raw, passed, near_passed, timeout. **summary** object: by_condition (per condition: start_span, span_estimate, span_reached, discontinued_at_span, trials_completed_count, mean_accuracy, mean_rt_ms, total_commissions, **span_consistency_flag**), global_accuracy, global_mean_rt_ms, global_total_commissions, memory_early_stopped, practice_failed, practice_passed_first_try.
- **Client:** `buildGMT22Payload(participant, copyResult, memoryTrials, practiceTrials, summary)` builds this; `submitGMT22(payload)` POSTs to `VITE_API_URL/api/gmt22-submit`. On non-OK response, 502 body is parsed for a `detail` field and shown to the user.
- **Server (Vercel):** `api/gmt22-submit.js` parses body; accepts condition_order, practice_failed, practice_passed_first_try, summary.by_condition (including span_consistency_flag) and maps them into flat columns; inserts one row into Supabase **gmt22_submissions**. On Supabase error, returns 502 with sanitized `detail`.
- **Database:** Table **gmt22_submissions**; columns include participant fields, condition_order, practice_failed, practice_passed_first_try, copy_*, memory_trials (JSONB), summary-derived flat columns (mean_accuracy_per_condition, span_consistency_flag_baseline, etc.). Run **scripts/gmt22_submissions_refinement_columns.sql** to add refinement columns if the table was created before the addendum. RLS: anon can INSERT and SELECT (script in `scripts/gmt22_submissions_rls.sql`).

---

## 12. Notable Implementation Details

- **Response map capture:** On Submit, current state (`responseMap`) is passed into `recordTrial`/`submitCopy` so the recorded response is the one on screen. `useEffect` syncs `responseMap` to a ref so the timeout path also sees the latest placements.
- **Timer:** Reconstruction/copy countdown uses recursive `setTimeout` (not setInterval) so “time hit 0” runs in a normal callback; `flushSync` is used when updating phase/trial so the next screen is committed immediately.
- **Practice:** Intro screen before first practice trial; clarification screen after both practice trials fail, with one “Try again”. **practice_passed_first_try** is true only if at least one of the two practice trials passed on the first attempt (no retry); if the participant uses “Try again,” it remains false.
- **CORS:** API sets `Access-Control-Allow-Origin: *` and handles OPTIONS for POST.

---

## 13. File Structure (Relevant to GMT 2)

- **Entry/routing:** `src/App.tsx` (routes `/gmt2` and `/gmt22` → `GMT22Shell`).
- **State:** `src/gmt22/GMT22State.tsx` (context + provider).
- **Shell:** `src/gmt22/GMT22Shell.tsx` (phase → page).
- **Pages:** `src/gmt22/pages/` — `GMT22Intro`, `GMT22Consent`, `GMT22Demographics`, `GMT22Practice`, `GMT22CopyInstructions`, `GMT22Copy`, `GMT22MemoryInstructions`, `GMT22Memory`, `GMT22Results`.
- **Types:** `src/gmt22/types.ts`.
- **Logic:** `src/gmt22/lib/memoryTask.ts` (item bank, getItemForTrial, getPracticeItems, encodingMs, reconLimitMs, normalizeResponseMap, scoreTrial, isPassed, isNearPassed), `src/gmt22/lib/copyTask.ts` (COPY_TARGET_MAP, scoreCopyTask, toResponseGridMap), `src/gmt22/lib/summary.ts` (computeGMT22Summary(trials, options)), `src/gmt22/lib/submitGmt22.ts` (buildGMT22Payload, submitGMT22).
- **Components:** `src/gmt22/components/` — display grid, reconstruction grid (with drag/drop and click), shape palette, SymbolPlus, etc.
- **Data:** `src/gmt22/gmt22_item_bank.json` (pre-generated items).
- **API:** `api/gmt22-submit.js` (Vercel serverless).
- **DB scripts:** `scripts/gmt22_submissions_table.sql`, `scripts/gmt22_submissions_add_flat_columns.sql`, `scripts/gmt22_submissions_refinement_columns.sql` (condition_order, practice_failed, practice_passed_first_try, span_consistency_flag_*), `scripts/gmt22_submissions_rls.sql`, `gmt22_submissions` table.

---

## 14. What to Critique

A reviewer may consider:

1. **Research design:** Appropriateness of spans 2–7, 2 trials per span, two-order counterbalance (Order A/B), discontinue rule, smart start, global early stop (≤2), span_consistency_flag, practice block, practice_failed and practice_passed_first_try.
2. **Validity:** Whether copy task (8 targets) and four conditions (baseline, ignore, remember, delay) operationalize the intended constructs; scoring (hits, commissions, accuracy_raw, passed, near_passed) and summary metrics (by_condition, global_*, memory_early_stopped).
3. **UX and bias:** Intro and instruction screens; practice intro and clarification; delay-screen text; timing visibility; effect of countdown on strategy; accessibility (keyboard, screen readers, touch vs mouse).
4. **Data quality:** Full date of birth and age calculation; session seed and item selection (getItemForTrial, getPracticeItems); handling of timeouts (recording partial response); risk of double-submit or duplicate records; RLS and security of Supabase.
5. **Code quality:** State vs ref usage; timer and flushSync patterns; error handling and user feedback on submit failure.
6. **Deployment and config:** Reliance on env vars (`VITE_API_URL`, base path); behavior when backend is not configured; Google Form/Sheet fallbacks.

Use this document as the single source of truth for the app’s behavior and structure when requesting a critique.
