/* 仪表盘:①链速+流量 ②链系简图 ③出水节奏 ④刮板断面 */
(function (MECH) {
  var el = {}, D = MECH.DIM;
  var soft = "rgba(233,238,242,0.5)";

  MECH.DASH = { panels: [
    { title: "FLOW · 链速与流量", meta: "v=ωR · Q=vAφ", dot: "teal",
      html: '<div class="big" id="d-q">0.00</div><div class="k">L/s · 公式值</div>' +
            '<div class="bar"><i id="d-bar"></i></div>' +
            '<div class="rowline"><span>链速</span><b id="d-v">0.00 m/s</b></div>' +
            '<div class="chip" id="d-chip">—</div>',
      init: initFlow, draw: drawFlow },
    { title: "CHAIN MAP · 链系简图", meta: "闭合环实时", dot: "blue", canvasH: 96, draw: drawChain },
    { title: "POUR · 出水节奏", meta: "v/p 次/s", dot: "yellow", canvasH: 96, draw: drawPour },
    { title: "SECTION · 断面", meta: "A = p·h·W", dot: "green", canvasH: 96, draw: drawSection }
  ] };

  function initFlow(sec) {
    el.q = sec.querySelector("#d-q");
    el.bar = sec.querySelector("#d-bar");
    el.v = sec.querySelector("#d-v");
    el.chip = sec.querySelector("#d-chip");
  }

  function drawFlow(st, ph, pt, ctx, w, h) {
    var v = D.vOf(st.omega), q = D.Qof(st.omega) * 1000;
    if (el.q) el.q.textContent = q.toFixed(2);
    if (el.bar) el.bar.style.width = Math.min(100, q / 12 * 100) + "%";
    if (el.v) el.v.textContent = v.toFixed(2) + " m/s";
    if (el.chip) {
      if (st.omega > 0.25 && st.qMeas > 0) {
        var qm = st.qMeas * 1000;
        var dev = Math.abs(qm - q) / Math.max(q, 1e-9);
        var ok = dev < 0.1;
        el.chip.textContent = "实测 " + qm.toFixed(2) + " L/s · " + (ok ? "合公式 ✓" : "偏差 " + (dev * 100).toFixed(0) + "%");
        el.chip.className = "chip" + (ok ? " on" : " warn");
      } else {
        el.chip.textContent = st.omega > 0.1 ? "计量中…" : "停链";
        el.chip.className = "chip";
      }
    }
  }

  /* ② 链系简图:斜槽 + 双轮 + 链点(36 板实时位置) */
  function drawChain(st, ph, pt, ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    var S = (w - 28) / 7.2, ox = 16, oy = h - 10;
    var X = function (mx) { return ox + (mx + 3.4) * S; }, Y = function (my) { return oy - my * S; };
    /* 槽线 */
    ctx.strokeStyle = "rgba(233,238,242,0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(X(D.Pa.x), Y(D.Pa.y));
    ctx.lineTo(X(D.Pb.x), Y(D.Pb.y));
    ctx.stroke();
    /* 双轮 */
    [[D.Pa.x, D.Pa.y], [D.Pb.x, D.Pb.y]].forEach(function (c) {
      ctx.strokeStyle = "#B08D57";
      ctx.beginPath(); ctx.arc(X(c[0]), Y(c[1]), D.R * S, 0, Math.PI * 2); ctx.stroke();
    });
    /* 36 板点(旋转点) */
    for (var i = 0; i < D.N; i++) {
      var wp = MECH.KS.loopPose(i * D.p + st.sOff);
      var up = wp.tx > 0 && wp.z < 0.1;   // 上行段高亮
      ctx.fillStyle = up ? "#7FD8D8" : "rgba(233,238,242,0.45)";
      ctx.beginPath();
      ctx.arc(X(wp.x), Y(wp.y), up ? 3.2 : 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = soft;
    ctx.font = "600 7.5px Menlo, monospace";
    ctx.textAlign = "left";
    ctx.fillText("上段载水", 4, 12);
    ctx.fillStyle = "#7FD8D8";
    ctx.beginPath(); ctx.arc(52, 9, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = soft;
    ctx.fillText("回程空链", 62, 12);
  }

  /* ③ 出水节奏 */
  var pourMarks = [];
  function drawPour(st, ph, pt, ctx, w, h) {
    var rate = st.omega > 0.1 ? D.vOf(st.omega) / D.p : 0;
    var cnt = Math.floor(rate * 1 / Math.max(1 / 60, 0));   // 本帧期望
    if (st._pourAcc === undefined) st._pourAcc = 0;
    st._pourAcc += rate * (1 / 30);
    if (st._pourAcc >= 1) { st._pourAcc -= 1; pourMarks.push(st.time); if (pourMarks.length > 80) pourMarks.shift(); }
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#E9EEF2";
    ctx.font = "800 15px Menlo, monospace";
    ctx.textAlign = "left";
    ctx.fillText(rate.toFixed(2), 4, 20);
    ctx.fillStyle = soft;
    ctx.font = "600 8px Menlo, monospace";
    ctx.fillText("次/s · 板距 0.402", 48, 20);
    ctx.strokeStyle = "rgba(233,238,242,0.16)";
    ctx.beginPath(); ctx.moveTo(0, h - 14); ctx.lineTo(w, h - 14); ctx.stroke();
    var span = 10;
    for (var i = 0; i < pourMarks.length; i++) {
      var dt = st.time - pourMarks[i].t === undefined ? 0 : st.time - pourMarks[i].t;
      if (dt > span) continue;
      ctx.fillStyle = "#E9C93C";
      ctx.beginPath(); ctx.arc(w - dt / span * w, h - 20, 2.6, 0, Math.PI * 2); ctx.fill();
    }
  }

  /* ④ 断面:槽宽 × 刮板高 × 板距 → A,配水量色块 */
  function drawSection(st, ph, pt, ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    var cx = w / 2, cy = h / 2 + 6;
    var sw = Math.min(w * 0.5, 150), sh = 34;
    /* 槽断面(倒梯形) */
    ctx.strokeStyle = "rgba(233,238,242,0.5)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(cx - sw / 2, cy - sh / 2 - 6);
    ctx.lineTo(cx - sw / 2 + 7, cy + sh / 2);
    ctx.lineTo(cx + sw / 2 - 7, cy + sh / 2);
    ctx.lineTo(cx + sw / 2, cy - sh / 2 - 6);
    ctx.stroke();
    /* 水 */
    var lvl = st.omega > 0.1 ? 0.72 : 0.15;
    ctx.fillStyle = "rgba(79,163,199,0.75)";
    ctx.beginPath();
    ctx.moveTo(cx - sw / 2 + 7, cy + sh / 2);
    ctx.lineTo(cx - sw / 2 + 7, cy + sh / 2 - (sh - 6) * lvl);
    ctx.lineTo(cx + sw / 2 - 7, cy + sh / 2 - (sh - 6) * lvl);
    ctx.lineTo(cx + sw / 2 - 7, cy + sh / 2);
    ctx.closePath(); ctx.fill();
    /* 刮板(移动) */
    var bx = ((st.sOff / D.p) % 1) * sw;
    ctx.strokeStyle = "#E9C93C";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(cx - sw / 2 + bx, cy - sh / 2 - 4);
    ctx.lineTo(cx - sw / 2 + bx, cy + sh / 2);
    ctx.stroke();
    ctx.fillStyle = soft;
    ctx.font = "600 7.5px Menlo, monospace";
    ctx.textAlign = "left";
    ctx.fillText("断面 A = 0.055×0.34 = 0.0187 m² · 单板水柱 = p×A = 7.52e-3 m³", 4, h - 4);
    ctx.fillText("Q = v·A·φ(φ=0.72 撒漏系数)", 4, 12);
  }
})(window.MECH = window.MECH || {});
