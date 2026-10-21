/* =====================================================================
   السلم والثعبان — منطق اللعبة
   لوحة ١٠٠ مربع، سلالم وثعابين، حتى ٤ لاعبين مع خصوم آليين.
   ===================================================================== */
(() => {
  'use strict';

  /* ============================ الثوابت ============================ */
  // [من, إلى, اتجاه الانحناء] — الاتجاه يُحسّن شكل الثعبان وتفاديه للسلالم
  const SNAKES = [
    [32, 10, -1], [36, 6, 1], [48, 26, -1], [62, 18, 1],
    [88, 57, 1], [95, 72, -1], [97, 78, -1]
  ];
  const LADDERS = [
    [3, 22], [8, 30], [28, 55], [58, 77], [75, 96], [80, 99]
  ];

  const JUMPS = {};
  LADDERS.forEach(([from, to]) => { JUMPS[from] = { to, up: true }; });
  SNAKES.forEach(([from, to]) => { JUMPS[from] = { to, up: false }; });

  const COLORS = ['#ff5d73', '#38bdf8', '#fbbf24', '#34d399'];
  const PALETTES = [
    { body: ['#63e6c2', '#18b593', '#0b6b5b'], spots: 'rgba(4, 63, 52, .35)', head: '#1fcf9f' },
    { body: ['#b9a0ff', '#7c5cf5', '#3b2696'], spots: 'rgba(44, 25, 120, .35)', head: '#8768ff' },
    { body: ['#ffb4a8', '#f4664f', '#8f2417'], spots: 'rgba(120, 30, 15, .3)', head: '#ff7b63' },
    { body: ['#93e3ff', '#33a9e0', '#0f567c'], spots: 'rgba(8, 65, 95, .32)', head: '#48b8ea' },
    { body: ['#ffe28f', '#f2b431', '#8a5a00'], spots: 'rgba(120, 80, 0, .28)', head: '#ffc94f' },
    { body: ['#a9f5a3', '#4fbf63', '#1b6430'], spots: 'rgba(20, 90, 35, .3)', head: '#67d07a' },
    { body: ['#ffc6e4', '#e05fa0', '#7c1d4d'], spots: 'rgba(100, 20, 60, .3)', head: '#f279b6' }
  ];

  const PIPS = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8]
  };

  const AR_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const STORE_SETUP = 'sbl.setup.v1';
  const STORE_SOUND = 'sbl.sound.v1';

  /* ============================ الحالة ============================ */
  const state = {
    players: [],
    turn: 0,
    busy: false,
    over: false,
    started: false,
    sound: true,
    botTimer: null,
    config: {
      count: 2,
      rows: [
        { name: 'لاعب ١', bot: false },
        { name: 'لاعب ٢', bot: true },
        { name: 'لاعب ٣', bot: true },
        { name: 'لاعب ٤', bot: true }
      ]
    }
  };

  /* ============================ العناصر ============================ */
  const $ = (id) => document.getElementById(id);
  const boardEl = $('board');
  const cellsEl = $('cells');
  const numsEl = $('nums');
  const tokensEl = $('tokens');
  const art = $('art');
  const dieEl = $('die');
  const rollBtn = $('rollBtn');
  const playersList = $('playersList');
  const logEl = $('log');
  const turnDot = $('turnDot');
  const turnName = $('turnName');
  const turnStatus = $('turnStatus');
  const setupModal = $('setupModal');
  const winModal = $('winModal');
  const playerSetup = $('playerSetup');
  const countRow = $('countRow');
  const startBtn = $('startBtn');
  const soundBtn = $('soundBtn');
  const hintEl = $('hint');
  const winTitle = $('winTitle');
  const winSub = $('winSub');
  const againBtn = $('againBtn');

  let cardNodes = [];

  /* ============================ أدوات ============================ */
  const ar = (n) => String(n).replace(/\d/g, (d) => AR_DIGITS[+d]);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function store(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) { /* تجاهل */ }
  }
  function load(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch (_) { return null; }
  }

  /* ============================ الصوت ============================ */
  let actx = null;

  function initAudio() {
    if (!actx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        try { actx = new AC(); } catch (_) { actx = null; }
      }
    }
    if (actx && actx.state === 'suspended') actx.resume();
  }

  function beep(freq, dur = 0.12, type = 'sine', gain = 0.06, when = 0) {
    if (!state.sound || !actx) return;
    const t = actx.currentTime + when;
    const osc = actx.createOscillator();
    const g = actx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(actx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  function sound(name) {
    if (!state.sound) return;
    initAudio();
    if (!actx) return;
    switch (name) {
      case 'dice':
        beep(720, 0.055, 'square', 0.035);
        beep(480, 0.055, 'square', 0.035, 0.075);
        beep(860, 0.07, 'square', 0.035, 0.15);
        break;
      case 'step':
        beep(540, 0.06, 'sine', 0.045);
        break;
      case 'ladder':
        [523, 659, 784, 1047].forEach((f, i) => beep(f, 0.16, 'sine', 0.055, i * 0.1));
        break;
      case 'snake':
        [430, 340, 255].forEach((f, i) => beep(f, 0.2, 'sawtooth', 0.03, i * 0.13));
        break;
      case 'bump':
        beep(190, 0.18, 'triangle', 0.05);
        break;
      case 'win':
        [523, 659, 784, 1047, 1319, 1047, 1319].forEach((f, i) =>
          beep(f, 0.24, 'triangle', 0.065, i * 0.13));
        break;
    }
  }

  /* ============================ الرقعة ============================ */
  function cellGeometry(n) {
    const row = Math.floor((n - 1) / 10);
    const c = (n - 1) % 10;
    return { row, c, col: row % 2 === 0 ? c + 1 : 10 - c };
  }

  function buildBoard() {
    const cells = document.createDocumentFragment();
    const nums = document.createDocumentFragment();
    for (let n = 1; n <= 100; n++) {
      const { row, col } = cellGeometry(n);
      const gridRow = String(10 - row);
      const gridCol = String(col);

      const cell = document.createElement('div');
      cell.className = 'cell' + (n === 100 ? ' finish' : '') + (n === 1 ? ' start' : '');
      cell.style.gridRow = gridRow;
      cell.style.gridColumn = gridCol;
      cells.appendChild(cell);

      const numCell = document.createElement('div');
      numCell.className = 'num-cell' + (n === 100 ? ' finish' : '') + (n === 1 ? ' start' : '');
      numCell.style.gridRow = gridRow;
      numCell.style.gridColumn = gridCol;
      const num = document.createElement('span');
      num.className = 'num';
      num.textContent = ar(n);
      numCell.appendChild(num);
      nums.appendChild(numCell);
    }
    cellsEl.replaceChildren(cells);
    numsEl.replaceChildren(nums);
  }

  function cellPoint(n) {
    const w = boardEl.clientWidth;
    const h = boardEl.clientHeight;
    const row = Math.floor((n - 1) / 10);
    const c = (n - 1) % 10;
    const fx = (row % 2 === 0 ? (9.5 - c) : (c + 0.5)) / 10;
    const fy = (9.5 - row) / 10;
    return { x: fx * w, y: fy * h, w, h };
  }

  /* ---------------------------- الرسم ---------------------------- */
  function drawArt() {
    const w = boardEl.clientWidth;
    const h = boardEl.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    art.width = Math.round(w * dpr);
    art.height = Math.round(h * dpr);
    const ctx = art.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const cw = w / 10;
    const ch = h / 10;
    const cs = Math.min(cw, ch);

    LADDERS.forEach(([from, to]) => {
      drawLadder(ctx, cellPoint(from), cellPoint(to), cs, w, h);
    });
    SNAKES.forEach(([from, to, bend], i) => {
      drawSnake(ctx, cellPoint(from), cellPoint(to), cs, w, h,
        PALETTES[i % PALETTES.length], i, bend || 1);
    });
  }

  function strokeSeg(ctx, a, b, color, width, cap = 'round') {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = cap;
    ctx.stroke();
  }

  function drawLadder(ctx, A, B, cs, w, h) {
    const dx = B.x - A.x;
    const dy = B.y - A.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const px = -uy;
    const py = ux;

    const inset = cs * 0.3;
    const a = { x: A.x + ux * inset, y: A.y + uy * inset };
    const b = { x: B.x - ux * inset, y: B.y - uy * inset };
    const half = cs * 0.17;
    const r1a = { x: a.x + px * half, y: a.y + py * half };
    const r1b = { x: b.x + px * half, y: b.y + py * half };
    const r2a = { x: a.x - px * half, y: a.y - py * half };
    const r2b = { x: b.x - px * half, y: b.y - py * half };
    const segLen = Math.hypot(b.x - a.x, b.y - a.y);
    const rungs = Math.max(3, Math.round(segLen / (cs * 0.42)));

    ctx.save();
    // ظل خفيف
    ctx.translate(cs * 0.05, cs * 0.09);
    strokeSeg(ctx, r1a, r1b, 'rgba(25, 45, 60, .16)', half * 0.8);
    strokeSeg(ctx, r2a, r2b, 'rgba(25, 45, 60, .16)', half * 0.8);
    ctx.restore();

    // الدرجات
    for (let i = 1; i < rungs; i++) {
      const t = i / rungs;
      const cx = a.x + (b.x - a.x) * t;
      const cy = a.y + (b.y - a.y) * t;
      const p1 = { x: cx + px * half, y: cy + py * half };
      const p2 = { x: cx - px * half, y: cy - py * half };
      strokeSeg(ctx, p1, p2, '#8a5525', half * 0.44);
      strokeSeg(ctx, p1, p2, '#ecc48c', half * 0.26);
    }

    // القضبان
    [[r1a, r1b], [r2a, r2b]].forEach(([p, q]) => {
      strokeSeg(ctx, p, q, '#7c4a1d', half * 0.56);
      strokeSeg(ctx, p, q, '#f3d09b', half * 0.36);
      const offx = px * half * 0.14;
      const offy = py * half * 0.14;
      strokeSeg(ctx, { x: p.x + offx, y: p.y + offy }, { x: q.x + offx, y: q.y + offy },
        'rgba(255, 255, 255, .55)', half * 0.09);
    });
  }

  function snakeWidth(t, bodyW) {
    // أعرض عند الرقبة، ويتحول الذيل إلى رفيع
    return bodyW * (1 - 0.8 * Math.pow(t, 1.25));
  }

  function drawSnake(ctx, A, B, cs, w, h, pal, index = 0, bend = 1) {
    const dx = B.x - A.x;
    const dy = B.y - A.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const dirx = dx / len;
    const diry = dy / len;
    const amp = clamp(len * 0.17, cs * 0.45, cs * 1.75) * bend;
    const pad = cs * 0.7;

    const c1 = {
      x: clamp(A.x + dirx * len * 0.33 + nx * amp, pad, w - pad),
      y: clamp(A.y + diry * len * 0.33 + ny * amp, pad, h - pad)
    };
    const c2 = {
      x: clamp(A.x + dirx * len * 0.67 - nx * amp * 0.9, pad, w - pad),
      y: clamp(A.y + diry * len * 0.67 - ny * amp * 0.9, pad, h - pad)
    };

    const N = 130;
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const it = 1 - t;
      const a = it * it * it;
      const b = 3 * it * it * t;
      const c = 3 * it * t * t;
      const d = t * t * t;
      pts.push({
        x: a * A.x + b * c1.x + c * c2.x + d * B.x,
        y: a * A.y + b * c1.y + c * c2.y + d * B.y
      });
    }

    const bodyW = cs * 0.54;
    const grad = ctx.createLinearGradient(A.x, A.y, B.x, B.y);
    grad.addColorStop(0, pal.body[0]);
    grad.addColorStop(0.5, pal.body[1]);
    grad.addColorStop(1, pal.body[2]);

    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // ظل ناعم
    ctx.save();
    ctx.translate(cs * 0.04, cs * 0.1);
    for (let i = 0; i < N; i += 2) {
      const t = i / N;
      strokeSeg(ctx, pts[i], pts[i + 2] || pts[i + 1], 'rgba(10, 30, 40, .10)',
        snakeWidth(t, bodyW) * 0.95);
    }
    ctx.restore();

    // الحد الداكن
    for (let i = 0; i < N; i++) {
      const t = i / N;
      strokeSeg(ctx, pts[i], pts[i + 1], '#08382f', snakeWidth(t, bodyW) + cs * 0.055);
    }
    // الجسم
    for (let i = 0; i < N; i++) {
      const t = i / N;
      strokeSeg(ctx, pts[i], pts[i + 1], grad, snakeWidth(t, bodyW));
    }
    // لمعة على الظهر
    for (let i = 2; i < N - 4; i += 2) {
      const t = i / N;
      const p = pts[i];
      const q = pts[i + 2];
      const ox = q.y - p.y;
      const oy = -(q.x - p.x);
      const olen = Math.hypot(ox, oy) || 1;
      const width = snakeWidth(t, bodyW);
      const off = width * 0.18;
      strokeSeg(ctx,
        { x: p.x + (ox / olen) * off, y: p.y + (oy / olen) * off },
        { x: q.x + (ox / olen) * off, y: q.y + (oy / olen) * off },
        'rgba(255, 255, 255, .24)', width * 0.15);
    }
    // النقوش
    for (let i = 12; i < N - 14; i += 8) {
      const prev = pts[i - 3];
      const next = pts[i + 3];
      const ang = Math.atan2(next.y - prev.y, next.x - prev.x);
      const width = snakeWidth(i / N, bodyW);
      ctx.save();
      ctx.translate(pts[i].x, pts[i].y);
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.ellipse(0, 0, width * 0.17, width * 0.32, 0, 0, Math.PI * 2);
      ctx.fillStyle = pal.spots;
      ctx.fill();
      ctx.restore();
    }

    // اتجاه الرأس: امتداد المنحنى عند نقطة البداية
    const ref = pts[Math.floor(N * 0.09)];
    const angle = Math.atan2(A.y - ref.y, A.x - ref.x);
    const headX = A.x + Math.cos(angle) * bodyW * 0.2;
    const headY = A.y + Math.sin(angle) * bodyW * 0.2;
    ctx.translate(headX, headY);
    ctx.rotate(angle);

    // اللسان
    const tongueBase = bodyW * 0.6;
    ctx.beginPath();
    ctx.moveTo(tongueBase, 0);
    ctx.lineTo(bodyW * 1.02, 0);
    ctx.strokeStyle = '#ff4d6d';
    ctx.lineWidth = cs * 0.05;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bodyW * 1.0, 0);
    ctx.lineTo(bodyW * 1.2, -cs * 0.075);
    ctx.moveTo(bodyW * 1.0, 0);
    ctx.lineTo(bodyW * 1.2, cs * 0.075);
    ctx.stroke();

    // الرأس
    ctx.beginPath();
    ctx.ellipse(0, 0, bodyW * 0.72, bodyW * 0.55, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#08382f';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, 0, bodyW * 0.63, bodyW * 0.47, 0, 0, Math.PI * 2);
    ctx.fillStyle = pal.head;
    ctx.fill();
    // تظليل خفيف أسفل الرأس
    ctx.beginPath();
    ctx.ellipse(0, bodyW * 0.1, bodyW * 0.56, bodyW * 0.32, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, .10)';
    ctx.fill();

    // العيون
    [-1, 1].forEach((side) => {
      const ex = bodyW * 0.22;
      const ey = side * bodyW * 0.24;
      ctx.beginPath();
      ctx.arc(ex, ey, bodyW * 0.16, 0, Math.PI * 2);
      ctx.fillStyle = '#fdfdf6';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ex + bodyW * 0.05, ey, bodyW * 0.08, 0, Math.PI * 2);
      ctx.fillStyle = '#111827';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ex + bodyW * 0.085, ey - bodyW * 0.045, bodyW * 0.03, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    });

    // فتحتا الأنف
    [-1, 1].forEach((side) => {
      ctx.beginPath();
      ctx.arc(bodyW * 0.52, side * bodyW * 0.1, bodyW * 0.035, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(4, 40, 34, .7)';
      ctx.fill();
    });

    ctx.restore();
  }

  /* ============================ القطع ============================ */
  const CLUSTERS = {
    1: [[0, 0]],
    2: [[-0.3, -0.16], [0.3, 0.16]],
    3: [[-0.34, -0.27], [0.34, -0.27], [0, 0.3]],
    4: [[-0.31, -0.27], [0.31, -0.27], [-0.31, 0.29], [0.31, 0.29]]
  };

  function buildTokens() {
    tokensEl.innerHTML = '';
    state.players.forEach((p) => {
      const token = document.createElement('div');
      token.className = 'token';
      token.dataset.id = String(p.id);
      token.style.setProperty('--c', p.color);
      token.style.color = p.color === '#fbbf24' ? '#1f2937' : '#fff';
      const label = document.createElement('span');
      label.textContent = ar(p.id + 1);
      token.appendChild(label);
      tokensEl.appendChild(token);
      p.tokenEl = token;
    });
  }

  function layoutTokens() {
    if (!state.players.length) return;
    const groups = new Map();
    state.players.forEach((p) => {
      const list = groups.get(p.pos) || [];
      list.push(p);
      groups.set(p.pos, list);
    });
    const size = state.players[0].tokenEl ? state.players[0].tokenEl.offsetWidth : 24;
    state.players.forEach((p) => {
      if (!p.tokenEl) return;
      const group = groups.get(p.pos);
      const idx = group.indexOf(p);
      const offsets = CLUSTERS[group.length] || CLUSTERS[4];
      const [ox, oy] = offsets[Math.min(idx, offsets.length - 1)] || [0, 0];
      const center = cellPoint(p.pos);
      const x = center.x + ox * size - size / 2;
      const y = center.y + oy * size - size / 2;
      p.tokenEl.style.transform = `translate(${x}px, ${y}px)`;
    });
  }

  /* ============================ واجهة اللاعبين ============================ */
  function renderPlayers() {
    playersList.innerHTML = '';
    cardNodes = state.players.map((p) => {
      const card = document.createElement('div');
      card.className = 'pcard';
      card.style.setProperty('--pc', p.color);

      const avatar = document.createElement('div');
      avatar.className = 'pavatar';
      avatar.textContent = ar(p.id + 1);
      avatar.style.color = p.color === '#fbbf24' ? '#1f2937' : '#fff';

      const main = document.createElement('div');
      main.className = 'pmain';
      const name = document.createElement('div');
      name.className = 'pname';
      name.append(p.name);
      if (p.bot) {
        const tag = document.createElement('small');
        tag.textContent = 'آلي';
        name.appendChild(tag);
      }
      const track = document.createElement('div');
      track.className = 'ptrack';
      const fill = document.createElement('div');
      fill.className = 'pfill';
      track.appendChild(fill);
      main.append(name, track);

      const pos = document.createElement('div');
      pos.className = 'ppos';

      card.append(avatar, main, pos);
      playersList.appendChild(card);
      return { card, fill, pos };
    });
    updatePlayers();
  }

  function updatePlayers() {
    state.players.forEach((p, i) => {
      const node = cardNodes[i];
      if (!node) return;
      const pct = ((p.pos - 1) / 99) * 100;
      node.fill.style.width = `${clamp(pct, 0, 100)}%`;
      node.pos.innerHTML = `<b>${ar(p.pos)}</b>`;
      node.card.classList.toggle('turn', i === state.turn && !state.over);
      node.card.classList.toggle('winner', !!p.winner);
    });
    state.players.forEach((p) => {
      if (!p.tokenEl) return;
      const isTurn = state.players[state.turn] === p && !state.over;
      p.tokenEl.classList.toggle('active', isTurn);
      p.tokenEl.classList.toggle('still', reducedMotion());
    });
  }

  function updateTurnCard() {
    if (!state.players.length) return;
    const p = state.players[state.turn];
    turnDot.style.background = p.color;
    turnDot.style.boxShadow = `0 0 0 4px ${p.color}33, 0 0 18px ${p.color}`;
    turnName.textContent = p.name;

    if (state.over) {
      turnStatus.textContent = 'انتهت اللعبة';
    } else if (state.busy) {
      turnStatus.textContent = 'النرد يتدحرج…';
    } else if (p.bot) {
      turnStatus.textContent = 'يفكر…';
    } else {
      turnStatus.textContent = 'دورك';
    }
    turnStatus.style.color = p.bot ? '#7ef0cd' : '#ffce5c';
  }

  function updateRollBtn() {
    if (!state.players.length) {
      rollBtn.disabled = true;
      return;
    }
    const p = state.players[state.turn];
    const disabled = state.busy || state.over || p.bot || !setupModal.classList.contains('hidden');
    rollBtn.disabled = disabled;
    rollBtn.textContent = state.over ? 'انتهت اللعبة' : state.busy ? 'جارٍ اللعب…' : p.bot ? 'دور الخصم…' : 'ارمِ النرد';
    hintEl.style.visibility = p.bot && !state.over ? 'hidden' : 'visible';
  }

  function updateUI() {
    updateTurnCard();
    updatePlayers();
    updateRollBtn();
  }

  /* ============================ السجل ============================ */
  function addLog(text, icon = '•', tone = '', name = '') {
    const item = document.createElement('div');
    item.className = 'log-item' + (tone ? ' ' + tone : '');
    const ico = document.createElement('span');
    ico.className = 'ico';
    ico.textContent = icon;
    const body = document.createElement('span');
    if (name) {
      const b = document.createElement('b');
      b.textContent = name + ' ';
      body.appendChild(b);
    }
    body.appendChild(document.createTextNode(text));
    item.append(ico, body);
    logEl.prepend(item);
    while (logEl.children.length > 70) logEl.lastChild.remove();
  }

  function logPlayer(p, text, icon, tone) {
    addLog(text, icon, tone, p.name);
  }

  /* ============================ النرد ============================ */
  function setDie(value) {
    if (!dieEl.children.length) {
      for (let i = 0; i < 9; i++) dieEl.appendChild(document.createElement('i'));
    }
    const on = PIPS[value] || PIPS[1];
    Array.from(dieEl.children).forEach((cell, i) => {
      cell.classList.toggle('on', on.includes(i));
    });
    dieEl.setAttribute('aria-label', `النرد: ${ar(value)}`);
  }

  async function animateDie(value) {
    dieEl.classList.remove('roll');
    void dieEl.offsetWidth;
    dieEl.classList.add('roll');
    const duration = reducedMotion() ? 160 : 560;
    const t0 = performance.now();
    while (performance.now() - t0 < duration) {
      setDie(1 + Math.floor(Math.random() * 6));
      await sleep(reducedMotion() ? 40 : 65);
    }
    setDie(value);
    setTimeout(() => dieEl.classList.remove('roll'), 400);
  }

  /* ============================ الحركة ============================ */
  async function stepMove(player, to) {
    const step = to > player.pos ? 1 : -1;
    const steps = Math.abs(to - player.pos);
    if (steps > 8) {
      player.pos = to;
      layoutTokens();
      await sleep(reducedMotion() ? 200 : 750);
      updatePlayers();
      return;
    }
    for (let n = 0; n < steps; n++) {
      player.pos += step;
      layoutTokens();
      sound('step');
      await sleep(reducedMotion() ? 70 : n === steps - 1 ? 280 : 190);
    }
    updatePlayers();
  }

  async function slideJump(player, to) {
    player.pos = to;
    const token = player.tokenEl;
    if (token) token.style.transitionDuration = reducedMotion() ? '0ms' : '780ms';
    layoutTokens();
    await sleep(reducedMotion() ? 120 : 800);
    if (token) token.style.transitionDuration = '';
    updatePlayers();
  }

  /* ============================ تدفق الدور ============================ */
  function currentPlayer() {
    return state.players[state.turn];
  }

  function endTurn(player, extra) {
    if (state.over) return;
    if (extra) {
      logPlayer(player, 'يحصل على دور إضافي بفضل الرمية ٦', '🔁');
    } else {
      state.turn = (state.turn + 1) % state.players.length;
    }
    state.busy = false;
    updateUI();
    scheduleBot();
  }

  function scheduleBot() {
    clearTimeout(state.botTimer);
    if (state.over || !state.started) return;
    const p = currentPlayer();
    if (!p || !p.bot) return;
    state.botTimer = setTimeout(() => {
      if (!state.busy && !state.over && state.players[state.turn].bot) doRoll();
    }, rand(800, 1300));
  }

  async function doRoll() {
    if (state.busy || state.over || !state.started) return;
    if (!setupModal.classList.contains('hidden')) return;

    const player = currentPlayer();
    state.busy = true;
    updateUI();

    const value = 1 + Math.floor(Math.random() * 6);
    sound('dice');
    await animateDie(value);
    player.rolls++;
    const extra = value === 6;

    logPlayer(player, extra ? `رمى ${ar(value)} — رمية مزدوجة!` : `رمى ${ar(value)}`, '🎲', 'event');

    const target = player.pos + value;

    if (target > 100) {
      sound('bump');
      logPlayer(player, `تجاوز المربع ١٠٠ — يحتاج ${ar(100 - player.pos)} بالضبط`, '🎯', 'down');
      await sleep(520);
      endTurn(player, extra);
      return;
    }

    await stepMove(player, target);

    const jump = JUMPS[target];
    if (jump) {
      await sleep(220);
      if (jump.up) {
        sound('ladder');
        logPlayer(player, `صعد السلم من ${ar(target)} إلى ${ar(jump.to)}`, '🪜', 'up');
      } else {
        sound('snake');
        logPlayer(player, `لدغه ثعبان! هبط من ${ar(target)} إلى ${ar(jump.to)}`, '🐍', 'down');
      }
      await slideJump(player, jump.to);
      if (jump.to === 100) { win(player); return; }
    }

    if (player.pos === 100) {
      win(player);
      return;
    }

    endTurn(player, extra);
  }

  /* ============================ الفوز ============================ */
  function win(player) {
    state.over = true;
    state.busy = false;
    player.pos = 100;
    player.winner = true;
    layoutTokens();
    updateUI();
    logPlayer(player, 'وصل إلى المربع ١٠٠ وفاز باللعبة!', '🏆', 'win');
    sound('win');
    launchConfetti();

    winTitle.textContent = `${player.name} يفوز!`;
    winSub.textContent = player.bot
      ? `${player.name} وصل إلى المربع ١٠٠ بعد ${ar(player.rolls)} رمية. حاول مرة أخرى!`
      : `أحسنت! وصلت إلى المربع ١٠٠ بعد ${ar(player.rolls)} رمية. 🎉`;

    setTimeout(() => {
      winModal.classList.remove('hidden');
      againBtn.focus({ preventScroll: true });
    }, reducedMotion() ? 250 : 900);
  }

  /* ============================ القصاصات ============================ */
  const conf = {
    canvas: $('confetti'),
    ctx: null,
    parts: [],
    raf: 0,
    w: 0,
    h: 0
  };
  conf.ctx = conf.canvas.getContext('2d');

  function sizeConfetti() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    conf.w = window.innerWidth;
    conf.h = window.innerHeight;
    conf.canvas.width = Math.round(conf.w * dpr);
    conf.canvas.height = Math.round(conf.h * dpr);
    conf.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function launchConfetti() {
    if (reducedMotion()) return;
    sizeConfetti();
    const colors = ['#ffce5c', '#ff5d73', '#38bdf8', '#34d399', '#a78bfa', '#fb923c'];
    for (let i = 0; i < 170; i++) {
      conf.parts.push({
        x: rand(0, conf.w),
        y: rand(-conf.h * 0.45, -10),
        vx: rand(-1.6, 1.6),
        vy: rand(2.2, 5.4),
        w: rand(5, 11),
        h: rand(7, 15),
        rot: rand(0, Math.PI * 2),
        vr: rand(-0.18, 0.18),
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: Math.random() < 0.25 ? 'circle' : 'rect'
      });
    }
    if (!conf.raf) tickConfetti();
  }

  function tickConfetti() {
    const ctx = conf.ctx;
    ctx.clearRect(0, 0, conf.w, conf.h);
    conf.parts.forEach((p) => {
      p.vy += 0.045;
      p.vx *= 0.995;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      ctx.restore();
    });
    conf.parts = conf.parts.filter((p) => p.y < conf.h + 40);
    if (conf.parts.length) {
      conf.raf = requestAnimationFrame(tickConfetti);
    } else {
      conf.raf = 0;
      ctx.clearRect(0, 0, conf.w, conf.h);
    }
  }

  /* ============================ إعداد اللعبة ============================ */
  function normalizeConfig() {
    const cfg = state.config;
    cfg.count = clamp(Number(cfg.count) || 2, 2, 4);
    const fallback = ['لاعب ١', 'لاعب ٢', 'لاعب ٣', 'لاعب ٤'];
    for (let i = 0; i < 4; i++) {
      if (!cfg.rows[i]) cfg.rows[i] = { name: fallback[i], bot: i > 0 };
      if (typeof cfg.rows[i].name !== 'string' || !cfg.rows[i].name.trim()) cfg.rows[i].name = fallback[i];
      cfg.rows[i].bot = !!cfg.rows[i].bot;
    }
    cfg.rows[0].bot = false; // اللاعب الأول بشري دائمًا
  }

  function renderSetup() {
    const cfg = state.config;
    countRow.querySelectorAll('.count-btn').forEach((b) => {
      const on = Number(b.dataset.count) === cfg.count;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    playerSetup.innerHTML = '';
    for (let i = 0; i < cfg.count; i++) {
      const row = cfg.rows[i];
      const wrap = document.createElement('div');
      wrap.className = 'prow';
      wrap.style.setProperty('--pc', COLORS[i]);

      const swatch = document.createElement('span');
      swatch.className = 'swatch';

      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 16;
      input.value = row.name;
      input.placeholder = `اسم اللاعب ${ar(i + 1)}`;
      input.setAttribute('aria-label', `اسم اللاعب ${ar(i + 1)}`);
      input.addEventListener('input', () => {
        row.name = input.value;
        store(STORE_SETUP, cfg);
      });

      const seg = document.createElement('div');
      seg.className = 'seg';
      const human = document.createElement('button');
      human.type = 'button';
      human.textContent = i === 0 ? 'أنت' : 'لاعب';
      const bot = document.createElement('button');
      bot.type = 'button';
      bot.textContent = 'آلي';
      const sync = () => {
        human.classList.toggle('on', !row.bot);
        bot.classList.toggle('on', row.bot);
        human.setAttribute('aria-pressed', String(!row.bot));
        bot.setAttribute('aria-pressed', String(row.bot));
        input.disabled = false;
      };
      human.addEventListener('click', () => {
        row.bot = false;
        store(STORE_SETUP, cfg);
        sync();
      });
      bot.addEventListener('click', () => {
        if (i === 0) { // اللاعب الأول يبقى بشريًا
          return;
        }
        row.bot = true;
        store(STORE_SETUP, cfg);
        sync();
      });
      if (i === 0) bot.disabled = true;
      bot.title = i === 0 ? 'اللاعب الأول يلعب دائمًا' : 'دع الحاسوب يلعب';
      seg.append(human, bot);
      sync();

      wrap.append(swatch, input, seg);
      playerSetup.appendChild(wrap);
    }
  }

  function startGame() {
    initAudio();
    normalizeConfig();
    const cfg = state.config;

    clearTimeout(state.botTimer);
    state.players = [];
    for (let i = 0; i < cfg.count; i++) {
      const name = cfg.rows[i].name.trim() || `لاعب ${ar(i + 1)}`;
      state.players.push({
        id: i,
        name,
        bot: i === 0 ? false : cfg.rows[i].bot,
        color: COLORS[i],
        pos: 1,
        rolls: 0,
        winner: false,
        tokenEl: null
      });
    }

    buildTokens();
    renderPlayers();
    state.turn = 0;
    state.busy = false;
    state.over = false;
    state.started = true;
    logEl.innerHTML = '';
    setDie(1);
    winModal.classList.add('hidden');
    setupModal.classList.add('hidden');
    updateUI();
    requestAnimationFrame(() => {
      layoutTokens();
      drawArt();
    });

    addLog('بدأت اللعبة! الجميع عند المربع ١ — الفوز لمن يصل ١٠٠ أولًا.', '🚩', 'event');
    const first = currentPlayer();
    if (first) addLog(`الدور الأول لـ ${first.name}`, '▶️', 'event');
    store(STORE_SETUP, cfg);
    scheduleBot();
  }

  function restartGame() {
    if (!state.started) {
      setupModal.classList.remove('hidden');
      return;
    }
    initAudio();
    clearTimeout(state.botTimer);
    state.players.forEach((p) => {
      p.pos = 1;
      p.rolls = 0;
      p.winner = false;
      if (p.tokenEl) p.tokenEl.classList.remove('winner');
    });
    state.turn = 0;
    state.busy = false;
    state.over = false;
    winModal.classList.add('hidden');
    setDie(1);
    layoutTokens();
    updateUI();
    logEl.innerHTML = '';
    addLog('أُعيدت اللعبة — الجميع يعود إلى المربع ١', '🔄', 'event');
    scheduleBot();
  }

  /* ============================ الأحداث ============================ */
  countRow.addEventListener('click', (e) => {
    const btn = e.target.closest('.count-btn');
    if (!btn) return;
    const inputs = playerSetup.querySelectorAll('input');
    inputs.forEach((inp, i) => {
      if (state.config.rows[i]) state.config.rows[i].name = inp.value;
    });
    state.config.count = Number(btn.dataset.count);
    normalizeConfig();
    renderSetup();
    store(STORE_SETUP, state.config);
  });

  startBtn.addEventListener('click', startGame);
  function humanRoll() {
    if (!state.started || state.over || state.busy) return;
    const p = currentPlayer();
    if (!p || p.bot) return;
    initAudio();
    doRoll();
  }
  rollBtn.addEventListener('click', humanRoll);
  dieEl.addEventListener('click', humanRoll);
  dieEl.style.cursor = 'pointer';

  $('restartBtn').addEventListener('click', restartGame);
  $('againBtn').addEventListener('click', restartGame);
  $('changeBtn').addEventListener('click', () => {
    winModal.classList.add('hidden');
    state.started = false;
    renderSetup();
    setupModal.classList.remove('hidden');
  });

  soundBtn.addEventListener('click', () => {
    state.sound = !state.sound;
    soundBtn.textContent = state.sound ? '🔊' : '🔇';
    soundBtn.classList.toggle('off', !state.sound);
    soundBtn.setAttribute('aria-label', state.sound ? 'إيقاف الصوت' : 'تشغيل الصوت');
    store(STORE_SOUND, state.sound);
    if (state.sound) { initAudio(); sound('step'); }
  });

  document.addEventListener('keydown', (e) => {
    if (e.code !== 'Space') return;
    const el = e.target;
    if (el instanceof Element && el.closest('input, textarea, select, button, [contenteditable="true"]')) return;
    if (!state.started || state.over || state.busy) return;
    if (!setupModal.classList.contains('hidden') || !winModal.classList.contains('hidden')) return;
    const p = currentPlayer();
    if (!p || p.bot) return;
    e.preventDefault();
    humanRoll();
  });

  window.addEventListener('resize', () => {
    drawArt();
    layoutTokens();
  });

  // حفظ الحالة إذا تغيّر حجم الرقعة فقط
  if (window.ResizeObserver) {
    let lastW = 0;
    let lastH = 0;
    const ro = new ResizeObserver(() => {
      const w = boardEl.clientWidth;
      const h = boardEl.clientHeight;
      if (w === lastW && h === lastH) return;
      lastW = w;
      lastH = h;
      drawArt();
      layoutTokens();
    });
    ro.observe(boardEl);
  }

  /* ============================ التهيئة ============================ */
  function init() {
    const savedSetup = load(STORE_SETUP);
    if (savedSetup && typeof savedSetup === 'object') {
      if (Number.isFinite(savedSetup.count)) state.config.count = savedSetup.count;
      if (Array.isArray(savedSetup.rows)) {
        savedSetup.rows.forEach((row, i) => {
          if (i > 3 || !row) return;
          if (typeof row.name === 'string') state.config.rows[i].name = row.name;
          state.config.rows[i].bot = !!row.bot;
        });
      }
    }
    normalizeConfig();

    const savedSound = load(STORE_SOUND);
    if (typeof savedSound === 'boolean') state.sound = savedSound;
    soundBtn.textContent = state.sound ? '🔊' : '🔇';
    soundBtn.classList.toggle('off', !state.sound);
    soundBtn.setAttribute('aria-label', state.sound ? 'إيقاف الصوت' : 'تشغيل الصوت');

    buildBoard();
    setDie(1);
    renderSetup();
    updateUI();

    requestAnimationFrame(() => {
      drawArt();
      layoutTokens();
    });

    // محاكاة رقعة مبدئية خلف نافذة البداية
    addLog('مرحبًا! اضبط اللاعبين ثم اضغط «ابدأ اللعب».', '👋', 'event');
  }

  init();
})();
