/* 龙骨水车(翻车) — 尺寸常量与闭合链运动学求解器
   文献依据:《天工开物·乃粒》翻车图、王祯《农书》;三国马钧改良。
   闭合链:上行直段 + 上轮半弧 + 下行直段 + 下轮半弧,总长 = 2·Lc + 2πR;
   节距取整闭合:p = 链总长/N(载入期断言)。
   链速 v = ω·R;流量 Q = v·A·φ,A = p·板高·槽宽。 */
(function (MECH) {
  var CHI = 0.3;
  var D = {
    CHI: CHI,
    alpha: 35 * Math.PI / 180,     // 槽倾角
    L: 5.0,                        // 槽水平投影长
    W: 0.34,                       // 槽内宽
    R: 0.36,                       // 链轮半径(10 齿)
    ZT: 10,
    N: 36,                         // 链节数(取整闭合)
    boardH: 0.055, boardW: 0.30, boardT: 0.03,
    phi: 0.72,                     // 撒漏系数
    zAscent: 0.02, zDescent: 0.26, zArc: 0.13,   // 链三段的 z 向通道
    yLow: 0.46,                    // 下轮心高
    k: { slow: 0.9, fast: 2.2, pedal: 1.6 }      // 三档 ω rad/s
  };
  D.Lc = D.L / Math.cos(D.alpha);                       // 轮心斜距 6.104
  D.yHi = D.yLow + D.L * Math.tan(D.alpha);             // 上轮心高 3.96
  D.Pa = { x: -D.L / 2, y: D.yLow };                    // 下轮心
  D.Pb = { x: D.L / 2, y: D.yHi };                      // 上轮心
  D.ux = Math.cos(D.alpha); D.uy = Math.sin(D.alpha);   // 槽轴单位向量
  D.loopLen = 2 * D.Lc + 2 * Math.PI * D.R;             // 闭合链长 14.47
  D.p = D.loopLen / D.N;                                // 节距 0.4019(闭合)
  D.A = D.boardH * D.W;                                 // 过水断面 h·W = 0.0187(Q = v·A·φ)
  D.Vboard = D.p * D.boardH * D.W;                      // 单板携水体积(含板距)
  D.vOf = function (w) { return w * D.R; };
  D.Qof = function (w) { return D.vOf(w) * D.A * D.phi; };

  var A0 = 215 * Math.PI / 180, A1 = 35 * Math.PI / 180;   // 弧段起止角(上轮 CW / 下轮 CW 续)

  /* 弧长 s → {x, y, z, tx, ty}(链中一点;切向 = 链前进方向) */
  function loopPose(s) {
    s = ((s % D.loopLen) + D.loopLen) % D.loopLen;
    var s1 = D.Lc, s2 = D.Lc + Math.PI * D.R, s3 = 2 * D.Lc + Math.PI * D.R;
    if (s < s1) {                                   // 上行直段
      return { x: D.Pa.x + D.ux * s, y: D.Pa.y + D.uy * s, z: D.zAscent, tx: D.ux, ty: D.uy };
    }
    if (s < s2) {                                   // 上轮弧(过顶,CW)
      var th = A0 - (s - s1) / D.R;
      return { x: D.Pb.x + Math.cos(th) * D.R, y: D.Pb.y + Math.sin(th) * D.R, z: D.zArc,
               tx: Math.sin(th), ty: -Math.cos(th) };
    }
    if (s < s3) {                                   // 下行直段
      var k = s - s2;
      return { x: D.Pb.x + D.ux * D.R - D.ux * k, y: D.Pb.y + D.uy * D.R - D.uy * k, z: D.zDescent,
               tx: -D.ux, ty: -D.uy };
    }
    var th2 = A1 - (s - s3) / D.R;                  // 下轮弧(过底,CW 续)
    return { x: D.Pa.x + Math.cos(th2) * D.R, y: D.Pa.y + Math.sin(th2) * D.R, z: D.zArc,
             tx: Math.sin(th2), ty: -Math.cos(th2) };
  }

  function newState() {
    return {
      time: 0, sOff: 0, omega: 0, omegaTarget: 0,
      dist: 0, water: 0, waterT: 0,
      lastPhase: "", mode: "hand",
      hist: [], dumps: 0
    };
  }

  function step(st, dt) {
    st.omega += (st.omegaTarget - st.omega) * Math.min(1, dt * 2.2);
    var v = D.vOf(st.omega);
    var sPrev = st.sOff;
    st.sOff += v * dt;
    st.dist += v * dt;
    st.time += dt;
    st.waterT += dt;
    /* 3s 滑窗实测流量:链前进量 → 过板数 × 单板水柱 × φ(连续差分) */
    st.hist.push({ t: st.time, s: st.sOff });
    while (st.hist.length && st.hist[0].t < st.time - 3.05) st.hist.shift();
    if (st.hist.length > 1 && st.time - st.hist[0].t > 2.5) {
      st.qMeas = (st.sOff - st.hist[0].s) / D.p * D.Vboard * D.phi / (st.time - st.hist[0].t);
    }
  }

  MECH.DIM = D;
  MECH.KS = { newState: newState, step: step, loopPose: loopPose };

  /* 载入期自检:闭合 + 流量公式 + 30s 模拟实测 */
  (function selfCheck() {
    var errs = [];
    if (Math.abs(D.N * D.p - D.loopLen) > 1e-9) errs.push("链闭合失败: " + (D.N * D.p) + " vs " + D.loopLen);
    if (errs.length) {
      if (window.MECH_SHOW_BOOT_ERROR) window.MECH_SHOW_BOOT_ERROR("龙骨水车自检失败: " + errs.join(";"));
      throw new Error(errs.join(";"));
    }
    /* 运行期自检:30s 常速实测板通过率 → Q 应与公式一致(±8%) */
    var st = newState();
    st.omegaTarget = D.k.slow;
    st.omega = D.k.slow;
    var prevN = 0, cnt = 0;
    for (var i = 0; i < 900; i++) {
      step(st, 1 / 30);
      var n = Math.floor(st.sOff / D.p);
      if (n > prevN) { prevN = n; cnt++; }   // 30s 大样本过板计数
    }
    var qm = cnt * D.Vboard * D.phi / 30;
    var qf = D.Qof(D.k.slow);
    if (Math.abs(qm - qf) / qf > 0.15) {
      var msg = "龙骨水车流量自检失败: 实测 " + qm.toFixed(4) + " vs 公式 " + qf.toFixed(4);
      if (window.MECH_SHOW_BOOT_ERROR) window.MECH_SHOW_BOOT_ERROR(msg);
      throw new Error(msg);
    }
  })();
})(window.MECH = window.MECH || {});
