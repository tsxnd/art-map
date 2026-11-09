"use strict";
const entries = document.querySelector("#entries");
const articles = [...entries.querySelectorAll(".entry")];
const search = document.querySelector("#search");
const sort = document.querySelector("#sort");
const series = document.querySelector("#series");
const eraButtons = [...document.querySelectorAll(".era-button")];
let selectedEra = "all";

function normalize(text) {
  return text.normalize("NFKC").toLocaleLowerCase("ja").replace(/[\u30a1-\u30f6]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
}

function updateResults() {
  const terms = normalize(search.value).trim().split(/\s+/).filter(Boolean);
  let count = 0;
  for (const article of articles) {
    const match = (selectedEra === "all" || article.dataset.era === selectedEra)
      && (!series || series.value === "all" || article.dataset.series === series.value)
      && terms.every(term => normalize(article.dataset.search).includes(term));
    article.hidden = !match;
    if (match) count++;
  }
  const active = eraButtons.find(button => button.dataset.era === selectedEra);
  document.querySelector("#catalog-title").textContent = active.querySelector("span").textContent;
  document.querySelector("#result-count").textContent = `${count}本の教材${count === articles.length ? "" : ` ／ 全${articles.length}本`}`;
  document.querySelector("#empty").hidden = count !== 0;
}

for (const button of eraButtons) {
  button.addEventListener("click", () => {
    selectedEra = button.dataset.era;
    for (const candidate of eraButtons) {
      const active = candidate === button;
      candidate.classList.toggle("active", active);
      candidate.setAttribute("aria-pressed", String(active));
    }
    updateResults();
  });
}
search.addEventListener("input", updateResults);
series?.addEventListener("change", updateResults);
sort.addEventListener("change", () => {
  const direction = sort.value === "desc" ? -1 : 1;
  [...articles].sort((a, b) => direction * (Number(a.dataset.number) - Number(b.dataset.number))).forEach(article => entries.append(article));
});
document.querySelector(".reset-button").addEventListener("click", () => {
  search.value = "";
  if (series) series.value = "all";
  eraButtons[0].click();
  search.focus();
});
