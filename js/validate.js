// Static checks for the authored case. Errors name ids, not a walkthrough.

import { content } from "./content.js";
import { evalCond, supportCovers } from "./engine.js";

const OPS = new Set([
  "phasePlay",
  "never",
  "hasEvidence",
  "hasDeduction",
  "hasTopic",
  "hasInspected",
  "evidenceAtLeast",
  "not",
  "all",
  "any",
  "supportReady",
]);

export function validateContent(data = content) {
  const errors = [];
  const ids = new Map();
  function claim(id, where) {
    if (typeof id !== "string" || !id) errors.push(`${where} missing id`);
    else if (ids.has(id)) errors.push(`duplicate id ${id}`);
    else ids.set(id, where);
  }
  for (const item of data.locations) claim(item.id, "location");
  for (const item of data.objects) claim(item.id, "object");
  for (const item of data.suspects) claim(item.id, "suspect");
  for (const item of data.evidence) claim(item.id, "evidence");
  for (const item of data.topics) claim(item.id, "topic");
  for (const item of data.deductions) claim(item.id, "deduction");
  for (const item of data.hints) claim(item.id, "hint");

  const evidenceIds = new Set(data.evidence.map((item) => item.id));
  const deductionIds = new Set(data.deductions.map((item) => item.id));
  const topicIds = new Set(data.topics.map((item) => item.id));
  const objectIds = new Set(data.objects.map((item) => item.id));
  const locationIds = new Set(data.locations.map((item) => item.id));
  const suspectIds = new Set(data.suspects.map((item) => item.id));

  function walk(cond, where) {
    if (cond == null) return;
    if (!cond.op || !OPS.has(cond.op)) {
      errors.push(`${where} bad condition`);
      return;
    }
    if (cond.op === "hasEvidence" && !evidenceIds.has(cond.id)) errors.push(`${where} missing evidence ${cond.id}`);
    if (cond.op === "hasDeduction" && !deductionIds.has(cond.id)) errors.push(`${where} missing deduction ${cond.id}`);
    if (cond.op === "hasTopic" && !topicIds.has(cond.id)) errors.push(`${where} missing topic ${cond.id}`);
    if (cond.op === "hasInspected" && !objectIds.has(cond.id)) errors.push(`${where} missing object ${cond.id}`);
    if (cond.op === "supportReady" && !deductionIds.has(cond.id)) errors.push(`${where} bad supportReady`);
    if (cond.op === "evidenceAtLeast" && (!Number.isInteger(cond.n) || cond.n < 1)) errors.push(`${where} bad count`);
    if (cond.op === "not") walk(cond.cond, where);
    if (cond.op === "all" || cond.op === "any") {
      if (!Array.isArray(cond.of) || cond.of.length === 0) errors.push(`${where} empty group`);
      else cond.of.forEach((item, index) => walk(item, `${where}[${index}]`));
    }
  }

  for (const item of data.objects) {
    if (!locationIds.has(item.locationId)) errors.push(`${item.id} bad location`);
    if (!evidenceIds.has(item.evidenceId)) errors.push(`${item.id} bad evidence`);
    if (!item.label) errors.push(`${item.id} missing label`);
  }
  for (const item of data.suspects) {
    if (!locationIds.has(item.locationId)) errors.push(`${item.id} bad location`);
    if (!item.name || !item.role || !item.presence) errors.push(`${item.id} missing copy`);
  }
  const produced = new Map();
  function produce(evidenceId, source) {
    if (produced.has(evidenceId)) errors.push(`${evidenceId} produced twice`);
    produced.set(evidenceId, source);
  }
  for (const item of data.objects) produce(item.evidenceId, item.id);
  for (const item of data.topics) {
    if (!suspectIds.has(item.suspectId)) errors.push(`${item.id} bad suspect`);
    if (!item.label || !Array.isArray(item.speech) || item.speech.length === 0) errors.push(`${item.id} missing speech`);
    if (!evidenceIds.has(item.evidenceId)) errors.push(`${item.id} bad statement`);
    const entry = data.evidence.find((row) => row.id === item.evidenceId);
    if (entry && entry.kind !== "statement") errors.push(`${item.id} records a non-statement`);
    walk(item.requires, item.id);
    produce(item.evidenceId, item.id);
  }
  for (const item of data.evidence) {
    if (!item.title || !item.source || !item.description || !Array.isArray(item.facts) || item.facts.length === 0) {
      errors.push(`${item.id} missing fields`);
    }
    if (!["evidence", "statement"].includes(item.kind)) errors.push(`${item.id} bad kind`);
    for (const related of item.related || []) {
      if (!evidenceIds.has(related) && !deductionIds.has(related)) errors.push(`${item.id} related ${related}`);
    }
    if (!produced.has(item.id)) errors.push(`${item.id} has no producer`);
  }
  for (const item of data.deductions) {
    if (!item.prompt || !item.explanation) errors.push(`${item.id} missing copy`);
    if (!item.choices.some((choice) => choice.id === item.correctChoice)) errors.push(`${item.id} bad correct choice`);
    walk(item.unlock, item.id);
    if (!Array.isArray(item.supports) || item.supports.length === 0) errors.push(`${item.id} missing supports`);
    for (const set of item.supports || []) {
      if (!Array.isArray(set) || set.length < 2 || set.length > 3) errors.push(`${item.id} bad support size`);
      for (const id of set) {
        if (!evidenceIds.has(id)) errors.push(`${item.id} support ${id} is not evidence`);
      }
    }
  }
  for (const item of data.hints) {
    if (!Array.isArray(item.lines) || item.lines.length !== 3 || item.lines.some((line) => !line)) {
      errors.push(`${item.id} needs 3 lines`);
    }
    walk(item.complete, `${item.id} complete`);
    walk(item.actionable, `${item.id} actionable`);
  }
  if (!data.intro?.title || !data.intro.contentNote || !data.intro.objective || data.intro.paragraphs.length < 4) {
    errors.push("intro is incomplete");
  }
  if (!data.ending?.title || data.ending.paragraphs.length < 4) errors.push("ending is incomplete");
  const stepIds = data.accusation.steps.map((step) => step.id);
  for (const key of Object.keys(data.accusation.success)) {
    if (!stepIds.includes(key)) errors.push(`success key ${key}`);
    const step = data.accusation.steps.find((item) => item.id === key);
    if (step && !step.options.some((item) => item.id === data.accusation.success[key])) {
      errors.push(`success value ${key}`);
    }
  }
  for (const key of ["insufficient", "plausibleRoute", "plausibleReason", "inside", "incorrect"]) {
    if (!data.accusation.feedback[key]) errors.push(`missing feedback ${key}`);
  }

  const empty = {
    phase: "play",
    evidence: [],
    topicsAsked: [],
    deductions: [],
    inspected: [],
    hint: { objectiveId: null, level: 0 },
  };
  const physical = data.evidence.filter((item) => item.kind === "evidence").map((item) => item.id);
  const reachable = new Set(physical);
  let grew = true;
  while (grew) {
    grew = false;
    const probe = { ...empty, evidence: [...reachable] };
    for (const topic of data.topics) {
      if (reachable.has(topic.evidenceId)) continue;
      if (!topic.requires || evalCond(probe, topic.requires)) {
        reachable.add(topic.evidenceId);
        grew = true;
      }
    }
  }
  for (const item of data.evidence) {
    if (!reachable.has(item.id)) errors.push(`${item.id} unreachable`);
  }
  for (const rule of data.deductions) {
    const probe = { ...empty, evidence: [...reachable] };
    if (!evalCond(probe, rule.unlock)) errors.push(`${rule.id} unlock unreachable`);
    if (!rule.supports.some((set) => set.every((id) => reachable.has(id)))) {
      errors.push(`${rule.id} supports unreachable`);
    }
  }
  if (!supportCovers(["ded-dock-exit", "ded-file-swap", "ev-note"])) errors.push("success cover broken");
  return { ok: errors.length === 0, errors };
}
