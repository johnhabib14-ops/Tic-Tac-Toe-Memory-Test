# Visual polish proof

Captured with Playwright (`npm run polish:capture`) against `vite preview` at `/`.

## Stills (`docs/polish/stills/`)

| File | State |
|------|--------|
| `desktop-landing.png` | Battery hub — brand mark, teal CTAs, task rows |
| `desktop-battery.png` | Full protocol intro (capture via polish extras / manual) |
| `desktop-demo.png` | Demo Mode hub |
| `desktop-gmt-intro.png` | GMT intro with brand + experimental banner |
| `desktop-rit-mode.png` | RIT mode select (clinical) |
| `desktop-rit-mode-game.png` | RIT mode select (Signal Gate) |
| `desktop-rit-intake.png` | RIT research intake |
| `desktop-cft-mode.png` | CFT mode select (clinical) |
| `desktop-cft-mode-game.png` | CFT mode select (Rule Shift) |
| `mobile-landing.png` | Hub @ 390×844 |
| `mobile-gmt-intro.png` | GMT intro mobile |
| `mobile-rit-mode.png` | RIT mode mobile |
| `mobile-cft-mode.png` | CFT mode mobile |

## Videos (`docs/polish/videos/` — gitignored)

| File | Clip |
|------|------|
| `landing-navigation.webm` | Hub → each task → All tasks |
| `cft-session-start.webm` | CFT mode → research path |
| `rit-mode-select.webm` | RIT clinical/game + research |

## Re-run

```bash
npm run build
npx vite preview --host 127.0.0.1 --port 4173
POLISH_BASE_URL=http://127.0.0.1:4173 npm run polish:capture
```
