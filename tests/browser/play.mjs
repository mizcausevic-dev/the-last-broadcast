import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const root = fileURLToPath(new URL("../../", import.meta.url));

const results = [];
function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? `: ${detail}` : ""}`);
}

const server = spawn("python3", ["-m", "http.server", "4173", "--bind", "127.0.0.1"], {
  cwd: root,
  stdio: "ignore",
});

await new Promise((resolve) => setTimeout(resolve, 400));

const browser = await chromium.launch({
  executablePath: "/usr/bin/google-chrome",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

async function pageOf(context, options = {}) {
  const page = await context.newPage();
  if (options.viewport) await page.setViewportSize(options.viewport);
  page.on("pageerror", (error) => console.log("PAGEERROR", error.message));
  await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
  return page;
}

async function click(page, action, id) {
  const selector = id ? `[data-action="${action}"][data-id="${id}"]` : `[data-action="${action}"]`;
  await page.locator(selector).first().click();
}

async function close(page) {
  await page.locator("[role='dialog'] [data-action='close']").click();
}

async function setAttach(page, ids) {
  const buttons = page.locator("[data-action='toggle-attach']");
  const count = await buttons.count();
  for (let i = 0; i < count; i += 1) {
    const button = buttons.nth(i);
    const id = await button.getAttribute("data-id");
    const on = (await button.getAttribute("aria-pressed")) === "true";
    if (on !== ids.includes(id)) await button.click();
  }
}

try {
  const context = await browser.newContext();
  const page = await pageOf(context);
  const titleText = await page.locator("body").innerText();
  record("title shows the case and content note", titleText.includes("June Pell") && titleText.includes("Content note"), "opening copy");
  record("title does not reveal the solution", !titleText.includes("Priya") && !titleText.includes("Dawn is a handoff"), "no ending sentence");

  await click(page, "begin");
  await page.waitForSelector("[data-screen='play']");
  record("begin opens the booth", (await page.locator("[data-screen='play']").count()) === 1, "");

  await click(page, "hint");
  const hint = await page.locator("[role='dialog']").innerText();
  record("first hint is directional", /booth/i.test(hint) && !/Priya|substitute/i.test(hint), "");
  await page.locator("[role='dialog'] [data-action='hint']").click();
  const sharper = await page.locator("[role='dialog']").innerText();
  record("a second hint gets more specific without the solution", sharper !== hint && !/Priya|substitute/i.test(sharper), "");
  await close(page);

  await click(page, "inspect", "obj-log");
  await close(page);
  await click(page, "inspect", "obj-log");
  await close(page);
  await click(page, "open-notebook");
  record("repeat inspect does not duplicate", await page.locator("[data-entry='ev-booth-log']").count() === 1, "");
  await close(page);

  await click(page, "inspect", "obj-board");
  await close(page);
  await click(page, "inspect", "obj-reel");
  await close(page);
  await click(page, "open-accuse");
  for (const [step, id] of [["status", "inside"], ["route", "unknown"], ["purpose", "unclear"], ["conduct", "none"]]) {
    await page.locator(`[data-action="accuse-option"][data-step="${step}"][data-id="${id}"]`).click();
  }
  await setAttach(page, ["ev-booth-log", "ev-board", "ev-reel"]);
  await click(page, "submit-accuse");
  const wrong = await page.locator("[role='dialog']").innerText();
  record("wrong explanation stays in the investigation", wrong.includes("exit") && await page.locator("[data-screen='play']").count() === 1, "");
  await close(page);

  await click(page, "move", "dock");
  await click(page, "talk", "cal");
  const earlyTalk = await page.locator("[role='dialog']").innerText();
  record("gated dock question is hidden", !earlyTalk.includes("Who used the dock tonight?"), "");
  await close(page);
  await click(page, "inspect", "obj-latch");
  await close(page);
  await click(page, "talk", "cal");
  const laterTalk = await page.locator("[role='dialog']").innerText();
  record("dock question opens after the latch", laterTalk.includes("Who used the dock tonight?"), "");
  await close(page);

  await click(page, "move", "archive");
  await click(page, "inspect", "obj-binder");
  await close(page);
  await click(page, "inspect", "obj-tray");
  await close(page);
  await page.reload({ waitUntil: "networkidle" });
  await click(page, "continue");
  await click(page, "open-notebook");
  const restored = await page.locator("[data-entry='ev-binder']").count();
  record("reload keeps the notebook", restored === 1, "");
  await close(page);
  await click(page, "inspect", "obj-note");
  const noteText = await page.locator("[role='dialog']").innerText();
  record("the note is readable before the ending", noteText.includes("Priya Shah") && !noteText.includes("Dawn is a handoff"), "");
  await close(page);

  await click(page, "open-deduce");
  await click(page, "pick-deduction", "ded-file-swap");
  await click(page, "pick-choice", "swap");
  await click(page, "toggle-support", "ev-binder");
  await click(page, "toggle-support", "ev-printout");
  await click(page, "submit-deduction");
  record("a supported deduction explains itself", (await page.locator("[role='dialog']").innerText()).includes("12:06"), "");
  await click(page, "pick-deduction", "ded-dock-exit");
  await click(page, "pick-choice", "stayed");
  await click(page, "toggle-support", "ev-note");
  await click(page, "toggle-support", "ev-dock");
  await click(page, "submit-deduction");
  record("an unsupported conclusion does not settle", (await page.locator("[role='dialog']").innerText()).includes("do not show"), "");
  await click(page, "pick-choice", "dock");
  await click(page, "submit-deduction");
  record("the exit deduction can use the note and the latch", (await page.locator("[role='dialog']").innerText()).includes("The latch was taped"), "");
  await close(page);

  await click(page, "open-accuse");
  for (const [step, id] of [["status", "left"], ["route", "dock"], ["purpose", "deliver"], ["conduct", "ellis"]]) {
    await page.locator(`[data-action="accuse-option"][data-step="${step}"][data-id="${id}"]`).click();
  }
  await setAttach(page, ["ev-booth-log", "ev-board", "ev-reel"]);
  await click(page, "submit-accuse");
  const thin = await page.locator("[role='dialog']").innerText();
  record("right outline without proof is not the ending", thin.includes("do not establish") && await page.locator("[data-screen='ending']").count() === 0, "");
  await close(page);

  await click(page, "open-accuse");
  for (const [step, id] of [["status", "left"], ["route", "dock"], ["purpose", "deliver"], ["conduct", "ellis"]]) {
    await page.locator(`[data-action="accuse-option"][data-step="${step}"][data-id="${id}"]`).click();
  }
  await setAttach(page, ["ded-dock-exit", "ded-file-swap", "ev-note"]);
  const beforeEnd = await page.locator("body").innerText();
  record("ending text is absent before success", !beforeEnd.includes("Dawn is a handoff"), "");
  await click(page, "submit-accuse");
  await page.waitForSelector("[data-screen='ending']");
  const ending = await page.locator("[data-screen='ending']").innerText();
  record("supported explanation reaches the ending", ending.includes("Dawn is a handoff") && ending.includes("Priya Shah"), "");

  await page.keyboard.press("Tab");
  await click(page, "open-notebook");
  await page.waitForSelector("[role='dialog']");
  let trapped = true;
  for (let i = 0; i < 14; i += 1) {
    await page.keyboard.press("Tab");
    trapped = await page.evaluate(() => document.querySelector("[role='dialog']")?.contains(document.activeElement));
    if (!trapped) break;
  }
  record("dialog keeps keyboard focus", trapped, "");
  await page.keyboard.press("Escape");
  await page.waitForSelector("[role='dialog']", { state: "detached" });
  const returned = await page.evaluate(() => document.activeElement?.dataset?.focusId || document.activeElement?.dataset?.action || "");
  record("escape restores the triggering control", returned.includes("notebook") || returned.includes("open-notebook"), returned);
  await click(page, "replay-ask");
  record("reset asks before erasing", (await page.locator("[role='dialog']").innerText()).includes("Erase"), "");
  await click(page, "confirm-no");
  const kept = await page.evaluate(() => localStorage.getItem("tlb-save-v1"));
  record("cancel leaves the finished night", (await page.locator("[data-screen='ending']").count()) === 1 && Boolean(kept), "");
  await click(page, "replay-ask");
  await click(page, "confirm-yes");
  await page.waitForSelector("[data-screen='title']");
  const cleared = await page.evaluate(() => localStorage.getItem("tlb-save-v1"));
  record("confirmed reset clears the save", cleared === null, String(cleared));

  await context.close();

  const narrow = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const phone = await pageOf(narrow);
  await click(phone, "begin");
  const fit = await phone.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
  record("narrow layout does not overflow sideways", fit, "");
  const motion = await phone.evaluate(() => getComputedStyle(document.querySelector(".lamp")).animationDuration);
  const motionSeconds = motion.endsWith("ms") ? parseFloat(motion) / 1000 : parseFloat(motion);
  record("reduced motion collapses the lamp animation", motionSeconds < 0.05, motion);
  await click(phone, "open-notebook");
  const box = await phone.locator("[role='dialog']").boundingBox();
  record("notebook fits the narrow viewport", box.width <= 390 && box.height <= 844, `${Math.round(box.width)}x${Math.round(box.height)}`);
  await narrow.close();

  const broken = await browser.newContext();
  await broken.addInitScript(() => localStorage.setItem("tlb-save-v1", "{nope"));
  const bad = await pageOf(broken);
  record("malformed save shows recovery", (await bad.locator("body").innerText()).includes("can't be read"), "");
  const raw = await bad.evaluate(() => localStorage.getItem("tlb-save-v1"));
  await click(bad, "play-anyway");
  const rawAfter = await bad.evaluate(() => localStorage.getItem("tlb-save-v1"));
  record("malformed save is not overwritten", raw === "{nope" && rawAfter === "{nope", rawAfter);
  await broken.close();

  const tabs = await browser.newContext();
  const first = await pageOf(tabs);
  const second = await pageOf(tabs);
  await click(first, "begin");
  await second.reload({ waitUntil: "networkidle" });
  await click(second, "continue");
  await click(second, "move", "lobby");
  try {
    await first.waitForSelector("text=Another tab saved a newer night", { timeout: 2000 });
  } catch {
    await click(first, "move", "archive");
    await first.waitForSelector("text=Another tab saved a newer night");
  }
  const stored = await first.evaluate(() => JSON.parse(localStorage.getItem("tlb-save-v1")).state.locationId);
  record("second tab does not get overwritten silently", stored === "lobby", stored);
  await tabs.close();
} catch (error) {
  record("browser run", false, error.stack || error.message);
} finally {
  await browser.close();
  server.kill();
}

const failed = results.filter((item) => !item.ok);
console.log(`BROWSER ${results.length - failed.length}/${results.length}`);
process.exit(failed.length ? 1 : 0);
