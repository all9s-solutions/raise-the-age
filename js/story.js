const root = document.querySelector("#story-root");
const params = new URLSearchParams(window.location.search);
const id = params.get("id");
const assetVersion = "20260914-4";

function text(value) {
  return value == null || value === "" ? "Not listed" : String(value);
}

function optionalText(value) {
  return value == null || value === "" ? "" : String(value);
}

function escapeHtml(value) {
  return optionalText(value)
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

function photo(src, alt, label) {
  if (!src) {
    return "";
  }

  return `
    <figure class="story-photo">
      <img src="${assetUrl(src)}" alt="${escapeHtml(alt)}">
      <span>${escapeHtml(label)}</span>
    </figure>
  `;
}

function setTitle(person) {
  document.title = `${person.name} | Raise the Age`;
}

function detail(label, value) {
  if (value == null || value === "") {
    return "";
  }

  return `
    <div>
      <dt>${escapeHtml(label)}</dt>
      <dd>${escapeHtml(text(value))}</dd>
    </div>
  `;
}

function linksList(links) {
  if (!Array.isArray(links) || links.length === 0) {
    return "";
  }

  return `
    <section class="story-section">
      <h2>Related links</h2>
      <div class="story-links">
        ${links.map((link) => `<a href="${encodeURI(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(text(link.label || link.url))}</a>`).join("")}
      </div>
    </section>
  `;
}

function paragraphs(items, fallback) {
  const values = Array.isArray(items) && items.length ? items : [fallback];
  return values.map((item) => `<p>${escapeHtml(text(item))}</p>`).join("");
}

function renderStory(person) {
  setTitle(person);
  const accomplishments = person.accomplishments || [];
  const tags = person.tags || [];
  const hasBefore = Boolean(person.beforeImage);

  root.innerHTML = `
    <article class="story-shell">
      <div class="story-photos${hasBefore ? "" : " single-photo"}">
        ${photo(person.beforeImage, `${person.name} before incarceration`, "Before incarceration")}
        ${photo(person.currentImage, `${person.name} today`, "Today")}
        ${photo(person.posterImage, `${person.name} campaign story flyer`, "Campaign flyer")}
      </div>
      <div class="story-content">
        <div class="story-title">
          <p class="eyebrow">Raise the Age story</p>
          <h1>${escapeHtml(text(person.name))}</h1>
          ${person.headline ? `<p class="story-headline">${escapeHtml(person.headline)}</p>` : ""}
        </div>

        <dl class="detail-list">
          ${detail("Age", person.age || person.ageAtSentence)}
          ${detail("Years served", person.yearsServed)}
          ${detail("County", person.county)}
          ${detail("Facility", person.facility)}
          ${detail("Sentence", person.sentence)}
        </dl>

        ${
          person.quote
            ? `<blockquote class="story-quote">${escapeHtml(text(person.quote))}</blockquote>`
            : ""
        }

        <section class="story-section">
          <h2>Summary</h2>
          <p>${escapeHtml(text(person.summary || "This story is being prepared."))}</p>
        </section>

        ${
          person.story
            ? `<section class="story-section"><h2>Story</h2>${paragraphs(person.paragraphs, person.story)}</section>`
            : ""
        }

        <section class="story-section">
          <h2>Accomplishments</h2>
          ${
            accomplishments.length
              ? `<ul class="accomplishments">${accomplishments.map((item) => `<li>${escapeHtml(text(item))}</li>`).join("")}</ul>`
              : "<p>Accomplishments will be added as campaign materials are reviewed.</p>"
          }
        </section>

        <section class="story-section">
          <h2>Why review matters</h2>
          <p>${escapeHtml(text(person.reviewReason || "More information will be added here."))}</p>
        </section>

        ${
          tags.length
            ? `<section class="story-section"><div class="tag-list">${tags.map((tag) => `<span class="tag">${escapeHtml(text(tag))}</span>`).join("")}</div></section>`
            : ""
        }

        ${linksList(person.links)}

        <section class="story-section">
          <a class="button primary" href="index.html#stories">Back to all stories</a>
        </section>
      </div>
    </article>
  `;
}

if (!id) {
  root.innerHTML = '<p class="empty-state">No story was selected. Return to the story archive to choose a person.</p>';
} else {
  fetch("people.json?v=20260914-4")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Unable to load people.json");
      }
      return response.json();
    })
    .then((people) => {
      const person = Array.isArray(people) ? people.find((item) => item.id === id) : null;
      if (person) {
        renderStory(person);
      } else {
        root.innerHTML = '<p class="empty-state">That story was not found in the archive.</p>';
      }
    })
    .catch(() => {
      root.innerHTML = '<p class="empty-state">The story archive could not be loaded.</p>';
    });
}
