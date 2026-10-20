import type { GameContent } from "../content/types";
import { visibleEnding } from "./ending";
import { firstUnmet, hintText, isObjectiveMet } from "./hints";
import {
  accusationSupported,
  classifyAccusation,
  collectedClueIds,
  deductionMessage,
  notebookEntryIds,
  setSatisfies,
  topicUnlocked,
} from "./logic";
import {
  type Action,
  type ApplyResult,
  type GameState,
  cloneState,
  initialState,
} from "./state";

function same(state: GameState, code: string, message: string, outcome?: string): ApplyResult {
  return { ok: true, changed: false, code, message, outcome, state };
}

function fail(state: GameState, code: string, message: string): ApplyResult {
  return { ok: false, changed: false, code, message, state };
}

function succeed(
  state: GameState,
  code: string,
  message: string,
  outcome?: string,
): ApplyResult {
  return { ok: true, changed: true, code, message, outcome, state };
}

function pushLog(state: GameState, id: string, text: string): void {
  if (state.log.some((entry) => entry.id === id)) return;
  state.log.push({ id, text });
  if (state.log.length > 80) state.log.splice(0, state.log.length - 80);
}

function bump(state: GameState): void {
  state.revision += 1;
}

function clearMetHint(state: GameState): void {
  if (!state.hint) return;
  if (state.phase === "ended" || isObjectiveMet(state.hint.objectiveId, state)) {
    state.hint = null;
  }
}

export function apply(state: GameState, action: Action, content: GameContent): ApplyResult {
  if (action.type === "reset") {
    if (!action.confirm) {
      return fail(state, "confirm", "Reset needs a confirmation.");
    }
    return succeed(initialState(), "reset", "The case in this tab was cleared.");
  }

  if (action.type === "start") {
    if (state.phase !== "title") {
      return fail(state, "phase", "The case is already open.");
    }
    const next = cloneState(state);
    next.phase = "play";
    bump(next);
    pushLog(next, "start", "You opened the case at 6:12 a.m.");
    return succeed(next, "start", "The board call is at 8:30. The building is yours to walk.");
  }

  if (state.phase === "title") {
    return fail(state, "phase", "Open the case first.");
  }

  if (action.type === "travel") {
    const location = content.locations.find((item) => item.id === action.locationId);
    if (!location) return fail(state, "bad-id", "That room is not in the station.");
    if (state.locationId === location.id) {
      return same(state, "repeat", `You are already in ${location.name}.`);
    }
    const next = cloneState(state);
    next.locationId = location.id;
    if (!next.visited.includes(location.id)) next.visited.push(location.id);
    bump(next);
    clearMetHint(next);
    pushLog(next, `visit:${location.id}`, `You went to ${location.name}.`);
    return succeed(next, "travel", `You are in ${location.name}.`);
  }

  if (action.type === "inspect") {
    const obj = content.objects.find((item) => item.id === action.objectId);
    if (!obj) return fail(state, "bad-id", "That object is not in the station.");
    if (obj.locationId !== state.locationId) {
      const room = content.locations.find((item) => item.id === obj.locationId);
      return fail(state, "wrong-room", `${obj.label} is in ${room?.name ?? "another room"}.`);
    }
    if (state.inspected.includes(obj.id)) {
      return same(state, "repeat", `${obj.label} is already in the notebook.`);
    }
    const next = cloneState(state);
    next.inspected.push(obj.id);
    bump(next);
    clearMetHint(next);
    pushLog(next, `inspect:${obj.id}`, `Logged ${obj.label}.`);
    return succeed(next, "inspect", `Logged ${obj.label}. It is in the notebook.`);
  }

  if (action.type === "talk") {
    const topic = content.topics.find((item) => item.id === action.topicId);
    if (!topic) return fail(state, "bad-id", "That question is not in the case.");
    const suspect = content.suspects.find((item) => item.id === topic.suspectId);
    if (!suspect) return fail(state, "bad-id", "That person is not in the case.");
    if (suspect.locationId !== state.locationId) {
      const room = content.locations.find((item) => item.id === suspect.locationId);
      return fail(state, "wrong-room", `${suspect.name} is in ${room?.name ?? "another room"}.`);
    }
    const held = new Set(collectedClueIds(state, content));
    if (!topicUnlocked(content, topic.id, held)) {
      return fail(state, "gated", "You do not have a note that supports this question yet.");
    }
    if (state.heard.includes(topic.id)) {
      return same(state, "repeat", "That answer is already in the notebook.");
    }
    const next = cloneState(state);
    next.heard.push(topic.id);
    bump(next);
    clearMetHint(next);
    pushLog(next, `talk:${topic.id}`, `Asked ${suspect.name}: ${topic.prompt}`);
    return succeed(next, "talk", `${suspect.name}: ${topic.text}`);
  }

  if (action.type === "deduce") {
    if (state.phase === "ended") {
      return fail(state, "closed", "The account is already in. The notebook stays open.");
    }
    const ded = content.deductions.find((item) => item.id === action.deductionId);
    if (!ded) return fail(state, "bad-id", "That question is not in the case.");
    const option = ded.options.find((item) => item.id === action.optionId);
    if (!option) return fail(state, "bad-id", "That conclusion is not one of the choices.");
    if (action.supportIds.length < 2 || action.supportIds.length > 3) {
      return fail(state, "bad-count", "Choose two or three supporting notes.");
    }
    if (new Set(action.supportIds).size !== action.supportIds.length) {
      return fail(state, "bad-id", "A note was attached twice.");
    }
    const held = new Set(collectedClueIds(state, content));
    for (const id of action.supportIds) {
      if (!held.has(id)) return fail(state, "not-held", "You can only attach notes you have logged.");
    }
    if (state.deductions.some((record) => record.id === ded.id)) {
      return same(state, "repeat", "That deduction is already in the notebook.");
    }
    const key = `deduce:${ded.id}:${option.id}:${[...action.supportIds].sort().join("+")}`;
    const accepted = option.correct && setSatisfies(action.supportIds, ded.minimalSets);
    const message = deductionMessage(content, ded.id, option.id, action.supportIds, accepted);
    if (state.failedKeys.includes(key) && !accepted) {
      return same(state, "repeat", message, accepted ? "accepted" : option.correct ? "rejected-support" : "rejected-option");
    }
    const next = cloneState(state);
    if (accepted) {
      next.deductions.push({
        id: ded.id,
        optionId: option.id,
        supportIds: [...action.supportIds],
      });
      bump(next);
      clearMetHint(next);
      pushLog(next, `deduce:${ded.id}`, `Deduction logged: ${ded.question}`);
      return succeed(next, "deduce", message, "accepted");
    }
    next.failedKeys.push(key);
    bump(next);
    pushLog(next, key, `Deduction declined: ${ded.question}`);
    return succeed(
      next,
      "deduce",
      message,
      option.correct ? "rejected-support" : "rejected-option",
    );
  }

  if (action.type === "accuse") {
    if (state.phase === "ended") {
      return fail(state, "closed", "The account is already in. The notebook stays open.");
    }
    if (!content.people.some((item) => item.id === action.personId)) {
      return fail(state, "bad-id", "That person is not one of the choices.");
    }
    if (!content.acts.some((item) => item.id === action.actionId)) {
      return fail(state, "bad-id", "That act is not one of the choices.");
    }
    if (!content.motives.some((item) => item.id === action.motiveId)) {
      return fail(state, "bad-id", "That motive is not one of the choices.");
    }
    if (action.supportIds.length < 2 || action.supportIds.length > 3) {
      return fail(state, "bad-count", "Choose two or three supporting notes.");
    }
    if (new Set(action.supportIds).size !== action.supportIds.length) {
      return fail(state, "bad-id", "A note was attached twice.");
    }
    const held = new Set(notebookEntryIds(state, content));
    for (const id of action.supportIds) {
      if (!held.has(id)) return fail(state, "not-held", "You can only attach notes you have logged.");
    }
    const classified = classifyAccusation(
      content,
      action.personId,
      action.actionId,
      action.motiveId,
      action.supportIds,
    );
    const key = `accuse:${action.personId}:${action.actionId}:${action.motiveId}:${[...action.supportIds].sort().join("+")}`;
    if (classified.outcome !== "supported" && state.failedKeys.includes(key)) {
      return same(state, "repeat", classified.message, classified.outcome);
    }
    const next = cloneState(state);
    if (classified.outcome === "supported") {
      next.phase = "ended";
      next.resolution = {
        personId: action.personId,
        actionId: action.actionId,
        motiveId: action.motiveId,
        supportIds: [...action.supportIds],
      };
      bump(next);
      next.hint = null;
      pushLog(next, "ending", "You closed the account.");
      const ending = visibleEnding(next, content);
      if (ending.length === 0) {
        return fail(state, "error", "Ending had no available facts. The case was not closed.");
      }
      return succeed(next, "accuse", classified.message, classified.outcome);
    }
    next.accusations.push({
      personId: action.personId,
      actionId: action.actionId,
      motiveId: action.motiveId,
      supportIds: [...action.supportIds],
      outcome: classified.outcome,
    });
    next.failedKeys.push(key);
    bump(next);
    pushLog(next, key, "An account was declined. The case stays open.");
    return succeed(next, "accuse", classified.message, classified.outcome);
  }

  if (action.type === "hint") {
    if (state.phase !== "play") {
      const message =
        state.phase === "ended"
          ? "The account is in. You can still read the notebook."
          : "Open the case first.";
      return fail(state, "phase", message);
    }
    const next = cloneState(state);
    let objectiveId = next.hint?.objectiveId ?? "";
    let level = next.hint?.level ?? 1;
    let repeats = next.hint?.repeats ?? 0;
    const retained = objectiveId !== "" && !isObjectiveMet(objectiveId, next);
    if (!retained) {
      objectiveId = firstUnmet(next, content);
      level = 1;
      repeats = 0;
    } else if (action.escalate) {
      level = Math.min(3, level + 1);
      repeats = 0;
    } else {
      repeats += 1;
    }
    let text = hintText(objectiveId, level, next, content);
    if (level === 3 && repeats > 0) {
      text = `${text} This is as direct as this hint gets.`;
    }
    const unchanged =
      next.hint?.objectiveId === objectiveId &&
      next.hint.level === level &&
      next.hint.text === text &&
      next.hint.repeats === repeats;
    if (unchanged && next.hint) {
      return same(state, "repeat", next.hint.text);
    }
    next.hint = { objectiveId, level, text, repeats };
    bump(next);
    return succeed(next, "hint", text);
  }

  return fail(state, "bad-id", "That action is not in the case.");
}

export function accusationWouldHold(
  state: GameState,
  content: GameContent,
  supportIds: string[],
): boolean {
  return accusationSupported(supportIds, content) && state.phase === "play";
}
