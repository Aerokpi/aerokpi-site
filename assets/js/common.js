/* Shared UI helpers. No cookies, no storage, no network. */
(function(){
  "use strict";
  window.$ = function(id){ return document.getElementById(id); };
  window.num = function(id){ var v = $(id).value.trim(); return v === "" ? null : Number(v); };
  window.fmt = function(x, d){ if (x === null || x === undefined || !isFinite(x)) return "\u2014"; return Number(x).toLocaleString("en-US", {minimumFractionDigits:d, maximumFractionDigits:d}); };
  window.pct = function(x, d){ return x === null || !isFinite(x) ? "\u2014" : fmt(x * 100, d === undefined ? 1 : d) + "%"; };
  window.setText = function(id, t){ var el = $(id); if (el) el.textContent = t; };
  window.verdict = function(id, cls, text){ var el = $(id); el.className = "verdict " + (cls || ""); el.textContent = text; };
  // Signup placeholder: NOT connected. Never sends or stores anything.
  document.addEventListener("submit", function(e){
    var f = e.target;
    if (f && f.hasAttribute("data-placeholder")) {
      e.preventDefault();
      var m = f.parentNode.querySelector(".signup-msg");
      if (m) m.textContent = "Signup isn't connected yet, so nothing was sent or saved.";
    }
  });
})();
