// Storage, multi-tab writes, and the reducer. The view confirms resets before calling RESET.

import { createInitialState, dispatch, project } from "./engine.js";
import { commit, loadGame, loadSettings, planWrite, SAVE_KEY, saveSettings } from "./save.js";

const BLOCKED = new Set(["BEGIN", "CONTINUE", "INSPECT", "MOVE", "ASK", "DEDUCE", "ACCUSE", "HINT", "ACK"]);

export function createController({ storage, now = () => Date.now(), uuid = () => crypto.randomUUID() }) {
  let session = { id: uuid(), baseRev: 0 };
  let state = createInitialState();
  let view = "title";
  let banners = [];
  let conflict = null;
  let heldRaw = null;
  let saveBlocked = false;
  let canContinue = null;
  let settings = loadSettings(storage);

  const loaded = loadGame(storage);
  if (loaded.status === "unavailable") banners = ["storage-off"];
  else if (loaded.status === "invalid") {
    view = "recovery";
    heldRaw = loaded.raw;
    saveBlocked = true;
  } else if (loaded.status === "ok") {
    state = loaded.save.state;
    session.baseRev = loaded.save.rev;
    canContinue = state.phase;
  }

  function snapshot() {
    return {
      project: project(state),
      view,
      banners: banners.slice(),
      conflict: conflict ? { reason: conflict.reason } : null,
      saveBlocked,
      canContinue,
      settings: { tone: settings.tone, volume: settings.volume },
      heldRaw,
    };
  }

  function persist(force = false) {
    if (saveBlocked) return;
    const result = commit(
      storage,
      state,
      { sessionId: session.id, baseRev: session.baseRev, now },
      { force },
    );
    if (result.ok) {
      session.baseRev = result.rev;
      banners = banners.filter((item) => item !== "storage-failed");
      conflict = null;
      return;
    }
    if (result.reason === "conflict") conflict = { reason: result.reason, raw: result.storedRaw };
    else if (!banners.includes("storage-failed")) banners.push("storage-failed");
  }

  function adopt(raw) {
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return false;
    }
    const check = loadGame({
      getItem(key) {
        return key === SAVE_KEY ? raw : null;
      },
    });
    if (check.status !== "ok") return false;
    state = check.save.state;
    session.baseRev = check.save.rev;
    canContinue = state.phase;
    view = state.phase === "ending" ? "ending" : "play";
    conflict = null;
    return parsed;
  }

  function handle(action) {
    if (!action || typeof action.type !== "string") return snapshot();
    if (conflict && !["LOAD_OTHER", "OVERWRITE", "DISMISS_CONFLICT", "RESET"].includes(action.type)) return snapshot();
    if (saveBlocked && BLOCKED.has(action.type)) return snapshot();

    if (action.type === "BEGIN") {
      state = dispatch(createInitialState(), { type: "START" }).state;
      view = "play";
      canContinue = "play";
      conflict = null;
      persist(true);
      return snapshot();
    }
    if (action.type === "CONTINUE") {
      if (canContinue === "play") view = "play";
      if (canContinue === "ending") view = "ending";
      return snapshot();
    }
    if (action.type === "RESET") {
      try {
        storage.removeItem(SAVE_KEY);
      } catch {
        if (!banners.includes("storage-failed")) banners.push("storage-failed");
      }
      saveBlocked = false;
      heldRaw = null;
      conflict = null;
      canContinue = null;
      session = { id: uuid(), baseRev: 0 };
      state = createInitialState();
      view = "title";
      return snapshot();
    }
    if (action.type === "PLAY_ANYWAY") {
      if (!saveBlocked) return snapshot();
      state = dispatch(createInitialState(), { type: "START" }).state;
      view = "play";
      return snapshot();
    }
    if (action.type === "LOAD_OTHER") {
      if (conflict?.raw) adopt(conflict.raw);
      return snapshot();
    }
    if (action.type === "OVERWRITE") {
      if (conflict) persist(true);
      return snapshot();
    }
    if (action.type === "DISMISS_CONFLICT") {
      conflict = null;
      return snapshot();
    }
    if (action.type === "SET_TONE") {
      settings = { ...settings, tone: action.on === true };
      saveSettings(storage, settings);
      return snapshot();
    }
    if (action.type === "SET_VOLUME") {
      const volume = typeof action.volume === "number" ? Math.min(1, Math.max(0, action.volume)) : settings.volume;
      settings = { ...settings, volume };
      saveSettings(storage, settings);
      return snapshot();
    }
    if (action.type === "NOTE_EXTERNAL") {
      let raw = null;
      try {
        raw = storage.getItem(SAVE_KEY);
      } catch {
        return snapshot();
      }
      const plan = planWrite(raw, session.baseRev);
      if (plan.action === "conflict") conflict = { reason: plan.reason, raw };
      return snapshot();
    }

    const result = dispatch(state, action);
    if (!result.ok) return { ...snapshot(), error: result.error };
    const changed = result.state !== state;
    state = result.state;
    if (state.phase === "ending") {
      view = "ending";
      canContinue = "ending";
    }
    if (changed && !saveBlocked) persist(false);
    return { ...snapshot(), error: null, events: result.events };
  }

  return { handle, snapshot, noteExternalRaw: (raw) => handle({ type: "NOTE_EXTERNAL", raw }) };
}
