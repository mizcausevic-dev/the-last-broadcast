import { expect, test, type Page } from "@playwright/test";
import { CANARY_FEE, CANARY_PIN, CANARY_TRANSCRIPT } from "../../src/content/catalog";
import { buildEnvelope, checksumOf } from "../../src/engine/save";

const SAVE_KEY = "last-broadcast-save-v1";
const PRESERVE_KEY = "last-broadcast-preserved-raw";

async function openCase(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByRole("button", { name: "Open the case" }).click();
  await expect(page.getByRole("heading", { name: "Lobby and lot" })).toBeVisible();
}

test("document has no gated transcript before play", async ({ page }) => {
  await page.goto("/");
  const text = await page.evaluate(() => document.documentElement.textContent ?? "");
  const html = await page.content();
  for (const canary of [CANARY_TRANSCRIPT, CANARY_FEE, CANARY_PIN]) {
    expect(text).not.toContain(canary);
    expect(html).not.toContain(canary);
  }
  await expect(page.locator("main")).toContainText("There is no violence, injury, or death");
});

test("keyboard reset dialog cancels and does not delete", async ({ page }) => {
  await openCase(page);
  await page.getByRole("button", { name: "Sign-in clipboard" }).click();
  await expect(page.getByRole("heading", { name: "Sign-in sheet" })).toBeVisible();
  await page.getByRole("button", { name: "Reset" }).focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("button", { name: "Delete the save and start over" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Sign-in sheet" })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Continue the case" }).click();
  await expect(page.getByRole("heading", { name: "Sign-in sheet" })).toBeVisible();
});

test("reaches the ending, rejects a wrong account, and keeps a repeated note", async ({ page }) => {
  await openCase(page);
  await page.getByRole("button", { name: "Dock reader slip" }).click();
  await page.getByRole("button", { name: "Dock reader slip" }).click();
  await expect(page.getByRole("heading", { name: "Dock reader" })).toHaveCount(1);
  await page.getByRole("button", { name: "Go to Air studio" }).click();
  await page.getByRole("button", { name: "Cartridge rack" }).click();
  await expect(page.getByText(CANARY_TRANSCRIPT)).toBeVisible();
  await page.getByRole("button", { name: "Write the account" }).click();
  await page.getByLabel("Person").selectOption("dennis");
  await page.getByLabel("Act").selectOption("act-abducted");
  await page.getByLabel("Motive").selectOption("mot-reed");
  await page.getByRole("checkbox", { name: "Hold cart 17" }).check();
  await page.getByRole("checkbox", { name: "Dock reader" }).check();
  await page.getByRole("button", { name: "Submit the account" }).click();
  await expect(page.locator("#notice")).toContainText("Not established.");
  await expect(page.locator("#ending")).toHaveCount(0);
  await page.getByLabel("Person").selectOption("mara");
  await page.getByLabel("Act").selectOption("act-left");
  await page.getByLabel("Motive").selectOption("mot-sister");
  await page.getByRole("checkbox", { name: "Hold cart 17" }).check();
  await page.getByRole("checkbox", { name: "Dock reader" }).check();
  await page.getByRole("button", { name: "Submit the account" }).click();
  await expect(page.locator("#notice")).toContainText("The account holds.");
  const ending = page.locator("#ending");
  await expect(ending).toContainText("2:19");
  await expect(ending).not.toContainText("roof");
  await expect(ending).not.toContainText("1:44");
  await expect(page.getByText("Declined accounts: 1")).toBeVisible();
});

test("reaches the ending by another room order", async ({ page }) => {
  await openCase(page);
  await page.getByRole("button", { name: "Go to Manager's office" }).click();
  await page.getByRole("button", { name: "Contract folder" }).click();
  await page.getByRole("button", { name: "Go to Production and break room" }).click();
  await page.getByRole("button", { name: "Break-room couch" }).click();
  await page.getByRole("button", { name: "Go to Lobby and lot" }).click();
  await page.getByRole("button", { name: "Parking checklist" }).click();
  await page.getByRole("button", { name: "Go to Air studio" }).click();
  await page.getByRole("button", { name: "Cartridge rack" }).click();
  await page.getByRole("button", { name: "Write the account" }).click();
  await page.getByLabel("Person").selectOption("mara");
  await page.getByLabel("Act").selectOption("act-left");
  await page.getByLabel("Motive").selectOption("mot-sister");
  await page.getByRole("checkbox", { name: "Hold cart 17" }).check();
  await page.getByRole("checkbox", { name: "Parking checklist" }).check();
  await page.getByRole("button", { name: "Submit the account" }).click();
  await expect(page.locator("#ending")).toContainText("parking checklist");
  await expect(page.locator("#ending")).not.toContainText("personal PIN");
  await expect(page.locator("#ending")).toContainText("1:44");
});

test("a locked question stays disabled until the note exists", async ({ page }) => {
  await openCase(page);
  await page.getByRole("button", { name: "Ask Reed Solano" }).click();
  await expect(page.getByRole("button", { name: "Your login disabled the dock camera. What happened?" })).toBeDisabled();
  await page.getByRole("button", { name: "Close" }).click();
  await page.getByRole("button", { name: "Security binder" }).click();
  await page.getByRole("button", { name: "Ask Reed Solano" }).click();
  const confront = page.getByRole("button", { name: "Your login disabled the dock camera. What happened?" });
  await expect(confront).toBeEnabled();
  await confront.click();
  await expect(page.locator(".notebook")).toContainText("I turned the dock camera off at 1:50.");
});

test("reduced motion still shows the object list", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openCase(page);
  await expect(page.getByRole("button", { name: "Sign-in clipboard" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Go to Air studio" })).toBeVisible();
});

test("narrow viewport does not force horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openCase(page);
  await page.getByRole("button", { name: "Sign-in clipboard" }).click();
  const fits = await page.evaluate(() => {
    return document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1;
  });
  expect(fits).toBe(true);
  await expect(page.getByRole("heading", { name: "Sign-in sheet" })).toBeVisible();
});

test("save survives reload, reset asks, and a bad save is kept", async ({ page }) => {
  await openCase(page);
  await page.getByRole("button", { name: "Parking checklist" }).click();
  await page.reload();
  await page.getByRole("button", { name: "Continue the case" }).click();
  await expect(page.getByRole("heading", { name: "Parking checklist", exact: true })).toBeVisible();

  await page.evaluate((key) => {
    localStorage.setItem(key, JSON.stringify({ format: 99, app: "the-last-broadcast", legacy: true }));
  }, SAVE_KEY);
  await page.reload();
  await expect(page.locator("#notice")).toContainText("could not be read");
  await expect.poll(async () => page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toContain("99");
  await expect.poll(async () => page.evaluate((key) => localStorage.getItem(key), PRESERVE_KEY)).toContain("99");
  await page.getByRole("button", { name: "Play in this tab only" }).click();
  await page.getByRole("button", { name: "Sign-in clipboard" }).click();
  await expect.poll(async () => page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toContain("99");

  await page.getByRole("button", { name: "Reset" }).click();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect.poll(async () => page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toContain("99");
  await page.getByRole("button", { name: "Reset" }).click();
  await page.getByRole("button", { name: "Delete the save and start over" }).click();
  await expect.poll(async () => page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBeNull();
  await expect(page.getByRole("button", { name: "Open the case" })).toBeVisible();
});

test("a full disk is visible and does not drop the in-tab note", async ({ page }) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key: string, value: string) {
      if (key === "last-broadcast-save-v1") {
        throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
      }
      return original.call(this, key, value);
    };
  });
  await openCase(page);
  await expect(page.locator("#save-status")).toContainText("storage is full");
  await page.getByRole("button", { name: "Sign-in clipboard" }).click();
  await expect(page.getByRole("heading", { name: "Sign-in sheet" })).toBeVisible();
  await expect(page.locator("#save-status")).toContainText("storage is full");
});

test("two tabs do not silently overwrite each other", async ({ browser }) => {
  const context = await browser.newContext();
  const first = await context.newPage();
  const second = await context.newPage();
  await first.goto("/");
  await second.goto("/");
  await first.getByRole("button", { name: "Open the case" }).click();
  await first.getByRole("button", { name: "Sign-in clipboard" }).click();
  await expect(first.locator("#save-status")).toContainText("Saved");
  await second.getByRole("button", { name: "Open the case" }).click();
  await expect(second.getByRole("region", { name: "Save conflict" })).toBeVisible();
  await second.getByRole("button", { name: "Parking checklist" }).click();
  await second.getByRole("button", { name: "Overwrite with this tab" }).click();
  await expect(second.locator("#save-status")).toContainText("Saved");
  await first.getByRole("button", { name: "Dock reader slip" }).click();
  await expect(first.getByRole("region", { name: "Save conflict" })).toBeVisible();
  await first.getByRole("button", { name: "Load their save" }).click();
  await expect(first.getByRole("heading", { name: "Parking checklist", exact: true })).toBeVisible();
  await expect(first.getByRole("heading", { name: "Sign-in sheet" })).toHaveCount(0);
  await context.close();
});

test("room tone starts from a click and stops", async ({ page }) => {
  await openCase(page);
  await expect(page.getByText("Sound: off")).toBeVisible();
  await page.getByRole("button", { name: "Go to Air studio" }).click();
  await page.getByRole("button", { name: "Board and play slot" }).click();
  await page.getByRole("button", { name: "Play room tone" }).click();
  await expect(page.getByText("Sound: room tone playing")).toBeVisible();
  await page.getByRole("button", { name: "Stop sound" }).click();
  await expect(page.getByText("Sound: off")).toBeVisible();
});

test("hints stay on one object until it is logged", async ({ page }) => {
  await openCase(page);
  await page.getByRole("button", { name: "Hint" }).click();
  await expect(page.locator("#hint-text")).toContainText("Lobby and lot");
  await expect(page.locator("#hint-text")).not.toContainText("Sign-in clipboard");
  await page.getByRole("button", { name: "Be more direct" }).click();
  await expect(page.locator("#hint-text")).toContainText("Sign-in clipboard");
  await page.getByRole("button", { name: "Sign-in clipboard" }).click();
  await expect(page.locator("#hint-text")).toHaveCount(0);
  await page.getByRole("button", { name: "Hint" }).click();
  await expect(page.locator("#hint-text")).not.toContainText("Sign-in clipboard");
});

test("saved hint text cannot inject markup", async ({ page }) => {
  await openCase(page);
  const raw = await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
  expect(raw).toBeTruthy();
  const envelope = JSON.parse(raw ?? "{}") as {
    state: { hint: { objectiveId: string; level: number; text: string; repeats: number } | null };
  };
  envelope.state.hint = {
    objectiveId: "accuse",
    level: 1,
    text: '<img src=x onerror="window.__pwn=1">',
    repeats: 0,
  };
  const checksum = checksumOf(envelope.state as never);
  const next = buildEnvelope(envelope.state as never, "tab", "2026-10-20T12:00:00.000Z");
  next.checksum = checksum;
  await page.evaluate(([key, value]) => localStorage.setItem(key, value), [SAVE_KEY, JSON.stringify(next)] as const);
  await page.reload();
  await page.getByRole("button", { name: "Continue the case" }).click();
  await expect(page.locator("#hint-text")).toContainText("<img");
  expect(await page.locator("#hint-text img").count()).toBe(0);
  expect(await page.evaluate(() => (window as unknown as { __pwn?: number }).__pwn)).toBeUndefined();
});
