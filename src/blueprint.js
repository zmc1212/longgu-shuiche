/* 图纸面板(B 键):龙骨水车侧视总图 + 链节详图 + 流量公式 + 尺寸表 */
(function (MECH) {
  var red = "#8C2F1E";

  function arrow(ctx, x1, y1, x2, y2, text, below) {
    ctx.strokeStyle = "rgba(42,38,32,0.4)";
    ctx.fillStyle = "rgba(42,38,32,0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    var s = 4, dir = x2 >= x1 ? 1 : -1;
    ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - s * dir, y2 - 3); ctx.lineTo(x2 - s * dir, y2 + 3); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 + s * dir, y1 - 3); ctx.lineTo(x1 + s * dir, y1 + 3); ctx.closePath(); ctx.fill();
    ctx.font = "600 10px Menlo, monospace";
    ctx.textAlign = "center";
    ctx.fillText(text, (x1 + x2) / 2, below ? (y1 + 13) : (y1 - 5));
  }

  MECH.BP = {
    no: "Fig. 03 · 复原总图",
    title: "龙骨水车(翻车) · 链轮刮板循环提水",
    src: "《天工开物·乃粒》翻车图 · 王祯《农书》 · 三国马钧改良",
    draw: function (ctx, w, h) {
      var D = MECH.DIM;
      ctx.clearRect(0, 0, w, h);
      var chainH = 44, chainY = h - chainH - 12, topY = 34;
      var ink = "#2A2620";
      ctx.fillStyle = red;
      ctx.font = "700 11px Menlo, monospace";
      ctx.textAlign = "left";
      ctx.fillText("闭合链: N·p = 2·Lc + 2πR = 14.47 m(N=36, p=0.4019) · v=ωR · Q=v·(h·W)·φ", w * 0.045, topY - 10);

      /* ============ 左:侧视图 ============ */
      var S = Math.min(w * 0.47 / 7.6, (chainY - topY - 26) / 4.7);
      var ox = w * 0.045, oy = chainY - 14;
      var X = function (mx) { return ox + (mx + 3.5) * S; }, Y = function (my) { return oy - my * S; };
      ctx.strokeStyle = ink;
      ctx.fillStyle = ink;
      ctx.lineWidth = 1.4;
      ctx.font = "700 11px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("侧视 SIDE(35° 起斜)", ox, Y(4.4));
      /* 水面 */
      ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(X(-3.6), Y(0.5)); ctx.lineTo(X(-0.4), Y(0.5)); ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = "600 9px sans-serif";
      ctx.fillText("水池", X(-3.6), Y(0.5) + 12);
      /* 槽(双线) */
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(X(D.Pa.x - D.ux * 0.3), Y(D.Pa.y - D.uy * 0.3));
      ctx.lineTo(X(D.Pb.x + D.ux * 0.4), Y(D.Pb.y + D.uy * 0.4));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(X(D.Pa.x - 0.2 * Math.sin(D.alpha) - D.uy * 0.12 * -1), Y(D.Pa.y - 0.2 * Math.cos(D.alpha)));
      ctx.lineTo(X(D.Pb.x + 0.6 * Math.sin(D.alpha)), Y(D.Pb.y - 0.6 * Math.cos(D.alpha)));
      ctx.stroke();
      /* 双轮 + 链环示意(虚线) */
      [[D.Pa.x, D.Pa.y], [D.Pb.x, D.Pb.y]].forEach(function (c) {
        ctx.beginPath(); ctx.arc(X(c[0]), Y(c[1]), D.R * S, 0, Math.PI * 2); ctx.stroke();
      });
      ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.arc(X(D.Pb.x), Y(D.Pb.y), D.R * S, Math.PI * (215 / 180 - 1), Math.PI * (35 / 180 - 1), false); ctx.stroke();
      ctx.setLineDash([]);
      /* 链板(斜线短划) */
      for (var i = 0; i < D.N; i++) {
        var wp = MECH.KS.loopPose(i * D.p);
        ctx.beginPath();
        ctx.moveTo(X(wp.x) - Math.sin(Math.atan2(wp.ty, wp.tx)) * 3, Y(wp.y) + Math.cos(Math.atan2(wp.ty, wp.tx)) * 3);
        ctx.lineTo(X(wp.x) + Math.sin(Math.atan2(wp.ty, wp.tx)) * 3, Y(wp.y) - Math.cos(Math.atan2(wp.ty, wp.tx)) * 3);
        ctx.stroke();
      }
      /* 摇柄 */
      ctx.beginPath(); ctx.moveTo(X(D.Pb.x), Y(D.Pb.y)); ctx.lineTo(X(D.Pb.x + 0.35), Y(D.Pb.y + 0.12)); ctx.stroke();
      ctx.fillText("摇柄", X(D.Pb.x + 0.42), Y(D.Pb.y + 0.18));
      /* 尺寸标注 */
      arrow(ctx, X(D.Pa.x), Y(-0.35), X(D.Pb.x), Y(-0.35), "槽长 5.0m(水平投影)", true);
      arrow(ctx, X(D.Pa.x) - 14, Y(D.Pa.y), X(D.Pa.x) - 14, Y(D.yHi), "", false);
      ctx.fillStyle = "rgba(42,38,32,0.55)";
      ctx.textAlign = "right";
      ctx.fillText("高差 3.50", X(D.Pa.x) - 16, Y((D.yLow + D.yHi) / 2));
      ctx.textAlign = "left";
      ctx.fillStyle = ink;
      arrow(ctx, X(D.Pb.x + D.ux * 0.4), Y(D.Pb.y + D.uy * 0.4), X(D.Pb.x + D.ux * 1.3), Y(D.Pb.y + D.uy * 1.3), "α = 35°", false);
      ctx.fillStyle = "rgba(42,38,32,0.55)";
      ctx.fillText("R 0.36 · 10 齿", X(D.Pb.x) - 0.3 * S, Y(D.Pb.y) - 0.5 * S);

      /* ============ 右:链节详图 ============ */
      var ox2 = w * 0.58, oy2 = topY + 30, S2 = Math.min((w - ox2 - 22) / 1.0, (chainY - oy2 - 56) / 0.9);
      ctx.font = "700 11px sans-serif";
      ctx.fillStyle = ink;
      ctx.fillText("链节详图 LINK", ox2, oy2 - 8);
      var bcx = ox2 + 0.35 * S2, bcy = oy2 + 0.42 * S2;
      ctx.strokeRect(bcx - D.boardT / 2 * S2, bcy - D.boardH / 2 * S2, D.boardT * S2, D.boardH * S2);
      ctx.strokeRect(bcx - D.boardT / 2 * S2, bcy - D.boardH / 2 * S2, (D.p - 0.05) * S2, 0.03 * S2);
      ctx.strokeRect(bcx - D.boardT / 2 * S2, bcy + D.boardH / 2 * S2 - 0.03 * S2, (D.p - 0.05) * S2, 0.03 * S2);
      ctx.font = "600 9px sans-serif";
      ctx.fillText("刮板 0.30×0.055×0.03", bcx + 0.1 * S2, bcy - 0.06 * S2);
      ctx.fillStyle = "rgba(42,38,32,0.55)";
      ctx.fillText("双销 Ø0.034 · 销距 = 节距 0.402", ox2, oy2 + 0.75 * S2);
      ctx.fillText("36 节闭合 · 上行载水 / 回程空链", ox2, oy2 + 0.75 * S2 + 14);

      /* ============ 底部:参数链 ============ */
      var boxes = [
        ["摇柄/脚踏", "ω 0.9~2.2"], ["下链轮", "R 0.36 · 10T"], ["闭合链", "36 节 · v=ωR"],
        ["上行载水", "A 0.0187 m²"], ["顶部倾泻", "v/p 次/s"], ["笧槽出渠", "Q=vAφ"]
      ];
      var bwid = (w * 0.91) / boxes.length;
      for (var b = 0; b < boxes.length; b++) {
        var bx2 = w * 0.045 + b * bwid;
        ctx.strokeStyle = ink;
        ctx.fillStyle = ink;
        ctx.strokeRect(bx2, chainY, bwid - 10, chainH);
        ctx.font = "700 10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(boxes[b][0], bx2 + (bwid - 10) / 2, chainY + 17);
        ctx.font = "600 8.5px Menlo, monospace";
        ctx.fillStyle = "rgba(42,38,32,0.55)";
        ctx.fillText(boxes[b][1], bx2 + (bwid - 10) / 2, chainY + 32);
        if (b < boxes.length - 1) {
          ctx.beginPath();
          ctx.moveTo(bx2 + bwid - 10, chainY + 20);
          ctx.lineTo(bx2 + bwid - 2, chainY + 20);
          ctx.stroke();
        }
      }
    },
    table:
      '<h4>槽体尺寸</h4><table>' +
      '<tr><th>水槽</th><td>水平投影 5.0 · 倾角 35°</td><td>斜长 6.10 m</td></tr>' +
      '<tr><th>槽内宽</th><td>0.34 m</td><td>板宽 0.30 m</td></tr>' +
      '<tr><th>链轮(×2)</th><td>R 0.36 · 10 齿</td><td>径 0.72 m</td></tr>' +
      '<tr><th>高差</th><td>上轮心 y=3.96 · 下轮心 y=0.46</td><td>3.50 m</td></tr>' +
      '</table><h4>链与流量</h4><table>' +
      '<tr><th>闭合链长</th><td>2×6.104 + 2π×0.36</td><td>14.47 m</td></tr>' +
      '<tr><th>节数/节距</th><td>N=36 · p=14.47/36</td><td>0.4019 m</td></tr>' +
      '<tr><th>过水断面 A</th><td>h·W = 0.055×0.34</td><td>0.0187 m²</td></tr>' +
      '<tr><th>单板水柱</th><td>p·A = 0.402×0.0187</td><td>7.52e-3 m³</td></tr>' +
      '<tr><th>慢摇 ω0.9</th><td>v=0.324 → Q=vAφ</td><td>4.37 L/s</td></tr>' +
      '<tr><th>快摇 ω2.2</th><td>v=0.792 → Q</td><td>10.68 L/s</td></tr>' +
      '<tr><th>脚踏 ω1.6</th><td>v=0.576 → Q</td><td>7.77 L/s</td></tr>' +
      '</table><h4>运行期自检</h4>' +
      '<p>载入即模拟 30s:刮板过顶率 × A × φ 与 Q 公式偏差 > 15% 拒绝启动。</p>' +
      '<h4>文献</h4>' +
      '<p>《天工开物》:「其直木以夹转轴……板间隙一方许……以系水而上」;王祯《农书》谓翻车「济人间之利,至溥也」。</p>'
  };
})(window.MECH = window.MECH || {});
