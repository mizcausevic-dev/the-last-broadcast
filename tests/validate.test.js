import assert from "node:assert/strict";
import test from "node:test";
import { content } from "../js/content.js";
import { validateContent } from "../js/validate.js";

test("the shipped case passes content validation", () => {
  const result = validateContent();
  assert.deepEqual(result.errors, []);
});

test("duplicate ids and broken references fail validation", () => {
  const broken = structuredClone(content);
  broken.objects[0].evidenceId = "ev-missing";
  const result = validateContent(broken);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((line) => line.includes("bad evidence")));
});

test("ending anchors are already in the notebook corpus", () => {
  const corpus = content.evidence.flatMap((item) => [item.description, ...item.facts])
    .concat(content.topics.flatMap((item) => item.speech))
    .concat(content.deductions.map((item) => item.explanation))
    .join("\n");
  for (const anchor of ["11:12", "11:16", "11:21", "11:22", "12:06", "Priya Shah", "community calendar", "paid public service", "Tuesday", "headphone cup"]) {
    assert.ok(corpus.includes(anchor), anchor);
  }
});

test("hint lines stay directional before the explicit step", () => {
  const banned = [/Priya/, /substitute/, /on her own/, /scripted/];
  for (const hint of content.hints) {
    for (const line of hint.lines.slice(0, 2)) {
      for (const pattern of banned) assert.doesNotMatch(line, pattern, hint.id);
    }
  }
});
