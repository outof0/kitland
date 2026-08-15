function initExploreCatalog() {
  const catalogForm = document.querySelector<HTMLFormElement>("[data-explore-filters]");
  if (!catalogForm) return;

  const search = catalogForm.querySelector<HTMLInputElement>("[data-explore-search]");
  const family = catalogForm.querySelector<HTMLSelectElement>("[data-explore-family]");
  const availability = catalogForm.querySelector<HTMLElement>("[data-explore-availability]");
  const clearButtons = document.querySelectorAll<HTMLButtonElement>(
    "[data-explore-clear], [data-explore-empty-clear]",
  );
  const status = document.querySelector<HTMLElement>("[data-explore-status]");
  const empty = document.querySelector<HTMLElement>("[data-explore-empty]");
  const results = document.querySelector<HTMLElement>("[data-explore-results]");
  const cards = [...document.querySelectorAll<HTMLElement>("[data-explore-card]")];
  const groups = [...document.querySelectorAll<HTMLElement>("[data-explore-family-group]")];

  const getAvailability = () =>
    availability?.querySelector<HTMLInputElement>('input[name="availability"]:checked')?.value ??
    "all";

  const filterCatalog = () => {
    const query = search?.value.trim().toLocaleLowerCase() ?? "";
    const familyValue = family?.value ?? "all";
    const availabilityValue = getAvailability();
    let visibleCount = 0;

    for (const card of cards) {
      const matchesQuery = !query || card.dataset.exploreSearch?.includes(query);
      const matchesFamily = familyValue === "all" || card.dataset.exploreFamily === familyValue;
      const matchesAvailability =
        availabilityValue === "all" || card.dataset.exploreAvailability === availabilityValue;
      const isVisible = Boolean(matchesQuery && matchesFamily && matchesAvailability);

      card.hidden = !isVisible;
      if (isVisible) visibleCount += 1;
    }

    for (const group of groups) {
      group.hidden = ![...group.querySelectorAll<HTMLElement>("[data-explore-card]")].some(
        (card) => !card.hidden,
      );
    }

    const isFiltered = Boolean(query || familyValue !== "all" || availabilityValue !== "all");
    for (const clearButton of clearButtons) clearButton.hidden = !isFiltered;
    if (results) results.hidden = visibleCount === 0;
    if (empty) empty.hidden = visibleCount !== 0;
    if (status) {
      status.textContent = isFiltered
        ? `Showing ${visibleCount} of ${cards.length} tools.`
        : `Showing all ${cards.length} tools.`;
    }
  };

  const clearFilters = () => {
    if (search) search.value = "";
    if (family) family.value = "all";
    const allAvailability = availability?.querySelector<HTMLInputElement>('input[value="all"]');
    if (allAvailability) allAvailability.checked = true;
    filterCatalog();
    search?.focus();
  };

  search?.addEventListener("input", filterCatalog);
  family?.addEventListener("change", filterCatalog);
  availability?.addEventListener("change", filterCatalog);
  catalogForm.addEventListener("submit", (event) => event.preventDefault());
  for (const clearButton of clearButtons) clearButton.addEventListener("click", clearFilters);
}

document.addEventListener("astro:page-load", initExploreCatalog);
