(function(){
  "use strict";
  var EX = [["Missing weld on bracket", 9, 4, 2], ["Cosmetic scratch on cover", 3, 8, 3], ["Fastener under-torqued", 7, 3, 5]];
  var tb = $("rows"), focusRow = 0;
  function opts(v){ var s = ""; for (var i = 1; i <= 10; i++) s += '<option' + (i === v ? " selected" : "") + ">" + i + "</option>"; return s; }
  function addRow(d){ d = d || ["", 5, 5, 5]; var tr = document.createElement("tr");
    tr.innerHTML = '<td><input aria-label="Failure mode" value="' + String(d[0]).replace(/"/g,"&quot;") + '" placeholder="Failure mode"></td>' +
      '<td><select aria-label="Severity">' + opts(d[1]) + '</select></td><td><select aria-label="Occurrence">' + opts(d[2]) + '</select></td><td><select aria-label="Detection">' + opts(d[3]) + '</select></td>' +
      '<td class="num rpn"></td><td class="apc"></td><td><button type="button" class="ghost del" aria-label="Remove row">\u00d7</button></td>';
    tb.appendChild(tr); calc(); }
  function vals(tr){ var s = tr.querySelectorAll("select"); return [+s[0].value, +s[1].value, +s[2].value]; }
  function calc(){
    var rows = Array.prototype.slice.call(tb.querySelectorAll("tr")), list = [];
    rows.forEach(function(tr, i){ var v = vals(tr), ap = AK.actionPriority(v[0], v[1], v[2]), r = AK.rpn(v[0], v[1], v[2]);
      tr.querySelector(".rpn").textContent = r; tr.querySelector(".apc").innerHTML = '<span class="ap ' + ap + '">' + ap + '</span>';
      list.push({ name: tr.querySelector("input").value || ("Row " + (i+1)), S:v[0], O:v[1], D:v[2], rpn:r, ap:ap }); });
    var rank = { H:0, M:1, L:2 };
    var byAP = list.slice().sort(function(a,b){ return rank[a.ap]-rank[b.ap] || b.S-a.S || b.O-a.O || a.D-b.D; });
    var byRPN = list.slice().sort(function(a,b){ return b.rpn-a.rpn; });
    $("order").innerHTML = "<li>" + byAP.map(function(x){ return '<span class="ap ' + x.ap + '">' + x.ap + "</span> " + esc(x.name) + " (S" + x.S + " O" + x.O + " D" + x.D + ", RPN " + x.rpn + ")"; }).join("</li><li>") + "</li>";
    var differs = byAP.length > 1 && byAP.some(function(x, i){ return x !== byRPN[i]; });
    verdict("verdict", differs ? "warn" : "good", differs ? "Ranking by RPN gives a different order than Action Priority here. AP puts severity first, so check the High items before anything else." : "RPN and Action Priority agree on the order for these rows.");
    matrix(rows[focusRow] ? vals(rows[focusRow]) : [5,5,5]);
  }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
  function matrix(v){
    var S = v[0], band = S >= 9 ? "9\u201310" : S >= 7 ? "7\u20138" : S >= 4 ? "4\u20136" : S >= 2 ? "2\u20133" : "1";
    var oB = [["8\u201310",9],["6\u20137",6],["4\u20135",4],["2\u20133",2],["1",1]], dB = [["7\u201310",7],["5\u20136",5],["2\u20134",2],["1",1]];
    var oi = v[1] >= 8 ? 0 : v[1] >= 6 ? 1 : v[1] >= 4 ? 2 : v[1] >= 2 ? 3 : 4, di = v[2] >= 7 ? 0 : v[2] >= 5 ? 1 : v[2] >= 2 ? 2 : 3;
    var h = "<caption class=\"hint\">AP table for severity " + band + " (selected row). Highlighted cell is your rating.</caption><tr><th>Occurrence \u2193 / Detection \u2192</th>" + dB.map(function(d){ return "<th>" + d[0] + "</th>"; }).join("") + "</tr>";
    oB.forEach(function(o, r){ h += "<tr><th>" + o[0] + "</th>" + dB.map(function(d, c){ var ap = AK.actionPriority(S, o[1], d[1]); return '<td class="' + ap + (r === oi && c === di ? " on" : "") + '">' + ap + "</td>"; }).join("") + "</tr>"; });
    $("matrix").innerHTML = h;
  }
  tb.addEventListener("change", calc); tb.addEventListener("input", calc);
  tb.addEventListener("focusin", function(e){ var tr = e.target.closest("tr"); focusRow = Array.prototype.indexOf.call(tb.children, tr); calc(); });
  tb.addEventListener("click", function(e){ if (e.target.classList.contains("del")) { e.target.closest("tr").remove(); focusRow = 0; calc(); } });
  $("add").addEventListener("click", function(){ addRow(); });
  $("load-ex").addEventListener("click", function(){ tb.innerHTML = ""; EX.forEach(addRow); focusRow = 0; calc(); $("rows").scrollIntoView({block:"center"}); });
  EX.forEach(addRow);
})();
