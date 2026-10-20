import { roomTonePlaying, startRoomTone, stopRoomTone } from "../audio";
import type { GameContent } from "../content/types";
import { visibleEnding } from "../engine/ending";
import { collectedClueIds, topicUnlocked } from "../engine/logic";
import { buildNotebook } from "../engine/notebook";
import { apply } from "../engine/reduce";
import {
  interpretLoad,
  planWrite,
  PRESERVE_KEY,
  preserveRaw,
  readTabId,
  resetStorage,
  SAVE_KEY,
  writeRaw,
  type Kv,
  type WritePlan,
} from "../engine/save";
import { initialState, type GameState } from "../engine/state";

type Panel = null | { kind: "talk"; suspectId: string } | { kind: "deduce" } | { kind: "accuse" } | { kind: "reset" };

type Conflict = Extract<WritePlan, { type: "conflict" }>;

function h(
  tag: string,
  props: {
    class?: string;
    id?: string;
    text?: string;
    type?: string;
    href?: string;
    disabled?: boolean;
    dataset?: Record<string, string>;
    attrs?: Record<string, string>;
  } = {},
  ...kids: Array<Node | string | null>
): HTMLElement {
  const el = document.createElement(tag);
  if (props.class) el.className = props.class;
  if (props.id) el.id = props.id;
  if (props.text !== undefined) el.textContent = props.text;
  if (props.type && (el instanceof HTMLButtonElement || el instanceof HTMLInputElement)) {
    el.type = props.type;
  }
  if (props.href && el instanceof HTMLAnchorElement) el.href = props.href;
  if (props.disabled && (el instanceof HTMLButtonElement || el instanceof HTMLInputElement || el instanceof HTMLSelectElement)) {
    el.disabled = true;
  }
  if (props.dataset) {
    for (const [key, value] of Object.entries(props.dataset)) el.dataset[key] = value;
  }
  if (props.attrs) {
    for (const [key, value] of Object.entries(props.attrs)) el.setAttribute(key, value);
  }
  for (const kid of kids) {
    if (kid === null) continue;
    el.append(typeof kid === "string" ? document.createTextNode(kid) : kid);
  }
  return el;
}

function memoryKv(): Kv {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}

function browserStore(storage: Storage): Kv {
  return {
    getItem: (key) => storage.getItem(key),
    setItem: (key, value) => storage.setItem(key, value),
    removeItem: (key) => storage.removeItem(key),
  };
}

export function mount(root: HTMLElement, content: GameContent, storage?: Kv, tabStore?: Kv): void {
  const kv = storage ?? browserStore(localStorage);
  const tabs = tabStore ?? browserStore(sessionStorage);
  const tab = readTabId(tabs);
  let state = initialState();
  let panel: Panel = null;
  let notice = "";
  let saveStatus = "Not saved yet.";
  let lastSeen: string | null = null;
  let holdCorrupt = false;
  let conflict: Conflict | null = null;
  let pending: GameState | null = null;
  let playing = false;

  const boot = interpretLoad(safeGet(kv, SAVE_KEY), content);
  if (boot.kind === "ok") {
    pending = boot.envelope.state;
    lastSeen = boot.envelope.checksum;
    saveStatus = `A saved case is in this browser, revision ${boot.envelope.state.revision}.`;
  } else if (boot.kind === "bad") {
    holdCorrupt = true;
    const preserveError = preserveRaw(kv, boot.raw);
    saveStatus = preserveError
      ? `The saved case could not be read (${boot.reason}), and the copy could not be preserved (${preserveError}). The original key was left in place.`
      : `The saved case could not be read (${boot.reason}). It is still stored. Saving stays off until you confirm a reset.`;
    notice = saveStatus;
  }

  if (!tab.persistent) {
    notice = `${notice} This tab could not store its id. Multi-tab protection may not survive a reload.`.trim();
  }

  function safeRender(focusId?: string): void {
    playing = roomTonePlaying();
    root.replaceChildren(view());
    const dialog = root.querySelector<HTMLElement>("[role='dialog']");
    if (focusId) {
      document.getElementById(focusId)?.focus();
    } else if (dialog) {
      firstFocusable(dialog)?.focus();
    }
  }

  function setNotice(text: string): void {
    notice = text;
    const live = document.getElementById("notice");
    if (live) live.textContent = text;
  }

  function persist(next: GameState, force = false): void {
    const plan = planWrite({
      diskRaw: safeGet(kv, SAVE_KEY),
      state: next,
      tabId: tab.id,
      savedAt: new Date().toISOString(),
      lastSeenChecksum: lastSeen,
      holdCorrupt,
      force,
      content,
    });
    if (plan.type === "write") {
      const error = writeRaw(kv, plan.raw);
      if (error === "quota") {
        saveStatus = "The browser refused the save because storage is full. Your case is still in this tab and was not discarded.";
        setNotice(saveStatus);
        return;
      }
      if (error) {
        saveStatus = `The save failed (${error}). Your case is still in this tab.`;
        setNotice(saveStatus);
        return;
      }
      lastSeen = plan.checksum;
      holdCorrupt = false;
      conflict = null;
      saveStatus = "Saved in this browser.";
      return;
    }
    if (plan.type === "conflict") {
      conflict = plan;
      saveStatus = `Not saved. Another tab has revision ${plan.theirRevision}. Load that case, or overwrite it with this tab.`;
      return;
    }
    saveStatus = plan.reason;
  }

  function commit(nextNotice: string, focusId?: string): void {
    notice = nextNotice;
    safeRender(focusId);
  }

  function onAction(act: string, id: string, force = false): void {
    if (act === "start" || act === "play-memory") {
      const result = apply(state, { type: "start" }, content);
      if (!result.ok) {
        commit(result.message);
        return;
      }
      state = result.state;
      if (act === "play-memory") {
        saveStatus = "Saving is off until the unreadable save is reset.";
        commit(result.message);
        return;
      }
      persist(state, force);
      commit(conflict ? saveStatus : result.message);
      return;
    }
    if (act === "continue" && pending) {
      state = pending;
      pending = null;
      commit("Continued the saved case.");
      return;
    }
    if (act === "open-talk" && id) {
      panel = { kind: "talk", suspectId: id };
      commit(`Asking ${content.suspects.find((item) => item.id === id)?.name ?? "them"}.`);
      return;
    }
    if (act === "open-deduce") {
      panel = { kind: "deduce" };
      commit("Deductions use a conclusion plus two or three notes.");
      return;
    }
    if (act === "open-accuse") {
      panel = { kind: "accuse" };
      commit("The account needs a person, an act, a motive, and two or three notes.");
      return;
    }
    if (act === "open-reset") {
      panel = { kind: "reset" };
      commit("Reset deletes the browser save. Nothing has been deleted yet.");
      return;
    }
    if (act === "close") {
      panel = null;
      commit(notice || "Closed.");
      return;
    }
    if (act === "hint" || act === "hint-more") {
      const result = apply(state, { type: "hint", escalate: act === "hint-more" }, content);
      state = result.state;
      if (result.changed) persist(state);
      commit(result.message, "hint-text");
      return;
    }
    if (act === "save") {
      if (state.phase === "title") {
        commit("Open the case before saving.");
        return;
      }
      persist(state, force);
      commit(saveStatus);
      return;
    }
    if (act === "load-other") {
      const loaded = interpretLoad(safeGet(kv, SAVE_KEY), content);
      if (loaded.kind !== "ok") {
        commit("The other tab's save could not be read.");
        return;
      }
      state = loaded.envelope.state;
      lastSeen = loaded.envelope.checksum;
      pending = null;
      conflict = null;
      panel = null;
      saveStatus = "Loaded the other tab's case.";
      commit(saveStatus);
      return;
    }
    if (act === "overwrite") {
      if (state.phase === "title" && pending) {
        state = pending;
        pending = null;
      } else if (state.phase === "title") {
        state = apply(initialState(), { type: "start" }, content).state;
      }
      persist(state, true);
      commit(saveStatus);
      return;
    }
    if (act === "confirm-reset") {
      const error = resetStorage(kv);
      if (error) {
        commit(`The save could not be deleted (${error}). This tab was not cleared.`);
        return;
      }
      stopRoomTone();
      holdCorrupt = false;
      lastSeen = null;
      pending = null;
      conflict = null;
      panel = null;
      state = apply(state, { type: "reset", confirm: true }, content).state;
      saveStatus = "Saved data was deleted from this browser. This cannot be undone from the app.";
      commit(saveStatus);
      return;
    }
    if (act === "travel" && id) {
      const result = apply(state, { type: "travel", locationId: id }, content);
      state = result.state;
      if (result.changed) persist(state);
      commit(result.message);
      return;
    }
    if (act === "inspect" && id) {
      const result = apply(state, { type: "inspect", objectId: id }, content);
      state = result.state;
      if (result.changed) persist(state);
      commit(result.message);
      return;
    }
    if (act === "talk" && id) {
      const result = apply(state, { type: "talk", topicId: id }, content);
      state = result.state;
      if (result.changed) persist(state);
      commit(result.message, `topic-${id}`);
      return;
    }
    if (act === "play-tone") {
      const tone = startRoomTone();
      commit(tone.message, "stop-sound");
      return;
    }
    if (act === "stop-tone") {
      stopRoomTone();
      commit("Sound is off. The written note remains the evidence.", "play-tone");
      return;
    }
    commit("That control is not available.");
  }

  root.addEventListener("click", (event) => {
    const target = (event.target as HTMLElement | null)?.closest("[data-act]") as HTMLElement | null;
    if (!target || !root.contains(target)) return;
    if (target instanceof HTMLButtonElement && target.disabled) return;
    const act = target.dataset.act ?? "";
    const id = target.dataset.id ?? "";
    if (act === "deduce-submit" && id) {
      submitDeduce(id);
      return;
    }
    if (act === "accuse-submit") {
      submitAccuse();
      return;
    }
    onAction(act, id);
  });

  root.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.type !== "checkbox") return;
    const field = target.closest("fieldset");
    if (!field) return;
    const checked = [...field.querySelectorAll<HTMLInputElement>("input[type='checkbox']:checked")];
    if (checked.length > 3) {
      target.checked = false;
      setNotice("Two or three notes only.");
    }
  });

  root.addEventListener("keydown", (event) => {
    const dialog = root.querySelector<HTMLElement>("[role='dialog']");
    if (!dialog) return;
    if (event.key === "Escape") {
      event.preventDefault();
      panel = null;
      commit("Closed.");
      return;
    }
    if (event.key !== "Tab") return;
    const items = focusables(dialog);
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  window.addEventListener("storage", (event) => {
    if (event.key !== SAVE_KEY || storage) return;
    const loaded = interpretLoad(event.newValue, content);
    if (loaded.kind !== "ok") return;
    if (loaded.envelope.checksum === lastSeen) return;
    conflict = {
      type: "conflict",
      theirRevision: loaded.envelope.state.revision,
      theirSavedAt: loaded.envelope.savedAt,
      theirTabId: loaded.envelope.tabId,
    };
    saveStatus = `Another tab saved revision ${loaded.envelope.state.revision}. Nothing was overwritten.`;
    commit(saveStatus);
  });

  function submitDeduce(deductionId: string): void {
    const field = document.getElementById(`ded-${deductionId}`);
    if (!(field instanceof HTMLFieldSetElement)) return;
    const optionId = field.querySelector<HTMLInputElement>("input[type='radio']:checked")?.value ?? "";
    const supportIds = [...field.querySelectorAll<HTMLInputElement>("input[type='checkbox']:checked")].map(
      (input) => input.value,
    );
    if (!optionId) {
      commit("Choose a conclusion.");
      return;
    }
    const result = apply(
      state,
      { type: "deduce", deductionId, optionId, supportIds },
      content,
    );
    state = result.state;
    if (result.changed) persist(state);
    commit(result.message);
  }

  function submitAccuse(): void {
    const form = document.getElementById("accuse-form");
    if (!(form instanceof HTMLElement)) return;
    const personId = valueOf(form, "person");
    const actionId = valueOf(form, "act");
    const motiveId = valueOf(form, "motive");
    const supportIds = [...form.querySelectorAll<HTMLInputElement>("input[type='checkbox']:checked")].map(
      (input) => input.value,
    );
    if (!personId || !actionId || !motiveId) {
      commit("Choose a person, an act, and a motive.");
      return;
    }
    const result = apply(
      state,
      { type: "accuse", personId, actionId, motiveId, supportIds },
      content,
    );
    state = result.state;
    if (result.changed) persist(state);
    if (result.outcome === "supported") panel = null;
    commit(result.message);
  }

  function view(): HTMLElement {
    const shell = h("div", { class: "shell" });
    const skip = h("a", { class: "skip", href: "#main", text: "Skip to the station" });
    const conflict = conflictView();
    shell.append(skip, header(), noticeView());
    if (conflict) shell.append(conflict);
    if (state.phase === "title") shell.append(titleScreen());
    else shell.append(gameScreen());
    shell.append(
      h("footer", { class: "footer fine", text: content.shortNote }),
    );
    return shell;
  }

  function header(): HTMLElement {
    return h("header", { class: "top" },
      h("p", { class: "kicker", text: "WNBR 640 · River Town · Monday 12 October 2026, 6:12 a.m." }),
      h("h1", { text: content.title }),
      h("p", { class: "lamp" }, h("i", { attrs: { "aria-hidden": "true" } }), "ON AIR lamp: steady"),
      h("p", { id: "save-status", class: "status", text: saveStatus }),
      h("p", { class: "status", text: playing ? "Sound: room tone playing" : "Sound: off" }),
      playing
        ? h("button", { type: "button", id: "stop-sound", dataset: { act: "stop-tone" }, text: "Stop sound" })
        : null,
    );
  }

  function noticeView(): HTMLElement {
    return h("p", {
      id: "notice",
      class: "notice",
      attrs: { role: "status", "aria-live": "polite", tabindex: "-1" },
      text: notice,
    });
  }

  function conflictView(): HTMLElement | null {
    if (!conflict) return null;
    return h("section", { class: "banner", attrs: { role: "region", "aria-label": "Save conflict" } },
      h("h2", { text: "Another tab has a newer or different save" }),
      h("p", { text: `That save is revision ${conflict.theirRevision}, stored ${conflict.theirSavedAt}. Loading it replaces this tab's current case. Overwriting replaces the other tab's save with this one.` }),
      h("div", { class: "actions" },
        h("button", { type: "button", class: "primary", dataset: { act: "load-other" }, text: "Load their save" }),
        h("button", { type: "button", dataset: { act: "overwrite" }, text: "Overwrite with this tab" }),
      ),
    );
  }

  function titleScreen(): HTMLElement {
    const main = h("main", { id: "main", class: "panel stack" });
    main.append(
      h("p", { class: "lede", text: "You are Alex Ruiz, the substitute engineer. Mara Ellison did not finish the overnight. The board call is at 8:30. Walk the building, log what you find, and write an account the notes can carry." }),
      h("p", { text: content.contentNote }),
    );
    if (pending) {
      main.append(
        h("button", { type: "button", class: "primary", dataset: { act: "continue" }, text: "Continue the case" }),
        h("button", { type: "button", dataset: { act: "open-reset" }, text: "Start over" }),
      );
    } else if (holdCorrupt) {
      main.append(
        h("button", { type: "button", class: "primary", dataset: { act: "play-memory" }, text: "Play in this tab only" }),
        h("button", { type: "button", dataset: { act: "open-reset" }, text: "Reset saved data" }),
      );
    } else {
      main.append(
        h("button", { type: "button", class: "primary", dataset: { act: "start" }, text: "Open the case" }),
      );
    }
    if (panel?.kind === "reset") main.append(resetDialog());
    return main;
  }

  function gameScreen(): HTMLElement {
    const wrap = h("div", {});
    const main = h("main", { id: "main", class: "layout" });
    if (state.phase === "ended") {
      const column = h("div", { class: "stack" });
      column.append(endingView(), locationView());
      main.append(column, notebookView());
    } else {
      main.append(locationView(), notebookView());
    }
    wrap.append(main);
    if (panel?.kind === "talk") wrap.append(talkDialog(panel.suspectId));
    if (panel?.kind === "deduce") wrap.append(deduceDialog());
    if (panel?.kind === "accuse") wrap.append(accuseDialog());
    if (panel?.kind === "reset") wrap.append(resetDialog());
    return wrap;
  }

  function endingView(): HTMLElement {
    const section = h("section", { id: "ending", class: "ending", attrs: { "aria-label": "Account" } });
    section.append(h("h2", { text: "The account" }));
    for (const block of visibleEnding(state, content)) {
      section.append(h("p", { text: block.text }));
    }
    return section;
  }

  function locationView(): HTMLElement {
    const location = content.locations.find((item) => item.id === state.locationId);
    const panelEl = h("section", { class: "panel stack", attrs: { "aria-labelledby": "room-title" } });
    panelEl.append(
      h("h2", { id: "room-title", text: location?.name ?? "Station" }),
      h("p", { text: location?.body ?? "" }),
      h("h3", { text: "Travel" }),
    );
    const travel = h("div", { class: "actions" });
    for (const room of content.locations) {
      const here = room.id === state.locationId;
      travel.append(
        h("button", {
          type: "button",
          id: `go-${room.id}`,
          disabled: here,
          dataset: { act: "travel", id: room.id },
          attrs: here ? { "aria-current": "true" } : {},
          text: here ? `${room.name}, you are here` : `Go to ${room.name}`,
        }),
      );
    }
    panelEl.append(travel, h("h3", { text: "Object list" }));
    for (const obj of content.objects.filter((item) => item.locationId === state.locationId)) {
      const logged = state.inspected.includes(obj.id);
      const card = h("article", { class: "card" });
      const statusId = `st-${obj.id}`;
      card.append(
        h("p", { class: "meta", text: obj.label }),
        h("p", { class: "teaser", text: obj.teaser }),
        h("p", { id: statusId, class: "meta", text: logged ? "Logged" : "Not logged" }),
        h("button", {
          type: "button",
          id: `inspect-${obj.id}`,
          dataset: { act: "inspect", id: obj.id },
          attrs: { "aria-describedby": statusId },
          text: obj.label,
        }),
      );
      panelEl.append(card);
    }
    panelEl.append(h("h3", { text: "People" }));
    for (const suspect of content.suspects) {
      const here = suspect.locationId === state.locationId;
      const room = content.locations.find((item) => item.id === suspect.locationId);
      const card = h("article", { class: "card" });
      card.append(h("h3", { text: suspect.name }), h("p", { class: "teaser", text: suspect.role }));
      if (here) {
        card.append(h("p", { text: suspect.presence }));
        card.append(h("button", {
          type: "button",
          dataset: { act: "open-talk", id: suspect.id },
          text: `Ask ${suspect.name}`,
        }));
      } else {
        card.append(h("p", { text: `In ${room?.name ?? "another room"}.` }));
      }
      panelEl.append(card);
    }
    const actions = h("div", { class: "actions" });
    actions.append(
      h("button", { type: "button", dataset: { act: "open-deduce" }, text: "Deductions" }),
      h("button", { type: "button", class: "primary", dataset: { act: "open-accuse" }, text: "Write the account" }),
      h("button", { type: "button", dataset: { act: "hint" }, text: "Hint" }),
      h("button", { type: "button", dataset: { act: "hint-more" }, text: "Be more direct" }),
      h("button", { type: "button", dataset: { act: "save" }, text: "Save now" }),
      h("button", { type: "button", dataset: { act: "open-reset" }, text: "Reset" }),
    );
    panelEl.append(actions);
    if (state.hint) {
      panelEl.append(h("p", {
        id: "hint-text",
        class: "card",
        attrs: { tabindex: "-1" },
        text: state.hint.text,
      }));
    }
    panelEl.append(h("p", { class: "fine", text: `Declined accounts: ${state.accusations.length}` }));
    return panelEl;
  }

  function notebookView(): HTMLElement {
    const book = buildNotebook(state, content);
    const section = h("section", { class: "panel notebook", attrs: { "aria-labelledby": "notebook-title" } });
    section.append(h("h2", { id: "notebook-title", text: "Notebook" }));
    section.append(h("h3", { text: "Notes" }));
    if (book.clues.length === 0) section.append(h("p", { text: "No notes yet." }));
    for (const clue of book.clues) {
      const card = h("article", { class: "card" }, h("h3", { text: clue.title }), h("p", { text: clue.body }));
      if (clue.id === "clue-storm") {
        card.append(
          h("p", { class: "fine", text: "Play local room tone. It stands in for the cartridge. The written note is the evidence." }),
          h("button", { type: "button", id: "play-tone", dataset: { act: "play-tone" }, text: "Play room tone" }),
        );
      }
      section.append(card);
    }
    section.append(h("h3", { text: "Statements" }));
    if (book.statements.length === 0) section.append(h("p", { text: "No statements yet." }));
    for (const statement of book.statements) {
      section.append(h("article", { class: "card" },
        h("h3", { text: statement.speaker }),
        h("p", { class: "teaser", text: statement.prompt }),
        h("p", { text: statement.text }),
      ));
    }
    section.append(h("h3", { text: "Deductions" }));
    if (book.deductions.length === 0) section.append(h("p", { text: "No deductions yet." }));
    for (const ded of book.deductions) {
      section.append(h("article", { class: "card" },
        h("h3", { text: ded.question }),
        h("p", { text: ded.conclusion }),
        h("p", { class: "fine", text: `From: ${ded.supportTitles.join(", ")}` }),
      ));
    }
    return section;
  }

  function backdrop(title: string, body: HTMLElement, labelledBy: string): HTMLElement {
    const back = h("div", { class: "dialog-back" });
    const dialog = h("div", {
      class: "dialog",
      attrs: { role: "dialog", "aria-modal": "true", "aria-labelledby": labelledBy },
    });
    dialog.append(
      h("h2", { id: labelledBy, text: title }),
      body,
      h("button", { type: "button", dataset: { act: "close" }, text: "Close" }),
    );
    back.append(dialog);
    return back;
  }

  function talkDialog(suspectId: string): HTMLElement {
    const suspect = content.suspects.find((item) => item.id === suspectId);
    const body = h("div", { class: "stack" });
    body.append(h("p", { text: suspect?.presence ?? "" }));
    for (const topic of content.topics.filter((item) => item.suspectId === suspectId)) {
      const heard = state.heard.includes(topic.id);
      const held = new Set(collectedClueIds(state, content));
      const unlocked = topicUnlocked(content, topic.id, held);
      const status = heard ? "Heard" : unlocked ? "Open" : "Needs a note first";
      body.append(
        h("p", { id: `topic-st-${topic.id}`, class: "meta", text: status }),
        h("button", {
          type: "button",
          id: `topic-${topic.id}`,
          disabled: !unlocked,
          dataset: { act: "talk", id: topic.id },
          attrs: { "aria-describedby": `topic-st-${topic.id}` },
          text: topic.prompt,
        }),
      );
    }
    return backdrop(suspect?.name ?? "Interview", body, "talk-title");
  }

  function deduceDialog(): HTMLElement {
    const held = buildNotebook(state, content).clues;
    const body = h("div", {});
    for (const ded of content.deductions) {
      const made = state.deductions.find((record) => record.id === ded.id);
      const field = h("fieldset", { id: `ded-${ded.id}` });
      field.append(h("legend", { text: ded.question }));
      if (made) {
        field.append(h("p", { class: "ok", text: "Already in the notebook." }));
      }
      for (const option of ded.options) {
        const label = h("label", { class: "radio" });
        const input = h("input", {
          type: "radio",
          attrs: { name: `option-${ded.id}`, value: option.id },
        });
        label.append(input, document.createTextNode(option.label));
        field.append(label);
      }
      field.append(h("p", { class: "fine", text: "Supporting notes" }));
      if (held.length === 0) field.append(h("p", { text: "Log notes before you attach them." }));
      for (const clue of held) {
        const label = h("label", { class: "check" });
        const input = h("input", {
          type: "checkbox",
          attrs: { value: clue.id },
        });
        label.append(input, document.createTextNode(clue.title));
        field.append(label);
      }
      field.append(h("button", {
        type: "button",
        dataset: { act: "deduce-submit", id: ded.id },
        text: "Test this conclusion",
      }));
      body.append(field);
    }
    return backdrop("Deductions", body, "deduce-title");
  }

  function accuseDialog(): HTMLElement {
    const book = buildNotebook(state, content);
    const form = h("div", { id: "accuse-form", class: "stack" });
    form.append(selectField("person", "Person", content.people));
    form.append(selectField("act", "Act", content.acts));
    form.append(selectField("motive", "Motive", content.motives));
    form.append(h("p", { class: "fine", text: "Supporting notes, choose two or three" }));
    const entries = [
      ...book.clues.map((clue) => ({ id: clue.id, label: clue.title })),
      ...book.deductions.map((ded) => ({ id: ded.id, label: `Deduction: ${ded.question}` })),
    ];
    if (entries.length === 0) form.append(h("p", { text: "Log notes before you attach them." }));
    for (const entry of entries) {
      const label = h("label", { class: "check" });
      label.append(
        h("input", { type: "checkbox", attrs: { value: entry.id } }),
        document.createTextNode(entry.label),
      );
      form.append(label);
    }
    form.append(h("button", { type: "button", class: "primary", dataset: { act: "accuse-submit" }, text: "Submit the account" }));
    return backdrop("Write the account", form, "accuse-title");
  }

  function selectField(name: string, legend: string, choices: { id: string; label: string }[]): HTMLElement {
    const label = h("label", {}, legend);
    const select = document.createElement("select");
    select.name = name;
    select.id = `choice-${name}`;
    label.setAttribute("for", select.id);
    const empty = document.createElement("option");
    empty.value = "";
    empty.textContent = "Choose";
    select.append(empty);
    for (const choice of choices) {
      const option = document.createElement("option");
      option.value = choice.id;
      option.textContent = choice.label;
      select.append(option);
    }
    const wrap = h("div", { class: "stack" });
    wrap.append(label, select);
    return wrap;
  }

  function resetDialog(): HTMLElement {
    const body = h("div", { class: "stack" });
    body.append(
      h("p", { text: "This deletes the saved case and any preserved unreadable save in this browser. The app cannot bring them back. The case open in this tab is cleared too." }),
      h("div", { class: "actions" },
        h("button", { type: "button", id: "reset-cancel", dataset: { act: "close" }, text: "Cancel" }),
        h("button", { type: "button", class: "danger", dataset: { act: "confirm-reset" }, text: "Delete the save and start over" }),
      ),
    );
    const back = h("div", { class: "dialog-back" });
    const dialog = h("div", {
      class: "dialog",
      attrs: { role: "dialog", "aria-modal": "true", "aria-labelledby": "reset-title" },
    });
    dialog.append(h("h2", { id: "reset-title", text: "Reset this case?" }), body);
    back.append(dialog);
    return back;
  }

  safeRender();
}

function firstFocusable(dialog: HTMLElement): HTMLElement | null {
  return focusables(dialog)[0] ?? null;
}

function focusables(dialog: HTMLElement): HTMLElement[] {
  return [...dialog.querySelectorAll<HTMLElement>("button, [href], input, select, textarea")].filter(
    (el) => !el.hasAttribute("disabled"),
  );
}

function valueOf(scope: ParentNode, name: string): string {
  const select = scope.querySelector<HTMLSelectElement>(`select[name="${name}"]`);
  return select?.value ?? "";
}

function safeGet(kv: Kv, key: string): string | null {
  try {
    return kv.getItem(key);
  } catch {
    return null;
  }
}

export { memoryKv, PRESERVE_KEY };
