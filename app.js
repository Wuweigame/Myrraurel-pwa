// ============================================================
//  Myrr’aurel Tome Generator — app.js
//  Includes: PWA offline, generator, living archive mode,
//  Attention/Contamination clocks, IndexedDB-lite (localStorage),
//  full ledger with search, export/import.
// ============================================================

// –– PWA Service Worker Registration
if (“serviceWorker” in navigator) {
navigator.serviceWorker.register(”./sw.js”).catch(function() {});
}

// –– DOM helpers
const $ = (id) => document.getElementById(id);
const STORE_KEY = “myrraurel_ledger_v1”;
const CLOCK_KEY  = “myrraurel_clocks_v1”;

// –– State
const state = {
currentTome: null,
ledger: loadLedger(),
clocks: loadClocks(),
mode: “neutral” // “neutral” | “alive”
};

function loadLedger() {
try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; }
catch { return []; }
}

function saveLedger() {
localStorage.setItem(STORE_KEY, JSON.stringify(state.ledger));
}

function loadClocks() {
try { return JSON.parse(localStorage.getItem(CLOCK_KEY)) || { attention: 0, contamination: 0 }; }
catch { return { attention: 0, contamination: 0 }; }
}

function saveClocks() {
localStorage.setItem(CLOCK_KEY, JSON.stringify(state.clocks));
}

// ============================
//   GENERATION DATA
// ============================

const syllables = {
human:    [“Al”,“Ber”,“Cor”,“Dun”,“Eld”,“Mar”,“Ren”,“Syl”,“Tor”,“Val”,“Ky”,“Vor”,“Alis”,“Mer”,“Dav”,“Sol”,“Ran”],
andorian: [“Vael”,“Isvo”,“Thal”,“Aeth”,“Sil”,“Khar”,“Vore”,“Quan”,“Lyth”,“Eira”,“Zanar”,“Selwyn”,“Caer”,“Thyr”,“Nael”],
uldar:    [“Zael”,“Drah”,“Val”,“Shyr”,“Myrr”,“Zahr”,“Grynn”,“Thaen”,“Kaal”,“Lys”,“Nythyr”,“Thyraal”,“Vosk”,“Drael”,“Gryss”]
};

const topicMotifs = {
“Eldraxis”:     [“unmaking”,“silence between worlds”,“fractured memory”,“black spiral”,“echo-cities”,“the Hunger that waits”,“inverted names”],
“Weave Theory”: [“harmonics”,“anchors”,“resonance”,“geometries”,“invariants”,“the seventh thread”,“woven silences”],
“Heartwood”:    [“root-archives”,“sap as ink”,“dream-boughs”,“living strata”,“buried pulse”,“the oldest ring”,“whispered rings”],
“Life Stones”:  [“Etherium lattice”,“centuries of recharge”,“planet-keys”,“the missing fixture”,“sixfold circuit”,“sleeping light”,“the Cradle”],
“Vey’kar”:      [“shadow-forged vows”,“half-freed souls”,“the blade that binds”,“cold devotion”,“betrayal-glyphs”,“the Bound Name”,“shadow-tithes”],
“Silver Flame”: [“coalition oaths”,“sacrificial calculus”,“banishment rites”,“saints of ash”,“warding geometry”,“the Last Accord”,“remembered fire”],
“Kyros”:        [“rogue prison-world”,“mined Etherium”,“false voices”,“void frost”,“sealed hunger”,“the Warden’s scar”,“ice-logic”],
“Any”:          [“omissions”,“marginal warnings”,“torn indices”,“forbidden crossrefs”,“catalogue lies”,“unnamed witnesses”,“the gap between chapters”]
};

const wingAuthors = {
“Arcane”:    [“human”,“andorian”],
“Planar”:    [“andorian”,“uldar”],
“Forbidden”: [“uldar”,“andorian”,“human”],
“Bestiary”:  [“human”,“andorian”],
“Liturgies”: [“andorian”,“human”]
};

const consequencesNeutral = [
{ text: “No immediate consequence. The tome is what it appears to be.”, attention: 0, contamination: 0 },
{ text: “A useful truth is obtained, but cross-referencing reveals an inconsistency worth noting.”, attention: 0, contamination: 0 },
{ text: “A false lead appears convincing unless the party consults a second source.”, attention: 0, contamination: 0 },
{ text: “The tome is genuine but heavily redacted — key sections have been excised cleanly.”, attention: 0, contamination: 0 },
{ text: “The catalog entry for this tome has been altered since last index. Someone knew to look.”, attention: 1, contamination: 0 }
];

const consequencesAlive = [
{ text: “Attention +1. The stacks re-index around the reader. Something has noticed the inquiry.”, attention: 1, contamination: 0 },
{ text: “Contamination +1. Dreams recur with a new glyph — a character, a shape, a door.”, attention: 0, contamination: 1 },
{ text: “A named NPC becomes aware of the party’s inquiry within the week.”, attention: 1, contamination: 0 },
{ text: “Attention +1, Contamination +1. The tome reshelves itself before the session ends.”, attention: 1, contamination: 1 },
{ text: “Contamination +1. The reader retains one phrase they cannot stop reciting internally.”, attention: 0, contamination: 1 },
{ text: “Attention +2. A Myrr’aurel archivist arrives at the table with polite, pointed questions.”, attention: 2, contamination: 0 },
{ text: “No clock change. The library withholds consequence — for now. Mark this tome in the ledger.”, attention: 0, contamination: 0 },
{ text: “Contamination +2. A false memory is planted: the reader is certain they’ve read this before.”, attention: 0, contamination: 2 },
];

const highRiskConsequences = [
{ text: “Attention +2. The Black Index logs the reader’s name. The shelves know what was accessed.”, attention: 2, contamination: 0 },
{ text: “Attention +1, Contamination +2. The tome’s final page contains the reader’s name, written in their own hand.”, attention: 1, contamination: 2 },
{ text: “Contamination +2. The language shifts mid-read. The reader understands it anyway. They cannot explain how.”, attention: 0, contamination: 2 },
];

const dmTruthTypes = [“Key”,“Lie”,“Bait”,“Prophecy”,“Trap”,“Map-Fragment”,“Cipher”,“Confession”,“Warning”,“Decoy”];

const factions = [
“Sylvanox cell”, “Vey’kar emissary”, “Silver Flame remnant”,
“Andorian echo-warden”, “Eldraxian patron-signal”, “an unknown third party”,
“the Archivist’s Council”, “a former party ally”, “the Bound Ones”
];

const hooks = [
“cross-references a missing volume hidden deeper in”,
“directly contradicts the canonical account held in”,
“names a specific location accessible only via”,
“contains a cipher whose key is held separately in”,
“implies a secondary source exists somewhere within”
];

const eras = [
“Pre-Fall Andorian”, “Early Dark Age”, “Late Andorian Decline”,
“Post-Cataclysm Fragment”, “Disputed Interregnum”, “Third Age of the Weave”,
“The Sundering Period”, “Restoration Era”
];

const physicalStates = [
“intact, suspiciously pristine”,
“worm-eaten at the margins”,
“scorched at the edges — water-damaged within”,
“palimpsest over older text, earlier layer still legible”,
“stitched from mismatched quires, two different authors”,
“annotated heavily in an unknown hand”,
“sealed with wax that has already been broken”,
“missing its title page, beginning at chapter two”,
“bound in material that resists the eye’s focus”
];

// ============================
//   GENERATOR FUNCTIONS
// ============================

function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function roll(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function pickName(kind) {
const s = syllables[kind];
return rnd(s) + rnd(s).toLowerCase().replace(/^[aeiou]/, (v) => v);
}

function shelfCode(wing, depth) {
const w = wing.slice(0, 2).toUpperCase();
const d = depth === “Hall” ? “H” : depth === “Vault” ? “V” : “B”;
return `${w}-${d}-${roll(1,9)}${roll(0,9)}.${roll(1,7)}.${roll(1,12)}`;
}

function makeTitle(topic, wing) {
const forms = [
`On the ${rnd(["Seventh","Black","Hidden","Elder","Broken","Forgotten"])} ${rnd(["Index","Spiral","Axiom","Archive","Canticle","Concordance"])}`,
`The ${rnd(["Codex","Treatise","Chronicle","Manual","Testimony","Refutation"])} of ${rnd(["Root","Silence","Etherium","Ash","Echo","Dissolution"])}`,
`${rnd(["Margins","Annotations","Fragments","Minutes","Errata","Addenda"])} from ${rnd(["Elarien","the Deep Vaults","Kyros","the Fallen Hall","the Stair of Guidance","the Unwritten Wing"])}`,
`A ${rnd(["Catalogue","Refutation","Concordance","Litany","Survey","Reckoning"])} of ${rnd(["Names","Gates","Wounds","Threads","Rites","Omissions"])}`
];

const base = rnd(forms);
if (topic !== “Any”) return `${base} — ${topic}`;

// When topic is “Any”, pull from a random topic motif
const randomTopic = rnd(Object.keys(topicMotifs).filter(t => t !== “Any”));
return `${base}`;
}

function makeExcerpt(topic, risk) {
const motifs = topicMotifs[topic] || topicMotifs[“Any”];
const m1 = rnd(motifs);
const m2 = rnd(motifs);
const m3 = rnd(motifs);

const openers = [
`In the measureless interval where the Weave thins, there are signs — ${m1} — that do not belong to any honest chronology.`,
`The ${m1} is not catalogued here by accident. Let the reader consider what was omitted from adjacent shelves.`,
`It has been observed by no fewer than three archivists, all since retired, that the study of ${m1} produces a specific kind of forgetting.`,
`What follows is presented as theory. That it has happened is not in dispute. That it will happen again is the purpose of this volume.`
];

const middles = [
risk >= 4
? “The ink is wrong — too dark, as though it remembers the hand that bled it.”
: “The hand is practiced, the language formal, as though written for those who already know the price.”,
risk >= 3
? “A margin note, added later in a different ink: *Do not read this aloud in the presence of open water.*”
: “The style is measured, academic — the kind used when the author wishes to seem unconcerned.”,
];

const closers = [
`Let it be recorded that ${m2} is not discovered, but *answered*; and that what answers does so by means of ${m3}.`,
`The omission of ${m2} from the official index is deliberate. This volume should not be on this shelf. Proceed accordingly.`,
`Should the reader find that certain passages shift between readings, the archivist recommends setting the tome down and walking directly to the exit without looking at the shelves.`
];

return `${rnd(openers)} ${rnd(middles)} ${rnd(closers)}`;
}

function makeDmTruth(topic, wing, depth, risk, mode) {
const truthType = rnd(dmTruthTypes);
const faction   = rnd(factions);
const hook      = `This tome ${rnd(hooks)} the ${depth} of the ${wing} Wing.`;
const contradiction = risk >= 3
? “Contradicts an established claim in the player’s notes — may be deliberate censorship, a lure, or evidence of timeline divergence.”
: “Consistent with known fragments, but notably incomplete in a way that could be intentional.”;

// Pick consequence based on mode and risk
let consequence;
if (mode === “alive”) {
if (risk >= 4) {
consequence = rnd([…consequencesAlive, …highRiskConsequences]);
} else {
consequence = rnd(consequencesAlive);
}
} else {
if (risk >= 4) {
consequence = rnd([…consequencesNeutral, rnd(consequencesAlive)]);
} else {
consequence = rnd(consequencesNeutral);
}
}

return { truthType, faction, hook, contradiction, consequence };
}

function generateTome() {
const wing  = $(“wing”).value;
const depth = $(“depth”).value;
const topic = $(“topic”).value;
const risk  = Number($(“risk”).value);

const authorKindPool = wingAuthors[wing] || [“human”,“andorian”];
const authorKind = rnd(authorKindPool);
const author = pickName(authorKind);
const era = rnd(eras);
const physical = rnd(physicalStates);
const tags = topic === “Any”
? [rnd(Object.keys(topicMotifs).filter(t => t !== “Any”))]
: [topic];

const dm = makeDmTruth(topic, wing, depth, risk, state.mode);

const tome = {
id: crypto.randomUUID(),
createdAt: new Date().toISOString(),
wing, depth, topic, risk,
title:    makeTitle(topic, wing),
author,
era,
shelf:    shelfCode(wing, depth),
physical,
excerpt:  makeExcerpt(topic, risk),
dm,
tags
};

state.currentTome = tome;
renderCurrentTome();
$(“btnSave”).disabled = false;
$(“btnReroll”).disabled = false;

// Apply consequence clocks
if (dm.consequence.attention || dm.consequence.contamination) {
incrementClocks(dm.consequence.attention, dm.consequence.contamination);
}
}

// ============================
//   CLOCKS
// ============================

const MAX_CLOCK = 6;

function incrementClocks(attention, contamination) {
const prevA = state.clocks.attention;
const prevC = state.clocks.contamination;
state.clocks.attention     = Math.min(MAX_CLOCK, state.clocks.attention + attention);
state.clocks.contamination = Math.min(MAX_CLOCK, state.clocks.contamination + contamination);
saveClocks();
renderClocks(prevA, prevC);
}

function resetClocks() {
if (!confirm(“Reset Attention and Contamination clocks to zero?”)) return;
state.clocks = { attention: 0, contamination: 0 };
saveClocks();
renderClocks(0, 0);
}

function renderClocks(prevA, prevC) {
renderPips(“attentionPips”, state.clocks.attention, “attention”, prevA);
renderPips(“contaminationPips”, state.clocks.contamination, “contamination”, prevC);
}

function renderPips(elId, value, type, prevValue) {
const container = $(elId);
container.innerHTML = “”;
for (let i = 0; i < MAX_CLOCK; i++) {
const pip = document.createElement(“div”);
pip.className = “pip”;
if (i < value) {
pip.classList.add(`filled-${type}`);
if (prevValue !== undefined && i >= prevValue) {
pip.classList.add(“just-filled”);
setTimeout(() => pip.classList.remove(“just-filled”), 900);
}
}
container.appendChild(pip);
}
}

// ============================
//   RENDER
// ============================

function escapeHtml(s) {
return String(s).replace(/[&<>”’]/g, (c) => ({
“&”:”&”,”<”:”<”,”>”:”>”,’”’:”"”,”’”:”'”
}[c]));
}

function renderCurrentTome() {
const t = state.currentTome;
const out = $(“tomeOutput”);

if (!t) {
out.innerHTML = ` <div class="empty-state"> <div class="empty-glyph">⬡</div> <p>Retrieve a tome to reveal its catalog card, excerpt, and DM payload.</p> <p class="hint">The shelves are said to listen better than they see.</p> </div>`;
return;
}

const riskClass  = t.risk >= 4 ? “badge-risk-high” : “”;
const depthClass = t.depth === “Black Index” ? “badge-depth-black” : “”;
const hasConsequence = t.dm.consequence.attention > 0 || t.dm.consequence.contamination > 0;

const consequenceHtml = hasConsequence
? `<span class="consequence-pill">⚠ ${escapeHtml(t.dm.consequence.text)}</span>`
: `<span class="consequence-pill">✓ ${escapeHtml(t.dm.consequence.text)}</span>`;

out.innerHTML = `
<div class="card-enter">
<div class="card-title">${escapeHtml(t.title)}</div>

```
  <div class="badges">
    <span class="badge">${escapeHtml(t.wing)}</span>
    <span class="badge ${depthClass}">${escapeHtml(t.depth)}</span>
    <span class="badge ${riskClass}">Risk ${t.risk}</span>
    <span class="badge">${escapeHtml(t.shelf)}</span>
  </div>

  <div class="section-label">Catalog Card — Player Safe</div>
  <div class="card-meta">
    <p><b>Author:</b> ${escapeHtml(t.author)} &nbsp;·&nbsp; <b>Era:</b> ${escapeHtml(t.era)}</p>
    <p><b>Condition:</b> ${escapeHtml(t.physical)}</p>
    <p><b>Tags:</b> ${t.tags.map(escapeHtml).join(", ")}</p>
  </div>

  <div class="section-label">Excerpt — Read Aloud</div>
  <div class="excerpt">${escapeHtml(t.excerpt)}</div>

  <div class="section-label">DM Payload</div>
  <details class="dm-block">
    <summary>▶ Reveal DM Payload</summary>
    <div class="dm-inner">
      <div class="dm-row"><span class="dm-key">True Nature</span><span class="dm-val">${escapeHtml(t.dm.truthType)}</span></div>
      <div class="dm-row"><span class="dm-key">Faction Interest</span><span class="dm-val">${escapeHtml(t.dm.faction)}</span></div>
      <div class="dm-row"><span class="dm-key">Hook</span><span class="dm-val">${escapeHtml(t.dm.hook)}</span></div>
      <div class="dm-row"><span class="dm-key">Continuity Note</span><span class="dm-val">${escapeHtml(t.dm.contradiction)}</span></div>
      <div class="dm-row"><span class="dm-key">Consequence</span><span class="dm-val">${consequenceHtml}</span></div>
    </div>
  </details>
</div>
```

`;
}

function renderLedger() {
const q    = ($(“search”).value || “”).toLowerCase();
const list = state.ledger.filter(t => {
const hay = `${t.title} ${t.author} ${t.wing} ${t.depth} ${t.era} ${t.tags.join(" ")}`.toLowerCase();
return hay.includes(q);
});

const el = $(“ledger”);

if (!list.length) {
el.innerHTML = `<div class="ledger-empty">${ state.ledger.length === 0 ? "No tomes saved yet. Retrieve and save a tome to begin your ledger." : "No results match your search." }</div>`;
return;
}

el.innerHTML = list.map(t => `<div class="ledger-item"> <div class="ledger-title">${escapeHtml(t.title)}</div> <div class="ledger-meta"> ${escapeHtml(t.wing)} · ${escapeHtml(t.depth)} · Risk ${t.risk} · ${escapeHtml(t.shelf)} </div> <div class="ledger-meta"> ${escapeHtml(t.author)} · ${escapeHtml(t.era)} · ${new Date(t.createdAt).toLocaleDateString()} </div> </div>`).join(””);
}

// ============================
//   LEDGER OPERATIONS
// ============================

function addToLedger() {
if (!state.currentTome) return;
// Don’t add duplicates
if (state.ledger.some(e => e.id === state.currentTome.id)) return;
state.ledger.unshift(state.currentTome);
saveLedger();
renderLedger();
$(“btnSave”).disabled = true;
$(“btnSave”).textContent = “✓ Saved”;
setTimeout(() => {
$(“btnSave”).textContent = “Save to Ledger”;
$(“btnSave”).disabled = false;
}, 1500);
}

function exportLedger() {
const blob = new Blob([JSON.stringify(state.ledger, null, 2)], { type: “application/json” });
const url  = URL.createObjectURL(blob);
const a    = document.createElement(“a”);
a.href     = url;
a.download = `myrraurel_ledger_${new Date().toISOString().slice(0,10)}.json`;
a.click();
URL.revokeObjectURL(url);
}

function importLedger(file) {
const reader = new FileReader();
reader.onload = () => {
try {
const data = JSON.parse(reader.result);
if (!Array.isArray(data)) throw new Error(“Invalid ledger file.”);
state.ledger = data;
saveLedger();
renderLedger();
} catch (e) {
alert(“Import failed: “ + e.message);
}
};
reader.readAsText(file);
}

function clearLedger() {
if (!confirm(“Clear the local ledger on this device? This cannot be undone.”)) return;
state.ledger = [];
saveLedger();
renderLedger();
}

// ============================
//   MODE TOGGLE
// ============================

function setMode(mode) {
state.mode = mode;
if (mode === “alive”) {
$(“modeNeutral”).classList.remove(“active”);
$(“modeAlive”).classList.add(“active”);
$(“modeDesc”).textContent = “Every pull can increment Attention & Contamination clocks.”;
document.body.classList.add(“mode-alive”);
} else {
$(“modeAlive”).classList.remove(“active”);
$(“modeNeutral”).classList.add(“active”);
$(“modeDesc”).textContent = “Danger only in Forbidden wing & Black Index depths.”;
document.body.classList.remove(“mode-alive”);
}
}

// ============================
//   WIRE UP EVENTS
// ============================

$(“risk”).addEventListener(“input”, () => {
const v = $(“risk”).value;
$(“riskVal”).textContent = v;
});

$(“btnPull”).addEventListener(“click”, generateTome);
$(“btnReroll”).addEventListener(“click”, generateTome);
$(“btnSave”).addEventListener(“click”, addToLedger);
$(“btnExport”).addEventListener(“click”, exportLedger);
$(“btnClear”).addEventListener(“click”, clearLedger);
$(“btnResetClocks”).addEventListener(“click”, resetClocks);
$(“importFile”).addEventListener(“change”, (e) => {
if (e.target.files && e.target.files[0]) importLedger(e.target.files[0]);
});
$(“search”).addEventListener(“input”, renderLedger);
$(“modeNeutral”).addEventListener(“click”, () => setMode(“neutral”));
$(“modeAlive”).addEventListener(“click”,   () => setMode(“alive”));

// ============================
//   INITIAL RENDER
// ============================
renderCurrentTome();
renderLedger();
renderClocks();
