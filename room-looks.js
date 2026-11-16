/* =====================================================================
   🎨 Room backgrounds (same as the approved demo)
   The host picks a background for the live room; everyone in the room sees it.
   4 are free, the others are bought once with coins (buy_room_look in update-18) and stay yours.
   The choice travels with the host's LiveKit attribute "bg", so it needs no extra server work.
   Uses globals from app.js: sb, me, lk, currentRoom, amHost, hostParticipant, esc, t, toast, loadWallet, W
   ===================================================================== */
(() => {
  const W2 = {
    en: { rl_title: "🎨 Room background", rl_free: "Free", rl_mine: "✓ Yours", rl_use: "✓ Use", rl_inUse: "✓ In use", rl_buy: "Buy for 🪙 {n}",
      rl_noCoins: "🪙 Not enough coins", rl_hint: "Tap one to try it in the room. Everyone in the room sees it.", rl_bought: "✓ {name} is yours",
      rl_changed: "🎨 Room background changed", rl_menu: "🎨 Room background",
      rl_jade: "App green", rl_night: "Night", rl_sea: "Sea", rl_sunset: "Sunset", rl_galaxy: "Galaxy", rl_snow: "Snow", rl_cafe: "Café", rl_aurora: "Aurora", rl_gold: "Gold 👑" },
    ckb: { rl_title: "🎨 باکگراوندی ژوور", rl_free: "بەخۆڕایی", rl_mine: "✓ هی تۆیە", rl_use: "✓ بەکارهێنان", rl_inUse: "✓ ئێستا بەکاردێت", rl_buy: "کڕین بە 🪙 {n}",
      rl_noCoins: "🪙 کۆینت بەس نییە", rl_hint: "دەست لە هەر یەکێک بدە بۆ ئەوەی لە ژوورەکەدا بیبینیت. هەموو ئەوانەی لە ژوورەکەدان دەیبینن.", rl_bought: "✓ {name} کڕدرا",
      rl_changed: "🎨 باکگراوندی ژوورەکە گۆڕا", rl_menu: "🎨 باکگراوندی ژوور",
      rl_jade: "سەوزی ئەپ", rl_night: "شەو", rl_sea: "دەریا", rl_sunset: "ئاوابوون", rl_galaxy: "گەردوون", rl_snow: "بەفر", rl_cafe: "کافێ", rl_aurora: "ئۆرۆرا", rl_gold: "زێڕین 👑" },
    ar: { rl_title: "🎨 خلفية الغرفة", rl_free: "مجاني", rl_mine: "✓ لك", rl_use: "✓ استخدام", rl_inUse: "✓ مستخدمة الآن", rl_buy: "شراء بـ 🪙 {n}",
      rl_noCoins: "🪙 لا تكفي العملات", rl_hint: "اضغط على واحدة لتجربتها في الغرفة. يراها كل من في الغرفة.", rl_bought: "✓ أصبحت {name} لك",
      rl_changed: "🎨 تغيّرت خلفية الغرفة", rl_menu: "🎨 خلفية الغرفة",
      rl_jade: "أخضر التطبيق", rl_night: "ليل", rl_sea: "بحر", rl_sunset: "غروب", rl_galaxy: "مجرة", rl_snow: "ثلج", rl_cafe: "مقهى", rl_aurora: "شفق", rl_gold: "ذهبي 👑" },
  };
  try { for (const [l, o] of Object.entries(W2)) if (I18N[l]) Object.assign(I18N[l], o); } catch {}

  const LOOKS = [
    { id: "jade", price: 0, css: "" },   // the normal room look
    { id: "night", price: 0, css: "linear-gradient(180deg,#0b1430,#1c2a5c 60%,#3a2f6b)", fx: "stars" },
    { id: "sea", price: 0, css: "linear-gradient(180deg,#0a5d7a,#073b55 55%,#04202f)", fx: "bubbles" },
    { id: "sunset", price: 0, css: "linear-gradient(180deg,#ff8a3d,#c2185b 55%,#3b0d3a)" },
    { id: "cafe", price: 300, css: "radial-gradient(60% 40% at 70% 20%,rgba(255,178,63,.45),transparent 70%),linear-gradient(180deg,#4a2c1d,#24140c)", glow: ["#ffb23f"] },
    { id: "galaxy", price: 500, css: "radial-gradient(70% 45% at 30% 30%,rgba(122,92,255,.55),transparent 70%),radial-gradient(60% 40% at 80% 70%,rgba(255,95,162,.45),transparent 70%),#07051a", fx: "stars", glow: ["#7a5cff", "#ff5fa2"] },
    { id: "snow", price: 800, css: "linear-gradient(180deg,#5d7fa3,#2c4566 60%,#16243a)", fx: "snow" },
    { id: "aurora", price: 1500, css: "linear-gradient(180deg,#041a1f,#062a2c 50%,#0c1a17)", glow: ["#2fd1b3", "#7a5cff", "#3ee07a"], fx: "stars" },
    { id: "gold", price: 3000, css: "radial-gradient(70% 45% at 50% 20%,rgba(255,215,106,.55),transparent 70%),linear-gradient(180deg,#3a2600,#120b00)", glow: ["#ffd76a", "#ff8a3d"], fx: "sparkle" },
  ];
  const byId = (id) => LOOKS.find((x) => x.id === id) || null;
  const JADE_CSS = "radial-gradient(110% 55% at 50% 0%,#17473c 0%,#0f231e 45%,#050c0a 100%)";
  const owned = new Set(LOOKS.filter((l) => !l.price).map((l) => l.id));
  let ownedLoaded = false, shown = null;

  function fxHtml(look, scale = 1) {
    let s = "";
    const r = (a, b) => a + Math.random() * (b - a);
    (look.glow || []).forEach((c, i) => { s += `<span class="rl-glow" style="background:${c};width:${55 * scale}vw;height:${55 * scale}vw;max-width:${420 * scale}px;max-height:${420 * scale}px;left:${r(-10, 55)}%;top:${r(5, 55)}%;animation-delay:${-i * 2}s"></span>`; });
    if (look.fx === "stars" || look.fx === "sparkle") for (let i = 0; i < Math.round(50 * scale) + 6; i++) s += `<span class="rl-star${look.fx === "sparkle" ? " gold" : ""}" style="left:${r(0, 100)}%;top:${r(0, 100)}%;animation-delay:${r(-3, 0).toFixed(2)}s"></span>`;
    if (look.fx === "snow") for (let i = 0; i < Math.round(36 * scale) + 4; i++) s += `<span class="rl-flake" style="left:${r(0, 100)}%;font-size:${(r(8, 16) * Math.max(.6, scale)).toFixed(1)}px;animation-duration:${r(6, 12).toFixed(1)}s;animation-delay:${r(-12, 0).toFixed(1)}s">❄</span>`;
    if (look.fx === "bubbles") for (let i = 0; i < Math.round(16 * scale) + 3; i++) { const z = (r(6, 16) * Math.max(.6, scale)).toFixed(1); s += `<span class="rl-bubble" style="left:${r(0, 100)}%;width:${z}px;height:${z}px;animation-duration:${r(7, 14).toFixed(1)}s;animation-delay:${r(-14, 0).toFixed(1)}s"></span>`; }
    return s;
  }

  /* show a look on the room screen (everyone) */
  function apply(id) {
    const scr = document.getElementById("screen-room"); if (!scr) return;
    const look = byId(id) || LOOKS[0];
    if (shown === look.id) return;
    shown = look.id;
    let layer = scr.querySelector(":scope > .rl-fx");
    if (!layer) { layer = document.createElement("div"); layer.className = "rl-fx"; scr.prepend(layer); }
    scr.style.background = look.css || "";
    layer.innerHTML = look.css ? fxHtml(look) : "";
    scr.classList.toggle("rl-on", !!look.css);
  }
  function reset() { shown = null; const scr = document.getElementById("screen-room"); if (!scr) return; scr.style.background = ""; scr.classList.remove("rl-on"); scr.querySelector(":scope > .rl-fx")?.remove(); }
  // read the host's choice (called whenever the people in the room change)
  function sync() {
    if (typeof lk === "undefined" || !lk || !currentRoom) return;
    const h = typeof hostParticipant === "function" ? hostParticipant() : null;
    const id = h?.attributes?.bg || "jade";
    if (byId(id)) apply(id);
  }

  async function loadOwned() {
    if (ownedLoaded || !sb || !me) return;
    const { data } = await sb.from("room_looks_owned").select("look");
    (data || []).forEach((x) => owned.add(x.look));
    ownedLoaded = true;
  }

  /* 🎨 the picker (host only) */
  async function openPicker() {
    if (!amHost()) return;
    document.getElementById("rl-sheet")?.remove();
    const active = (lk?.localParticipant?.attributes?.bg) || "jade";
    let picked = active, coins = null;
    const sh = document.createElement("div"); sh.id = "rl-sheet";
    sh.innerHTML = `<div class="rl-back"></div><div class="rl-panel" role="dialog" aria-label="${esc(t("rl_title"))}"></div>`;
    document.getElementById("screen-room").appendChild(sh);
    const panel = sh.querySelector(".rl-panel");
    const close = (keep) => { if (!keep) apply(lk?.localParticipant?.attributes?.bg || "jade"); sh.remove(); };
    sh.querySelector(".rl-back").addEventListener("click", () => close());
    const draw = () => {
      const look = byId(picked), have = owned.has(picked), cur = (lk?.localParticipant?.attributes?.bg) || "jade";
      panel.innerHTML = `<div class="rl-grab"></div>
        <h2>${esc(t("rl_title"))} <span>${coins == null ? "" : "🪙 " + Number(coins).toLocaleString("en-US")}</span></h2>
        <div class="rl-grid">${LOOKS.map((l) => `<button type="button" class="rl-bg" data-l="${l.id}" aria-pressed="${l.id === picked}">
          <span class="rl-th" style="background:${l.css || JADE_CSS}">${fxHtml(l, .22)}
            <span class="rl-tag ${l.price ? "" : "free"}">${l.price ? (owned.has(l.id) ? esc(t("rl_mine")) : "🪙 " + l.price) : esc(t("rl_free"))}</span>
            ${l.id === cur ? '<span class="rl-ok">✓</span>' : ""}${!owned.has(l.id) ? '<span class="rl-lock">🔒</span>' : ""}</span>
          <span class="rl-nm">${esc(t("rl_" + l.id))}</span></button>`).join("")}</div>
        ${have ? `<button type="button" class="rl-act use" ${picked === cur ? "disabled" : ""}>${esc(picked === cur ? t("rl_inUse") : t("rl_use"))}</button>`
          : `<button type="button" class="rl-act" ${coins != null && coins < look.price ? "disabled" : ""}>${esc(coins != null && coins < look.price ? t("rl_noCoins") : t("rl_buy", { n: look.price }))}</button>`}
        <p class="rl-hint">${esc(t("rl_hint"))}</p>`;
      panel.querySelectorAll("[data-l]").forEach((b) => b.addEventListener("click", () => { picked = b.dataset.l; apply(picked); draw(); }));
      panel.querySelector(".rl-act").addEventListener("click", async (e) => {
        const btn = e.currentTarget; btn.disabled = true;
        if (!owned.has(picked)) {
          const { data, error } = await sb.rpc("buy_room_look", { p_look: picked });
          const r = Array.isArray(data) ? data[0] : null;
          if (error || !r) { btn.disabled = false; return toast(t("error") + (error?.message || "")); }
          coins = r.o_coins;
          if (r.o_status === "no_coins") { draw(); return toast(t("rl_noCoins")); }
          if (r.o_status !== "ok" && r.o_status !== "owned") { draw(); return toast(t("error") + r.o_status); }
          owned.add(picked);
          if (typeof W !== "undefined" && W.wallet) W.wallet.coins = coins;
          toast(t("rl_bought", { name: t("rl_" + picked) }));
        }
        try { await lk.localParticipant.setAttributes({ bg: picked === "jade" ? "" : picked }); }
        catch (err) { btn.disabled = false; return toast(t("error") + (err?.message || err)); }
        apply(picked); draw();
        setTimeout(() => { close(true); toast(t("rl_changed")); }, 300);
      });
    };
    draw();
    await loadOwned();
    try { const w = typeof loadWallet === "function" ? await loadWallet() : null; coins = w ? Number(w.coins || 0) : null; } catch {}
    if (document.body.contains(sh)) draw();
  }

  const css = document.createElement("style");
  css.textContent = `
#screen-room > .rl-fx{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:0}
#screen-room.rl-on > .stage-head,#screen-room.rl-on > .stage-body,#screen-room.rl-on > .s-bottom{position:relative;z-index:1}
#screen-room.video-mode > .rl-fx{display:none}
.rl-star{position:absolute;width:2px;height:2px;border-radius:50%;background:#fff;animation:rltw 2.6s ease-in-out infinite alternate}
.rl-star.gold{background:#ffd76a;width:3px;height:3px}
@keyframes rltw{from{opacity:.15}to{opacity:1}}
.rl-flake{position:absolute;top:-12px;color:#fff;opacity:.85;animation:rlfall linear infinite}
@keyframes rlfall{to{transform:translateY(110vh) rotate(200deg)}}
.rl-bubble{position:absolute;bottom:-20px;border-radius:50%;border:1.5px solid rgba(255,255,255,.45);animation:rlrise linear infinite}
@keyframes rlrise{to{transform:translateY(-115vh)}}
.rl-glow{position:absolute;border-radius:50%;filter:blur(30px);opacity:.45;animation:rldrift 7s ease-in-out infinite alternate}
@keyframes rldrift{to{transform:translate(40px,-30px) scale(1.2)}}
#rl-sheet{position:absolute;inset:0;z-index:40}
#rl-sheet .rl-back{position:absolute;inset:0;background:rgba(0,0,0,.25)}
#rl-sheet .rl-panel{position:absolute;inset:auto 0 0;max-width:560px;margin:0 auto;background:#0c1a17;color:#eaf6f2;border-radius:26px 26px 0 0;
  padding:10px 14px calc(16px + env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:12px;max-height:74%;box-shadow:0 -10px 40px rgba(0,0,0,.5);animation:rlup .25s ease-out}
@keyframes rlup{from{transform:translateY(100%)}}
.rl-grab{width:44px;height:5px;border-radius:9px;background:#244038;margin:0 auto}
.rl-panel h2{margin:0;font-size:15px;font-weight:900;display:flex;justify-content:space-between;align-items:center;color:#eaf6f2}
.rl-panel h2 span{font-size:13px;color:#ffb23f}
.rl-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;overflow-y:auto;padding:2px}
.rl-bg{border:0;padding:0;background:none;display:flex;flex-direction:column;gap:5px;text-align:center;color:#eaf6f2;cursor:pointer;font:inherit}
.rl-th{position:relative;aspect-ratio:3/4;border-radius:16px;overflow:hidden;border:2.5px solid transparent;max-width:100%}
.rl-bg[aria-pressed="true"] .rl-th{border-color:#2fd1b3}
.rl-th .rl-glow{filter:blur(12px)}
.rl-tag{position:absolute;top:6px;inset-inline-start:6px;background:rgba(0,0,0,.55);border-radius:999px;padding:1px 8px;font-size:10.5px;font-weight:800;color:#fff;z-index:1}
.rl-tag.free{background:#0fa88f}
.rl-ok{position:absolute;bottom:6px;inset-inline-end:6px;width:22px;height:22px;border-radius:50%;background:#2fd1b3;color:#04201a;display:grid;place-items:center;font-size:12px;font-weight:900;z-index:1}
.rl-lock{position:absolute;inset:0;display:grid;place-items:center;font-size:20px;background:rgba(0,0,0,.25)}
.rl-nm{font-size:12px;font-weight:800}
.rl-act{border:0;border-radius:16px;height:48px;font:inherit;font-weight:900;font-size:15px;background:linear-gradient(135deg,#ffb23f,#ff8a3d);color:#2a1800;cursor:pointer}
.rl-act.use{background:#2fd1b3;color:#04201a}
.rl-act:disabled{opacity:.5;cursor:default}
.rl-hint{margin:0;font-size:12px;color:#93a9a1;text-align:center}
@media (prefers-reduced-motion:reduce){.rl-star,.rl-flake,.rl-bubble,.rl-glow,#rl-sheet .rl-panel{animation:none!important}}`;
  document.head.appendChild(css);

  window.RoomLooks = { openPicker, apply, sync, reset };
})();
