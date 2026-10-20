import { catalog } from "./content/catalog";
import { validateContent } from "./content/validate";
import { mount } from "./ui/app";

const root = document.querySelector("#app");
if (!(root instanceof HTMLElement)) {
  throw new Error("Missing #app");
}

const problems = validateContent(catalog);
if (problems.length > 0) {
  const message = document.createElement("p");
  message.textContent = `The case file failed its checks: ${problems.join("; ")}`;
  root.replaceChildren(message);
} else {
  mount(root, catalog);
}
