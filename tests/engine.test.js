import assert from "node:assert/strict";
import test from "node:test";
import { createInitialState, dispatch, getAccusationForm, project } from "../js/engine.js";

function start() {
  const result = dispatch(createInitialState(), { type: "START" });
  assert.equal(result.ok, true);
  return result.state;
}

function act(state, action) {
  const result = dispatch(state, action);
  assert.equal(result.ok, true, `${action.type} ${action.id || ""} ${result.error || ""}`);
  return result.state;
}

test("start puts the player in the booth", () => {
  const state = start();
  assert.equal(state.phase, "play");
  assert.equal(state.locationId, "booth");
  assert.equal(state.evidence.length, 0);
});

test("inspect is idempotent and rejects the wrong room", () => {
  let state = start();
  const denied = dispatch(state, { type: "INSPECT", id: "obj-latch" });
  assert.equal(denied.ok, false);
  assert.equal(denied.error, "wrong-room");
  assert.equal(denied.state.evidence.length, 0);
  state = act(state, { type: "INSPECT", id: "obj-log" });
  assert.deepEqual(state.evidence, ["ev-booth-log"]);
  const again = act(state, { type: "INSPECT", id: "obj-log" });
  assert.deepEqual(again.evidence, ["ev-booth-log"]);
  assert.equal(again.lastFeedback.kind, "repeat");
});

test("topics stay locked until their evidence exists", () => {
  let state = start();
  state = act(state, { type: "MOVE", id: "dock" });
  const locked = dispatch(state, { type: "ASK", id: "cal-saw" });
  assert.equal(locked.ok, false);
  assert.equal(locked.error, "locked");
  const wrongRoom = dispatch(start(), { type: "ASK", id: "ellis-where" });
  assert.equal(wrongRoom.error, "wrong-room");
  state = act(state, { type: "INSPECT", id: "obj-latch" });
  state = act(state, { type: "ASK", id: "cal-saw" });
  assert.ok(state.evidence.includes("stmt-cal-saw"));
  const repeat = act(state, { type: "ASK", id: "cal-saw" });
  assert.equal(repeat.evidence.filter((id) => id === "stmt-cal-saw").length, 1);
});

test("bad deduction does not remove evidence", () => {
  let state = start();
  state = act(state, { type: "MOVE", id: "lobby" });
  state = act(state, { type: "INSPECT", id: "obj-lock" });
  state = act(state, { type: "INSPECT", id: "obj-hook" });
  const before = state.evidence.slice();
  state = act(state, {
    type: "DEDUCE",
    id: "ded-not-front",
    choice: "front-yes",
    support: ["ev-lock", "ev-hook"],
  });
  assert.deepEqual(state.evidence, before);
  assert.equal(state.deductions.length, 0);
  assert.equal(state.lastFeedback.kind, "rejected");
  state = act(state, {
    type: "DEDUCE",
    id: "ded-not-front",
    choice: "front-no",
    support: ["ev-lock", "ev-hook", "ev-lock"],
  });
  assert.deepEqual(state.deductions, ["ded-not-front"]);
});

test("unsupported deduction with the right choice stays open", () => {
  let state = start();
  state = act(state, { type: "MOVE", id: "archive" });
  state = act(state, { type: "INSPECT", id: "obj-binder" });
  state = act(state, { type: "INSPECT", id: "obj-tray" });
  state = act(state, { type: "INSPECT", id: "obj-pledge" });
  state = act(state, {
    type: "DEDUCE",
    id: "ded-file-swap",
    choice: "swap",
    support: ["ev-printout", "ev-memo"],
  });
  assert.equal(state.deductions.length, 0);
  assert.match(state.lastFeedback.text, /do not carry/i);
});

test("hints escalate one objective and then move on", () => {
  let state = start();
  state = act(state, { type: "HINT" });
  assert.equal(state.hint.objectiveId, "hint-start");
  assert.equal(state.hint.level, 0);
  const first = state.lastFeedback.text;
  state = act(state, { type: "HINT" });
  assert.equal(state.hint.level, 1);
  assert.notEqual(state.lastFeedback.text, first);
  state = act(state, { type: "HINT" });
  assert.equal(state.hint.level, 2);
  const explicit = state.lastFeedback.text;
  state = act(state, { type: "HINT" });
  assert.equal(state.lastFeedback.text, explicit);
  state = act(state, { type: "INSPECT", id: "obj-log" });
  state = act(state, { type: "HINT" });
  assert.equal(state.hint.objectiveId, "hint-files");
  assert.equal(state.hint.level, 0);
  assert.doesNotMatch(state.lastFeedback.text, /booth log/i);
});

test("early accusation is recoverable and a right outline is not a win", () => {
  let state = start();
  state = act(state, { type: "INSPECT", id: "obj-log" });
  state = act(state, { type: "INSPECT", id: "obj-board" });
  state = act(state, { type: "INSPECT", id: "obj-reel" });
  const held = state.evidence.slice();
  state = act(state, {
    type: "ACCUSE",
    payload: {
      status: "inside",
      route: "unknown",
      purpose: "unclear",
      conduct: "none",
      support: held,
    },
  });
  assert.equal(state.phase, "play");
  assert.equal(state.lastFeedback.result, "inside");
  assert.deepEqual(state.evidence, held);
  state = act(state, { type: "MOVE", id: "archive" });
  state = act(state, { type: "INSPECT", id: "obj-binder" });
  state = act(state, { type: "INSPECT", id: "obj-tray" });
  state = act(state, { type: "INSPECT", id: "obj-note" });
  state = act(state, { type: "MOVE", id: "dock" });
  state = act(state, { type: "INSPECT", id: "obj-latch" });
  state = act(state, {
    type: "DEDUCE",
    id: "ded-file-swap",
    choice: "swap",
    support: ["ev-binder", "ev-printout"],
  });
  state = act(state, {
    type: "DEDUCE",
    id: "ded-dock-exit",
    choice: "dock",
    support: ["ev-note", "ev-dock"],
  });
  state = act(state, {
    type: "ACCUSE",
    payload: {
      status: "left",
      route: "dock",
      purpose: "deliver",
      conduct: "ellis",
      support: ["ev-booth-log", "ev-board", "ev-reel"],
    },
  });
  assert.equal(state.phase, "play");
  assert.equal(state.lastFeedback.result, "insufficient");
  state = act(state, {
    type: "ACCUSE",
    payload: {
      status: "taken",
      route: "dock",
      purpose: "deliver",
      conduct: "ellis",
      support: ["ded-dock-exit", "ded-file-swap", "ev-note"],
    },
  });
  assert.equal(state.lastFeedback.result, "incorrect");
  state = act(state, {
    type: "ACCUSE",
    payload: {
      status: "left",
      route: "dock",
      purpose: "deliver",
      conduct: "ellis",
      support: ["ded-dock-exit", "ded-file-swap", "ev-note"],
    },
  });
  assert.equal(state.phase, "ending");
  assert.equal(state.endingId, "handoff");
  assert.equal(dispatch(state, { type: "ACCUSE", payload: {} }).error, "phase");
});

test("projection hides the ending, locked topics, and answer keys", () => {
  const state = start();
  const view = project(state);
  const blob = JSON.stringify(view);
  assert.equal(view.ending, null);
  assert.doesNotMatch(blob, /Priya/);
  assert.doesNotMatch(blob, /substitute/);
  assert.doesNotMatch(blob, /Dawn is a handoff/);
  assert.equal(view.deductions.length, 0);
  const form = getAccusationForm();
  assert.equal(JSON.stringify(form).includes("\"success\""), false);
  let dock = act(state, { type: "MOVE", id: "dock" });
  assert.deepEqual(
    project(dock).room.people[0].topics.map((item) => item.id),
    ["cal-ask"],
  );
  dock = act(dock, { type: "INSPECT", id: "obj-latch" });
  assert.ok(project(dock).room.people[0].topics.some((item) => item.id === "cal-saw"));
  assert.equal(project(dock).room.people[0].topics.find((item) => item.id === "cal-saw").speech, null);
});

test("unknown actions do not mutate progress", () => {
  const state = start();
  const moved = dispatch(state, { type: "MOVE", id: "roof" });
  assert.equal(moved.ok, false);
  assert.equal(moved.state, state);
  assert.equal(dispatch(state, { type: "INSPECT", id: "nope" }).ok, false);
  assert.equal(dispatch(state, { type: "DEDUCE", id: "ded-file-swap", choice: "swap", support: ["ev-binder", "ev-printout"] }).error, "locked");
});
