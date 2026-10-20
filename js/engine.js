// Pure state transitions for The Last Broadcast.
// Impossible actions are rejected here even if the view hides them.

import { content } from "./content.js";

export function createInitialState() {
  return {
    v: 1,
    phase: "title",
    locationId: "booth",
    inspected: [],
    evidence: [],
    topicsAsked: [],
    deductions: [],
    accusationCount: 0,
    hint: { objectiveId: null, level: 0 },
    hintUses: 0,
    endingId: null,
    unread: [],
    lastFeedback: null,
  };
}

export function notebookIds(state) {
  return state.evidence.concat(state.deductions);
}

export function evalCond(state, cond) {
  if (cond == null) return true;
  switch (cond.op) {
    case "phasePlay":
      return state.phase === "play";
    case "never":
      return false;
    case "hasEvidence":
      return state.evidence.includes(cond.id);
    case "hasDeduction":
      return state.deductions.includes(cond.id);
    case "hasTopic":
      return state.topicsAsked.includes(cond.id);
    case "hasInspected":
      return state.inspected.includes(cond.id);
    case "evidenceAtLeast":
      return state.evidence.length >= cond.n || state.inspected.length >= cond.n;
    case "not":
      return !evalCond(state, cond.cond);
    case "all":
      return cond.of.every((item) => evalCond(state, item));
    case "any":
      return cond.of.some((item) => evalCond(state, item));
    case "supportReady": {
      const rule = content.deductions.find((item) => item.id === cond.id);
      if (!rule) return false;
      const held = notebookIds(state);
      return rule.supports.some((set) => set.every((id) => held.includes(id)));
    }
    default:
      return false;
  }
}

function copyState(state) {
  return {
    v: state.v,
    phase: state.phase,
    locationId: state.locationId,
    inspected: state.inspected.slice(),
    evidence: state.evidence.slice(),
    topicsAsked: state.topicsAsked.slice(),
    deductions: state.deductions.slice(),
    accusationCount: state.accusationCount,
    hint: { objectiveId: state.hint.objectiveId, level: state.hint.level },
    hintUses: state.hintUses,
    endingId: state.endingId,
    unread: state.unread.slice(),
    lastFeedback: state.lastFeedback ? { ...state.lastFeedback } : null,
  };
}

function ok(state, events = []) {
  return { ok: true, state, error: null, events };
}

function fail(state, error) {
  return { ok: false, state, error, events: [] };
}

function uniqueIds(list) {
  if (!Array.isArray(list)) return null;
  const out = [];
  for (const id of list) {
    if (typeof id !== "string" || id.length > 80) return null;
    if (!out.includes(id)) out.push(id);
  }
  return out;
}

export function selectHintObjective(state) {
  if (state.phase !== "play") return null;
  const pinned = content.hints.find((item) => item.id === state.hint.objectiveId);
  if (pinned && !evalCond(state, pinned.complete) && evalCond(state, pinned.actionable)) return pinned;
  const open = content.hints
    .filter((item) => evalCond(state, item.actionable) && !evalCond(state, item.complete))
    .sort((a, b) => a.priority - b.priority);
  return open[0] || null;
}

export function supportCovers(ids) {
  const held = new Set(ids);
  const exit =
    held.has("ded-dock-exit") ||
    (held.has("ev-note") && held.has("ev-dock")) ||
    (held.has("ev-note") && held.has("stmt-cal-saw")) ||
    (held.has("ev-dock") && held.has("stmt-cal-saw")) ||
    (held.has("ev-dock") && held.has("ev-hook") && held.has("ev-lock"));
  const file = held.has("ded-file-swap") || (held.has("ev-binder") && held.has("ev-printout"));
  return exit && file;
}

function classifyAccusation(payload, support) {
  const success = content.accusation.success;
  const choicesMatch = Object.entries(success).every(([key, value]) => payload[key] === value);
  if (choicesMatch && supportCovers(support)) return "success";
  if (choicesMatch) return "insufficient";
  if (
    payload.status === "left" &&
    payload.route === "dock" &&
    (payload.purpose !== "deliver" || payload.conduct !== "ellis")
  ) {
    return "plausibleRoute";
  }
  if (
    payload.status === "left" &&
    payload.purpose === "deliver" &&
    payload.conduct === "ellis" &&
    payload.route !== "dock"
  ) {
    return "plausibleReason";
  }
  if (payload.status === "inside") return "inside";
  return "incorrect";
}

export function dispatch(state, action) {
  if (!action || typeof action.type !== "string") return fail(state, "unknown");
  switch (action.type) {
    case "START":
      return start(state);
    case "MOVE":
      return move(state, action.id);
    case "INSPECT":
      return inspect(state, action.id);
    case "ASK":
      return ask(state, action.id);
    case "DEDUCE":
      return deduce(state, action);
    case "ACCUSE":
      return accuse(state, action.payload);
    case "HINT":
      return hint(state);
    case "ACK":
      return ack(state, action.id);
    case "CLEAR_FEEDBACK":
      return clearFeedback(state);
    default:
      return fail(state, "unknown");
  }
}

function start(state) {
  if (state.phase === "play") return ok(state);
  if (state.phase !== "title") return fail(state, "phase");
  const next = copyState(state);
  next.phase = "play";
  next.locationId = "booth";
  return ok(next);
}

function move(state, id) {
  if (state.phase !== "play") return fail(state, "phase");
  if (!content.locations.some((item) => item.id === id)) return fail(state, "unknown");
  if (state.locationId === id) return ok(state);
  const next = copyState(state);
  next.locationId = id;
  return ok(next);
}

function inspect(state, id) {
  if (state.phase !== "play") return fail(state, "phase");
  const obj = content.objects.find((item) => item.id === id);
  if (!obj) return fail(state, "unknown");
  if (obj.locationId !== state.locationId) return fail(state, "wrong-room");
  const next = copyState(state);
  if (!next.inspected.includes(obj.id)) next.inspected.push(obj.id);
  if (next.evidence.includes(obj.evidenceId)) {
    next.lastFeedback = { kind: "repeat", evidenceId: obj.evidenceId };
    return ok(next);
  }
  next.evidence.push(obj.evidenceId);
  next.unread.push(obj.evidenceId);
  next.lastFeedback = { kind: "gained", evidenceId: obj.evidenceId };
  return ok(next, [{ type: "gained", id: obj.evidenceId }]);
}

function ask(state, id) {
  if (state.phase !== "play") return fail(state, "phase");
  const topic = content.topics.find((item) => item.id === id);
  if (!topic) return fail(state, "unknown");
  const person = content.suspects.find((item) => item.id === topic.suspectId);
  if (!person || person.locationId !== state.locationId) return fail(state, "wrong-room");
  if (topic.requires && !evalCond(state, topic.requires)) return fail(state, "locked");
  const next = copyState(state);
  if (next.topicsAsked.includes(topic.id)) {
    next.lastFeedback = { kind: "repeat", evidenceId: topic.evidenceId };
    return ok(next);
  }
  next.topicsAsked.push(topic.id);
  if (!next.evidence.includes(topic.evidenceId)) {
    next.evidence.push(topic.evidenceId);
    next.unread.push(topic.evidenceId);
  }
  next.lastFeedback = { kind: "gained", evidenceId: topic.evidenceId };
  return ok(next, [{ type: "gained", id: topic.evidenceId }]);
}

function deduce(state, action) {
  if (state.phase !== "play") return fail(state, "phase");
  const rule = content.deductions.find((item) => item.id === action.id);
  if (!rule) return fail(state, "unknown");
  if (!evalCond(state, rule.unlock)) return fail(state, "locked");
  if (state.deductions.includes(rule.id)) {
    const next = copyState(state);
    next.lastFeedback = { kind: "repeat", deductionId: rule.id };
    return ok(next);
  }
  if (!rule.choices.some((item) => item.id === action.choice)) return fail(state, "bad-shape");
  const support = uniqueIds(action.support);
  if (!support || support.length < 2 || support.length > 3) return fail(state, "bad-shape");
  const held = notebookIds(state);
  if (!support.every((id) => held.includes(id))) return fail(state, "not-held");
  const choiceOk = action.choice === rule.correctChoice;
  const supportOk = rule.supports.some((set) => set.every((id) => support.includes(id)));
  const next = copyState(state);
  if (choiceOk && supportOk) {
    next.deductions.push(rule.id);
    next.unread.push(rule.id);
    next.lastFeedback = { kind: "accepted", deductionId: rule.id, text: rule.explanation };
    return ok(next, [{ type: "gained", id: rule.id }]);
  }
  next.lastFeedback = {
    kind: "rejected",
    deductionId: rule.id,
    text: choiceOk
      ? "The entries you chose do not carry that conclusion."
      : "Those entries do not show that conclusion.",
  };
  return ok(next);
}

function accuse(state, payload) {
  if (state.phase !== "play") return fail(state, "phase");
  if (!payload || typeof payload !== "object") return fail(state, "bad-shape");
  for (const step of content.accusation.steps) {
    const value = payload[step.id];
    if (!step.options.some((item) => item.id === value)) return fail(state, "bad-shape");
  }
  const support = uniqueIds(payload.support);
  if (!support || support.length !== 3) return fail(state, "bad-shape");
  if (!support.every((id) => notebookIds(state).includes(id))) return fail(state, "not-held");
  const result = classifyAccusation(payload, support);
  const next = copyState(state);
  next.accusationCount += 1;
  if (result === "success") {
    next.phase = "ending";
    next.endingId = content.ending.id;
    next.lastFeedback = null;
    next.hint = { objectiveId: null, level: 0 };
    return ok(next, [{ type: "ending", id: content.ending.id }]);
  }
  next.lastFeedback = {
    kind: "accuse",
    result,
    text: content.accusation.feedback[result],
  };
  return ok(next);
}

function hint(state) {
  if (state.phase !== "play") return fail(state, "phase");
  const target = selectHintObjective(state);
  const next = copyState(state);
  next.hintUses += 1;
  if (!target) {
    next.hint = { objectiveId: null, level: 0 };
    next.lastFeedback = {
      kind: "hint",
      level: 0,
      text: "Nothing is outstanding. You can file an explanation whenever the notebook can carry it.",
    };
    return ok(next);
  }
  const level = state.hint.objectiveId === target.id ? Math.min(2, state.hint.level + 1) : 0;
  next.hint = { objectiveId: target.id, level };
  next.lastFeedback = { kind: "hint", level, objectiveId: target.id, text: target.lines[level] };
  return ok(next);
}

function ack(state, id) {
  if (typeof id !== "string" || !state.unread.includes(id)) return ok(state);
  const next = copyState(state);
  next.unread = next.unread.filter((item) => item !== id);
  return ok(next);
}

function clearFeedback(state) {
  if (!state.lastFeedback) return ok(state);
  const next = copyState(state);
  next.lastFeedback = null;
  return ok(next);
}

function evidenceView(entry, state) {
  return {
    id: entry.id,
    kind: entry.kind,
    title: entry.title,
    source: entry.source,
    description: entry.description,
    facts: entry.facts.slice(),
    related: entry.related.slice(),
    isNew: state.unread.includes(entry.id),
  };
}

export function project(state) {
  const room = content.locations.find((item) => item.id === state.locationId);
  const objects = content.objects
    .filter((item) => item.locationId === state.locationId)
    .map((item) => ({
      id: item.id,
      label: item.label,
      inspected: state.inspected.includes(item.id),
      isNew: state.unread.includes(item.evidenceId),
    }));
  const people = content.suspects
    .filter((item) => item.locationId === state.locationId)
    .map((person) => {
      const topics = content.topics
        .filter((item) => item.suspectId === person.id)
        .filter((item) => !item.requires || evalCond(state, item.requires))
        .map((item) => ({
          id: item.id,
          label: item.label,
          asked: state.topicsAsked.includes(item.id),
          speech: state.topicsAsked.includes(item.id) ? item.speech.slice() : null,
        }));
      return {
        id: person.id,
        name: person.name,
        role: person.role,
        presence: person.presence,
        hasNewTopic: topics.some((item) => !item.asked),
        topics,
      };
    });
  const notebook = { evidence: [], statements: [], deductions: [] };
  for (const id of state.evidence) {
    const entry = content.evidence.find((item) => item.id === id);
    if (!entry) continue;
    const view = evidenceView(entry, state);
    if (entry.kind === "statement") notebook.statements.push(view);
    else notebook.evidence.push(view);
  }
  for (const id of state.deductions) {
    const rule = content.deductions.find((item) => item.id === id);
    if (!rule) continue;
    const choice = rule.choices.find((item) => item.id === rule.correctChoice);
    notebook.deductions.push({
      id: rule.id,
      kind: "deduction",
      title: choice ? choice.label : rule.prompt,
      source: "Deduction desk",
      description: rule.prompt,
      facts: [rule.explanation],
      related: [],
      isNew: state.unread.includes(rule.id),
    });
  }
  const deductions = content.deductions
    .filter((item) => state.deductions.includes(item.id) || evalCond(state, item.unlock))
    .map((item) => {
      const settled = state.deductions.includes(item.id);
      return {
        id: item.id,
        prompt: item.prompt,
        settled,
        choices: settled ? [] : item.choices.map((choice) => ({ id: choice.id, label: choice.label })),
        explanation: settled ? item.explanation : null,
      };
    });
  const feedback = state.lastFeedback
    ? {
        kind: state.lastFeedback.kind,
        text: state.lastFeedback.text || null,
        result: state.lastFeedback.result || null,
        level: state.lastFeedback.level ?? null,
        evidenceId: state.lastFeedback.evidenceId || null,
        deductionId: state.lastFeedback.deductionId || null,
      }
    : null;
  return {
    phase: state.phase,
    locationId: state.locationId,
    intro: {
      eyebrow: content.intro.eyebrow,
      title: content.intro.title,
      deck: content.intro.deck,
      paragraphs: content.intro.paragraphs.slice(),
      contentNote: content.intro.contentNote,
      objective: content.intro.objective,
    },
    locations: content.locations.map((item) => ({ id: item.id, name: item.name, blurb: item.blurb })),
    room: room
      ? { id: room.id, name: room.name, blurb: room.blurb, objects, people }
      : null,
    notebook,
    unreadCount: state.unread.length,
    deductions,
    feedback,
    hint:
      feedback && feedback.kind === "hint"
        ? { text: feedback.text, level: feedback.level }
        : null,
    ending:
      state.phase === "ending"
        ? { title: content.ending.title, paragraphs: content.ending.paragraphs.slice() }
        : null,
    hintUses: state.hintUses,
    accusationCount: state.accusationCount,
    attachmentOptions: notebook.evidence
      .concat(notebook.statements, notebook.deductions)
      .map((item) => ({ id: item.id, title: item.title, kind: item.kind })),
  };
}

export function getAccusationForm() {
  return {
    supportCount: 3,
    steps: content.accusation.steps.map((step) => ({
      id: step.id,
      prompt: step.prompt,
      options: step.options.map((item) => ({ id: item.id, label: item.label })),
    })),
  };
}

export function pickProgress(state) {
  return {
    v: 1,
    phase: state.phase,
    locationId: state.locationId,
    inspected: state.inspected.slice(),
    evidence: state.evidence.slice(),
    topicsAsked: state.topicsAsked.slice(),
    deductions: state.deductions.slice(),
    accusationCount: state.accusationCount,
    hint: { objectiveId: state.hint.objectiveId, level: state.hint.level },
    hintUses: state.hintUses,
    endingId: state.endingId,
    unread: state.unread.slice(),
    lastFeedback: null,
  };
}
