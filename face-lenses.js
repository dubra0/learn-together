/* =====================================================================
   Talk Together — ✨ beauty filters that follow the face
   - smaller, slimmer nose · slightly bigger eyes · slimmer jaw (V-face)
   - smooth skin (edges stay sharp) · brighter, fairer skin — on the face only
   Face tracking: Google MediaPipe Face Landmarker (runs on the phone, nothing is uploaded).
   The reshaping and skin work run on the phone's graphics chip (WebGL) so they stay fast.
   Hooks into app.js drawFiltered() via window.FaceLens.render(); uses globals FILTERS, FILTER_CATS, I18N, filterCat.
   ===================================================================== */
"use strict";
(function () {
const VISION = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
const MODEL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

/* ---------- presets (0 … 1) ---------- */
const PRESETS = {
  natural: { name: "✨ Natural",   smooth: 0.45, white: 0.20, nose: 0.30, eyes: 0.25, slim: 0.25 },
  pretty:  { name: "🌸 Pretty",    smooth: 0.65, white: 0.35, nose: 0.50, eyes: 0.45, slim: 0.45, blush: 0.22 },
  fair:    { name: "🤍 Fair skin", smooth: 0.55, white: 0.70, nose: 0.30, eyes: 0.25, slim: 0.30 },
  glam:    { name: "💎 Glam",      smooth: 0.75, white: 0.45, nose: 0.60, eyes: 0.55, slim: 0.55, lips: 0.30, blush: 0.18 },
  glow:    { name: "🌙 Soft glow", smooth: 0.80, white: 0.50, nose: 0.35, eyes: 0.30, slim: 0.30, glow: 0.30 },
  nose:    { name: "👃 Slim nose", smooth: 0.35, white: 0.15, nose: 0.85, eyes: 0.15, slim: 0.20 },
  vface:   { name: "😊 V-face",    smooth: 0.45, white: 0.25, nose: 0.40, eyes: 0.30, slim: 0.85 },
  smooth:  { name: "🧴 Smooth skin", smooth: 0.85, white: 0.30, nose: 0, eyes: 0, slim: 0 },
};

/* ---------- face tracker ---------- */
let landmarker = null, loading = null, failed = false, lastTs = -1, lastCost = 0, frameNo = 0, lm = null;
function loadTracker() {
  if (landmarker || failed) return Promise.resolve(landmarker);
  if (loading) return loading;
  loading = (async () => {
    try {
      const vision = await import(VISION + "/vision_bundle.mjs");
      const files = await vision.FilesetResolver.forVisionTasks(VISION + "/wasm");
      const make = (delegate) => vision.FaceLandmarker.createFromOptions(files, { baseOptions: { modelAssetPath: MODEL, delegate }, runningMode: "VIDEO", numFaces: 1 });
      try { landmarker = await make("GPU"); } catch { landmarker = await make("CPU"); }
    } catch (err) { console.warn("face tracker", err); failed = true; }
    return landmarker;
  })();
  return loading;
}
function track(video) {
  if (!landmarker || video.readyState < 2) return;
  frameNo++;
  if (lastCost > 28 && frameNo % 2) return; // slow phone: find the face every other frame
  const ts = performance.now(); if (ts <= lastTs) return; lastTs = ts;
  let res; try { res = landmarker.detectForVideo(video, ts); } catch { return; }
  lastCost = lastCost * 0.8 + (performance.now() - ts) * 0.2;
  lm = res?.faceLandmarks?.[0] || null;
}

/* ---------- face measurements (smoothed so nothing wobbles) ---------- */
let prev = null;
function measure(w, h) {
  if (!lm) { prev = null; return null; }
  const P = (i) => ({ x: lm[i].x * w, y: lm[i].y * h });
  const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const L = P(234), R = P(454), top = P(10), chin = P(152);
  const faceW = d(L, R), faceH = d(top, chin);
  const eyeLo = P(33), eyeRo = P(263);
  const angle = Math.atan2(eyeRo.y - eyeLo.y, eyeRo.x - eyeLo.x);
  const irisL = lm.length > 473 ? P(468) : P(159), irisR = lm.length > 473 ? P(473) : P(386);
  const nose = (() => { const a = P(129), b = P(358), t = P(4); return { x: (a.x + b.x + t.x) / 3, y: (a.y + b.y + t.y * 1) / 3, r: d(a, b) * 0.95 }; })();
  const centre = { x: (P(1).x + P(168).x) / 2, y: (P(1).y + P(168).y) / 2 };
  const m = {
    nose, irisL, irisR, eyeR: d(P(33), P(133)) * 0.95,
    jawL: P(172), jawR: P(397), jawL2: P(136), jawR2: P(365), centre, jawRad: faceW * 0.3,
    maskC: { x: (top.x + chin.x) / 2, y: (top.y + chin.y) / 2 }, maskR: { x: faceW * 0.55, y: faceH * 0.58 }, angle,
    cheekL: P(205), cheekR: P(425), faceW,
  };
  if (prev) { // gentle smoothing of every number
    const mix = (a, b) => (typeof a === "number" ? b * 0.55 + a * 0.45 : Object.fromEntries(Object.keys(b).map((k) => [k, mix(a[k], b[k])])));
    for (const k of Object.keys(m)) m[k] = mix(prev[k], m[k]);
  }
  prev = m;
  return m;
}

/* ---------- WebGL: reshape + skin ---------- */
const VS = `attribute vec2 a; varying vec2 v; void main(){ v = vec2((a.x+1.)/2., (1.-a.y)/2.); gl_Position = vec4(a,0.,1.); }`;
const FS = `precision highp float;
varying vec2 v; uniform sampler2D tex; uniform vec2 res; uniform float has;
uniform vec3 nose; uniform float noseK;                 // x, y, radius (px)
uniform vec2 eyeL, eyeR; uniform float eyeRad, eyeK;
uniform vec2 jawL, jawR, jawL2, jawR2, centre; uniform float jawRad, slimK;
uniform vec2 maskC, maskR; uniform float ang, smoothK, whiteK;
float ease(float x){ x = clamp(x, 0., 1.); return x*x*(3.-2.*x); }
vec2 enlarge(vec2 p, vec2 c, float r, float k){ vec2 d = p-c; float l = length(d); if (l < r) { float f = 1.-l/r; return c + d*(1.-k*f*f); } return p; }
vec2 narrowX(vec2 p, vec3 n, float k, vec2 ax, vec2 ay){
  vec2 d = p-n.xy; float dx = dot(d, ax), dy = dot(d, ay);
  float l = length(vec2(dx, dy*0.75)); if (l < n.z*1.6) { float f = ease(1.-l/(n.z*1.6)); dx *= 1.+k*f; return n.xy + ax*dx + ay*dy; } return p; }
vec2 pull(vec2 p, vec2 a, vec2 to, float r, float k){ vec2 d = p-a; float l = length(d); if (l < r) { float f = ease(1.-l/r); return p - (to-a)*k*f; } return p; }
void main(){
  vec2 p = v*res;
  vec2 ax = vec2(cos(ang), sin(ang)), ay = vec2(-sin(ang), cos(ang));
  if (has > .5) {
    p = pull(p, jawL, centre, jawRad, slimK); p = pull(p, jawR, centre, jawRad, slimK);
    p = pull(p, jawL2, centre, jawRad*.8, slimK*.8); p = pull(p, jawR2, centre, jawRad*.8, slimK*.8);
    p = narrowX(p, nose, noseK, ax, ay);
    p = enlarge(p, eyeL, eyeRad, eyeK); p = enlarge(p, eyeR, eyeRad, eyeK);
  }
  vec2 uv = p/res;
  vec3 c0 = texture2D(tex, uv).rgb;
  // where is the face? (soft-edged oval)
  vec2 q = p - maskC; q = vec2(dot(q, ax), dot(q, ay)) / maskR;
  float mask = has * (1. - smoothstep(.82, 1.08, length(q)));
  // crisp picture: light sharpening everywhere except smoothed skin (hair, eyes, clothes look sharper)
  vec2 px = 1. / res;
  vec3 nb = (texture2D(tex, uv + vec2(px.x, 0.)).rgb + texture2D(tex, uv - vec2(px.x, 0.)).rgb
           + texture2D(tex, uv + vec2(0., px.y)).rgb + texture2D(tex, uv - vec2(0., px.y)).rgb) * .25;
  vec3 detail = c0 - nb;
  vec3 col = clamp(c0 + detail * .55 * (1. - mask * .7), 0., 1.);
  if (mask > .01 && smoothK > .01) {
    // edge-keeping blur: neighbours that look different (eyes, brows, lips) count less
    float rad = res.y * .0045;
    vec3 sum = c0; float ws = 1.;
    for (int i = 0; i < 8; i++) {
      float a = float(i) * .7854 + .39;
      vec2 o = vec2(cos(a), sin(a)) * rad / res;
      vec3 c = texture2D(tex, uv + o).rgb;  float w = exp(-dot(c-c0, c-c0) * 40.);  sum += c*w; ws += w;
      vec3 c2 = texture2D(tex, uv + o*2.2).rgb; float w2 = exp(-dot(c2-c0, c2-c0) * 40.) * .7; sum += c2*w2; ws += w2;
    }
    // smooth spots and blemishes, but keep a little of the fine skin texture so it stays real, not plastic
    vec3 sm = sum/ws + detail * .3;
    col = mix(col, sm, smoothK * mask * .8);
  }
  // fairer, brighter skin (gentle curve, a touch less red)
  float wk = whiteK * mask;
  col = mix(col, 1. - (1.-col)*(1.-col), wk * .55);
  col = mix(col, vec3(dot(col, vec3(.299,.587,.114))), wk * .12);
  gl_FragColor = vec4(col, 1.);
}`;
let gl = null, glc = null, prog = null, texObj = null, U = {};
function setupGL() {
  if (gl) return true;
  glc = document.createElement("canvas");
  gl = glc.getContext("webgl", { premultipliedAlpha: false, preserveDrawingBuffer: false });
  if (!gl) return false;
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(o)); return o; };
  prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog); gl.useProgram(prog);
  const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "a"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  texObj = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, texObj);
  [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach((k) => gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  for (const n of ["res", "has", "nose", "noseK", "eyeL", "eyeR", "eyeRad", "eyeK", "jawL", "jawR", "jawL2", "jawR2", "centre", "jawRad", "slimK", "maskC", "maskR", "ang", "smoothK", "whiteK"]) U[n] = gl.getUniformLocation(prog, n);
  return true;
}
function runGL(src, w, h, m, p) {
  if (glc.width !== w || glc.height !== h) { glc.width = w; glc.height = h; }
  gl.viewport(0, 0, w, h);
  gl.bindTexture(gl.TEXTURE_2D, texObj);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, src);
  gl.uniform2f(U.res, w, h);
  gl.uniform1f(U.has, m ? 1 : 0);
  if (m) {
    gl.uniform3f(U.nose, m.nose.x, m.nose.y, m.nose.r); gl.uniform1f(U.noseK, p.nose * 0.30);
    gl.uniform2f(U.eyeL, m.irisL.x, m.irisL.y); gl.uniform2f(U.eyeR, m.irisR.x, m.irisR.y); gl.uniform1f(U.eyeRad, m.eyeR); gl.uniform1f(U.eyeK, p.eyes * 0.22);
    gl.uniform2f(U.jawL, m.jawL.x, m.jawL.y); gl.uniform2f(U.jawR, m.jawR.x, m.jawR.y); gl.uniform2f(U.jawL2, m.jawL2.x, m.jawL2.y); gl.uniform2f(U.jawR2, m.jawR2.x, m.jawR2.y);
    gl.uniform2f(U.centre, m.centre.x, m.centre.y); gl.uniform1f(U.jawRad, m.jawRad); gl.uniform1f(U.slimK, p.slim * 0.11);
    gl.uniform2f(U.maskC, m.maskC.x, m.maskC.y); gl.uniform2f(U.maskR, m.maskR.x, m.maskR.y); gl.uniform1f(U.ang, m.angle);
  }
  gl.uniform1f(U.smoothK, p.smooth); gl.uniform1f(U.whiteK, p.white);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

/* ---------- small extras: blush, lip colour, soft glow ---------- */
const LIPS = [61,185,40,39,37,0,267,269,270,409,291,375,321,405,314,17,84,181,91,146];
const MOUTH = [78,191,80,81,82,13,312,311,310,415,308,324,318,402,317,14,87,178,88,95];
function blush(ctx, m, a) {
  for (const p of [m.cheekL, m.cheekR]) {
    const r = m.faceW * 0.13, g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
    g.addColorStop(0, `rgba(255,110,140,${a})`); g.addColorStop(1, "rgba(255,110,140,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 7); ctx.fill();
  }
}
function lips(ctx, w, h, a) {
  ctx.save(); ctx.globalCompositeOperation = "multiply"; ctx.beginPath();
  for (const ring of [LIPS, MOUTH]) { // outer lip line minus the open mouth, so teeth stay white
    ring.forEach((i, n) => { const x = lm[i].x * w, y = lm[i].y * h; n ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.closePath();
  }
  ctx.fillStyle = `rgba(225,60,95,${a})`; ctx.fill("evenodd"); ctx.restore();
}
let glowC = null;
function glow(ctx, w, h, a) {
  glowC = glowC || document.createElement("canvas"); glowC.width = Math.round(w / 6); glowC.height = Math.round(h / 6);
  const g = glowC.getContext("2d"); g.filter = "blur(3px) brightness(1.2)"; g.drawImage(ctx.canvas, 0, 0, glowC.width, glowC.height); g.filter = "none";
  ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.globalAlpha = a; ctx.drawImage(glowC, 0, 0, w, h); ctx.restore();
}

/* ---------- called by app.js for every camera frame ---------- */
function render(ctx, v, w, h, f) {
  const p = PRESETS[f.beautyPreset];
  if (!p) return;
  if (!landmarker) loadTracker();
  if (!setupGL()) return;
  track(v);
  const m = landmarker ? measure(w, h) : null;
  runGL(v, w, h, m, p);
  ctx.drawImage(glc, 0, 0, w, h);
  if (m && lm) {
    if (p.blush) blush(ctx, m, p.blush);
    if (p.lips) lips(ctx, w, h, p.lips);
  }
  if (p.glow) glow(ctx, w, h, p.glow);
}

/* ---------- the ✨ tab in the filter picker ---------- */
try {
  if (typeof FILTERS !== "undefined" && Array.isArray(FILTERS)) {
    for (const [id, pr] of Object.entries(PRESETS)) FILTERS.push({ id: FILTERS.length, name: pr.name, cat: "face", beautyPreset: id, ar: "beauty" });
    if (typeof FILTER_CATS !== "undefined") {
      // the old whole-picture "💄 Beauty" tab is replaced by these face-aware ones
      for (let i = FILTER_CATS.length - 1; i >= 0; i--) if (FILTER_CATS[i][0] === "beauty") FILTER_CATS.splice(i, 1);
      if (!FILTER_CATS.some(([k]) => k === "face")) FILTER_CATS.unshift(["face", "💖"]);
    }
    const NAMES = { en: "Beauty", ckb: "جوانکاری", ar: "تجميل", tr: "Güzellik", fa: "زیبایی", de: "Beauty", fr: "Beauté", es: "Belleza" };
    for (const [l, n] of Object.entries(NAMES)) if (I18N[l]) I18N[l].fc_face = n;
    if (typeof filterCat !== "undefined") filterCat = "face";
  }
} catch (e) { console.warn("beauty filters", e); }

window.FaceLens = { render, load: loadTracker, presets: PRESETS, get ready() { return !!landmarker; } };
})();
