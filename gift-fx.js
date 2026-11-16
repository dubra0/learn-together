/* =====================================================================
   Talk Together — premium gift animations (full screen) + sounds
   Self-contained: exposes window.GiftFX.play(giftId, fromName, toName)
   Sounds are made in the browser; the lion roar is a real recording
   ("The Fierce Roar of a Lion" by PWLPL, Pixabay Content License).
   ===================================================================== */
(function () {
"use strict";
const $ = (s) => document.querySelector(s);
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];

/* ---------- layer + styles (prefixed tg- so nothing clashes with the app) ---------- */
const css = document.createElement("style");
css.textContent = `
#tgfx{position:fixed;inset:0;z-index:95;pointer-events:none;overflow:hidden}
#tgfx-c{position:absolute;inset:0;width:100%;height:100%}
#tgfx-glow{position:absolute;inset:0;opacity:0}
#tgfx .tg-actor{position:absolute;left:50%;top:50%;line-height:1;transform:translate(-50%,-50%);will-change:transform;
  filter:drop-shadow(0 10px 30px rgba(0,0,0,.55)) drop-shadow(0 0 24px rgba(255,255,255,.25));user-select:none}
#tgfx .tg-rays{position:absolute;left:50%;top:50%;width:150vmax;height:150vmax;margin:-75vmax 0 0 -75vmax;opacity:0;border-radius:50%;
  background:repeating-conic-gradient(from 0deg,rgba(255,215,90,.22) 0 8deg,transparent 8deg 22deg);mask-image:radial-gradient(circle,#000 0 18%,transparent 55%);-webkit-mask-image:radial-gradient(circle,#000 0 18%,transparent 55%)}
#tgfx .tg-ring{position:absolute;left:50%;top:50%;width:20vmin;height:20vmin;margin:-10vmin 0 0 -10vmin;border-radius:50%;border:6px solid #ffcf4d;opacity:0;padding:0;background:none}
#tgfx .tg-bubble{position:absolute;left:50%;top:22%;transform:translate(-50%,-50%);background:#fff;color:#1b1040;font-weight:900;border-radius:22px;
  padding:8px 18px;font-size:clamp(1.3rem,6vmin,2.4rem);box-shadow:0 10px 30px rgba(0,0,0,.4);white-space:nowrap;opacity:0;font-family:inherit}
#tgfx .tg-bubble::after{content:"";position:absolute;bottom:-12px;left:50%;margin-left:-12px;border:12px solid transparent;border-top-color:#fff;border-bottom:0}
#tgfx .tg-banner{position:absolute;top:calc(14px + env(safe-area-inset-top,0px));left:50%;transform:translate(-50%,-140%);display:flex;align-items:center;gap:10px;color:#fff;
  background:linear-gradient(90deg,rgba(124,92,255,.96),rgba(255,93,143,.96));border-radius:999px;padding:6px 18px 6px 8px;box-shadow:0 10px 30px rgba(0,0,0,.45);
  white-space:nowrap;max-width:calc(100% - 24px);font-family:inherit}
#tgfx .tg-banner .be{font-size:1.8rem}
#tgfx .tg-banner .bt{font-size:.88rem;line-height:1.35;overflow:hidden;text-overflow:ellipsis}
#tgfx .tg-banner .bt b{color:#ffcf4d}
#tgfx .tg-combo{position:absolute;bottom:22%;inset-inline-end:8%;font-weight:900;font-size:clamp(2rem,10vmin,3.6rem);color:#ffcf4d;
  text-shadow:0 4px 0 #b45309,0 8px 24px rgba(0,0,0,.5);opacity:0;font-style:italic}`;
document.head.appendChild(css);
const layer = document.createElement("div");
layer.id = "tgfx"; layer.setAttribute("aria-hidden", "true");
layer.innerHTML = `<div id="tgfx-glow"></div><canvas id="tgfx-c"></canvas>`;
document.body.appendChild(layer);

/* ---------- catalog: how each gift looks and sounds (prices live in the database) ---------- */
const SAY = {
  frog: { ckb: "قوڕ قوڕ!", ar: "نق نق!", en: "Ribbit!" },
  cat: { ckb: "میاو~", ar: "مياو~", en: "Meow~" },
  dog: { ckb: "حەو حەو!", ar: "هاو هاو!", en: "Woof woof!" },
  rooster: { ckb: "قووقوقووو!", ar: "كوكوكوكو!", en: "Cock-a-doodle-doo!" },
  lion: { ckb: "گڕڕڕڕ!", ar: "زئييير!", en: "ROAAAR!" },
};
const GIFTS = {
  small: [
    { id: "rose", e: "🌹", run: smallGift, s: "pluck", fx: ["🌹", "🌸"] },
    { id: "heart", e: "❤️", run: smallGift, s: "pluck", fx: ["❤️", "💖", "💕"] },
    { id: "clap", e: "👏", run: smallGift, s: "clap", fx: ["👏", "✨"] },
    { id: "coffee", e: "☕", run: smallGift, s: "chime", fx: ["☕", "🤎", "✨"] },
    { id: "choco", e: "🍫", run: smallGift, s: "chime", fx: ["🍫", "🍬"] },
    { id: "star", e: "⭐", run: smallGift, s: "sparkle", fx: ["⭐", "🌟", "✨"] },
    { id: "kiss", e: "😘", run: smallGift, s: "pluck", fx: ["💋", "😘", "💗"] },
    { id: "trophy", e: "🏆", run: smallGift, s: "fanfareShort", fx: ["🏆", "⭐", "🎉"] },
  ],
  animals: [
    { id: "frog", e: "🐸", run: frogGift, s: "ribbit" },
    { id: "cat", e: "🐈", run: catGift, s: "meow" },
    { id: "dog", e: "🐕", run: dogGift, s: "bark" },
    { id: "rooster", e: "🐓", run: roosterGift, s: "crow" },
    { id: "dolphin", e: "🐬", run: dolphinGift, s: "dolphin" },
    { id: "eagle", e: "🦅", run: eagleGift, s: "screech" },
    { id: "horse", e: "🐎", run: horseGift, s: "neigh" },
    { id: "elephant", e: "🐘", run: elephantGift, s: "trumpet" },
    { id: "lion", e: "🦁", run: lionGift, s: "roar" },
  ],
  special: [
    { id: "unicorn", e: "🦄", run: unicornGift, s: "magic" },
    { id: "rocket", e: "🚀", run: rocketGift, s: "rocket" },
    { id: "car", e: "🏎️", run: carGift, s: "engine" },
    { id: "fireworks", e: "🎆", run: fireworksGift, s: "fireworks" },
    { id: "diamonds", e: "💎", run: diamondGift, s: "diamonds" },
    { id: "dragon", e: "🐉", run: dragonGift, s: "dragon" },
    { id: "crown", e: "👑", run: crownGift, s: "fanfare" },
  ],
};
const BY_ID = {};
for (const [tier, list] of Object.entries(GIFTS)) for (const g of list) BY_ID[g.id] = { ...g, tier };

/* ================= effects layer ================= */
const fx = $("#tgfx"), cv = $("#tgfx-c"), cx = cv.getContext("2d");
let W = 0, H = 0, DPR = 1, parts = [], emitters = [];
function resize() { DPR = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * DPR; cv.height = H * DPR; cx.setTransform(DPR, 0, 0, DPR, 0, 0); }
addEventListener("resize", resize); resize();

function spawn(o) {
  if (reduce && parts.length > 60) return;
  parts.push(Object.assign({ x: W / 2, y: H / 2, vx: 0, vy: 0, g: 600, life: 0, max: 1.6, size: 28, rot: 0, vr: 0, drag: 0.995, glyph: null, color: null, kind: "emoji", grow: 0 }, o));
}
function burst(x, y, glyphs, n = 24, speed = 500, opts = {}) {
  for (let i = 0; i < n; i++) {
    const a = rnd(0, Math.PI * 2), v = rnd(speed * 0.35, speed);
    spawn(Object.assign({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - speed * 0.3, glyph: pick(glyphs), size: rnd(18, 36), vr: rnd(-6, 6), max: rnd(1.1, 2) }, opts));
  }
}
function confetti(n = 120) {
  const cols = ["#ffcf4d", "#ff5d8f", "#4ade80", "#60a5fa", "#a78bfa", "#fb923c"];
  for (let i = 0; i < n; i++) spawn({ kind: "rect", x: rnd(0, W), y: rnd(-H * 0.3, -10), vx: rnd(-60, 60), vy: rnd(80, 240), g: 120, color: pick(cols), size: rnd(6, 12), vr: rnd(-10, 10), max: rnd(2.5, 4), drag: 0.99 });
}
function sparks(x, y, color, n = 70, speed = 380) {
  for (let i = 0; i < n; i++) {
    const a = rnd(0, Math.PI * 2), v = rnd(speed * 0.4, speed);
    spawn({ kind: "dot", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 140, color, size: rnd(2, 4), max: rnd(1, 1.8), drag: 0.975 });
  }
}
// emit particles from an element while it moves
function trail(el, every, make) {
  const e = { el, every, make, acc: 0 }; emitters.push(e);
  return () => (emitters = emitters.filter((x) => x !== e));
}
function centerOf(el) { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }; }

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  cx.clearRect(0, 0, W, H);
  for (const e of emitters) { e.acc += dt; while (e.acc > e.every) { e.acc -= e.every; e.make(centerOf(e.el)); } }
  parts = parts.filter((p) => (p.life += dt) < p.max);
  for (const p of parts) {
    p.vy += p.g * dt; p.vx *= p.drag; p.vy *= p.drag; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.size += p.grow * dt;
    const a = Math.max(0, 1 - p.life / p.max);
    cx.save(); cx.globalAlpha = a; cx.translate(p.x, p.y); cx.rotate(p.rot);
    if (p.kind === "emoji") { cx.font = `${p.size}px serif`; cx.textAlign = "center"; cx.textBaseline = "middle"; cx.fillText(p.glyph, 0, 0); }
    else if (p.kind === "rect") { cx.fillStyle = p.color; cx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2); }
    else if (p.kind === "dot") { cx.fillStyle = p.color; cx.shadowColor = p.color; cx.shadowBlur = 12; cx.beginPath(); cx.arc(0, 0, p.size, 0, 7); cx.fill(); }
    else if (p.kind === "smoke") { const g = cx.createRadialGradient(0, 0, 0, 0, 0, p.size); g.addColorStop(0, p.color); g.addColorStop(1, "rgba(0,0,0,0)"); cx.fillStyle = g; cx.beginPath(); cx.arc(0, 0, p.size, 0, 7); cx.fill(); }
    cx.restore();
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

/* building blocks */
function el(cls, html, style) { const d = document.createElement("div"); d.className = cls; if (html != null) d.innerHTML = html; if (style) Object.assign(d.style, style); fx.appendChild(d); return d; }
function actor(glyph, vmin) { return el("tg-actor", glyph, { fontSize: vmin + "vmin" }); }
const T = (x, y, s = 1, r = 0, fl = 1) => `translate(-50%,-50%) translate(${x}vw,${y}vh) scale(${s * fl},${s}) rotate(${r}deg)`;
function glow(color, ms, peak = 1) {
  const g = $("#tgfx-glow"); g.style.background = `radial-gradient(circle at 50% 50%, ${color} 0%, rgba(10,4,30,.82) 70%)`;
  return g.animate([{ opacity: 0 }, { opacity: peak, offset: 0.12 }, { opacity: peak, offset: 0.85 }, { opacity: 0 }], { duration: ms, fill: "forwards" }).finished;
}
function shake(ms = 600) { if (reduce) return; (document.getElementById("screen-room") || document.body).animate([{ transform: "translate(0,0)" }, { transform: "translate(-8px,4px)" }, { transform: "translate(8px,-4px)" }, { transform: "translate(-6px,-3px)" }, { transform: "translate(6px,3px)" }, { transform: "translate(0,0)" }], { duration: 120, iterations: Math.ceil(ms / 120) }); }
function rings(color = "#ffcf4d", n = 3) {
  for (let i = 0; i < n; i++) {
    const r = el("tg-ring", null, { borderColor: color });
    r.animate([{ transform: "scale(.2)", opacity: 0.95 }, { transform: "scale(7)", opacity: 0 }], { duration: 1100, delay: i * 220, easing: "cubic-bezier(.2,.7,.3,1)", fill: "forwards" }).finished.then(() => r.remove());
  }
}
function rays(ms) {
  const r = el("tg-rays");
  r.animate([{ opacity: 0, transform: "rotate(0deg) scale(.6)" }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: 0.85 }, { opacity: 0, transform: "rotate(90deg) scale(1)" }], { duration: ms, fill: "forwards" }).finished.then(() => r.remove());
}
function bubble(text, ms = 1400, top = "22%") {
  const b = el("tg-bubble", text, { top });
  b.animate([{ opacity: 0, transform: "translate(-50%,-50%) scale(.3)" }, { opacity: 1, transform: "translate(-50%,-50%) scale(1.12)", offset: 0.15 }, { opacity: 1, transform: "translate(-50%,-50%) scale(1)", offset: 0.25 }, { opacity: 1, offset: 0.85 }, { opacity: 0, transform: "translate(-50%,-50%) scale(.9)" }], { duration: ms, fill: "forwards" }).finished.then(() => b.remove());
}
function banner(g, to, ms = 3200) {
  const b = el("tg-banner", `<span class="be">${g.e}</span><span class="bt"><b>Ayad</b> ${g.n} ی نارد بۆ <b>${to.name}</b></span>`);
  b.animate([{ transform: "translate(-50%,-140%)" }, { transform: "translate(-50%,0)", offset: 0.1 }, { transform: "translate(-50%,0)", offset: 0.88 }, { transform: "translate(-50%,-140%)" }], { duration: ms, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" }).finished.then(() => b.remove());
}
function seatPoint(to) { const s = document.querySelector(`.seat[data-i="${PEOPLE.indexOf(to)}"] .face`); return s ? centerOf(s) : { x: W / 2, y: H * 0.2 }; }
const vw = (px) => (px / W) * 100 - 50, vh = (px) => (px / H) * 100 - 50;

/* ================= the gifts ================= */
function smallGift(g, to, n) {
  play(g.s);
  const tgt = seatPoint(to);
  const a = actor(g.e, 16);
  a.animate([
    { transform: T(0, 30, 0.2), opacity: 0 }, { transform: T(0, 8, 1.25), opacity: 1, offset: 0.3 },
    { transform: T(0, 6, 1), offset: 0.5 }, { transform: T(vw(tgt.x), vh(tgt.y), 0.35), opacity: 0.9 }],
    { duration: 1500, easing: "cubic-bezier(.3,.7,.3,1)", fill: "forwards" }).finished.then(() => { burst(tgt.x, tgt.y, g.fx, 18, 300, { g: 300 }); a.remove(); });
  setTimeout(() => burst(W / 2, H * 0.56, g.fx, 26, 520), 420);
  if (n > 1) {
    const c = el("tg-combo", `x${n}`);
    c.animate([{ opacity: 0, transform: "scale(2)" }, { opacity: 1, transform: "scale(1)", offset: 0.2 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }], { duration: 1300, fill: "forwards" }).finished.then(() => c.remove());
  }
  return wait(400);
}

async function catGift(g, to) {
  banner(g, to, 3600); glow("rgba(255,170,220,.55)", 3600, 0.8);
  const a = actor(g.e, 26);
  const stop = trail(a, 0.12, (p) => spawn({ x: p.x + rnd(-10, 10), y: p.y + p.h * 0.35, vx: 0, vy: 0, g: 0, glyph: "🐾", size: 22, max: 1.4 }));
  a.animate([
    { transform: T(70, 18) }, { transform: T(40, 6, 1, -8), offset: 0.12 }, { transform: T(25, 18), offset: 0.22 },
    { transform: T(10, 4, 1, -8), offset: 0.32 }, { transform: T(0, 14), offset: 0.42 },
    { transform: T(0, 12, 1.25, 4), offset: 0.55 }, { transform: T(0, 14, 1), offset: 0.68 },
    { transform: T(-30, -2, 1, 10), offset: 0.82 }, { transform: T(-75, 14, 1, 0) }],
    { duration: 3600, easing: "ease-in-out", fill: "forwards" });
  await wait(1500); play("meow"); bubble(g.say, 1300, "34%"); burst(W / 2, H * 0.62, ["💗", "💕", "✨"], 22, 420);
  await wait(2100); stop(); a.remove();
}

async function dogGift(g, to) {
  banner(g, to, 3600); glow("rgba(255,200,120,.5)", 3600, 0.8);
  const a = actor(g.e, 28);
  const stop = trail(a, 0.1, (p) => spawn({ x: p.x + p.w * 0.3, y: p.y + p.h * 0.4, vx: rnd(40, 120), vy: rnd(-60, -20), g: 50, glyph: "💨", size: 26, max: 0.8 }));
  a.animate([{ transform: T(75, 14) }, { transform: T(0, 14), offset: 0.3 }], { duration: 3600, easing: "cubic-bezier(.2,.8,.3,1)", fill: "forwards" });
  await wait(1100);
  const wag = a.animate([{ transform: T(0, 14, 1, -6) }, { transform: T(0, 12, 1, 6) }], { duration: 160, iterations: 8, direction: "alternate" });
  play("bark"); bubble(g.say, 1400, "32%"); burst(W / 2, H * 0.6, ["🦴", "⭐", "💛"], 20, 440);
  await wait(1300); wag.cancel();
  await a.animate([{ transform: T(0, 14) }, { transform: T(-80, 14) }], { duration: 900, easing: "ease-in", fill: "forwards" }).finished;
  stop(); a.remove();
}

async function frogGift(g, to) {
  banner(g, to, 3200); glow("rgba(110,231,140,.45)", 3200, 0.75);
  const a = actor(g.e, 22);
  const hops = [];
  [[70, 22], [45, 22], [20, 22], [0, 22], [-25, 22], [-75, 22]].forEach(([x, y], i, arr) => {
    if (i === 0) return;
    const [px, py] = arr[i - 1];
    hops.push({ transform: T(px, py, 1, 0) }, { transform: T((px + x) / 2, y - 18, 1.05, -8) });
  });
  hops.push({ transform: T(-75, 22) });
  a.animate(hops, { duration: 3200, easing: "ease-in-out", fill: "forwards" });
  setTimeout(() => { play("ribbit"); bubble(g.say, 1100, "40%"); }, 1300);
  setTimeout(() => burst(W / 2, H * 0.72, ["💧", "🍃"], 18, 360), 1500);
  await wait(3200); a.remove();
}

async function roosterGift(g, to) {
  banner(g, to, 3800);
  glow("rgba(255,170,60,.75)", 3800, 0.95); rays(3600);
  const sun = actor("🌅", 30); sun.style.opacity = "0.9";
  sun.animate([{ transform: T(0, 40, 1), opacity: 0 }, { transform: T(0, 20, 1.2), opacity: 0.9, offset: 0.3 }, { opacity: 0.9, offset: 0.85 }, { transform: T(0, 20, 1.2), opacity: 0 }], { duration: 3800, fill: "forwards" }).finished.then(() => sun.remove());
  const a = actor(g.e, 30);
  a.animate([{ transform: T(0, 30, 0.3), opacity: 0 }, { transform: T(0, 2, 1), opacity: 1, offset: 0.2 },
    { transform: T(0, 0, 1.1, -6), offset: 0.35 }, { transform: T(0, -4, 1.22, -12), offset: 0.55 }, { transform: T(0, 2, 1), offset: 0.75 }, { transform: T(0, 2, 1), opacity: 0 }],
    { duration: 3800, fill: "forwards" });
  await wait(1000); play("crow"); bubble(g.say, 1500, "20%"); burst(W / 2, H * 0.45, ["☀️", "🌾", "✨"], 26, 480);
  await wait(2800); a.remove();
}

async function dolphinGift(g, to) {
  banner(g, to, 4200); glow("rgba(56,189,248,.6)", 4200, 0.9);
  // waves along the bottom
  for (let i = 0; i < 14; i++) spawn({ x: (W / 13) * i, y: H * 0.86, g: 0, vx: rnd(-20, 20), vy: 0, glyph: "🌊", size: 44, max: 4.2 });
  play("dolphin");
  const a = actor(g.e, 26);
  const arc = [];
  for (let i = 0; i <= 12; i++) { const t = i / 12; arc.push({ transform: T(70 - 140 * t, 34 - 70 * t * (1 - t) * 1.6, 1, -60 + 120 * t) }); }
  const stop = trail(a, 0.05, (p) => spawn({ x: p.x, y: p.y, vx: rnd(-40, 40), vy: rnd(-30, 30), g: 200, glyph: "💧", size: 16, max: 0.9 }));
  setTimeout(() => burst(W * 0.82, H * 0.84, ["💧", "💦"], 30, 520), 150);
  await a.animate(arc, { duration: 2600, easing: "linear", fill: "forwards" }).finished;
  burst(W * 0.18, H * 0.84, ["💧", "💦"], 30, 520); stop(); a.remove();
  const b = actor("🐬", 22);
  await b.animate([{ transform: T(-60, 40, 1, 40) }, { transform: T(0, 18, 1.1, 0), offset: 0.5 }, { transform: T(60, 40, 1, -40) }].map((k) => ({ ...k, transform: k.transform.replace("scale(", "scale(-") })), { duration: 1500, fill: "forwards" }).finished;
  b.remove();
}

async function eagleGift(g, to) {
  banner(g, to, 3800); glow("rgba(147,197,253,.55)", 3800, 0.85);
  for (let i = 0; i < 6; i++) spawn({ glyph: "☁️", x: rnd(0, W), y: rnd(H * 0.05, H * 0.4), vx: rnd(-40, -10), vy: 0, g: 0, size: rnd(40, 70), max: 3.8 });
  const a = actor(g.e, 30);
  const stop = trail(a, 0.09, (p) => spawn({ x: p.x + p.w * 0.3, y: p.y, vx: rnd(20, 80), vy: rnd(-20, 40), g: 60, glyph: "🪶", size: 22, vr: rnd(-3, 3), max: 1.6 }));
  a.animate([{ transform: T(70, -45, 0.6, 25) }, { transform: T(15, 0, 1.1, 0), offset: 0.4 }, { transform: T(0, 4, 1.25, -5), offset: 0.55 }, { transform: T(-70, -50, 0.7, -25) }], { duration: 3600, easing: "ease-in-out", fill: "forwards" });
  setTimeout(() => play("screech"), 900);
  await wait(3600); stop(); a.remove();
}

async function horseGift(g, to) {
  banner(g, to, 3600); glow("rgba(253,186,116,.55)", 3600, 0.85);
  const a = actor(g.e, 30);
  const stop = trail(a, 0.06, (p) => spawn({ x: p.x + p.w * 0.35, y: p.y + p.h * 0.42, vx: rnd(60, 160), vy: rnd(-80, -20), g: 120, kind: "smoke", color: "rgba(214,180,140,.55)", size: rnd(16, 30), grow: 30, max: 1.1 }));
  play("neigh");
  const frames = [];
  for (let i = 0; i <= 16; i++) { const t = i / 16; frames.push({ transform: T(80 - 160 * t, 16 + (i % 2 ? -5 : 0), 1, i % 2 ? -6 : 3) }); }
  await a.animate(frames, { duration: 3000, easing: "linear", fill: "forwards" }).finished;
  stop(); a.remove(); await wait(400);
}

async function elephantGift(g, to) {
  banner(g, to, 4400); glow("rgba(196,181,253,.6)", 4400, 0.9);
  const a = actor(g.e, 36);
  const steps = [[75, 12], [50, 12], [25, 12], [0, 12]];
  const kf = [];
  steps.forEach(([x, y], i) => { kf.push({ transform: T(x, y) }); if (i < steps.length - 1) kf.push({ transform: T(x - 12, y - 3, 1, -3) }); });
  a.animate(kf, { duration: 2000, easing: "ease-in-out", fill: "forwards" });
  for (let i = 0; i < 3; i++) setTimeout(() => { play("stomp"); shake(250); burst(W * (0.85 - i * 0.22), H * 0.72, ["💨"], 8, 220, { g: 40 }); }, 450 + i * 520);
  await wait(2100);
  play("trumpet"); shake(500); rings("#c4b5fd", 2);
  a.animate([{ transform: T(0, 12) }, { transform: T(0, 8, 1.2, 10), offset: 0.3 }, { transform: T(0, 12, 1) }], { duration: 1400, fill: "forwards" });
  const spray = trail(a, 0.03, (p) => spawn({ x: p.x - p.w * 0.35, y: p.y - p.h * 0.3, vx: rnd(-260, -80), vy: rnd(-380, -200), g: 700, glyph: "💦", size: 18, max: 1.2 }));
  await wait(1500); spray();
  await a.animate([{ transform: T(0, 12) }, { transform: T(-85, 12) }], { duration: 900, easing: "ease-in", fill: "forwards" }).finished;
  a.remove();
}

/* a dusky savanna horizon so "far away" reads as distance */
function horizon(ms) {
  const h = el("tg-horizon", null, { position: "absolute", inset: "0", opacity: "0",
    background: "linear-gradient(180deg, rgba(14,8,40,.94) 0%, rgba(60,25,60,.92) 22%, rgba(214,110,50,.9) 40%, rgba(255,170,80,.88) 44%, rgba(120,60,25,.95) 47%, rgba(40,20,10,.97) 65%, rgba(12,6,4,.99) 100%)" });
  fx.insertBefore(h, cv); // behind the dust and sparkles
  h.animate([{ opacity: 0 }, { opacity: 1, offset: 0.1 }, { opacity: 1, offset: 0.88 }, { opacity: 0 }], { duration: ms, fill: "forwards" }).finished.then(() => h.remove());
  return h;
}
async function lionGift(g, to) {
  const total = 7600;
  banner(g, to, total);
  const gl = glow("rgba(255,150,40,.6)", total, 0.9);
  horizon(total);
  const a = actor(g.e, 44);
  a.style.filter = "drop-shadow(0 14px 18px rgba(0,0,0,.7))"; // a ground shadow only, no glow
  // far away on the horizon: tiny, hazy, then it walks toward you and grows
  play("roarFar"); // a distant roar first
  const steps = 10, approach = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, ease = t * t;           // speeds up as it gets closer, like real perspective
    const s = 0.08 + ease * 0.92;                 // 8% → full size
    approach.push({ transform: T(Math.sin(t * 3) * 6 * (1 - t), -6 + ease * 14 + (i % 2 ? -1.5 * s : 0), s, i % 2 ? -3 : 2), opacity: (0.55 + 0.45 * t).toFixed(2) });
  }
  const dust = trail(a, 0.12, (p) => { if (p.w > 90) spawn({ kind: "smoke", color: "rgba(190,130,80,.35)", x: p.x + rnd(-p.w * 0.35, p.w * 0.35), y: p.y + p.h * 0.48, vx: rnd(-60, 60), vy: rnd(-20, 0), g: -10, size: p.w * 0.1, grow: 50, max: 1 }); });
  await a.animate(approach, { duration: 3600, easing: "linear", fill: "forwards" }).finished;
  dust();
  for (let i = 0; i < 2; i++) setTimeout(() => { play("stomp"); shake(200); }, i * 250);
  await wait(500);
  // right in front of you: the roar
  rays(3000); play("roar"); bubble(g.say, 2000, "14%");
  shake(1500); rings("#ffcf4d", 4);
  sparks(W / 2, H * 0.55, "#ffcf4d", 110, 620); burst(W / 2, H * 0.55, ["🔥", "✨"], 26, 650);
  await a.animate([{ transform: T(0, 8, 1) }, { transform: T(0, 4, 1.55, -3), offset: 0.12 }, { transform: T(0, 5, 1.48, 3), offset: 0.3 },
    { transform: T(0, 4, 1.55, -2), offset: 0.55 }, { transform: T(0, 6, 1.45, 0), offset: 0.85 }, { transform: T(0, 8, 1.1) }], { duration: 2600, fill: "forwards" }).finished;
  await a.animate([{ transform: T(0, 8, 1.1), opacity: 1 }, { transform: T(-90, 10, 1.4), opacity: 1 }], { duration: 900, easing: "ease-in", fill: "forwards" }).finished;
  a.remove(); await gl;
}

async function unicornGift(g, to) {
  banner(g, to, 4200); glow("rgba(244,114,182,.6)", 4200, 0.9);
  play("magic");
  const a = actor(g.e, 30);
  const cols = ["#ef4444", "#f97316", "#facc15", "#22c55e", "#3b82f6", "#a855f7"];
  const stop = trail(a, 0.02, (p) => { cols.forEach((c, i) => spawn({ kind: "dot", color: c, x: p.x + p.w * 0.3, y: p.y - 18 + i * 7, vx: 0, vy: 0, g: 0, size: 5, max: 1.3 })); if (Math.random() < 0.4) spawn({ x: p.x, y: p.y, glyph: pick(["✨", "⭐", "💖"]), vx: rnd(-60, 60), vy: rnd(-80, 0), g: 60, size: 20, max: 1.2 }); });
  const frames = [];
  for (let i = 0; i <= 10; i++) { const t = i / 10; frames.push({ transform: T(80 - 160 * t, 10 - Math.sin(t * Math.PI) * 26 + (i % 2 ? -3 : 0), 1, -6 + (i % 2) * 6) }); }
  await a.animate(frames, { duration: 3400, easing: "linear", fill: "forwards" }).finished;
  stop(); a.remove(); confetti(60); await wait(700);
}

async function rocketGift(g, to) {
  banner(g, to, 4200); glow("rgba(96,165,250,.55)", 4200, 0.9);
  const a = actor(g.e, 30);
  a.style.transform = T(0, 34, 1, -45);
  play("rocket");
  // countdown shake on the pad
  const smoke = trail(a, 0.025, (p) => {
    spawn({ kind: "smoke", color: "rgba(230,230,240,.55)", x: p.x - p.w * 0.25 + rnd(-10, 10), y: p.y + p.h * 0.3, vx: rnd(-90, 90), vy: rnd(40, 140), g: -20, size: rnd(14, 26), grow: 70, max: 1.6 });
    spawn({ kind: "dot", color: pick(["#f97316", "#facc15", "#ef4444"]), x: p.x - p.w * 0.22, y: p.y + p.h * 0.28, vx: rnd(-50, 50), vy: rnd(120, 260), g: 0, size: rnd(2, 5), max: 0.4 });
  });
  shake(1200);
  await a.animate([{ transform: T(0, 34, 1, -45) }, { transform: T(-1, 33, 1, -45) }, { transform: T(1, 34, 1, -45) }], { duration: 120, iterations: 9 }).finished;
  await a.animate([{ transform: T(0, 34, 1, -45) }, { transform: T(0, -80, 0.7, -45) }], { duration: 1500, easing: "cubic-bezier(.6,0,.9,.4)", fill: "forwards" }).finished;
  smoke(); a.remove();
  for (let i = 0; i < 30; i++) spawn({ glyph: pick(["✨", "⭐", "🌟"]), x: rnd(0, W), y: rnd(0, H * 0.6), vx: 0, vy: 0, g: 0, size: rnd(14, 28), max: rnd(1, 1.8) });
  play("sparkle"); await wait(1400);
}

async function carGift(g, to) {
  banner(g, to, 3800); glow("rgba(239,68,68,.5)", 3800, 0.85);
  play("engine");
  // speed lines
  const lines = setInterval(() => spawn({ kind: "rect", color: "rgba(255,255,255,.7)", x: W + 20, y: rnd(H * 0.3, H * 0.75), vx: -rnd(1400, 2200), vy: 0, g: 0, size: rnd(30, 70), max: 0.6, drag: 1 }), 30);
  const a = actor(g.e, 32);
  const stop = trail(a, 0.03, (p) => spawn({ kind: "smoke", color: "rgba(180,180,190,.5)", x: p.x + p.w * 0.4, y: p.y + p.h * 0.3, vx: rnd(80, 200), vy: rnd(-30, 10), g: -10, size: rnd(12, 22), grow: 60, max: 1 }));
  await a.animate([{ transform: T(90, 14, 1) }, { transform: T(10, 14, 1.1, 2), offset: 0.35 }, { transform: T(0, 14, 1.12, -3), offset: 0.55 }, { transform: T(-6, 14, 1.12, 0), offset: 0.7 }, { transform: T(-95, 14, 1) }], { duration: 3000, easing: "cubic-bezier(.3,.6,.4,1)", fill: "forwards" }).finished;
  clearInterval(lines); stop(); a.remove(); await wait(500);
}

async function fireworksGift(g, to) {
  banner(g, to, 4600); glow("rgba(30,20,80,.9)", 4600, 1);
  const cols = ["#ffcf4d", "#ff5d8f", "#4ade80", "#60a5fa", "#c084fc", "#fb923c"];
  for (let i = 0; i < 7; i++) {
    const x = rnd(W * 0.15, W * 0.85), y = rnd(H * 0.15, H * 0.5), c = pick(cols);
    setTimeout(() => {
      spawn({ kind: "dot", color: "#fff", x, y: H, vx: 0, vy: -(H - y) * 1.6, g: 0, size: 3, max: 0.55, drag: 1 });
      setTimeout(() => { play("bang"); sparks(x, y, c, reduce ? 30 : 110, rnd(300, 460)); }, 540);
    }, i * 520);
  }
  await wait(4600);
}

async function diamondGift(g, to) {
  banner(g, to, 4400); glow("rgba(103,232,249,.55)", 4400, 0.9); rays(4200);
  const a = actor(g.e, 34);
  a.animate([{ transform: T(0, 0, 0.2, 0), opacity: 0 }, { transform: T(0, 0, 1.2, 360), opacity: 1, offset: 0.3 }, { transform: T(0, -2, 1.1, 380), offset: 0.7 }, { transform: T(0, 0, 0.2, 720), opacity: 0 }], { duration: 4200, easing: "ease-in-out", fill: "forwards" }).finished.then(() => a.remove());
  play("diamonds");
  const rain = setInterval(() => spawn({ glyph: pick(["💎", "💎", "✨", "💠"]), x: rnd(0, W), y: -30, vx: rnd(-30, 30), vy: rnd(120, 260), g: 280, size: rnd(20, 38), vr: rnd(-3, 3), max: 2.6 }), reduce ? 120 : 45);
  await wait(3400); clearInterval(rain); await wait(1000);
}

async function dragonGift(g, to) {
  banner(g, to, 5400);
  glow("rgba(239,68,68,.7)", 5400, 1);
  const a = actor(g.e, 38);
  const frames = [];
  for (let i = 0; i <= 10; i++) { const t = i / 10; frames.push({ transform: T(85 - 85 * t, -10 + Math.sin(t * Math.PI * 2) * 8, 1, Math.sin(t * Math.PI * 2) * 8) }); }
  play("wings");
  await a.animate(frames, { duration: 1800, easing: "ease-out", fill: "forwards" }).finished;
  play("dragon"); shake(1600); rings("#f97316", 3);
  const fire = trail(a, 0.012, (p) => {
    spawn({ kind: "smoke", color: pick(["rgba(255,120,30,.85)", "rgba(255,200,40,.85)", "rgba(239,68,68,.8)"]), x: p.x - p.w * 0.42, y: p.y - p.h * 0.05, vx: rnd(-700, -420), vy: rnd(-90, 90), g: -60, size: rnd(14, 26), grow: 90, max: 0.9, drag: 0.985 });
    if (Math.random() < 0.3) spawn({ glyph: "🔥", x: p.x - p.w * 0.45, y: p.y, vx: rnd(-600, -350), vy: rnd(-120, 120), g: 0, size: rnd(20, 34), max: 0.8 });
  });
  await a.animate([{ transform: T(0, -10) }, { transform: T(4, -8, 1.15, -6), offset: 0.3 }, { transform: T(2, -10, 1.12, 4), offset: 0.7 }, { transform: T(0, -10, 1.1) }], { duration: 2000, fill: "forwards" }).finished;
  fire();
  await a.animate([{ transform: T(0, -10, 1.1) }, { transform: T(-90, -40, 0.8, -10) }], { duration: 1100, easing: "ease-in", fill: "forwards" }).finished;
  a.remove(); await wait(400);
}

async function crownGift(g, to) {
  banner(g, to, 5000);
  glow("rgba(255,207,77,.75)", 5000, 1); rays(4800);
  const tgt = seatPoint(to);
  // the name is typed by people: never put it in as HTML (it could hide code)
  const name = el("tg-bubble", null, { top: "64%" }); name.textContent = `👑 ${to.name} 👑`;
  name.style.background = "linear-gradient(135deg,#ffe58a,#ffb020)";
  const a = actor(g.e, 34);
  play("fanfare");
  await a.animate([{ transform: T(0, -70, 0.6, -20) }, { transform: T(0, 0, 1.3, 8), offset: 0.55 }, { transform: T(0, 2, 1.1, -4), offset: 0.75 }, { transform: T(0, 0, 1.2, 0) }], { duration: 1800, easing: "cubic-bezier(.2,.9,.3,1.3)", fill: "forwards" }).finished;
  name.animate([{ opacity: 0, transform: "translate(-50%,-50%) scale(.4)" }, { opacity: 1, transform: "translate(-50%,-50%) scale(1)" }], { duration: 500, fill: "forwards" });
  rings("#ffcf4d", 3); confetti(150); sparks(W / 2, H / 2, "#ffcf4d", 120, 600);
  await wait(1900);
  name.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: "forwards" }).finished.then(() => name.remove());
  await a.animate([{ transform: T(0, 0, 1.2) }, { transform: T(vw(tgt.x), vh(tgt.y) - 6, 0.25) }], { duration: 900, easing: "ease-in", fill: "forwards" }).finished;
  burst(tgt.x, tgt.y, ["✨", "⭐", "👑"], 20, 300); a.remove(); await wait(500);
}

/* ================= realistic gifts: video with the background removed =================
   Two kinds of files work:
   - green-screen video  → the green is keyed out live on the GPU (WebGL)
   - "packed alpha" MP4  → colour on the left half, transparency mask on the right half
     (the format professional gift designers export)                                   */
const KEY_VS = `attribute vec2 p; varying vec2 uv; void main(){ uv = vec2((p.x+1.)/2., (1.-p.y)/2.); gl_Position = vec4(p,0.,1.); }`;
const KEY_FS = `precision mediump float; varying vec2 uv; uniform sampler2D tex; uniform int mode; uniform vec3 key; uniform float sim, smoothv, spill;
vec2 cbcr(vec3 c){ return vec2(-0.1687*c.r-0.3313*c.g+0.5*c.b, 0.5*c.r-0.4187*c.g-0.0813*c.b); }
void main(){
  if (mode == 1) { // packed alpha: colour left, mask right
    vec3 col = texture2D(tex, vec2(uv.x*0.5, uv.y)).rgb; float a = texture2D(tex, vec2(0.5+uv.x*0.5, uv.y)).r;
    gl_FragColor = vec4(col*a, a); return; }
  vec3 c = texture2D(tex, uv).rgb;
  float d = distance(cbcr(c), cbcr(key));
  float a = smoothstep(sim, sim + smoothv, d);
  // remove green light spilling onto fur edges
  float m = max(c.r, c.b); if (c.g > m) c.g = mix(c.g, m, spill * (1.0 - a*0.5));
  gl_FragColor = vec4(c*a, a);
}`;
async function playKeyedVideo(src, { mode = "green", height = "78vh", bottom = "0", focusX = 0.5, key = null, sim = 0.06, smooth = 0.08, spill = 0.85, fadeMs = 400, maxMs = 0, approachMs = 0 } = {}) {
  const video = document.createElement("video");
  video.src = src; video.muted = true; video.playsInline = true; video.crossOrigin = "anonymous"; video.preload = "auto";
  await new Promise((res, rej) => { video.oncanplay = res; video.onerror = () => rej(new Error("video")); });
  // keep the clip's real proportions at the asked height; the animal (at focusX across the frame) is centred on screen
  const ar = (mode === "packed" ? video.videoWidth / 2 : video.videoWidth) / video.videoHeight;
  const cvs = el("tg-keyed", null, { position: "absolute", left: "50%", bottom, width: `calc(${height} * ${ar.toFixed(4)})`, aspectRatio: `${ar.toFixed(4)}`,
    transform: `translateX(-${(focusX * 100).toFixed(1)}%)`, filter: "drop-shadow(0 20px 40px rgba(0,0,0,.6))" });
  const can = document.createElement("canvas"); can.style.cssText = "width:100%;height:100%;display:block"; cvs.appendChild(can);
  can.width = mode === "packed" ? video.videoWidth / 2 : video.videoWidth; can.height = video.videoHeight;
  const gl = can.getContext("webgl", { premultipliedAlpha: true, alpha: true });
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, KEY_VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, KEY_FS)); gl.linkProgram(prog); gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach((k) => gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  // key colour: given, or measured from the frame's top corners
  if (!key && mode === "green") {
    const t = document.createElement("canvas"); t.width = video.videoWidth; t.height = video.videoHeight; const tx = t.getContext("2d"); tx.drawImage(video, 0, 0);
    const pts = [[4, 4], [t.width - 5, 4], [4, t.height * 0.4], [t.width - 5, t.height * 0.4]].map(([x, y]) => tx.getImageData(x, y, 1, 1).data);
    key = [0, 1, 2].map((i) => pts.reduce((s, d) => s + d[i], 0) / pts.length / 255);
  }
  gl.uniform1i(gl.getUniformLocation(prog, "mode"), mode === "packed" ? 1 : 0);
  gl.uniform3fv(gl.getUniformLocation(prog, "key"), key || [0, 1, 0]);
  gl.uniform1f(gl.getUniformLocation(prog, "sim"), sim); gl.uniform1f(gl.getUniformLocation(prog, "smoothv"), smooth); gl.uniform1f(gl.getUniformLocation(prog, "spill"), spill);
  gl.viewport(0, 0, can.width, can.height); gl.clearColor(0, 0, 0, 0);
  let raf = 0;
  const draw = () => { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); raf = requestAnimationFrame(draw); };
  const tx = `translateX(-${(focusX * 100).toFixed(1)}%)`;
  cvs.style.transformOrigin = `${(focusX * 100).toFixed(1)}% 100%`;
  if (approachMs) { // from far away: tiny and hazy near the horizon, growing as it comes closer
    cvs.animate([
      { opacity: 0, transform: `${tx} translateY(-34vh) scale(.12)` },
      { opacity: 0.6, transform: `${tx} translateY(-30vh) scale(.16)`, offset: 0.12 },
      { opacity: 0.85, transform: `${tx} translateY(-14vh) scale(.45)`, offset: 0.6 },
      { opacity: 1, transform: `${tx} translateY(0) scale(1)` }],
      { duration: approachMs, easing: "cubic-bezier(.5,0,.8,.6)", fill: "forwards" });
  } else {
    cvs.animate([{ opacity: 0, transform: `${tx} translateY(12%) scale(.92)` }, { opacity: 1, transform: `${tx} translateY(0) scale(1)` }], { duration: fadeMs, easing: "ease-out", fill: "forwards" });
  }
  await video.play(); draw();
  await new Promise((res) => { video.onended = res; if (maxMs) setTimeout(res, maxMs); });
  await cvs.animate([{ opacity: 1 }, { opacity: 0 }], { duration: fadeMs, fill: "forwards" }).finished;
  cancelAnimationFrame(raf); video.pause(); video.removeAttribute("src"); video.load(); cvs.remove();
}

async function realLionGift(g, to) {
  banner(g, to, 8200);
  glow("rgba(255,150,40,.5)", 8200, 0.9); horizon(8200);
  play("roarFar");
  setTimeout(() => { rays(3600); play("roar"); shake(1400); rings("#ffcf4d", 3); sparks(W / 2, H * 0.55, "#ffcf4d", 90, 560); }, 3300);
  // starts small and hazy on the horizon, then comes close
  await playKeyedVideo(g.video, { height: "62vh", focusX: 0.4, maxMs: 7600, approachMs: 3200 });
}

/* ================= sound (synthesised with Web Audio — no files) ================= */
let ac = null, master = null, wetIn = null, noiseBuf = null, soundOn = true;
function audio() {
  if (!ac) {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    ac = new AC();
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 6;
    master = ac.createGain(); master.gain.value = 0.9; master.connect(comp); comp.connect(ac.destination);
    const rev = ac.createConvolver(); const len = ac.sampleRate * 2.4, ir = ac.createBuffer(2, len, ac.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    rev.buffer = ir; wetIn = ac.createGain(); wetIn.gain.value = 0.32; wetIn.connect(rev); rev.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 3, ac.sampleRate); const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    loadSamples();
  }
  if (ac.state === "suspended") ac.resume();
  return ac;
}
const now = () => ac.currentTime;
function bus(node, wet = 0.5) { node.connect(master); if (wet) { const s = ac.createGain(); s.gain.value = wet; node.connect(s); s.connect(wetIn); } }
function gainEnv(points) { const g = ac.createGain(); g.gain.setValueAtTime(0.0001, points[0][0]); for (const [t, v] of points) g.gain.linearRampToValueAtTime(v, t); return g; }
function osc(type, freqs, t0, t1) { const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(freqs[0][1], freqs[0][0]); for (const [t, f] of freqs.slice(1)) o.frequency.exponentialRampToValueAtTime(Math.max(20, f), t); o.start(t0); o.stop(t1); return o; }
function noise(t0, t1) { const s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true; s.start(t0, rnd(0, 2)); s.stop(t1); return s; }
function filt(type, f, q = 1) { const b = ac.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; }
function dist(amount = 30) { const w = ac.createWaveShaper(), n = 1024, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = (i / n) * 2 - 1; c[i] = ((3 + amount) * x * 20 * Math.PI / 180) / (Math.PI + amount * Math.abs(x)); } w.curve = c; return w; }
function lfo(target, rate, depth, t0, t1, type = "sine") { const l = ac.createOscillator(); l.type = type; l.frequency.value = rate; const g = ac.createGain(); g.gain.value = depth; l.connect(g); g.connect(target); l.start(t0); l.stop(t1); }
function bell(t, f, dur = 1.6, vol = 0.25) { [[1, 1], [2.76, 0.45], [5.4, 0.25], [8.9, 0.12]].forEach(([m, v]) => { const o = osc("sine", [[t, f * m]], t, t + dur); const g = gainEnv([[t, 0.0001], [t + 0.005, vol * v], [t + dur, 0.0001]]); o.connect(g); bus(g, 0.6); }); }
function pluck(t, f, vol = 0.3) { const o = osc("triangle", [[t, f]], t, t + 0.9); const g = gainEnv([[t, 0.0001], [t + 0.01, vol], [t + 0.9, 0.0001]]); const lp = filt("lowpass", 3000); o.connect(lp); lp.connect(g); bus(g, 0.5); }
function thump(t, f = 70, vol = 0.9, dur = 0.35) { const o = osc("sine", [[t, f * 1.8], [t + 0.08, f]], t, t + dur); const g = gainEnv([[t, 0.0001], [t + 0.01, vol], [t + dur, 0.0001]]); o.connect(g); bus(g, 0.2); }

const SOUNDS = {
  tick(t) { pluck(t, 1400, 0.12); },
  pluck(t) { [784, 988, 1175, 1568].forEach((f, i) => pluck(t + i * 0.07, f, 0.22)); },
  chime(t) { [1047, 1319, 1568].forEach((f, i) => bell(t + i * 0.09, f, 1.4, 0.18)); },
  sparkle(t) { const sc = [1568, 1760, 2093, 2349, 2637, 3136]; for (let i = 0; i < 14; i++) bell(t + i * 0.07, pick(sc), 0.9, 0.09); },
  clap(t) { for (let i = 0; i < 6; i++) { const tt = t + i * 0.13 + rnd(0, 0.02); const n = noise(tt, tt + 0.12), bp = filt("bandpass", 1500, 0.8), g = gainEnv([[tt, 0.0001], [tt + 0.003, 0.7], [tt + 0.11, 0.0001]]); n.connect(bp); bp.connect(g); bus(g, 0.4); } },
  fanfareShort(t) { brass(t, [523, 659, 784], 0.12, 0.25); brass(t + 0.4, [1047], 0.6, 0.3); },
  meow(t) {
    const d = 1.0;
    const o = osc("sawtooth", [[t, 470], [t + 0.22, 780], [t + 0.55, 720], [t + d, 430]], t, t + d + 0.05);
    lfo(o.frequency, 6, 14, t, t + d);
    const f1 = filt("bandpass", 800, 5), f2 = filt("bandpass", 1900, 6);
    f1.frequency.setValueAtTime(700, t); f1.frequency.linearRampToValueAtTime(1150, t + 0.3); f1.frequency.linearRampToValueAtTime(780, t + d);
    f2.frequency.setValueAtTime(1800, t); f2.frequency.linearRampToValueAtTime(2600, t + 0.3); f2.frequency.linearRampToValueAtTime(1600, t + d);
    const g = gainEnv([[t, 0.0001], [t + 0.06, 0.9], [t + 0.6, 0.7], [t + d, 0.0001]]);
    o.connect(f1); o.connect(f2); f1.connect(g); f2.connect(g); bus(g, 0.35);
  },
  bark(t) {
    [0, 0.32, 0.9, 1.18].forEach((dt) => {
      const tt = t + dt;
      const o = osc("square", [[tt, 340], [tt + 0.05, 420], [tt + 0.16, 190]], tt, tt + 0.2);
      const n = noise(tt, tt + 0.18), nb = filt("bandpass", 900, 1.2);
      const ws = dist(60), lp = filt("lowpass", 2200), fm = filt("bandpass", 650, 1.5);
      const g = gainEnv([[tt, 0.0001], [tt + 0.008, 0.85], [tt + 0.06, 0.6], [tt + 0.18, 0.0001]]);
      o.connect(ws); ws.connect(fm); n.connect(nb); nb.connect(fm); fm.connect(lp); lp.connect(g); bus(g, 0.3);
    });
  },
  ribbit(t) {
    [0, 0.2, 0.75, 0.95].forEach((dt) => {
      const tt = t + dt;
      const o = osc("square", [[tt, 170], [tt + 0.13, 140]], tt, tt + 0.15);
      const am = ac.createGain(); am.gain.value = 0.5; lfo(am.gain, 45, 0.5, tt, tt + 0.15, "square");
      const bp = filt("bandpass", 900, 2), g = gainEnv([[tt, 0.0001], [tt + 0.01, 0.8], [tt + 0.14, 0.0001]]);
      o.connect(am); am.connect(bp); bp.connect(g); bus(g, 0.35);
    });
  },
  crow(t) {
    const d = 1.6;
    const o = osc("sawtooth", [[t, 560], [t + 0.12, 880], [t + 0.42, 820], [t + 0.55, 1020], [t + 1.0, 980], [t + d, 520]], t, t + d);
    lfo(o.frequency, 9, 30, t, t + d);
    const bp = filt("bandpass", 1500, 2.5), bp2 = filt("bandpass", 2800, 4), ws = dist(20);
    const g = gainEnv([[t, 0.0001], [t + 0.05, 0.6], [t + 0.4, 0.4], [t + 0.5, 0.75], [t + 1.3, 0.6], [t + d, 0.0001]]);
    o.connect(ws); ws.connect(bp); ws.connect(bp2); bp.connect(g); bp2.connect(g); bus(g, 0.45);
  },
  dolphin(t) {
    for (let i = 0; i < 4; i++) {
      const tt = t + 0.2 + i * 0.42;
      const o = osc("sine", [[tt, 3200], [tt + 0.12, 6400], [tt + 0.28, 3600]], tt, tt + 0.3);
      lfo(o.frequency, 30, 200, tt, tt + 0.3);
      const g = gainEnv([[tt, 0.0001], [tt + 0.02, 0.22], [tt + 0.28, 0.0001]]); o.connect(g); bus(g, 0.5);
    }
    for (let i = 0; i < 16; i++) { const tt = t + i * 0.06; const n = noise(tt, tt + 0.01), hp = filt("highpass", 3500), g = gainEnv([[tt, 0.0001], [tt + 0.001, 0.4], [tt + 0.01, 0.0001]]); n.connect(hp); hp.connect(g); bus(g, 0.2); }
    [0.05, 2.6].forEach((dt) => { const tt = t + dt; const n = noise(tt, tt + 1.1), lp = filt("lowpass", 4000); lp.frequency.setValueAtTime(5000, tt); lp.frequency.exponentialRampToValueAtTime(300, tt + 1.0); const g = gainEnv([[tt, 0.0001], [tt + 0.02, 0.8], [tt + 1.1, 0.0001]]); n.connect(lp); lp.connect(g); bus(g, 0.5); });
  },
  screech(t) {
    [0, 1.1].forEach((dt, k) => {
      const tt = t + dt, d = k ? 0.7 : 1.1;
      const o = osc("sawtooth", [[tt, 2400], [tt + 0.1, 2900], [tt + d, 1700]], tt, tt + d);
      lfo(o.frequency, 32, 90, tt, tt + d);
      const n = noise(tt, tt + d), hp = filt("highpass", 1500), bp = filt("bandpass", 2600, 1.5);
      const g = gainEnv([[tt, 0.0001], [tt + 0.04, 0.55], [tt + d, 0.0001]]), gn = gainEnv([[tt, 0.0001], [tt + 0.04, 0.12], [tt + d, 0.0001]]);
      o.connect(bp); bp.connect(g); n.connect(hp); hp.connect(gn); bus(g, 0.6); bus(gn, 0.6);
    });
  },
  neigh(t) {
    const d = 1.5;
    const o = osc("sawtooth", [[t, 700], [t + 0.25, 1250], [t + 0.9, 900], [t + d, 420]], t, t + d);
    lfo(o.frequency, 13, 130, t, t + d);
    const bp = filt("bandpass", 1400, 2), ws = dist(25);
    const g = gainEnv([[t, 0.0001], [t + 0.06, 0.6], [t + 1.0, 0.45], [t + d, 0.0001]]);
    o.connect(ws); ws.connect(bp); bp.connect(g); bus(g, 0.5);
    for (let i = 0; i < 18; i++) { const tt = t + 0.6 + i * 0.16 + (i % 3 === 2 ? 0.04 : 0); thump(tt, 90, 0.45, 0.12); const n = noise(tt, tt + 0.05), lp = filt("lowpass", 900), gg = gainEnv([[tt, 0.0001], [tt + 0.004, 0.35], [tt + 0.05, 0.0001]]); n.connect(lp); lp.connect(gg); bus(gg, 0.1); }
  },
  stomp(t) { thump(t, 48, 1, 0.5); const n = noise(t, t + 0.25), lp = filt("lowpass", 300), g = gainEnv([[t, 0.0001], [t + 0.01, 0.6], [t + 0.25, 0.0001]]); n.connect(lp); lp.connect(g); bus(g, 0.2); },
  trumpet(t) {
    const d = 1.7;
    const o = osc("sawtooth", [[t, 280], [t + 0.25, 820], [t + 0.9, 760], [t + d, 380]], t, t + d);
    const o2 = osc("sawtooth", [[t, 283], [t + 0.25, 828], [t + 0.9, 768], [t + d, 384]], t, t + d);
    lfo(o.frequency, 7, 28, t, t + d); lfo(o2.frequency, 7.4, 26, t, t + d);
    const ws = dist(80), bp = filt("bandpass", 1200, 0.8), lp = filt("lowpass", 3200);
    const g = gainEnv([[t, 0.0001], [t + 0.12, 0.55], [t + 1.2, 0.5], [t + d, 0.0001]]);
    o.connect(ws); o2.connect(ws); ws.connect(bp); bp.connect(lp); lp.connect(g); bus(g, 0.55);
  },
  roar(t, s = 1, pitch = 1) {
    if (samples.roar) return scaryRoar(t, pitch < 1 ? 0.68 : 0.86); // real recording when it has loaded
    const d = 2.6 * s;
    // throat: two detuned saws, distorted, through a closing lowpass, with a growl tremolo
    const o1 = osc("sawtooth", [[t, 95 * pitch], [t + 0.35, 145 * pitch], [t + d * 0.6, 110 * pitch], [t + d, 62 * pitch]], t, t + d);
    const o2 = osc("sawtooth", [[t, 48 * pitch], [t + 0.35, 72 * pitch], [t + d, 32 * pitch]], t, t + d);
    const ws = dist(140), lp = filt("lowpass", 1200, 0.7);
    lp.frequency.setValueAtTime(500, t); lp.frequency.linearRampToValueAtTime(1600, t + 0.35); lp.frequency.exponentialRampToValueAtTime(350, t + d);
    const growl = ac.createGain(); growl.gain.value = 0.55; lfo(growl.gain, 26, 0.45, t, t + d, "triangle");
    // breath: band-passed noise
    const n = noise(t, t + d), nb = filt("bandpass", 700, 0.9); nb.frequency.setValueAtTime(500, t); nb.frequency.linearRampToValueAtTime(1100, t + 0.4); nb.frequency.exponentialRampToValueAtTime(300, t + d);
    const ng = gainEnv([[t, 0.0001], [t + 0.2, 0.55], [t + d * 0.7, 0.35], [t + d, 0.0001]]);
    const g = gainEnv([[t, 0.0001], [t + 0.18, 1.0], [t + d * 0.55, 0.8], [t + d, 0.0001]]);
    o1.connect(ws); o2.connect(ws); ws.connect(lp); lp.connect(growl); growl.connect(g); n.connect(nb); nb.connect(ng); ng.connect(g);
    bus(g, 0.7);
    thump(t + 0.05, 45, 0.9, 0.9);
  },
  magic(t) { const sc = [1047, 1175, 1319, 1568, 1760, 2093, 2349, 2637]; sc.forEach((f, i) => bell(t + i * 0.09, f, 1.6, 0.14)); sc.reverse().forEach((f, i) => bell(t + 1.2 + i * 0.07, f * 1.5, 1.2, 0.08)); harp(t + 2.2, 523); },
  rocket(t) {
    const d = 3.6;
    const n = noise(t, t + d), lp = filt("lowpass", 120, 0.7);
    lp.frequency.setValueAtTime(90, t); lp.frequency.linearRampToValueAtTime(220, t + 1.1); lp.frequency.exponentialRampToValueAtTime(2200, t + 2.2); lp.frequency.exponentialRampToValueAtTime(200, t + d);
    const g = gainEnv([[t, 0.0001], [t + 0.3, 0.6], [t + 1.1, 0.8], [t + 2.0, 1], [t + d, 0.0001]]);
    n.connect(lp); lp.connect(g); bus(g, 0.4); thump(t + 1.1, 40, 1, 1.2);
  },
  engine(t) {
    const d = 3.0;
    const o = osc("sawtooth", [[t, 55], [t + 0.9, 190], [t + 1.0, 120], [t + 1.7, 260], [t + 1.8, 170], [t + 2.4, 300], [t + d, 90]], t, t + d);
    const o2 = osc("square", [[t, 27.5], [t + 0.9, 95], [t + 1.0, 60], [t + 1.7, 130], [t + 1.8, 85], [t + 2.4, 150], [t + d, 45]], t, t + d);
    const ws = dist(120), lp = filt("lowpass", 900, 2);
    const g = gainEnv([[t, 0.0001], [t + 0.2, 0.55], [t + 2.4, 0.7], [t + d, 0.0001]]);
    o.connect(ws); o2.connect(ws); ws.connect(lp); lp.connect(g); bus(g, 0.25);
    const n = noise(t + 0.9, t + 2.6), bp = filt("bandpass", 600, 0.6); bp.frequency.setValueAtTime(400, t + 0.9); bp.frequency.exponentialRampToValueAtTime(3000, t + 1.7); bp.frequency.exponentialRampToValueAtTime(300, t + 2.6);
    const gn = gainEnv([[t + 0.9, 0.0001], [t + 1.7, 0.45], [t + 2.6, 0.0001]]); n.connect(bp); bp.connect(gn); bus(gn, 0.3);
  },
  bang(t) {
    thump(t, 55, 1, 0.7);
    const n = noise(t, t + 0.9), lp = filt("lowpass", 1800), g = gainEnv([[t, 0.0001], [t + 0.005, 1], [t + 0.9, 0.0001]]); n.connect(lp); lp.connect(g); bus(g, 0.6);
    for (let i = 0; i < 26; i++) { const tt = t + 0.25 + rnd(0, 1.1); const c = noise(tt, tt + 0.015), hp = filt("highpass", 2500), gg = gainEnv([[tt, 0.0001], [tt + 0.001, rnd(0.1, 0.35)], [tt + 0.015, 0.0001]]); c.connect(hp); hp.connect(gg); bus(gg, 0.5); }
  },
  fireworks() {},
  diamonds(t) { const sc = [2093, 2349, 2637, 3136, 3520, 4186]; for (let i = 0; i < 26; i++) bell(t + i * 0.12 + rnd(0, 0.05), pick(sc), 1.2, 0.08); bell(t, 1047, 2.5, 0.25); bell(t + 0.15, 1568, 2.5, 0.2); },
  wings(t) { for (let i = 0; i < 6; i++) { const tt = t + i * 0.28; const n = noise(tt, tt + 0.22), bp = filt("bandpass", 350, 0.8), g = gainEnv([[tt, 0.0001], [tt + 0.08, 0.7], [tt + 0.22, 0.0001]]); n.connect(bp); bp.connect(g); bus(g, 0.3); } },
  dragon(t) {
    SOUNDS.roar(t, 1.35, 0.72);
    const d = 2.2, tt = t + 0.3;
    const n = noise(tt, tt + d), bp = filt("bandpass", 900, 0.7); const am = ac.createGain(); am.gain.value = 0.6; lfo(am.gain, 17, 0.35, tt, tt + d, "sawtooth");
    const g = gainEnv([[tt, 0.0001], [tt + 0.2, 0.7], [tt + d, 0.0001]]); n.connect(bp); bp.connect(am); am.connect(g); bus(g, 0.4);
  },
  fanfare(t) { brass(t, [392, 523], 0.18, 0.28); brass(t + 0.22, [523, 659], 0.18, 0.28); brass(t + 0.44, [659, 784], 0.18, 0.28); brass(t + 0.7, [523, 659, 784, 1047], 1.6, 0.3); bell(t + 0.7, 2093, 2, 0.12); },
};
function brass(t, notes, dur, vol) {
  notes.forEach((f) => {
    const o = osc("sawtooth", [[t, f]], t, t + dur + 0.1); lfo(o.frequency, 5.5, f * 0.006, t, t + dur);
    const lp = filt("lowpass", 900, 1.2); lp.frequency.setValueAtTime(600, t); lp.frequency.linearRampToValueAtTime(3200, t + 0.06); lp.frequency.linearRampToValueAtTime(1800, t + dur);
    const g = gainEnv([[t, 0.0001], [t + 0.03, vol / notes.length * 1.6], [t + dur, vol / notes.length], [t + dur + 0.1, 0.0001]]);
    o.connect(lp); lp.connect(g); bus(g, 0.45);
  });
}
/* real recordings (Pixabay Content License) */
const SAMPLE_FILES = { roar: "sounds/lion-roar.mp3" }; // "The Fierce Roar of a Lion" by PWLPL on Pixabay
const samples = {};
function loadSamples() {
  for (const [k, url] of Object.entries(SAMPLE_FILES)) {
    fetch(url).then((r) => r.arrayBuffer()).then((ab) => new Promise((res, rej) => ac.decodeAudioData(ab, res, rej)))
      .then((buf) => (samples[k] = buf)).catch((e) => console.warn("sample", k, e));
  }
}
// the real roar, made deeper and scarier: slowed down, bass boosted, a low rumble underneath, cave echo
function scaryRoar(t, rate = 0.86) {
  const buf = samples.roar, dur = buf.duration / rate;
  const src = ac.createBufferSource(); src.buffer = buf; src.playbackRate.value = rate;
  const shelf = filt("lowshelf", 200); shelf.gain.value = 10;
  const mid = filt("peaking", 900, 0.8); mid.gain.value = 3;
  const grit = dist(10);
  const g = ac.createGain(); g.gain.value = 1.15;
  src.connect(shelf); shelf.connect(mid); mid.connect(grit); grit.connect(g); bus(g, 0.75);
  // a slapback echo so it sounds like it fills the room
  const dl = ac.createDelay(1); dl.delayTime.value = 0.23; const fb = ac.createGain(); fb.gain.value = 0.28; const dlp = filt("lowpass", 1800);
  g.connect(dl); dl.connect(dlp); dlp.connect(fb); fb.connect(dl); const dg = ac.createGain(); dg.gain.value = 0.35; dlp.connect(dg); bus(dg, 0.5);
  src.start(t);
  // sub-bass rumble you feel more than hear
  const sub = osc("sine", [[t, 52], [t + dur, 34]], t, t + dur);
  const sg = gainEnv([[t, 0.0001], [t + 0.25, 0.55], [t + dur * 0.7, 0.4], [t + dur, 0.0001]]);
  sub.connect(sg); bus(sg, 0);
  thump(t + 0.02, 42, 1, 1.1);
  return dur;
}
// the same roar heard from far away: quiet, muffled, mostly echo
function farRoar(t) {
  if (!samples.roar) { SOUNDS.roar(t); return; }
  const src = ac.createBufferSource(); src.buffer = samples.roar; src.playbackRate.value = 0.9;
  const lp = filt("lowpass", 650, 0.7), hp = filt("highpass", 90);
  const g = ac.createGain(); g.gain.value = 0.32;
  src.connect(hp); hp.connect(lp); lp.connect(g);
  g.connect(master); const wet = ac.createGain(); wet.gain.value = 1.4; g.connect(wet); wet.connect(wetIn);
  src.start(t);
}
SOUNDS.roarFar = farRoar;
function harp(t, root) { [1, 1.25, 1.5, 2, 2.5, 3, 4].forEach((m, i) => pluck(t + i * 0.06, root * m, 0.2)); }
function play(name) { if (!soundOn || !audio() || !SOUNDS[name]) return; try { SOUNDS[name](now() + 0.03); } catch (e) { console.warn(e); } }

/* ---------- app versions of the demo helpers (these later declarations replace the demo ones) ---------- */
function banner(g, to, ms = 3200) {
  const safe = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const b = el("tg-banner", `<span class="be">${g.e}</span><span class="bt" dir="auto"><b>${safe(to.from)}</b> ${g.e} → <b>${safe(to.name)}</b></span>`);
  b.animate([{ transform: "translate(-50%,-140%)" }, { transform: "translate(-50%,0)", offset: 0.1 }, { transform: "translate(-50%,0)", offset: 0.88 }, { transform: "translate(-50%,-140%)" }], { duration: ms, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" }).finished.then(() => b.remove());
}
function seatPoint() { return { x: W / 2, y: H * 0.16 }; }

/* ---------- public API ---------- */
let queueP = Promise.resolve(), combo = { id: null, n: 0, timer: 0 }, pending = 0;
function sayFor(id) {
  const l = (typeof uiLang === "string" ? uiLang : document.documentElement.lang) || "en";
  const s = SAY[id]; if (!s) return "";
  return s[l] || (l === "fa" ? s.ar : s.en);
}
/* 🔢 combo counter: every time the same person sends the same gift, the number goes up (x1, x2, x3 …).
   It stays on screen while the gifts keep coming, and a few seconds after the last one. */
const combos = new Map();   // "from|gift|to" → { n, el, timer }
function comboCss() {
  if (document.getElementById("gfx-combo-css")) return;
  const s = document.createElement("style"); s.id = "gfx-combo-css";
  s.textContent = `
.gc-wrap{position:fixed;inset-inline-start:10px;top:calc(96px + env(safe-area-inset-top));z-index:70;display:flex;flex-direction:column;gap:8px;pointer-events:none}
.gc{display:flex;align-items:center;gap:8px;padding:5px 14px 5px 6px;border-radius:999px;background:linear-gradient(90deg,rgba(255,138,61,.92),rgba(255,95,162,.55) 70%,transparent);
  color:#fff;font-weight:800;font-size:13px;max-width:78vw;animation:gcin .3s ease-out;box-shadow:0 6px 18px rgba(0,0,0,.25)}
[dir=rtl] .gc{background:linear-gradient(270deg,rgba(255,138,61,.92),rgba(255,95,162,.55) 70%,transparent)}
.gc .ge2{font-size:26px;line-height:1}
.gc .gt{min-width:0;line-height:1.25}
.gc .gt b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:46vw}
.gc .gt span{font-size:11px;opacity:.9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;max-width:46vw}
.gc .gx{font-size:26px;font-weight:900;font-style:italic;color:#ffe066;text-shadow:0 2px 0 #b5470b,0 0 12px rgba(255,200,60,.7);margin-inline-start:4px;direction:ltr;unicode-bidi:isolate}
.gc .gx.pop{animation:gcpop .35s cubic-bezier(.2,1.6,.4,1)}
.gc.out{animation:gcout .4s ease-in forwards}
@keyframes gcin{from{opacity:0;transform:translateX(-30px)}}
[dir=rtl] .gc{animation-name:gcinr}
@keyframes gcinr{from{opacity:0;transform:translateX(30px)}}
@keyframes gcpop{0%{transform:scale(1.9)}100%{transform:scale(1)}}
@keyframes gcout{to{opacity:0;transform:translateY(-14px)}}
@media (prefers-reduced-motion:reduce){.gc,.gc .gx.pop,.gc.out{animation:none}}`;
  document.head.appendChild(s);
}
function bumpCombo(g, to, key, fromId, add = 1) {
  // 👑 in a live: the sender's name + level badge + gift fly in like coming in (levels.js), x2, x3 …
  if (window.LevelFX && document.getElementById("screen-room") && !document.getElementById("screen-room").hidden) {
    return window.LevelFX.giftStrip(g.e, to.from, to.name, fromId, add) || 1;
  }
  comboCss();
  let wrap = document.querySelector(".gc-wrap");
  if (!wrap) { wrap = document.createElement("div"); wrap.className = "gc-wrap"; document.body.appendChild(wrap); }
  const safe = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  let c = combos.get(key);
  if (!c || !c.el.isConnected) {
    const el = document.createElement("div"); el.className = "gc";
    el.innerHTML = `<span class="ge2">${g.e}</span><span class="gt"><b dir="auto">${safe(to.from)}</b><span dir="auto">→ ${safe(to.name)}</span></span><span class="gx">x1</span>`;
    while (wrap.children.length >= 3) wrap.firstElementChild.remove();   // at most 3 counters at once
    wrap.appendChild(el);
    c = { n: 0, el, timer: 0 }; combos.set(key, c);
  }
  c.n += add;
  const gx = c.el.querySelector(".gx");
  gx.textContent = "x" + c.n;
  gx.classList.remove("pop"); void gx.offsetWidth; gx.classList.add("pop");
  clearTimeout(c.timer);
  c.timer = setTimeout(() => { c.el.classList.add("out"); setTimeout(() => { c.el.remove(); if (combos.get(key) === c) combos.delete(key); }, 420); }, 3500);
  return c.n;
}
/* ⚡ never lag, even with 50,000 gifts:
   - under 100 coins (🌹 ❤️ 👏): only the small name strip, no big animation at all
   - other small gifts: their little animation at most every 0.6 s (the counter still counts every one)
   - big gifts: one at a time, at most 20 waiting; more than that are only counted (x…), not piled up */
const SMALL_MAX = 100, BIG_WAIT_MAX = 20;
let lastSmall = 0;
function playGift(id, fromName, toName, fromId, opts) {
  const meta = BY_ID[id]; if (!meta) return;
  const qty = Math.max(1, Math.min(10000, Math.floor(Number(opts?.qty) || 1)));
  const price = Number(opts?.price);
  const g = { ...meta, say: sayFor(id) };
  const to = { name: toName || "", from: fromName || "" };
  const n = bumpCombo(g, to, `${fromId || fromName}|${id}|${toName}`, fromId, qty);
  if (Number.isFinite(price) && price > 0 && price < SMALL_MAX) return;   // cheap gift: the strip is enough
  try { audio(); } catch {}
  if (meta.tier === "small") {
    const now = performance.now();
    if (now - lastSmall < 600) return;
    lastSmall = now; combo.n = n; combo.id = id;
    g.run(g, to, n);
    return;
  }
  // big gifts: one after another, never more than BIG_WAIT_MAX waiting
  const add = Math.min(qty, Math.max(0, BIG_WAIT_MAX - pending));
  for (let i = 0; i < add; i++) queueBig(g, to);
}
function queueBig(g, to) {
  pending++;
  queueP = queueP.then(() => g.run(g, to)).catch((e) => console.warn("gift fx", e)).finally(() => pending--);
}
// sounds need one tap on the page first (browser rule); any tap unlocks them
const unlock = () => { try { audio(); } catch {} };
document.addEventListener("pointerdown", unlock, { once: true, capture: true });

window.GiftFX = {
  play: playGift,
  has: (id) => !!BY_ID[id],
  tierOf: (id) => BY_ID[id]?.tier || null,
  emoji: (id) => BY_ID[id]?.e || "🎁",
  setSound: (on) => { soundOn = !!on; },
  playVideo: playKeyedVideo, // for realistic gift videos later (green screen or packed alpha MP4)
};
})();
