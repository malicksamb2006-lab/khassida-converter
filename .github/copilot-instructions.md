# Copilot instructions for khassida-converter

This repository is a small Arabic text-processing app for applying tajweed-style transformations to text entered by the user.

## What to know
- The main UI lives in index.html.
- The core transformation logic lives in tajweed-engine.js.
- The Express server in server.js stores user rules in rules.json.
- The app is intentionally lightweight; prefer small, focused changes.

## Working conventions
- Preserve Arabic text rendering and the existing styling.
- Keep the current server endpoints intact unless a feature requires a new one.
- Avoid introducing unrelated dependencies.
- When adding UI controls or text, follow the existing French wording style.

## Verification checklist
- Run npm start after changes.
- Confirm the app is available at http://localhost:3000.
- If rules handling changed, verify that the rules can still be loaded and saved.
