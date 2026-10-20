/* AeroKPI free calculators: pure math core. No network calls, no tracking. */
(function (root) {
  "use strict";
  // Complementary error function, Numerical Recipes erfcc (fractional error < 1.2e-7 everywhere,
  // so tail probabilities such as 3.4 DPMO stay accurate).
  function erfc(x) {
    var z = Math.abs(x), t = 1 / (1 + 0.5 * z);
    var r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 +
      t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 +
      t * (-0.82215223 + t * 0.17087277)))))))));
    return x >= 0 ? r : 2 - r;
  }
  function ncdf(z) { return 0.5 * erfc(-z / Math.SQRT2); }      // P(Z <= z)
  function nsf(z) { return 0.5 * erfc(z / Math.SQRT2); }        // P(Z > z), accurate in the tail
  // Inverse standard normal, Acklam's algorithm + one Halley refinement step.
  function ninv(p) {
    if (!(p > 0 && p < 1)) return p === 0 ? -Infinity : p === 1 ? Infinity : NaN;
    var a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
    var b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
    var c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
    var d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
    var pl = 0.02425, q, r, x;
    if (p < pl) { q = Math.sqrt(-2 * Math.log(p)); x = (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1); }
    else if (p <= 1 - pl) { q = p - 0.5; r = q*q; x = (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q / (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1); }
    else { q = Math.sqrt(-2 * Math.log(1 - p)); x = -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1); }
    var e = ncdf(x) - p, u = e * Math.sqrt(2 * Math.PI) * Math.exp(x * x / 2);
    return x - u / (1 + x * u / 2);
  }

  /* ---------- Cp / Cpk ---------- */
  function parseData(text) {
    return String(text).split(/[\s,;\t]+/).filter(function (s) { return s !== ""; }).map(Number).filter(function (v) { return isFinite(v); });
  }
  function mean(a) { return a.reduce(function (s, x) { return s + x; }, 0) / a.length; }
  function sdOverall(a) { var m = mean(a); return Math.sqrt(a.reduce(function (s, x) { return s + (x - m) * (x - m); }, 0) / (a.length - 1)); }
  // Within (short-term) sigma for individuals: average moving range / d2 (d2 = 1.128 for n = 2).
  function sdWithinMR(a) { var t = 0; for (var i = 1; i < a.length; i++) t += Math.abs(a[i] - a[i - 1]); return (t / (a.length - 1)) / 1.128; }
  function capability(m, s, lsl, usl) {
    var hasL = lsl !== null && lsl !== undefined && isFinite(lsl), hasU = usl !== null && usl !== undefined && isFinite(usl);
    var r = { mean: m, sigma: s };
    r.cpu = hasU ? (usl - m) / (3 * s) : null;
    r.cpl = hasL ? (m - lsl) / (3 * s) : null;
    r.cp = hasL && hasU ? (usl - lsl) / (6 * s) : null;
    r.cpk = hasL && hasU ? Math.min(r.cpu, r.cpl) : hasU ? r.cpu : r.cpl;
    r.ppmAbove = hasU ? nsf((usl - m) / s) * 1e6 : 0;
    r.ppmBelow = hasL ? ncdf((lsl - m) / s) * 1e6 : 0;
    r.ppm = r.ppmAbove + r.ppmBelow;
    return r;
  }
  function capabilityFromData(arr, lsl, usl) {
    var m = mean(arr), sw = sdWithinMR(arr), so = sdOverall(arr);
    var w = capability(m, sw, lsl, usl), o = capability(m, so, lsl, usl);
    return { n: arr.length, mean: m, sigmaWithin: sw, sigmaOverall: so, cp: w.cp, cpk: w.cpk, cpu: w.cpu, cpl: w.cpl,
      pp: o.cp, ppk: o.cpk, ppu: o.cpu, ppl: o.cpl, ppmWithin: w.ppm, ppmOverall: o.ppm };
  }

  /* ---------- OEE ---------- */
  // Times in minutes, ideal cycle time in seconds per part.
  function oee(o) {
    var planned = o.shift - o.breaks;
    var run = planned - o.downtime;
    var A = run / planned;
    var P = (o.idealCycleSec * o.total) / (run * 60);
    var Q = o.good / o.total;
    var fullyProductive = o.good * o.idealCycleSec / 60;               // minutes
    var lossA = planned - run;                                           // minutes
    var lossP = run - o.total * o.idealCycleSec / 60;                    // minutes
    var lossQ = (o.total - o.good) * o.idealCycleSec / 60;               // minutes
    return { planned: planned, run: run, availability: A, performance: P, quality: Q, oee: A * P * Q,
      fullyProductive: fullyProductive, lossAvailability: lossA, lossPerformance: lossP, lossQuality: lossQ,
      idealParts: planned * 60 / o.idealCycleSec };
  }

  /* ---------- RPN and AIAG-VDA Action Priority (PFMEA table, 1st edition 2019) ---------- */
  // Rows: occurrence bands [8-10, 6-7, 4-5, 2-3, 1]. Columns: detection bands [7-10, 5-6, 2-4, 1].
  var AP = {
    s910: ["HHHH", "HHHH", "HHHM", "HMLL", "LLLL"],
    s78:  ["HHHH", "HHHM", "HMMM", "MMLL", "LLLL"],
    s46:  ["HHMM", "MMML", "MLLL", "LLLL", "LLLL"],
    s23:  ["MMLL", "LLLL", "LLLL", "LLLL", "LLLL"],
    s1:   ["LLLL", "LLLL", "LLLL", "LLLL", "LLLL"]
  };
  function validRating(x) { return Number.isInteger(x) && x >= 1 && x <= 10; }
  function actionPriority(S, O, D) {
    if (!validRating(S) || !validRating(O) || !validRating(D)) return null;
    var sk = S >= 9 ? "s910" : S >= 7 ? "s78" : S >= 4 ? "s46" : S >= 2 ? "s23" : "s1";
    var oi = O >= 8 ? 0 : O >= 6 ? 1 : O >= 4 ? 2 : O >= 2 ? 3 : 4;
    var di = D >= 7 ? 0 : D >= 5 ? 1 : D >= 2 ? 2 : 3;
    return AP[sk][oi][di];
  }
  function rpn(S, O, D) { return S * O * D; }

  /* ---------- Kanban / two-bin ---------- */
  // dailyDemand units/day, leadTimeDays, safetyPct (e.g. 20 for 20%), containerQty units per card/bin.
  // Optional statistical safety stock: z * sdDaily * sqrt(leadTime) replaces the percentage when sdDaily is given.
  function kanban(k) {
    var leadDemand = k.dailyDemand * k.leadTimeDays;
    var safety = (k.sdDaily && k.z) ? k.z * k.sdDaily * Math.sqrt(k.leadTimeDays) : leadDemand * (k.safetyPct || 0) / 100;
    var required = leadDemand + safety;
    var r = { leadDemand: leadDemand, safety: safety, required: required };
    if (k.containerQty > 0) {
      r.cardsExact = required / k.containerQty;
      r.cards = Math.ceil(r.cardsExact - 1e-9);
      r.binsPerBin = Math.ceil(required / k.containerQty - 1e-9);           // packs per bin in two-bin mode
      r.binQty = r.binsPerBin * k.containerQty;
    } else {
      r.binQty = Math.ceil(required - 1e-9);
    }
    r.maxOnHand = 2 * r.binQty;                    // two-bin: both bins full
    r.daysPerBin = r.binQty / k.dailyDemand;
    return r;
  }

  /* ---------- DPMO / sigma level ---------- */
  function dpmo(units, opps, defects, shift) {
    if (shift === undefined) shift = 1.5;
    var tot = units * opps, dpo = defects / tot;
    var r = { dpu: defects / units, dpo: dpo, dpmo: dpo * 1e6, yieldPct: (1 - dpo) * 100, rtyPoisson: Math.exp(-defects / units) * 100 };
    r.sigmaLT = dpo > 0 && dpo < 1 ? ninv(1 - dpo) : (dpo === 0 ? Infinity : -Infinity);
    r.sigma = r.sigmaLT + shift;
    return r;
  }
  function sigmaToDpmo(sigma, shift) { if (shift === undefined) shift = 1.5; return nsf(sigma - shift) * 1e6; }
  function dpmoToSigma(d, shift) { if (shift === undefined) shift = 1.5; return ninv(1 - d / 1e6) + shift; }

  var api = { erfc: erfc, ncdf: ncdf, nsf: nsf, ninv: ninv, parseData: parseData, mean: mean, sdOverall: sdOverall, sdWithinMR: sdWithinMR,
    capability: capability, capabilityFromData: capabilityFromData, oee: oee, actionPriority: actionPriority, rpn: rpn,
    kanban: kanban, dpmo: dpmo, sigmaToDpmo: sigmaToDpmo, dpmoToSigma: dpmoToSigma };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.AK = api;
})(this);
