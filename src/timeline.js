/* 时间线(48s):下端 → 槽体上端 → 36 链节挂装 → 笧槽脚踏 → 慢摇 → 快摇 → 脚踏 → 总结 */
(function (MECH) {
  var KS = MECH.KS, D = MECH.DIM;

  MECH.PHASES = [
    { id: "base", name: "LOWER · 下支架与下链轮", dur: 4, dot: "yellow", mode: "ASSEMBLING",
      cam: { theta: 0.55, phi: 1.18, r: 7.2, target: [-2.5, 1.0, 0] }, drift: 0.03 },
    { id: "upper", name: "UPPER · 水槽·上链轮·摇柄", dur: 5, dot: "orange", mode: "ASSEMBLING",
      cam: { theta: 0.30, phi: 1.18, r: 8.4, target: [0, 2.2, 0] }, drift: 0.015 },
    { id: "chain", name: "CHAIN · 36 节链环挂装", dur: 9, dot: "teal", mode: "ASSEMBLING",
      cam: { theta: 0.62, phi: 1.20, r: 9.4, target: [0, 2.2, 0] }, drift: 0.02 },
    { id: "trough", name: "OUTFIT · 脚踏轴与笧槽", dur: 4, dot: "blue", mode: "ASSEMBLING",
      cam: { theta: -0.45, phi: 1.16, r: 8.8, target: [0.8, 2.4, 0] }, drift: 0.02 },
    { id: "slow", name: "HAND · 手摇慢速 0.9 rad/s", dur: 7, dot: "green", mode: "HAND",
      cam: { theta: 0.80, phi: 1.20, r: 9.6, target: [0, 2.2, 0] }, drift: 0.012 },
    { id: "fast", name: "FAST · 快摇 2.2 rad/s", dur: 7, dot: "pink", mode: "FAST",
      cam: { theta: -0.55, phi: 1.16, r: 9.2, target: [0, 2.2, 0] }, drift: 0.02 },
    { id: "pedal", name: "PEDAL · 脚踏模式 1.6 rad/s", dur: 7, dot: "yellow", mode: "PEDAL",
      cam: { theta: 0.20, phi: 1.24, r: 5.6, target: [-3.2, 0.9, 0] }, drift: 0.008 },
    { id: "summary", name: "SUMMARY · 三档对比", dur: 5, dot: "green", mode: "REVIEW",
      cam: { theta: 0.0, phi: 1.10, r: 10.4, target: [0, 2.3, 0] }, drift: 0.05 }
  ];
  MECH.PHASE_IDS = ["base", "upper", "chain", "trough", "slow", "fast", "pedal", "summary"];

  MECH.newState = KS.newState;

  MECH.tick = function (st, ph, pt, dt) {
    if (ph.id !== st.lastPhase) { st.lastPhase = ph.id; st.hist = []; st.qMeas = 0; }
    if (ph.id === "slow") st.omegaTarget = D.k.slow;
    else if (ph.id === "fast") st.omegaTarget = D.k.fast;
    else if (ph.id === "pedal") st.omegaTarget = D.k.pedal;
    else st.omegaTarget = 0;
    KS.step(st, dt);
    /* 出水粒子:刮板越过上轮顶 → 出水一次 */
    var sPrev = st.sOff - D.vOf(st.omega) * dt;
    if (Math.floor(st.sOff / D.p) > Math.floor(sPrev / D.p) && ph.id !== "summary") {
      MECH.Scene3D.spawnPuff(D.Pb.x + 0.95, D.yHi + 0.42, 0.1 + (Math.random() - 0.5) * 0.15, {
        max: 0.7, base: 0.24, vx: 0.75 + Math.random() * 0.2, vy: -0.3, vz: (Math.random() - 0.5) * 0.1,
        opacity: 0.6, tint: 0x7FC4E0, grow: 1.1
      });
    }
    /* 下端入水涟漪 */
    if (st.omega > 0.3 && Math.random() < dt * 5) {
      MECH.Scene3D.spawnPuff(D.Pa.x - 0.3, 0.45, 0.8 + (Math.random() - 0.5) * 1.2, {
        max: 1.2, base: 0.4, vx: 0.2, vy: 0.25, vz: 0, opacity: 0.35, tint: 0x9FD4E8, grow: 1.4
      });
    }
  };

  MECH.status = function (st, ph, pt) {
    var v = D.vOf(st.omega);
    var pill = ph.name;
    if (ph.id === "slow" || ph.id === "fast" || ph.id === "pedal") {
      pill = ph.name + " · v " + v.toFixed(2) + " m/s";
    }
    return {
      mode: ph.mode,
      hot: ph.id === "fast",
      pill: pill,
      a: "链速 " + v.toFixed(2) + " m/s",
      b: (st.omega > 0.15 ? (D.Qof(st.omega) * 1000).toFixed(2) + " L/s" : "—"),
      c: "链节 " + (function () {
        var n = 0;
        for (var i = 0; i < D.N; i++) { var e = MECH.Parts.entry("link" + i); if (e && e.sealed) n++; }
        return n + "/" + D.N;
      })()
    };
  };

  MECH.pinnedFor = function (ph) {
    function E(id) { var e = MECH.Parts.entry(id); return e ? (e.anchor || e.group) : null; }
    if (ph.id === "base") return [{ id: "p-sl", obj: E("sprLow"), text: "下链轮 10T · R 0.36" }];
    if (ph.id === "upper") return [
      { id: "p-tr", obj: E("trough"), text: "水槽 · 35° · 内宽 0.34" },
      { id: "p-sh", obj: E("sprHi"), text: "上链轮 · 摇柄驱动", tone: "white" }
    ];
    if (ph.id === "chain") return [
      { id: "p-l1", obj: E("link0"), text: "链节 · 刮板迎水" },
      { id: "p-l2", obj: E("link18"), text: "闭合链 36 节 · 节距 0.402", tone: "white" }
    ];
    if (ph.id === "slow" || ph.id === "fast" || ph.id === "pedal" || ph.id === "summary") return [
      { id: "p-to", obj: E("troughOut"), text: "笧槽 · Q = v·A·φ", tone: "white" },
      { id: "p-cr", obj: E("crank"), text: ph.id === "pedal" ? "脚踏驱动" : "摇柄驱动" }
    ];
    return [];
  };
})(window.MECH = window.MECH || {});
