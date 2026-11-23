/* 📞 + 👤 extras (needs supabase/update-37-call-me-plus.sql)
   📞 choose men / women (⭐ Premium) · ⏳ minutes left on the 📞 button
   🎂 birthday (⚙️ Settings; friends see 🎂 that day) · 🔗 profile link · 💎 VIP badge for ⭐ Premium */
(() => {
  const W = {
    en: { mp_iam: "I am", mp_m: "👨 Man", mp_f: "👩 Woman", mp_talk: "Talk with", mp_any: "🌍 Anyone", mp_men: "👨 Men", mp_women: "👩 Women", mp_proOnly: "⭐ Choosing men or women is for Premium",
      mp_needMe: "First choose if you are a man or a woman", mp_bday: "🎂 Birthday", mp_bdaySet: "🎂 Birthday saved", mp_bdayNone: "Not set", mp_bdayClear: "Remove", mp_month: "Month", mp_day: "Day",
      mp_bdayToday: "🎂 Today is {name}'s birthday!", mp_bdayTag: "🎂 Birthday today", mp_link: "🔗 Profile link", mp_linkCopied: "🔗 Link copied", mp_vip: "💎 VIP", mp_save: "Save" },
    ckb: { mp_iam: "من", mp_m: "👨 پیاوم", mp_f: "👩 ئافرەتم", mp_talk: "قسە لەگەڵ", mp_any: "🌍 هەر کەسێک", mp_men: "👨 پیاوان", mp_women: "👩 ئافرەتان", mp_proOnly: "⭐ هەڵبژاردنی پیاو یان ئافرەت تەنها بۆ Premium ـە",
      mp_needMe: "سەرەتا هەڵبژێرە کە پیاویت یان ئافرەت", mp_bday: "🎂 ڕۆژی لەدایکبوون", mp_bdaySet: "🎂 ڕۆژی لەدایکبوون پاشەکەوت کرا", mp_bdayNone: "دانەنراوە", mp_bdayClear: "لابردن", mp_month: "مانگ", mp_day: "ڕۆژ",
      mp_bdayToday: "🎂 ئەمڕۆ ڕۆژی لەدایکبوونی {name} ـە!", mp_bdayTag: "🎂 ئەمڕۆ ڕۆژی لەدایکبوونیەتی", mp_link: "🔗 لینکی پرۆفایل", mp_linkCopied: "🔗 لینکەکە کۆپی کرا", mp_vip: "💎 VIP", mp_save: "پاشەکەوت" },
    ar: { mp_iam: "أنا", mp_m: "👨 رجل", mp_f: "👩 امرأة", mp_talk: "تحدث مع", mp_any: "🌍 أي شخص", mp_men: "👨 رجال", mp_women: "👩 نساء", mp_proOnly: "⭐ اختيار الرجال أو النساء لـ Premium فقط",
      mp_needMe: "اختر أولاً إن كنت رجلاً أو امرأة", mp_bday: "🎂 عيد الميلاد", mp_bdaySet: "🎂 تم حفظ عيد الميلاد", mp_bdayNone: "غير محدد", mp_bdayClear: "حذف", mp_month: "الشهر", mp_day: "اليوم",
      mp_bdayToday: "🎂 اليوم عيد ميلاد {name}!", mp_bdayTag: "🎂 عيد ميلاده اليوم", mp_link: "🔗 رابط الملف", mp_linkCopied: "🔗 تم نسخ الرابط", mp_vip: "💎 VIP", mp_save: "حفظ" },
  };
  try { for (const [l, o] of Object.entries(W)) if (I18N[l]) Object.assign(I18N[l], o); } catch {}

  const css = document.createElement("style");
  css.textContent = `
  #rc .mp-box{display:grid;gap:8px;background:var(--card);border:1px solid var(--line);border-radius:18px;padding:12px 14px}
  #rc .mp-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  #rc .mp-row > span{font-weight:800;font-size:.82rem;color:var(--muted);min-width:64px}
  #rc .mp-row button{border:1.5px solid var(--line);background:var(--bg);color:var(--ink);border-radius:999px;padding:6px 12px;font:inherit;font-weight:800;font-size:.82rem;cursor:pointer}
  #rc .mp-row button.on{border-color:var(--brand);background:var(--soft);color:var(--brand)}
  #rc .mp-row button.lock::after{content:" ⭐";font-size:.7rem}
  .tabbar .callbtn .mins{position:absolute;top:-24px;inset-inline-end:calc(50% - 34px);min-width:20px;height:18px;padding:0 5px;box-sizing:border-box;border-radius:999px;
    background:#fff;color:#0b8f7a;font-size:.66rem;font-weight:900;display:grid;place-items:center;box-shadow:0 2px 8px rgba(0,0,0,.25);z-index:2;font-variant-numeric:tabular-nums}
  .tabbar .callbtn .mins.low{background:#ef4444;color:#fff}
  .pf2-vip{display:inline-flex;align-items:center;margin-inline-start:6px;padding:1px 8px;border-radius:999px;font-size:.72rem;font-weight:900;color:#3b2300;
    background:linear-gradient(135deg,#fde68a,#f59e0b);box-shadow:0 2px 8px rgba(245,158,11,.4);vertical-align:middle}
  .pf2-bday{display:inline-block;margin:4px 0 0;padding:2px 10px;border-radius:999px;background:rgba(244,114,182,.15);color:#db2777;font-weight:800;font-size:.8rem}
  .pf2 .glass.pf2-link{height:30px;min-width:30px;padding:0 8px;font-size:13px}
  .mp-bd{display:flex;gap:10px;margin:8px 0 14px}.mp-bd label{flex:1;display:grid;gap:4px;font-weight:700;font-size:.85rem}`;
  document.head.appendChild(css);

  const ready = () => typeof me !== "undefined" && me && typeof sb !== "undefined" && sb;

  /* ---------- 📞 man / woman + who to talk with ---------- */
  async function callPrefs(el) {
    const go = el.querySelector("#rc-go"); if (!go || el.querySelector(".mp-box")) return;
    const box = document.createElement("div"); box.className = "mp-box";
    box.innerHTML = `<div class="mp-row"><span>${esc(t("mp_iam"))}</span><button type="button" data-g="m">${esc(t("mp_m"))}</button><button type="button" data-g="f">${esc(t("mp_f"))}</button></div>
      <div class="mp-row"><span>${esc(t("mp_talk"))}</span><button type="button" data-w="any">${esc(t("mp_any"))}</button><button type="button" data-w="m">${esc(t("mp_men"))}</button><button type="button" data-w="f">${esc(t("mp_women"))}</button></div>`;
    go.after(box);
    let st = { o_gender: null, o_want: "any", o_premium: false };
    const paint = () => {
      box.querySelectorAll("[data-g]").forEach((b) => b.classList.toggle("on", b.dataset.g === st.o_gender));
      box.querySelectorAll("[data-w]").forEach((b) => { b.classList.toggle("on", b.dataset.w === st.o_want); b.classList.toggle("lock", b.dataset.w !== "any" && !st.o_premium); });
    };
    try { const { data, error } = await sb.rpc("my_call_prefs"); if (!error) st = (Array.isArray(data) ? data[0] : data) || st; } catch {}
    paint();
    box.addEventListener("click", async (e) => {
      const g = e.target.closest("[data-g]"), w = e.target.closest("[data-w]");
      if (g) {
        const { error } = await sb.rpc("set_my_gender", { p_gender: g.dataset.g });
        if (error) return toast(t("error") + error.message);
        st.o_gender = g.dataset.g; paint();
      } else if (w) {
        if (w.dataset.w !== "any" && !st.o_premium) return toast(t("mp_proOnly"));
        if (w.dataset.w !== "any" && !st.o_gender) return toast(t("mp_needMe"));
        const { error } = await sb.rpc("set_want_gender", { p_want: w.dataset.w });
        if (error) return toast(/premium_only/.test(error.message) ? t("mp_proOnly") : t("error") + error.message);
        st.o_want = w.dataset.w; paint();
      }
    });
  }

  /* ---------- ⏳ minutes left, on the 📞 button ---------- */
  function callBadge(mins) {
    const btn = document.getElementById("tab-call"); if (!btn) return;
    let b = btn.querySelector(".mins");
    if (!b) { b = document.createElement("span"); b.className = "mins"; btn.querySelector(".bub")?.appendChild(b); }
    b.textContent = String(Math.max(0, mins | 0));
    b.classList.toggle("low", mins <= 5);
  }
  async function refreshBadge() {
    if (!ready()) return;
    try {
      const { data, error } = await sb.rpc("rc_status"); if (error) return;
      const s = Array.isArray(data) ? data[0] : data; if (!s) return;
      callBadge(Math.floor(Math.max(0, (s.o_limit || 0) - (s.o_used || 0)) / 60));
    } catch {}
  }

  /* ---------- 🎂 birthday ---------- */
  async function openBirthday() {
    let cur = {};
    try { const { data } = await sb.rpc("my_birthday"); cur = (Array.isArray(data) ? data[0] : data) || {}; } catch {}
    const months = Array.from({ length: 12 }, (_, i) => { let n = String(i + 1); try { n = new Intl.DateTimeFormat(uiLang, { month: "long" }).format(new Date(2024, i, 1)); } catch {} return `<option value="${i + 1}" ${cur.o_month === i + 1 ? "selected" : ""}>${esc(n)}</option>`; }).join("");
    const days = Array.from({ length: 31 }, (_, i) => `<option value="${i + 1}" ${cur.o_day === i + 1 ? "selected" : ""}>${i + 1}</option>`).join("");
    openSheet(`<h1>${esc(t("mp_bday"))}</h1>
      <div class="mp-bd"><label>${esc(t("mp_month"))}<select id="mp-m"><option value="">—</option>${months}</select></label>
        <label>${esc(t("mp_day"))}<select id="mp-d"><option value="">—</option>${days}</select></label></div>
      <button class="btn block" type="button" id="mp-bsave">${esc(t("mp_save"))}</button>
      ${cur.o_month ? `<button class="btn ghost block" type="button" id="mp-bclear" style="margin-top:8px">${esc(t("mp_bdayClear"))}</button>` : ""}`);
    const save = async (m, d) => {
      const { error } = await sb.rpc("set_birthday", { p_month: m, p_day: d });
      if (error) return toast(t("error") + error.message);
      closeSheet(); toast(t("mp_bdaySet"));
      const st = document.getElementById("me-bday-st"); if (st) st.textContent = m ? `${d}/${m}` : t("mp_bdayNone");
    };
    document.getElementById("mp-bsave").addEventListener("click", () => {
      const m = Number(document.getElementById("mp-m").value) || null, d = Number(document.getElementById("mp-d").value) || null;
      if (!m || !d) return toast(t("mp_bdayNone"));
      save(m, d);
    });
    document.getElementById("mp-bclear")?.addEventListener("click", () => save(null, null));
  }
  async function wireBirthday() {
    const st = document.getElementById("me-bday-st"); if (!st) return;
    try { const { data } = await sb.rpc("my_birthday"); const c = (Array.isArray(data) ? data[0] : data) || {}; st.textContent = c.o_month ? `${c.o_day}/${c.o_month}` : t("mp_bdayNone"); } catch {}
  }
  // once a day: "🎂 Today is Sara's birthday!"
  async function birthdayCheck() {
    if (!ready()) return;
    const key = "bdayShown-" + new Date().toISOString().slice(0, 10);
    try { if (localStorage.getItem(key)) return; } catch {}
    const { data, error } = await sb.rpc("friends_birthdays_today"); if (error || !data?.length) return;
    try { localStorage.setItem(key, "1"); } catch {}
    const ids = data.map((x) => (typeof x === "string" ? x : x.friends_birthdays_today || Object.values(x)[0])).filter(Boolean);
    for (const id of ids.slice(0, 3)) {
      const p = await getProfile(id);
      toast(t("mp_bdayToday", { name: p?.name || t("guest") }), t("open"), () => openProfile(id));
    }
  }

  /* ---------- 🔗 profile link (with the 10-digit ID) ---------- */
  const base = () => location.href.split("?")[0].split("#")[0];
  async function shareLink(userId, name) {
    let pid = null;
    try { const { data } = await sb.rpc("public_id_of", { p_user: userId }); pid = data; } catch {}
    const url = pid ? `${base()}?u=${pid}` : `${base()}?user=${userId}`;
    if (navigator.share) { try { await navigator.share({ title: name || "Learn Together", url }); return; } catch (e) { if (e?.name === "AbortError") return; } }
    try { await navigator.clipboard.writeText(url); toast(t("mp_linkCopied")); } catch { prompt(t("mp_link"), url); }
  }
  async function openByPublic(v) {
    const n = Number(v); if (!/^\d{3,10}$/.test(String(v || "")) || !n) return;
    const { data } = await sb.rpc("user_by_public_id", { p_id: n });
    if (data) openProfilePage(data);
  }

  /* ---------- on every profile: 💎 VIP · 🎂 today · 🔗 link ---------- */
  async function decorateProfile(root, p, isMe) {
    if (!p?.id) return;
    const top = root.querySelector(".pf2-top");
    if (top && !top.querySelector(".pf2-link")) {
      const b = document.createElement("button"); b.type = "button"; b.className = "glass pf2-link"; b.setAttribute("aria-label", t("mp_link")); b.textContent = "🔗";
      b.addEventListener("click", (e) => { e.stopPropagation(); shareLink(p.id, p.name); });
      if (isMe) top.querySelector(".pf2-tl")?.appendChild(b);
      else {
        // someone else: [←]  ……  [🔗][⋯]
        const more = top.querySelector('[data-act="more"]');
        const wrap = document.createElement("span"); wrap.className = "pf2-tl";
        if (more) { more.before(wrap); wrap.append(b, more); } else { top.appendChild(wrap); wrap.appendChild(b); }
      }
    }
    const [vip, bd] = await Promise.all([
      sb.rpc("vip_of", { p_ids: [p.id] }).then((r) => (r.data || []).length > 0, () => false),
      sb.rpc("birthday_today", { p_user: p.id }).then((r) => r.data === true, () => false),
    ]);
    if (root._p !== p) return;
    const nm = root.querySelector(".pf2-name");
    if (vip && nm && !nm.querySelector(".pf2-vip")) nm.insertAdjacentHTML("beforeend", `<span class="pf2-vip">${esc(t("mp_vip"))}</span>`);
    if (bd && nm && !root.querySelector(".pf2-bday")) nm.insertAdjacentHTML("afterend", `<div class="pf2-bday">${esc(t("mp_bdayTag"))}</div>`);
  }

  window.MePlus = { callPrefs, callBadge, refreshBadge, openBirthday, wireBirthday, decorateProfile, openByPublic, shareLink };

  // the minutes on 📞 and the birthday notice, soon after the app opens (and the minutes every 5 minutes)
  let tries = 0;
  const boot = setInterval(() => {
    if (ready()) { clearInterval(boot); refreshBadge(); birthdayCheck(); setInterval(refreshBadge, 5 * 60e3); }
    else if (++tries > 60) clearInterval(boot);
  }, 2000);
})();
