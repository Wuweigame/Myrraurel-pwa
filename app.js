document.getElementById("btnPull").addEventListener("click", function() {
  var wing = document.getElementById("wing").value;
  var depth = document.getElementById("depth").value;
  var topic = document.getElementById("topic").value;
  var risk = document.getElementById("risk").value;
  
  var titles = ["The Codex of Ash","Fragments from Elarien","On the Black Index","A Catalogue of Named Wounds","Testimony from the Deep Vaults"];
  var authors = ["Alvor","Vaelith","Zaelgryss","Bercan","Thaleth"];
  var excerpts = ["In the measureless interval where the Weave thins, there are signs that do not belong to any honest chronology. The hand is practiced, the language formal. If you must proceed, do so with one truth kept unspoken.","What follows is presented as theory. That it has happened is not in dispute. The omission from the official index is deliberate. This volume should not be on this shelf.","The study of this subject produces a specific kind of forgetting. The ink is wrong — too dark. Should the reader find passages shift between readings, set the tome down and walk to the exit."];
  
  function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  
  var html = "<div>";
  html += "<div class='card-title'>" + rnd(titles) + " — " + topic + "</div>";
  html += "<div class='badges'><span class='badge'>" + wing + "</span><span class='badge'>" + depth + "</span><span class='badge'>Risk " + risk + "</span></div>";
  html += "<div class='section-label'>Catalog Card</div>";
  html += "<p>Author: " + rnd(authors) + "</p>";
  html += "<div class='section-label'>Excerpt</div>";
  html += "<div class='excerpt'>" + rnd(excerpts) + "</div>";
  html += "</div>";
  
  document.getElementById("tomeOutput").innerHTML = html;
});
