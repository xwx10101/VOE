'use strict';
// ============================================================
// THE MEADOW — actors and world for "the fawn and the butterfly"
//
// The finish is riso: cream stock, three or four inks per shot, every tone a
// halftone dot screen at its own angle, overlaps multiplied, edges off
// register by a few pixels, paper fibre over everything. Every shape is
// authored in final units (the film is 1920 x 1080 logical) and drawn under
// whatever transform the scene has set with cam().
//
// Sections: STOCK · INK · LIMBS · DEER · TIGER · BUTTERFLY · WORLD
// ============================================================

// ===================== STOCK =====================
const HORIZON = 574;         // where the meadow meets the sky
const GROUND = 866;          // the line hooves and paws land on
const TAU2 = Math.PI * 2;
const STOCK = '#f0ece2';     // the paper itself, the same cream in every shot
// the ink set. A shot picks three or four of these; nothing else is allowed in.
const INKS = {
  navy: '#22366b', indigo: '#3a2a5e', slate: '#5b6b8c',
  tan: '#c9a979', ochre: '#b8792f', orange: '#d9713a',
  teal: '#5d8b8a', green: '#4b7f57', olive: '#8f8a4e',
  plum: '#80426b', rose: '#d4778c', pale: '#f2e2ac', cream: '#f7f1e2',
};
// h2: deterministic value in 0..1 from two integers — every scatter in the
// film (grass, speckle, clouds) is a pure function of world position, so it
// stands still while the camera moves.
function h2(i, s = 0) { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); }
function bbox(pts) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of pts) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } const p = 10; return [x0 - p, y0 - p, x1 - x0 + p * 2, y1 - y0 + p * 2]; }
const plus = (pts, dx, dy) => pts.map(([x, y]) => [x + dx, y + dy]);
function rotAbout(pts, cx, cy, a) { const ca = Math.cos(a), sa = Math.sin(a); return pts.map(([x, y]) => { const dx = x - cx, dy = y - cy; return [cx + dx * ca - dy * sa, cy + dx * sa + dy * ca]; }); }
const scaleAbout = (pts, cx, cy, k) => pts.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k]);

// ===================== INK =====================
// ===================== HALFTONE =====================
// A halftone screen is a physical thing: it belongs to the plate, not to the
// drawing, so it is drawn once as a small repeating tile and then filled
// through a shape. That is both ten times faster than scattering arcs and more
// like the real process — the screen keeps its own grid while the artwork
// moves under it.
const _tiles = new Map();
function halftoneTile(cell, radius, color, stagger) {
  const r = Math.max(.18, radius), key = cell + '|' + r.toFixed(2) + '|' + color + '|' + stagger;
  let t = _tiles.get(key);
  if (!t) {
    const sx = Math.max(3, Math.round(cell)), sy = Math.max(3, Math.round(cell) * (stagger ? 1 : 1));
    const n = sx * 2, m = sy * 2;
    t = document.createElement('canvas'); t.width = n; t.height = m;
    const g = t.getContext('2d'); g.fillStyle = color;
    const dot = (x, y) => { g.beginPath(); g.arc(x, y, r, 0, TAU2); g.fill(); };
    if (stagger) { /* nothing: the screen is always staggered */ }
    dot(sx * .5, sy * .5); dot(sx * 1.5, sy * .5);
    dot(0, sy * 1.5); dot(sx, sy * 1.5);
    _tiles.set(key, t);
  }
  return t;
}
// halftone: fill `path` with a dot screen. density 0..1 sets the dot size.
//   o.bands > 1: the density may be a function of y, sampled in that many
//   strips — a stepped halftone gradient, the way a riso gradient really is.
function halftone(c, path, box, o = {}) {
  const { cell = 10, color = INKS.navy, density = .5, stagger = false, alpha = 1, seed = 1, bands = 1, x0 = box[0], y0 = box[1], h = box[3] } = o;
  const mk = (d) => { const t = halftoneTile(cell, cell * .564 * Math.sqrt(clamp(d, 0, 1)), color, stagger ? h2(cell, seed) > .5 : false); return c.createPattern(t, 'repeat'); };
  c.save(); c.globalAlpha = alpha; c.globalCompositeOperation = 'multiply';
  const fn = typeof density === 'function' ? density : () => density;
  if (bands > 1) {
    const bh = h / bands;
    for (let k = 0; k < bands; k++) {
      const d = fn(x0 + box[2] * .5, y0 + bh * (k + .5));
      if (!(d > .02)) continue;
      c.save(); c.beginPath(); c.rect(box[0] - 20, y0 + k * bh, box[2] + 40, bh + .6); c.clip();
      c.fillStyle = mk(d); c.fill(path); c.restore();
    }
  } else {
    const d = typeof density === 'function' ? fn(x0 + box[2] * .5, y0 + h * .5) : density;
    if (d > .02) { c.fillStyle = mk(d); c.fill(path); }
  }
  c.restore();
}

// print: one or more plates. [ink, coverage 0..1 or (x,y)=>0..1, dx, dy, cell]
// Every plate is a halftone screen of that ink at its own angle over the
// others; because the screens multiply, overlaps mix like ink on paper.
const ANG = [.26, 1.31, .79, 2.09, .52, 1.83];
function print(c, path, box, plates, seed, al = .96) {
  if (!plates || !plates.length) return;
  c.save(); c.globalAlpha = al;
  plates.forEach((P, k) => {
    const ink = P[0], dens = P[1] === undefined ? .62 : P[1], dx = P[2] || 0, dy = P[3] || 0, cell = P[4] || 9;
    if (!(dens > 0)) return;
    c.save(); c.translate(dx, dy);
    halftone(c, path, box, { cell, color: ink, density: dens, stagger: k % 2 === 1, seed: seed + k * 17 });
    c.restore();
  });
  c.restore();
}
// ink: the working call. A shape is printed in one or two inks, hatched where
// the light falls off, outlined with the pen in navy, and the outline is
// repeated a few pixels off register in a second ink, the way a real two-pass
// riso print never lines up.
function ink(c, pts, o = {}) {
  const { fill = INKS.orange, second = null, seed = 1, lw = 4, close = true, curve = true,
    hatchOn = true, hatchInk = INKS.navy, hatchA = .16, hatchGap = 16, hatchLen = 22, hatchAngle = .95,
    line = INKS.navy, boil = 0, mis = null, al = 1, cell = 9, cover = .34, secondCover = .2, dx = 0, dy = 0, secondDx = 3, secondDy = 4, pressure = .3 } = o;
  const path = curve ? curvePath(pts, close) : polyPath(pts, close), box = bbox(pts);
  c.save(); c.globalAlpha = al;
  const plates = [];
  if (second) plates.push([second, secondCover, secondDx, secondDy, cell + 2]);
  if (fill) plates.push([fill, cover, dx, dy, cell]);
  print(c, path, box, plates, seed);
  if (hatchOn) hatch(c, path, box, { angle: hatchAngle, gap: hatchGap, len: hatchLen, jitter: 8, color: hatchInk, alpha: hatchA, width: 1.7, seed, flow: .2, curve: .18 });
  if (line) { c.strokeStyle = line; c.lineWidth = lw; wob(c, pts, lw * .6, seed + boil, close, { corner: .95, pressure }); }
  if (mis) { c.save(); c.translate(mis.dx || 4, mis.dy || -4); c.globalAlpha = al * (mis.a ?? .5); c.strokeStyle = mis.ink || INKS.plum; c.lineWidth = lw * .85; wob(c, pts, lw * .6, seed + boil, close, { corner: .95 }); c.restore(); }
  c.restore();
}
// light: the one bright thing in a shot. A pale halftone blooming over the top
// edge of a shape, clipped to it.
function light(c, pts, o = {}) {
  const { ink: ink2 = INKS.pale, al = .5, seed = 1, cover = .8, cell = 12, dx = 0, dy = 0 } = o;
  const path = curvePath(pts, true), [x0, y0, w, h] = bbox(pts);
  c.save(); c.globalAlpha = al; c.translate(dx, dy);
  const dens = (x, y) => clamp(1 - (y - y0) / (h * .55), 0, 1) * cover;
  halftone(c, path, [x0, y0, w, h], { cell, color: ink2, density: (x, y) => clamp(1 - (y - y0) / (h * .55), 0, 1) * cover, bands: 5, seed, alpha: al });
  c.restore();
}
// tear: a torn edge along a y, as a path — sections of a shot meet at one
function tornPath(y, o = {}) { const { amp = 16, seed = 1, freq = 78, w = W } = o; const p = new Path2D(); p.moveTo(-30, -400); p.lineTo(-30, y);
  for (let x = -30; x <= w + 30; x += 7) p.lineTo(x, y + (h2(x * .017, seed) - .5) * amp * 2 + Math.sin(x / freq) * amp * .8 + Math.sin(x / 13) * amp * .18);
  p.lineTo(w + 30, -400); p.closePath(); return p; }

// ===================== LIMBS =====================
// Two bones, one knee: given a hip and where the hoof should be, find the
// elbow. Every leg of every animal in the film goes through here.
function limb(hip, foot, L1, L2, bend) {
  let dx = foot[0] - hip[0], dy = foot[1] - hip[1];
  let d = Math.hypot(dx, dy); const lim = (L1 + L2) * .985;
  if (d > lim) { const k = lim / (d || 1); dx *= k; dy *= k; d = lim; }
  d = Math.max(d, Math.abs(L1 - L2) + 1);
  const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d), hgt = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  const ux = dx / d, uy = dy / d;
  return [[hip[0], hip[1]], [hip[0] + ux * a - bend * uy * hgt, hip[1] + uy * a + bend * ux * hgt], [hip[0] + ux * d, hip[1] + uy * d]];
}
// gait: stance drags the hoof back along the ground, swing lifts it and reaches
// forward again. That is the whole walk, and both animals share it.
function hoofAt(phase, stride, liftH) {
  const p = ((phase % 1) + 1) % 1;
  const x = Math.cos(p * TAU2) * stride * .5;
  return [x, -Math.max(0, -Math.sin(p * TAU2)) * liftH];
}
// leg: a limb drawn as three thick round-capped strokes — a navy contour
// underneath and the ink on top, so a leg reads as one solid drawn shape with
// a real outline, the way a marker drawing does. No wireframe bones.
function leg(c, hip, foot, o = {}) {
  const { L1 = 76, L2 = 78, bend = -1, w = 13, seed = 1, al = 1, ink1 = INKS.orange, second = null, cover = .55, hoof = true } = o;
  const p = limb(hip, foot, L1, L2, bend);
  const stroke = (pts, width, color, alphaV) => {
    c.save(); c.globalAlpha = al * alphaV; c.strokeStyle = color; c.lineCap = 'round'; c.lineJoin = 'round';
    c.lineWidth = width; wob(c, pts, width * .16 + 1, seed, false, { corner: .32 }); c.restore();
  };
  stroke(p, w + 6, INKS.navy, 1);                    // the contour
  stroke(p, w + 6, INKS.navy, 1);
  stroke(p.slice(0, 2), w, ink1, .95);               // the ink, upper segment then lower
  stroke(p.slice(1), w * .84, ink1, .95);
  if (second) { c.save(); c.globalAlpha = al * .35; c.strokeStyle = second; c.lineWidth = w * .5; c.lineCap = 'round';
    c.translate(4, 3); wob(c, p, 2, seed + 9, false, { corner: .4 }); c.restore(); }
  if (hoof) { c.save(); c.globalAlpha = al; c.fillStyle = INKS.navy;
    c.beginPath(); c.ellipse(p[2][0] - 1, p[2][1] + 1, w * .52, w * .42, 0, 0, TAU2); c.fill(); c.restore(); }
}
// bound: a body that leaves the ground. Returns [hop, pitch, tail lift]
function bound(t, o = {}) { const { hz = 2.1, lift = 22, pitch = .08 } = o; const a = t * hz; return [Math.abs(Math.sin(a * Math.PI)) * lift, Math.cos(a * Math.PI) * pitch, Math.sin(a * Math.PI) * .35]; }

// ===================== DEER =====================
// One rig, two animals. The mother is the base sheet; the fawn is the same
// sheet with the body block compressed and the head group enlarged, which is
// the whole difference between a deer and a fawn. Facing +x, hooves on y = 0,
// origin on the ground under the belly.
const DEER = {
  // barrel: rump -206, chest 150, belly -140, withers -256
  body: [[150, -171.7], [126, -227.8], [66, -269.3], [-40, -281.5], [-136, -271.8], [-190, -244.9], [-208, -203.4], [-198, -154.6], [-150, -137.6], [-40, -127.8], [70, -137.6], [132, -149.8]],
  haunch: [[-96, -276.6], [-166, -259.6], [-204, -215.6], [-196, -157.1], [-150, -137.6], [-124, -186.4], [-114, -240]],
  // neck: a short thick column, tilted forward, widening into the shoulder
  neck: [[84, -208.3], [104, -252.2], [140, -291.3], [186, -313.2], [224, -305.9], [230, -269.3], [200, -252.2], [162, -237.6], [124, -208.3], [100, -186.4]],
  // head: a compact skull with the ears on top and a blunt muzzle forward
  head: [[165.5, -277.8], [177, -326.5], [209.3, -351.9], [251.1, -356.7], [289.2, -342.8], [306.4, -312.6], [302.5, -282.3], [279.7, -261.6], [235.9, -256.9], [194.1, -263.8], [173.2, -268.5]],
  muzzle: [[283.5, -317.1], [332.9, -308], [340.6, -287], [329.2, -268.5], [285.4, -273.2], [272.1, -293.9]],
  earBack: [[184.6, -340.3], [156, -405.5], [209.3, -347.4]],
  earFront: [[234.1, -345.1], [243.6, -417.1], [264.5, -340.3]],
  eye: [266.3, -317.1],
  brow: [[247.3, -331.2], [266.3, -338.1], [283.5, -328.7]],
  tail: [[-188, -256], [-222, -276], [-240, -254], [-232, -226], [-206, -222], [-190, -232]],
  hips: [[-122, -208.3], [98, -218.1], [-152, -191.2], [70, -205.9]],
  legs: [[-130, -208.3], [110, -218.1], [-162, -188.8], [84, -203.4]],
};
// fawn: the body block is squashed, the head group is not
const FAWN_K = { s: .6, bodyKx: .92, bodyKy: .96, headK: 1.1, legK: 1.0 };
// fawn markings: spots on the barrel and the haunch, and a nose that never
// stops being slightly too big for him
function fawnSpots(c, kx, ky) {
  c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = INKS.cream;
  for (let k = 0; k < 16; k++) {
    const x = (-146 + (k % 8) * 34) * kx + h2(k, 21) * 8, y = (-218 + Math.floor(k / 8) * 30) * ky + h2(k + 40, 21) * 9;
    c.beginPath(); c.ellipse(x, y, 10, 6, .3, 0, TAU2); c.fill();
  }
  c.restore();
}
// deerDraw: the whole animal at one moment.
//   pose = { walk, stride, liftH, air, roll, headUp, blink, sad, alert, tears,
//            tailLift, boil, ground, fade:[far,far,near,near], spots, ink1, second }
//   fawn = false: the mother, at the size given by s
//   fawn = true : the same rig, squashed and big-headed, at FAWN_K.s * s
function deerDraw(c, x, y, s, pose = {}, seed = 11, fawn = false) {
  const P = DEER, K = fawn ? FAWN_K : { s: 1, bodyKx: 1, bodyKy: 1, headK: 1, legK: 1 };
  const sc = s * K.s, kx = K.bodyKx, ky = K.bodyKy;
  const walk = pose.walk ?? 0, stride = pose.stride ?? 26, liftH = pose.liftH ?? 16, boil = pose.boil | 0;
  const ink1 = pose.ink1 || (fawn ? INKS.tan : INKS.orange), second = pose.second === undefined ? INKS.tan : pose.second;
  const lw = fawn ? 3.4 : 4, bodyW = fawn ? 13 : 19, piv = [96 * kx, -206 * ky];
  const bk = (pts) => pts.map(([px, py]) => [px * kx, py * ky]);
  c.save(); c.translate(x, y); c.scale(sc, sc); c.rotate(pose.roll || 0);
  if (pose.air) c.translate(0, -pose.air);
  if (pose.ground) c.translate(0, pose.ground);
  // ---- legs. Length is derived from how high the hip is, so the fawn's
  // shorter, squashed body still stands on the ground with a bent knee.
  const oneLeg = (k, near) => {
    const hx = P.hips[k][0] * kx, hy = P.hips[k][1] * ky;
    const [dx] = hoofAt(walk + ((k % 2 ? .5 : 0) + (near ? 0 : .07)), stride, liftH);
    const L = Math.abs(hy) * .46 * K.legK;
    leg(c, [hx, hy], [hx + dx * (near ? 1.02 : .95), 0], { L1: L * (near ? 1.02 : 1), L2: L, bend: k % 2 ? 1 : -1,
      w: bodyW * (near ? 1.05 : .93), seed: boil + k * 13 + (near ? 60 : 0), al: pose.fade ? pose.fade[k] : (near ? 1 : .78), ink1, second: near ? second : null, cover: near ? .62 : .42 });
  };
  for (let k = 3; k >= 2; k--) oneLeg(k, false);
  // ---- tail, haunch, barrel
  const tl = pose.tailLift || 0, tw = Math.sin(walk * 7 + 1) * .12;
  ink(c, rotAbout(bk(P.tail), -190 * kx, -206 * ky, -tl * .5 + tw), { fill: INKS.cream, second: ink1, seed: boil + 7, lw: lw * .9, hatchOn: false, cover: .5, secondCover: .4 });
  ink(c, bk(P.haunch), { fill: ink1, second, seed: boil + 9, lw: lw * .95, hatchOn: false, cell: 8, cover: .7, secondCover: .26 });
  ink(c, bk(P.body), { fill: ink1, second, seed: boil + 2, lw, hatchOn: false, cell: 9, cover: .66, secondCover: .3, mis: { ink: INKS.plum, dx: 5, dy: -4, a: .28 } });
  light(c, bk(P.body), { al: .38, seed: boil + 4 });
  if (fawn && pose.spots !== false) fawnSpots(c, kx, ky, .78);
  // ---- neck and head as one group, pivoting at the base of the neck, scaled
  // up by headK for the fawn. headUp: +1 nose up, -1 nose down in the grass.
  const a = -(pose.headUp ?? 0) * .34;
  const gp = (pts, ex) => { const q = scaleAbout(pts.map(([px, py]) => [(px - piv[0]) * (ex || K.headK), (py - piv[1]) * (ex || K.headK)]), 0, 0, 1); return rotAbout(q.map(([px, py]) => [px + piv[0], py + piv[1]]), piv[0], piv[1], a); };
  const neck = gp(P.neck), head = gp(P.head), muz = gp(P.muzzle), ebk = gp(P.earBack, K.headK * (pose.alert ? .92 : 1)), efk = gp(P.earFront, K.headK * (pose.alert ? .92 : 1));
  const eye = gp([P.eye])[0], brow = gp(P.brow), cheek = gp([[228, -280]])[0];
  ink(c, neck, { fill: ink1, second, seed: boil + 3, lw, hatchOn: false, cell: 9, cover: .62, secondCover: .26 });
  ink(c, head, { fill: ink1, second, seed: boil + 5, lw, hatchOn: false, cell: 8, cover: .62, secondCover: .3 });
  ink(c, muz, { fill: INKS.cream, second: INKS.tan, seed: boil + 6, lw: lw * .82, hatchOn: false, cover: .4, secondCover: .42, mis: { ink: INKS.plum, dx: 4, dy: -3, a: .3 } });
  c.save(); c.fillStyle = INKS.navy; c.beginPath(); c.ellipse(muz[3][0] + 2, muz[3][1] - 1, 6.4 * K.headK, 4.8 * K.headK, .25, 0, TAU2); c.fill(); c.restore();
  if (fawn) { c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = .26; c.fillStyle = INKS.rose;
    c.beginPath(); c.ellipse(cheek[0], cheek[1], 17, 10, .2, 0, TAU2); c.fill(); c.restore(); }
  // the eye: big, with a bright bead — the fawn gets the biggest one in the film
  const er = (fawn ? 11 : 9.4);
  c.save(); c.translate(eye[0], eye[1]); c.strokeStyle = INKS.navy; c.lineWidth = 3.4; c.lineCap = 'round';
  if (pose.blink) wob(c, [[-er, 1], [0, 4], [er, 1]], 1.4, boil + 31, false, { corner: 3 });
  else { c.beginPath(); c.arc(0, 0, er, -.3, Math.PI * 1.06); c.stroke();
    c.fillStyle = INKS.navy; c.beginPath(); c.arc(1.6, -1.6, er * .72, 0, TAU2); c.fill();
    c.fillStyle = STOCK; c.beginPath(); c.arc(er * .42, -er * .42, er * .26, 0, TAU2); c.fill(); }
  c.restore();
  // brow — the whole emotional range of the film is this one line
  c.save(); c.strokeStyle = INKS.navy; c.lineWidth = 3.6; c.lineCap = 'round';
  const bs = pose.sad ? [[0, 6], [10, 2], [20, 7]] : pose.alert ? [[0, 10], [10, -6], [20, 9]] : [[0, 6], [10, 0], [20, 7]];
  wob(c, brow.map(([bx, by], k) => [bx + bs[k][0] * .4 - 6, by + bs[k][1] * .6]), 1.6, boil + 33, false, { corner: 2.6 });
  c.restore();
  // ears answer to the mood too
  const eb = pose.alert ? .55 : pose.sad ? -.4 : 0;
  ink(c, rotAbout(ebk, piv[0], piv[1], -eb * .35), { fill: INKS.cream, second: INKS.tan, seed: boil + 11, lw: lw * .85, hatchOn: false, cover: .45, secondCover: .3 });
  ink(c, rotAbout(efk, piv[0], piv[1], eb * .2), { fill: INKS.cream, second: INKS.tan, seed: boil + 12, lw: lw * .85, hatchOn: false, cover: .45, secondCover: .3 });
  // antlers (the mother), or the fawn's two buttons
  c.save(); c.strokeStyle = INKS.navy; c.lineCap = 'round'; c.globalAlpha = .92;
  if (!fawn) {
    for (const sd of [0, 1]) {
      const bx = 212 + sd * 26, by = -340, o = a * 1.4;
      c.lineWidth = 8; c.lineCap = 'round';
      wob(c, rotAbout([[bx, by], [bx - 8, by - 38], [bx - 28, by - 62], [bx - 54, by - 74]], piv[0], piv[1], o), 3, seed + 17 + sd, false, { corner: .9, pressure: .5 });
      c.lineWidth = 5.4;
      wob(c, rotAbout([[bx - 16, by - 48], [bx - 12, by - 80]], piv[0], piv[1], o), 3, seed + 19 + sd, false, { corner: .9 });
      wob(c, rotAbout([[bx - 36, by - 66], [bx - 30, by - 96]], piv[0], piv[1], o), 3, seed + 21 + sd, false, { corner: .9 });
    }
  } else {
    c.lineWidth = 3.4;
    const b1 = gp([[196, -300], [184, -322]]), b2 = gp([[248, -302], [254, -326]]);
    wob(c, b1, 2, boil + 18, false, { corner: 2 });
    wob(c, b2, 2, boil + 19, false, { corner: 2 });
  }
  c.restore();
  for (let k = 0; k <= 1; k++) oneLeg(k, true);
  // a soft contact shadow so the animal sits on the meadow instead of floating
  halftone(c, ellPath(0, 4, 190, 26), [-200, -30, 400, 70], { cell: 14, color: INKS.olive, density: .3 * (fawn ? .8 : 1), seed: boil + 90, alpha: .5 });
  // tears
  if (pose.tears) {
    for (let k = 0; k < 2; k++) {
      const tp = ((walk * .5 + k * .5) % 1 + 1) % 1;
      c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = .55 * (1 - tp * .5); c.fillStyle = INKS.teal;
      c.beginPath(); c.ellipse(eye[0] + 7 + k * 6, eye[1] + 12 + tp * 46, 6 - tp * 1.8, 9, .12, 0, TAU2); c.fill(); c.restore();
    }
  }
  c.restore();
}

// ===================== TIGER =====================
// Longer, lower and much heavier than the deer: a deep barrel, a short thick
// neck, a wide head with a cheek ruff, and stripes over the back only.
const TIGER = {
  body: [[150, -181.2], [126, -236.4], [56, -277.2], [-60, -286.8], [-166, -274.8], [-226, -246], [-248, -205.2], [-238, -157.2], [-190, -140.4], [-70, -133.2], [40, -140.4], [126, -152.4]],
  shoulder: [[120, -224.4], [140, -272.4], [196, -284.4], [216, -238.8], [188, -193.2], [136, -193.2]],
  neck: [[152, -231.6], [178, -274.8], [214, -294], [254, -284.4], [252, -246], [208, -229.2], [174, -222]],
  head: [[192.2, -244.9], [202, -290.2], [231.5, -315.7], [275.6, -321.5], [313.2, -305.8], [327.9, -272.4], [321.4, -241.1], [293.6, -219.4], [249.4, -213.6], [213.4, -223.4], [193.9, -233.2]],
  jaw: [[300.2, -250.9], [349.2, -252.8], [355.7, -227.3], [305.1, -221.5]],
  ear: [[215.1, -301.9], [198.7, -349], [239.6, -313.6]],
  ear2: [[292, -313.6], [306.7, -360.8], [321.4, -305.8]],
  eye: [285.4, -268.5],
  hips: [[-190, -205.2], [104, -217.2], [-222, -183.6], [140, -198]],
};
function tigerDraw(c, x, y, s, pose = {}, seed = 41) {
  const walk = pose.walk ?? 0, stride = pose.stride ?? 34, liftH = pose.liftH ?? 18, boil = pose.boil | 0;
  const ink1 = pose.ink1 || INKS.ochre, dark = INKS.indigo, lw = 4.2, hips = TIGER.hips;
  c.save(); c.translate(x, y); c.scale(s, s); c.rotate(pose.roll || 0);
  if (pose.air) c.translate(0, -pose.air);
  if (pose.ground) c.translate(0, pose.ground);
  const oneLeg = (k, near) => {
    const [hx, hy] = hips[k];
    const [dx] = hoofAt(walk + ((k % 2 ? .5 : 0) + (near ? 0 : .07)), stride, liftH);
    const L = Math.abs(hy) * .42;
    leg(c, [hx, hy], [hx + dx * (near ? 1.02 : .95), 0], { L1: L * 1.03, L2: L, bend: k % 2 ? 1 : -1,
      w: near ? 34 : 30, seed: boil + k * 11 + (near ? 80 : 0), al: pose.fade ? pose.fade[k] : (near ? 1 : .82), ink1, second: near ? INKS.tan : null, cover: near ? .58 : .46 });
  };
  for (let k = 3; k >= 2; k--) oneLeg(k, false);
  // the tail, held high and curled like a question mark
  const tq = Math.sin(walk * 6.5 + 1) * 22;
  const tail = [[-238, -212], [-298, -242 + tq * .3], [-350, -202 + tq * .5], [-352, -150 + tq]];
  c.save(); c.lineCap = 'round';
  c.strokeStyle = INKS.navy; c.lineWidth = 36; wob(c, tail, 7, seed + 5, false, { corner: .8 });
  c.strokeStyle = ink1; c.lineWidth = 27; wob(c, tail, 7, seed + 5, false, { corner: .8 });
  c.globalAlpha = .9; c.strokeStyle = dark;
  for (let k = 0; k < 5; k++) { const i0 = Math.min(tail.length - 1, Math.max(0, Math.round((.18 + k * .17) * (tail.length - 1))));
    c.lineWidth = 8; wob(c, [tail[i0], [tail[i0][0] - 5, tail[i0][1] - 22]], 3, seed + 70 + k, false, { corner: 2 }); }
  c.restore();
  ink(c, TIGER.neck, { fill: ink1, second: INKS.tan, seed: boil + 7, lw, hatchOn: false, cell: 9, cover: .6, secondCover: .26 });
  ink(c, TIGER.shoulder, { fill: ink1, second: INKS.tan, seed: boil + 8, lw, hatchOn: false, cell: 9, cover: .6, secondCover: .26 });
  ink(c, TIGER.body, { fill: ink1, second: INKS.tan, seed: boil + 2, lw: lw * 1.1, hatchOn: false, cell: 9, cover: .6, secondCover: .26, mis: { ink: INKS.indigo, dx: 6, dy: -4, a: .26 } });
  light(c, TIGER.body, { al: .36, seed: boil + 4 });
  // stripes: bold strokes over the back and the haunch, stopping at the belly
  c.save(); c.strokeStyle = dark; c.lineCap = 'round';
  for (let k = 0; k < 8; k++) {
    const x0 = -250 + k * 50 + h2(k, 7) * 14, len = 58 + h2(k, 3) * 74, bend = (h2(k, 9) - .5) * 24;
    c.lineWidth = 13 - h2(k, 11) * 7;
    wob(c, [[x0, -256 + bend * .2], [x0 + 14 + bend * .3, -256 + len * .5 + bend], [x0 + 4 + bend * .5, -256 + len]], 5, seed + 30 + k, false, { corner: 1.3, pressure: .45 });
  }
  for (let k = 0; k < 3; k++) { c.lineWidth = 12; wob(c, [[-200 + k * 58, -140], [-190 + k * 58, -120]], 4, seed + 60 + k, false, { corner: 2 }); }
  c.restore();
  // pale chest and belly, then the ruff: fur strokes off the cheeks
  halftone(c, ellPath(20, -140, 130, 30), [-20, -186, 280, 100], { cell: 10, color: INKS.cream, density: .82, seed: seed + 3, alpha: .5 });
  // the ruff: a band of pale fur at the neck, printed, the way a real tiger's
  // cheek fur reads at this size
  halftone(c, curvePath([[172, -212], [188, -248], [224, -258], [244, -236], [234, -210], [196, -200]], true), [156, -272, 120, 100], { cell: 9, color: INKS.cream, density: .55, seed: seed + 5, alpha: .55 });
  c.save(); c.strokeStyle = INKS.tan; c.lineWidth = 6; c.lineCap = 'round'; c.globalAlpha = .8;
  for (let k = 0; k < 6; k++) { const t0 = k / 5, px = 186 + t0 * 58, py = -264 + t0 * 54; wob(c, [[px, py], [px - 22, py + 14]], 3, seed + 92 + k, false, { corner: 3 }); }
  c.restore();
  ink(c, TIGER.ear, { fill: INKS.indigo, seed: boil + 11, lw: 4, hatchOn: false, cover: .55 });
  ink(c, TIGER.ear2, { fill: INKS.indigo, seed: boil + 12, lw: 4, hatchOn: false, cover: .55 });
  ink(c, TIGER.head, { fill: ink1, second: INKS.tan, seed: boil + 13, lw, hatchOn: false, cell: 8, cover: .6, secondCover: .26 });
  ink(c, TIGER.jaw, { fill: INKS.cream, second: INKS.tan, seed: boil + 14, lw: lw * .9, hatchOn: false, cover: .38, secondCover: .38 });
  c.save(); c.strokeStyle = INKS.navy; c.lineWidth = 3.6; c.lineCap = 'round';
  wob(c, [[312, -244], [338, -252], [362, -244]], 2.4, boil + 15, false, { corner: 2 });
  c.fillStyle = INKS.navy; c.beginPath(); c.ellipse(366, -240, 9.5, 7, .2, 0, TAU2); c.fill();
  c.lineWidth = 3.2; wob(c, [[348, -214], [368, -206], [352, -194]], 2.2, boil + 16, false, { corner: 2 });
  c.globalAlpha = .4;
  for (let k = 0; k < 3; k++) wob(c, [[370, -232 + k * 9], [420, -248 + k * 16]], 2.4, boil + 17 + k, false, { corner: 3 });
  c.restore();
  // the eye: a hard almond with a slit — this is the threat
  c.save(); c.translate(TIGER.eye[0], TIGER.eye[1]);
  c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = .95; c.fillStyle = INKS.pale;
  c.beginPath(); c.ellipse(0, 0, 15, 12, -.08, 0, TAU2); c.fill(); c.restore();
  c.strokeStyle = INKS.navy; c.lineWidth = 4; c.beginPath(); c.ellipse(0, 0, 15, 12, -.08, 0, TAU2); c.stroke();
  c.fillStyle = INKS.navy; c.beginPath(); c.ellipse(0, 0, 3.8, 11, -.08, 0, TAU2); c.fill();
  c.lineWidth = 5; wob(c, [[-20, -17], [0, -26], [21, -16]], 2.6, boil + 21, false, { corner: 2 });
  c.lineWidth = 8; wob(c, [[36, -330], [78, -322], [114, -306]], 3.6, boil + 23, false, { corner: 1.6 });
  c.restore();
  for (let k = 0; k <= 1; k++) oneLeg(k, true);
  halftone(c, ellPath(0, 6, 300, 34), [-320, -40, 640, 90], { cell: 16, color: INKS.olive, density: .32, seed: boil + 95, alpha: .5 });
  c.restore();
}

// ===================== BUTTERFLY =====================
// Two rounded wings per side, a slim body, four drawn dots. Small enough to be
// a bright speck, large enough to carry the last third of the film.
function butterflyDraw(c, x, y, s, t, seed = 61, o = {}) {
  const { ink1 = INKS.rose, ink2 = INKS.indigo, body = INKS.navy } = o;
  const flap = Math.sin(t * 11) * .95, open = Math.max(.16, Math.abs(Math.cos(flap * .5)));
  c.save(); c.translate(x, y); c.scale(s, s); c.rotate(Math.sin(t * 3.3) * .16);
  for (const side of [-1, 1]) {
    c.save(); c.scale(side * open, 1);
    const fore = blob(30, -26, 44, 34, seed + side, { amp: .12, rot: -.55 });
    const hind = blob(22, 20, 30, 26, seed + side + 3, { amp: .14, rot: .35 });
    ink(c, fore, { fill: ink1, second: ink2, seed: seed + side, lw: 3.6, hatchOn: false, cover: .74, secondCover: .4, cell: 7, secondDx: -4, secondDy: 4, pressure: .25 });
    ink(c, hind, { fill: ink1, second: ink2, seed: seed + side + 5, lw: 3.4, hatchOn: false, cover: .7, secondCover: .34, cell: 7, secondDx: 4, secondDy: -3, pressure: .25 });
    // the pale band along the wing edge, and the eye spot
    c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = .75; c.strokeStyle = INKS.pale; c.lineWidth = 5;
    wob(c, scaleAbout(fore, 30, -26, .98), 2, seed + 40 + side, true, { corner: 1.2 }); c.restore();
    c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = INKS.pale;
    c.beginPath(); c.ellipse(44, -34, 9, 6.4, -.5, 0, TAU2); c.fill();
    c.beginPath(); c.ellipse(14, 12, 6, 5, .3, 0, TAU2); c.fill(); c.restore();
    c.fillStyle = body; c.beginPath(); c.ellipse(44, -34, 4, 2.8, -.5, 0, TAU2); c.fill();
    c.restore();
  }
  c.save(); c.fillStyle = body;
  c.beginPath(); c.ellipse(3, 12, 6, 24, -.08, 0, TAU2); c.fill();
  c.beginPath(); c.arc(1, -14, 8, 0, TAU2); c.fill();
  c.strokeStyle = body; c.lineWidth = 3.4; c.lineCap = 'round';
  wob(c, [[-2, -18], [-22, -40]], 1.8, seed + 9, false, { corner: 3 });
  wob(c, [[4, -18], [22, -42]], 1.8, seed + 10, false, { corner: 3 });
  c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = ink1;
  c.beginPath(); c.arc(-25, -44, 5.4, 0, TAU2); c.fill(); c.beginPath(); c.arc(25, -46, 5.4, 0, TAU2); c.fill(); c.restore();
  c.restore();
  c.restore();
}

// ===================== WORLD =====================
// inks: the set for one shot — { sky, sky2, sun, cloud, tree, ground, ground2,
// grass, grass2, light, shade, haze, sunY, k }. k scales every screen's
// coverage, which is how a shot goes from noon to dusk without repainting.
//
// Four layers, back to front: sky, treeline, meadow, haze. Each one rides a
// fraction of the camera so the parallax reads, and the grass is a pure
// function of world x, so it stands still while the camera moves.
// sky: a pale printed field, a low sun, and long flat cloud strokes
function sky(c, camX, inks, seed = 3) {
  resetT(c); cam(c, camX * .05, CY, 1);
  const box = [-W * 2, -H, W * 4, HORIZON + 120];
  const skyPath = rectPath(-W * 2, -H, W * 4, HORIZON + 120);
  halftone(c, skyPath, box, { cell: 13, color: inks.sky, density: (x, y) => clamp(.07 + (y / (HORIZON + 120)) * .12, 0, 1) * (inks.k ?? 1), bands: 5, seed: seed + 2 });
  // the sun: a printed disc, then a solid core
  const sx = 1380 + camX * .02, sy = inks.sunY ?? 420;
  halftone(c, circPath(sx, sy, 190), [sx - 210, sy - 210, 420, 420], { cell: 10, color: inks.sun, density: .3 * (inks.k ?? 1), seed: seed + 8 });
  c.save(); c.globalAlpha = .92; c.fillStyle = inks.sun; c.beginPath(); c.arc(sx, sy, 74, 0, TAU2); c.fill(); c.restore();
  const r = rng(seed); c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  for (let k = 0; k < 6; k++) {
    const yy = 120 + k * 74 + r() * 36, wd = 360 + r() * 820, xx = -600 + r() * 2800;
    const p = [[xx, yy], [xx + wd * .4, yy + (r() - .5) * 22], [xx + wd * .72, yy + (r() - .5) * 24], [xx + wd, yy + (r() - .5) * 16]];
    c.globalAlpha = .5; c.strokeStyle = inks.cloud; c.lineWidth = 15 + r() * 18; wob(c, p, 8, seed + k, false, { corner: 2 });
    c.globalAlpha = .22; c.strokeStyle = inks.sky2; c.lineWidth = 9 + r() * 12; wob(c, plus(p, 6, 5), 8, seed + k + 50, false, { corner: 2 });
  }
  c.restore();
}
// treeline: a hedge of soft canopies along the horizon, rebuilt every frame
// from a hash, so it is identical in every frame of a shot
function treeline(c, camX, inks, seed = 13) {
  cam(c, camX * .45, CY, 1);
  const row = (off, scale, dens, cell, alphaV, s2) => {
    c.save(); c.globalAlpha = alphaV;
    for (let k = -40; k < 130; k++) {
      const x = k * (182 * scale) + h2(k, s2) * 130 + off, sc = (.5 + h2(k, s2 + 1) * .95) * scale;
      const y = HORIZON + 30 + h2(k, s2 + 2) * 22 + off * .04;
      const ch = (56 + h2(k, s2 + 6) * 86) * sc, cw = (140 + h2(k, s2 + 7) * 170) * sc;
      const canopy = [[x, y], [x + cw * .16, y - ch * .62], [x + cw * .36, y - ch], [x + cw * .64, y - ch * 1.05], [x + cw * .86, y - ch * .68], [x + cw, y - ch * .16], [x + cw * .5, y + ch * .1]];
      halftone(c, curvePath(canopy, true), bbox(canopy), { cell, color: inks.tree, density: (.26 + h2(k, s2 + 4) * .14) * dens * (inks.k ?? 1), seed: s2 + k });
    }
    c.restore();
  };
  row(-90, .95, .7, 14, .55, seed + 200);        // far row, pale, low
  row(60, 1.2, .92, 12, .92, seed);              // near row, stronger
  // a few trunks, so the hedge sits on the ground
  c.save(); c.globalAlpha = .5; c.strokeStyle = inks.tree; c.lineCap = 'round';
  for (let k = -30; k < 90; k += 2) {
    const x = k * 196 + h2(k, seed) * 96, y = HORIZON + 52 + h2(k, seed + 2) * 14;
    c.lineWidth = 8; wob(c, [[x, y - 20], [x + 3, y + 34]], 3, seed + k, false, { corner: 3 });
  }
  c.restore();
}
// meadow: the ground band, its printed light, and the grass itself
function meadow(c, camX, inks, seed = 17, o = {}) {
  const { density = 1, blade = 1, top = HORIZON + 40, cover = 1 } = o;
  cam(c, camX, CY, 1);
  const gr = rectPath(-4200, top, 9400, H + 500), gbox = [-4200, top, 9400, 900];
  halftone(c, gr, gbox, { cell: 13, color: inks.ground, density: (x, y) => clamp(.14 + ((y - top) / 900) * .1, 0, 1) * (inks.k ?? 1), bands: 5, seed: seed + 1, alpha: cover });
  halftone(c, gr, gbox, { cell: 25, color: inks.ground2, density: (x, y) => clamp(.075 - ((y - top) / 900) * .04, 0, 1) * (inks.k ?? 1), bands: 4, seed: seed + 7, alpha: cover });
  const rows = [[top + 28, .62, .5, 40, seed + 101], [top + 160, .9, .58, 58, seed + 202], [top + 340, 1.3, .76, 80, seed + 303]];
  for (const [ry, sz, dark, len, sd] of rows) {
    c.save(); c.lineCap = 'round'; c.globalAlpha = cover;
    for (let k = -320; k < 560; k++) {
      if (h2(k, sd) > .56 * density) continue;
      const x = k * 30 + h2(k, sd + 1) * 24, y0 = ry + h2(k, sd + 2) * 50;
      const hh = (len * sz) * (.5 + h2(k, sd + 3) * .9) * blade;
      c.strokeStyle = h2(k, sd + 4) > .7 ? inks.grass2 : inks.grass;
      c.globalAlpha = cover * (.38 + dark * .44); c.lineWidth = 4.4 * sz;
      const lean = (h2(k, sd + 5) - .5) * 34 * sz;
      wob(c, [[x, y0], [x + lean * .35, y0 - hh * .55], [x + lean, y0 - hh]], 3.8 * sz, sd + k, false, { corner: 1.6, pressure: .55 });
    }
    c.restore();
  }
}
// haze: warm light sitting between the ground and everything on it
function haze(c, camX, inks, al = .3) {
  resetT(c); cam(c, camX, CY, 1);
  halftone(c, rectPath(-2600, HORIZON - 120, 9400, 260), [-2600, HORIZON - 120, 9400, 260], { cell: 24, color: inks.haze,
    density: (x, y) => Math.sin(clamp((y - (HORIZON - 120)) / 260, 0, 1) * Math.PI) * .2, bands: 5, seed: 44, alpha: al });
}
// dust: puffs kicked up behind a running animal
function dust(c, x, y, t, seed, o = {}) {
  const { n = 10, spread = 120, al = .4, color = INKS.tan, size = 30 } = o;
  c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = color;
  for (let k = 0; k < n; k++) {
    const life = ((t * 1.8 + h2(k, seed)) % 1);
    const px = x - life * spread * (.6 + h2(k, seed + 1) * .8), py = y - life * 56 * (.4 + h2(k, seed + 2));
    c.globalAlpha = al * (1 - life) * (.4 + h2(k, seed + 3) * .6);
    c.beginPath(); c.arc(px, py, size * (.35 + h2(k, seed + 4) * .9) * (1 + life), 0, TAU2); c.fill();
  }
  c.restore();
}
// speed: strokes along the direction of travel, only where the drawing wants them
function speedLines(c, x, y, dir, n, len, seed, color = INKS.tan, al = .24) {
  // not straight needles: a few short tapered gusts of wind, drawn with the
  // brush, at the height of the animal's body
  const r = rng(seed);
  c.save(); c.globalAlpha = al;
  for (let k = 0; k < n; k++) {
    const yy = y + (r() - .5) * 110, xx = x + (r() - .5) * 150, L = len * (.3 + r() * .5);
    brush(c, [[xx, yy], [xx - dir * L * .5, yy - 6 - r() * 10], [xx - dir * L, yy - 2 + r() * 8]], { w: 7 + r() * 5, color, p: 1, seed: seed + k * 3, amp: 2.6, taper: 1 });
  }
  c.restore();
}
