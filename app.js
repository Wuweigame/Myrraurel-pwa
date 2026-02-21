window.onerror = function(msg, url, line) { alert(“Error line “ + line + “: “ + msg); };

if (“serviceWorker” in navigator) {
navigator.serviceWorker.register(”./sw.js”).catch(function() {});
}

var STORE_KEY = “myrraurel_ledger_v1”;
var CLOCK_KEY = “myrraurel_clocks_v1”;

var currentTome = null;
var ledger = loadLedger();
var clocks = loadClocks();
var mode = “neutral”;

function loadLedger() {
try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; }
catch(e) { return []; }
}
function saveLedger() {
localStorage.setItem(STORE_KEY, JSON.stringify(ledger));
}
function loadClocks() {
try { return JSON.parse(localStorage.getItem(CLOCK_KEY)) || { attention: 0, contamination: 0 }; }
catch(e) { return { attention: 0, contamination: 0 }; }
}
function saveClocks() {
localStorage.setItem(CLOCK_KEY, JSON.stringify(clocks));
}

var humanNames = [“Alvor”,“Bercan”,“Cordun”,“Duneld”,“Elmar”,“Maren”,“Renys”,“Syltor”,“Torvald”,“Valken”,“Kyren”,“Vordan”];
var andorianNames = [“Vaelith”,“Isvoren”,“Thaleth”,“Aethwyn”,“Silvor”,“Kharen”,“Vorequan”,“Lythan”,“Eiravael”,“Zanareth”];
var uldarNames = [“Zaelgryss”,“Drahval”,“Valshyr”,“Shyrmyrr”,“Zahrgrynn”,“Grynnthaen”,“Thaenkaal”,“Kaallys”,“Lysnythyr”];

var eras = [“Pre-Fall Andorian”,“Early Dark Age”,“Late Andorian Decline”,“Post-Cataclysm Fragment”,“Disputed Interregnum”,“Third Age of the Weave”];
var physicalList = [“intact, suspiciously pristine”,“worm-eaten at the margins”,“scorched at the edges”,“palimpsest over older text”,“stitched from mismatched quires”,“annotated heavily in an unknown hand”,“missing its title page”,“sealed with wax already broken”];
var titleForms = [“On the Black Index of”,“The Codex of”,“Fragments from Elarien concerning”,“A Catalogue of Names relating to”,“Margins and Annotations on”,“The Chronicle of Silence and”,“A Refutation of the Known History of”,“Testimony from the Deep Vaults on”];
var titleSubjects = [“Root and Silence”,“Etherium Dissolution”,“Ash and Echo”,“The Unwritten Wing”,“Omissions and Gates”,“Forbidden Crossreferences”,“The Woven Silences”,“Named Wounds”];
var topicList = [“Eldraxis”,“Weave Theory”,“Heartwood”,“Life Stones”,“Vey’kar”,“Silver Flame”,“Kyros”];
var excerptOpeners = [“In the measureless interval where the Weave thins, there are signs that do not belong to any honest chronology.”,“What follows is presented as theory. That it has happened is not in dispute.”,“The study of this subject produces a specific kind of forgetting in those who pursue it too far.”,“Let the reader consider what was omitted from the adjacent shelves before proceeding.”,“It has been observed by no fewer than three archivists, all since retired, that this volume reshelves itself.”];
var excerptMiddles = [“The hand is practiced, the language formal, as though written for those who already know the price.”,“The ink is wrong — too dark, as though it remembers the hand that bled it.”,“A margin note in different ink reads: do not read this aloud near open water.”,“The style is measured, academic — used when the author wishes to seem unconcerned.”];
var excerptClosers = [“Should the reader find that certain passages shift between readings, set the tome down and walk to the exit without looking at the shelves.”,“What answers does so by means that do not survive description in daylight.”,“The omission from the official index is deliberate. This volume should not be on this shelf.”,“If you must proceed, do so with one truth kept unspoken, for the shelves listen better than they see.”];
var truthTypes = [“Key”,“Lie”,“Bait”,“Prophecy”,“Trap”,“Map-Fragment”,“Cipher”,“Confession”,“Warning”,“Decoy”];
var factions = [“Sylvanox cell”,“Vey’kar emissary”,“Silver Flame remnant”,“Andorian echo-warden”,“Eldraxian patron-signal”,“an unknown third party”,“the Archivist’s Council”];
var hooks = [“cross-references a missing volume hidden deeper in the”,“directly contradicts the canonical account held in the”,“names a location accessible only via the”,“contains a cipher whose key is held in the”];
var consequencesNeutral = [
{ text: “No immediate consequence. The tome is what it appears to be.”, a: 0, c: 0 },
{ text: “A useful truth is obtained, but cross-referencing reveals an inconsistency.”, a: 0, c: 0 },
{ text: “A false lead appears convincing unless the party consults a second source.”, a: 0, c: 0 },
{ text: “The catalog entry for this tome has been altered since last index.”, a: 1, c: 0 }
];
var consequencesAlive = [
{ text: “Attention +1. The stacks re-index around the reader. Something has noticed.”, a: 1, c: 0 },
{ text: “Contamination +1. Dreams recur with a new glyph.”, a: 0, c: 1 },
{ text: “A named NPC becomes aware of the party’s inquiry within the week.”, a: 1, c: 0 },
{ text: “Attention +1, Contamination +1. The tome reshelves itself before the session ends.”, a: 1, c: 1 },
{ text: “Contamination +1. The reader retains one phrase they cannot stop reciting.”, a: 0, c: 1 },
{ text: “Attention +2. A Myrr’aurel archivist arrives with polite, pointed questions.”, a: 2, c: 0 },
{ text: “No clock change. The library withholds consequence for now.”, a: 0, c: 0 },
{ text: “Contamination +2. A false memory is planted: the reader is certain they have read this before.”, a: 0, c: 2 }
];

function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function roll(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

function shelfCode(wing, depth) {
var w = wing.slice(0,2).toUpperCase();
var d = depth === “Hall” ? “H” : depth === “Vault” ? “V” : “B”;
return w + “-” + d + “-” + roll(1,9) + roll(0,9) + “.” + roll(1,7) + “.” + roll(1,12);
}

function makeTitle(topic) {
var base = rnd(titleForms) + “ “ + rnd(titleSubjects);
if (topic !== “Any”) { return base + “ — “ + topic; }
return base;
}

function makeExcerpt() {
return rnd(excerptOpeners) + “ “ + rnd(excerptMiddles) + “ “ + rnd(excerptClosers);
}

function esc(s) {
return String(s).replace(/&/g,”&”).replace(/</g,”<”).replace(/>/g,”>”).replace(/”/g,”"”).replace(/’/g,”'”);
}

function generateTome() {
var wing  = document.getElementById(“wing”).value;
var depth = document.getElementById(“depth”).value;
var topic = document.getElementById(“topic”).value;
var risk  = Number(document.getElementById(“risk”).value);

var namePool = (wing === “Forbidden”) ? uldarNames : (wing === “Planar”) ? andorianNames : humanNames;
var author = rnd(namePool);
var era = rnd(eras);
var phys = rnd(physicalList);
var tag = (topic === “Any”) ? rnd(topicList) : topic;

var cpool = (mode === “alive”) ? consequencesAlive : consequencesNeutral;
var consequence = rnd(cpool);

var dm = {
truthType: rnd(truthTypes),
faction: rnd(factions),
hook: “This tome “ + rnd(hooks) + “ “ + depth + “ of the “ + wing + “ Wing.”,
note: (risk >= 3) ? “Contradicts an established claim — may be censorship or a lure.” : “Consistent with known fragments, but notably incomplete.”,
consequence: consequence
};

currentTome = {
id: uid(),
createdAt: new Date().toISOString(),
wing: wing, depth: depth, topic: topic, risk: risk,
title: makeTitle(topic),
author: author, era: era, physical: phys,
shelf: shelfCode(wing, depth),
excerpt: makeExcerpt(),
dm: dm,
tag: tag
};

renderTome();
document.getElementById(“btnSave”).disabled = false;
document.getElementById(“btnReroll”).disabled = false;

if (consequence.a || consequence.c) {
clocks.attention = Math.min(6, clocks.attention + consequence.a);
clocks.contamination = Math.min(6, clocks.contamination + consequence.c);
saveClocks();
renderClocks();
}
}

function renderTome() {
var t = currentTome;
if (!t) {
document.getElementById(“tomeOutput”).innerHTML = ‘<div class="empty-state"><div class="empty-glyph">⬡</div><p>Retrieve a tome to reveal its catalog card, excerpt, and DM payload.</p><p class="hint">The shelves are said to listen better than they see.</p></div>’;
return;
}
var riskClass  = (t.risk >= 4) ? “badge-risk-high” : “”;
var depthClass = (t.depth === “Black Index”) ? “badge-depth-black” : “”;
document.getElementById(“tomeOutput”).innerHTML =
‘<div class="card-enter">’ +
‘<div class="card-title">’ + esc(t.title) + ‘</div>’ +
‘<div class="badges">’ +
‘<span class="badge">’ + esc(t.wing) + ‘</span>’ +
‘<span class="badge ' + depthClass + '">’ + esc(t.depth) + ‘</span>’ +
’<span class="badge ' + riskClass + '">Risk ’ + t.risk + ‘</span>’ +
‘<span class="badge">’ + esc(t.shelf) + ‘</span>’ +
‘</div>’ +
‘<div class="section-label">Catalog Card</div>’ +
‘<div class="card-meta">’ +
’<p><b>Author:</b> ’ + esc(t.author) + ’  ·  <b>Era:</b> ’ + esc(t.era) + ‘</p>’ +
’<p><b>Condition:</b> ’ + esc(t.physical) + ‘</p>’ +
’<p><b>Tags:</b> ’ + esc(t.tag) + ‘</p>’ +
‘</div>’ +
‘<div class="section-label">Excerpt</div>’ +
‘<div class="excerpt">’ + esc(t.excerpt) + ‘</div>’ +
‘<div class="section-label">DM Payload</div>’ +
‘<details class="dm-block">’ +
‘<summary>Reveal DM Payload</summary>’ +
‘<div class="dm-inner">’ +
‘<div class="dm-row"><span class="dm-key">True Nature</span><span class="dm-val">’ + esc(t.dm.truthType) + ‘</span></div>’ +
‘<div class="dm-row"><span class="dm-key">Faction</span><span class="dm-val">’ + esc(t.dm.faction) + ‘</span></div>’ +
‘<div class="dm-row"><span class="dm-key">Hook</span><span class="dm-val">’ + esc(t.dm.hook) + ‘</span></div>’ +
‘<div class="dm-row"><span class="dm-key">Note</span><span class="dm-val">’ + esc(t.dm.note) + ‘</span></div>’ +
‘<div class="dm-row"><span class="dm-key">Consequence</span><span class="dm-val">’ + esc(t.dm.consequence.text) + ‘</span></div>’ +
‘</div>’ +
‘</details>’ +
‘</div>’;
}

function renderLedger() {
var q = (document.getElementById(“search”).value || “”).toLowerCase();
var list = ledger.filter(function(t) {
var hay = (t.title + “ “ + t.author + “ “ + t.wing + “ “ + t.depth + “ “ + t.tag).toLowerCase();
return hay.indexOf(q) !== -1;
});
var el = document.getElementById(“ledger”);
if (!list.length) {
el.innerHTML = ‘<div class="ledger-empty">’ + (ledger.length === 0 ? “No tomes saved yet.” : “No results.”) + ‘</div>’;
return;
}
el.innerHTML = list.map(function(t) {
return ‘<div class="ledger-item">’ +
‘<div class="ledger-title">’ + esc(t.title) + ‘</div>’ +
‘<div class="ledger-meta">’ + esc(t.wing) + ’ · ’ + esc(t.depth) + ’ · Risk ’ + t.risk + ’ · ’ + esc(t.shelf) + ‘</div>’ +
‘<div class="ledger-meta">’ + esc(t.author) + ’ · ’ + esc(t.era) + ‘</div>’ +
‘</div>’;
}).join(””);
}

function renderClocks() {
renderPips(“attentionPips”, clocks.attention, “attention”);
renderPips(“contaminationPips”, clocks.contamination, “contamination”);
}

function renderPips(elId, value, type) {
var el = document.getElementById(elId);
if (!el) { return; }
el.innerHTML = “”;
for (var i = 0; i < 6; i++) {
var pip = document.createElement(“div”);
pip.className = (i < value) ? “pip filled-” + type : “pip”;
el.appendChild(pip);
}
}

function addToLedger() {
if (!currentTome) { return; }
ledger.unshift(currentTome);
saveLedger();
renderLedger();
document.getElementById(“btnSave”).disabled = true;
document.getElementById(“btnSave”).textContent = “Saved!”;
setTimeout(function() {
document.getElementById(“btnSave”).textContent = “Save to Ledger”;
document.getElementById(“btnSave”).disabled = false;
}, 1500);
}

function exportLedger() {
var blob = new Blob([JSON.stringify(ledger, null, 2)], { type: “application/json” });
var url = URL.createObjectURL(blob);
var a = document.createElement(“a”);
a.href = url;
a.download = “myrraurel_ledger.json”;
a.click();
URL.revokeObjectURL(url);
}

function importLedger(file) {
var reader = new FileReader();
reader.onload = function() {
try {
var data = JSON.parse(reader.result);
if (!Array.isArray(data)) { throw new Error(“Invalid file.”); }
ledger = data;
saveLedger();
renderLedger();
} catch(e) { alert(“Import failed: “ + e.message); }
};
reader.readAsText(file);
}

function setMode(m) {
mode = m;
if (m === “alive”) {
document.getElementById(“modeNeutral”).classList.remove(“active”);
document.getElementById(“modeAlive”).classList.add(“active”);
document.getElementById(“modeDesc”).textContent = “Every pull can increment Attention & Contamination clocks.”;
document.body.classList.add(“mode-alive”);
} else {
document.getElementById(“modeAlive”).classList.remove(“active”);
document.getElementById(“modeNeutral”).classList.add(“active”);
document.getElementById(“modeDesc”).textContent = “Danger only in Forbidden wing & Black Index depths.”;
document.body.classList.remove(“mode-alive”);
}
}

document.getElementById(“risk”).addEventListener(“input”, function() {
document.getElementById(“riskVal”).textContent = this.value;
});
document.getElementById(“btnPull”).addEventListener(“click”, generateTome);
document.getElementById(“btnReroll”).addEventListener(“click”, generateTome);
document.getElementById(“btnSave”).addEventListener(“click”, addToLedger);
document.getElementById(“btnExport”).addEventListener(“click”, exportLedger);
document.getElementById(“btnClear”).addEventListener(“click”, function() {
if (!confirm(“Clear ledger?”)) { return; }
ledger = [];
saveLedger();
renderLedger();
});
document.getElementById(“btnResetClocks”).addEventListener(“click”, function() {
if (!confirm(“Reset clocks?”)) { return; }
clocks = { attention: 0, contamination: 0 };
saveClocks();
renderClocks();
});
document.getElementById(“importFile”).addEventListener(“change”, function(e) {
if (e.target.files && e.target.files[0]) { importLedger(e.target.files[0]); }
});
document.getElementById(“search”).addEventListener(“input”, renderLedger);
document.getElementById(“modeNeutral”).addEventListener(“click”, function() { setMode(“neutral”); });
document.getElementById(“modeAlive”).addEventListener(“click”, function() { setMode(“alive”); });

renderTome();
renderLedger();
renderClocks();
