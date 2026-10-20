export type Stance = "true" | "mistaken" | "lie";

export type ConflictKind =
  | "deduction-option"
  | "accuse-action"
  | "accuse-person"
  | "accuse-motive";

export interface Conflict {
  kind: ConflictKind;
  id: string;
  text: string;
}

export interface LocationDef {
  id: string;
  name: string;
  body: string;
}

export interface ObjectDef {
  id: string;
  locationId: string;
  label: string;
  teaser: string;
  grants: string;
}

export interface ClueDef {
  id: string;
  title: string;
  scopeNote: string;
  body: string;
  conflicts: Conflict[];
}

export interface SuspectDef {
  id: string;
  name: string;
  role: string;
  locationId: string;
  presence: string;
}

export interface TopicDef {
  id: string;
  suspectId: string;
  prompt: string;
  requiresAll: string[];
  requiresAny: string[];
  stance: Stance;
  text: string;
}

export interface DeductionOption {
  id: string;
  label: string;
  correct: boolean;
}

export interface DeductionDef {
  id: string;
  question: string;
  options: DeductionOption[];
  minimalSets: string[][];
}

export interface ChoiceDef {
  id: string;
  label: string;
}

export interface EndingBlock {
  id: string;
  text: string;
  clues: string[];
  heard: string[];
  hideIfHeard: string[];
}

export interface SolutionKey {
  personId: string;
  actionId: string;
  motiveId: string;
  rawMinimalSets: string[][];
  deductionSupportId: string;
  relevantIds: string[];
}

export interface GameContent {
  id: "the-last-broadcast";
  title: string;
  contentNote: string;
  shortNote: string;
  canaries: string[];
  locations: LocationDef[];
  objects: ObjectDef[];
  clues: ClueDef[];
  suspects: SuspectDef[];
  topics: TopicDef[];
  deductions: DeductionDef[];
  people: ChoiceDef[];
  acts: ChoiceDef[];
  motives: ChoiceDef[];
  solution: SolutionKey;
  ending: EndingBlock[];
}
