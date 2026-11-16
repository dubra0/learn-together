/* =====================================================================
   👑 Level looks (same as the approved demo)
   - Lv 20–100: a new badge every 2 levels (41 looks); effects grow with the level
   - 🎉 level-up in a live: the name, big, in the middle (everyone sees it)
   - 🚪 coming into a live: bigger the higher the level (Lv 100 stops the room)
   - 🎁 a gift: name + badge + gift fly in like coming in, ~2 s, quick gifts count x2, x3 …
   Comments in the chat stay plain (no badge), as asked.
   Uses globals from app.js: coinLevel, me, profile, profileCache, getProfile, esc, t, avHtml, I18N
   ===================================================================== */
(() => {
  const W = {
    en: { lx_reached: "🎉 reached level {lv}", lx_up: "LEVEL UP", lx_came: "came in ✨", lx_legend: "🌟 A legend came in", lx_gift: "🎁 sent a gift to {name}", lx_sys: "🎉 {name} reached Lv {lv}" },
    ckb: { lx_reached: "🎉 گەیشتە لێڤڵ {lv}", lx_up: "LEVEL UP", lx_came: "هاتە ژوورەوە ✨", lx_legend: "🌟 ئەفسانە هاتە ژوورەوە", lx_gift: "🎁 دیاری نارد بۆ {name}", lx_sys: "🎉 {name} گەیشتە Lv {lv}" },
    ar: { lx_reached: "🎉 وصل إلى المستوى {lv}", lx_up: "LEVEL UP", lx_came: "دخل البث ✨", lx_legend: "🌟 أسطورة دخلت البث", lx_gift: "🎁 أرسل هدية إلى {name}", lx_sys: "🎉 {name} وصل إلى Lv {lv}" },
  };
  try { for (const [l, o] of Object.entries(W)) if (I18N[l]) Object.assign(I18N[l], o); } catch {}

  const SHAPES = {
    hex: "polygon(25% 4%,75% 4%,100% 50%,75% 96%,25% 96%,0 50%)",
    shield: "polygon(50% 0,100% 14%,93% 62%,50% 100%,7% 62%,0 14%)",
    round: "circle(50%)",
    star: "polygon(50% 0,63% 22%,90% 12%,80% 40%,100% 58%,73% 68%,68% 98%,50% 80%,32% 98%,27% 68%,0 58%,20% 40%,10% 12%,37% 22%)",
    gem: "polygon(50% 0,100% 38%,82% 100%,18% 100%,0 38%)",
    diamond: "polygon(50% 0,100% 50%,50% 100%,0 50%)",
  };
  // [light, middle, dark, text colour, icon, shape] — one for every 2 levels from 20, the last one is Lv 100
  const STYLES = [
    ["#ffffff", "#c9d3d0", "#6f7f7a", "#18241f", "⭐", "round"], ["#ffd9b8", "#d9824a", "#7a3a14", "#fff", "🍂", "shield"],
    ["#ffffff", "#b8c7d9", "#56657a", "#13202e", "🌙", "hex"], ["#d8fff4", "#56dcbf", "#0d7563", "#04201a", "🍀", "round"],
    ["#b6ffd9", "#22b573", "#0a5a36", "#fff", "🌿", "gem"], ["#c4f3ff", "#2bb6d9", "#0d5873", "#fff", "🌊", "shield"],
    ["#d9f0ff", "#5fb0ff", "#1f5fb8", "#fff", "☁️", "round"], ["#ffe0ee", "#ff8fbf", "#b8336f", "#fff", "🌸", "star"],
    ["#eadcff", "#9b6bff", "#4a1fa8", "#fff", "🔮", "hex"], ["#fff0c9", "#ff9f5a", "#c2185b", "#fff", "🦋", "gem"],
    ["#fff6cf", "#f3c74e", "#9a6a08", "#2a1800", "👑", "shield"], ["#ffe9a3", "#e0a21b", "#7a4a00", "#2a1800", "🏆", "star"],
    ["#fff0b3", "#ffb627", "#b86a00", "#2a1800", "🍯", "hex"], ["#ffe0c2", "#ff8a3d", "#b8400a", "#fff", "🌅", "round"],
    ["#ffe6a8", "#ff5a1f", "#9e1a05", "#fff", "🔥", "gem"], ["#d9f6ff", "#3fc6ff", "#1a3fb8", "#fff", "💠", "star"],
    ["#ffd0dc", "#e8336f", "#7a0f3a", "#fff", "💗", "shield"], ["#ffd6d6", "#e0313a", "#7a0a14", "#fff", "🍒", "round"],
    ["#ffe0e6", "#ff4f6d", "#8a0a2a", "#fff", "🌹", "gem"], ["#ffe3d6", "#ff7a59", "#a8321a", "#fff", "🐚", "hex"],
    ["#d6e6ff", "#3f7fe8", "#16328a", "#fff", "⚡", "diamond"], ["#d9dcff", "#5a5fd9", "#1a1a5e", "#fff", "🌌", "star"],
    ["#ffffff", "#bfe8ff", "#4a8ab8", "#0d2a40", "❄️", "hex"], ["#d0f7ff", "#27b5c9", "#0a4a5e", "#fff", "🐬", "round"],
    ["#f0d9ff", "#a63fe0", "#3d0a6b", "#ffe28a", "⚜️", "shield"], ["#d8ffcf", "#3fbf4a", "#0f4a14", "#fff", "🐉", "gem"],
    ["#c9fff2", "#5ad1c7", "#5a3fb8", "#fff", "🌈", "star"], ["#e6d9ff", "#7a5cff", "#1f0a4a", "#fff", "🪐", "round"],
    ["#ffe28a", "#3a3a3a", "#0a0a0a", "#ffd76a", "🖤", "hex"], ["#ffe9b0", "#e8a12b", "#8a4a00", "#fff", "🦁", "shield"],
    ["#ffffff", "#c9f1ff", "#5aa9ff", "#0d1b4a", "💎", "diamond"], ["#e0f4ff", "#6fb8ff", "#2a3fd9", "#fff", "💎", "gem"],
    ["#ffe6f4", "#ff8fd0", "#a8238a", "#fff", "💎", "diamond"], ["#f9e6ff", "#d18fff", "#5a8aff", "#fff", "🦄", "star"],
    ["#fffbd0", "#ffe23f", "#5a3fd9", "#1a0a40", "🌩️", "shield"], ["#ffe28a", "#ff6a3d", "#a8105e", "#fff", "🦅", "gem"],
    ["#fff6b8", "#ffc21f", "#e0501a", "#3a1400", "☀️", "star"], ["#fff0b8", "#d9a520", "#6b2a8a", "#fff", "👑", "shield"],
    ["#e0f0ff", "#8fb8ff", "#3a1f8a", "#fff", "☄️", "diamond"], ["#fff2c2", "#ffd76a", "#b8000a", "#3a1400", "🔱", "hex"],
    ["#fff6c2", "#ff5f8f", "#2fd1b3", "#fff", "🌟", "star"],
  ];
  const ix = (L) => Math.min(40, Math.floor((Math.max(20, L) - 20) / 2));
  const pal = (L) => { const s = STYLES[ix(L)]; return { a: s[0], b: s[1], c: s[2] }; };
  const tier = (L) => (L >= 100 ? 9 : Math.max(0, Math.floor((L - 20) / 10)));
  const DECO = ["✨", "🍃", "👑", "🔥", "💗", "⚡", "💎", "🦅", "🦅", "🌟"];
  const lvOf = (x) => { try { return coinLevel(x); } catch { return 1; } };

  function badge(L, big) {
    const s = STYLES[ix(L)];
    const fx = [L >= 40 && "fx-glow", L >= 60 && "fx-flow", L >= 80 && "fx-wing", L >= 100 && "lg100"].filter(Boolean).join(" ");
    const sh = (3.6 - (L - 20) * 0.025).toFixed(2) + "s";
    return `<span class="lj ${fx}${big ? " big" : ""}" style="--a:${s[0]};--b:${s[1]};--c:${s[2]};--ink2:${s[3]};--shape:${SHAPES[s[5]]};--sh:${sh}">` +
      (L >= 80 ? `<span class="wg l"></span><span class="wg r"></span>` : "") +
      `<span class="em"><i>${s[4]}</i></span>` +
      (L >= 70 ? `<span class="sp"></span><span class="sp"></span><span class="sp"></span>` : "") +
      (L >= 90 ? `<span class="cr">👑</span>` : "") +
      `<span class="rb"><small>Lv</small><b>${L}</b></span></span>`;
  }

  const host = () => { const r = document.getElementById("screen-room"); return r && !r.hidden ? r : null; };
  const nm = (s) => esc(String(s || "").slice(0, 30));

  /* 🎉 level-up: the name, big, in the middle of the live */
  let luT = 0;
  function levelup(name, L) {
    const h = host(); if (!h || !(L >= 2 && L <= 100)) return;
    h.querySelector(".lx-lu")?.remove(); clearTimeout(luT);
    const P = L >= 20 ? pal(L) : { a: "#ffffff", b: "#2fd1b3", c: "#0b8f7a" };
    const lu = document.createElement("div"); lu.className = "lx-lu";
    lu.style.setProperty("--a", P.a); lu.style.setProperty("--b", P.b);
    const deco = L >= 100 ? "🎆🌟🎆" : L >= 90 ? "👑" : L >= 80 ? "🪽💎🪽" : L >= 20 ? DECO[tier(L)] : "✨";
    lu.innerHTML = `<div class="dim"></div><div class="rays"></div>
      <div class="card"><div class="deco">${deco}</div><div class="top">${esc(t("lx_up"))}</div>
        <div class="nm" dir="auto">${nm(name)}</div><div class="badge">${L >= 20 ? badge(L, true) : `<span class="lx-plain">Lv ${L}</span>`}</div>
        <div class="sub">${esc(t("lx_reached", { lv: L }))}</div></div>`;
    const pieces = 24 + Math.round(Math.max(0, L - 20) * 0.9), cols = [P.a, P.b, P.c, "#ffffff"];
    for (let i = 0; i < pieces; i++) {
      const s = document.createElement("span"); s.className = "bit";
      const a = Math.random() * Math.PI * 2, r = 120 + Math.random() * 240;
      s.style.background = cols[i % 4];
      s.style.setProperty("--dx", Math.cos(a) * r + "px"); s.style.setProperty("--dy", Math.sin(a) * r + 120 + "px");
      s.style.setProperty("--r", Math.round(Math.random() * 720 - 360) + "deg");
      s.style.animationDelay = (0.15 + Math.random() * 0.4).toFixed(2) + "s";
      lu.appendChild(s);
    }
    if (L >= 90) for (let f = 0; f < (L >= 100 ? 5 : 2); f++) {
      const cx = 15 + Math.random() * 70, cy = 12 + Math.random() * 30;
      for (let i = 0; i < 14; i++) {
        const s = document.createElement("span"); s.className = "spark"; const a = (i / 14) * Math.PI * 2;
        s.style.left = cx + "%"; s.style.top = cy + "%";
        s.style.setProperty("--dx", Math.cos(a) * 60 + "px"); s.style.setProperty("--dy", Math.sin(a) * 60 + "px");
        s.style.animationDelay = (0.5 + f * 0.45).toFixed(2) + "s"; lu.appendChild(s);
      }
    }
    h.appendChild(lu);
    luT = setTimeout(() => lu.remove(), 3900);
  }

  /* 🚪 coming into the live */
  function entrance(person) {
    try {
      const h = host(); if (!h || !person) return;
      const L = lvOf(person); if (L < 20) return;
      const P = pal(L), en = document.createElement("div"); en.className = "lx-en";
      en.style.setProperty("--a", P.a); en.style.setProperty("--b", P.b); en.style.setProperty("--c", P.c);
      const dur = L >= 80 ? 3.4 : L >= 60 ? 3 : 2.6;
      en.style.setProperty("--dur", dur + "s"); en.style.setProperty("--y", "34%");
      let html = "";
      if (L >= 100) {
        html = `<div class="legend"><div class="box"><div class="crown">👑</div><div class="nm" dir="auto">${nm(person.name)}</div>
          <div class="bdg">${badge(L, true)}</div><div class="sub">${esc(t("lx_legend"))}</div></div></div>`;
      } else {
        if (L >= 60) html += `<div class="sweep"></div><div class="pet">${L >= 90 ? "🦅" : L >= 80 ? "🦄" : L >= 70 ? "🐉" : "🦋"}</div>`;
        html += `<div class="strip${L >= 40 ? " lg" : ""}">${avHtml(person.name, person.avatar_url, "xs")}
          <span class="tx">${badge(L)} <span dir="auto">${nm(person.name)}</span><small>${esc(t("lx_came"))}</small></span>${L >= 80 ? "<span>🪽</span>" : ""}</div>`;
        const n = 10 + Math.round((L - 20) / 3);
        for (let i = 0; i < n; i++) html += `<span class="tr" style="inset-inline-start:${(4 + Math.random() * 70).toFixed(1)}%;--dx:${(Math.random() * 40 - 20).toFixed(0)}px;--dy:${(Math.random() * 40 - 10).toFixed(0)}px;animation-delay:${(0.05 + (i / n) * 0.5).toFixed(2)}s"></span>`;
      }
      en.innerHTML = html;
      h.appendChild(en);
      setTimeout(() => en.remove(), dur * 1000 + 300);
    } catch (e) { console.warn(e); }
  }

  /* 🎁 a gift: name + badge + gift fly in, ~2 s; more of the same counts up */
  const strips = new Map();
  function giftStrip(emoji, fromName, toName, fromId, add = 1) {
    const h = host(); if (!h) return 0;
    add = Math.max(1, Math.floor(add) || 1);
    const key = `${fromId || fromName}|${emoji}|${toName}`;
    let s = strips.get(key);
    if (s && s.el.isConnected && !s.el.classList.contains("out")) {
      s.n += add;
      const x = s.el.querySelector(".ggx"); x.textContent = "x" + s.n.toLocaleString("en-US"); x.hidden = false;
      // the little bounce at most every 120 ms, so thousands of taps stay smooth
      const now = performance.now();
      if (!s.popAt || now - s.popAt > 120) { s.popAt = now; try { x.animate([{ transform: "scale(1.8)" }, { transform: "scale(1)" }], { duration: 300, easing: "cubic-bezier(.2,1.6,.4,1)" }); } catch {} }
    } else {
      h.querySelectorAll(".lx-gs").forEach((e) => { if (h.querySelectorAll(".lx-gs").length >= 2) e.remove(); });
      const who = fromId === me?.id ? profile : profileCache?.get?.(fromId);
      const L = who ? lvOf(who) : 0;
      const P = L >= 20 ? pal(L) : { a: "#ffd9a8", b: "#ff8a3d", c: "#c2185b" };
      const el = document.createElement("div"); el.className = "lx-gs";
      el.style.setProperty("--a", P.a); el.style.setProperty("--b", P.b); el.style.setProperty("--c", P.c);
      el.innerHTML = `<div class="strip${L >= 40 ? " lg" : ""}">${avHtml(fromName || "?", who?.avatar_url, "xs")}
        <span class="tx"><span class="bd">${L >= 20 ? badge(L) : ""}</span> <span dir="auto">${nm(fromName)}</span><small dir="auto">${esc(t("lx_gift", { name: String(toName || "").slice(0, 30) }))}</small></span>
        <span class="gge">${emoji}</span><span class="ggx">x${add.toLocaleString("en-US")}</span></div>`;
      el.style.top = 22 + h.querySelectorAll(".lx-gs").length * 9 + "%";
      h.appendChild(el);
      s = { el, n: add, timer: 0 }; strips.set(key, s);
      // a viewer may not have this person's level yet: fetch it and add the badge
      if (!who && fromId && typeof getProfile === "function") getProfile(fromId).then((p) => {
        const L2 = p ? lvOf(p) : 0; if (L2 >= 20 && el.isConnected) { el.querySelector(".bd").innerHTML = badge(L2); const P2 = pal(L2); el.style.setProperty("--a", P2.a); el.style.setProperty("--b", P2.b); el.style.setProperty("--c", P2.c); }
      }).catch(() => {});
    }
    clearTimeout(s.timer);
    const me2 = s;
    s.timer = setTimeout(() => { me2.el.classList.add("out"); setTimeout(() => { me2.el.remove(); if (strips.get(key) === me2) strips.delete(key); }, 450); }, 2400);
    return s.n;
  }

  // the old small "came in" banner is replaced by the new one
  try { window.showEntrance = entrance; } catch {}

  const css = document.createElement("style");
  css.textContent = `
.lj{--a:#fff;--b:#999;--c:#555;--ink2:#fff;--shape:circle(50%);--sh:3s;position:relative;display:inline-flex;align-items:center;height:26px;
  direction:ltr;unicode-bidi:isolate;white-space:nowrap;vertical-align:middle;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))}
.lj .em{position:relative;z-index:2;width:26px;height:26px;flex:0 0 auto;display:grid;place-items:center;clip-path:var(--shape);background:linear-gradient(160deg,#fff 0%,var(--a) 30%,var(--c) 100%)}
.lj .em::before{content:"";position:absolute;inset:2px;clip-path:var(--shape);background:radial-gradient(circle at 35% 28%,var(--a) 0%,var(--b) 48%,var(--c) 100%)}
.lj .em::after{content:"";position:absolute;inset:2px 2px 50%;clip-path:var(--shape);background:linear-gradient(rgba(255,255,255,.55),rgba(255,255,255,0))}
.lj .em i{position:relative;z-index:1;font-style:normal;font-size:12.5px;line-height:1;filter:drop-shadow(0 1px 1px rgba(0,0,0,.4))}
.lj .rb{position:relative;margin-left:-9px;height:19px;padding:0 9px 0 13px;border-radius:0 10px 10px 0;display:flex;align-items:center;gap:2px;overflow:hidden;
  background:linear-gradient(180deg,var(--a) -30%,var(--b) 50%,var(--c) 130%);color:var(--ink2);box-shadow:inset 0 0 0 1px rgba(255,255,255,.4)}
.lj .rb::before{content:"";position:absolute;inset:0 0 52%;background:linear-gradient(rgba(255,255,255,.5),rgba(255,255,255,.08))}
.lj .rb::after{content:"";position:absolute;inset:0;background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.75) 48%,transparent 62%);background-size:260% 100%;animation:ljShine var(--sh) linear infinite;mix-blend-mode:overlay}
@keyframes ljShine{from{background-position:160% 0}to{background-position:-110% 0}}
.lj .rb small{position:relative;font-size:8.5px;font-weight:800;opacity:.85;letter-spacing:.3px}
.lj .rb b{position:relative;font-size:12.5px;font-weight:900;font-style:italic;letter-spacing:.2px;text-shadow:0 1px 0 rgba(0,0,0,.25)}
.lj.fx-glow{animation:ljGlow 2.2s ease-in-out infinite}
@keyframes ljGlow{50%{filter:drop-shadow(0 2px 3px rgba(0,0,0,.35)) drop-shadow(0 0 7px var(--b))}}
.lj.fx-flow .rb{background:linear-gradient(90deg,var(--c),var(--b),var(--a),var(--b),var(--c));background-size:300% 100%;animation:ljFlow 3.5s linear infinite}
@keyframes ljFlow{to{background-position:300% 0}}
.lj .sp{position:absolute;z-index:3;width:4px;height:4px;border-radius:50%;background:#fff;box-shadow:0 0 6px var(--a);animation:ljTw 1.6s ease-in-out infinite}
.lj .sp:nth-of-type(1){left:-2px;top:-1px}.lj .sp:nth-of-type(2){left:22px;top:-3px;animation-delay:-.6s}.lj .sp:nth-of-type(3){left:3px;bottom:-2px;animation-delay:-1.1s}
@keyframes ljTw{0%,100%{transform:scale(.3);opacity:.2}50%{transform:scale(1.1);opacity:1}}
.lj .wg{position:absolute;z-index:1;top:4px;width:15px;height:17px;background:linear-gradient(180deg,#fff,var(--a) 40%,var(--b));border-radius:100% 0 100% 0;opacity:.95}
.lj .wg.l{left:-9px;transform:rotate(-25deg)}.lj .wg.r{left:20px;transform:scaleX(-1) rotate(-25deg)}
.lj.fx-wing .em{margin-left:6px}
.lj .cr{position:absolute;z-index:4;top:-11px;left:6px;font-size:11px;filter:drop-shadow(0 0 4px #ffd76a)}
.lj.fx-wing .cr{left:12px}
.lj.lg100 .rb{background:linear-gradient(90deg,#ffd76a,#ff5f8f,#7a5cff,#2fd1b3,#ffd76a);background-size:300% 100%;animation:ljFlow 2.4s linear infinite;color:#fff}
.lj.lg100 .em::before{background:conic-gradient(#ffd76a,#ff5f8f,#7a5cff,#2fd1b3,#ffd76a);animation:ljSpin 4s linear infinite}
@keyframes ljSpin{to{transform:rotate(360deg)}}
.lj.big{transform:scale(2.3);transform-origin:center}
.lx-plain{font-size:28px;font-weight:900;color:#fff}

.lx-lu{position:absolute;inset:0;z-index:60;display:grid;place-items:center;pointer-events:none;overflow:hidden}
.lx-lu .dim{position:absolute;inset:0;background:radial-gradient(circle at 50% 42%,color-mix(in srgb,var(--b) 35%,transparent),rgba(0,0,0,.72) 70%);animation:lxDim 3.8s ease forwards}
@keyframes lxDim{0%{opacity:0}10%{opacity:1}82%{opacity:1}100%{opacity:0}}
.lx-lu .rays{position:absolute;left:50%;top:42%;width:170vmax;aspect-ratio:1;transform:translate(-50%,-50%);
  background:repeating-conic-gradient(from 0deg,color-mix(in srgb,var(--a) 45%,transparent) 0deg 8deg,transparent 8deg 24deg);
  -webkit-mask-image:radial-gradient(circle,#000 6%,transparent 34%);mask-image:radial-gradient(circle,#000 6%,transparent 34%);animation:lxRays 3.8s linear forwards}
@keyframes lxRays{0%{opacity:0;transform:translate(-50%,-50%) rotate(0) scale(.6)}12%{opacity:1}82%{opacity:1}100%{opacity:0;transform:translate(-50%,-50%) rotate(70deg) scale(1.1)}}
.lx-lu .card{position:relative;display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center;margin-top:-40px;animation:lxCard 3.8s cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes lxCard{0%{opacity:0;transform:scale(.3)}14%{opacity:1;transform:scale(1.08)}22%{transform:scale(1)}82%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(.9) translateY(-20px)}}
.lx-lu .top{font-size:13px;font-weight:900;letter-spacing:2px;color:var(--a);text-shadow:0 0 12px var(--b)}
.lx-lu .nm,.lx-en .legend .nm{font-size:clamp(30px,10vw,46px);font-weight:900;line-height:1.15;max-width:86vw;padding:0 10px;word-break:break-word;
  background:linear-gradient(180deg,#fff 10%,var(--a) 55%,var(--b));-webkit-background-clip:text;background-clip:text;color:transparent;
  filter:drop-shadow(0 3px 0 rgba(0,0,0,.35)) drop-shadow(0 0 16px color-mix(in srgb,var(--b) 70%,transparent))}
.lx-lu .badge,.lx-en .bdg{height:60px;display:grid;place-items:center}
.lx-lu .sub,.lx-en .legend .sub{font-size:16px;font-weight:900;color:#fff;background:rgba(0,0,0,.35);border-radius:999px;padding:6px 16px}
.lx-lu .deco{font-size:44px;line-height:1;filter:drop-shadow(0 0 12px var(--a));animation:lxDeco 1.2s ease-in-out infinite alternate}
@keyframes lxDeco{to{transform:translateY(-6px) scale(1.08)}}
.lx-lu .bit{position:absolute;left:50%;top:42%;width:9px;height:14px;border-radius:2px;animation:lxBit 2.4s cubic-bezier(.15,.7,.3,1) forwards}
@keyframes lxBit{0%{transform:translate(-50%,-50%) rotate(0);opacity:1}100%{transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) rotate(var(--r));opacity:0}}
.lx-lu .spark{position:absolute;width:6px;height:6px;border-radius:50%;background:#fff;box-shadow:0 0 10px var(--a),0 0 20px var(--b);animation:lxSpark 1.4s ease-out forwards}
@keyframes lxSpark{0%{transform:scale(0);opacity:1}100%{transform:scale(1) translate(var(--dx),var(--dy));opacity:0}}

.lx-en,.lx-gs{position:absolute;inset:0;z-index:55;pointer-events:none;overflow:hidden}
.lx-gs{inset:auto 0 auto 0;height:70px;top:22%;overflow:visible}
.lx-en .strip,.lx-gs .strip{position:absolute;inset-inline-start:0;display:flex;align-items:center;gap:8px;padding:6px 18px 6px 8px;border-radius:999px;
  background:linear-gradient(90deg,color-mix(in srgb,var(--b) 92%,transparent),color-mix(in srgb,var(--c) 70%,transparent) 70%,transparent);
  color:#fff;font-weight:900;font-size:14px;white-space:nowrap;max-width:94vw;box-shadow:0 8px 24px color-mix(in srgb,var(--b) 45%,transparent)}
html[dir=rtl] .lx-en .strip,html[dir=rtl] .lx-gs .strip{background:linear-gradient(270deg,color-mix(in srgb,var(--b) 92%,transparent),color-mix(in srgb,var(--c) 70%,transparent) 70%,transparent)}
.lx-en .strip{top:var(--y,34%);animation:lxFly var(--dur,2.6s) cubic-bezier(.2,.8,.2,1) forwards}
.lx-gs .strip{top:0;animation:lxIn .45s cubic-bezier(.2,.8,.2,1) forwards}
.lx-gs.out .strip{animation:lxOut .45s ease-in forwards}
html[dir=rtl] .lx-en .strip{animation-name:lxFlyR}
html[dir=rtl] .lx-gs .strip{animation-name:lxInR}
html[dir=rtl] .lx-gs.out .strip{animation-name:lxOutR}
@keyframes lxFly{0%{transform:translateX(-110%);opacity:0}14%{transform:translateX(14px);opacity:1}22%{transform:translateX(8px)}80%{transform:translateX(8px);opacity:1}100%{transform:translateX(30px);opacity:0}}
@keyframes lxFlyR{0%{transform:translateX(110%);opacity:0}14%{transform:translateX(-14px);opacity:1}22%{transform:translateX(-8px)}80%{transform:translateX(-8px);opacity:1}100%{transform:translateX(-30px);opacity:0}}
@keyframes lxIn{0%{transform:translateX(-110%);opacity:0}70%{transform:translateX(14px);opacity:1}100%{transform:translateX(8px)}}
@keyframes lxInR{0%{transform:translateX(110%);opacity:0}70%{transform:translateX(-14px);opacity:1}100%{transform:translateX(-8px)}}
@keyframes lxOut{to{transform:translateX(30px);opacity:0}}
@keyframes lxOutR{to{transform:translateX(-30px);opacity:0}}
.lx-en .strip .av,.lx-gs .strip .av{width:34px;height:34px;border:2px solid var(--a);font-size:.85rem}
.lx-en .strip .tx,.lx-gs .strip .tx{min-width:0;overflow:hidden}
.lx-en .strip .tx small,.lx-gs .strip .tx small{display:block;font-size:10.5px;font-weight:700;opacity:.9;overflow:hidden;text-overflow:ellipsis}
.lx-en .strip.lg,.lx-gs .strip.lg{font-size:16px;padding:8px 22px 8px 10px}
.lx-en .strip.lg .av,.lx-gs .strip.lg .av{width:42px;height:42px;box-shadow:0 0 0 3px var(--b),0 0 18px var(--a)}
.lx-gs .gge{font-size:30px;filter:drop-shadow(0 2px 6px rgba(0,0,0,.4));animation:lxBob .6s ease-in-out infinite alternate}
@keyframes lxBob{to{transform:translateY(-4px) rotate(-6deg)}}
.lx-gs .ggx{font-size:22px;font-weight:900;font-style:italic;color:#ffe066;text-shadow:0 2px 0 #b5470b;direction:ltr}
.lx-gs .ggx.pop{animation:lxPop .35s cubic-bezier(.2,1.6,.4,1)}
@keyframes lxPop{0%{transform:scale(1.9)}100%{transform:scale(1)}}
.lx-en .tr{position:absolute;top:calc(var(--y,34%) + 18px);width:5px;height:5px;border-radius:50%;background:var(--a);box-shadow:0 0 8px var(--b);animation:lxTr 1.2s ease-out forwards;opacity:0}
@keyframes lxTr{0%{opacity:0;transform:scale(0)}20%{opacity:1;transform:scale(1.4)}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(.4)}}
.lx-en .sweep{position:absolute;inset:0;background:linear-gradient(100deg,transparent 35%,color-mix(in srgb,var(--a) 55%,transparent) 50%,transparent 65%);background-size:300% 100%;animation:lxSweep 1.4s ease-in-out .2s forwards;opacity:.9}
@keyframes lxSweep{from{background-position:120% 0}to{background-position:-60% 0}}
.lx-en .pet{position:absolute;top:calc(var(--y,34%) - 36px);font-size:34px;filter:drop-shadow(0 0 10px var(--a));animation:lxPet var(--dur,2.6s) ease-in-out forwards}
@keyframes lxPet{0%{inset-inline-start:-15%;transform:translateY(10px) rotate(-10deg)}40%{inset-inline-start:58%;transform:translateY(-8px) rotate(6deg)}80%{inset-inline-start:66%;transform:translateY(0)}100%{inset-inline-start:110%;opacity:0}}
.lx-en .legend{position:absolute;inset:0;display:grid;place-items:center;--a:#ffd76a;--b:#ff5f8f;background:radial-gradient(circle at 50% 45%,rgba(255,215,106,.35),rgba(0,0,0,.65) 70%);animation:lxDim 3.4s ease forwards}
.lx-en .legend .box{display:flex;flex-direction:column;align-items:center;gap:10px;animation:lxCard 3.4s cubic-bezier(.2,1.3,.4,1) forwards}
.lx-en .legend .crown{font-size:52px;filter:drop-shadow(0 0 16px #ffd76a)}
.lx-en .legend .nm{background:linear-gradient(90deg,#ffd76a,#ff5f8f,#7a5cff,#2fd1b3,#ffd76a);background-size:300% 100%;-webkit-background-clip:text;background-clip:text;animation:ljFlow 2s linear infinite}
@media (prefers-reduced-motion:reduce){.lj,.lj *,.lj .rb::after,.lx-lu *,.lx-en *,.lx-gs *{animation-duration:.01s!important;animation-iteration-count:1!important}}`;
  document.head.appendChild(css);

  window.LevelFX = { badge, levelup, entrance, giftStrip };
})();
