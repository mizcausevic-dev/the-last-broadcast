export interface DeductionRecord {
  id: string;
  optionId: string;
  supportIds: string[];
}

export interface AccusationRecord {
  personId: string;
  actionId: string;
  motiveId: string;
  supportIds: string[];
  outcome: string;
}

export interface HintState {
  objectiveId: string;
  level: number;
  text: string;
  repeats: number;
}

export interface LogEntry {
  id: string;
  text: string;
}

export interface GameState {
  format: 1;
  phase: "title" | "play" | "ended";
  revision: number;
  locationId: string;
  visited: string[];
  inspected: string[];
  heard: string[];
  deductions: DeductionRecord[];
  failedKeys: string[];
  accusations: AccusationRecord[];
  resolution: null | {
    personId: string;
    actionId: string;
    motiveId: string;
    supportIds: string[];
  };
  hint: HintState | null;
  log: LogEntry[];
}

export function initialState(): GameState {
  return {
    format: 1,
    phase: "title",
    revision: 0,
    locationId: "lobby",
    visited: ["lobby"],
    inspected: [],
    heard: [],
    deductions: [],
    failedKeys: [],
    accusations: [],
    resolution: null,
    hint: null,
    log: [],
  };
}

export type Action =
  | { type: "start" }
  | { type: "travel"; locationId: string }
  | { type: "inspect"; objectId: string }
  | { type: "talk"; topicId: string }
  | { type: "deduce"; deductionId: string; optionId: string; supportIds: string[] }
  | {
      type: "accuse";
      personId: string;
      actionId: string;
      motiveId: string;
      supportIds: string[];
    }
  | { type: "hint"; escalate: boolean }
  | { type: "reset"; confirm: boolean };

export interface ApplyResult {
  ok: boolean;
  changed: boolean;
  code: string;
  message: string;
  outcome?: string;
  state: GameState;
}

export function cloneState(state: GameState): GameState {
  return structuredClone(state);
}
