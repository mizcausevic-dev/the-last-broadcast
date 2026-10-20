import { createTone } from "./audio.js";
import { createController } from "./controller.js";
import { SAVE_KEY } from "./save.js";
import { createView } from "./view.js";

const controller = createController({ storage: localStorage });
const tone = createTone();
let heardGesture = false;

const view = createView(document.querySelector("#app"), document.querySelector("#live"), (action) => {
  const next = controller.handle(action);
  if (heardGesture && (action.type === "SET_TONE" || action.type === "SET_VOLUME" || next.settings.tone)) {
    tone.apply(next.settings);
  }
  if (action.type === "SET_TONE" || action.type === "SET_VOLUME") tone.apply(next.settings);
  view.sync(next);
  return next;
});

view.sync(controller.snapshot());

document.addEventListener("pointerdown", () => {
  heardGesture = true;
  tone.apply(controller.snapshot().settings);
}, { once: true });

window.addEventListener("storage", (event) => {
  if (event.key === SAVE_KEY) view.sync(controller.handle({ type: "NOTE_EXTERNAL" }));
});
