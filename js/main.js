const grid = document.querySelector("#people-grid");
const emptyState = document.querySelector("#empty-state");
const resultCount = document.querySelector("#result-count");
const searchInput = document.querySelector("#search-input");
const clearSearch = document.querySelector("#clear-search");

let people = [];
const assetVersion = "20260914-4";

function text(value) {
  return value == null || value === "" ? "" : String(value);
}

function escapeHtml(value) {
  return text(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function assetUrl(src) {
  if (!src) {
    return "";
  }

  const separator = src.includes("?") ? "&" : "?";
  return `${encodeURI(src)}${separator}v=${assetVersion}`;
}

function searchableText(person) {
  return [
    person.name,
    person.county,
    person.facility,
    person.headline,
    person.summary,
    person.story,
    person.quote,
    person.reviewReason,
    person.sentence,
    ...(person.accomplishments || []),
    ...(person.tags || [])
  ]
    .map(text)
    .join(" ")
    .toLowerCase();
}

function renderCards(items) {
  grid.innerHTML = items
    .map((person) => {
      const href = `story.html?id=${encodeURIComponent(person.id)}`;
      const name = text(person.name || "Unnamed story");
      const hasBefore = Boolean(person.beforeImage);
      const meta = [
        person.age ? `Age ${person.age}` : person.ageAtSentence ? `Age ${person.ageAtSentence}` : "",
        person.yearsServed ? `${person.yearsServed} years served` : "",
        person.county || ""
      ].filter(Boolean);
      const cardParagraphs = Array.isArray(person.cardParagraphs) && person.cardParagraphs.length
        ? person.cardParagraphs
        : [person.summary || "Story details are being prepared."];

      return `
        <article class="person-card">
          <div class="person-photos${hasBefore ? "" : " single-photo"}">
            ${
              hasBefore
                ? `<div class="person-photo">
                    <img src="${assetUrl(person.beforeImage)}" alt="${escapeHtml(`${name} before incarceration`)}">
                    <span>Before</span>
                  </div>`
                : ""
            }
            <div class="person-photo">
              ${
                person.currentImage
                  ? `<img src="${assetUrl(person.currentImage)}" alt="${escapeHtml(`${name} today`)}">`
                  : `<div class="photo-fallback" aria-label="${escapeHtml(`${name} current photo pending`)}"></div>`
              }
              <span>Today</span>
            </div>
          </div>
          <div class="person-body">
            <div>
              <h3>${escapeHtml(name)}</h3>
              ${person.headline ? `<p class="person-headline">${escapeHtml(person.headline)}</p>` : ""}
              <div class="person-meta">${meta.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>
            </div>
            <div class="person-summary">
              ${cardParagraphs.slice(0, 2).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
            </div>
            <div class="tag-list">
              ${(person.tags || []).slice(0, 4).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
            </div>
            <a class="button secondary" href="${href}">Read story</a>
          </div>
        </article>
      `;
    })
    .join("");

  const hasStories = people.length > 0;
  const hasMatches = items.length > 0;
  emptyState.hidden = hasStories && hasMatches;
  emptyState.textContent = hasStories
    ? "No stories match that search yet."
    : "Stories will appear here as they are added to the campaign archive.";
  resultCount.textContent = hasStories
    ? `Showing ${items.length} of ${people.length} ${people.length === 1 ? "story" : "stories"}`
    : "No stories added yet";
}

function applySearch() {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = query
    ? people.filter((person) => searchableText(person).includes(query))
    : people;

  renderCards(filtered);
}

fetch("people.json?v=20260914-4")
  .then((response) => {
    if (!response.ok) {
      throw new Error("Unable to load people.json");
    }
    return response.json();
  })
  .then((data) => {
    people = Array.isArray(data) ? data : [];
    renderCards(people);
  })
  .catch(() => {
    people = [];
    renderCards(people);
    emptyState.textContent = "The story archive could not be loaded.";
  });

searchInput.addEventListener("input", applySearch);
clearSearch.addEventListener("click", () => {
  searchInput.value = "";
  applySearch();
  searchInput.focus();
});
