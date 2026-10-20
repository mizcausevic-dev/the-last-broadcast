# The Last Broadcast

A short browser mystery. June Pell, the night engineer at WKXR, did not come out after the station's final night on air. You play Rowan Hale, the weekend archivist, and you have the building, three coworkers, and the paper.

Nothing in the game is a timer. The case is solvable with the sound off. Saves stay in this browser. There is no account and no server.

This repository uses the filenames the build brief asked for (`PLAN.md`, `PROGRESS.md`, `DECISIONS.md`). A standing filename suffix was not applied to those.

## Play

From this directory:

```bash
python3 -m http.server 4173
```

Open http://127.0.0.1:4173/

There is no build step. The pages are the game.

## Test

Node 22 or newer. No install is required for the logic tests:

```bash
node --test tests/*.test.js
```

Browser tests need system Google Chrome and the dev dependency:

```bash
npm install
node tests/browser/play.mjs
```

`npm install` is only for Playwright's driver. The served game does not import it.

## What you are playing

One case: four rooms, three people, twelve pieces of evidence, interviews that open from what you have already found, a deduction desk, and an explanation you file from the notebook. Hints can be asked for. They are not scored.

The solution is in the JavaScript bundle. Do not read `js/content.js`, `docs/MYSTERY-BIBLE.md`, or `docs/SPOILER-WALKTHROUGH.md` if you want to play first.

## Product

The Last Broadcast is a single-sitting investigation game for someone who wants the answer to depend on the record, not on guessing a name. You move through the station, keep a notebook, test conclusions, and file an explanation. Finishing the case is the end of the loop. This version does not charge, collect an address, or send analytics. The same reducer and content schema can hold another case, including a training incident or a museum "what happened" room, by replacing `js/content.js`.

## Layout

- `js/engine.js` is the only place progress changes.
- `js/content.js` is the case.
- `js/save.js` versions the save.
- `js/view.js` renders the projection. It does not import the case file.
- `docs/ARCHITECTURE.md` covers state, deductions, saves, and validation.
- `docs/ACCEPTANCE.md` is the scenario record.
- `PROGRESS.md` is what was actually run.
