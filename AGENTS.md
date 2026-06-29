# AGENTS.md

## Project purpose
This repository contains a web app for applying Senegalese tajweed-style transformations to Arabic text. The main experience is a single-page interface in index.html backed by the processing logic in tajweed-engine.js and a small Express server in server.js.

## Key files
- index.html: UI, toolbar behavior, custom rules form, and client-side wiring.
- tajweed-engine.js: core tajweed processing and diacritic colorization logic.
- server.js: Express endpoints for loading and saving custom rules from rules.json.
- rules.json: persisted custom rules used by the app.

## Agent guidance
- Preserve the existing Arabic-first UX and visual style.
- Keep the current API contract for /get-rules and /save-rules unless a change explicitly requires otherwise.
- Prefer minimal, targeted edits over broad rewrites.
- When changing processing logic, avoid breaking diacritic handling or Arabic ligature rendering.
- If you add a feature, keep it functional in the browser and keep related UI text in French where the app already uses French.

## Verification
After making changes, verify the app by running:
- npm start
- Opening http://localhost:3000 in a browser

If the change touches the server or persistence flow, confirm that the rules can still be loaded and saved successfully.
