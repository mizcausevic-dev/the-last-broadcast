import { describe, expect, it } from "vitest";
import { CANARY_FEE, CANARY_PIN, CANARY_TRANSCRIPT, catalog } from "../../src/content/catalog";
import { validateContent } from "../../src/content/validate";
import { visibleEnding } from "../../src/engine/ending";
import { buildNotebook } from "../../src/engine/notebook";
import { apply } from "../../src/engine/reduce";
import {
  buildEnvelope,
  checksumOf,
  interpretLoad,
  planWrite,
  PRESERVE_KEY,
  preserveRaw,
  resetStorage,
  SAVE_KEY,
  writeRaw,
  type Kv,
} from "../../src/engine/save";
import { initialState, type Action, type GameState } from "../../src/engine/state";

function play(actions: Action[], start: GameState = initialState()) {
  const results = [];
  let state = start;
  for (const action of actions) {
    const result = apply(state, action, catalog);
    results.push(result);
    state = result.state;
  }
  return { state, results };
}

function inspectAll(): Action[] {
  const actions: Action[] = [{ type: "start" }];
  let room = "lobby";
  for (const location of catalog.locations) {
    if (location.id !== room) {
      actions.push({ type: "travel", locationId: location.id });
      room = location.id;
    }
    for (const obj of catalog.objects.filter((item) => item.locationId === location.id)) {
      actions.push({ type: "inspect", objectId: obj.id });
    }
  }
  return actions;
}

function talkAll(fromRoom: string): Action[] {
  const actions: Action[] = [];
  let room = fromRoom;
  for (const topic of catalog.topics) {
    const suspect = catalog.suspects.find((item) => item.id === topic.suspectId);
    if (!suspect) throw new Error(topic.id);
    if (suspect.locationId !== room) {
      actions.push({ type: "travel", locationId: suspect.locationId });
      room = suspect.locationId;
    }
    actions.push({ type: "talk", topicId: topic.id });
  }
  return actions;
}

function memoryKv(seed: Record<string, string> = {}): Kv & { data: Map<string, string> } {
  const data = new Map(Object.entries(seed));
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}

describe("content", () => {
  it("validates the shipped case", () => {
    expect(validateContent(catalog)).toEqual([]);
  });

  it("rejects a dangling grant", () => {
    const broken = structuredClone(catalog);
    broken.objects[0].grants = "missing-clue";
    expect(validateContent(broken).length).toBeGreaterThan(0);
  });

  it("keeps canaries out of labels and prompts", () => {
    const surface = [
      catalog.contentNote,
      ...catalog.topics.map((topic) => topic.prompt),
      ...catalog.deductions.flatMap((ded) => ded.options.map((option) => option.label)),
    ].join("\n");
    expect(surface).not.toContain(CANARY_TRANSCRIPT);
    expect(surface).not.toContain(CANARY_FEE);
    expect(surface).not.toContain(CANARY_PIN);
  });
});

describe("walkthroughs", () => {
  it("reaches the ending in catalog order", () => {
    const actions = [
      ...inspectAll(),
      ...talkAll("office"),
      {
        type: "deduce",
        deductionId: "ded-board",
        optionId: "opt-board-bed",
        supportIds: ["clue-storm", "clue-program"],
      },
      {
        type: "deduce",
        deductionId: "ded-voluntary",
        optionId: "opt-vol-chose",
        supportIds: ["clue-cart", "clue-badge", "clue-lot"],
      },
      {
        type: "deduce",
        deductionId: "ded-jules",
        optionId: "opt-jules-break",
        supportIds: ["clue-soup", "clue-prod"],
      },
      {
        type: "deduce",
        deductionId: "ded-camera",
        optionId: "opt-cam-disable",
        supportIds: ["clue-camera", "clue-badge"],
      },
      {
        type: "deduce",
        deductionId: "ded-roof",
        optionId: "opt-roof-up",
        supportIds: ["clue-roof", "clue-badge"],
      },
      {
        type: "accuse",
        personId: "mara",
        actionId: "act-left",
        motiveId: "mot-sister",
        supportIds: ["clue-cart", "clue-badge", "clue-lot"],
      },
    ] satisfies Action[];
    const { state, results } = play(actions);
    expect(results.find((result) => !result.ok)?.message).toBeUndefined();
    expect(state.phase).toBe("ended");
    expect(buildNotebook(state, catalog).clues).toHaveLength(catalog.clues.length);
    expect(buildNotebook(state, catalog).statements).toHaveLength(catalog.topics.length);
    const ending = visibleEnding(state, catalog).map((block) => block.text).join("\n");
    expect(ending).toContain("fallen asleep");
    expect(ending).toContain("north lot");
    for (const block of visibleEnding(state, catalog)) {
      expect(block.clues.every((clueId) => buildNotebook(state, catalog).clues.some((clue) => clue.id === clueId))).toBe(true);
      expect(block.heard.every((id) => state.heard.includes(id))).toBe(true);
    }
  });

  it("reaches the ending in another room order and another proof", () => {
    const actions = [
      { type: "start" },
      { type: "travel", locationId: "office" },
      { type: "inspect", objectId: "obj-folder" },
      { type: "inspect", objectId: "obj-roof" },
      { type: "talk", topicId: "dennis-deal" },
      { type: "talk", topicId: "dennis-deal-confront" },
      { type: "travel", locationId: "production" },
      { type: "inspect", objectId: "obj-couch" },
      { type: "inspect", objectId: "obj-prodlog" },
      { type: "talk", topicId: "jules-home" },
      { type: "talk", topicId: "jules-confront" },
      { type: "travel", locationId: "studio" },
      { type: "inspect", objectId: "obj-rack" },
      { type: "inspect", objectId: "obj-board" },
      { type: "inspect", objectId: "obj-program" },
      { type: "travel", locationId: "lobby" },
      { type: "inspect", objectId: "obj-lot" },
      { type: "inspect", objectId: "obj-dock" },
      {
        type: "deduce",
        deductionId: "ded-jules",
        optionId: "opt-jules-break",
        supportIds: ["clue-prod", "clue-soup", "clue-rider"],
      },
      {
        type: "deduce",
        deductionId: "ded-board",
        optionId: "opt-board-bed",
        supportIds: ["clue-cart", "clue-storm"],
      },
      {
        type: "deduce",
        deductionId: "ded-voluntary",
        optionId: "opt-vol-chose",
        supportIds: ["clue-lot", "clue-cart"],
      },
      {
        type: "deduce",
        deductionId: "ded-roof",
        optionId: "opt-roof-up",
        supportIds: ["clue-roof", "clue-program"],
      },
      {
        type: "accuse",
        personId: "mara",
        actionId: "act-left",
        motiveId: "mot-sister",
        supportIds: ["ded-voluntary", "ded-board", "clue-rider"],
      },
    ] satisfies Action[];
    const { state, results } = play(actions);
    const failed = results.find((result) => !result.ok);
    expect(failed?.message).toBeUndefined();
    expect(state.phase).toBe("ended");
    const text = visibleEnding(state, catalog).map((block) => block.text).join("\n");
    expect(text).toContain("parking checklist");
    expect(text).not.toContain("02:19");
  });

  it("wins from the cart and the dock alone", () => {
    const { state, results } = play([
      { type: "start" },
      { type: "inspect", objectId: "obj-dock" },
      { type: "travel", locationId: "studio" },
      { type: "inspect", objectId: "obj-rack" },
      {
        type: "accuse",
        personId: "mara",
        actionId: "act-left",
        motiveId: "mot-sister",
        supportIds: ["clue-badge", "clue-cart"],
      },
    ]);
    expect(results.every((result) => result.ok)).toBe(true);
    expect(state.phase).toBe("ended");
    const text = visibleEnding(state, catalog).map((block) => block.text).join("\n");
    expect(text).toContain("2:04");
    expect(text).toContain("2:19");
    expect(text).not.toContain("roof");
    expect(text).not.toContain("1:44");
    expect(text).not.toContain("flickering");
    expect(text).not.toContain("syndication");
  });
});

describe("rules", () => {
  it("does not duplicate a repeated inspection", () => {
    const once = play([
      { type: "start" },
      { type: "inspect", objectId: "obj-signin" },
    ]);
    const twice = apply(once.state, { type: "inspect", objectId: "obj-signin" }, catalog);
    expect(twice.changed).toBe(false);
    expect(twice.state).toBe(once.state);
    expect(buildNotebook(once.state, catalog).clues).toHaveLength(1);
  });

  it("rejects a gated interview, then keeps the answer for review", () => {
    const opened = play([
      { type: "start" },
      { type: "travel", locationId: "office" },
    ]);
    const gated = apply(opened.state, { type: "talk", topicId: "dennis-where-confront" }, catalog);
    expect(gated.ok).toBe(false);
    expect(gated.code).toBe("gated");
    expect(gated.state).toBe(opened.state);
    const shown = play([
      { type: "inspect", objectId: "obj-roof" },
      { type: "talk", topicId: "dennis-where-confront" },
    ], opened.state);
    expect(shown.results.every((result) => result.ok)).toBe(true);
    const again = apply(shown.state, { type: "talk", topicId: "dennis-where-confront" }, catalog);
    expect(again.changed).toBe(false);
    expect(again.state).toBe(shown.state);
    expect(buildNotebook(shown.state, catalog).statements.map((item) => item.text).join(" ")).toContain("could not see the south dock");
  });

  it("accepts equivalent deduction sets and rejects the wrong links", () => {
    const ready = play(inspectAll()).state;
    const wrongOption = apply(ready, {
      type: "deduce",
      deductionId: "ded-board",
      optionId: "opt-board-tower",
      supportIds: ["clue-storm", "clue-program"],
    }, catalog);
    expect(wrongOption.outcome).toBe("rejected-option");
    expect(wrongOption.message).toContain("carrier stayed up");
    expect(wrongOption.state.deductions).toHaveLength(0);

    const reversed = apply(ready, {
      type: "deduce",
      deductionId: "ded-board",
      optionId: "opt-board-bed",
      supportIds: ["clue-program", "clue-storm"],
    }, catalog);
    expect(reversed.outcome).toBe("accepted");

    const fresh = play(inspectAll()).state;
    const withExtra = apply(fresh, {
      type: "deduce",
      deductionId: "ded-board",
      optionId: "opt-board-bed",
      supportIds: ["clue-storm", "clue-program", "clue-soup"],
    }, catalog);
    expect(withExtra.outcome).toBe("accepted");

    const cartPair = apply(play(inspectAll()).state, {
      type: "deduce",
      deductionId: "ded-voluntary",
      optionId: "opt-vol-chose",
      supportIds: ["clue-badge", "clue-cart"],
    }, catalog);
    expect(cartPair.outcome).toBe("accepted");

    const physicalOnly = apply(ready, {
      type: "deduce",
      deductionId: "ded-voluntary",
      optionId: "opt-vol-chose",
      supportIds: ["clue-badge", "clue-lot"],
    }, catalog);
    expect(physicalOnly.outcome).toBe("rejected-support");
    expect(physicalOnly.state.deductions).toHaveLength(0);

    const repeat = apply(reversed.state, {
      type: "deduce",
      deductionId: "ded-board",
      optionId: "opt-board-bed",
      supportIds: ["clue-storm", "clue-cart"],
    }, catalog);
    expect(repeat.code).toBe("repeat");
    expect(repeat.state).toBe(reversed.state);
  });

  it("separates wrong theory, insufficient support, lucky guess, and a held account", () => {
    const ready = play([
      { type: "start" },
      { type: "inspect", objectId: "obj-dock" },
      { type: "inspect", objectId: "obj-lot" },
      { type: "inspect", objectId: "obj-binder" },
      { type: "travel", locationId: "studio" },
      { type: "inspect", objectId: "obj-rack" },
      { type: "inspect", objectId: "obj-phone" },
      { type: "travel", locationId: "production" },
      { type: "inspect", objectId: "obj-couch" },
    ]).state;
    const wrong = apply(ready, {
      type: "accuse",
      personId: "dennis",
      actionId: "act-abducted",
      motiveId: "mot-reed",
      supportIds: ["clue-cart", "clue-badge", "clue-lot"],
    }, catalog);
    expect(wrong.outcome).toBe("wrong-theory");
    expect(wrong.message.startsWith("Not established.")).toBe(true);
    expect(wrong.state.phase).toBe("play");
    expect(wrong.state.inspected).toEqual(ready.inspected);

    const lucky = apply(wrong.state, {
      type: "accuse",
      personId: "mara",
      actionId: "act-left",
      motiveId: "mot-sister",
      supportIds: ["clue-soup", "clue-camera"],
    }, catalog);
    expect(lucky.outcome).toBe("lucky-guess");
    expect(lucky.message.startsWith("The attached notes do not record this act.")).toBe(true);
    expect(lucky.state.phase).toBe("play");

    const thin = apply(lucky.state, {
      type: "accuse",
      personId: "mara",
      actionId: "act-left",
      motiveId: "mot-sister",
      supportIds: ["clue-cart", "clue-phone"],
    }, catalog);
    expect(thin.outcome).toBe("insufficient");
    expect(thin.message.startsWith("Not enough support.")).toBe(true);

    const held = apply(thin.state, {
      type: "accuse",
      personId: "mara",
      actionId: "act-left",
      motiveId: "mot-sister",
      supportIds: ["clue-cart", "clue-badge", "clue-soup"],
    }, catalog);
    expect(held.outcome).toBe("supported");
    expect(held.state.phase).toBe("ended");
    const closed = apply(held.state, {
      type: "accuse",
      personId: "mara",
      actionId: "act-left",
      motiveId: "mot-sister",
      supportIds: ["clue-cart", "clue-badge"],
    }, catalog);
    expect(closed.ok).toBe(false);
    expect(closed.state).toBe(held.state);
  });

  it("rejects impossible actions", () => {
    const started = play([{ type: "start" }]).state;
    const missing = apply(started, { type: "travel", locationId: "tower" }, catalog);
    expect(missing.ok).toBe(false);
    expect(missing.state).toBe(started);
    const room = apply(started, { type: "inspect", objectId: "obj-board" }, catalog);
    expect(room.code).toBe("wrong-room");
    const count = apply(started, {
      type: "deduce",
      deductionId: "ded-board",
      optionId: "opt-board-bed",
      supportIds: ["clue-storm"],
    }, catalog);
    expect(count.code).toBe("bad-count");
    const absent = apply(started, {
      type: "accuse",
      personId: "mara",
      actionId: "act-left",
      motiveId: "mot-sister",
      supportIds: ["clue-cart", "clue-badge"],
    }, catalog);
    expect(absent.code).toBe("not-held");
    const early = apply(initialState(), { type: "inspect", objectId: "obj-dock" }, catalog);
    expect(early.code).toBe("phase");
  });

  it("keeps one hint objective until it is done, then drops it", () => {
    const started = play([{ type: "start" }]).state;
    const first = apply(started, { type: "hint", escalate: false }, catalog);
    expect(first.state.hint?.objectiveId).toBe("inspect:obj-signin");
    expect(first.message).not.toContain("Sign-in clipboard");
    expect(first.message).not.toContain(CANARY_TRANSCRIPT);
    const second = apply(first.state, { type: "hint", escalate: true }, catalog);
    expect(second.state.hint?.objectiveId).toBe("inspect:obj-signin");
    expect(second.state.hint?.level).toBe(2);
    expect(second.message).toContain("Sign-in clipboard");
    const third = apply(second.state, { type: "hint", escalate: true }, catalog);
    expect(third.state.hint?.level).toBe(3);
    const repeated = apply(third.state, { type: "hint", escalate: false }, catalog);
    expect(repeated.message).toContain("as direct as this hint gets");
    const logged = apply(repeated.state, { type: "inspect", objectId: "obj-signin" }, catalog);
    expect(logged.state.hint).toBeNull();
    const next = apply(logged.state, { type: "hint", escalate: true }, catalog);
    expect(next.state.hint?.objectiveId).not.toBe("inspect:obj-signin");
    expect(next.state.hint?.level).toBe(1);
  });
});

describe("saves", () => {
  it("round-trips a finished case and rejects tamper, junk, and unknown formats", () => {
    const finished = play([
      { type: "start" },
      { type: "inspect", objectId: "obj-dock" },
      { type: "travel", locationId: "studio" },
      { type: "inspect", objectId: "obj-rack" },
      {
        type: "accuse",
        personId: "mara",
        actionId: "act-left",
        motiveId: "mot-sister",
        supportIds: ["clue-cart", "clue-badge"],
      },
    ]).state;
    const envelope = buildEnvelope(finished, "tab-a", "2026-10-20T12:00:00.000Z");
    const raw = JSON.stringify(envelope);
    const loaded = interpretLoad(raw, catalog);
    expect(loaded.kind).toBe("ok");
    if (loaded.kind !== "ok") return;
    expect(loaded.envelope.state.phase).toBe("ended");
    expect(checksumOf(loaded.envelope.state)).toBe(envelope.checksum);

    const tampered = structuredClone(envelope);
    tampered.state.phase = "play";
    expect(interpretLoad(JSON.stringify(tampered), catalog).kind).toBe("bad");

    const flipped = JSON.parse(raw) as { checksum: string };
    flipped.checksum = "00000000";
    const badSum = interpretLoad(JSON.stringify(flipped), catalog);
    expect(badSum.kind).toBe("bad");
    if (badSum.kind === "bad") expect(badSum.reason).toBe("checksum");

    const foreign = interpretLoad(JSON.stringify({ format: 99, app: "the-last-broadcast", legacy: true }), catalog);
    expect(foreign.kind).toBe("bad");
    if (foreign.kind === "bad") expect(foreign.reason).toBe("incompatible");

    expect(interpretLoad("{", catalog).kind).toBe("bad");
    expect(interpretLoad("x".repeat(200_001), catalog).kind).toBe("bad");
    const unproven = structuredClone(envelope);
    unproven.state.phase = "ended";
    unproven.state.resolution = null;
    unproven.checksum = checksumOf(unproven.state);
    expect(interpretLoad(JSON.stringify(unproven), catalog).kind).toBe("bad");
  });

  it("preserves unreadable data, refuses to overwrite it, and reports quota and tab conflicts", () => {
    const kv = memoryKv();
    expect(preserveRaw(kv, "first-raw")).toBeNull();
    expect(preserveRaw(kv, "second-raw")).toBeNull();
    expect(kv.getItem(PRESERVE_KEY)).toBe("first-raw");
    kv.setItem(SAVE_KEY, "not-json");
    const started = play([{ type: "start" }]).state;
    const blocked = planWrite({
      diskRaw: "not-json",
      state: started,
      tabId: "tab-b",
      savedAt: "t",
      lastSeenChecksum: null,
      holdCorrupt: true,
      force: false,
      content: catalog,
    });
    expect(blocked.type).toBe("blocked");

    const disk = JSON.stringify(buildEnvelope(started, "tab-a", "t0"));
    const other = play([
      { type: "start" },
      { type: "inspect", objectId: "obj-signin" },
    ]).state;
    const conflict = planWrite({
      diskRaw: disk,
      state: other,
      tabId: "tab-b",
      savedAt: "t1",
      lastSeenChecksum: null,
      holdCorrupt: false,
      force: false,
      content: catalog,
    });
    expect(conflict.type).toBe("conflict");
    const forced = planWrite({
      diskRaw: disk,
      state: other,
      tabId: "tab-b",
      savedAt: "t1",
      lastSeenChecksum: null,
      holdCorrupt: false,
      force: true,
      content: catalog,
    });
    expect(forced.type).toBe("write");

    const quota = writeRaw({
      getItem: () => null,
      setItem: () => {
        const error = new Error("full");
        error.name = "QuotaExceededError";
        throw error;
      },
      removeItem: () => undefined,
    }, "raw");
    expect(quota).toBe("quota");

    const failing = memoryKv({ [SAVE_KEY]: "keep", [PRESERVE_KEY]: "also" });
    failing.removeItem = () => {
      throw new Error("denied");
    };
    expect(resetStorage(failing)).toBe("denied");
    expect(failing.getItem(SAVE_KEY)).toBe("keep");

    const cleared = memoryKv({ [SAVE_KEY]: "keep", [PRESERVE_KEY]: "also" });
    expect(resetStorage(cleared)).toBeNull();
    expect(cleared.getItem(SAVE_KEY)).toBeNull();
    expect(cleared.getItem(PRESERVE_KEY)).toBeNull();
  });

  it("requires confirmation before a reset", () => {
    const started = play([{ type: "start" }, { type: "inspect", objectId: "obj-dock" }]).state;
    const denied = apply(started, { type: "reset", confirm: false }, catalog);
    expect(denied.ok).toBe(false);
    expect(denied.state).toBe(started);
    const cleared = apply(started, { type: "reset", confirm: true }, catalog);
    expect(cleared.state.phase).toBe("title");
    expect(cleared.state.inspected).toEqual([]);
  });
});
