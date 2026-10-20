# The Last Broadcast

A single-player mystery in the browser. You are the substitute engineer at a fictional station the morning a host does not finish the overnight. You walk four rooms from object lists, log notes, interview three people, make deductions, and file an account. The account is accepted only when the person, the act, the motive, and the attached notes match an authored proof. Wrong accounts leave the case open.

There is no account, no server, no runtime model, and no network media. Sound is off until you press play. The tone is synthesized in the page.

The 15 to 25 minute first play is a design target. It was not measured with a person.

## Prerequisites

- Node.js 22. The clean install below used Node 22.23.3 and npm 10.9.9.
- Google Chrome, for `npm run test:browser`. Playwright is pointed at the system Chrome channel. No Playwright browser download is required.
- No environment variables. There is no `.env`.

## Commands

```bash
npm ci
npm test
npm run build
npm run test:browser
npm run dev
npm run preview
```

- `npm test` runs Vitest against the engine. It does not open a browser.
- `npm run dev` serves the game at `http://127.0.0.1:5173`.
- `npm run preview` serves the production build at `http://127.0.0.1:4173`.
- `npm run test:browser` builds, then runs Playwright against that preview.
- `npm run check` runs the engine tests, the build, and the browser tests.

Loopback is a local trust boundary, not authentication. This delivery was not deployed.

## Play

Open the case. Use Travel and the object list in each room. Ask the people who are in the room. Deductions and Write the account each take a conclusion plus two or three notebook entries. Hint repeats the current objective. Be more direct raises that same objective up to three times. Reset asks before it deletes the browser save.

## Layout

- `src/content` is the case. `src/engine` is the only place that decides what is true.
- `src/ui` draws state. It does not grade.
- `spoiler/MYSTERY-BIBLE.md` is the solution. It is not imported by the app. Do not read it if you want to play.
- `tests/engine` drives the reducer. `tests/browser` drives Chrome.
- `ACCEPTANCE-Cursor.md` is the scenario record.
- `docs/product-frame-Cursor.html` is the product brief, not the game.

## Saves

Key `last-broadcast-save-v1`, format 1. A non-cryptographic checksum detects accidents. Malformed, unknown-format, and invariant-failing saves stay in place and are copied to `last-broadcast-preserved-raw` until a confirmed reset. If another tab changes the stored checksum, this tab stops writing and asks you to load theirs or overwrite with this tab. A storage failure is shown. The case in the tab is kept.

Saves and the answer key can be read in the browser. They are not tamper-proof. An ending that the notes do not prove is rejected on load.

## Security notes

These are implementation choices, not an audit, and not a claim of production readiness.

- No secrets, no remote fetches, no server, no accounts.
- Player text is inserted with `textContent`. The case has no free-text field.
- Unreadable saves are not overwritten by autosave.
- Reset is confirmed, and a failed delete does not clear the tab.
- Gated prose is not placed in the document until it is logged or heard. It is still in the JavaScript bundle, because grading is local.

## Repurpose

The split between a catalog, a reducer, a notebook, and a graded account can hold another investigation: swap the catalog, keep the save and hint rules. The station theme would not travel with it.

## GitHub

About: A client-only radio mystery with notes, interviews, deductions, and an evidence-checked ending.

Topics: mystery, narrative-game, typescript, vite, accessibility, puzzle, browser-game, local-first, playwright

Handle for a future repo: mizcausevic-dev. This environment had no git remote, so nothing was pushed.
