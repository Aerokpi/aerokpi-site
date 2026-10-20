(function(){
  "use strict";
  function bar(label, mins, max, cls){ var w = max > 0 ? Math.max(0, mins) / max * 100 : 0;
    return '<div class="bar"><span>' + label + '</span><i class="' + (cls||"") + '" data-w="' + w.toFixed(2) + '"></i><em>' + fmt(mins/60, 2) + ' h</em></div>'; }
  function calc(){
    setText("err", "");
    var o = { shift:num("shift"), breaks:num("breaks") || 0, downtime:num("down") || 0, idealCycleSec:num("cycle"), total:num("total"), good:num("good") };
    if (!(o.shift > 0) || !(o.idealCycleSec > 0) || !(o.total > 0) || o.good === null) return setText("err", "Fill in shift length, ideal cycle time, total count and good count.");
    if (o.breaks + o.downtime >= o.shift) return setText("err", "Planned stops plus downtime must be shorter than the shift.");
    if (o.good > o.total) return setText("err", "Good count can't be higher than total count.");
    var r = AK.oee(o);
    setText("o-a", pct(r.availability)); setText("o-p", pct(r.performance)); setText("o-q", pct(r.quality)); setText("o-oee", pct(r.oee));
    setText("o-planned", fmt(r.planned, 0) + " min"); setText("o-run", fmt(r.run, 0) + " min"); setText("o-fpt", fmt(r.fullyProductive, 1) + " min"); setText("o-ideal", fmt(r.idealParts, 0));
    var max = r.planned;
    var el = $("bars");
    el.innerHTML = bar("Planned time", r.planned, max, "l") + bar("Availability loss", r.lossAvailability, max) + bar("Speed loss", r.lossPerformance, max) + bar("Quality loss", r.lossQuality, max) + bar("Fully productive", r.fullyProductive, max, "l");
    Array.prototype.forEach.call(el.querySelectorAll("i"), function(i){ i.style.width = i.getAttribute("data-w") + "%"; });
    var big = [["availability (downtime)", r.lossAvailability], ["performance (slow cycles, small stops)", r.lossPerformance], ["quality (scrap and rework)", r.lossQuality]].sort(function(a,b){ return b[1]-a[1]; })[0];
    if (r.performance > 1.0001) verdict("verdict", "bad", "Performance is above 100%, which usually means the ideal cycle time is set too slow. Use the fastest proven cycle time.");
    else verdict("verdict", r.oee >= 0.85 ? "good" : r.oee >= 0.6 ? "warn" : "bad", "OEE " + pct(r.oee) + ". Your biggest loss is " + big[0] + ": " + fmt(big[1]/60, 2) + " hours this shift.");
  }
  $("calc").addEventListener("click", calc);
  ["shift","breaks","down","cycle","total","good"].forEach(function(id){ $(id).addEventListener("input", calc); });
  $("load-ex").addEventListener("click", function(){ $("shift").value=480; $("breaks").value=60; $("down").value=47; $("cycle").value=1.0; $("total").value=19271; $("good").value=18848; calc(); $("calc").scrollIntoView({block:"center"}); });
  calc();
})();
