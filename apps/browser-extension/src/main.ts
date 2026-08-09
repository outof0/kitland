import type { ToolFamilyId } from "@kitland/tool-catalog";
import "./styles.css";
import { getToolRegistration, TOOL_REGISTRATIONS, type ToolRegistration } from "./registry";

const elements = {
  host: element("#tool-host", HTMLElement),
  list: element("#tool-list", HTMLUListElement),
  search: element("#tool-search", HTMLInputElement),
  count: element("#tool-count", HTMLOutputElement),
};

let activeSlug = "";
let activeCleanup: (() => void) | null = null;
let activationSequence = 0;

renderCatalog(TOOL_REGISTRATIONS);
elements.search.addEventListener("input", filterCatalog);
elements.search.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowDown") return;
  const first = elements.list.querySelector<HTMLButtonElement>("button");
  if (!first) return;
  event.preventDefault();
  moveCatalogFocus(first);
});
window.addEventListener("hashchange", () => void activateFromLocation());
window.addEventListener(
  "pagehide",
  () => {
    activeCleanup?.();
    activeCleanup = null;
  },
  { once: true },
);
void activateFromLocation();

function filterCatalog(): void {
  const query = elements.search.value.trim().toLocaleLowerCase();
  const filtered = query
    ? TOOL_REGISTRATIONS.filter(({ tool }) =>
        [tool.name, tool.shortName, tool.description, ...tool.keywords]
          .join(" ")
          .toLocaleLowerCase()
          .includes(query),
      )
    : TOOL_REGISTRATIONS;
  renderCatalog(filtered);
}

function renderCatalog(registrations: readonly ToolRegistration[]): void {
  elements.list.replaceChildren();
  elements.count.value = `${registrations.length}/${TOOL_REGISTRATIONS.length}`;
  elements.count.textContent = elements.count.value;

  if (registrations.length === 0) {
    const empty = document.createElement("li");
    empty.className = "tool-list-empty";
    empty.textContent = "No registered tool matches that search.";
    elements.list.appendChild(empty);
    return;
  }

  for (const registration of registrations) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    const family = document.createElement("span");
    const name = document.createElement("strong");
    const indicator = document.createElement("span");

    button.type = "button";
    button.dataset.slug = registration.tool.slug;
    button.setAttribute("aria-current", registration.tool.slug === activeSlug ? "page" : "false");
    button.tabIndex = -1;
    button.addEventListener("click", () => selectTool(registration.tool.slug));
    button.addEventListener("keydown", navigateCatalogByKeyboard);

    family.className = "tool-list-family";
    family.textContent = familyLabel(registration.tool.family);
    name.textContent = registration.tool.shortName;
    indicator.className = "tool-list-indicator";
    indicator.setAttribute("aria-hidden", "true");

    button.append(family, name, indicator);
    item.appendChild(button);
    elements.list.appendChild(item);
  }

  updateCatalogSelection();
}

function selectTool(slug: string): void {
  const nextHash = `#tool=${encodeURIComponent(slug)}`;
  if (window.location.hash === nextHash) {
    void activate(slug);
  } else {
    window.location.hash = nextHash;
  }
}

async function activateFromLocation(): Promise<void> {
  const requestedSlug = readSlugFromHash();
  const fallback = TOOL_REGISTRATIONS[0];
  const registration = requestedSlug ? getToolRegistration(requestedSlug) : fallback;
  if (!registration) {
    if (fallback) {
      window.history.replaceState(null, "", `#tool=${encodeURIComponent(fallback.tool.slug)}`);
      await activate(fallback.tool.slug);
    } else {
      showFatalError("No browser-extension tool renderer is registered.");
    }
    return;
  }
  await activate(registration.tool.slug);
}

async function activate(slug: string): Promise<void> {
  const registration = getToolRegistration(slug);
  if (!registration) {
    showFatalError(`The tool "${slug}" is not registered for this extension.`);
    return;
  }

  const activationId = ++activationSequence;
  activeCleanup?.();
  activeCleanup = null;
  activeSlug = slug;
  updateCatalogSelection();
  showLoading(registration.tool.shortName);

  try {
    const module = await registration.load();
    if (activationId !== activationSequence) return;
    elements.host.replaceChildren();
    activeCleanup = module.mountTool({ root: elements.host });
    elements.host.setAttribute("aria-busy", "false");
    document.title = `${registration.tool.shortName} · Kitland Developer Tools`;
  } catch (cause) {
    if (activationId !== activationSequence) return;
    const message = cause instanceof Error ? cause.message : "Unknown renderer error";
    showFatalError(`Could not load ${registration.tool.shortName}. ${message}`);
  }
}

function updateCatalogSelection(): void {
  const buttons = [...elements.list.querySelectorAll<HTMLButtonElement>("button[data-slug]")];
  const active = buttons.find((button) => button.dataset.slug === activeSlug);
  const rovingTarget = active ?? buttons[0];

  for (const button of buttons) {
    const isActive = button === active;
    button.setAttribute("aria-current", isActive ? "page" : "false");
    button.tabIndex = button === rovingTarget ? 0 : -1;
  }
}

function navigateCatalogByKeyboard(event: KeyboardEvent): void {
  if (!(event.currentTarget instanceof HTMLButtonElement)) return;
  const buttons = [...elements.list.querySelectorAll<HTMLButtonElement>("button[data-slug]")];
  const currentIndex = buttons.indexOf(event.currentTarget);
  if (currentIndex < 0) return;

  let nextIndex: number | undefined;
  switch (event.key) {
    case "ArrowDown":
      nextIndex = (currentIndex + 1) % buttons.length;
      break;
    case "ArrowUp":
      nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
      break;
    case "Home":
      nextIndex = 0;
      break;
    case "End":
      nextIndex = buttons.length - 1;
      break;
    default:
      return;
  }

  const target = buttons[nextIndex];
  if (!target) return;
  event.preventDefault();
  moveCatalogFocus(target);
}

function moveCatalogFocus(target: HTMLButtonElement): void {
  for (const button of elements.list.querySelectorAll<HTMLButtonElement>("button[data-slug]")) {
    button.tabIndex = button === target ? 0 : -1;
  }
  target.focus();
}

function showLoading(name: string): void {
  elements.host.setAttribute("aria-busy", "true");
  const loading = document.createElement("div");
  loading.className = "tool-loading";
  loading.setAttribute("role", "status");
  const pulse = document.createElement("span");
  pulse.setAttribute("aria-hidden", "true");
  loading.append(pulse, `Loading ${name} locally…`);
  elements.host.replaceChildren(loading);
}

function showFatalError(message: string): void {
  elements.host.setAttribute("aria-busy", "false");
  const panel = document.createElement("section");
  const heading = document.createElement("h2");
  const detail = document.createElement("p");
  panel.className = "tool-load-error";
  panel.setAttribute("role", "alert");
  heading.textContent = "Tool unavailable";
  detail.textContent = message;
  panel.append(heading, detail);
  elements.host.replaceChildren(panel);
}

function readSlugFromHash(): string | null {
  const hash = window.location.hash.slice(1);
  const params = new URLSearchParams(hash);
  return params.get("tool");
}

function familyLabel(family: ToolFamilyId): string {
  switch (family) {
    case "json-markup":
      return "FORMAT";
    case "encoding-text":
      return "ENCODE";
    case "generators":
      return "GENERATE";
    case "hash-crypto":
      return "CRYPTO";
    case "text-regex":
      return "TEXT";
    case "time-network":
      return "NETWORK";
  }
}

function element<T extends Element>(selector: string, constructor: { new (): T }): T {
  const found = document.querySelector(selector);
  if (!(found instanceof constructor))
    throw new Error(`Missing extension shell element: ${selector}`);
  return found;
}
