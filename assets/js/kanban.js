(function(){
  "use strict";
  var method = "pct";
  function setM(m){ method = m; $("s-pct").setAttribute("aria-pressed", m === "pct"); $("s-stat").setAttribute("aria-pressed", m === "stat");
    $("box-pct").hidden = m !== "pct"; $("box-stat").hidden = m !== "stat"; calc(); }
  function calc(){
    setText("err", "");
    var k = { dailyDemand:num("demand"), leadTimeDays:num("lead"), containerQty:num("pack") || 0 };
    if (!(k.dailyDemand > 0) || !(k.leadTimeDays > 0)) return setText("err", "Enter daily usage and replenishment lead time (both above zero).");
    if (method === "pct") k.safetyPct = num("safety") || 0;
    else { k.sdDaily = num("sdd"); var sl = Number($("svc").value); k.z = AK.ninv(sl);
      if (!(k.sdDaily >= 0)) return setText("err", "Enter the standard deviation of daily usage."); setText("o-z", "z = " + fmt(k.z, 3)); }
    var r = AK.kanban(k);
    setText("o-ltd", fmt(r.leadDemand, 1)); setText("o-ss", fmt(r.safety, 1)); setText("o-req", fmt(r.required, 1));
    setText("o-cards", k.containerQty > 0 ? r.cards : "\u2014"); setText("o-bin", fmt(r.binQty, 0)); setText("o-max", fmt(r.maxOnHand, 0)); setText("o-days", fmt(r.daysPerBin, 1));
    verdict("verdict", "good", k.containerQty > 0
      ? "Kanban loop: " + r.cards + " cards of " + fmt(k.containerQty,0) + " (exact " + fmt(r.cardsExact, 2) + ", always rounded up). Two-bin: fill each bin with " + fmt(r.binQty,0) + " (" + r.binsPerBin + " packs) and reorder when the first bin is empty."
      : "Two-bin: fill each bin with " + fmt(r.binQty,0) + " and reorder when the first bin is empty. Add a pack size to round to full packs and get a card count.");
  }
  $("s-pct").addEventListener("click", function(){ setM("pct"); }); $("s-stat").addEventListener("click", function(){ setM("stat"); });
  $("calc").addEventListener("click", calc);
  ["demand","lead","pack","safety","sdd","svc"].forEach(function(id){ $(id).addEventListener("input", calc); });
  $("load-ex").addEventListener("click", function(){ $("demand").value=120; $("lead").value=3; $("pack").value=50; $("safety").value=20; setM("pct"); $("calc").scrollIntoView({block:"center"}); });
  calc();
})();
