import type { GameContent } from "../content/types";
import { classifyAccusation, collectedClueIds, notebookEntryIds, setSatisfies, topicUnlocked } from "./logic";
import type { GameState } from "./state";

export const SAVE_KEY = "last-broadcast-save-v1";
export const PRESERVE_KEY = "last-broadcast-preserved-raw";
export const TAB_KEY = "last-broadcast-tab";
export const MAX_SAVE_CHARS = 200_000;

export interface Kv {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface Envelope {
  format: 1;
  app: "the-last-broadcast";
  tabId: string;
  savedAt: string;
  checksum: string;
  state: GameState;
}

export type LoadResult =
  | { kind: "empty" }
  | { kind: "ok"; envelope: Envelope }
  | { kind: "bad"; reason: string; raw: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertShape(value: unknown, depth: number): void {
  if (depth > 12) throw new Error("too-deep");
  if (Array.isArray(value)) {
    if (value.length > 500) throw new Error("too-long");
    for (const item of value) assertShape(item, depth + 1);
    return;
  }
  if (isRecord(value)) {
    const keys = Object.keys(value);
    if (keys.length > 80) throw new Error("too-wide");
    for (const key of keys) {
      if (key.length > 80) throw new Error("bad-key");
      assertShape(value[key], depth + 1);
    }
    return;
  }
  if (typeof value === "string" && value.length > 20_000) throw new Error("too-string");
  if (typeof value === "number" && !Number.isFinite(value)) throw new Error("bad-number");
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (isRecord(value)) {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) out[key] = sortValue(value[key]);
    return out;
  }
  return value;
}

export function checksumOf(state: GameState): string {
  const text = canonicalJson(state);
  let hash = 5381;
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash * 33) ^ text.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function stringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function invariants(state: GameState, content: GameContent): string | null {
  if (!state || typeof state !== "object") return "shape";
  if (state.format !== 1) return "state-format";
  if (state.phase !== "title" && state.phase !== "play" && state.phase !== "ended") {
    return "phase";
  }
  if (!Number.isInteger(state.revision) || state.revision < 0 || state.revision > 100_000) {
    return "revision";
  }
  if (!stringArray(state.visited) || !stringArray(state.inspected) || !stringArray(state.heard)) {
    return "arrays";
  }
  if (!Array.isArray(state.deductions) || !Array.isArray(state.accusations) || !Array.isArray(state.log)) {
    return "arrays";
  }
  if (!Array.isArray(state.failedKeys)) return "arrays";
  if (!content.locations.some((item) => item.id === state.locationId)) return "location";
  if (!state.visited.includes(state.locationId)) return "visited-current";
  if (new Set(state.visited).size !== state.visited.length) return "visited-dup";
  for (const id of state.visited) {
    if (!content.locations.some((item) => item.id === id)) return "visited-id";
  }
  if (new Set(state.inspected).size !== state.inspected.length) return "inspected-dup";
  for (const id of state.inspected) {
    if (!content.objects.some((item) => item.id === id)) return "inspected-id";
  }
  if (new Set(state.heard).size !== state.heard.length) return "heard-dup";
  const held = new Set(collectedClueIds(state, content));
  for (const id of state.heard) {
    const topic = content.topics.find((item) => item.id === id);
    if (!topic) return "heard-id";
    if (!topicUnlocked(content, id, held)) return "heard-gate";
  }
  const seenDed = new Set<string>();
  for (const record of state.deductions) {
    if (seenDed.has(record.id)) return "deduction-dup";
    seenDed.add(record.id);
    const ded = content.deductions.find((item) => item.id === record.id);
    if (!ded) return "deduction-id";
    const option = ded.options.find((item) => item.id === record.optionId);
    if (!option?.correct) return "deduction-option";
    if (!setSatisfies(record.supportIds, ded.minimalSets)) return "deduction-support";
    for (const id of record.supportIds) {
      if (!held.has(id)) return "deduction-held";
    }
  }
  if (state.phase === "ended") {
    if (!state.resolution) return "ending-missing";
    const classified = classifyAccusation(
      content,
      state.resolution.personId,
      state.resolution.actionId,
      state.resolution.motiveId,
      state.resolution.supportIds,
    );
    if (classified.outcome !== "supported") return "ending-unproven";
    const notebook = new Set(notebookEntryIds(state, content));
    for (const id of state.resolution.supportIds) {
      if (!notebook.has(id)) return "ending-notes";
    }
  } else if (state.resolution) {
    return "resolution-early";
  }
  if (state.phase === "title") {
    if (state.inspected.length || state.heard.length || state.deductions.length) {
      return "title-progress";
    }
    if (state.revision !== 0) return "title-revision";
  }
  if (state.hint) {
    if (state.hint.level < 1 || state.hint.level > 3) return "hint-level";
    if (state.hint.text.length > 2000) return "hint-text";
    if (!/^(visit|inspect|topic|deduce):[a-z0-9-]+$|^accuse$|^closed$/.test(state.hint.objectiveId)) {
      return "hint-id";
    }
  }
  if (state.log.length > 80) return "log-length";
  for (const entry of state.log) {
    if (entry.text.length > 500 || entry.id.length > 200) return "log-entry";
  }
  if (state.accusations.length > 100) return "accusations";
  if (state.failedKeys.length > 200) return "failed-keys";
  return null;
}

export function interpretLoad(raw: string | null, content: GameContent): LoadResult {
  if (raw === null || raw === "") return { kind: "empty" };
  if (raw.length > MAX_SAVE_CHARS) return { kind: "bad", reason: "too-large", raw };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
    assertShape(parsed, 0);
  } catch {
    return { kind: "bad", reason: "malformed", raw };
  }
  if (!isRecord(parsed)) return { kind: "bad", reason: "malformed", raw };
  if (parsed.format !== 1 || parsed.app !== "the-last-broadcast") {
    return { kind: "bad", reason: "incompatible", raw };
  }
  if (typeof parsed.tabId !== "string" || parsed.tabId.length < 1 || parsed.tabId.length > 80) {
    return { kind: "bad", reason: "tab", raw };
  }
  if (typeof parsed.savedAt !== "string" || parsed.savedAt.length > 80) {
    return { kind: "bad", reason: "time", raw };
  }
  if (typeof parsed.checksum !== "string" || !isRecord(parsed.state)) {
    return { kind: "bad", reason: "checksum", raw };
  }
  const state = parsed.state as unknown as GameState;
  if (checksumOf(state) !== parsed.checksum) return { kind: "bad", reason: "checksum", raw };
  let problem: string | null;
  try {
    problem = invariants(state, content);
  } catch {
    return { kind: "bad", reason: "invariants", raw };
  }
  if (problem) return { kind: "bad", reason: problem, raw };
  const envelope: Envelope = {
    format: 1,
    app: "the-last-broadcast",
    tabId: parsed.tabId,
    savedAt: parsed.savedAt,
    checksum: parsed.checksum,
    state,
  };
  return { kind: "ok", envelope };
}

export function buildEnvelope(state: GameState, tabId: string, savedAt: string): Envelope {
  return {
    format: 1,
    app: "the-last-broadcast",
    tabId,
    savedAt,
    checksum: checksumOf(state),
    state,
  };
}

export type WritePlan =
  | { type: "write"; raw: string; checksum: string }
  | { type: "conflict"; theirRevision: number; theirSavedAt: string; theirTabId: string }
  | { type: "blocked"; reason: string };

export function planWrite(args: {
  diskRaw: string | null;
  state: GameState;
  tabId: string;
  savedAt: string;
  lastSeenChecksum: string | null;
  holdCorrupt: boolean;
  force: boolean;
  content: GameContent;
}): WritePlan {
  if (args.holdCorrupt && !args.force) {
    return { type: "blocked", reason: "An unreadable save is being kept. Saving stays off until you confirm a reset." };
  }
  const problem = invariants(args.state, args.content);
  if (problem) return { type: "blocked", reason: `This case failed its own checks (${problem}).` };
  const envelope = buildEnvelope(args.state, args.tabId, args.savedAt);
  const raw = JSON.stringify(envelope);
  if (args.force || args.diskRaw === null || args.diskRaw === "") {
    return { type: "write", raw, checksum: envelope.checksum };
  }
  const loaded = interpretLoad(args.diskRaw, args.content);
  if (loaded.kind === "bad") {
    return {
      type: "blocked",
      reason: "The stored case is unreadable. It was not overwritten.",
    };
  }
  if (loaded.kind === "empty") return { type: "write", raw, checksum: envelope.checksum };
  if (args.lastSeenChecksum !== null && loaded.envelope.checksum === args.lastSeenChecksum) {
    return { type: "write", raw, checksum: envelope.checksum };
  }
  if (args.lastSeenChecksum === null && loaded.envelope.tabId === args.tabId) {
    return { type: "write", raw, checksum: envelope.checksum };
  }
  return {
    type: "conflict",
    theirRevision: loaded.envelope.state.revision,
    theirSavedAt: loaded.envelope.savedAt,
    theirTabId: loaded.envelope.tabId,
  };
}

export function readTabId(storage: Kv): { id: string; persistent: boolean } {
  try {
    const existing = storage.getItem(TAB_KEY);
    if (existing && existing.length <= 80) return { id: existing, persistent: true };
    const id = crypto.randomUUID();
    storage.setItem(TAB_KEY, id);
    return { id, persistent: true };
  } catch {
    return { id: crypto.randomUUID(), persistent: false };
  }
}

export function preserveRaw(kv: Kv, raw: string): string | null {
  try {
    const existing = kv.getItem(PRESERVE_KEY);
    if (existing === null) kv.setItem(PRESERVE_KEY, raw);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : "preserve-failed";
  }
}

export function writeRaw(kv: Kv, raw: string): string | null {
  try {
    kv.setItem(SAVE_KEY, raw);
    return null;
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (name === "QuotaExceededError") return "quota";
    return error instanceof Error ? error.message : "write-failed";
  }
}

export function resetStorage(kv: Kv): string | null {
  try {
    kv.removeItem(SAVE_KEY);
    kv.removeItem(PRESERVE_KEY);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : "delete-failed";
  }
}
