# Acceptance results

Run on 2026-10-20. Logic tests: `node --test tests/*.test.js`, 24 passed, 0 failed. Browser tests: `node tests/browser/play.mjs` against http://127.0.0.1:4173/ with system Chrome, 28 passed, 0 failed.

The browser script is one scripted playthrough plus narrow, reduced-motion, malformed-save, and two-tab checks. It is not a first-time player study, and it does not measure how long a new player takes.

| # | Scenario | Result | How |
|---|---|---|---|
| 1 | Start and see the objective | PASS | Browser. Title names June, Rowan, Ellis's call, and the dawn inspection. Begin opens the booth. |
| 2 | Visit the locations | PASS | Browser. Booth, dock, and archive in the playthrough. Lobby in the second tab. |
| 3 | Repeat inspect, no duplicate | PASS | Browser. Booth log inspected twice. One notebook entry. |
| 4 | Topic opens from its prerequisite | PASS | Browser. Cal's dock question is absent, then present after the latch. |
| 5 | Revisit evidence | PASS | Browser. Notebook after a reload still has the binder. |
| 6 | Accepted deduction explains itself | PASS | Browser. File deduction shows the 12:06 print. |
| 7 | Rejected deduction does not block | PASS | Browser. "Still inside" is rejected. The dock conclusion is then accepted. |
| 8 | Wrong explanation, then continue | PASS | Browser. "Still in the station" stays on the play screen. |
| 9 | Right outline, weak support | PASS | Browser. Correct choices with the booth log, console, and reel do not end the case. |
| 10 | Supported ending through the UI | PASS | Browser. Ending screen after the dock deduction, the file deduction, and the note. |
| 11 | Second investigation order | PASS | State engine only (`reachability.test.js`, witness path, note never read). Not clicked in the browser. |
| 12 | Ending uses earlier facts | PASS | Unit. Ending anchors (times, Priya Shah, the ad labels, Tuesday, the headphone cup) are in the notebook corpus. Browser also showed the note before the ending, and the ending sentence was absent until success. |
| 13 | Actionable hint | PASS | Browser. First hint names the booth and not the solution. |
| 14 | Escalate a hint | PASS | Browser. The second request changes the line and still omits Priya and "substitute". Unit test also checks the third line and the stop. |
| 15 | Finished objectives drop out | PASS | Unit. After the log is read, the next hint is the archive, at level 0. |
| 16 | Impossible actions rejected | PASS | Unit. Wrong room, unknown ids, locked deduction. |
| 17 | Ids, references, conditions | PASS | Unit. `validateContent` on the shipped case, plus a broken fixture. |
| 18 | Required path from the start | PASS | Unit. Two finishes and the required objects. Not an exhaustive power-set search. |
| 19 | Save and reload | PASS | Browser. Reload, Continue, binder still in the notebook. |
| 20 | Bad saves are not overwritten | PASS | Browser. `{nope` stays `{nope` after "Play without saving". Unit also rejects version 2 and keeps the raw string until an explicit reset. |
| 21 | Storage failure | PASS | Unit. A throwing `setItem` keeps the new evidence in memory and the previous save unchanged. A browser with storage fully disabled was not run. |
| 22 | Two tabs | PASS | Browser. The second tab's move to the lobby remains the stored room. Unit covers load-versus-overwrite. |
| 23 | Reset asks first | PASS | Browser. Cancel leaves the ending and the save. Confirm returns to the title and removes the key. |
| 24 | Keyboard | PASS | Browser. Tab stays inside the notebook dialog. Escape returns to the notebook button. |
| 25 | Dialog focus | PASS | Same browser check as 24. Opening the dialog moves focus to it. |
| 26 | Narrow screen and reduced motion | PASS | Browser at 390 by 844. No sideways overflow. Notebook box 390 by 349. Lamp animation computed as `1e-05s` (0.01ms). |
| 27 | Solution not shown early | PASS | Browser. No Priya on the title. Ending sentence absent before the successful file. Gated topic label absent before the latch. |
| 28 | Browser playthrough | PASS | The script above, through the real buttons. |

Automated totals, separate from the table: 24 logic tests passed. 28 browser checks passed. The witness-first finish is a logic test, not a second browser playthrough.
