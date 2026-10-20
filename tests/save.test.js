import assert from "node:assert/strict";
import test from "node:test";
import { createController } from "../js/controller.js";
import { createInitialState, dispatch } from "../js/engine.js";
import { SAVE_KEY, SETTINGS_KEY, commit, loadGame, migrate, planWrite, validateSave } from "../js/save.js";

function memory(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
  };
}

function clock(start = 1_000) {
  let value = start;
  return () => {
    value += 10;
    return value;
  };
}

test("a v0 save migrates and a later version does not", () => {
  const migrated = migrate({
    v: 0,
    room: "archive",
    clues: ["ev-booth-log", "stmt-ellis-where"],
    chats: ["ellis-where"],
  });
  assert.equal(migrated.ok, true);
  const checked = validateSave(migrated.value);
  assert.equal(checked.ok, true, checked.reason);
  assert.equal(checked.value.state.locationId, "archive");
  assert.ok(checked.value.state.evidence.includes("ev-booth-log"));
  const storage = memory({
    [SAVE_KEY]: JSON.stringify({ v: 0, room: "booth", clues: ["ev-board"], chats: [] }),
  });
  const loaded = loadGame(storage);
  assert.equal(loaded.status, "ok");
  assert.equal(storage.getItem(SAVE_KEY).includes("\"v\":0"), true);
  const bad = loadGame(memory({ [SAVE_KEY]: JSON.stringify({ v: 2, state: {} }) }));
  assert.equal(bad.status, "invalid");
  assert.equal(bad.reason, "version");
});

test("malformed saves are kept byte for byte", () => {
  const raw = "{not json";
  const storage = memory({ [SAVE_KEY]: raw });
  const loaded = loadGame(storage);
  assert.equal(loaded.status, "invalid");
  assert.equal(loaded.reason, "json");
  const controller = createController({ storage, uuid: () => "tab", now: clock() });
  controller.handle({ type: "BEGIN" });
  assert.equal(storage.getItem(SAVE_KEY), raw);
  controller.handle({ type: "RESET" });
  assert.equal(storage.getItem(SAVE_KEY), null);
});

test("quota failure keeps the night in memory and the old save intact", () => {
  const storage = memory();
  let fail = false;
  const flaky = {
    getItem: (key) => storage.getItem(key),
    setItem: (key, value) => {
      if (fail) {
        const error = new Error("quota");
        error.name = "QuotaExceededError";
        throw error;
      }
      storage.setItem(key, value);
    },
    removeItem: (key) => storage.removeItem(key),
  };
  const controller = createController({ storage: flaky, uuid: () => "tab", now: clock() });
  controller.handle({ type: "BEGIN" });
  const first = storage.getItem(SAVE_KEY);
  fail = true;
  const snap = controller.handle({ type: "INSPECT", id: "obj-log" });
  assert.ok(snap.banners.includes("storage-failed"));
  assert.ok(snap.project.notebook.evidence.some((item) => item.id === "ev-booth-log"));
  assert.equal(storage.getItem(SAVE_KEY), first);
});

test("continue preserves progress and settings stay separate", () => {
  const storage = memory();
  const now = clock();
  const first = createController({ storage, uuid: () => "tab-a", now });
  first.handle({ type: "BEGIN" });
  first.handle({ type: "INSPECT", id: "obj-log" });
  first.handle({ type: "SET_TONE", on: true });
  first.handle({ type: "SET_VOLUME", volume: 0.4 });
  const second = createController({ storage, uuid: () => "tab-b", now });
  const title = second.snapshot();
  assert.equal(title.canContinue, "play");
  assert.equal(title.view, "title");
  const resumed = second.handle({ type: "CONTINUE" });
  assert.equal(resumed.view, "play");
  assert.ok(resumed.project.notebook.evidence.some((item) => item.id === "ev-booth-log"));
  assert.equal(resumed.settings.tone, true);
  assert.equal(resumed.settings.volume, 0.4);
  const saved = JSON.parse(storage.getItem(SAVE_KEY));
  assert.equal(saved.state.tone, undefined);
  assert.ok(storage.getItem(SETTINGS_KEY).includes("0.4"));
});

test("a newer tab blocks an overwrite until the player chooses", () => {
  const storage = memory();
  const now = clock();
  const first = createController({ storage, uuid: () => "tab-a", now });
  first.handle({ type: "BEGIN" });
  const second = createController({ storage, uuid: () => "tab-b", now });
  second.handle({ type: "CONTINUE" });
  second.handle({ type: "MOVE", id: "lobby" });
  const blocked = first.handle({ type: "MOVE", id: "archive" });
  assert.ok(blocked.conflict);
  const stored = JSON.parse(storage.getItem(SAVE_KEY));
  assert.equal(stored.state.locationId, "lobby");
  assert.equal(stored.rev, 2);
  const loaded = first.handle({ type: "LOAD_OTHER" });
  assert.equal(loaded.conflict, null);
  assert.equal(loaded.project.locationId, "lobby");
  second.handle({ type: "MOVE", id: "dock" });
  const overwritten = first.handle({ type: "OVERWRITE" });
  assert.equal(overwritten.conflict, null);
  const after = JSON.parse(storage.getItem(SAVE_KEY));
  assert.equal(after.rev > 2, true);
  assert.equal(planWrite(storage.getItem(SAVE_KEY), 2).action, "conflict");
});

test("reset returns a clean title and drops the save", () => {
  const storage = memory();
  const controller = createController({ storage, uuid: () => "tab", now: clock() });
  controller.handle({ type: "BEGIN" });
  controller.handle({ type: "INSPECT", id: "obj-log" });
  const cleared = controller.handle({ type: "RESET" });
  assert.equal(cleared.view, "title");
  assert.equal(cleared.canContinue, null);
  assert.equal(cleared.project.phase, "title");
  assert.equal(storage.getItem(SAVE_KEY), null);
  const reloaded = createController({ storage, uuid: () => "tab-2", now: clock() });
  assert.equal(reloaded.snapshot().canContinue, null);
});

test("commit refuses a revision it did not last write", () => {
  const storage = memory();
  const state = dispatch(dispatch(createInitialState(), { type: "START" }).state, {
    type: "INSPECT",
    id: "obj-log",
  }).state;
  const wrote = commit(storage, state, { sessionId: "a", baseRev: 0, now: () => 5 });
  assert.equal(wrote.ok, true);
  const clash = commit(storage, state, { sessionId: "b", baseRev: 0, now: () => 6 });
  assert.equal(clash.ok, false);
  assert.equal(clash.reason, "conflict");
  assert.equal(JSON.parse(storage.getItem(SAVE_KEY)).sessionId, "a");
});
