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
  try { for (const [l, o] of Object.entries(W)) if (I18N[l]) Object.assign(I18N[l], o); } catch {}

  const css = document.createElement("style");
  css.textContent = `
  .sp-theme{display:flex;gap:6px;margin-inline-start:auto}
  .sp-theme button{border:1.5px solid var(--line);background:var(--bg);color:var(--ink);border-radius:999px;padding:5px 10px;font:inherit;font-size:.78rem;font-weight:800;cursor:pointer}
  .sp-theme button.on{border-color:var(--brand);background:var(--soft);color:var(--brand)}
  .sp-row{display:flex;align-items:center;gap:10px;padding:14px 16px;flex-wrap:wrap}
  .sp-bl{display:flex;align-items:center;gap:10px;padding:10px 2px}.sp-bl+.sp-bl{border-top:1px solid var(--line)}
  .sp-bl .info{flex:1;min-width:0;font-weight:800}`;
  document.head.appendChild(css);

  const getMode = () => { try { return localStorage.getItem("themeMode") || "auto"; } catch { return "auto"; } };
  function setMode(m) {
    try { if (m === "auto") localStorage.removeItem("themeMode"); else localStorage.setItem("themeMode", m); } catch {}
    if (m === "auto") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", m);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", m === "light" ? "#f2f5f3" : m === "dark" ? "#08110f" : "#0c1a17");
  }

  window.SettingsPlus = {
    // the rows added to ⚙️ Settings
    html() {
      const m = getMode();
      return `<div class="sp-row"><span>${esc(t("sp_theme"))}</span><span class="sp-theme" id="sp-theme">
          <button type="button" data-tm="auto" class="${m === "auto" ? "on" : ""}">${esc(t("sp_auto"))}</button>
          <button type="button" data-tm="light" class="${m === "light" ? "on" : ""}">${esc(t("sp_light"))}</button>
          <button type="button" data-tm="dark" class="${m === "dark" ? "on" : ""}">${esc(t("sp_dark"))}</button></span></div>
        <button type="button" id="sp-friends">${esc(t("sp_friends"))}<span class="end" id="sp-friends-st">…</span></button>
        <button type="button" id="sp-blocked">${esc(t("sp_blocked"))}<span class="end">${blocked.size || ""}</span></button>`;
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
