const sample = ` Full Name ,Email Address, City , City 
  Alice Smith  , alice@example.com , New York , NY
Alice Smith,alice@example.com,New York,NY
   ,   , ,
Bob Jones,bob@example.com, London , UK`;

// Lemon Squeezy hosted checkout links; paste them here once the store is live and the buttons turn on.
const CHECKOUT_URLS = {
  personal: "",
  toolkit: "",
  business: "",
};

// The "checkout opens soon" note only makes sense until the first live link is configured.
if (Object.values(CHECKOUT_URLS).some(Boolean)) {
  document.querySelector(".launch-note")?.remove();
}

document.querySelectorAll("[data-checkout]").forEach((button) => {
  const url = CHECKOUT_URLS[button.dataset.checkout];
  if (!url) return;
  const link = document.createElement("a");
  link.href = url;
  link.className = "checkout";
  link.textContent = "Buy now";
  link.rel = "noopener";
  button.replaceWith(link);
});

const input = document.querySelector("#csvInput");
const output = document.querySelector("#csvOutput");
const status = document.querySelector("#demoStatus");
const metrics = document.querySelectorAll("#demoMetrics b");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') { cell += '"'; index += 1; }
      else quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(cell); cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += character;
  }
  row.push(cell);
  if (row.some((value) => value.length) || rows.length === 0) rows.push(row);
  return rows;
}

function normalizeHeader(value, position) {
  const normalized = value.normalize("NFKC").trim().toLowerCase().replace(/[^\p{L}\p{N}_]+/gu, "_").replace(/^_+|_+$/g, "");
  return normalized || `column_${position}`;
}

function serializeCell(value) {
  return /[",\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

function cleanSample() {
  const rows = parseCsv(input.value);
  if (!rows.length || !rows[0].some((cell) => cell.trim())) {
    status.textContent = "No header";
    output.value = "Add a header row to continue.";
    return;
  }
  const counts = new Map();
  const headers = rows[0].map((value, index) => {
    const base = normalizeHeader(value, index + 1);
    counts.set(base, (counts.get(base) || 0) + 1);
    return counts.get(base) === 1 ? base : `${base}_${counts.get(base)}`;
  });
  const seen = new Set();
  const cleaned = [];
  let empty = 0;
  let duplicates = 0;
  let changed = 0;
  rows.slice(1).forEach((row) => {
    const width = Math.max(headers.length, row.length);
    while (headers.length < width) headers.push(`column_${headers.length + 1}`);
    const padded = [...row, ...Array(width - row.length).fill("")];
    const next = padded.map((value) => value.normalize("NFKC").replace(/\s+/g, " ").trim());
    changed += next.filter((value, index) => value !== padded[index]).length;
    if (!next.some(Boolean)) { empty += 1; return; }
    const key = JSON.stringify(next);
    if (seen.has(key)) { duplicates += 1; return; }
    seen.add(key); cleaned.push(next);
  });
  output.value = [headers, ...cleaned].map((row) => row.map(serializeCell).join(",")).join("\n");
  metrics[0].textContent = duplicates;
  metrics[1].textContent = empty;
  metrics[2].textContent = changed;
  status.textContent = `${cleaned.length} rows ready`;
}

document.querySelector("#cleanDemo").addEventListener("click", cleanSample);
document.querySelector("#resetDemo").addEventListener("click", () => { input.value = sample; cleanSample(); });
input.value = sample;
cleanSample();

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add("visible"); });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
