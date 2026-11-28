/* =====================================================================
   👑 VIP profile frames — shop + showing frames around avatars
   14 designs × 10 colours (the approved 3D demo). Buy a design once with
   coins (rpc buy_vip_frame, update-50) → all its colours are yours; wear one
   with rpc set_vip_frame. Everyone sees it on the profile page, room seats,
   video tiles and the audience row.
   The 3D engine (vip-frames-3d.js) is loaded only when a frame must be drawn.
   Uses globals from app.js: sb, me, profile, esc, t, toast, avHtml, loadWallet, W, pfId
   ===================================================================== */
(() => {
  const W2 = {
    en: { vf_row: "VIP frames", vf_title: "👑 VIP frames", vf_colours: "🎨 Pick a colour", vf_all: "👑 All frames",
      vf_buy: "Buy for 🪙 {n}", vf_wear: "✓ Wear this", vf_wearing: "✓ You are wearing it", vf_off: "Take off frame",
      vf_noCoins: "🪙 Not enough coins", vf_bought: "✓ The frame is yours — all 10 colours", vf_worn: "👑 Frame on", vf_removed: "Frame taken off",
      vf_hint: "Buy a frame once and all 10 colours are yours. Everyone sees it on your profile and in rooms.", vf_owned: "✓ Yours", vf_loading: "Drawing the frame…", vf_fail: "Couldn't draw this frame" },
    ckb: { vf_row: "چوارچێوەی VIP", vf_title: "👑 چوارچێوەی VIP", vf_colours: "🎨 ڕەنگێک هەڵبژێرە", vf_all: "👑 هەموو چوارچێوەکان",
      vf_buy: "کڕین بە 🪙 {n}", vf_wear: "✓ لەبەری بکە", vf_wearing: "✓ ئێستا لەبەرتە", vf_off: "لابردنی چوارچێوە",
      vf_noCoins: "🪙 کۆینت بەس نییە", vf_bought: "✓ چوارچێوەکە هی تۆیە، بە هەر ١٠ ڕەنگەکەوە", vf_worn: "👑 چوارچێوەکە لەبەرکرا", vf_removed: "چوارچێوەکە لابرا",
      vf_hint: "یەک جار چوارچێوەیەک بکڕە، هەر ١٠ ڕەنگەکەی هی تۆ دەبن. هەمووان لەسەر پرۆفایلەکەت و لە ژوورەکاندا دەیبینن.", vf_owned: "✓ هی تۆیە", vf_loading: "چوارچێوەکە دروست دەبێت…", vf_fail: "نەتوانرا ئەم چوارچێوەیە پیشان بدرێت" },
    ar: { vf_row: "إطارات VIP", vf_title: "👑 إطارات VIP", vf_colours: "🎨 اختر لوناً", vf_all: "👑 كل الإطارات",
      vf_buy: "شراء بـ 🪙 {n}", vf_wear: "✓ ارتدِه", vf_wearing: "✓ ترتديه الآن", vf_off: "إزالة الإطار",
      vf_noCoins: "🪙 لا تكفي العملات", vf_bought: "✓ الإطار لك بكل ألوانه العشرة", vf_worn: "👑 تم ارتداء الإطار", vf_removed: "تمت إزالة الإطار",
      vf_hint: "اشترِ الإطار مرة واحدة وتصبح ألوانه العشرة لك. يراه الجميع في ملفك وفي الغرف.", vf_owned: "✓ لك", vf_loading: "جارٍ رسم الإطار…", vf_fail: "تعذّر عرض هذا الإطار" },
  };
  try { for (const [l, o] of Object.entries(W2)) if (I18N[l]) Object.assign(I18N[l], o); } catch {}

  // order = the approved gallery; def = the colour it opens in
  const DESIGNS = [
    { id: "image", lv: 1, def: 1, price: 5000 }, { id: "phoenixw", lv: 1, def: 1, price: 5000 }, { id: "phoenix", lv: 1, def: 1, price: 6000 },
    { id: "dragon", lv: 2, def: 0, price: 9000 }, { id: "star", lv: 3, def: 2, price: 15000 }, { id: "lotus", lv: 4, def: 3, price: 22000 },
    { id: "lion", lv: 5, def: 4, price: 28000 }, { id: "eagle", lv: 6, def: 5, price: 35000 }, { id: "rose", lv: 7, def: 6, price: 42000 },
    { id: "panther", lv: 8, def: 7, price: 55000 }, { id: "ocean", lv: 9, def: 8, price: 70000 }, { id: "emperor", lv: 10, def: 9, price: 99999 },
    { id: "wings", lv: 0, def: 2, price: 8000 }, { id: "moon", lv: 0, def: 0, price: 12000 },
  ];
  const COLOURS = ["#0c9a52", "#c8102e", "#1f5bff", "#8a2be2", "#ff7a10", "#66c8ff", "#ff4f8b", "#1c1c1c", "#14c4b4", "#7a2cff"];
  const byId = (id) => DESIGNS.find((d) => d.id === id);
  const valid = (code) => typeof code === "string" && /^[a-z]{3,10}:[0-9]$/.test(code) && !!byId(code.split(":")[0]);

  /* ---------- engine (loaded once, on demand) ---------- */
  let enginePromise = null;
  function engine() {
    if (!enginePromise) enginePromise = import("./vip-frames-3d.js").then(() => window.VipFrames3D).catch((e) => { enginePromise = null; throw e; });
    return enginePromise;
  }
  const sheets = new Map();
  function sheet(code) {
    if (!sheets.has(code)) sheets.set(code, engine().then((E) => E.sheet(code)).catch((e) => { sheets.delete(code); throw e; }));
    return sheets.get(code);
  }

  /* ---------- who wears what (batched, cached 2 min) ---------- */
  const worn = new Map(); // id -> {code, at}
  let want = new Set(), wantTimer = 0;
  function frameOf(id) {
    const r = worn.get(id);
    if (r && Date.now() - r.at < 120000) return r.code;
    if (!want.has(id)) { want.add(id); clearTimeout(wantTimer); wantTimer = setTimeout(fetchWanted, 120); }
    return r ? r.code : undefined;
  }
  async function fetchWanted() {
    const ids = [...want].filter((x) => /^[0-9a-f-]{36}$/i.test(x)).slice(0, 200); want = new Set();
    if (!ids.length || typeof sb === "undefined" || !sb) return;
    const { data, error } = await sb.rpc("vip_frames_of", { p_ids: ids });
    if (error) return;
    const now = Date.now();
    ids.forEach((id) => worn.set(id, { code: null, at: now }));
    (data || []).forEach((r) => { if (valid(r.frame)) worn.set(r.id, { code: r.frame, at: now }); });
    schedule();
  }

  /* ---------- draw a frame around an avatar ---------- */
  function overlay(host, av, code) {
    let ov = host.querySelector(":scope > .vfx");
    if (!code) { ov?.remove(); return; }
    if (ov && ov.dataset.code === code) { place(ov, av); return; }
    ov?.remove();
    ov = document.createElement("span"); ov.className = "vfx"; ov.dataset.code = code; ov.setAttribute("aria-hidden", "true");
    if (getComputedStyle(host).position === "static") host.style.position = "relative";
    host.appendChild(ov);
    sheet(code).then((s) => {
      if (!ov.isConnected || ov.dataset.code !== code) return;
      ov.dataset.scale = s.scale;
      ov.innerHTML = `<i style="background-image:url(${s.url});width:${s.n * 100}%;animation-timing-function:steps(${s.n})"></i>`;
      place(ov, av);
    }).catch(() => ov.remove());
  }
  function place(ov, av) {
    const sc = +ov.dataset.scale || 1.79, w = av.offsetWidth || 0; if (!w) return;
    const size = w * sc;
    ov.style.width = ov.style.height = size + "px";
    ov.style.left = (av.offsetLeft + w / 2 - size / 2) + "px";
    ov.style.top = (av.offsetTop + av.offsetHeight / 2 - size / 2) + "px";
  }
  let lastSheetId = null;
  function targets() {
    const out = [];
    const meId = typeof me !== "undefined" && me ? me.id : null;
    document.querySelectorAll(".pf2-av").forEach((h) => {
      const inOther = !!h.closest("#pf-body"); const id = inOther ? (typeof pfId !== "undefined" ? pfId : null) : meId;
      const av = h.querySelector(":scope > .av"); if (id && av) out.push([h, av, id]);
    });
    document.querySelectorAll(".seat[data-pid] .ring2, .aud[data-pid], .vtile[data-pid]:not(.has-video)").forEach((h) => {
      const id = h.closest("[data-pid]")?.dataset.pid; const av = h.querySelector(":scope > .av"); if (id && av) out.push([h, av, id]);
    });
    document.querySelectorAll(".profile-head .ring").forEach((h) => { const av = h.querySelector(":scope > .av"); if (lastSheetId && av) out.push([h, av, lastSheetId]); });
    return out;
  }
  function decorate() {
    for (const [h, av, id] of targets()) {
      const code = id === (typeof me !== "undefined" && me ? me.id : "") && myFrame !== undefined ? myFrame : frameOf(id);
      if (code !== undefined) overlay(h, av, code);
    }
    addSettingsRow();
  }
  let raf = 0;
  function schedule() { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; try { decorate(); } catch (e) { console.warn(e); } }); }
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("resize", schedule);
  // remember whose small profile sheet is open
  if (typeof window.openProfile === "function") {
    const orig = window.openProfile;
    window.openProfile = function (id, ...rest) { lastSheetId = id; return orig.call(this, id, ...rest); };
  }

  /* ---------- my own frame + what I own ---------- */
  let myFrame, owned = new Set(), ownedLoaded = false;
  async function loadMine() {
    if (typeof sb === "undefined" || !sb || typeof me === "undefined" || !me) return;
    const [o, f] = await Promise.all([
      sb.from("vip_frames_owned").select("design"),
      sb.rpc("vip_frames_of", { p_ids: [me.id] }),
    ]);
    if (!o.error) { owned = new Set((o.data || []).map((x) => x.design)); ownedLoaded = true; }
    if (!f.error) { const r = (f.data || [])[0]; myFrame = r && valid(r.frame) ? r.frame : null; worn.set(me.id, { code: myFrame, at: Date.now() }); }
    schedule();
  }

  /* ---------- the row in settings ---------- */
  function addSettingsRow() {
    if (document.getElementById("me-vipframes")) return;
    const anchor = document.getElementById("me-support") || document.getElementById("me-inbox") || document.getElementById("me-id"); if (!anchor) return;
    anchor.insertAdjacentHTML("afterend", `<button type="button" id="me-vipframes">👑 ${esc(t("vf_row"))}<span class="chev">›</span></button>`);
    document.getElementById("me-vipframes").addEventListener("click", openShop);
  }

  /* ---------- 🛒 the shop ---------- */
  async function openShop() {
    document.getElementById("vf-shop")?.remove();
    if (!ownedLoaded) loadMine();
    let pick = (myFrame && byId(myFrame.split(":")[0])) ? myFrame : "image:1", coins = null;
    const el = document.createElement("div"); el.id = "vf-shop";
    el.innerHTML = `<div class="vf-back"></div><div class="vf-panel" role="dialog" aria-label="${esc(t("vf_title"))}">
      <div class="vf-grab"></div>
      <h2>${esc(t("vf_title"))} <span id="vf-coins"></span></h2>
      <div class="vf-stage"><span class="vf-host">${avHtml(profile?.name, profile?.avatar_url, "lg")}</span></div>
      <div class="vf-acts"></div>
      <h3>${esc(t("vf_colours"))}</h3><div class="vf-cols"></div>
      <h3>${esc(t("vf_all"))}</h3><div class="vf-grid"></div>
      <p class="vf-hint">${esc(t("vf_hint"))}</p></div>`;
    document.body.appendChild(el);
    const close = () => el.remove();
    el.querySelector(".vf-back").addEventListener("click", close);
    const stageHost = el.querySelector(".vf-host"), stageAv = stageHost.querySelector(".av");

    // gallery: one animated logo per design (photo-free)
    el.querySelector(".vf-grid").innerHTML = DESIGNS.map((d) => `<button type="button" class="vf-card" data-d="${d.id}" aria-label="VIP ${d.lv || ""}">
      <span class="vf-logo"></span>${owned.has(d.id) ? `<span class="vf-own">✓</span>` : ""}</button>`).join("");
    el.querySelectorAll(".vf-card").forEach((b) => {
      const d = byId(b.dataset.d);
      sheet(d.id + ":" + d.def).then((s) => { b.querySelector(".vf-logo").innerHTML = `<i style="background-image:url(${s.url});width:${s.n * 100}%;animation-timing-function:steps(${s.n})"></i>`; b.classList.add("ready"); }).catch(() => {});
      b.addEventListener("click", () => { pick = d.id + ":" + d.def; draw(true); el.querySelector(".vf-panel").scrollTo({ top: 0, behavior: "smooth" }); });
    });

    function draw(pop) {
      const [d, c] = pick.split(":"), info = byId(d), have = owned.has(d), wearing = myFrame === pick;
      overlay(stageHost, stageAv, pick);
      el.querySelectorAll(".vf-card").forEach((b) => b.classList.toggle("on", b.dataset.d === d));
      const cols = el.querySelector(".vf-cols");
      cols.classList.toggle("pop", !!pop);
      cols.innerHTML = COLOURS.map((hex, i) => `<button type="button" class="vf-col ${String(i) === c ? "on" : ""}" data-c="${i}" style="--g:${hex};--i:${i}" aria-label="${i + 1}"><span class="vf-logo"></span></button>`).join("");
      cols.querySelectorAll(".vf-col").forEach((b) => {
        sheet(d + ":" + b.dataset.c).then((s) => { const l = b.querySelector(".vf-logo"); if (l) { l.innerHTML = `<i style="background-image:url(${s.url});width:${s.n * 100}%;animation-timing-function:steps(${s.n})"></i>`; b.classList.add("ready"); } }).catch(() => {});
        b.addEventListener("click", () => { pick = d + ":" + b.dataset.c; draw(false); });
      });
      const acts = el.querySelector(".vf-acts");
      acts.innerHTML = have
        ? `<button type="button" class="vf-btn" ${wearing ? "disabled" : ""}>${esc(wearing ? t("vf_wearing") : t("vf_wear"))}</button>${myFrame ? `<button type="button" class="vf-btn ghost" data-off="1">${esc(t("vf_off"))}</button>` : ""}`
        : `<button type="button" class="vf-btn" ${coins != null && coins < info.price ? "disabled" : ""}>${esc(coins != null && coins < info.price ? t("vf_noCoins") : t("vf_buy", { n: info.price.toLocaleString("en-US") }))}</button>`;
      acts.querySelector(".vf-btn:not([data-off])").addEventListener("click", (e) => (have ? wear(pick, e.currentTarget) : buy(d, e.currentTarget)));
      acts.querySelector("[data-off]")?.addEventListener("click", (e) => wear(null, e.currentTarget));
    }
    async function buy(d, btn) {
      btn.disabled = true;
      const { data, error } = await sb.rpc("buy_vip_frame", { p_design: d });
      const r = Array.isArray(data) ? data[0] : null;
      if (error || !r) { btn.disabled = false; return toast(t("error") + (error?.message || "")); }
      coins = Number(r.o_coins); showCoins();
      if (r.o_status === "no_coins") { draw(); return toast(t("vf_noCoins")); }
      if (r.o_status !== "ok" && r.o_status !== "owned") { draw(); return toast(t("error") + r.o_status); }
      owned.add(d); if (typeof W !== "undefined" && W.wallet) W.wallet.coins = coins;
      el.querySelector(`.vf-card[data-d="${d}"]`)?.insertAdjacentHTML("beforeend", `<span class="vf-own">✓</span>`);
      toast(t("vf_bought"));
      await wear(pick, null);
    }
    async function wear(code, btn) {
      if (btn) btn.disabled = true;
      const { data, error } = await sb.rpc("set_vip_frame", { p_frame: code || "" });
      if (error || (data !== "ok" && data !== "off")) { if (btn) btn.disabled = false; return toast(t("error") + (error?.message || data || "")); }
      myFrame = code || null; worn.set(me.id, { code: myFrame, at: Date.now() });
      toast(code ? t("vf_worn") : t("vf_removed"));
      draw(); schedule();
    }
    function showCoins() { const c = el.querySelector("#vf-coins"); if (c) c.textContent = coins == null ? "" : "🪙 " + Number(coins).toLocaleString("en-US"); }
    draw(true);
    try { const w = typeof loadWallet === "function" ? await loadWallet() : null; coins = w ? Number(w.coins || 0) : null; } catch {}
    if (!ownedLoaded) await loadMine();
    if (document.body.contains(el)) { showCoins(); draw(); el.querySelectorAll(".vf-card").forEach((b) => { if (owned.has(b.dataset.d) && !b.querySelector(".vf-own")) b.insertAdjacentHTML("beforeend", `<span class="vf-own">✓</span>`); }); }
  }

  /* ---------- styles ---------- */
  const css = document.createElement("style");
  css.textContent = `
.vfx{position:absolute;pointer-events:none;overflow:hidden;z-index:3}
.vfx i,.vf-logo i{position:absolute;inset:0 auto 0 0;height:100%;background-size:100% 100%;background-repeat:no-repeat;animation:vfxplay 2s infinite}
@keyframes vfxplay{to{transform:translateX(-100%)}}
.ring2,.pf2-av,.profile-head .ring,.aud{overflow:visible!important}
#vf-shop{position:fixed;inset:0;z-index:300}
#vf-shop .vf-back{position:absolute;inset:0;background:rgba(0,0,0,.55)}
#vf-shop .vf-panel{position:absolute;inset:auto 0 0;max-width:560px;margin:0 auto;max-height:92%;overflow-y:auto;background:radial-gradient(120% 50% at 50% 0%,#2a1f0a,#0b0a08 60%);color:#f6efe0;
  border-radius:26px 26px 0 0;border-top:1px solid rgba(245,201,90,.45);padding:10px 16px calc(18px + env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:12px;animation:vfup .28s ease-out}
@keyframes vfup{from{transform:translateY(100%)}}
.vf-grab{width:44px;height:5px;border-radius:9px;background:#4a3a1a;margin:0 auto}
.vf-panel h2{margin:0;font-size:16px;font-weight:900;display:flex;justify-content:space-between;align-items:center;color:#f5d98a}
.vf-panel h2 span{font-size:13px;color:#ffb23f}
.vf-panel h3{margin:4px 0 0;font-size:14px;font-weight:800;color:#f5d98a}
.vf-stage{display:grid;place-items:center;padding:46px 0 40px;background:#000;border-radius:20px}
.vf-host{position:relative;display:inline-block}
.vf-host .av.lg{width:110px;height:110px}
.vf-acts{display:flex;gap:8px}
.vf-btn{flex:1;border:0;border-radius:16px;height:48px;font:inherit;font-weight:900;font-size:15px;cursor:pointer;color:#2a1a00;background:linear-gradient(135deg,#fff7d1,#f7d675 28%,#b8801f 52%,#ffe8a0 74%,#8c5b12)}
.vf-btn.ghost{flex:0 0 auto;padding:0 14px;background:#1d1a12;color:#f6efe0;border:1px solid #3a2e14}
.vf-btn:disabled{opacity:.55;cursor:default}
.vf-cols{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}
.vf-col,.vf-card{position:relative;aspect-ratio:1;border-radius:14px;border:1px solid #2e2616;background:#000;padding:0;cursor:pointer;overflow:hidden}
.vf-col{box-shadow:0 0 12px color-mix(in srgb,var(--g) 45%,transparent)}
.vf-col.on,.vf-card.on{border-color:#f5c95a;box-shadow:0 0 0 1.5px #f5c95a,0 0 18px rgba(245,201,90,.35)}
.vf-cols.pop .vf-col{animation:vfpop .5s cubic-bezier(.2,1.6,.4,1) both;animation-delay:calc(var(--i)*50ms)}
@keyframes vfpop{from{opacity:0;transform:scale(.3)}}
.vf-logo{position:absolute;inset:4px;overflow:hidden;border-radius:10px}
.vf-col:not(.ready)::after,.vf-card:not(.ready)::after{content:"";position:absolute;inset:38%;border-radius:50%;border:2px solid #3a2e14;border-top-color:#f5c95a;animation:vfspin .9s linear infinite}
@keyframes vfspin{to{transform:rotate(360deg)}}
.vf-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.vf-own{position:absolute;top:6px;inset-inline-end:6px;width:20px;height:20px;border-radius:50%;background:#f5c95a;color:#2a1a00;font-size:12px;font-weight:900;display:grid;place-items:center}
.vf-hint{margin:0;font-size:12px;color:#a49c90;text-align:center;line-height:1.8}
#me-vipframes{color:inherit}
@media (prefers-reduced-motion:reduce){.vfx i,.vf-logo i{animation:none}}`;
  document.head.appendChild(css);

  // start once signed in
  let tries = 0;
  (function wait() { if (typeof me !== "undefined" && me && typeof sb !== "undefined" && sb) { loadMine(); schedule(); } else if (tries++ < 120) setTimeout(wait, 1000); })();

  window.VipFrames = { openShop, refresh: () => { worn.clear(); loadMine(); } };
})();
