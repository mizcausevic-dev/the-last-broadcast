import type { GameContent } from "../content/types";
import { clueSourceIds, collectedClueIds } from "./logic";
import type { GameState } from "./state";

export interface NotebookClue {
  id: string;
  title: string;
  body: string;
}

export interface NotebookStatement {
  id: string;
  speaker: string;
  prompt: string;
  text: string;
}

export interface NotebookDeduction {
  id: string;
  question: string;
  conclusion: string;
  supportTitles: string[];
}

export interface Notebook {
  clues: NotebookClue[];
  statements: NotebookStatement[];
  deductions: NotebookDeduction[];
}

function riderSuffix(sourceIds: string[]): string {
  const computer = sourceIds.includes("obj-computer");
  const folder = sourceIds.includes("obj-folder");
  if (computer && folder) {
    return " You have both the computer photo, timed 00:41, and the paper in the office folder. They match.";
  }
  if (computer) return " This copy is the photo on the booth computer, timed 00:41.";
  if (folder) return " This copy is the paper in Dennis Crowe's office folder.";
  return "";
}

export function buildNotebook(state: GameState, content: GameContent): Notebook {
  const clues = collectedClueIds(state, content).map((id) => {
    const clue = content.clues.find((item) => item.id === id);
    const sources = clueSourceIds(state, content, id);
    const extra = id === "clue-rider" ? riderSuffix(sources) : "";
    return {
      id,
      title: clue?.title ?? id,
      body: `${clue?.body ?? ""}${extra}`,
    };
  });
  const statements = state.heard.flatMap((id) => {
    const topic = content.topics.find((item) => item.id === id);
    if (!topic) return [];
    const suspect = content.suspects.find((item) => item.id === topic.suspectId);
    return [
      {
        id,
        speaker: suspect?.name ?? topic.suspectId,
        prompt: topic.prompt,
        text: topic.text,
      },
    ];
  });
  const deductions = state.deductions.flatMap((record) => {
    const ded = content.deductions.find((item) => item.id === record.id);
    if (!ded) return [];
    const option = ded.options.find((item) => item.id === record.optionId);
    return [
      {
        id: record.id,
        question: ded.question,
        conclusion: option?.label ?? record.optionId,
        supportTitles: record.supportIds.map(
          (id) => content.clues.find((clue) => clue.id === id)?.title ?? id,
        ),
      },
    ];
  });
  return { clues, statements, deductions };
}
