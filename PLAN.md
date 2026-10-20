# Plan: The Last Broadcast

Started: 2026-10-20T18:47:54Z (UTC). This file is the working plan, not a claim that every step is already done. Status lives in `PROGRESS.md`.

## Architecture

Client-only static game. No backend, no build step, no paid service, no runtime network calls.

- `js/content.js` holds the mystery. It is data: locations, objects, evidence, topics, deductions, hints, accusation copy, ending.
- `js/engine.js` is the only progression path. `dispatch(state, action)` is a pure reducer. `project(state)` is the player-facing model and omits locked text, support keys, and the ending until success.
- `js/save.js` versions saves, migrates only v0 to v1, rejects anything else, and plans multi-tab writes.
- `js/controller.js` binds the reducer to storage.
- `js/view.js` renders from the projection. It does not import `content.js`.
- `js/validate.js` checks ids, references, conditions, effects, and that every evidence item has one producer.
- Tests run in Node. Browser checks use system Chrome through Playwright.

A client-only app is the whole design. The solution is in the bundle. Saves are not tamper-proof.

## Milestones

1. Mystery bible and content schema, with the accusation defined as an explanation rather than a murder charge.
2. Reducer, validation, saves, hints.
3. Playable interface from title through ending.
4. Logic tests, two investigation orders, failure recovery, reachability argument.
5. Browser playthrough of the real controls, then fix what that run shows.

## Priorities

1. Finish a start-to-finish case a person can play.
2. Reject bad actions, keep progress, hint the next real gap, recover bad saves.
3. Atmosphere, room tone, and extra polish after the loop is proven.

## Scope

In: 4 locations, 3 suspects, 12 evidence items, gated interviews, 4 deductions, notebook, structured explanation, hints, local saves, one ending.

Out: multiplayer, procedural cases, accounts, free-text grading, an editor, a backend, external assets, a countdown.

## Assumptions

- The player is Rowan Hale, a civilian archivist, not a detective with police powers.
- "Accusation" means a supported explanation of the disappearance and the conduct that caused it.
- Confirming a reset is a view responsibility. The reducer will obey a confirmed reset.
- Exhaustive power-set search is not the solvability proof. Monotonic progress plus scripted finishes is.
- GitHub push happens only if credentials exist. They did not at inspection.
