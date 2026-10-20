import type { GameContent } from "../content/types";
import { collectedClueIds, setSatisfies, topicUnlocked } from "./logic";
import type { GameState } from "./state";

export function isObjectiveMet(objectiveId: string, state: GameState): boolean {
  if (objectiveId === "closed") return false;
  if (objectiveId === "accuse") return state.phase === "ended";
  const [kind, id] = splitObjective(objectiveId);
  if (kind === "visit") return state.visited.includes(id);
  if (kind === "inspect") return state.inspected.includes(id);
  if (kind === "topic") return state.heard.includes(id);
  if (kind === "deduce") return state.deductions.some((record) => record.id === id);
  return false;
}

function splitObjective(objectiveId: string): [string, string] {
  const index = objectiveId.indexOf(":");
  if (index < 0) return [objectiveId, ""];
  return [objectiveId.slice(0, index), objectiveId.slice(index + 1)];
}

export function firstUnmet(state: GameState, content: GameContent): string {
  if (state.phase === "ended") return "closed";
  const held = new Set(collectedClueIds(state, content));
  for (const location of content.locations) {
    if (!state.visited.includes(location.id)) return `visit:${location.id}`;
    for (const obj of content.objects.filter((item) => item.locationId === location.id)) {
      if (!state.inspected.includes(obj.id)) return `inspect:${obj.id}`;
    }
  }
  for (const topic of content.topics) {
    if (!state.heard.includes(topic.id) && topicUnlocked(content, topic.id, held)) {
      return `topic:${topic.id}`;
    }
  }
  for (const ded of content.deductions) {
    const made = state.deductions.some((record) => record.id === ded.id);
    if (!made && setSatisfies([...held], ded.minimalSets)) return `deduce:${ded.id}`;
  }
  if (state.phase === "play") return "accuse";
  return "closed";
}

function locationName(content: GameContent, id: string): string {
  return content.locations.find((item) => item.id === id)?.name ?? id;
}

export function hintText(
  objectiveId: string,
  level: number,
  state: GameState,
  content: GameContent,
): string {
  const capped = Math.min(3, Math.max(1, level));
  if (objectiveId === "closed") {
    return "The account is in. You can still read the notebook. There is no further question to solve.";
  }
  if (objectiveId === "accuse") {
    if (capped === 1) return "Open Write the account when you are ready.";
    if (capped === 2) {
      return "Choose a person, an act, and a motive, and attach two or three notes that record the same event.";
    }
    const pair = content.solution.rawMinimalSets[0] ?? [];
    const titles = pair
      .map((id) => content.clues.find((clue) => clue.id === id)?.title ?? id)
      .join(" and ");
    return `A sufficient set you already hold is ${titles}. Match the act to what those notes say. This hint does not pick the dropdowns for you.`;
  }
  const [kind, id] = splitObjective(objectiveId);
  if (kind === "visit") {
    const name = locationName(content, id);
    if (capped === 1) return `You have not been to ${name}.`;
    if (capped === 2) return `Use Travel and choose ${name}.`;
    return `Use Travel, choose ${name}, then use the object list there.`;
  }
  if (kind === "inspect") {
    const obj = content.objects.find((item) => item.id === id);
    const room = locationName(content, obj?.locationId ?? "");
    const label = obj?.label ?? id;
    if (capped === 1) return `${room} still has something you have not logged.`;
    if (capped === 2) return `Inspect ${label}. It is in the object list for ${room}.`;
    return `Inspect ${label} in ${room}. Use the object list. There is nothing to find by searching the artwork.`;
  }
  if (kind === "topic") {
    const topic = content.topics.find((item) => item.id === id);
    const suspect = content.suspects.find((item) => item.id === topic?.suspectId);
    const who = suspect?.name ?? "Someone";
    const room = locationName(content, suspect?.locationId ?? "");
    if (capped === 1) return `${who} has a question you have not asked.`;
    if (capped === 2) return `Ask ${who}: ${topic?.prompt ?? id}`;
    return `Travel to ${room}, ask ${who}, and choose: ${topic?.prompt ?? id}`;
  }
  if (kind === "deduce") {
    const ded = content.deductions.find((item) => item.id === id);
    const question = ded?.question ?? id;
    if (capped === 1) return `Open Deductions and look at this question: ${question}`;
    if (capped === 2) return `That question can be answered from notes you already logged. Question: ${question}`;
    const held = new Set(collectedClueIds(state, content));
    const minimal = ded?.minimalSets.find((set) => set.every((clueId) => held.has(clueId)));
    const titles = (minimal ?? [])
      .map((clueId) => content.clues.find((clue) => clue.id === clueId)?.title ?? clueId)
      .join(" and ");
    return `Open Deductions, question "${question}", and attach notes that include ${titles}. The hint names notes, not the correct conclusion.`;
  }
  return "Read the notebook and compare the hold cart with the dock reader or the parking checklist.";
}
