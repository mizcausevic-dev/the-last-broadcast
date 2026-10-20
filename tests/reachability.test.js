import assert from "node:assert/strict";
import test from "node:test";
import { createInitialState, dispatch } from "../js/engine.js";

function run(actions) {
  let state = dispatch(createInitialState(), { type: "START" }).state;
  for (const action of actions) {
    const result = dispatch(state, action);
    assert.equal(result.ok, true, `${JSON.stringify(action)} -> ${result.error}`);
    for (const key of ["evidence", "topicsAsked", "deductions", "inspected"]) {
      for (const id of state[key]) assert.ok(result.state[key].includes(id), id);
    }
    state = result.state;
  }
  return state;
}

const fileDeduction = {
  type: "DEDUCE",
  id: "ded-file-swap",
  choice: "swap",
  support: ["ev-binder", "ev-printout"],
};

function win(support) {
  return {
    type: "ACCUSE",
    payload: {
      status: "left",
      route: "dock",
      purpose: "deliver",
      conduct: "ellis",
      support,
    },
  };
}

test("a note-and-dock order reaches the ending without optional clues", () => {
  const state = run([
    { type: "MOVE", id: "archive" },
    { type: "INSPECT", id: "obj-binder" },
    { type: "INSPECT", id: "obj-tray" },
    { type: "INSPECT", id: "obj-note" },
    { type: "MOVE", id: "dock" },
    { type: "INSPECT", id: "obj-latch" },
    fileDeduction,
    { type: "DEDUCE", id: "ded-dock-exit", choice: "dock", support: ["ev-note", "ev-dock"] },
    win(["ev-note", "ev-dock", "ded-file-swap"]),
  ]);
  assert.equal(state.phase, "ending");
  assert.equal(state.evidence.includes("ev-pad"), false);
  assert.equal(state.evidence.includes("ev-memo"), false);
  assert.equal(state.evidence.includes("ev-booth-log"), false);
});

test("a witness-first order also reaches the ending", () => {
  const state = run([
    { type: "MOVE", id: "dock" },
    { type: "INSPECT", id: "obj-peg" },
    { type: "INSPECT", id: "obj-latch" },
    { type: "ASK", id: "cal-ask" },
    { type: "ASK", id: "cal-saw" },
    { type: "MOVE", id: "lobby" },
    { type: "INSPECT", id: "obj-lock" },
    { type: "INSPECT", id: "obj-hook" },
    { type: "ASK", id: "ellis-where" },
    { type: "MOVE", id: "archive" },
    { type: "INSPECT", id: "obj-tray" },
    { type: "INSPECT", id: "obj-binder" },
    { type: "DEDUCE", id: "ded-dock-exit", choice: "dock", support: ["ev-dock", "stmt-cal-saw"] },
    fileDeduction,
    win(["ded-dock-exit", "ded-file-swap", "stmt-cal-saw"]),
  ]);
  assert.equal(state.phase, "ending");
  assert.equal(state.evidence.includes("ev-note"), false);
});

test("wrong explanations and off-path actions leave the finish available", () => {
  let state = dispatch(createInitialState(), { type: "START" }).state;
  state = dispatch(state, { type: "MOVE", id: "archive" }).state;
  state = dispatch(state, { type: "INSPECT", id: "obj-binder" }).state;
  state = dispatch(state, { type: "INSPECT", id: "obj-tray" }).state;
  state = dispatch(state, { type: "INSPECT", id: "obj-note" }).state;
  const bad = dispatch(state, {
    type: "ACCUSE",
    payload: {
      status: "taken",
      route: "front",
      purpose: "theft",
      conduct: "cal",
      support: ["ev-binder", "ev-printout", "ev-note"],
    },
  });
  assert.equal(bad.ok, true);
  assert.equal(bad.state.phase, "play");
  const denied = dispatch(bad.state, { type: "ASK", id: "cal-saw" });
  assert.equal(denied.ok, false);
  const finished = runFrom(bad.state, [
    { type: "MOVE", id: "dock" },
    { type: "INSPECT", id: "obj-latch" },
    fileDeduction,
    { type: "DEDUCE", id: "ded-dock-exit", choice: "dock", support: ["ev-note", "ev-dock", "ev-binder"] },
    win(["ded-dock-exit", "ev-binder", "ev-printout"]),
  ]);
  assert.equal(finished.phase, "ending");
});

function runFrom(state, actions) {
  for (const action of actions) {
    const result = dispatch(state, action);
    assert.equal(result.ok, true, result.error);
    state = result.state;
  }
  return state;
}

test("required producers stay available from the initial play state", () => {
  const state = dispatch(createInitialState(), { type: "START" }).state;
  for (const id of ["obj-binder", "obj-tray", "obj-note", "obj-latch"]) {
    const room = id === "obj-latch" ? "dock" : "archive";
    const moved = dispatch(state, { type: "MOVE", id: room }).state;
    const seen = dispatch(moved, { type: "INSPECT", id });
    assert.equal(seen.ok, true, id);
  }
});
