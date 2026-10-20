# Decisions

## D1. Client-only Vite app

There is no server. Grading, hints, and saves run in the page. Loopback hosting is a development convenience, not authentication. No environment variables are required.

## D2. The act is not a homicide

Disappearance is not treated as murder. The responsible party, act, and motive are defined in `spoiler/MYSTERY-BIBLE.md` and checked by the solution key. This file does not restate the solution.

## D3. Supersets of a real proof are accepted

A deduction or accusation of two or three notes is accepted when the selected notes contain a full authored minimal set. An extra note the player already holds does not void the set. A set that merely overlaps is not enough. Equivalent minimal sets are listed in content, not improvised by the UI.

## D4. A finished deduction is itself evidence

The voluntary-exit deduction can be made only from the hold cart plus the dock reader or the parking checklist. An accusation that includes that deduction plus any second notebook entry is accepted, because requiring a specific extra key would be arbitrary. Raw-clue accusations still need the cart plus the dock or the parking note.

## D5. Saves

Format is exactly 1. There is no migrator. Malformed, checksum-mismatched, invariant-failing, and unknown-format saves are left in place and copied to `last-broadcast-preserved-raw`. They are removed only by a confirmed reset.

Checksum is a non-cryptographic djb2 of canonical JSON. It detects accidents, not a determined editor.

Multi-tab policy: before every write, the page re-reads storage. If the stored checksum is not the checksum this tab last loaded or wrote, the write is refused and a banner offers Load their save or Overwrite with this tab. Memory changes already made in the tab stay until the player chooses. This blocks a stale tab from clobbering a newer tab by incrementing its own revision.

Quota and other storage exceptions are shown. The in-memory case is kept. An unreadable save disables autosave until a confirmed reset, so a new game cannot destroy it.

## D6. Spoilers in the bundle, not in the document

The solution key and unread prose are in the JavaScript module because the page grades locally. They are not written into the document until the player has logged or heard them. There is no player-facing debug control. Failed accusations do not use a DOM attribute that names the internal outcome class.

## D7. Hints

One objective is kept until it is met. Asking again repeats it. "Be more direct" raises that same objective from level 1 to 3. A newly chosen objective starts at level 1 even if the click was an escalate after the previous objective was already met. Level 3 names a room, an object, a question, or note titles the player can already open. It does not name the correct accusation dropdowns.

## D8. Audio

Room tone is synthesized in the page with Web Audio after a click. No file is fetched. The written cartridge note is the evidence. Sound stays off until the player presses play, and Stop is always available while it plays.

## D9. Theme rule versus this UI

Standing dashboard guidance asks for seven themes. This game uses one night-station theme so the case reads as a place. The separate product frame, if shipped, is the themed summary. The game is not a dashboard.

## D10. Softlock argument is not an exhaustive search

Travel is never locked. Inspecting never removes a clue. Interviews gate questions, not clues. Failed accusations do not close the case. Two full action orders and a short order are executed in tests. An exhaustive state-space search was not run.

## D11. Filenames

`PLAN.md`, `PROGRESS.md`, and `DECISIONS.md` use the names required by the delivery contract. Other generated reports use a `-Cursor` suffix.
