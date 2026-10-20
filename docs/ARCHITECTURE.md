# Architecture

The game is a static page. Progress changes only in `dispatch` (`js/engine.js`). The view renders `project(state)` and does not import `js/content.js`.

## State

A play state holds the phase (`title`, `play`, `ending`), the current room, and growing lists: inspected objects, evidence, asked topics, deductions, unread ids, hint pin, hint count, and accusation count. Evidence and statements share one list. Deductions are separate. Nothing in those lists is removed except by a confirmed reset.

`project` copies the fields the screen needs. Locked topic labels, deduction supports, accusation answer keys, unused hint lines, and the ending stay out of it. They remain in the bundle. That is not a secrecy claim.

## Actions

`START`, `MOVE`, `INSPECT`, `ASK`, `DEDUCE`, `ACCUSE`, `HINT`, `ACK`, `CLEAR_FEEDBACK`.

An action from the wrong phase or the wrong room, a locked topic, an unknown id, or a malformed form returns the same state and an error code. A wrong conclusion or a wrong explanation writes feedback and, for an explanation, the attempt count. It does not delete evidence.

Inspecting the same object twice does not append the evidence again. Asking the same topic twice does not append the statement again.

## Prerequisites

Topics and deductions declare conditions: `hasEvidence`, `hasDeduction`, `hasTopic`, `all`, `any`, `not`, `supportReady`, `phasePlay`, `evidenceAtLeast`, `never`. `js/validate.js` checks that every referenced id exists, every evidence row has one producer, and every topic and deduction can be reached from an empty notebook because its requirements are physical evidence or earlier statements.

A deduction accepts a choice plus two or three notebook ids. A support set matches when one authored set is contained in the player's selection. Extra held entries do not fail a real pair.

## Explanations

The form is four choices and exactly three notebook entries. Success needs the authored choice combination and a trio that covers both the exit and the file contradiction. The cover rule is `supportCovers` in the engine. Right choices with the wrong three entries are an insufficient explanation, not a win. The feedback strings do not name the missing combination.

## Hints

Each objective has a priority, a completion condition, an "already possible" condition, and three lines. The selector keeps the current objective while it is still possible and unfinished. The first request is line 0. The next request on that same objective advances one line, then stops at the third. When the objective completes, the next request picks the next open objective and starts again at line 0.

## Saves

Key `tlb-save-v1`. Settings use `tlb-settings-v1` and are not inside the progress blob.

Version 1 is current. Version 0 (`room`, `clues`, `chats`) migrates, then the same validator accepts or rejects the result. Any other version is invalid. An invalid load does not write back. The player can download the raw text or erase it on purpose.

Before a write, the stored revision must still be the revision this tab last read or wrote. Otherwise the tab stops and asks to load the other night or overwrite. A forced overwrite uses a revision higher than the one it replaces.

Quota and security errors leave the in-memory night playable and say that it is not stored.

## Solvability

`tests/reachability.test.js` finishes the case in two orders, skips the optional clues on one of them, and finishes again after a wrong explanation. It also checks that the required objects can still be inspected from the opening state. It does not enumerate every subset of the notebook. The argument for the rest is that play actions only add ids, and the required actions stay available. The ending is the one terminal phase.

## Spoiler boundary

Normal UI text for locked topics is not rendered. The ending is added to the projection only in the ending phase. Tests check both. View source still contains the case.
