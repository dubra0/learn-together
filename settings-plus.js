/* ⚙️ Settings extras
   🌙 Look: Auto (like the phone) / ☀️ Light / 🌙 Dark  (kept on this phone)
   📵 Only my friends can call me (random calls; needs supabase/update-38-settings-plus.sql)
   🚫 Blocked people: see them and unblock */
(() => {
  const W = {
    en: { sp_theme: "🌗 Look", sp_auto: "📱 Auto", sp_light: "☀️ Light", sp_dark: "🌙 Dark", sp_friends: "📵 Only my friends can call me", sp_on: "✅ On", sp_off: "Off",
      sp_friendsOn: "📵 Random calls now only match you with friends (people you follow each other with)", sp_friendsOff: "📞 Random calls can match you with anyone again",
      sp_blocked: "🚫 Blocked people", sp_noBlocked: "You haven't blocked anyone.", sp_unblock: "Unblock", sp_unblocked: "✅ Unblocked" },
    ckb: { sp_theme: "🌗 ڕووکار", sp_auto: "📱 خۆکار", sp_light: "☀️ ڕووناک", sp_dark: "🌙 تاریک", sp_friends: "📵 تەنها هاوڕێکانم پەیوەندیم پێوە بکەن", sp_on: "✅ داگیرساوە", sp_off: "کوژاوە",
      sp_friendsOn: "📵 ئێستا پەیوەندی هەڕەمەکی تەنها لەگەڵ هاوڕێکانت دەبێت (ئەوانەی یەکترتان فۆڵۆو کردووە)", sp_friendsOff: "📞 دووبارە پەیوەندی هەڕەمەکی لەگەڵ هەر کەسێک دەبێت",
      sp_blocked: "🚫 بلۆککراوەکان", sp_noBlocked: "هیچ کەسێکت بلۆک نەکردووە.", sp_unblock: "لابردنی بلۆک", sp_unblocked: "✅ بلۆکەکە لابرا" },
    ar: { sp_theme: "🌗 المظهر", sp_auto: "📱 تلقائي", sp_light: "☀️ فاتح", sp_dark: "🌙 داكن", sp_friends: "📵 فقط أصدقائي يمكنهم الاتصال بي", sp_on: "✅ مفعّل", sp_off: "متوقف",
      sp_friendsOn: "📵 المكالمات العشوائية الآن مع أصدقائك فقط (من تتابعون بعضكم)", sp_friendsOff: "📞 المكالمات العشوائية مع أي شخص من جديد",
      sp_blocked: "🚫 المحظورون", sp_noBlocked: "لم تحظر أحداً.", sp_unblock: "إلغاء الحظر", sp_unblocked: "✅ تم إلغاء الحظر" },
  };
  const S2 = {
    en: { st_account: "Account", st_prefs: "Preferences", st_privacy: "Privacy", st_mine: "My things", st_legal: "Legal", st_admin: "Admin", st_danger: "Danger zone" },
    ckb: { st_account: "ئەکاونت", st_prefs: "ڕێکخستنەکان", st_privacy: "تایبەتمەندی", st_mine: "شتەکانم", st_legal: "یاسایی", st_admin: "بەڕێوەبردن", st_danger: "ئاگاداربە" },
    ar: { st_account: "الحساب", st_prefs: "التفضيلات", st_privacy: "الخصوصية", st_mine: "أشيائي", st_legal: "قانوني", st_admin: "الإدارة", st_danger: "منطقة الخطر" },
    tr: { st_account: "Hesap", st_prefs: "Tercihler", st_privacy: "Gizlilik", st_mine: "Benim", st_legal: "Yasal", st_admin: "Yönetim", st_danger: "Tehlikeli bölge" },
    fa: { st_account: "حساب", st_prefs: "تنظیمات", st_privacy: "حریم خصوصی", st_mine: "چیزهای من", st_legal: "قانونی", st_admin: "مدیریت", st_danger: "منطقه خطر" },
    de: { st_account: "Konto", st_prefs: "Einstellungen", st_privacy: "Privatsphäre", st_mine: "Meins", st_legal: "Rechtliches", st_admin: "Admin", st_danger: "Gefahrenzone" },
    fr: { st_account: "Compte", st_prefs: "Préférences", st_privacy: "Confidentialité", st_mine: "Mes trucs", st_legal: "Légal", st_admin: "Admin", st_danger: "Zone sensible" },
    es: { st_account: "Cuenta", st_prefs: "Preferencias", st_privacy: "Privacidad", st_mine: "Lo mío", st_legal: "Legal", st_admin: "Admin", st_danger: "Zona de peligro" },
  };
  try { for (const [l, o] of Object.entries(W)) if (I18N[l]) Object.assign(I18N[l], o); } catch {}
  try { for (const [l, o] of Object.entries(S2)) if (I18N[l]) Object.assign(I18N[l], o); } catch {}

  const css = document.createElement("style");
  css.textContent = `
  .sp-theme{display:flex;gap:6px;margin-inline-start:auto}
  .sp-theme button{border:1.5px solid var(--line);background:var(--bg);color:var(--ink);border-radius:999px;padding:5px 10px;font:inherit;font-size:.78rem;font-weight:800;cursor:pointer}
  .sp-theme button.on{border-color:var(--brand);background:var(--soft);color:var(--brand)}
  .sp-row{display:flex;align-items:center;gap:10px;padding:14px 16px;flex-wrap:wrap}
  .sp-bl{display:flex;align-items:center;gap:10px;padding:10px 2px}.sp-bl+.sp-bl{border-top:1px solid var(--line)}
  .sp-bl .info{flex:1;min-width:0;font-weight:800}

  /* ===== ⚙️ Settings: dark navy, golden cards ===== */
  #screen-settings.st-night{--g:#e2b65a;--g2:#f7d98b;--ink2:#f6eedb;--mut2:rgba(246,238,219,.62);color:var(--ink2);min-height:100vh;
    background:radial-gradient(90% 40% at 50% 0%,rgba(226,182,90,.10),transparent 70%),linear-gradient(180deg,#0b1030 0%,#121a45 40%,#0c1233 72%,#070a1f 100%);
    background-attachment:fixed}
  #screen-settings.st-night .appbar{background:none;border:0;box-shadow:none;justify-content:center;position:sticky;top:0;
    padding-top:calc(10px + env(safe-area-inset-top));backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
  #screen-settings.st-night .appbar .title{color:#fff;font-weight:900;font-size:1.5rem;text-shadow:0 2px 12px rgba(226,182,90,.45);flex:0 1 auto}
  #screen-settings.st-night .appbar .icon-btn{position:absolute;inset-inline-start:14px;width:46px;height:46px;border-radius:50%;background:rgba(10,14,40,.6);
    border:2px solid var(--g);color:var(--g2);box-shadow:0 0 12px rgba(226,182,90,.35)}
  #screen-settings.st-night .wrap{max-width:560px}
  .st-night .stc{position:relative;margin:18px 0 0;padding:10px 4px 6px;border-radius:22px;
    background:linear-gradient(180deg,rgba(16,22,58,.9),rgba(10,14,40,.92));border:1.5px solid var(--g);
    box-shadow:0 0 0 1px rgba(0,0,0,.4),0 0 18px rgba(226,182,90,.22),inset 0 0 22px rgba(226,182,90,.10)}
  .st-night .stc::after{content:"";position:absolute;left:50%;bottom:-6px;width:12px;height:12px;transform:translateX(-50%) rotate(45deg);
    background:var(--g);border-radius:2px;box-shadow:0 0 8px rgba(226,182,90,.7)}
  .st-night .stc h3{margin:6px 14px 6px;color:var(--g);font-size:.92rem;font-weight:900;letter-spacing:.06em;text-transform:uppercase;display:flex;align-items:center;gap:6px}
  .st-night .stc .menu,.st-night .stc .card{background:none;border:0;box-shadow:none;margin:0;padding:0 6px}
  .st-night .stc .menu > button,.st-night .stc .menu > a,.st-night .stc .menu > label,.st-night .stc .menu > .sp-row{color:var(--ink2);background:none;border:0;
    border-top:1px solid rgba(226,182,90,.16);font-weight:700;border-radius:0}
  .st-night .stc .menu > :first-child{border-top:0}
  .st-night .stc .menu .end,.st-night .stc .menu .chev{color:var(--mut2)}
  .st-night .stc .menu .chev{margin-inline-start:auto;font-size:1.15rem}
  .st-night .stc .menu .end + .chev{margin-inline-start:8px}
  .st-night .stc .menu .danger{color:#ff8a8a}
  /* real on / off switches */
  .st-night .tgl .end{display:none}
  .st-night .tgl .sw{margin-inline-start:auto;flex:0 0 auto;width:50px;height:28px;border-radius:999px;position:relative;background:rgba(0,0,0,.45);border:1.5px solid rgba(226,182,90,.75);transition:background .2s}
  .st-night .tgl .sw::after{content:"";position:absolute;top:3px;inset-inline-start:3px;width:19px;height:19px;border-radius:50%;background:#f6eedb;box-shadow:0 1px 4px rgba(0,0,0,.4);transition:transform .2s}
  .st-night .tgl.on .sw{background:linear-gradient(90deg,#b8862e,#f3cc6b);box-shadow:0 0 10px rgba(243,204,107,.6)}
  .st-night .tgl.on .sw::after{transform:translateX(22px);background:#fffdf5}
  html[dir="rtl"] .st-night .tgl.on .sw::after{transform:translateX(-22px)}
  /* look: one long golden pill */
  .st-night .sp-row{flex-direction:column;align-items:stretch;gap:8px}
  .st-night .sp-theme{margin:0;display:grid;grid-template-columns:repeat(3,1fr);gap:0;border:1.5px solid rgba(226,182,90,.7);border-radius:999px;padding:3px;background:rgba(0,0,0,.35)}
  .st-night .sp-theme button{border:0;background:none;color:var(--ink2);border-radius:999px;padding:7px 4px}
  .st-night .sp-theme button.on{background:linear-gradient(180deg,#f7d98b,#d9a441);color:#2a1a00;box-shadow:0 0 10px rgba(243,204,107,.55)}
  .st-night .st-lang{padding:6px 10px 10px}
  .st-night .st-lang select{width:100%;padding:10px 14px;border-radius:999px;border:1.5px solid rgba(226,182,90,.7);background:rgba(0,0,0,.35);color:var(--ink2);font:inherit;font-weight:800}
  .st-night .stc .stats3 > div{background:rgba(0,0,0,.3);border:1px solid rgba(226,182,90,.25);color:var(--ink2)}
  .st-night .stc .stats3 span,.st-night .stc .badge-l{color:var(--mut2)}`;
  document.head.appendChild(css);

  const getMode = () => { try { return localStorage.getItem("themeMode") || "auto"; } catch { return "auto"; } };
  function setMode(m) {
    try { if (m === "auto") localStorage.removeItem("themeMode"); else localStorage.setItem("themeMode", m); } catch {}
    if (m === "auto") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", m);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", m === "light" ? "#f2f5f3" : m === "dark" ? "#08110f" : "#0c1a17");
  }

  window.SettingsPlus = {
    // the rows added to ⚙️ Settings (each one goes into its own section)
    themeHtml() {
      const m = getMode();
      return `<div class="sp-row"><span>${esc(t("sp_theme"))}</span><span class="sp-theme" id="sp-theme">
          <button type="button" data-tm="auto" class="${m === "auto" ? "on" : ""}">${esc(t("sp_auto"))}</button>
          <button type="button" data-tm="light" class="${m === "light" ? "on" : ""}">${esc(t("sp_light"))}</button>
          <button type="button" data-tm="dark" class="${m === "dark" ? "on" : ""}">${esc(t("sp_dark"))}</button></span></div>`;
    },
    friendsHtml: () => `<button type="button" id="sp-friends" class="tgl">${esc(t("sp_friends"))}<span class="end" id="sp-friends-st">…</span><span class="sw" aria-hidden="true"></span></button>`,
    blockedHtml: () => `<button type="button" id="sp-blocked">${esc(t("sp_blocked"))}<span class="end">${blocked.size || ""}</span><span class="chev">›</span></button>`,
    html() { return SettingsPlus.themeHtml() + SettingsPlus.friendsHtml() + SettingsPlus.blockedHtml(); },
    // 🌙 the night look, and on / off rows get a real switch (it follows the "✅ …" text the row shows)
    decorate() {
      const scr = document.getElementById("screen-settings"); if (!scr) return;
      scr.classList.add("st-night");
      scr.querySelectorAll(".tgl").forEach((row) => {
        const st = row.querySelector(".end"); if (!st) return;
        const sync = () => row.classList.toggle("on", /^✅/.test(st.textContent.trim()));
        sync();
        new MutationObserver(sync).observe(st, { childList: true, characterData: true, subtree: true });
      });
    },
    async wire() {
      document.getElementById("sp-theme")?.addEventListener("click", (e) => {
        const b = e.target.closest("[data-tm]"); if (!b) return;
        setMode(b.dataset.tm);
        document.querySelectorAll("#sp-theme [data-tm]").forEach((x) => x.classList.toggle("on", x === b));
      });
      document.getElementById("sp-blocked")?.addEventListener("click", openBlocked);
      const fb = document.getElementById("sp-friends"), st = document.getElementById("sp-friends-st");
      if (fb && st) {
        let on = false;
        const show = () => { st.textContent = on ? t("sp_on") : t("sp_off"); };
        try { const { data, error } = await sb.rpc("my_call_friends_only"); if (!error) on = data === true; } catch {}
        show();
        fb.addEventListener("click", async () => {
          fb.disabled = true;
          const { data, error } = await sb.rpc("set_call_friends_only", { p_on: !on });
          fb.disabled = false;
          if (error) return toast(t("error") + error.message);
          on = data === true; show(); toast(on ? t("sp_friendsOn") : t("sp_friendsOff"));
        });
      }
    },
  };

  async function openBlocked() {
    openSheet(`<h1>${esc(t("sp_blocked"))}</h1><div id="sp-bl"><div class="empty">…</div></div>`);
    const ids = [...blocked];
    const box = () => document.getElementById("sp-bl");
    if (!ids.length) { if (box()) box().innerHTML = `<div class="empty"><span class="big">🚫</span>${esc(t("sp_noBlocked"))}</div>`; return; }
    const r = await sb.from("profiles").select(PROFILE_COLS).in("id", ids);
    (r.data || []).forEach((p) => profileCache.set(p.id, p));
    const draw = () => {
      const b = box(); if (!b) return;
      const list = [...blocked];
      b.innerHTML = list.length ? list.map((id) => {
        const p = profileCache.get(id) || { name: t("guest") };
        return `<div class="sp-bl">${avHtml(p.name, p.avatar_url, "sm")}<div class="info" dir="auto">${esc(p.name)} ${flag(p.country)}</div>
          <button type="button" class="btn sm ghost" data-unb="${esc(id)}">${esc(t("sp_unblock"))}</button></div>`;
      }).join("") : `<div class="empty"><span class="big">🚫</span>${esc(t("sp_noBlocked"))}</div>`;
    };
    draw();
    box()?.addEventListener("click", async (e) => {
      const b = e.target.closest("[data-unb]"); if (!b) return;
      b.disabled = true;
      if (blocked.has(b.dataset.unb)) await toggleBlock(b.dataset.unb);
      toast(t("sp_unblocked")); draw();
    });
  }

  // follow the phone again when it switches between light and dark (only in Auto)
  try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { if (getMode() === "auto") setMode("auto"); }); } catch {}
  setMode(getMode());
})();
