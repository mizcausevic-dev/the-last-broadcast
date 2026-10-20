import type { GameContent } from "../content/types";
import type { GameState } from "./state";

export const LEADS = {
  supported: "The account holds.",
  "wrong-theory": "Not established.",
  insufficient: "Not enough support.",
  "lucky-guess": "The attached notes do not record this act.",
} as const;

export type AccuseOutcome = keyof typeof LEADS;

export function setSatisfies(selected: string[], minimalSets: string[][]): boolean {
  const set = new Set(selected);
  return minimalSets.some((min) => min.every((id) => set.has(id)));
}

export function collectedClueIds(state: GameState, content: GameContent): string[] {
  const ids: string[] = [];
  for (const objectId of state.inspected) {
    const obj = content.objects.find((item) => item.id === objectId);
    if (obj && !ids.includes(obj.grants)) ids.push(obj.grants);
  }
  return ids;
}

export function clueSourceIds(
  state: GameState,
  content: GameContent,
  clueId: string,
): string[] {
  return state.inspected.filter((objectId) => {
    const obj = content.objects.find((item) => item.id === objectId);
    return obj?.grants === clueId;
  });
}

export function notebookEntryIds(state: GameState, content: GameContent): string[] {
  return [
    ...collectedClueIds(state, content),
    ...state.deductions.map((record) => record.id),
  ];
}

export function topicUnlocked(
  content: GameContent,
  topicId: string,
  held: Set<string>,
): boolean {
  const topic = content.topics.find((item) => item.id === topicId);
  if (!topic) return false;
  if (topic.requiresAll.some((id) => !held.has(id))) return false;
  if (topic.requiresAny.length > 0 && !topic.requiresAny.some((id) => held.has(id))) {
    return false;
  }
  return true;
}

export function accusationSupported(supportIds: string[], content: GameContent): boolean {
  if (setSatisfies(supportIds, content.solution.rawMinimalSets)) return true;
  return (
    supportIds.includes(content.solution.deductionSupportId) && supportIds.length >= 2
  );
}

export interface ClassifiedAccusation {
  outcome: AccuseOutcome;
  message: string;
}

function entryLine(content: GameContent, id: string): string {
  const clue = content.clues.find((item) => item.id === id);
  if (clue) return `${clue.title}: ${clue.scopeNote}`;
  const ded = content.deductions.find((item) => item.id === id);
  if (ded) return `${ded.question}: a conclusion you already accepted from other notes.`;
  return id;
}

function conflictLines(
  content: GameContent,
  supportIds: string[],
  personId: string,
  actionId: string,
  motiveId: string,
): string[] {
  const lines: string[] = [];
  for (const id of supportIds) {
    const clue = content.clues.find((item) => item.id === id);
    if (!clue) continue;
    for (const conflict of clue.conflicts) {
      const hit =
        (conflict.kind === "accuse-action" && conflict.id === actionId) ||
        (conflict.kind === "accuse-person" && conflict.id === personId) ||
        (conflict.kind === "accuse-motive" && conflict.id === motiveId);
      if (hit) lines.push(conflict.text);
    }
  }
  return lines;
}

export function classifyAccusation(
  content: GameContent,
  personId: string,
  actionId: string,
  motiveId: string,
  supportIds: string[],
): ClassifiedAccusation {
  const sol = content.solution;
  const theory =
    personId === sol.personId && actionId === sol.actionId && motiveId === sol.motiveId;
  const notes = supportIds.map((id) => entryLine(content, id)).join(" ");
  const conflicts = conflictLines(content, supportIds, personId, actionId, motiveId);

  if (theory && accusationSupported(supportIds, content)) {
    return {
      outcome: "supported",
      message: `${LEADS.supported} The ending repeats notes you already logged. ${notes}`,
    };
  }

  if (!theory) {
    const extra =
      conflicts.length > 0
        ? conflicts.join(" ")
        : "The attached notes do not establish the person, act, and motive you selected.";
    return { outcome: "wrong-theory", message: `${LEADS["wrong-theory"]} ${extra}` };
  }

  const relevant = supportIds.some((id) => sol.relevantIds.includes(id));
  if (!relevant) {
    return {
      outcome: "lucky-guess",
      message: `${LEADS["lucky-guess"]} None of the attached notes is a dock exit, a parking exit, the hold cart, the board, or the sister segment. ${notes}`,
    };
  }
  return {
    outcome: "insufficient",
    message: `${LEADS.insufficient} Some attached notes touch the night's events, but they do not complete a proof of a chosen exit. ${notes}`,
  };
}

export function deductionMessage(
  content: GameContent,
  deductionId: string,
  optionId: string,
  supportIds: string[],
  accepted: boolean,
): string {
  const ded = content.deductions.find((item) => item.id === deductionId);
  const option = ded?.options.find((item) => item.id === optionId);
  const notes = supportIds.map((id) => entryLine(content, id)).join(" ");
  const conflicts: string[] = [];
  for (const id of supportIds) {
    const clue = content.clues.find((item) => item.id === id);
    if (!clue) continue;
    for (const conflict of clue.conflicts) {
      if (conflict.kind === "deduction-option" && conflict.id === optionId) {
        conflicts.push(conflict.text);
      }
    }
  }
  if (accepted) {
    return `Accepted. ${option?.label ?? ""} The notes you attached record the same event, and this conclusion stays in the notebook. ${notes}`;
  }
  if (conflicts.length > 0) {
    return `Not accepted. ${option?.label ?? ""} ${conflicts.join(" ")} ${notes}`;
  }
  return `Not accepted. ${option?.label ?? ""} does not follow from these notes. ${notes}`;
}
