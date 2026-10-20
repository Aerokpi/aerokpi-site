(function(){
  "use strict";
  function shift(){ return $("shift").checked ? 1.5 : 0; }
  function calc(){
    setText("err", "");
    var u = num("units"), o = num("opps"), d = num("defects");
    if (!(u > 0) || !(o > 0) || d === null || d < 0) return setText("err", "Enter units, opportunities per unit (both above zero) and defects (zero or more).");
    if (d > u * o) return setText("err", "Defects can't exceed units \u00d7 opportunities.");
    var r = AK.dpmo(u, o, d, shift());
    setText("o-dpu", fmt(r.dpu, 4)); setText("o-dpo", fmt(r.dpo, 6)); setText("o-dpmo", fmt(r.dpmo, 0)); setText("o-yield", fmt(r.yieldPct, 3) + "%");
    setText("o-rty", fmt(r.rtyPoisson, 2) + "%"); setText("o-sigma", isFinite(r.sigma) ? fmt(r.sigma, 2) : (d === 0 ? "n/a" : "\u2014"));
    verdict("verdict", r.sigma >= 4.5 ? "good" : r.sigma >= 3 ? "warn" : "bad", d === 0 ? "No defects in this sample. Sigma can't be calculated from zero defects; collect more data before claiming a level." :
      "Sigma level " + fmt(r.sigma, 2) + (shift() ? " (short-term, with the usual 1.5 shift)" : " (long-term, no shift)") + ". That's " + fmt(r.dpmo, 0) + " defects per million opportunities.");
    table();
  }
  function small(d){ return d >= 100 ? fmt(d, 0) : d >= 1 ? fmt(d, 1) : Number(d.toPrecision(2)).toString(); }
  function conv(){ var s = num("sig"); setText("o-conv", s === null ? "\u2014" : small(AK.sigmaToDpmo(s, shift())) + " DPMO"); }
  function table(){ var h = "<tr><th>Sigma level</th><th>DPMO</th><th>Yield</th></tr>";
    [1,2,3,4,5,6].forEach(function(s){ var d = AK.sigmaToDpmo(s, shift()); h += "<tr><td class=num>" + s + "</td><td class=num>" + small(d) + "</td><td class=num>" + fmt(100 - d/1e4, 4) + "%</td></tr>"; });
    $("ref").innerHTML = h; }
  $("calc").addEventListener("click", calc);
  ["units","opps","defects","shift"].forEach(function(id){ $(id).addEventListener("input", function(){ calc(); conv(); }); });
  $("sig").addEventListener("input", conv);
  $("load-ex").addEventListener("click", function(){ $("units").value=500; $("opps").value=10; $("defects").value=31; $("shift").checked=true; calc(); conv(); $("calc").scrollIntoView({block:"center"}); });
  calc(); conv();
})();
