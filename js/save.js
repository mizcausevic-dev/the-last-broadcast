// Versioned local saves. Unknown versions are refused and never written back.

import { content } from "./content.js";
import { createInitialState } from "./engine.js";

export const SAVE_KEY = "tlb-save-v1";
export const SETTINGS_KEY = "tlb-settings-v1";
export const SAVE_LIMIT = 100_000;

const EVIDENCE_IDS = new Set(content.evidence.map((item) => item.id));
const TOPIC_IDS = new Set(content.topics.map((item) => item.id));
const DEDUCTION_IDS = new Set(content.deductions.map((item) => item.id));
const OBJECT_IDS = new Set(content.objects.map((item) => item.id));
const LOCATION_IDS = new Set(content.locations.map((item) => item.id));
const HINT_IDS = new Set(content.hints.map((item) => item.id));
const TOPIC_EVIDENCE = new Map(content.topics.map((item) => [item.id, item.evidenceId]));

function stringList(value, allowed, max) {
  if (!Array.isArray(value) || value.length > max) return null;
  const out = [];
  for (const item of value) {
    if (typeof item !== "string" || !allowed.has(item) || out.includes(item)) return null;
    out.push(item);
  }
  return out;
}

function integer(value, min, max) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) return null;
  return value;
}

export function defaultSettings() {
  return { tone: false, volume: 0.2 };
}

export function loadSettings(storage) {
  try {
    const raw = storage.getItem(SETTINGS_KEY);
    if (!raw || raw.length > 2000) return defaultSettings();
    const data = JSON.parse(raw);
    const volume = typeof data.volume === "number" && data.volume >= 0 && data.volume <= 1 ? data.volume : 0.2;
    return { tone: data.tone === true, volume };
  } catch {
    return defaultSettings();
  }
}

export function saveSettings(storage, settings) {
  const payload = {
    tone: settings.tone === true,
    volume: typeof settings.volume === "number" ? Math.min(1, Math.max(0, settings.volume)) : 0.2,
  };
  try {
    storage.setItem(SETTINGS_KEY, JSON.stringify(payload));
    return { ok: true };
  } catch {
    return { ok: false, reason: "quota" };
  }
}

export function migrate(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return { ok: false, reason: "shape" };
  if (data.v === 0) return { ok: true, value: migrateV0(data) };
  if (data.v === 1) return { ok: true, value: data };
  return { ok: false, reason: "version" };
}

function migrateV0(data) {
  const blank = createInitialState();
  return {
    v: 1,
    rev: 1,
    sessionId: "migrated-v0",
    updatedAt: 0,
    state: {
      ...blank,
      phase: "play",
      locationId: typeof data.room === "string" ? data.room : "booth",
      evidence: Array.isArray(data.clues) ? data.clues.filter((item) => typeof item === "string") : [],
      topicsAsked: Array.isArray(data.chats) ? data.chats.filter((item) => typeof item === "string") : [],
      inspected: [],
    },
  };
}

export function validateSave(data) {
  if (!data || data.v !== 1 || !data.state || typeof data.state !== "object") return { ok: false, reason: "shape" };
  const rev = integer(data.rev, 0, 1_000_000);
  const updatedAt = typeof data.updatedAt === "number" && Number.isFinite(data.updatedAt) ? data.updatedAt : null;
  const sessionId = typeof data.sessionId === "string" && data.sessionId.length > 0 && data.sessionId.length <= 80
    ? data.sessionId
    : null;
  if (rev == null || updatedAt == null || !sessionId) return { ok: false, reason: "meta" };
  const phase = data.state.phase;
  if (phase !== "play" && phase !== "ending") return { ok: false, reason: "phase" };
  if (!LOCATION_IDS.has(data.state.locationId)) return { ok: false, reason: "location" };
  const inspected = stringList(data.state.inspected, OBJECT_IDS, 40);
  const evidence = stringList(data.state.evidence, EVIDENCE_IDS, 40);
  const topicsAsked = stringList(data.state.topicsAsked, TOPIC_IDS, 40);
  const deductions = stringList(data.state.deductions, DEDUCTION_IDS, 20);
  const unread = stringList(data.state.unread || [], new Set([...EVIDENCE_IDS, ...DEDUCTION_IDS]), 60);
  if (!inspected || !evidence || !topicsAsked || !deductions || !unread) return { ok: false, reason: "ids" };
  for (const topicId of topicsAsked) {
    const produced = TOPIC_EVIDENCE.get(topicId);
    if (!evidence.includes(produced)) return { ok: false, reason: "topic-evidence" };
  }
  if (!unread.every((id) => evidence.includes(id) || deductions.includes(id))) return { ok: false, reason: "unread" };
  const hint = data.state.hint || { objectiveId: null, level: 0 };
  if (hint.objectiveId != null && !HINT_IDS.has(hint.objectiveId)) return { ok: false, reason: "hint" };
  if (![0, 1, 2].includes(hint.level)) return { ok: false, reason: "hint" };
  const hintUses = integer(data.state.hintUses || 0, 0, 10000);
  const accusationCount = integer(data.state.accusationCount || 0, 0, 1000);
  if (hintUses == null || accusationCount == null) return { ok: false, reason: "counts" };
  const endingId = data.state.endingId ?? null;
  if (phase === "ending" && endingId !== content.ending.id) return { ok: false, reason: "ending" };
  if (phase === "play" && endingId != null) return { ok: false, reason: "ending" };
  return {
    ok: true,
    value: {
      v: 1,
      rev,
      sessionId,
      updatedAt,
      state: {
        v: 1,
        phase,
        locationId: data.state.locationId,
        inspected,
        evidence,
        topicsAsked,
        deductions,
        accusationCount,
        hint: { objectiveId: hint.objectiveId, level: hint.level },
        hintUses,
        endingId: phase === "ending" ? endingId : null,
        unread,
        lastFeedback: null,
      },
    },
  };
}

export function loadGame(storage) {
  let raw;
  try {
    raw = storage.getItem(SAVE_KEY);
  } catch {
    return { status: "unavailable" };
  }
  if (raw == null) return { status: "empty" };
  if (typeof raw !== "string") return { status: "invalid", raw: null, reason: "shape" };
  if (raw.length > SAVE_LIMIT) return { status: "invalid", raw: null, reason: "size" };
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return { status: "invalid", raw, reason: "json" };
  }
  const migrated = migrate(data);
  if (!migrated.ok) return { status: "invalid", raw, reason: migrated.reason };
  const checked = validateSave(migrated.value);
  if (!checked.ok) return { status: "invalid", raw, reason: checked.reason };
  return { status: "ok", raw, save: checked.value };
}

export function planWrite(storedRaw, baseRev) {
  if (storedRaw == null) return { action: "write" };
  let data;
  try {
    data = JSON.parse(storedRaw);
  } catch {
    return { action: "conflict", reason: "unreadable" };
  }
  if (!data || typeof data !== "object" || typeof data.rev !== "number" || data.rev !== baseRev) {
    return { action: "conflict", reason: "revision" };
  }
  return { action: "write" };
}

export function commit(storage, state, meta, options = {}) {
  let stored = null;
  try {
    stored = storage.getItem(SAVE_KEY);
  } catch {
    return { ok: false, reason: "unavailable" };
  }
  if (!options.force) {
    const plan = planWrite(stored, meta.baseRev);
    if (plan.action !== "write") return { ok: false, reason: "conflict", storedRaw: stored };
  }
  let rev = meta.baseRev + 1;
  if (options.force && stored) {
    try {
      const existing = JSON.parse(stored);
      if (existing && typeof existing.rev === "number" && existing.rev >= rev) rev = existing.rev + 1;
    } catch {
      rev = meta.baseRev + 1;
    }
  }
  const payload = {
    v: 1,
    rev,
    sessionId: meta.sessionId,
    updatedAt: meta.now(),
    state: {
      v: 1,
      phase: state.phase,
      locationId: state.locationId,
      inspected: state.inspected,
      evidence: state.evidence,
      topicsAsked: state.topicsAsked,
      deductions: state.deductions,
      accusationCount: state.accusationCount,
      hint: state.hint,
      hintUses: state.hintUses,
      endingId: state.endingId,
      unread: state.unread,
    },
  };
  const text = JSON.stringify(payload);
  if (text.length > SAVE_LIMIT) return { ok: false, reason: "size" };
  try {
    storage.setItem(SAVE_KEY, text);
  } catch {
    return { ok: false, reason: "quota" };
  }
  return { ok: true, rev: payload.rev };
}
