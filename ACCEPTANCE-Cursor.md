# Acceptance results

Observed 2026-10-20. Counts below are from commands run in this environment. Engine tests and browser tests are separate. Automation time is not a first-play time.

## Commands and counts

| Command | Result |
|---|---|
| `npx tsc --noEmit && npx vitest run` in `/agent` | 15 tests passed. Vitest reported 16ms of test time, 328ms total, at 20:21:02Z. |
| `npx playwright test` in `/agent` | 13 tests passed. Playwright reported 11.1s at 20:23:20Z. Chrome channel. |
| `npm run build` | Passed at 20:22:04Z. Vite 7.3.7, 15 modules, built in 214ms. |
| `npm ci && npx vitest run && npx tsc --noEmit` in a copy at `/tmp/lb-ci` | Passed. 15 engine tests. Lockfile install added 56 packages. |

No test was weakened to obtain a pass.

## Scenarios

### 1. Ending by real actions, then another order

PASS, engine and browser, with the split below.

- Engine catalog order, including every room, note, interview, and deduction, reaches `phase: "ended"`. Test: `reaches the ending in catalog order`.
- Engine second order (office, production, studio, lobby) uses different proof sets and also ends. Test: `reaches the ending in another room order and another proof`.
- Browser click path ends after a rejected account, then an accepted one. Test: `reaches the ending, rejects a wrong account, and keeps a repeated note`.
- Browser second click path uses another room order and another note pair. Test: `reaches the ending by another room order`.
- The browser paths do not click every interview. The engine catalog-order test does.

### 2. Repeats, gates, deductions, wrong accounts

PASS in the engine. Browser covers repeat, gate, and one wrong account. Lucky-guess and insufficient accounts were not clicked in Chrome.

- Repeated inspect does not add a second note. Engine and browser.
- A confront is rejected before its note, then kept for review. Engine. In Chrome the same question is disabled, then enabled, and the answer appears in the notebook.
- Wrong deduction option, missing proof, reversed notes, and a three-note superset of a real pair: engine only.
- Wrong account stays in play and keeps the notes. Engine and browser (`Declined accounts: 1`, no ending).
- Lucky guess and insufficient support: engine only. The page does not put the internal class name on an element.

### 3. Ending facts and hints

PASS for the checks that were run.

- A minimal engine win's ending text omits facts whose notes were never logged (roof, soup time, camera, rider wording). Blocks declare the note and statement ids they require.
- The short browser win's ending omits the roof and the soup time. The other browser win omits the dock PIN line because that note was never logged, and it includes the soup time because that note was logged.
- Engine hints: one objective is kept, level 2 names the object, level 3 can be repeated with a ceiling sentence, logging the object clears it, and the next hint starts at level 1 on a different objective.
- Browser hints: level 1 does not name the clipboard, the next level does, logging it removes the hint, and the following hint does not name that clipboard.
- Browser level 3 copy was not clicked. The engine test covers that sentence.

### 4. Impossible actions and references

PASS in the engine. Direct impossible calls were not issued from the page, because the page does not expose a debug action runner.

- Unknown room, object in another room, one supporting note, notes not held, and actions before the case is open: rejected, state unchanged.
- Shipped content validates. A cloned catalog with a dangling grant does not.
- Canary sentences are absent from labels and prompts.
- Two complete action lists reach the ending. That is not an exhaustive state search. Softlock freedom was not proved by search. Travel is not locked and logging does not remove notes. See DECISIONS D10.

### 5. Saves

PASS, with quota labeled as simulated.

- Round-trip of a finished case, checksum mismatch, format 99, broken JSON, oversized payload, and an ending with no resolution: engine.
- Unreadable raw is preserved once and not replaced by a later copy. A write is blocked while that hold is on. A second tab's checksum conflict is refused unless `force` is set. `QuotaExceededError` returns `quota`. A throwing delete leaves the keys in place. Reset without `confirm` does not change state.
- Chrome: reload then Continue shows the logged note. Format 99 survives Play in this tab only, survives Cancel, and is removed by the confirmed delete.
- Chrome quota: `Storage.prototype.setItem` throws for the save key only. The status says storage is full. The note still appears. This is not a filled disk.
- Chrome, two pages, one context: the second open does not overwrite the first. Overwrite, then Load their save, replaces the first page's notes with the second page's.

### 6. Keyboard, narrow screen, spoilers, motion

PASS for the checks that were run.

- Reset dialog: Cancel is focused, Tab and Shift+Tab cycle, Escape closes, the note remains, reload can continue. This is not a keyboard-only playthrough of the whole case.
- Viewport 390 by 844: `scrollWidth` is within 1px of `clientWidth`, and a note heading is visible.
- `prefers-reduced-motion: reduce`: the object list and a travel button are visible. Animation timings were not measured.
- Before play, the document text and HTML do not contain the three canary sentences. After the hold cart is logged, its sentence is visible. A saved hint containing an `<img onerror>` is shown as text. No image element is created and `window.__pwn` stays unset.
- Engine walkthroughs and browser click paths are listed separately above. The 11.1s figure is Playwright's runner time for 13 tests, not a person's first play.

## Not implemented

- Accounts, multiplayer, runtime AI, free-text grading, network audio, and deployment.
- A migrator for any save format other than 1.
- An exhaustive softlock search.
