# Tic Tac Toe Memory Test

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
2. (Optional) Copy `.env.example` to `.env` and set `VITE_GOOGLE_FORM_*` and `VITE_ENTRY_*` if you use a different form. Defaults point to the form and entry IDs in `PLAN.md`.
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
5. **Results** – Total points, highest level passed, accuracy, mean RT. “Submit results to study” opens the Google Form with fields pre-filled. Download JSON/CSV.

## Plan

See [PLAN.md](./PLAN.md) for the full implementation plan and rules.
