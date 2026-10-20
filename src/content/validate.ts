import type { GameContent } from "./types";

function unique(ids: string[]): boolean {
  return new Set(ids).size === ids.length;
}

export function validateContent(content: GameContent): string[] {
  const problems: string[] = [];
  const locIds = content.locations.map((l) => l.id);
  const objIds = content.objects.map((o) => o.id);
  const clueIds = new Set(content.clues.map((c) => c.id));
  const topicIds = content.topics.map((t) => t.id);
  const dedIds = content.deductions.map((d) => d.id);
  const people = new Set(content.people.map((p) => p.id));
  const acts = new Set(content.acts.map((a) => a.id));
  const motives = new Set(content.motives.map((m) => m.id));

  if (!unique(locIds)) problems.push("duplicate location id");
  if (!unique(objIds)) problems.push("duplicate object id");
  if (!unique([...clueIds])) problems.push("duplicate clue id");
  if (!unique(topicIds)) problems.push("duplicate topic id");
  if (!unique(dedIds)) problems.push("duplicate deduction id");
  if (content.locations.length !== 4) problems.push("expected 4 locations");
  if (content.suspects.length !== 3) problems.push("expected 3 suspects");
  if (content.clues.length < 8 || content.clues.length > 12) {
    problems.push("clue count outside 8 to 12");
  }
  if (content.deductions.length < 3 || content.deductions.length > 5) {
    problems.push("deduction count outside 3 to 5");
  }

  const suspectIds = new Set(content.suspects.map((s) => s.id));
  for (const suspect of content.suspects) {
    if (!locIds.includes(suspect.locationId)) {
      problems.push(`suspect ${suspect.id} has unknown location`);
    }
  }

  const granted = new Set<string>();
  for (const obj of content.objects) {
    if (!locIds.includes(obj.locationId)) {
      problems.push(`object ${obj.id} has unknown location`);
    }
    if (!clueIds.has(obj.grants)) {
      problems.push(`object ${obj.id} grants unknown clue`);
    }
    granted.add(obj.grants);
  }
  for (const clue of content.clues) {
    if (!granted.has(clue.id)) problems.push(`clue ${clue.id} is never granted`);
    for (const conflict of clue.conflicts) {
      if (!conflict.text.trim()) problems.push(`empty conflict on ${clue.id}`);
    }
  }

  for (const topic of content.topics) {
    if (!suspectIds.has(topic.suspectId)) {
      problems.push(`topic ${topic.id} has unknown suspect`);
    }
    for (const id of [...topic.requiresAll, ...topic.requiresAny]) {
      if (!clueIds.has(id)) problems.push(`topic ${topic.id} requires unknown ${id}`);
    }
    if (!topic.text.trim() || !topic.prompt.trim()) {
      problems.push(`topic ${topic.id} missing text`);
    }
  }

  for (const ded of content.deductions) {
    const correct = ded.options.filter((o) => o.correct);
    if (correct.length !== 1) problems.push(`deduction ${ded.id} needs one correct option`);
    if (!unique(ded.options.map((o) => o.id))) {
      problems.push(`deduction ${ded.id} has duplicate options`);
    }
    if (ded.minimalSets.length < 1) problems.push(`deduction ${ded.id} has no sets`);
    for (const set of ded.minimalSets) {
      if (set.length < 2 || set.length > 3) {
        problems.push(`deduction ${ded.id} minimal set size`);
      }
      for (const id of set) {
        if (!clueIds.has(id)) problems.push(`deduction ${ded.id} cites unknown ${id}`);
      }
    }
  }

  const sol = content.solution;
  if (!people.has(sol.personId)) problems.push("solution person missing");
  if (!acts.has(sol.actionId)) problems.push("solution act missing");
  if (!motives.has(sol.motiveId)) problems.push("solution motive missing");
  if (!dedIds.includes(sol.deductionSupportId)) {
    problems.push("solution deduction support missing");
  }
  for (const set of sol.rawMinimalSets) {
    if (set.length < 2 || set.length > 3) problems.push("solution set size");
    for (const id of set) {
      if (!clueIds.has(id)) problems.push(`solution cites unknown ${id}`);
    }
  }
  for (const id of sol.relevantIds) {
    if (!clueIds.has(id) && !dedIds.includes(id)) {
      problems.push(`relevant id unknown ${id}`);
    }
  }

  const optionIds = new Set(content.deductions.flatMap((d) => d.options.map((o) => o.id)));
  for (const clue of content.clues) {
    for (const conflict of clue.conflicts) {
      if (conflict.kind === "deduction-option" && !optionIds.has(conflict.id)) {
        problems.push(`conflict option missing ${conflict.id}`);
      }
      if (conflict.kind === "accuse-action" && !acts.has(conflict.id)) {
        problems.push(`conflict act missing ${conflict.id}`);
      }
      if (conflict.kind === "accuse-person" && !people.has(conflict.id)) {
        problems.push(`conflict person missing ${conflict.id}`);
      }
      if (conflict.kind === "accuse-motive" && !motives.has(conflict.id)) {
        problems.push(`conflict motive missing ${conflict.id}`);
      }
    }
  }

  const heardIds = new Set(topicIds);
  for (const block of content.ending) {
    for (const id of block.clues) {
      if (!clueIds.has(id)) problems.push(`ending ${block.id} clue ${id}`);
    }
    for (const id of [...block.heard, ...block.hideIfHeard]) {
      if (!heardIds.has(id)) problems.push(`ending ${block.id} topic ${id}`);
    }
  }

  const publicText = [
    content.contentNote,
    content.shortNote,
    ...content.locations.map((l) => `${l.name}\n${l.body}`),
    ...content.objects.map((o) => `${o.label}\n${o.teaser}`),
    ...content.topics.map((t) => t.prompt),
    ...content.deductions.flatMap((d) => [d.question, ...d.options.map((o) => o.label)]),
    ...content.people.map((p) => p.label),
    ...content.acts.map((a) => a.label),
    ...content.motives.map((m) => m.label),
  ].join("\n");
  for (const canary of content.canaries) {
    if (publicText.includes(canary)) {
      problems.push(`canary leaked into a public label: ${canary}`);
    }
  }

  return problems;
}
