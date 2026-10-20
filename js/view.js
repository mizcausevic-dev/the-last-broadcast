import { getAccusationForm } from "./engine.js";
import { sceneMarkup } from "./scenes.js";

const ERRORS = {
  "wrong-room": "You can't do that from this room.",
  locked: "That is not open yet.",
  phase: "That doesn't apply right now.",
  "not-held": "Those entries are not in the notebook.",
  "bad-shape": "The form is incomplete.",
  unknown: "That action isn't available.",
};

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    if (key === "class") node.className = value;
    else node.setAttribute(key, value === true ? "" : String(value));
  }
  for (const child of children.flat()) {
    if (child == null || child === false) continue;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return node;
}

function entries(project) {
  return project.notebook.evidence.concat(project.notebook.statements, project.notebook.deductions);
}

function findEntry(project, id) {
  return entries(project).find((item) => item.id === id) || null;
}

export function createView(root, live, onAction) {
  const ui = {
    dialog: null,
    inspectId: null,
    talkId: null,
    deductionId: null,
    deductionChoice: null,
    deductionSupport: [],
    accuse: blankAccuse(),
    confirm: null,
    toast: null,
    focusReturn: null,
    error: null,
    dialogKey: null,
  };
  let snap = null;

  function blankAccuse() {
    return { status: null, route: null, purpose: null, conduct: null, support: [] };
  }

  function setLive(text) {
    if (live) live.textContent = text || "";
  }

  function sync(next) {
    snap = next;
    if (next.error) ui.error = ERRORS[next.error] || ERRORS.unknown;
    else ui.error = null;
    const gained = next.events?.find((item) => item.type === "gained");
    if (gained) {
      const entry = findEntry(next.project, gained.id);
      ui.toast = { id: gained.id, title: entry?.title || "Notebook entry" };
      setLive(`Recorded: ${ui.toast.title}`);
    } else if (next.banners?.includes("storage-failed") || next.banners?.includes("storage-off")) {
      setLive("Progress could not be stored in this browser.");
    }
    render();
  }

  function closeDialog() {
    ui.dialog = null;
    ui.confirm = null;
    ui.dialogKey = null;
  }

  function render() {
    const activeId = document.activeElement?.getAttribute?.("data-focus-id");
    const project = snap.project;
    const screen =
      snap.view === "recovery"
        ? recovery(project)
        : snap.view === "ending" || project.phase === "ending"
          ? ending(project)
          : snap.view === "play"
            ? play(project)
            : title(project);
    root.replaceChildren(screen);
    const overlay = dialogFor(project);
    if (overlay) root.append(overlay);
    if (ui.toast && snap.view === "play" && !overlay) root.append(toast());
    const screenNode = root.querySelector("[data-screen]");
    if (screenNode) screenNode.inert = Boolean(overlay);
    const dialog = root.querySelector("[role='dialog']");
    const key = ui.confirm || (snap.conflict ? "conflict" : ui.dialog);
    if (dialog && key !== ui.dialogKey) {
      ui.dialogKey = key;
      dialog.focus();
    } else if (!dialog) {
      ui.dialogKey = null;
      if (ui.focusReturn) {
        root.querySelector(`[data-focus-id="${CSS.escape(ui.focusReturn)}"]`)?.focus();
        ui.focusReturn = null;
      }
    } else if (activeId) {
      root.querySelector(`[data-focus-id="${CSS.escape(activeId)}"]`)?.focus();
    }
    const art = root.querySelector(".art");
    if (art && snap?.project?.locationId && snap.view === "play") art.innerHTML = sceneMarkup(snap.project.locationId);
  }

  function title(project) {
    const intro = project.intro;
    const actions = [];
    if (snap.canContinue === "play") {
      actions.push(solid("Continue", "continue", "continue"));
      actions.push(quiet("Begin again", "begin-ask", "begin-ask"));
    } else if (snap.canContinue === "ending") {
      actions.push(solid("Revisit the ending", "continue", "continue"));
      actions.push(quiet("Play again", "begin-ask", "begin-ask"));
    } else {
      actions.push(solid("Begin", "begin", "begin"));
    }
    return el("main", { class: "title", "data-screen": "title", id: "main" }, [
      el("p", { class: "eyebrow" }, [intro.eyebrow]),
      el("h1", {}, [intro.title]),
      el("p", { class: "deck" }, [intro.deck]),
      ...intro.paragraphs.map((text) => el("p", {}, [text])),
      el("p", {}, [intro.objective]),
      el("p", { class: "note" }, [intro.contentNote]),
      el("div", { class: "title-actions" }, actions),
      banners(),
    ]);
  }

  function play(project) {
    return el("div", { class: "shell", "data-screen": "play", id: "main" }, [
      header(project, false),
      banners(),
      el("div", { class: "stage" }, [
        el("nav", { class: "bank", "aria-label": "Locations" }, project.locations.map((place) =>
          el("button", {
            type: "button",
            "data-action": "move",
            "data-id": place.id,
            "data-focus-id": `move-${place.id}`,
            "aria-current": place.id === project.locationId ? "true" : null,
          }, [place.name]),
        )),
        el("section", { class: "bezel" }, [
          el("div", { class: "art", "aria-hidden": "true" }),
          el("h1", { class: "room-title" }, [project.room.name]),
          el("p", { class: "blurb" }, [project.room.blurb]),
          el("p", {}, [project.intro.objective]),
          ui.error ? el("p", { class: "error", role: "status" }, [ui.error]) : null,
        ]),
        el("aside", { class: "room-list", "aria-label": "In this room" }, [
          el("p", { class: "meta" }, ["In this room"]),
          ...project.room.objects.map((item) => el("button", {
            type: "button",
            "data-action": "inspect",
            "data-id": item.id,
            "data-focus-id": `inspect-${item.id}`,
          }, [
            item.label,
            " ",
            el("span", { class: "tag" }, [item.inspected ? (item.isNew ? "New in notebook" : "In the notebook") : "Not opened"]),
          ])),
          ...project.room.people.map((person) => el("div", { class: "person" }, [
            el("h3", {}, [person.name]),
            el("p", { class: "meta" }, [person.role]),
            el("p", {}, [person.presence]),
            el("button", {
              type: "button",
              "data-action": "talk",
              "data-id": person.id,
              "data-focus-id": `talk-${person.id}`,
            }, [person.hasNewTopic ? `Talk to ${person.name}. New question.` : `Talk to ${person.name}`]),
          ])),
        ]),
      ]),
      toolbar(project),
    ]);
  }

  function ending(project) {
    return el("main", { class: "ending", "data-screen": "ending", id: "main" }, [
      el("p", { class: "eyebrow" }, ["WKXR 88.7"]),
      el("h1", {}, [project.ending.title]),
      ...project.ending.paragraphs.map((text) => el("p", {}, [text])),
      el("div", { class: "title-actions" }, [
        solid("Open the notebook", "open-notebook", "open-notebook"),
        quiet("Replay from the title", "replay-ask", "replay-ask"),
      ]),
    ]);
  }

  function recovery() {
    return el("main", { class: "recovery", "data-screen": "recovery", id: "main" }, [
      el("h1", {}, ["This save can't be read"]),
      el("p", {}, ["The stored night was left untouched. You can keep a copy of the raw text, erase it on purpose, or play this tab without saving over it."]),
      el("div", { class: "title-actions" }, [
        snap.heldRaw ? solid("Download the stored text", "download-raw", "download-raw") : null,
        quiet("Erase it and start over", "reset-ask", "reset-ask"),
        quiet("Play without saving", "play-anyway", "play-anyway"),
      ]),
    ]);
  }

  function header(project, ended) {
    const saved = snap.saveBlocked
      ? "Not saving"
      : snap.banners.includes("storage-failed") || snap.banners.includes("storage-off")
        ? "Not stored"
        : "Saved in this browser";
    return el("header", { class: "top" }, [
      el("div", { class: "brand" }, [
        el("p", { class: "eyebrow" }, [el("span", { class: "lamp", "data-lamp": "standby" }), "WKXR 88.7"]),
        el("p", { class: "meta" }, [ended ? "Signed off" : project.room?.name || "The Last Broadcast"]),
      ]),
      el("p", { class: "status", id: "save-status" }, [saved]),
    ]);
  }

  function toolbar() {
    const unread = snap.project.unreadCount ? ` (${snap.project.unreadCount} new)` : "";
    return el("div", { class: "tools" }, [
      solid(`Notebook${unread}`, "open-notebook", "open-notebook"),
      quiet("Deductions", "open-deduce", "open-deduce"),
      quiet("File an explanation", "open-accuse", "open-accuse"),
      quiet("Hint", "hint", "hint"),
      quiet("Settings", "open-settings", "open-settings"),
    ]);
  }

  function banners() {
    if (!snap.banners.length) return null;
    const text = snap.banners.includes("storage-off")
      ? "This browser could not read local storage. The night stays in this tab only."
      : "This browser refused to store the night. Progress stays in this tab until you close it.";
    return el("p", { class: "banner" }, [text]);
  }

  function toast() {
    return el("div", { class: "toast" }, [
      el("p", {}, [`Recorded: ${ui.toast.title}`]),
      el("button", { type: "button", "data-action": "open-entry", "data-id": ui.toast.id }, ["Open the entry"]),
      el("button", { type: "button", "data-action": "dismiss-toast" }, ["Close"]),
    ]);
  }

  function dialogFor(project) {
    if (ui.confirm) return paper(confirmBody(), "confirm-title");
    if (snap.conflict) return paper(conflictBody(), "conflict-title");
    if (ui.dialog === "inspect") return paper(inspectBody(project), "inspect-title");
    if (ui.dialog === "talk") return paper(talkBody(project), "talk-title");
    if (ui.dialog === "notebook") return paper(notebookBody(project), "notebook-title");
    if (ui.dialog === "deduce") return paper(deduceBody(project), "deduce-title");
    if (ui.dialog === "accuse") return paper(accuseBody(project), "accuse-title");
    if (ui.dialog === "hint") return paper(hintBody(project), "hint-title");
    if (ui.dialog === "settings") return paper(settingsBody(project), "settings-title");
    return null;
  }

  function paper(children, labelId) {
    return el("div", { class: "backdrop" }, [
      el("div", {
        class: "paper",
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": labelId,
        tabindex: "-1",
      }, children),
    ]);
  }

  function dialogHeader(id, title) {
    return el("header", {}, [
      el("h2", { id }, [title]),
      el("button", { type: "button", class: "quiet", "data-action": "close", "data-focus-id": "close-dialog" }, ["Close"]),
    ]);
  }

  function inspectBody(project) {
    const entry = findEntry(project, ui.inspectId);
    if (!entry) return [dialogHeader("inspect-title", "Nothing new"), el("p", {}, ["That did not add a notebook entry."])];
    return [dialogHeader("inspect-title", "Recorded"), entryBlock(entry)];
  }

  function talkBody(project) {
    const person = project.room?.people.find((item) => item.id === ui.talkId);
    if (!person) return [dialogHeader("talk-title", "Nobody here")];
    return [
      dialogHeader("talk-title", person.name),
      el("p", { class: "meta" }, [person.role]),
      el("p", {}, [person.presence]),
      ...person.topics.map((topic) => el("div", {}, [
        el("button", {
          type: "button",
          class: "choice",
          "data-action": "topic",
          "data-id": topic.id,
          "aria-pressed": topic.asked ? "true" : "false",
        }, [topic.asked ? `${topic.label} Revisited.` : topic.label]),
        ...(topic.speech || []).map((line) => el("p", { class: "speech" }, [line])),
      ])),
      person.topics.length === 0 ? el("p", {}, ["Nothing to ask yet."]) : null,
      el("p", { class: "meta" }, ["More questions can open after you have something specific from the rooms. They are not listed until then."]),
    ];
  }

  function notebookBody(project) {
    const groups = [
      ["Evidence", project.notebook.evidence],
      ["Statements", project.notebook.statements],
      ["Deductions", project.notebook.deductions],
    ];
    return [
      dialogHeader("notebook-title", "Notebook"),
      ...groups.map(([label, rows]) => el("section", {}, [
        el("h3", {}, [label]),
        rows.length ? rows.map((entry) => el("article", { id: `entry-${entry.id}`, "data-entry": entry.id }, [entryBlock(entry)])) : el("p", {}, ["Nothing here yet."]),
      ])),
    ];
  }

  function entryBlock(entry) {
    const known = new Set(entries(snap.project).map((item) => item.id));
    return el("div", {}, [
      el("h3", {}, [entry.title]),
      el("p", { class: "meta" }, [entry.source, entry.isNew ? " New" : ""]),
      el("p", {}, [entry.description]),
      el("ul", { class: "facts" }, entry.facts.map((fact) => el("li", {}, [fact]))),
      ...entry.related.filter((id) => known.has(id)).map((id) => {
        const related = findEntry(snap.project, id);
        return el("button", { type: "button", class: "quiet", "data-action": "jump", "data-id": id }, [`Related: ${related?.title || id}`]);
      }),
    ]);
  }

  function deduceBody(project) {
    const open = project.deductions.filter((item) => !item.settled);
    const rule = project.deductions.find((item) => item.id === ui.deductionId);
    return [
      dialogHeader("deduce-title", "Deductions"),
      el("p", {}, ["Pick a conclusion, then two or three notebook entries that carry it. A rejection leaves the notebook as it is."]),
      open.length ? open.map((item) => el("button", {
        type: "button",
        class: "choice",
        "data-action": "pick-deduction",
        "data-id": item.id,
        "aria-pressed": item.id === ui.deductionId ? "true" : "false",
      }, [item.prompt])) : el("p", {}, ["Nothing to test yet. Evidence has to land in the notebook before a question will open."]),
      rule && !rule.settled ? el("fieldset", {}, [
        el("legend", {}, [rule.prompt]),
        ...rule.choices.map((choice) => el("button", {
          type: "button",
          class: "choice",
          "data-action": "pick-choice",
          "data-id": choice.id,
          "aria-pressed": ui.deductionChoice === choice.id ? "true" : "false",
        }, [choice.label])),
        el("h3", {}, ["Support"]),
        ...entries(project).map((entry) => el("button", {
          type: "button",
          class: "check",
          "data-action": "toggle-support",
          "data-id": entry.id,
          "aria-pressed": ui.deductionSupport.includes(entry.id) ? "true" : "false",
        }, [entry.title])),
        solid("Test this conclusion", "submit-deduction", "submit-deduction"),
      ]) : null,
      project.feedback?.kind === "accepted" || project.feedback?.kind === "rejected"
        ? el("p", { role: "status" }, [project.feedback.text])
        : null,
      ui.error ? el("p", { class: "error" }, [ui.error]) : null,
      project.deductions.filter((item) => item.settled).map((item) => el("article", {}, [
        el("h3", {}, [item.prompt]),
        el("p", { class: "tag" }, ["Settled"]),
        el("p", {}, [item.explanation]),
      ])),
    ];
  }

  function accuseBody(project) {
    const form = getAccusationForm();
    return [
      dialogHeader("accuse-title", "File an explanation"),
      el("p", {}, ["Every option is available. An option is not a finding. Attach exactly three notebook entries that carry the account."]),
      ...form.steps.map((step) => el("fieldset", {}, [
        el("legend", {}, [step.prompt]),
        ...step.options.map((option) => el("button", {
          type: "button",
          class: "choice",
          "data-action": "accuse-option",
          "data-step": step.id,
          "data-id": option.id,
          "aria-pressed": ui.accuse[step.id] === option.id ? "true" : "false",
        }, [option.label])),
      ])),
      el("h3", {}, ["Three supporting entries"]),
      entries(project).length
        ? entries(project).map((entry) => el("button", {
          type: "button",
          class: "check",
          "data-action": "toggle-attach",
          "data-id": entry.id,
          "aria-pressed": ui.accuse.support.includes(entry.id) ? "true" : "false",
        }, [`${entry.title} (${ui.accuse.support.includes(entry.id) ? "selected" : "not selected"})`]))
        : el("p", {}, ["The notebook is empty."]),
      el("p", { class: "meta" }, [`${ui.accuse.support.length} of 3 selected`]),
      solid("Submit the explanation", "submit-accuse", "submit-accuse"),
      project.feedback?.kind === "accuse" ? el("p", { role: "status" }, [project.feedback.text]) : null,
      ui.error ? el("p", { class: "error" }, [ui.error]) : null,
    ];
  }

  function hintBody(project) {
    const text = project.hint?.text || project.feedback?.text || "Ask when you want a direction.";
    return [
      dialogHeader("hint-title", "Hint"),
      el("p", {}, [text]),
      el("p", { class: "meta" }, [`Step ${((project.hint?.level ?? 0) + 1)} of 3 on this lead. Hints are not scored.`]),
      solid("More specific", "hint", "hint-more"),
    ];
  }

  function settingsBody(project) {
    return [
      dialogHeader("settings-title", "Settings"),
      el("p", {}, [project.intro.contentNote]),
      el("button", {
        type: "button",
        class: "choice",
        "data-action": "tone",
        "aria-pressed": snap.settings.tone ? "true" : "false",
      }, [snap.settings.tone ? "Room tone on" : "Room tone off"]),
      el("label", { class: "slider" }, [
        "Volume",
        el("input", {
          type: "range",
          min: "0",
          max: "1",
          step: "0.05",
          value: String(snap.settings.volume),
          "data-action": "volume",
          "data-focus-id": "volume",
        }),
      ]),
      el("p", {}, [`Hints requested: ${project.hintUses}. That number changes nothing in the night.`]),
      el("p", {}, ["Motion follows the reduced-motion setting on this device."]),
      quiet("Erase this investigation", "reset-ask", "reset-ask"),
    ];
  }

  function confirmBody() {
    const copy = ui.confirm === "begin"
      ? "Erase the saved night and start over?"
      : "Erase this investigation and return to the title? This removes the saved night in this browser.";
    return [
      el("h2", { id: "confirm-title" }, ["Confirm"]),
      el("p", {}, [copy]),
      el("div", { class: "row" }, [
        quiet("Cancel", "confirm-no", "confirm-no"),
        solid("Erase it", "confirm-yes", "confirm-yes"),
      ]),
    ];
  }

  function conflictBody() {
    return [
      el("h2", { id: "conflict-title" }, ["Another tab saved a newer night"]),
      el("p", {}, ["Loading it replaces what you see here. Overwriting replaces the other tab's night. Nothing is written until you choose."]),
      el("div", { class: "row" }, [
        solid("Load the other night", "load-other", "load-other"),
        quiet("Overwrite with this tab", "overwrite", "overwrite"),
        quiet("Not now", "dismiss-conflict", "dismiss-conflict"),
      ]),
    ];
  }

  function solid(label, action, focusId) {
    return el("button", { type: "button", class: "solid", "data-action": action, "data-focus-id": focusId }, [label]);
  }
  function quiet(label, action, focusId) {
    return el("button", { type: "button", class: "quiet", "data-action": action, "data-focus-id": focusId }, [label]);
  }

  root.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button || !root.contains(button)) return;
    const action = button.dataset.action;
    const id = button.dataset.id;
    if (action === "close" || action === "confirm-no" || action === "dismiss-toast") {
      if (action === "dismiss-toast") ui.toast = null;
      else closeDialog();
      render();
      return;
    }
    if (action === "begin") {
      onAction({ type: "BEGIN" });
      return;
    }
    if (action === "begin-ask" || action === "reset-ask" || action === "replay-ask") {
      ui.focusReturn = button.dataset.focusId;
      ui.confirm = action === "begin-ask" ? "begin" : "reset";
      render();
      return;
    }
    if (action === "confirm-yes") {
      const kind = ui.confirm;
      ui.confirm = null;
      ui.dialog = null;
      onAction({ type: kind === "begin" ? "BEGIN" : "RESET" });
      return;
    }
    if (action === "continue") return onAction({ type: "CONTINUE" });
    if (action === "play-anyway") return onAction({ type: "PLAY_ANYWAY" });
    if (action === "download-raw") return download();
    if (action === "load-other") return onAction({ type: "LOAD_OTHER" });
    if (action === "overwrite") return onAction({ type: "OVERWRITE" });
    if (action === "dismiss-conflict") return onAction({ type: "DISMISS_CONFLICT" });
    if (action === "move") {
      ui.focusReturn = button.dataset.focusId;
      onAction({ type: "MOVE", id });
      return;
    }
    if (action === "inspect") {
      ui.focusReturn = button.dataset.focusId;
      const next = onAction({ type: "INSPECT", id });
      if (!next.error && !next.conflict) {
        ui.dialog = "inspect";
        ui.inspectId = next.project.feedback?.evidenceId || null;
        onAction({ type: "ACK", id: ui.inspectId });
      }
      return;
    }
    if (action === "talk") {
      ui.focusReturn = button.dataset.focusId;
      ui.dialog = "talk";
      ui.talkId = id;
      render();
      return;
    }
    if (action === "topic") {
      const next = onAction({ type: "ASK", id });
      if (!next.error) onAction({ type: "ACK", id: next.project.feedback?.evidenceId });
      return;
    }
    if (action === "open-notebook" || action === "open-entry") {
      ui.focusReturn = button.dataset.focusId || ui.focusReturn;
      ui.dialog = "notebook";
      ui.toast = null;
      render();
      if (id) root.querySelector(`#entry-${CSS.escape(id)}`)?.scrollIntoView();
      return;
    }
    if (action === "jump") {
      root.querySelector(`#entry-${CSS.escape(id)}`)?.scrollIntoView();
      return;
    }
    if (action === "open-deduce") {
      ui.focusReturn = button.dataset.focusId;
      ui.dialog = "deduce";
      render();
      return;
    }
    if (action === "pick-deduction") {
      ui.deductionId = id;
      ui.deductionChoice = null;
      ui.deductionSupport = [];
      render();
      return;
    }
    if (action === "pick-choice") {
      ui.deductionChoice = id;
      render();
      return;
    }
    if (action === "toggle-support") {
      ui.deductionSupport = toggle(ui.deductionSupport, id, 3);
      render();
      return;
    }
    if (action === "submit-deduction") {
      onAction({
        type: "DEDUCE",
        id: ui.deductionId,
        choice: ui.deductionChoice,
        support: ui.deductionSupport.slice(),
      });
      return;
    }
    if (action === "open-accuse") {
      ui.focusReturn = button.dataset.focusId;
      ui.dialog = "accuse";
      render();
      return;
    }
    if (action === "accuse-option") {
      ui.accuse[button.dataset.step] = id;
      render();
      return;
    }
    if (action === "toggle-attach") {
      ui.accuse.support = toggle(ui.accuse.support, id, 3);
      render();
      return;
    }
    if (action === "submit-accuse") {
      const next = onAction({
        type: "ACCUSE",
        payload: {
          status: ui.accuse.status,
          route: ui.accuse.route,
          purpose: ui.accuse.purpose,
          conduct: ui.accuse.conduct,
          support: ui.accuse.support.slice(),
        },
      });
      if (next.project.phase === "ending") {
        ui.dialog = null;
        ui.dialogKey = null;
        ui.accuse = blankAccuse();
        render();
      }
      return;
    }
    if (action === "hint") {
      ui.focusReturn = ui.focusReturn || button.dataset.focusId;
      ui.dialog = "hint";
      onAction({ type: "HINT" });
      return;
    }
    if (action === "open-settings") {
      ui.focusReturn = button.dataset.focusId;
      ui.dialog = "settings";
      render();
      return;
    }
    if (action === "tone") onAction({ type: "SET_TONE", on: !snap.settings.tone });
  });

  root.addEventListener("change", (event) => {
    const input = event.target;
    if (input?.dataset?.action === "volume") onAction({ type: "SET_VOLUME", volume: Number(input.value) });
  });

  root.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && (ui.dialog || ui.confirm || snap.conflict)) {
      if (ui.confirm) ui.confirm = null;
      else if (snap.conflict) onAction({ type: "DISMISS_CONFLICT" });
      else closeDialog();
      render();
      return;
    }
    if (event.key !== "Tab") return;
    const dialog = root.querySelector("[role='dialog']");
    if (!dialog) return;
    const items = [...dialog.querySelectorAll("button, a, input")].filter((node) => !node.disabled);
    if (!items.length) return;
    if (!dialog.contains(document.activeElement)) {
      event.preventDefault();
      (event.shiftKey ? items[items.length - 1] : items[0]).focus();
      return;
    }
    if (!items.length) return;
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

  function download() {
    if (!snap.heldRaw) return;
    const blob = new Blob([snap.heldRaw], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = el("a", { href: url, download: "last-broadcast-save.txt" });
    link.click();
    URL.revokeObjectURL(url);
  }

  return {
    sync(next) {
      snap = next;
      sync(next);
    },
  };

  function toggle(list, value, max) {
    if (list.includes(value)) return list.filter((item) => item !== value);
    if (list.length >= max) return list;
    return list.concat(value);
  }
}
