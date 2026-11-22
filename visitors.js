/* 👁️ Who visited my profile + 💬 "anyone can message me" (needs supabase/update-32-visitors-messages.sql)
   - opening someone's profile saves a visit (one per person, the newest time)
   - my profile: a small 👁️ at the top with a red number of NEW visitors; tap it → the list
   - ⚙️ Settings: "Anyone can message me" on / off (off = only people who follow each other, as before) */
(() => {
  const W = {
    en: { vis_title: "👁️ Profile visitors", vis_empty: "No visitors yet.", vis_note: "🟢 = new · visitors from the last 30 days", vis_new: "New",
      dm_menu: "💬 Anyone can message me", dm_on: "✅ On", dm_off: "Off", dm_onToast: "✅ Now anyone can message you", dm_offToast: "Only people who follow each other can message you now" },
    ckb: { vis_title: "👁️ سەردانکەرانی پرۆفایل", vis_empty: "هێشتا کەس سەردانی نەکردوویت.", vis_note: "🟢 = نوێ · سەردانکەرانی ٣٠ ڕۆژی ڕابردوو", vis_new: "نوێ",
      dm_menu: "💬 هەر کەسێک دەتوانێت نامەم بۆ بنێرێت", dm_on: "✅ داگیرساوە", dm_off: "کوژاوە", dm_onToast: "✅ ئێستا هەر کەسێک دەتوانێت نامەت بۆ بنێرێت", dm_offToast: "ئێستا تەنها ئەوانەی یەکتریان فۆڵۆو کردووە دەتوانن نامەت بۆ بنێرن" },
    ar: { vis_title: "👁️ زوار الملف الشخصي", vis_empty: "لا زوار بعد.", vis_note: "🟢 = جديد · زوار آخر 30 يوماً", vis_new: "جديد",
      dm_menu: "💬 يمكن لأي شخص مراسلتي", dm_on: "✅ مفعّل", dm_off: "متوقف", dm_onToast: "✅ الآن يمكن لأي شخص مراسلتك", dm_offToast: "الآن فقط من يتابع كل منكما الآخر يمكنه مراسلتك" },
    tr: { vis_title: "👁️ Profil ziyaretçileri", vis_empty: "Henüz ziyaretçi yok.", vis_note: "🟢 = yeni · son 30 günün ziyaretçileri", vis_new: "Yeni",
      dm_menu: "💬 Herkes bana mesaj atabilir", dm_on: "✅ Açık", dm_off: "Kapalı", dm_onToast: "✅ Artık herkes sana mesaj atabilir", dm_offToast: "Artık sadece karşılıklı takipleştiğin kişiler mesaj atabilir" },
    fa: { vis_title: "👁️ بازدیدکنندگان پروفایل", vis_empty: "هنوز بازدیدکننده‌ای نیست.", vis_note: "🟢 = جدید · بازدیدکنندگان ۳۰ روز گذشته", vis_new: "جدید",
      dm_menu: "💬 همه می‌توانند به من پیام دهند", dm_on: "✅ روشن", dm_off: "خاموش", dm_onToast: "✅ حالا همه می‌توانند به تو پیام دهند", dm_offToast: "حالا فقط کسانی که همدیگر را دنبال می‌کنید می‌توانند پیام دهند" },
    de: { vis_title: "👁️ Profilbesucher", vis_empty: "Noch keine Besucher.", vis_note: "🟢 = neu · Besucher der letzten 30 Tage", vis_new: "Neu",
      dm_menu: "💬 Jeder darf mir schreiben", dm_on: "✅ An", dm_off: "Aus", dm_onToast: "✅ Jetzt kann dir jeder schreiben", dm_offToast: "Jetzt können dir nur gegenseitige Follower schreiben" },
    fr: { vis_title: "👁️ Visiteurs du profil", vis_empty: "Aucun visiteur pour l'instant.", vis_note: "🟢 = nouveau · visiteurs des 30 derniers jours", vis_new: "Nouveau",
      dm_menu: "💬 Tout le monde peut m'écrire", dm_on: "✅ Activé", dm_off: "Désactivé", dm_onToast: "✅ Tout le monde peut maintenant t'écrire", dm_offToast: "Seuls les abonnés mutuels peuvent t'écrire maintenant" },
    es: { vis_title: "👁️ Visitas al perfil", vis_empty: "Aún no hay visitas.", vis_note: "🟢 = nuevo · visitas de los últimos 30 días", vis_new: "Nuevo",
      dm_menu: "💬 Cualquiera puede escribirme", dm_on: "✅ Activado", dm_off: "Desactivado", dm_onToast: "✅ Ahora cualquiera puede escribirte", dm_offToast: "Ahora solo quienes se siguen mutuamente pueden escribirte" },
  };
  try { for (const [l, o] of Object.entries(W)) if (I18N[l]) Object.assign(I18N[l], o); } catch {}

  const css = document.createElement("style");
  css.textContent = `
  .pf2-tl{display:flex;align-items:center;gap:8px}
  .pf2 .glass.pf2-eye{height:30px;min-width:30px;padding:0 8px;font-size:13px;position:relative}
  .pf2-eye .n{position:absolute;top:-5px;inset-inline-end:-6px;min-width:16px;height:16px;padding:0 4px;box-sizing:border-box;border-radius:999px;
    background:#ff4d6d;color:#fff;font-size:10px;font-weight:900;display:grid;place-items:center;box-shadow:0 0 0 2px rgba(0,0,0,.25)}
  .vis-row{display:flex;align-items:center;gap:10px;padding:10px 2px;cursor:pointer}
  .vis-row+.vis-row{border-top:1px solid var(--line)}
  .vis-row .info{flex:1;min-width:0}.vis-row .name{font-weight:800}.vis-row .meta{color:var(--muted);font-size:.8rem}
  .vis-row .dot{width:8px;height:8px;border-radius:50%;background:#22c55e;flex:none}
  .vis-note{color:var(--muted);font-size:.8rem;text-align:center;margin:12px 0 4px}`;
  document.head.appendChild(css);

  let newCount = 0;
  const paint = () => document.querySelectorAll(".pf2-eye .n").forEach((n) => { n.hidden = !newCount; n.textContent = newCount > 99 ? "99+" : String(newCount); });

  window.Visitors = {
    // someone opened a profile that isn't theirs
    log(owner) { try { if (sb && me && owner && owner !== me.id) sb.rpc("log_profile_visit", { p_owner: owner }).then(() => {}, () => {}); } catch {} },
    // the red number on my 👁️
    async badge() {
      paint();
      try { const { data, error } = await sb.rpc("visitors_new_count"); if (!error) { newCount = Number(data) || 0; paint(); } } catch {}
    },
    async open() {
      openSheet(`<h1>${esc(t("vis_title"))}</h1><div id="vis-list"><div class="empty">…</div></div><p class="vis-note">${esc(t("vis_note"))}</p>`);
      const box = document.getElementById("vis-list");
      const { data, error } = await sb.rpc("my_visitors");
      if (!box?.isConnected) return;
      if (error) { box.innerHTML = `<div class="empty">${esc(t("loadFail"))}<br><small>${esc(error.message)}</small></div>`; return; }
      const rows = data || [];
      if (rows.length) {
        const r = await sb.from("profiles").select(PROFILE_COLS).in("id", rows.map((x) => x.visitor));
        (r.data || []).forEach((p) => profileCache.set(p.id, p));
      }
      const html = rows.map((v) => {
        const p = profileCache.get(v.visitor); if (!p) return "";
        const iFollow = following.has(p.id), followsMe = myFollowers.has(p.id);
        return `<div class="vis-row" data-vp="${esc(p.id)}">${avHtml(p.name, p.avatar_url, "sm")}
          <div class="info"><div class="name" dir="auto">${esc(p.name)} ${flag(p.country)} ${lvHtml(p)}</div><div class="meta">${esc(shortTime(v.last_at))}</div></div>
          ${v.is_new ? `<span class="dot" title="${esc(t("vis_new"))}"></span>` : ""}
          <button type="button" class="btn sm ${iFollow ? "ghost" : ""}" data-vf="${esc(p.id)}">${esc(iFollow ? t("unfollow") : followsMe ? t("followBack") : t("follow"))}</button></div>`;
      }).join("");
      box.innerHTML = html || `<div class="empty"><span class="big">👁️</span>${esc(t("vis_empty"))}</div>`;
      box.addEventListener("click", async (e) => {
        const fb = e.target.closest("[data-vf]");
        if (fb) {
          e.stopPropagation(); fb.disabled = true;
          await toggleFollow(fb.dataset.vf);
          const f = following.has(fb.dataset.vf);
          fb.textContent = f ? t("unfollow") : myFollowers.has(fb.dataset.vf) ? t("followBack") : t("follow");
          fb.classList.toggle("ghost", f); fb.disabled = false;
          return;
        }
        const row = e.target.closest("[data-vp]");
        if (row) { closeSheet(); openProfile(row.dataset.vp); }
      });
      // I've seen them now → the red number goes away
      try { await sb.rpc("mark_visitors_seen"); } catch {}
      newCount = 0; paint();
    },
    // ⚙️ Settings → 💬 anyone can message me
    async wireDm() {
      const btn = document.getElementById("me-dm"), st = document.getElementById("me-dm-st");
      if (!btn || !st) return;
      let on = false;
      const show = () => { st.textContent = on ? t("dm_on") : t("dm_off"); };
      try { const { data, error } = await sb.rpc("my_dm_open"); if (!error) on = data === true; } catch {}
      show();
      btn.addEventListener("click", async () => {
        btn.disabled = true;
        const { data, error } = await sb.rpc("set_dm_open", { p_open: !on });
        btn.disabled = false;
        if (error) return toast(t("error") + error.message);
        on = data === true; show();
        toast(on ? t("dm_onToast") : t("dm_offToast"));
      });
    },
  };
})();
