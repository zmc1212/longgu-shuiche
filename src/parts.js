/* 龙骨水车部件建模与注册(约 44 件)。
   槽沿 XY 平面倾斜 35°(+x 上行),水平轴沿 Z;链节 36 块由 KINE 按闭合链弧长
   逐帧摆位(位置+四元数),装配期逐节"飞挂"到链环上。 */
(function (MECH) {
  var P = MECH.P, M3 = null, D = MECH.DIM;
  var _q = new THREE.Quaternion(), _m = new THREE.Matrix4(),
      _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3(0, 0, 1),
      _up = new THREE.Vector3(0, 1, 0);

  function group() { return new THREE.Group(); }

  /* 斜面内"链切向 → local X"的四元数 */
  function basisQuat(tx, ty) {
    _x.set(tx, ty, 0);
    _y.crossVectors(_z, _x).multiplyScalar(-1);      // (−z)×x → 平面内法向,取朝上一侧
    _y.set(-ty, tx, 0);                              // 直接给法向(旋转 +90°)
    _m.makeBasis(_x, _y, _z);
    return _q.setFromRotationMatrix(_m);
  }

  /* —— 建模 —— */
  function buildPond() {
    var g = group();
    var water = P.mesh(new THREE.PlaneGeometry(5.2, 3.6),
      new THREE.MeshStandardMaterial({ color: 0x2E6E8E, transparent: true, opacity: 0.62, roughness: 0.24 }), -3.4, 0.32, 0, false, true);
    water.rotation.x = -Math.PI / 2;
    g.add(water);
    g.add(P.box(0.3, 0.5, 3.7, M3.stone, -5.9, 0.25, 0));
    for (var i = -2; i <= 2; i++) g.add(P.box(0.44, 0.5, 0.26, M3.stone, -2.2, 0.25, i * 0.72));
    return g;
  }

  function buildSupportLow() {
    var g = group();
    g.add(P.box(0.18, D.yLow + 0.25, 0.18, M3.woodD, D.Pa.x, (D.yLow + 0.25) / 2, 0.42));
    g.add(P.box(0.18, D.yLow + 0.25, 0.18, M3.woodD, D.Pa.x, (D.yLow + 0.25) / 2, -0.42));
    g.add(P.box(0.30, 0.10, 1.0, M3.woodD, D.Pa.x, D.yLow + 0.06, 0));
    g.add(P.cyl(0.08, 0.08, 0.14, M3.iron, D.Pa.x, D.yLow, 0.42, 12));
    g.add(P.cyl(0.08, 0.08, 0.14, M3.iron, D.Pa.x, D.yLow, -0.42, 12));
    var axle = P.cyl(0.055, 0.055, 0.95, M3.steelD, D.Pa.x, D.yLow, 0, 12);
    axle.rotation.x = P.ROTX;
    g.add(axle);
    return g;
  }

  function buildSprocket() {   // 链轮:10 齿圆盘(XY 平面)+ 毂
    var g = group();
    g.add(P.cyl(D.R * 0.82, D.R * 0.82, 0.06, M3.woodD, 0, 0, 0, 36));
    for (var i = 0; i < D.ZT; i++) {
      var a = i / D.ZT * Math.PI * 2;
      var t = P.box(0.05, D.R * 0.34, 0.055, M3.woodD, Math.cos(a) * (D.R - 0.03), Math.sin(a) * (D.R - 0.03), 0);
      t.rotation.z = a - Math.PI / 2;
      g.add(t);
    }
    var hub = P.cyl(0.09, 0.09, 0.16, M3.bronze, 0, 0, 0, 14);
    hub.rotation.x = P.ROTX;
    g.add(hub);
    for (var k = 0; k < 5; k++) {
      var a2 = k / 5 * Math.PI * 2;
      var sp = P.box(0.05, D.R * 1.5, 0.04, M3.wood, 0, 0, 0);
      sp.position.set(Math.cos(a2) * D.R * 0.45, Math.sin(a2) * D.R * 0.45, 0);
      sp.rotation.z = a2 - Math.PI / 2;
      g.add(sp);
    }
    return { group: g };
  }

  function buildTrough() {   // 槽体:两侧板 + 底板 + 横档(沿斜面)
    var g = group();
    var Lc = D.Lc, w = D.W;
    var slope = group();
    slope.rotation.z = D.alpha;
    slope.position.set(0, (D.yLow + D.yHi) / 2, 0);   // 斜面中点(轮心连线中点)
    for (var s = -1; s <= 1; s += 2) {
      slope.add(P.box(Lc - 0.9, 0.30, 0.05, M3.wood, 0, 0.19, s * (w / 2 + 0.025)));
    }
    slope.add(P.box(Lc - 0.9, 0.05, w + 0.1, M3.woodD, 0, 0.02, 0));
    [-0.62, -0.15, 0.32].forEach(function (k) {
      slope.add(P.box(0.07, 0.34, w + 0.14, M3.woodD, k * Lc, 0.16, 0));
    });
    g.add(slope);
    return g;
  }

  function buildSupportHi() {
    var g = group();
    g.add(P.box(0.18, D.yHi, 0.18, M3.woodD, D.Pb.x, D.yHi / 2, 0.42));
    g.add(P.box(0.18, D.yHi, 0.18, M3.woodD, D.Pb.x, D.yHi / 2, -0.42));
    g.add(P.box(0.26, 0.10, 1.0, M3.woodD, D.Pb.x, D.yHi + 0.05, 0));
    g.add(P.cyl(0.07, 0.07, 0.14, M3.iron, D.Pb.x, D.yHi, 0.42, 12));
    g.add(P.cyl(0.07, 0.07, 0.14, M3.iron, D.Pb.x, D.yHi, -0.42, 12));
    var axle = P.cyl(0.06, 0.06, 1.15, M3.steelD, D.Pb.x, D.yHi, 0, 12);
    axle.rotation.x = P.ROTX;
    g.add(axle);
    return g;
  }

  function buildCrank() {   // 摇柄:曲臂 + 木柄(装上轮轴端)
    var g = group();
    g.add(P.box(0.34, 0.07, 0.06, M3.woodD, 0.14, 0, 0));
    var handle = P.cyl(0.026, 0.026, 0.26, M3.woodL, 0.30, 0, 0.12, 10);
    handle.rotation.x = Math.PI / 2 - 0.2;
    g.add(handle);
    return { group: g };
  }

  function buildPedal() {   // 脚踏轴 + 左右踏板(相位相反)
    var g = group();
    var axle = P.cyl(0.05, 0.05, 1.0, M3.woodD, 0, 0, 0, 12);
    axle.rotation.x = P.ROTX;
    g.add(axle);
    var cranks = [];
    [-0.36, 0.36].forEach(function (z, i) {
      var c = group();
      c.add(P.box(0.06, 0.24, 0.05, M3.woodD, 0, 0.10, 0));
      c.add(P.box(0.11, 0.03, 0.13, M3.woodL, 0, 0.24, 0));
      c.position.set(0, 0, z);
      g.add(c);
      cranks.push({ g: c, sign: i === 0 ? 1 : -1 });
    });
    g.userData.anim = { cranks: cranks };
    return { group: g };
  }

  function buildTroughOut() {   // 笧槽(出水木槽)+ 支脚
    var g = group();
    var L = 0.9, W = 0.3, H = 0.18;
    g.add(P.box(L, 0.04, W, M3.woodD, 0, 0, 0));
    for (var s = -1; s <= 1; s += 2) g.add(P.box(L, H, 0.04, M3.wood, 0, H / 2, s * W / 2));
    g.add(P.box(0.09, D.yHi - 0.6, 0.09, M3.woodD, -L / 2 + 0.15, -(D.yHi - 0.6) / 2 - 0.1, 0));
    var spout = P.box(0.45, 0.04, W * 0.8, M3.wood, L / 2 + 0.2, -0.10, 0);
    spout.rotation.z = -0.2;
    g.add(spout);
    return g;
  }

  function buildLink(idx) {   // 链节:刮板 + 双销
    var g = group();
    g.add(P.box(D.boardT, D.boardH, D.boardW, M3.woodL, 0, 0, 0));
    [-0.115, 0.115].forEach(function (z) {
      var pin = P.cyl(0.017, 0.017, D.p - 0.05, M3.woodD, 0, -0.008, z, 8);
      pin.rotation.z = Math.PI / 2;      // 销沿 local X(链切向)
      g.add(pin);
    });
    g.userData.idx = idx;
    return { group: g };
  }

  /* —— 注册 —— */
  MECH.PART_DEFS = function () {
    M3 = MECH.Scene3D.M;
    function def(o) { return MECH._def(o); }

    def({ id: "pond", name: "POND · 水池", sub: "下端浸水 · world 固定", phase: 0, kind: "none", world: true,
      build: buildPond, target: [0, 0, 0] });
    def({ id: "supLow", name: "LOWER SUPPORT · 下支架", sub: "轴承 + 下链轮座", phase: 0, at: 0.15, dur: 1.1,
      build: buildSupportLow, target: [0, 0, 0], start: [D.Pa.x - 2.5, 3.6, 2.4], mid: [D.Pa.x - 1.2, 2.0, 1.0], anchor: [D.Pa.x - 0.32, 0.6, 0.5] });
    def({ id: "sprLow", name: "SPROCKET · 下链轮 10T", sub: "R 0.36 · 浸水端", phase: 0, at: 1.5, dur: 1.0, kind: "kine",
      build: buildSprocket, target: [D.Pa.x, D.Pa.y, D.zArc * 0 + 0], off: [0, 0.5, 6.5] });

    def({ id: "trough", name: "TROUGH · 水槽", sub: "倾角 35° · 内宽 0.34", phase: 1, at: 4.2, dur: 1.4,
      build: buildTrough, target: [0, 0, 0], start: [-3.0, 5.6, 0], mid: [-1.5, 3.6, 0.6], anchor: [0, 2.0, 0.55] });
    def({ id: "sprHi", name: "SPROCKET · 上链轮 10T", sub: "R 0.36 · 出水端", phase: 1, at: 5.6, dur: 1.0, kind: "kine",
      build: buildSprocket, target: [D.Pb.x, D.Pb.y, 0], off: [0, 0.8, 7.0] });
    def({ id: "supHi", name: "UPPER SUPPORT · 上支架", sub: "轴承 + 摇柄轴", phase: 1, at: 6.4, dur: 1.1,
      build: buildSupportHi, target: [0, 0, 0], start: [D.Pb.x + 2.8, 5.4, 2.4], mid: [D.Pb.x + 1.4, 4.0, 1.0], anchor: [D.Pb.x + 0.30, 2.6, 0.5] });
    def({ id: "crank", name: "CRANK · 摇柄", sub: "上轮轴端 · ω 手摇", phase: 1, at: 7.4, dur: 0.9, kind: "kine",
      build: buildCrank, target: [D.Pb.x, D.yHi, 0.62], off: [0.6, 1.6, 1.4] });

    /* 36 链节逐节挂装(阶段 3):target = 其链环初始位 */
    for (var i = 0; i < D.N; i++) {
      var s0 = i * D.p;
      var p0 = MECH.KS.loopPose(s0);
      def({ id: "link" + i, name: "CHAIN LINK · 链节 " + (i + 1 < 10 ? "0" + (i + 1) : i + 1),
        sub: "板 0.30×0.055 · 销距 0.402", phase: 2, at: 9.15 + i * 0.23, dur: 0.5, kind: "kine",
        build: (function (k) { return function () { return buildLink(k); }; })(i),
        target: [p0.x, p0.y, p0.z], off: [0.5, 1.3, 1.2] });
    }

    def({ id: "pedal", name: "PEDAL · 脚踏轴", sub: "左右踏板相位相反", phase: 3, at: 18.4, dur: 1.1, kind: "kine",
      build: buildPedal, target: [D.Pa.x - 0.75, 0.72, 0], off: [-0.8, 1.6, 1.2] });
    def({ id: "troughOut", name: "OUT TROUGH · 笧槽", sub: "承上端出水", phase: 3, at: 19.4, dur: 1.2,
      build: buildTroughOut, target: [D.Pb.x + 1.15, D.yHi + 0.24, 0], start: [D.Pb.x + 3.4, D.yHi + 2.2, 0], mid: [D.Pb.x + 2.0, D.yHi + 1.0, 0], anchor: [0.1, 0.25, 0.4] });
  };

  /* —— 运动学分发 —— */
  MECH.KINE = function (st) {
    var rot = -st.sOff / D.R;    // 链前进 s → 链轮转角(CW)
    var e;
    e = MECH.Parts.entry("sprLow"); if (e && e.shown) e.group.rotation.z = rot;
    e = MECH.Parts.entry("sprHi"); if (e && e.shown) e.group.rotation.z = rot;
    e = MECH.Parts.entry("crank"); if (e && e.shown) e.group.rotation.z = rot;
    e = MECH.Parts.entry("pedal");
    if (e && e.shown) {
      var ang = -st.sOff / D.p * Math.PI;   // 踏板一圈 = 两块板(2p)
      e.group.userData.anim.cranks.forEach(function (c) { c.g.rotation.z = ang * c.sign; });
    }
    for (var i = 0; i < D.N; i++) {
      var li = MECH.Parts.entry("link" + i);
      if (!li || !li.shown) continue;
      var s = i * D.p + st.sOff;
      var wp = MECH.KS.loopPose(s);
      li.group.position.set(wp.x, wp.y, wp.z);
      li.group.quaternion.copy(basisQuat(wp.tx, wp.ty));
    }
  };
})(window.MECH = window.MECH || {});
