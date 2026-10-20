(function(){
  "use strict";
  var mode = "data";
  var EX_DATA = "9.997 10.017 10.024 10.006 9.996 10.011 10.018 10.025 9.997 9.996\n10.020 10.018 10.030 10.024 10.011 10.009 10.043 10.009 10.003 9.998\n10.013 10.014 10.008 10.011 10.015 10.020 10.025 10.015 9.991 10.020";
  function setMode(m){
    mode = m;
    $("m-data").setAttribute("aria-pressed", m === "data"); $("m-stats").setAttribute("aria-pressed", m === "stats");
    $("box-data").hidden = m !== "data"; $("box-stats").hidden = m !== "stats";
    calc();
  }
  function draw(mu, s, lsl, usl, data){
    var cv = $("chart"), ctx = cv.getContext("2d"), W = cv.width, H = cv.height, pad = 30;
    ctx.clearRect(0,0,W,H);
    var lo = Math.min(mu - 4*s, lsl === null ? Infinity : lsl), hi = Math.max(mu + 4*s, usl === null ? -Infinity : usl);
    var span = hi - lo; lo -= span*0.06; hi += span*0.06;
    var X = function(v){ return pad + (v - lo) / (hi - lo) * (W - 2*pad); };
    var peak = 1 / (s * Math.sqrt(2*Math.PI));
    if (data && data.length > 1) {
      var bins = Math.max(6, Math.min(20, Math.round(Math.sqrt(data.length)) + 2)), bw = (hi - lo) / (bins * 2);
      var start = lo, counts = {}, maxc = 0;
      data.forEach(function(v){ var k = Math.floor((v - start) / bw); counts[k] = (counts[k] || 0) + 1; maxc = Math.max(maxc, counts[k]); });
      var scale = (H - 2*pad) / Math.max(maxc / (data.length * bw), peak);
      ctx.fillStyle = "rgba(47,125,225,.22)"; ctx.strokeStyle = "rgba(47,125,225,.6)";
      Object.keys(counts).forEach(function(k){ var x0 = X(start + k*bw), x1 = X(start + (+k+1)*bw), h = counts[k] / (data.length*bw) * scale;
        ctx.fillRect(x0, H - pad - h, x1 - x0 - 1, h); ctx.strokeRect(x0, H - pad - h, x1 - x0 - 1, h); });
      var yS = scale;
    } else { var yS = (H - 2*pad) / peak; }
    ctx.beginPath(); ctx.strokeStyle = "#0b1b38"; ctx.lineWidth = 2.5;
    for (var i = 0; i <= 240; i++) { var v = lo + (hi - lo) * i / 240, y = Math.exp(-0.5*Math.pow((v-mu)/s,2)) / (s*Math.sqrt(2*Math.PI)) * yS;
      if (i) ctx.lineTo(X(v), H - pad - y); else ctx.moveTo(X(v), H - pad - y); }
    ctx.stroke();
    ctx.strokeStyle = "#c9cfdb"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(pad, H - pad); ctx.lineTo(W - pad, H - pad); ctx.stroke();
    function vline(v, col, label, dash){ if (v === null) return; ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2; if (dash) ctx.setLineDash([6,4]);
      ctx.beginPath(); ctx.moveTo(X(v), 14); ctx.lineTo(X(v), H - pad); ctx.stroke(); ctx.setLineDash([]); ctx.font = "bold 12px ui-monospace,monospace"; ctx.textAlign = "center"; ctx.fillText(label, X(v), 11); ctx.restore(); }
    vline(lsl, "#b3261e", "LSL"); vline(usl, "#b3261e", "USL"); vline(mu, "#0b1b38", "MEAN", true);
  }
  function rate(cpk){
    if (cpk === null || !isFinite(cpk)) return ["", ""];
    if (cpk >= 1.67) return ["good", "Cpk \u2265 1.67: capable with margin. Typical target for safety or key characteristics."];
    if (cpk >= 1.33) return ["good", "Cpk \u2265 1.33: capable for most customer requirements."];
    if (cpk >= 1.0) return ["warn", "Cpk between 1.00 and 1.33: marginal. Expect some out-of-spec parts if anything shifts."];
    return ["bad", "Cpk below 1.00: not capable. The process spread or position is producing parts outside the limits."];
  }
  function calc(){
    var lsl = num("lsl"), usl = num("usl"); setText("err", "");
    if (lsl === null && usl === null) return setText("err", "Enter at least one spec limit (LSL or USL).");
    if (lsl !== null && usl !== null && lsl >= usl) return setText("err", "LSL must be lower than USL.");
    var r, data = null;
    if (mode === "data") {
      data = AK.parseData($("data").value);
      if (data.length < 2) return setText("err", "Paste at least 2 numeric measurements (25 or more is better).");
      r = AK.capabilityFromData(data, lsl, usl);
      if (!(r.sigmaWithin > 0)) return setText("err", "All values are identical, so sigma is zero.");
      setText("o-n", r.n); setText("o-mean", fmt(r.mean, 4)); setText("o-sw", fmt(r.sigmaWithin, 5)); setText("o-so", fmt(r.sigmaOverall, 5));
      setText("o-cp", fmt(r.cp, 2)); setText("o-cpk", fmt(r.cpk, 2)); setText("o-pp", fmt(r.pp, 2)); setText("o-ppk", fmt(r.ppk, 2));
      setText("o-cpu", fmt(r.cpu, 2)); setText("o-cpl", fmt(r.cpl, 2)); setText("o-ppm", fmt(r.ppmWithin, 0)); setText("o-ppmo", fmt(r.ppmOverall, 0));
      $("pp-cells").hidden = false;
      draw(r.mean, r.sigmaOverall, lsl, usl, data);
    } else {
      var m = num("mean"), s = num("sd");
      if (m === null || s === null || !(s > 0)) return setText("err", "Enter the mean and a standard deviation greater than zero.");
      r = AK.capability(m, s, lsl, usl);
      setText("o-n", "\u2014"); setText("o-mean", fmt(m, 4)); setText("o-sw", fmt(s, 5)); setText("o-so", "\u2014");
      setText("o-cp", fmt(r.cp, 2)); setText("o-cpk", fmt(r.cpk, 2)); setText("o-cpu", fmt(r.cpu, 2)); setText("o-cpl", fmt(r.cpl, 2)); setText("o-ppm", fmt(r.ppm, 0));
      $("pp-cells").hidden = true;
      draw(m, s, lsl, usl, null);
    }
    var v = rate(r.cpk); verdict("verdict", v[0], v[1] + (r.cp !== null && r.cp - r.cpk > 0.2 ? " Cp is noticeably higher than Cpk, so centering the process would gain the most." : ""));
  }
  $("m-data").addEventListener("click", function(){ setMode("data"); });
  $("m-stats").addEventListener("click", function(){ setMode("stats"); });
  $("calc").addEventListener("click", calc);
  ["lsl","usl","mean","sd","data"].forEach(function(id){ $(id).addEventListener("input", calc); });
  $("load-ex").addEventListener("click", function(){ $("lsl").value = "9.95"; $("usl").value = "10.05"; $("mean").value = "10.012"; $("sd").value = "0.012"; setMode("stats"); $("calc").scrollIntoView({block:"center"}); });
  $("data").value = EX_DATA; $("lsl").value = "9.95"; $("usl").value = "10.05";
  calc();
})();
