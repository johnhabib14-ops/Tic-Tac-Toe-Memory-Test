# Grid Memory

A web app that measures visual spatial working memory: participants briefly see grids with X and O (and sometimes distractor shapes), then reconstruct the layout by placing shapes from a palette into the grid. Results can be submitted to a Google Form (one row per participant).

## Tech stack

- React 18 + Vite + TypeScript
- React Router
- No backend; data in memory and optional Google Form pre-fill

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. (Optional) **Backend (Option B – recommended for online use):** To store submissions in Supabase and download them from a PIN-protected page, see [Option B: Vercel + Supabase](#option-b-vercel--supabase). Set `VITE_API_URL` in `.env` and deploy to Vercel with the API routes and env vars.  
   (Optional) **Google Sheets:** To send results to a Google Sheet instead, see [Sending results to Google Sheets](#sending-results-to-google-sheets). Set `VITE_GOOGLE_SHEETS_SCRIPT_URL` in `.env`. Used only if `VITE_API_URL` is not set.  
   (Optional) **Google Form fallback:** If neither is set, the app opens the Google Form with fields pre-filled.
3. Run the app:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```

## Flow

1. **Welcome** – Name, age, gender, location (optional). Start Test.
2. **Instructions** – Task-only instructions; optional practice trials (default on).
3. **Practice** – Two trials (X in center; then 2 symbols). Must pass each to continue.
4. **Test** – Levels 1–10, 2 trials per level. Level 1 shows the grid for 5 seconds; difficulty increases (shorter display, delay, then distractors and decoys). Participant must get 100% correct to advance; 2-minute limit per reconstruction; test stops after 3 imperfect trials in a row.
5. **Results** – Total points, highest level passed, accuracy, mean RT. “Submit results to study” sends one row to your backend (if `VITE_API_URL` is set), or to your Google Sheet, or opens the Google Form. Download JSON/CSV.

## Option B: Vercel + Supabase

Store every submission in Supabase and view/export from a PIN-protected page.

1. **Supabase:** Create a project and a table `submissions` with columns: `id` (int8, identity), `created_at` (timestamptz, default `now()`), `participant_id`, `name`, `age`, `gender`, `location`, `timestamp`, `memory_points`, `highest_level_passed`, `overall_accuracy_percent`, `mean_reaction_time_ms`, `total_incorrect_placements`, `total_wrong_shape_used`, `copy_score`, `copy_time_ms` (all text or numeric as appropriate). The `location` column stores the participant’s education value.
2. **Vercel:** Import this repo as a project. In **Settings → Environment Variables** add: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `DATA_SECRET` (PIN for the data page), and `VITE_API_URL` (your Vercel app URL, e.g. `https://your-app.vercel.app` — required at build time). Redeploy after adding or changing env vars.
3. **Base path (optional):** By default the app is served under `/Tic-Tac-Toe-Memory-Test/`. To serve at the Vercel root (e.g. `https://your-app.vercel.app/`), set `VITE_BASE_PATH=/` in Vercel and redeploy.
4. Deploy. Test: open your app URL (with or without `/Tic-Tac-Toe-Memory-Test/` per step 3), complete the participant flow and submit; then open `/pin` (same base path), enter `DATA_SECRET`, and use the Data page to Export JSON or CSV. **Research version:** GMT 2.2 is at `/gmt22` (same base path as the app root). For **SPSS- and research-friendly export** of GMT 2.2 data (wide and long format), see [docs/GMT22_DATA_EXPORT.md](docs/GMT22_DATA_EXPORT.md).

**Data not saving?** (1) Set `VITE_API_URL` in Vercel (your app URL, no trailing slash) and **redeploy** so the frontend is built with it. (2) Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in Vercel. (3) In Supabase, ensure the `submissions` table exists and, if RLS is enabled, add policies allowing `anon` to insert and select.

## Sending results to Google Sheets

To skip the Google Form and have each participant’s results appended as one row in a Google Sheet:

1. Create a new Google Sheet (e.g. “Tic-Tac-Toe Memory Test Results”).
2. **Extensions → Apps Script**, then replace the default code with the contents of [scripts/GoogleSheetsWebApp.gs](./scripts/GoogleSheetsWebApp.gs) (see comments there for the same steps).
3. **Deploy → New deployment → Web app**: Execute as “Me”, Who has access “Anyone”. Deploy and copy the **Web app URL**.
4. In the project root, create or edit `.env` and set:
   ```bash
   VITE_GOOGLE_SHEETS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_ID/exec
   ```
5. Rebuild and run the app. When a participant clicks **Submit results to study**, a new tab will POST the results to the script; the script appends one row to the sheet and shows “Results recorded.”

Column order in the sheet: participantId, name, age, gender, location, timestamp, memoryPoints, highestLevelPassed, overallAccuracyPercent, meanReactionTimeMs, totalIncorrectPlacements, totalWrongShapeUsed, copyScore, copyTimeMs.

## Plan

See [PLAN.md](./PLAN.md) for the full implementation plan and rules.
