import {
  closeSearchPanel,
  findNext,
  findPrevious,
  getSearchQuery,
  replaceAll,
  replaceNext,
  SearchQuery,
  selectMatches,
  setSearchQuery,
} from "@codemirror/search";
import { EditorState } from "@codemirror/state";
import { EditorView, type Panel, runScopeHandlers, type ViewUpdate } from "@codemirror/view";

// Inline SVG icon helpers (static, no CSP violations, no runtime styles)
const SVG_NS = "http://www.w3.org/2000/svg";

function createSvgIcon(pathD: string, viewBox = "0 0 24 24"): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", viewBox);
  svg.setAttribute("width", "14");
  svg.setAttribute("height", "14");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("cm-search-icon");

  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", pathD);
  svg.appendChild(path);
  return svg;
}

const ICON_CHEVRON_RIGHT = "m9 18 6-6-6-6";
const ICON_CHEVRON_DOWN = "m6 9 6 6 6-6";
const ICON_CHEVRON_UP = "m18 15-6-6-6 6";
const ICON_SELECT_ALL =
  "M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3";
const ICON_CLOSE = "M18 6 6 18M6 6l12 12";

function computeMatchCount(
  state: EditorState,
  query: SearchQuery,
): { current: number; total: number; hasMatches: boolean } {
  if (!query.search || !query.valid) {
    return { current: 0, total: 0, hasMatches: false };
  }
  try {
    const cursor = query.getCursor(state);
    const matches: { from: number; to: number }[] = [];
    let item = cursor.next();
    while (!item.done && matches.length < 1000) {
      matches.push({ from: item.value.from, to: item.value.to });
      item = cursor.next();
    }
    if (matches.length === 0) {
      return { current: 0, total: 0, hasMatches: false };
    }
    const main = state.selection.main;
    let currentIdx = -1;
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      if (match && match.from === main.from && match.to === main.to) {
        currentIdx = i;
        break;
      }
    }
    if (currentIdx === -1) {
      for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        if (match && match.from >= main.from) {
          currentIdx = i;
          break;
        }
      }
    }
    const current = currentIdx >= 0 ? currentIdx + 1 : 1;
    return { current, total: matches.length, hasMatches: true };
  } catch {
    return { current: 0, total: 0, hasMatches: false };
  }
}

export function createKitlandSearchPanel(view: EditorView): Panel {
  let query: SearchQuery = getSearchQuery(view.state);
  let isReplaceOpen = false;
  const isReadOnly =
    Boolean(view.state.facet(EditorState.readOnly)) || !view.state.facet(EditorView.editable);

  // Root container
  const dom = document.createElement("div");
  dom.className = "cm-search-widget";
  dom.setAttribute("role", "search");
  dom.setAttribute("aria-label", "Find and replace");

  // Row 1: Find Row
  const rowFind = document.createElement("div");
  rowFind.className = "cm-search-row";

  // Replace Toggle Button (if editable)
  let toggleReplaceBtn: HTMLButtonElement | null = null;
  if (!isReadOnly) {
    toggleReplaceBtn = document.createElement("button");
    toggleReplaceBtn.type = "button";
    toggleReplaceBtn.className = "cm-search-btn cm-search-btn-toggle";
    toggleReplaceBtn.setAttribute("aria-label", "Toggle replace");
    toggleReplaceBtn.setAttribute("aria-expanded", "false");
    toggleReplaceBtn.setAttribute("title", "Toggle Replace");
    toggleReplaceBtn.appendChild(createSvgIcon(ICON_CHEVRON_RIGHT));
    rowFind.appendChild(toggleReplaceBtn);
  }

  // Search Input Container
  const searchBox = document.createElement("div");
  searchBox.className = "cm-search-box";

  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.className = "cm-search-input";
  searchInput.name = "search";
  searchInput.setAttribute("main-field", "true");
  searchInput.setAttribute("aria-label", "Find");
  searchInput.placeholder = "Find";
  searchInput.value = query.search || "";
  searchBox.appendChild(searchInput);

  // Match counter badge
  const countBadge = document.createElement("span");
  countBadge.className = "cm-search-count";
  countBadge.setAttribute("aria-live", "polite");
  searchBox.appendChild(countBadge);

  // Option toggles group
  const optionsGroup = document.createElement("div");
  optionsGroup.className = "cm-search-options";

  const caseBtn = document.createElement("button");
  caseBtn.type = "button";
  caseBtn.className = "cm-search-chip";
  caseBtn.textContent = "Aa";
  caseBtn.setAttribute("title", "Match Case (Alt+C)");
  caseBtn.setAttribute("aria-label", "Match Case");
  caseBtn.setAttribute("aria-pressed", String(query.caseSensitive));
  if (query.caseSensitive) caseBtn.classList.add("is-active");

  const wordBtn = document.createElement("button");
  wordBtn.type = "button";
  wordBtn.className = "cm-search-chip";
  wordBtn.textContent = "\\b";
  wordBtn.setAttribute("title", "Match Whole Word (Alt+W)");
  wordBtn.setAttribute("aria-label", "Match Whole Word");
  wordBtn.setAttribute("aria-pressed", String(query.wholeWord));
  if (query.wholeWord) wordBtn.classList.add("is-active");

  const regexBtn = document.createElement("button");
  regexBtn.type = "button";
  regexBtn.className = "cm-search-chip";
  regexBtn.textContent = ".*";
  regexBtn.setAttribute("title", "Use Regular Expression (Alt+R)");
  regexBtn.setAttribute("aria-label", "Use Regular Expression");
  regexBtn.setAttribute("aria-pressed", String(query.regexp));
  if (query.regexp) regexBtn.classList.add("is-active");

  optionsGroup.appendChild(caseBtn);
  optionsGroup.appendChild(wordBtn);
  optionsGroup.appendChild(regexBtn);
  searchBox.appendChild(optionsGroup);

  rowFind.appendChild(searchBox);

  // Search Action Buttons
  const actionsGroup = document.createElement("div");
  actionsGroup.className = "cm-search-actions";

  const prevBtn = document.createElement("button");
  prevBtn.type = "button";
  prevBtn.className = "cm-search-btn";
  prevBtn.setAttribute("title", "Previous Match (Shift+Enter)");
  prevBtn.setAttribute("aria-label", "Previous Match");
  prevBtn.appendChild(createSvgIcon(ICON_CHEVRON_UP));

  const nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.className = "cm-search-btn";
  nextBtn.setAttribute("title", "Next Match (Enter)");
  nextBtn.setAttribute("aria-label", "Next Match");
  nextBtn.appendChild(createSvgIcon(ICON_CHEVRON_DOWN));

  const selectBtn = document.createElement("button");
  selectBtn.type = "button";
  selectBtn.className = "cm-search-btn";
  selectBtn.setAttribute("title", "Select All Matches (Alt+Enter)");
  selectBtn.setAttribute("aria-label", "Select All Matches");
  selectBtn.appendChild(createSvgIcon(ICON_SELECT_ALL));

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "cm-search-btn cm-search-btn-close";
  closeBtn.setAttribute("title", "Close (Escape)");
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.appendChild(createSvgIcon(ICON_CLOSE));

  actionsGroup.appendChild(prevBtn);
  actionsGroup.appendChild(nextBtn);
  actionsGroup.appendChild(selectBtn);
  actionsGroup.appendChild(closeBtn);
  rowFind.appendChild(actionsGroup);

  dom.appendChild(rowFind);

  // Row 2: Replace Row (if editable)
  let rowReplace: HTMLDivElement | null = null;
  let replaceInput: HTMLInputElement | null = null;
  let replaceBtn: HTMLButtonElement | null = null;
  let replaceAllBtn: HTMLButtonElement | null = null;

  if (!isReadOnly) {
    rowReplace = document.createElement("div");
    rowReplace.className = "cm-search-row cm-search-row-replace cm-search-row-hidden";

    // Spacer to align with toggle chevron
    const replaceSpacer = document.createElement("div");
    replaceSpacer.className = "cm-search-spacer";
    rowReplace.appendChild(replaceSpacer);

    const replaceBox = document.createElement("div");
    replaceBox.className = "cm-search-box";

    replaceInput = document.createElement("input");
    replaceInput.type = "text";
    replaceInput.className = "cm-search-input";
    replaceInput.name = "replace";
    replaceInput.setAttribute("aria-label", "Replace");
    replaceInput.placeholder = "Replace";
    replaceInput.value = query.replace || "";
    replaceBox.appendChild(replaceInput);
    rowReplace.appendChild(replaceBox);

    const replaceActions = document.createElement("div");
    replaceActions.className = "cm-search-actions cm-search-replace-actions";

    replaceBtn = document.createElement("button");
    replaceBtn.type = "button";
    replaceBtn.className = "cm-search-action-btn";
    replaceBtn.textContent = "Replace";
    replaceBtn.setAttribute("title", "Replace Next");
    replaceBtn.setAttribute("aria-label", "Replace Next");

    replaceAllBtn = document.createElement("button");
    replaceAllBtn.type = "button";
    replaceAllBtn.className = "cm-search-action-btn";
    replaceAllBtn.textContent = "All";
    replaceAllBtn.setAttribute("title", "Replace All");
    replaceAllBtn.setAttribute("aria-label", "Replace All");

    replaceActions.appendChild(replaceBtn);
    replaceActions.appendChild(replaceAllBtn);
    rowReplace.appendChild(replaceActions);

    dom.appendChild(rowReplace);
  }

  function updateCountDisplay() {
    if (!searchInput.value) {
      countBadge.textContent = "";
      countBadge.classList.remove("is-empty", "is-found");
      return;
    }
    const info = computeMatchCount(view.state, query);
    if (!info.hasMatches) {
      countBadge.textContent = "No results";
      countBadge.classList.add("is-empty");
      countBadge.classList.remove("is-found");
    } else {
      const totalStr = info.total >= 1000 ? "999+" : String(info.total);
      countBadge.textContent = `${info.current} of ${totalStr}`;
      countBadge.classList.add("is-found");
      countBadge.classList.remove("is-empty");
    }
  }

  function commitQuery() {
    const newQuery = new SearchQuery({
      search: searchInput.value,
      caseSensitive: caseBtn.classList.contains("is-active"),
      regexp: regexBtn.classList.contains("is-active"),
      wholeWord: wordBtn.classList.contains("is-active"),
      replace: replaceInput ? replaceInput.value : "",
    });
    if (!newQuery.eq(query)) {
      query = newQuery;
      view.dispatch({ effects: setSearchQuery.of(query) });
    }
    updateCountDisplay();
  }

  function toggleReplace(force?: boolean) {
    if (!rowReplace) return;
    isReplaceOpen = force !== undefined ? force : !isReplaceOpen;
    if (isReplaceOpen) {
      rowReplace.classList.remove("cm-search-row-hidden");
      toggleReplaceBtn?.classList.add("is-expanded");
      toggleReplaceBtn?.setAttribute("aria-expanded", "true");
    } else {
      rowReplace.classList.add("cm-search-row-hidden");
      toggleReplaceBtn?.classList.remove("is-expanded");
      toggleReplaceBtn?.setAttribute("aria-expanded", "false");
    }
  }

  // Event Listeners
  searchInput.addEventListener("input", commitQuery);
  if (replaceInput) {
    replaceInput.addEventListener("input", commitQuery);
  }

  toggleReplaceBtn?.addEventListener("click", () => {
    toggleReplace();
    if (isReplaceOpen && replaceInput) {
      replaceInput.focus();
    }
  });

  caseBtn.addEventListener("click", () => {
    caseBtn.classList.toggle("is-active");
    caseBtn.setAttribute("aria-pressed", String(caseBtn.classList.contains("is-active")));
    commitQuery();
  });

  wordBtn.addEventListener("click", () => {
    wordBtn.classList.toggle("is-active");
    wordBtn.setAttribute("aria-pressed", String(wordBtn.classList.contains("is-active")));
    commitQuery();
  });

  regexBtn.addEventListener("click", () => {
    regexBtn.classList.toggle("is-active");
    regexBtn.setAttribute("aria-pressed", String(regexBtn.classList.contains("is-active")));
    commitQuery();
  });

  prevBtn.addEventListener("click", () => {
    findPrevious(view);
    updateCountDisplay();
  });

  nextBtn.addEventListener("click", () => {
    findNext(view);
    updateCountDisplay();
  });

  selectBtn.addEventListener("click", () => {
    selectMatches(view);
  });

  closeBtn.addEventListener("click", () => {
    closeSearchPanel(view);
  });

  replaceBtn?.addEventListener("click", () => {
    replaceNext(view);
    updateCountDisplay();
  });

  replaceAllBtn?.addEventListener("click", () => {
    replaceAll(view);
    updateCountDisplay();
  });

  // Keyboard navigation inside search panel
  dom.addEventListener("keydown", (e: KeyboardEvent) => {
    if (runScopeHandlers(view, e, "search-panel")) {
      e.preventDefault();
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      closeSearchPanel(view);
      return;
    }

    // Shortcut: Alt+C (Match Case), Alt+W (Whole Word), Alt+R (Regex)
    if (e.altKey && (e.key === "c" || e.key === "C")) {
      e.preventDefault();
      caseBtn.click();
      return;
    }
    if (e.altKey && (e.key === "w" || e.key === "W")) {
      e.preventDefault();
      wordBtn.click();
      return;
    }
    if (e.altKey && (e.key === "r" || e.key === "R")) {
      e.preventDefault();
      regexBtn.click();
      return;
    }

    if (e.target === searchInput) {
      if (e.key === "Enter") {
        e.preventDefault();
        if (e.altKey) {
          selectMatches(view);
        } else if (e.shiftKey) {
          findPrevious(view);
        } else {
          findNext(view);
        }
        updateCountDisplay();
      }
    } else if (replaceInput && e.target === replaceInput) {
      if (e.key === "Enter") {
        e.preventDefault();
        if (e.altKey) {
          replaceAll(view);
        } else {
          replaceNext(view);
        }
        updateCountDisplay();
      }
    }
  });

  // Initial count update
  updateCountDisplay();

  return {
    dom,
    top: true,
    mount() {
      searchInput.focus();
      searchInput.select();
      updateCountDisplay();
    },
    update(update: ViewUpdate) {
      for (const tr of update.transactions) {
        for (const effect of tr.effects) {
          if (effect.is(setSearchQuery)) {
            const nextQuery = effect.value as SearchQuery;
            if (!nextQuery.eq(query)) {
              query = nextQuery;
              if (document.activeElement !== searchInput) {
                searchInput.value = query.search;
              }
              if (replaceInput && document.activeElement !== replaceInput) {
                replaceInput.value = query.replace;
              }
              caseBtn.classList.toggle("is-active", query.caseSensitive);
              caseBtn.setAttribute("aria-pressed", String(query.caseSensitive));
              wordBtn.classList.toggle("is-active", query.wholeWord);
              wordBtn.setAttribute("aria-pressed", String(query.wholeWord));
              regexBtn.classList.toggle("is-active", query.regexp);
              regexBtn.setAttribute("aria-pressed", String(query.regexp));
            }
          }
        }
      }
      if (update.docChanged || update.selectionSet) {
        updateCountDisplay();
      }
    },
  };
}
