# COACHX

COACHX is an iPhone-first athlete app built from Stitch references and the repository design rules.

## Current routes

- `/` Today
- `/calendar`
- `/day/[date]`
- `/day/[date]/nutrition`
- `/progress`
- `/profile`

## Stack

- Next.js App Router
- TypeScript
- GSAP motion layer
- Local fixture data

## Run

```bash
pnpm dev
```

## Build

```bash
pnpm build
```

## Notes

- Stitch is the visual source of truth for implemented screens.
- Mock data is centralized in `lib/coachx-data.ts`.
- Shared motion presets live in `motion/`.

## iPhone install test

1. Open the deployed preview in Safari on iPhone.
2. Tap the Share button in the browser toolbar.
3. Choose `Add to Home Screen`.
4. Launch COACHX from the Home Screen icon.
5. Verify the app opens in standalone mode with minimal browser chrome.
6. Open a day detail screen and confirm the nutrition route uses the same demo day.
