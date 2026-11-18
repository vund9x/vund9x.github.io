"use strict";

// ===== constants =====
const TAU = Math.PI * 2;
const DURATION = 20.0;
const T_GROW = [0.7, 5.6], T_GARLAND = [6.4, 8.6], T_BALLS = [7.4, 9.5];
const T_LIGHTS = [8.3, 11.3], T_GIFTS = [10.0, 11.5], T_STAR = 11.8, T_MSG = 13.0;
const GROUND = -1.12, Y0 = -0.76, Y1 = 1.24, ROT_SPEED = 0.31;
const NEEDLE = 0, SNOW = 1, CONE = 2, TRUNK = 3, TINSEL = 4, BALL = 5;
const LIGHT = 6, GIFT = 7, RIBBON = 8;
const WHITE = [1, 1, 1], SNOW_COL = [0.88, 0.94, 1.0], GOLD = [1.0, 0.84, 0.28];
const BAUBLE_GOLD = [1.0, 0.78, 0.24], RED = [0.96, 0.20, 0.24], WARM = [1.0, 0.88, 0.50];
const GREEN_BOX = [0.18, 0.78, 0.34], BLUE_BOX = [0.22, 0.48, 0.98], SILVER = [0.86, 0.90, 0.98];
const RAMP = " .,:;-~=+*^oxv%&#W@";
const COLS = 88, ROWS = 74, ASPECT = 9 / 14;
const STRIDE = 17;  // x y z | nx ny nz | r g b | kind t0 base | cx cy cz | phase pop

function clamp(x, lo, hi) { return x < lo ? lo : x > hi ? hi : x; }
function smooth(x) { const t = clamp(x, 0, 1); return t * t * (3 - 2 * t); }

function makeRng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    uni: (lo, hi) => lo + (hi - lo) * next(),
    norm: () => Math.sqrt(-2 * Math.log(Math.max(next(), 1e-12))) * Math.cos(TAU * next()),
  };
}

function fibSphere(n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const z = 1 - 2 * (i + 0.5) / n, r = Math.sqrt(Math.max(1 - z * z, 0)), phi = (i + 0.5) * 2.39996323;
    out.push([Math.cos(phi) * r, z, Math.sin(phi) * r]);
  }
  return out;
}

function envelope(y) {
  const u = clamp((y - Y0) / (Y1 - Y0), 0, 1);
  const tiers = 1 + 0.07 * Math.sin(u * TAU * 5) * (1 - u);
  return 0.96 * Math.pow(1 - u, 0.9) * tiers;
}

function growTime(y) {
  const u = clamp((y - GROUND) / (Y1 - GROUND), 0, 1);
  return T_GROW[0] + (T_GROW[1] - T_GROW[0]) * u;
}

class Parts {
  constructor() { this.buf = []; }
  add(x, y, z, nx, ny, nz, col, kind, t0, base, cen, phase, pop) {
    const l = Math.max(Math.hypot(nx, ny, nz), 1e-8);
    const c = cen || [x, y, z];
    this.buf.push(x, y, z, nx / l, ny / l, nz / l, col[0], col[1], col[2], kind, t0, base,
      c[0], c[1], c[2], phase || 0, pop ? 1 : 0);
  }
  compile() { return { D: Float32Array.from(this.buf), n: this.buf.length / STRIDE }; }
}

function build() {
  const rng = makeRng(7);
  const q = new Parts();
  const tips = [];

  // needles: whorls of drooping branches, denser and longer at the bottom
  const yStart = Y0 + 0.02, yEnd = Y1 - 0.08;
  for (let i = 0; i < 25; i++) {
    const y = yStart + (yEnd - yStart) * i / 24;
    const u = (y - Y0) / (Y1 - Y0);
    const R = envelope(y) + 0.05;
    const nb = Math.trunc(7 + 12 * (1 - u));
    const tg = growTime(y);
    for (let b = 0; b < nb; b++) {
      const a = TAU * (b + 0.5 * rng.next()) / nb + i * 0.77;
      const L = R * rng.uni(0.85, 1.08);
      const n = Math.trunc(26 + 240 * L);
      const dx = Math.cos(a), dz = Math.sin(a), sx = -dz, sz = dx;
      for (let k = 0; k < n; k++) {
        const s = Math.pow(rng.next(), 0.65);
        const sp = (0.025 + 0.09 * s) * rng.norm();
        const sl = s * L;
        const px = dx * sl + sx * sp, pz = dz * sl + sz * sp;
        const py = y + 0.06 * sl - 0.20 * sl * sl + 0.012 * rng.norm();
        let nx = dx * 0.75 + 0.3 * rng.norm(), ny = 0.55 + 0.3 * rng.norm(), nz = dz * 0.75 + 0.3 * rng.norm();
        const nl = Math.max(Math.hypot(nx, ny, nz), 1e-8);
        nx /= nl; ny /= nl; nz /= nl;
        const ao = (0.30 + 0.70 * Math.pow(s, 1.3)) * rng.uni(0.75, 1.1);
        const snow = s > 0.5 && rng.next() < 0.07 * s && ny > 0.5;
        const g = rng.next();
        const green = [0.10 + 0.12 * g, 0.48 + 0.38 * g, 0.18 + 0.14 * g];
        q.add(px, py, pz, nx, ny, nz, snow ? SNOW_COL : green, snow ? SNOW : NEEDLE,
          tg + 0.45 * s, snow ? 1 : ao);
      }
      const tl = 0.93 * L;
      tips.push([dx * tl, y + 0.06 * tl - 0.20 * tl * tl, dz * tl]);
    }
  }

  // dark inner cone so nothing shows through the branches
  for (let k = 0; k < 4200; k++) {
    const y = Y0 + (Y1 - 0.1 - Y0) * rng.next(), phi = rng.next() * TAU;
    const r = 0.6 * envelope(y);
    q.add(Math.cos(phi) * r, y, Math.sin(phi) * r, Math.cos(phi), 0.3, Math.sin(phi),
      [0.06, 0.28, 0.10], CONE, growTime(y), 0.55);
  }

  // trunk
  for (let k = 0; k < 1000; k++) {
    const y = GROUND + rng.next() * (Y0 + 0.1 - GROUND), phi = rng.next() * TAU;
    const bark = 0.75 + 0.25 * Math.sign(Math.sin(phi * 30 + y * 5));
    q.add(Math.cos(phi) * 0.08, y, Math.sin(phi) * 0.08, Math.cos(phi), 0, Math.sin(phi),
      [0.42 * bark, 0.24 * bark, 0.12 * bark], TRUNK, growTime(y), 1);
  }

  // tinsel garland: a gold spiral drooping in swags between hanging points
  for (let pass = 0; pass < 3; pass++) {
    for (let k = 0; k < 1800; k++) {
      const u = k / 1799;
      const yg = Y0 + 0.15 + (Y1 - Y0 - 0.45) * u;
      const ag = TAU * 3.6 * u + 0.9;
      const swag = -0.07 * Math.abs(Math.sin(ag * 2.5));
      const rg = envelope(yg) + 0.07;
      const lx = Math.cos(ag) * rg, ly = yg + swag, lz = Math.sin(ag) * rg;
      q.add(lx + 0.016 * rng.norm(), ly + 0.016 * rng.norm(), lz + 0.016 * rng.norm(),
        Math.cos(ag) + 0.6 * rng.norm(), 0.3 + 0.6 * rng.norm(), Math.sin(ag) + 0.6 * rng.norm(),
        GOLD, TINSEL, T_GARLAND[0] + u * (T_GARLAND[1] - T_GARLAND[0]), 1, null, rng.next() * TAU);
    }
  }

  // baubles: red, gold and silver spheres nestled on the tree silhouette
  const sphere = fibSphere(160);
  for (let k = 0; k < 34; k++) {
    const u = (k + rng.next()) / 34;
    const y = Y0 + 0.08 + u * (Y1 - Y0 - 0.38);
    const a = k * 2.39996 + rng.next() * 0.4;
    const er = envelope(y) + 0.02;
    const c = [Math.cos(a) * er, y - 0.03, Math.sin(a) * er];
    const rad = 0.058 + 0.032 * (1 - u);
    const col = k % 2 === 0 ? RED : (k % 4 === 1 ? BAUBLE_GOLD : SILVER);
    const t0 = T_BALLS[0] + rng.next() * (T_BALLS[1] - T_BALLS[0]);
    for (const p of sphere) {
      q.add(c[0] + p[0] * rad, c[1] + p[1] * rad, c[2] + p[2] * rad, p[0], p[1], p[2],
        col, BALL, t0, 1, c, 0, true);
    }
  }

  // fairy lights on the branch tips
  const order = tips.map((_, i) => i);
  const nPick = Math.min(170, order.length);
  for (let i = 0; i < nPick; i++) {
    const j = i + Math.floor(rng.next() * (order.length - i));
    const tmp = order[i]; order[i] = order[j]; order[j] = tmp;
  }
  const bulb = fibSphere(16);
  for (let i = 0; i < nPick; i++) {
    const c = tips[order[i]];
    const t0 = T_LIGHTS[0] + rng.next() * (T_LIGHTS[1] - T_LIGHTS[0]);
    const col = rng.next() < 0.8 ? WARM : [1.0, 0.95, 0.85];
    const ph = rng.next() * TAU;
    for (const p of bulb) {
      q.add(c[0] + p[0] * 0.03, c[1] + p[1] * 0.03, c[2] + p[2] * 0.03, p[0], p[1], p[2],
        col, LIGHT, t0, 1, c, ph, false);
    }
  }

  // presents: boxes with a crossed ribbon and a bow
  const gifts = [
    [0.3, 0.96, 0.25, 0.20, 0.24, 0.4, RED, GOLD],
    [1.4, 1.02, 0.23, 0.23, 0.22, 0.9, BLUE_BOX, SILVER],
    [2.5, 0.95, 0.28, 0.16, 0.22, 1.0, GOLD, RED],
    [3.6, 1.00, 0.22, 0.22, 0.22, 0.3, RED, WHITE],
    [4.6, 0.95, 0.25, 0.19, 0.25, 0.1, GREEN_BOX, RED],
    [5.5, 1.02, 0.22, 0.20, 0.21, 0.7, BLUE_BOX, GOLD],
  ];
  const FACE_N = [[0, 1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]];
  const loop = fibSphere(64);
  gifts.forEach(([a, dist, w, h, d, rot, body, rib], gi) => {
    const areas = [w * d, h * d, h * d, h * w, h * w];
    const sum = areas.reduce((p, c) => p + c, 0);
    const ca = Math.cos(rot), sa = Math.sin(rot);
    const cxg = Math.cos(a) * dist, czg = Math.sin(a) * dist;
    const tGift = T_GIFTS[0] + (gi / gifts.length) * (T_GIFTS[1] - T_GIFTS[0]);
    const cen = [cxg, GROUND + h * 0.5, czg];
    const m = Math.trunc(2600 * sum);
    for (let k = 0; k < m; k++) {
      let r = rng.next() * sum, face = 0;
      while (face < 4 && r > areas[face]) { r -= areas[face]; face++; }
      const fa = rng.next() - 0.5, fb = rng.next() - 0.5;
      const ly = face === 0 ? h : (fb + 0.5) * h;
      let lx, lz;
      if (face === 0) { lx = fa * w; lz = fb * d; }
      else if (face === 1) { lx = w / 2; lz = fa * d; }
      else if (face === 2) { lx = -w / 2; lz = fa * d; }
      else if (face === 3) { lx = fa * w; lz = d / 2; }
      else { lx = fa * w; lz = -d / 2; }
      const onX = Math.abs(lx) < 0.024, onZ = Math.abs(lz) < 0.024;
      const ribbon = face === 0 ? (onX || onZ) : face <= 2 ? onZ : onX;
      const n = FACE_N[face];
      q.add(lx * ca - lz * sa + cxg, GROUND + ly, lx * sa + lz * ca + czg,
        n[0] * ca - n[2] * sa, n[1], n[0] * sa + n[2] * ca,
        ribbon ? rib : body, ribbon ? RIBBON : GIFT, tGift, 1, cen, 0, true);
    }
    // crossed bow loops on top of each gift
    for (const ba of [0, Math.PI * 0.5]) {
      const ang = ba + rot, cb = Math.cos(ang), sb = Math.sin(ang);
      const bo = [cb * 0.035, h + 0.03, sb * 0.035];
      const bcen = [cxg + bo[0], GROUND + bo[1], czg + bo[2]];
      for (const p of loop) {
        const bx = p[0] * 0.045, by = p[1] * 0.026, bz = p[2] * 0.024;
        q.add(bx * cb - bz * sb + bcen[0], by + bcen[1], bx * sb + bz * cb + bcen[2],
          p[0], p[1], p[2], rib, RIBBON, tGift + 0.05, 1, bcen, 0, true);
      }
    }
  });

  return q.compile();
}

// camera: slight downward pitch, tree rotates around the y axis
const PITCH = 0.15, CP = Math.cos(PITCH), SP = Math.sin(PITCH);
const K1 = ROWS * 0.40 / ASPECT, K2 = ROWS * 0.40;
const PR = [0, 0, 0];

function project(x, y, z, rot, out) {
  const ca = Math.cos(rot), sa = Math.sin(rot);
  const X = x * ca - z * sa, Yv = y - 0.12, Z = x * sa + z * ca;
  const yp = Yv * CP - Z * SP, zp = Yv * SP + Z * CP + 4.85;
  const scale = 2.65 / Math.max(zp, 0.25);
  out[0] = COLS * 0.5 + X * scale * K1;
  out[1] = ROWS * 0.44 - yp * scale * K2;
  out[2] = zp;
  return out;
}

class Background {
  constructor() {
    const rng = makeRng(42);
    this.horizon = Math.floor(ROWS * 0.53);
    const ns = Math.floor(COLS * ROWS * 0.038);
    this.sr = new Int32Array(ns); this.sc = new Int32Array(ns); this.sch = new Uint8Array(ns);
    this.sph = new Float32Array(ns); this.ssp = new Float32Array(ns);
    for (let i = 0; i < ns; i++) {
      this.sr[i] = Math.floor(rng.next() * (this.horizon + 4));
      this.sc[i] = Math.floor(rng.next() * COLS);
      const p = rng.next();
      this.sch[i] = p < 0.45 ? 43 : p < 0.75 ? 42 : 46;
      this.sph[i] = rng.next() * TAU;
      this.ssp[i] = rng.uni(1.2, 3.2);
    }
    const nf = 115;
    this.fx = new Float32Array(nf); this.fy = new Float32Array(nf); this.fvy = new Float32Array(nf);
    this.fvx = new Float32Array(nf); this.fph = new Float32Array(nf); this.fch = new Uint8Array(nf);
    for (let i = 0; i < nf; i++) {
      this.fx[i] = rng.uni(0, COLS); this.fy[i] = rng.uni(0, ROWS);
      this.fvy[i] = rng.uni(2.2, 5.4); this.fvx[i] = rng.uni(-0.8, 0.8);
      this.fph[i] = rng.next() * TAU;
      const p = rng.next();
      this.fch[i] = p < 0.35 ? 43 : p < 0.80 ? 42 : 46;
    }
    const GX = 130, GZ = 110;
    this.g = new Float32Array(GX * GZ * 3);
    let o = 0;
    for (let a = 0; a < GZ; a++) {
      for (let b = 0; b < GX; b++) {
        this.g[o++] = -4.2 + 8.4 * b / (GX - 1) + rng.uni(-0.025, 0.025);
        this.g[o++] = GROUND;
        this.g[o++] = -2.6 + 8.0 * a / (GZ - 1) + rng.uni(-0.025, 0.025);
      }
    }
  }

  paint(ch, col, t, rot) {
    // perspective ground plane
    const gr = rot * 0.35;
    for (let o = 0; o < this.g.length; o += 3) {
      project(this.g[o], this.g[o + 1], this.g[o + 2], gr, PR);
      const ix = Math.round(PR[0]), iy = Math.round(PR[1]), gz = PR[2];
      if (iy < this.horizon || iy >= ROWS || ix < 0 || ix >= COLS || gz <= 0.6) continue;
      const f = clamp(1.30 - gz / 8.5, 0.16, 0.62), idx = iy * COLS + ix;
      ch[idx] = f > 0.40 ? 45 : 46;
      col[idx * 3] = 0.55 * f; col[idx * 3 + 1] = 0.62 * f; col[idx * 3 + 2] = 0.78 * f;
    }
    // twinkling stars (keep the top-right timer clear)
    for (let i = 0; i < this.sr.length; i++) {
      const r = this.sr[i], c = this.sc[i];
      if (r >= this.horizon || (r < 4 && c >= COLS - 16)) continue;
      const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * this.ssp[i] + this.sph[i]));
      const idx = r * COLS + c;
      ch[idx] = this.sch[i];
      col[idx * 3] = 0.78 * tw; col[idx * 3 + 1] = 0.85 * tw; col[idx * 3 + 2] = 0.98 * tw;
    }
    // falling snowflakes
    for (let i = 0; i < this.fx.length; i++) {
      let x = (this.fx[i] + this.fvx[i] * t + 0.8 * Math.sin(t * 1.1 + this.fph[i])) % COLS;
      let y = (this.fy[i] + this.fvy[i] * t) % ROWS;
      if (x < 0) x += COLS;
      if (y < 0) y += ROWS;
      const sx = clamp(Math.round(x), 0, COLS - 1), sy = clamp(Math.round(y), 0, ROWS - 1);
      if (sy < 4 && sx >= COLS - 16) continue;
      const f = 0.60 + 0.40 * Math.sin(t * 2.5 + this.fph[i]), idx = sy * COLS + sx;
      ch[idx] = this.fch[i];
      col[idx * 3] = 0.86 * f; col[idx * 3 + 1] = 0.92 * f; col[idx * 3 + 2] = 1.0 * f;
    }
  }
}

function inPoly(px, py, poly) {
  let res = false;
  for (let i = 0, n = poly.length; i < n; i++) {
    const [x1, y1] = poly[i], [x2, y2] = poly[(i + 1) % n];
    if ((y1 > py) !== (y2 > py) && px < (x2 - x1) * (py - y1) / (y2 - y1 + 1e-9) + x1) res = !res;
  }
  return res;
}

function drawStar(ch, col, cx, cy, size, t, power, flash) {
  // thin rays first, then a filled five-pointed star on top;
  // when it lights up it bursts white with long rays, then settles to gold
  const tint = GOLD.map((c) => c + (1 - c) * flash);
  power = power * (1 + 1.6 * flash);
  for (let k = 0; k < 8; k++) {
    const ang = k * TAU / 8 + 0.10 * Math.sin(t * 0.7);
    if (Math.sin(ang) < -0.2) continue;  // no rays down into the tree
    const horiz = Math.abs(Math.sin(ang)) < 0.25 ? 0.55 : 1.0;
    const reach = size * (2.6 + 0.6 * Math.sin(t * 3 + k * 1.3)) * (k % 2 === 0 ? 1 : 0.75)
      * horiz * (1 + 1.6 * flash);
    const deg = ((ang * 180 / Math.PI) % 180 + 180) % 180;
    const glyph = "-|/\\".charCodeAt(Math.round(deg / 45) % 4);
    for (let s = size * 1.15; s < reach; s += 0.5) {
      const y = Math.round(cy - Math.sin(ang) * s), x = Math.round(cx + Math.cos(ang) * s * ASPECT);
      if (y < 0 || y >= ROWS || x < 0 || x >= COLS) continue;
      const idx = y * COLS + x;
      if (Math.max(col[idx * 3], col[idx * 3 + 1], col[idx * 3 + 2]) >= 0.75) continue;
      const f = Math.max(0, 1 - s / reach) * horiz * power * 0.65;
      ch[idx] = glyph;
      col[idx * 3] = tint[0] * f; col[idx * 3 + 1] = tint[1] * f; col[idx * 3 + 2] = tint[2] * f;
    }
  }
  // filled five-pointed star polygon
  const verts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * TAU / 10, r = i % 2 === 0 ? size : size * 0.42;
    verts.push([cx + Math.cos(a) * r * ASPECT, cy + Math.sin(a) * r]);
  }
  const ya = Math.max(0, Math.floor(cy - size - 1)), yb = Math.min(ROWS, Math.ceil(cy + size + 2));
  const xa = Math.max(0, Math.floor(cx - size / ASPECT - 1));
  const xb = Math.min(COLS, Math.ceil(cx + size / ASPECT + 2));
  const lvl = Math.min(1.35, power);
  for (let y = ya; y < yb; y++) {
    for (let x = xa; x < xb; x++) {
      if (!inPoly(x, y, verts)) continue;
      const dist = Math.hypot((x - cx) / ASPECT, y - cy) / Math.max(size, 0.5);
      const idx = y * COLS + x;
      ch[idx] = dist < 0.52 ? 64 : 35;
      col[idx * 3] = tint[0] * lvl; col[idx * 3 + 1] = tint[1] * lvl; col[idx * 3 + 2] = tint[2] * lvl;
    }
  }
  for (let i = 0; i < 10; i += 2) {  // crisp outer tips
    const ix = Math.round(verts[i][0]), iy = Math.round(verts[i][1]);
    if (ix < 0 || ix >= COLS || iy < 0 || iy >= ROWS) continue;
    const idx = iy * COLS + ix;
    ch[idx] = 42;
    col[idx * 3] = tint[0] * lvl; col[idx * 3 + 1] = tint[1] * lvl; col[idx * 3 + 2] = tint[2] * lvl;
  }
}

function makeFrameState() {
  return {
    ch: new Uint8Array(COLS * ROWS), col: new Float32Array(COLS * ROWS * 3),
    zbuf: new Float32Array(COLS * ROWS), win: new Int32Array(COLS * ROWS),
  };
}

function stepFrame(scene, bg, t, message, F) {
  const { ch, col, zbuf, win } = F;
  ch.fill(0); col.fill(0);
  const rot = t * ROT_SPEED;
  bg.paint(ch, col, t, rot);

  const ca = Math.cos(rot), sa = Math.sin(rot);
  const D = scene.D, N = scene.n;
  zbuf.fill(Infinity); win.fill(-1);
  let lightsActive = 0;

  // pass 1: project every visible point, keep the frontmost one per cell (z-buffer)
  for (let i = 0, o = 0; i < N; i++, o += STRIDE) {
    const t0 = D[o + 10];
    if (t < t0) continue;
    if (D[o + 9] === LIGHT) lightsActive++;
    let x = D[o], y = D[o + 1], z = D[o + 2];
    if (D[o + 16] > 0) {  // pop-in: scale out from the centre
      const s = smooth((t - t0) / 0.35);
      const cx = D[o + 12], cy = D[o + 13], cz = D[o + 14];
      x = cx + (x - cx) * s; y = cy + (y - cy) * s; z = cz + (z - cz) * s;
    }
    const X = x * ca - z * sa, Yv = y - 0.12, Z = x * sa + z * ca;
    const zp = Yv * SP + Z * CP + 4.85;
    if (zp <= 0.5) continue;
    const yp = Yv * CP - Z * SP, scale = 2.65 / Math.max(zp, 0.25);
    const ix = Math.round(COLS * 0.5 + X * scale * K1), iy = Math.round(ROWS * 0.44 - yp * scale * K2);
    if (ix < 0 || ix >= COLS || iy < 0 || iy >= ROWS) continue;
    const idx = iy * COLS + ix;
    if (zp < zbuf[idx]) { zbuf[idx] = zp; win[idx] = i; }
  }

  // pass 2: shade only the winners
  const RL = RAMP.length - 1;
  for (let idx = 0; idx < COLS * ROWS; idx++) {
    const i = win[idx];
    if (i < 0) continue;
    const o = i * STRIDE;
    const kind = D[o + 9], base = D[o + 11], ph = D[o + 15];
    const n0 = D[o + 3], ny = D[o + 4], n2 = D[o + 5];
    const nx = n0 * ca - n2 * sa, nz = n0 * sa + n2 * ca;
    const nd = clamp(nx * 0.42 + ny * 0.56 - nz * 0.71, 0, 1);
    let lum = base * (0.28 + 0.72 * nd);
    if (kind === CONE) lum = base * (0.18 + 0.25 * nd);
    else if (kind === SNOW) lum = 0.72 + 0.28 * nd;
    else if (kind === TINSEL) lum = 0.65 + 0.35 * Math.sin(t * 4.5 + ph) * 0.5 + 0.35 * nd;
    else if (kind === BALL) lum = 0.38 + 0.62 * Math.pow(nd, 1.3);
    else if (kind === GIFT) lum = 0.42 + 0.58 * nd;
    else if (kind === RIBBON) lum = 0.62 + 0.38 * nd;
    else if (kind === LIGHT) lum = 0.55 + 0.65 * (0.55 + 0.45 * Math.sin(t * 6 + ph));

    let r = D[o + 6], g = D[o + 7], b = D[o + 8];
    if (kind === NEEDLE || kind === SNOW || kind === TRUNK) {  // growth frontier frost flash
      const fw = clamp(1 - (t - D[o + 10]) / 0.38, 0, 1);
      r = r * (1 - 0.85 * fw) + 0.85 * fw; g = g * (1 - 0.85 * fw) + 0.85 * fw;
      b = b * (1 - 0.85 * fw) + 0.85 * fw;
      lum = Math.max(lum, 1.05 * fw);
    }
    const wl = clamp(lum, 0, 1), k = clamp(lum, 0.12, 1.2);
    let code = RAMP.charCodeAt(clamp(Math.floor(wl * RL), 1, RL));
    if (kind === LIGHT || kind === RIBBON) code = 64;
    else if (kind === GIFT) code = wl > 0.65 ? 35 : 37;
    ch[idx] = code;
    col[idx * 3] = clamp(r * k, 0, 1); col[idx * 3 + 1] = clamp(g * k, 0, 1);
    col[idx * 3 + 2] = clamp(b * k, 0, 1);
  }

  // top star: dim silhouette first, then it bursts white and settles gold
  if (t >= T_GROW[1] - 0.5) {
    project(0, Y1 + 0.13, 0, rot, PR);
    const on = t >= T_STAR ? smooth((t - T_STAR) / 0.3) : 0;
    const flash = t >= T_STAR ? Math.pow(clamp(1 - (t - T_STAR) / 1.0, 0, 1), 2) : 0;
    const sz = (1.6 + 1.5 * on) * (1 + 0.05 * Math.sin(t * 3));
    drawStar(ch, col, Math.round(PR[0]), Math.round(PR[1]), sz, t, 0.25 + 0.85 * on, flash);
  }

  // typed holiday message near the bottom
  if (t > T_MSG && message) {
    const row = ROWS - 9;
    const x0 = Math.max(0, Math.floor((COLS - message.length) / 2));
    const shown = Math.min(message.length, Math.floor((t - T_MSG) * 10));
    for (let rr = row - 1; rr <= row + 1; rr++) {
      for (let c = Math.max(x0 - 3, 0); c < Math.min(COLS, x0 + shown + 3); c++) ch[rr * COLS + c] = 0;
    }
    const tints = [RED, GOLD, GREEN_BOX];
    for (let i = 0; i < shown; i++) {
      const c = x0 + i;
      if (message[i] === " " || c < 0 || c >= COLS) continue;
      const tint = tints[(Math.floor(i / 2) + Math.floor(t * 1.5)) % 3];
      const lum = 0.85 + 0.25 * Math.sin(t * 5 + i), idx = row * COLS + c;
      ch[idx] = message.charCodeAt(i) & 127;
      col[idx * 3] = clamp(tint[0] * lum, 0, 1); col[idx * 3 + 1] = clamp(tint[1] * lum, 0, 1);
      col[idx * 3 + 2] = clamp(tint[2] * lum, 0, 1);
    }
  }

  let letters = 0;
  for (let i = 0; i < ch.length; i++) if (ch[i] > 0) letters++;
  return { rot: ((rot * 180 / Math.PI) % 360 + 360) % 360, lights: Math.floor(lightsActive / 16), letters };
}

class AsciiRenderer {
  // glyphs are drawn on a text layer, then a cheap multi-scale bloom is added on top
  constructor(canvas, author) {
    this.cv = canvas; this.ctx = canvas.getContext("2d");
    this.tcv = document.createElement("canvas"); this.tctx = this.tcv.getContext("2d");
    this.s1 = document.createElement("canvas"); this.s2 = document.createElement("canvas");
    this.author = author;
    this.cache = new Map();
    this.chars = [];
    for (let i = 0; i < 128; i++) this.chars.push(String.fromCharCode(i));
  }

  resize(cssW, dpr) {
    this.cw = Math.max(4, Math.floor(cssW * dpr / COLS));
    this.chh = Math.round(this.cw * 14 / 9);
    this.w = COLS * this.cw; this.h = ROWS * this.chh;
    for (const c of [this.cv, this.tcv]) { c.width = this.w; c.height = this.h; }
    this.s1.width = Math.max(1, Math.floor(this.w / 3)); this.s1.height = Math.max(1, Math.floor(this.h / 3));
    this.s2.width = Math.max(1, Math.floor(this.w / 8)); this.s2.height = Math.max(1, Math.floor(this.h / 8));
    this.font = `${Math.round(this.cw * 1.66)}px "DejaVu Sans Mono", Consolas, Menlo, "Courier New", monospace`;
    this.hudPx = Math.max(10, Math.round(this.chh * 1.0));
  }

  style(key) {
    let s = this.cache.get(key);
    if (!s) {
      const r = Math.round((key >> 12) * 255 / 63), g = Math.round(((key >> 6) & 63) * 255 / 63);
      s = `rgb(${r},${g},${Math.round((key & 63) * 255 / 63)})`;
      this.cache.set(key, s);
    }
    return s;
  }

  draw(F, t, info) {
    const { cw, chh, w, h, tctx: tc, ctx: m } = this;
    tc.clearRect(0, 0, w, h);
    tc.font = this.font; tc.textAlign = "center"; tc.textBaseline = "middle";
    const q6 = (v) => { const x = Math.floor(v * 63 + 0.5); return x < 0 ? 0 : x > 63 ? 63 : x; };
    let last = -1;
    const yOff = chh * 0.5 + chh * 0.04;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const idx = r * COLS + c, code = F.ch[idx];
        if (code <= 32) continue;
        const j = idx * 3;
        const key = (q6(F.col[j]) << 12) | (q6(F.col[j + 1]) << 6) | q6(F.col[j + 2]);
        if (key !== last) { tc.fillStyle = this.style(key); last = key; }
        tc.fillText(this.chars[code & 127], c * cw + cw / 2, r * chh + yOff);
      }
    }

    // bloom: blurred, downscaled copies added back with "lighter"
    for (const [cv, blur] of [[this.s1, 1.6], [this.s2, 1.2]]) {
      const sc = cv.getContext("2d");
      sc.clearRect(0, 0, cv.width, cv.height);
      if ("filter" in sc) sc.filter = `blur(${blur}px)`;
      sc.imageSmoothingEnabled = true; sc.imageSmoothingQuality = "high";
      sc.drawImage(this.tcv, 0, 0, cv.width, cv.height);
    }
    m.globalCompositeOperation = "source-over"; m.globalAlpha = 1;
    m.fillStyle = "rgb(5,8,15)"; m.fillRect(0, 0, w, h);
    m.drawImage(this.tcv, 0, 0);
    m.globalCompositeOperation = "lighter";
    m.globalAlpha = 0.50; m.drawImage(this.s1, 0, 0, w, h);
    m.globalAlpha = 0.45; m.drawImage(this.s2, 0, 0, w, h);
    m.globalCompositeOperation = "source-over"; m.globalAlpha = 1;
    this.hud(t, info);
  }

  hud(t, info) {
    const m = this.ctx, px = this.hudPx, padX = this.cw * 2, padY = this.chh * 1.1;
    m.font = `${px}px "DejaVu Sans Mono", Consolas, Menlo, "Courier New", monospace`;
    m.textBaseline = "top"; m.textAlign = "left";
    const label = `t ${t.toFixed(2).padStart(5, "0")}s`;
    const tw = m.measureText(label).width, tx = this.w - padX - tw;
    m.fillStyle = "rgb(255,196,90)";
    m.beginPath(); m.arc(tx - px * 0.85, padY + px * 0.55, Math.max(3, px / 5), 0, TAU); m.fill();
    m.fillText(label, tx, padY);
    const lh = px * 1.32, by = this.h - padY - lh * 3;
    m.fillStyle = "rgb(176,168,196)"; m.fillText(this.author, padX, by);
    m.fillStyle = "rgb(96,104,122)";
    m.fillText(`rotation ${info.rot.toFixed(2).padStart(6, "0")}°     lights ${String(info.lights).padStart(3, " ")}`,
      padX, by + lh);
    m.fillText(`letters ${info.letters.toLocaleString("en-US")}`, padX, by + lh * 2);
  }
}

// ===== audio: procedural 80s synth-pop soundtrack, rendered straight into sample buffers =====
const SR = 32000;
const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function nf(name) {
  const acc = name[1] === "#" ? 1 : name[1] === "b" ? -1 : 0;
  const oct = parseInt(name.slice(acc ? 2 : 1), 10);
  return 440 * Math.pow(2, (12 * (oct + 1) + SEMI[name[0]] + acc - 69) / 12);
}

function bellVoice(freq, dur, amp) {
  const n = Math.max(1, Math.floor(dur * SR)), out = new Float32Array(n), w = TAU * freq;
  for (let i = 0; i < n; i++) {
    const t = i / SR, atk = Math.min(t / 0.006, 1);
    const e1 = atk * Math.exp(-t * 3.1), e2 = atk * Math.exp(-t * 6.5), e3 = atk * Math.exp(-t * 11);
    out[i] = amp * (0.65 * Math.sin(w * t) * e1 + 0.24 * Math.sin(2 * w * t) * e2
      + 0.11 * Math.sin(3 * w * t) * e3 + 0.05 * Math.sin(4.02 * w * t) * e3);
  }
  return out;
}

function leadVoice(freq, dur, amp) {
  const n = Math.max(1, Math.floor((dur + 0.22) * SR)), out = new Float32Array(n);
  const decayK = 0.95 / Math.max(dur, 0.35);
  let cs = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = Math.min(t / 0.010, 1) * (t <= dur ? 1 : Math.exp(-(t - dur) / 0.075)) * Math.exp(-t * decayK);
    cs += 0.003 * clamp((t - 0.18) / 0.25, 0, 1) * Math.sin(TAU * 5.4 * t);
    const ph = TAU * freq * (t + cs / SR);
    const sig = 0.58 * Math.sin(ph) + 0.24 * Math.sin(2 * ph) * (0.55 + 0.45 * Math.exp(-t * 4))
      + 0.10 * Math.sin(3 * ph) * Math.exp(-t * 6) + 0.08 * Math.sin(4 * ph) * Math.exp(-t * 11);
    out[i] = sig * env * amp;
  }
  return out;
}

function bassVoice(freq, dur, amp) {
  const n = Math.max(1, Math.floor(dur * SR)), out = new Float32Array(n), w = TAU * freq;
  for (let i = 0; i < n; i++) {
    const t = i / SR, atk = Math.min(t / 0.004, 1);
    const env = atk * Math.exp(-t * 11.5), br = atk * Math.exp(-t * 22);
    out[i] = amp * (0.66 * Math.sin(w * t) * env + 0.26 * Math.sin(2 * w * t) * br
      + 0.11 * Math.sin(3 * w * t) * br);
  }
  return out;
}

function junoPad(freqs, dur, amp) {
  // stereo chorus-detuned pad; harmonics come from angle-addition to save sin() calls
  const n = Math.max(1, Math.floor(dur * SR));
  const L = new Float32Array(n), R = new Float32Array(n);
  const outs = [L, R], dets = [0.9972, 1.0028];
  for (const f of freqs) {
    for (let c = 0; c < 2; c++) {
      const w = TAU * f * dets[c] / SR, o = outs[c];
      for (let i = 0; i < n; i++) {
        const th = w * i, s = Math.sin(th), co = Math.cos(th);
        const s2 = 2 * s * co, c2 = 1 - 2 * s * s, s3 = s2 * co + c2 * s;
        const s4 = 2 * s2 * c2, s5 = s4 * co + (1 - 2 * s2 * s2) * s;
        o[i] += s + 0.38 * s2 + 0.18 * s3 + 0.09 * s4 + 0.04 * s5;
      }
    }
  }
  const k = amp / freqs.length;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = clamp(Math.min(t / 0.28, 1) * Math.min((dur - t) / 0.35, 1), 0, 1) * k;
    L[i] *= env; R[i] *= env;
  }
  return [L, R];
}

function popKick(amp) {
  const n = Math.floor(0.28 * SR), out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    ph += TAU * (44 + 78 * Math.exp(-t * 32)) / SR;
    out[i] = Math.sin(ph) * Math.min(t / 0.002, 1) * Math.exp(-t * 11) * amp;
  }
  return out;
}

function snare80s(rng, amp) {
  const n = Math.floor(0.22 * SR), out = new Float32Array(n);
  const a1 = 1 - Math.exp(-TAU * 7200 / SR), a2 = 1 - Math.exp(-TAU * 900 / SR);
  let y1 = 0, y2 = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR, x = rng.norm();
    y1 += a1 * (x - y1); y2 += a2 * (x - y2);
    const filt = (y1 - y2) * 1.6 + 0.12 * x;  // rough 900-7200 Hz band-pass
    const body = Math.sin(TAU * (185 * Math.exp(-t * 15) + 125) * t) * Math.exp(-t * 24);
    const gate = t < 0.12 ? Math.exp(-t * 7.5) : Math.exp(-0.12 * 7.5) * Math.exp(-(t - 0.12) * 32);
    out[i] = (0.75 * filt * gate + 0.35 * body) * amp;
  }
  return out;
}

function sleighTick(rng, amp) {
  const n = Math.floor(0.11 * SR), out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    out[i] = rng.norm() * Math.sin(TAU * 6400 * t) * Math.exp(-t * 32) * amp;
  }
  return out;
}

function addMono(buf, start, mono, pan) {
  const i0 = Math.floor(start * SR), n = buf[0].length;
  const p = clamp(pan, -1, 1), gl = Math.sqrt(0.5 * (1 - p)), gr = Math.sqrt(0.5 * (1 + p));
  for (let i = 0; i < mono.length; i++) {
    const j = i0 + i;
    if (j < 0) continue;
    if (j >= n) break;
    buf[0][j] += mono[i] * gl; buf[1][j] += mono[i] * gr;
  }
}

function addStereo(buf, start, L, R) {
  const i0 = Math.floor(start * SR), n = buf[0].length;
  for (let i = 0; i < L.length; i++) {
    const j = i0 + i;
    if (j < 0) continue;
    if (j >= n) break;
    buf[0][j] += L[i]; buf[1][j] += R[i];
  }
}

function reverb(L, R) {
  const n = L.length, oL = Float32Array.from(L), oR = Float32Array.from(R);
  const taps = [[0.037, 0.25, 0.14], [0.061, 0.16, 0.23], [0.097, 0.17, 0.11], [0.149, 0.09, 0.15]];
  for (const [sec, gs, gc] of taps) {
    const d = Math.floor(sec * SR);
    for (let i = d; i < n; i++) {
      oL[i] += L[i - d] * gs + R[i - d] * gc;
      oR[i] += R[i - d] * gs + L[i - d] * gc;
    }
  }
  return [oL, oR];
}

async function generateAudio(onProgress) {
  // D major, 108 BPM: D -> Bm -> Em -> A, with bells, bass, drums and a synth lead
  const total = Math.floor(DURATION * SR);
  const buf = [new Float32Array(total), new Float32Array(total)];
  const beat = 60 / 108, bar = 4 * beat, rng = makeRng(1984);
  const pause = () => new Promise((r) => setTimeout(r, 0));
  const report = async (f) => { if (onProgress) onProgress(f); await pause(); };

  const chords = [
    [0, bar + 0.15, ["D3", "F#3", "A3", "C#4"]],
    [1 * bar, 2 * bar + 0.15, ["D3", "F#3", "A3", "C#4"]],
    [3 * bar, 2 * bar + 0.15, ["B2", "D3", "F#3", "A3"]],
    [5 * bar, 2 * bar + 0.15, ["E3", "G3", "B3", "D4"]],
    [7 * bar, 1.5 * bar + 0.1, ["A2", "D3", "E3", "G3"]],
    [8.5 * bar, 0.25 * bar + 0.1, ["A2", "C#3", "E3", "G3"]],
    [8.75 * bar, Math.max(0.5, DURATION - 8.75 * bar), ["D3", "F#3", "A3", "E4"]],
  ];
  for (let i = 0; i < chords.length; i++) {
    const [t0, dc, notes] = chords[i];
    if (t0 >= DURATION) break;
    const [pl, pr] = junoPad(notes.map(nf), Math.min(dc, DURATION - t0 + 0.2), 0.095);
    addStereo(buf, t0, pl, pr);
    await report(0.05 + 0.25 * (i + 1) / chords.length);
  }

  const bassRoots = [[0, 12, "D2", "C#2"], [12, 20, "B1", "F#2"], [20, 28, "E2", "G2"], [28, 34, "A1", "A1"]];
  for (const [b0, b1, root, pickup] of bassRoots) {
    const eighths = (b1 - b0) * 2;
    for (let e = 0; e < eighths; e++) {
      const te = (b0 + e * 0.5) * beat;
      if (te >= DURATION - 0.1) break;
      const note = e === eighths - 1 && b1 < 34 ? pickup : root;
      addMono(buf, te, bassVoice(nf(note), 0.21, 0.17), 0);
    }
  }
  const kick = popKick(0.19), snare = snare80s(rng, 0.075), sleigh = sleighTick(rng, 0.032);
  const sleighSoft = sleigh.map((v) => v * 0.65);
  const totalBeats = Math.floor(DURATION / beat);
  for (let b = 0; b < totalBeats; b++) {
    const tb = b * beat;
    if (b >= 35) continue;
    if (b % 2 === 0) addMono(buf, tb, kick, 0); else addMono(buf, tb, snare, 0.04);
    addMono(buf, tb, sleigh, 0.25);
    if (tb + 0.5 * beat < DURATION - 0.15) addMono(buf, tb + 0.5 * beat, sleighSoft, -0.25);
  }
  await report(0.4);

  ["D5", "F#5", "A5", "C#6", "A5", "F#5"].forEach((note, i) => {
    const ti = 0.15 + i * 0.5 * beat;
    if (ti < DURATION - 0.2) addMono(buf, ti, bellVoice(nf(note), 0.85, 0.15), -0.35 + 0.14 * i);
  });

  const melody = [
    [4.00, "E5", 1.35], [5.50, "E5", 0.45], [6.00, "D5", 0.85], [7.00, "A4", 0.80],
    [8.00, "E5", 0.45], [8.50, "E5", 0.45], [9.00, "F#5", 0.80], [10.00, "D5", 1.80],
    [12.00, "B4", 0.45], [12.50, "B4", 0.45], [13.00, "E5", 0.45], [13.50, "E5", 0.45],
    [14.00, "F#5", 0.48], [14.50, "D5", 1.30], [16.00, "B4", 0.45], [16.50, "C#5", 0.45],
    [17.00, "D5", 0.45], [17.50, "C#5", 0.45], [18.00, "B4", 1.80],
    [20.00, "F#5", 0.90], [21.00, "E5", 1.25], [22.50, "B4", 0.45], [23.00, "F#5", 0.48],
    [23.50, "G5", 0.48], [24.00, "F#5", 0.48], [24.50, "E5", 2.50],
    [28.00, "D5", 0.45], [28.50, "C#5", 0.45], [29.00, "D5", 0.45], [29.50, "C#5", 0.45],
    [30.00, "C#5", 0.48], [30.50, "D5", 0.48], [31.00, "C#5", 0.85], [32.00, "A4", 2.00],
    [34.50, "D5", 1.45],
  ];
  for (let idx = 0; idx < melody.length; idx++) {
    const [bp, note, bd] = melody[idx];
    const tn = bp * beat;
    if (tn >= DURATION - 0.15) continue;
    const ds = Math.min(bd * beat, Math.max(0.15, DURATION - tn));
    const pan = idx % 2 === 0 ? -0.14 : 0.14;
    addMono(buf, tn, leadVoice(nf(note), ds, 0.28), pan);
    addMono(buf, tn, bellVoice(nf(note), Math.max(0.5, ds), 0.13), -pan);
    if (idx % 6 === 5) await report(0.4 + 0.45 * idx / melody.length);
  }

  // sparkle run when the star lights up
  ["D5", "F#5", "A5", "C#6", "D6", "E6", "F#6", "A6"].forEach((note, i, arr) => {
    const ti = T_STAR + i * 0.052;
    if (ti < DURATION - 0.15) addMono(buf, ti, bellVoice(nf(note), 1.5, 0.13), -0.6 + 1.2 * i / (arr.length - 1));
  });
  await report(0.9);

  const [L, R] = reverb(buf[0], buf[1]);
  const fade = Math.min(total, Math.floor(0.85 * SR));
  for (let j = 0; j < fade; j++) {
    const g = 1 - j / Math.max(1, fade - 1), i = total - fade + j;
    L[i] *= g; R[i] *= g;
  }
  let peak = 0;
  for (let i = 0; i < total; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const norm = 0.88 / Math.max(peak, 1);
  for (let i = 0; i < total; i++) { L[i] = Math.tanh(L[i] * norm); R[i] = Math.tanh(R[i] * norm); }
  await report(1);
  return { L, R };
}

// ===== APP =====
const params = new URLSearchParams(location.search);
const AUTHOR = params.get("author") || "@cfs.ascii";
const MESSAGE = params.get("msg") || "M E R R Y   C H R I S T M A S   2 0 2 6";
const $ = (id) => document.getElementById(id);

// the code pane shows this very file, so read it back from the script URL
const SELF_SRC = document.currentScript ? document.currentScript.src : "";
async function loadSource() {
  try {
    if (!SELF_SRC) throw new Error("no script url");
    const res = await fetch(SELF_SRC);
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.text();
  } catch (e) {
    // opened from file:// (fetch blocked): fall back to the functions' own source text
    return [build, drawStar, stepFrame, AsciiRenderer].map((f) => f.toString()).join("\n\n");
  }
}

// code pane placement: ?layout=right|bottom, then the saved choice, then screen shape
function pickLayout() {
  const q = params.get("layout");
  if (q === "right" || q === "bottom") return q;
  try {
    const saved = localStorage.getItem("tree-layout");
    if (saved === "right" || saved === "bottom") return saved;
  } catch (e) { /* storage blocked */ }
  return window.innerWidth >= window.innerHeight * 0.7645 + 320 ? "right" : "bottom";
}

// frame rate cap: ?fps=30|60, then the saved choice, default 30
function pickFps() {
  const q = parseInt(params.get("fps"), 10);
  if (q === 30 || q === 60) return q;
  try {
    const saved = parseInt(localStorage.getItem("tree-fps"), 10);
    if (saved === 30 || saved === 60) return saved;
  } catch (e) { /* storage blocked */ }
  return 30;
}

const SYN = {
  keyword: "rgb(244,114,152)", builtin: "rgb(125,185,252)", call: "rgb(125,185,252)",
  string: "rgb(134,224,148)", number: "rgb(245,178,102)", comment: "rgb(102,113,134)",
  op: "rgb(168,178,198)", ident: "rgb(224,232,246)",
};
const JS_KEYWORDS = new Set(("const let var function return if else for while of in new class this null true false " +
  "async await break continue switch case default typeof throw try catch finally static extends").split(" "));
const JS_BUILTINS = new Set(("Math Float32Array Int32Array Uint8Array Array Map Set Number Object String " +
  "document window performance console Infinity NaN undefined parseInt Promise").split(" "));
const TOKEN_RE = /(\/\/.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\d+\.?\d*(?:e[+-]?\d+)?)|([A-Za-z_$][\w$]*)|(\S)/g;

function tokenizeLine(line) {
  const spans = [];
  TOKEN_RE.lastIndex = 0;
  let m;
  while ((m = TOKEN_RE.exec(line)) !== null) {
    let kind = "op";
    if (m[1]) kind = "comment";
    else if (m[2]) kind = "string";
    else if (m[3]) kind = "number";
    else if (m[4]) {
      if (JS_KEYWORDS.has(m[4])) kind = "keyword";
      else if (JS_BUILTINS.has(m[4])) kind = "builtin";
      else if (line[m.index + m[4].length] === "(") kind = "call";
      else kind = "ident";
    }
    spans.push([m.index, m[0], SYN[kind]]);
  }
  return spans;
}

class CodePane {
  // draws this page's own source, scrolling in step with what the tree is doing
  constructor(canvas, source) {
    this.cv = canvas; this.ctx = canvas.getContext("2d");
    this.lines = source.replace(/^\n/, "").split("\n");
    this.spans = this.lines.map(tokenizeLine);
    this.keys = this.buildKeyframes();
  }

  find(needle, fallback) {
    for (let i = 0; i < this.lines.length; i++) if (this.lines[i].includes(needle)) return i;
    return Math.min(fallback, Math.max(0, this.lines.length - 1));
  }

  buildKeyframes() {
    const anchors = [
      [0.0, "// needles:"], [3.8, "// dark inner cone"], [5.1, "// trunk"], [6.4, "// tinsel garland"],
      [7.5, "// baubles"], [8.6, "// fairy lights"], [10.0, "// presents"], [11.8, "function drawStar"],
      [13.2, "// typed holiday message"], [16.2, "class AsciiRenderer"], [DURATION, "// bloom"],
    ];
    const keys = [];
    let prev = 0;
    for (const [t, needle] of anchors) {
      prev = Math.max(prev, this.find(needle, prev));
      keys.push([t, prev]);
    }
    return keys;
  }

  lineAt(t) {
    const k = this.keys;
    if (t <= k[0][0]) return k[0][1];
    if (t >= k[k.length - 1][0]) return k[k.length - 1][1];
    for (let i = 0; i + 1 < k.length; i++) {
      if (t >= k[i][0] && t <= k[i + 1][0]) {
        const u = (t - k[i][0]) / Math.max(1e-6, k[i + 1][0] - k[i][0]);
        return k[i][1] + (k[i + 1][1] - k[i][1]) * u * u * (3 - 2 * u);
      }
    }
    return k[k.length - 1][1];
  }

  resize(cssW, cssH, dpr, cols) {
    this.cv.width = Math.max(1, Math.round(cssW * dpr)); this.cv.height = Math.max(1, Math.round(cssH * dpr));
    const W = this.cv.width;
    this.x0 = Math.round(W * 0.082); this.xNum = Math.round(W * 0.058);
    this.fontPx = clamp(Math.floor((W - this.x0) / cols / 0.6), 8, 40);
    this.lineH = Math.round(this.fontPx * 1.6);
    this.font = `${this.fontPx}px "DejaVu Sans Mono", Consolas, Menlo, "Courier New", monospace`;
    this.ctx.font = this.font;
    this.charW = this.ctx.measureText("M").width;
  }

  draw(t) {
    const m = this.ctx, W = this.cv.width, H = this.cv.height, lh = this.lineH;
    m.fillStyle = "rgb(8,11,20)"; m.fillRect(0, 0, W, H);
    m.font = this.font; m.textBaseline = "middle";
    const targetY = this.lineAt(t) * lh;
    const maxScroll = Math.max(0, this.lines.length * lh - H);
    const scroll = Math.round(clamp(targetY - H * 0.24, 0, maxScroll));
    m.fillStyle = "rgb(20,26,44)"; m.fillRect(0, Math.round(targetY) - scroll, W, lh);
    const first = Math.max(0, Math.floor(scroll / lh)), last = Math.min(this.lines.length, Math.ceil((scroll + H) / lh));
    for (let i = first; i < last; i++) {
      const y = i * lh - scroll + lh / 2;
      m.textAlign = "right"; m.fillStyle = "rgb(74,83,102)";
      m.fillText(String(i + 1), this.xNum, y);
      m.textAlign = "left";
      for (const [col, text, color] of this.spans[i]) {
        const x = this.x0 + col * this.charW;
        if (x > W) break;
        m.fillStyle = color; m.fillText(text, x, y);
      }
    }
    const fade = Math.max(12, lh);
    let g = m.createLinearGradient(0, 0, 0, fade);
    g.addColorStop(0, "rgba(8,11,20,0.85)"); g.addColorStop(1, "rgba(8,11,20,0)");
    m.fillStyle = g; m.fillRect(0, 0, W, fade);
    g = m.createLinearGradient(0, H - fade, 0, H);
    g.addColorStop(0, "rgba(8,11,20,0)"); g.addColorStop(1, "rgba(8,11,20,0.75)");
    m.fillStyle = g; m.fillRect(0, H - fade, W, fade);
  }
}

class Player {
  constructor(data) { this.data = data; this.src = null; this.muted = false; }
  init() {
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    this.buf = this.ctx.createBuffer(2, this.data.L.length, SR);
    this.buf.copyToChannel(this.data.L, 0); this.buf.copyToChannel(this.data.R, 1);
    this.gain = this.ctx.createGain(); this.gain.connect(this.ctx.destination);
    if (this.ctx.state === "suspended") this.ctx.resume();
  }
  play(at) {
    this.stop();
    const s = this.ctx.createBufferSource();
    s.buffer = this.buf; s.connect(this.gain);
    s.start(0, clamp(at, 0, DURATION - 0.05));
    this.src = s;
  }
  stop() { try { if (this.src) this.src.stop(); } catch (e) { /* already stopped */ } this.src = null; }
  pause() { this.ctx.suspend(); }
  resume() { this.ctx.resume(); }
  setMuted(v) { this.muted = v; this.gain.gain.value = v ? 0 : 1; }
}

(function main() {
  const reel = $("reel"), artEl = $("art"), artCv = $("artCanvas");
  const codeWrap = $("codeWrap"), codeCv = $("codeCanvas");
  const scene = build(), bg = new Background(), F = makeFrameState();
  const art = new AsciiRenderer(artCv, AUTHOR);
  let code = null;  // created once the source text has been loaded
  let mode = pickLayout();
  reel.className = "layout-" + mode;
  let t = 18.0, paused = false, started = false, dirty = true, player = null, audioData = null;
  let lastNow = 0, lastDraw = 0, frames = 0, fpsStamp = 0, shot = 1;
  let targetFps = pickFps();

  function layout() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    art.resize(Math.max(120, artEl.clientWidth), dpr);
    if (code) {
      const cw = Math.max(120, codeWrap.clientWidth);
      const cols = clamp(Math.floor(cw * 0.918 / 7.2), 50, 200);  // text stays ~12px, wide pane shows more
      code.resize(cw, Math.max(60, codeWrap.clientHeight), dpr, cols);
    }
    dirty = true;
  }
  function render() {
    const info = stepFrame(scene, bg, t, MESSAGE, F);
    art.draw(F, t, info);
    if (code) code.draw(t);
    dirty = false;
  }

  function paintFpsButton() { $("bFps").textContent = targetFps + " fps"; }
  function setFps(n) {
    targetFps = n;
    paintFpsButton();
    try { localStorage.setItem("tree-fps", String(n)); } catch (e) { /* storage blocked */ }
  }
  function paintLayoutButton() {
    $("bLayout").textContent = mode === "right" ? "↓ dưới" : "→ phải";
  }
  function setLayout(next) {
    mode = next;
    reel.className = "layout-" + mode;
    paintLayoutButton();
    try { localStorage.setItem("tree-layout", mode); } catch (e) { /* storage blocked */ }
    layout();
    if (!started) render();
  }

  function setPaused(p) {
    paused = p;
    if (player) { if (p) player.pause(); else player.resume(); }
    $("bPause").textContent = p ? "▶" : "❚❚";
    dirty = true;
  }
  function seek(to) {
    t = clamp(to, 0, DURATION - 0.01);
    if (player) player.play(t);
    dirty = true;
  }
  function screenshot() {
    artCv.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `screenshot_${String(shot++).padStart(2, "0")}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    });
  }
  function toggleMute() { if (player) player.setMuted(!player.muted); $("bMute").style.opacity = player && player.muted ? 0.4 : 1; }

  function tick(now) {
    requestAnimationFrame(tick);
    const frameMs = 1000 / targetFps, since = now - lastDraw;
    if (since < frameMs - 1) return;  // cap at the chosen fps (30 or 60)
    const dt = lastNow ? Math.min((now - lastNow) / 1000, 0.1) : 0;
    lastNow = now; lastDraw = now - (since % frameMs);
    if (!paused) {
      t += dt;
      if (t >= DURATION) { t -= DURATION; if (player) player.play(t); }
    }
    if (!paused || dirty) {
      render();
      frames++;
    }
    if (now - fpsStamp > 1000) {
      $("fps").textContent = String(Math.round(frames * 1000 / Math.max(1, now - fpsStamp)));
      frames = 0; fpsStamp = now;
    }
  }

  function start(withAudio) {
    if (started) return;
    started = true;
    $("overlay").hidden = true;
    t = 0;
    if (withAudio && audioData) {
      try { player = new Player(audioData); player.init(); player.play(0); }
      catch (e) { console.warn("Audio unavailable:", e); player = null; }
    }
    $("bMute").disabled = !player;
    dirty = true;
    requestAnimationFrame(tick);
  }

  $("bStart").addEventListener("click", () => start(true));
  $("bSilent").addEventListener("click", () => start(false));
  $("bPause").addEventListener("click", () => started && setPaused(!paused));
  $("bRestart").addEventListener("click", () => started && seek(0));
  $("bBack").addEventListener("click", () => started && seek(t - 1));
  $("bFwd").addEventListener("click", () => started && seek(t + 1));
  $("bShot").addEventListener("click", screenshot);
  $("bMute").addEventListener("click", toggleMute);
  $("bLayout").addEventListener("click", () => setLayout(mode === "right" ? "bottom" : "right"));
  $("bFps").addEventListener("click", () => setFps(targetFps === 30 ? 60 : 30));
  artEl.addEventListener("click", () => started && setPaused(!paused));
  window.addEventListener("keydown", (e) => {
    if (!started) return;
    if (e.code === "Space") { e.preventDefault(); setPaused(!paused); }
    else if (e.key === "r" || e.key === "R") seek(0);
    else if (e.key === "ArrowLeft") seek(t - 1);
    else if (e.key === "ArrowRight") seek(t + 1);
    else if (e.key === "s" || e.key === "S") screenshot();
    else if (e.key === "m" || e.key === "M") toggleMute();
    else if (e.key === "l" || e.key === "L") setLayout(mode === "right" ? "bottom" : "right");
    else if (e.key === "f" || e.key === "F") setFps(targetFps === 30 ? 60 : 30);
  });
  document.addEventListener("visibilitychange", () => {
    lastNow = 0;
    if (!player || paused) return;
    if (document.hidden) player.pause(); else player.resume();
  });
  const ro = new ResizeObserver(() => { layout(); if (!started) render(); });
  ro.observe(reel); ro.observe(codeWrap);

  paintLayoutButton();
  paintFpsButton();
  layout();
  t = 18.0; render();  // static preview behind the start overlay
  loadSource().then((src) => {
    code = new CodePane(codeCv, src);
    layout();
    if (!started) render();
  });

  generateAudio((f) => { $("bStart").textContent = `Đang tạo nhạc… ${Math.round(f * 100)}%`; })
    .then((data) => {
      audioData = data;
      $("bStart").textContent = "▶ Bấm để bắt đầu";
      $("bStart").disabled = false;
    })
    .catch((e) => {
      console.error(e);
      $("bStart").textContent = "Không tạo được nhạc";
    });
})();
