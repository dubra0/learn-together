/* 🔍 Find people + 🪪 10-digit IDs (needs supabase/update-33-ids-names-search.sql)
   - the 🔍 at the top of the feed opens the search
   - type the start of a name ("a" → everyone whose name starts with a) or the digits of an ID
   - every profile shows its ID under the name (tap it to copy) */
(() => {
  const W = {
    en: { ps_title: "🔍 Find people", ps_ph: "Name or ID", ps_hint: "Type the start of a name, or an ID", ps_none: "Nobody found", idLbl: "ID", nameTaken: "❌ This name is taken — please choose another one" },
    ckb: { ps_title: "🔍 گەڕان بۆ کەسەکان", ps_ph: "ناو یان ID", ps_hint: "سەرەتای ناوێک یان ID ـەکەی بنووسە", ps_none: "کەس نەدۆزرایەوە", idLbl: "ID", nameTaken: "❌ ئەم ناوە کەسێکی تر هەیەتی، تکایە ناوێکی تر هەڵبژێرە" },
    ar: { ps_title: "🔍 ابحث عن أشخاص", ps_ph: "الاسم أو المعرّف", ps_hint: "اكتب بداية الاسم أو المعرّف", ps_none: "لم يتم العثور على أحد", idLbl: "ID", nameTaken: "❌ هذا الاسم مستخدم — اختر اسماً آخر" },
    tr: { ps_title: "🔍 Kişi bul", ps_ph: "İsim veya ID", ps_hint: "Bir ismin başını veya bir ID yaz", ps_none: "Kimse bulunamadı", idLbl: "ID", nameTaken: "❌ Bu isim alınmış — başka bir isim seç" },
    fa: { ps_title: "🔍 پیدا کردن افراد", ps_ph: "نام یا ID", ps_hint: "ابتدای یک نام یا ID را بنویس", ps_none: "کسی پیدا نشد", idLbl: "ID", nameTaken: "❌ این نام گرفته شده — نام دیگری انتخاب کن" },
    de: { ps_title: "🔍 Leute finden", ps_ph: "Name oder ID", ps_hint: "Tippe den Anfang eines Namens oder eine ID", ps_none: "Niemand gefunden", idLbl: "ID", nameTaken: "❌ Dieser Name ist vergeben — bitte wähle einen anderen" },
    fr: { ps_title: "🔍 Trouver des gens", ps_ph: "Nom ou ID", ps_hint: "Tape le début d'un nom, ou un ID", ps_none: "Personne trouvé", idLbl: "ID", nameTaken: "❌ Ce nom est déjà pris — choisis-en un autre" },
    es: { ps_title: "🔍 Buscar personas", ps_ph: "Nombre o ID", ps_hint: "Escribe el inicio de un nombre, o un ID", ps_none: "No se encontró a nadie", idLbl: "ID", nameTaken: "❌ Ese nombre ya está en uso — elige otro" },
  };
  try { for (const [l, o] of Object.entries(W)) if (I18N[l]) Object.assign(I18N[l], o); } catch {}

  const css = document.createElement("style");
  css.textContent = `
  .feed-top .srch{position:absolute;left:12px;top:calc(8px + env(safe-area-inset-top));width:34px;height:34px;border-radius:12px;border:0;
    background:rgba(255,255,255,.18);color:#fff;display:grid;place-items:center;cursor:pointer;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
  .feed-top .srch svg{width:18px;height:18px}
  .ps-in{width:100%;box-sizing:border-box;margin:4px 0 10px;padding:12px 14px;border-radius:14px;border:1.5px solid var(--line);background:var(--card);color:var(--ink);font:inherit;font-size:1rem}
  .ps-in:focus{outline:none;border-color:var(--brand)}
  .ps-row{display:flex;align-items:center;gap:10px;padding:9px 2px;cursor:pointer}
  .ps-row+.ps-row{border-top:1px solid var(--line)}
  .ps-row .info{flex:1;min-width:0}.ps-row .name{font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .ps-row .id{color:var(--muted);font-size:.78rem;font-variant-numeric:tabular-nums}
  .ps-row mark{background:none;color:var(--brand);font-weight:900}
  .pf2-idline{display:inline-flex;align-items:center;gap:6px;margin:2px 0 0;padding:2px 0;border:0;background:none;color:var(--muted);font:inherit;font-size:.8rem;
    font-weight:700;font-variant-numeric:tabular-nums;cursor:pointer}
  .pf2-idline::after{content:"📋";font-size:.75rem;opacity:.7}`;
  document.head.appendChild(css);

  const idCache = new Map();
  const fmtId = (n) => String(n || "");

  window.PeopleSearch = {
    // 🪪 put the ID under the name on a profile
    async fillId(root, userId) {
      const el = root.querySelector(".pf2-idline"); if (!el || !userId) return;
      let id = idCache.get(userId);
      if (id == null) {
        try { const { data, error } = await sb.rpc("public_id_of", { p_user: userId }); if (error) return; id = data; idCache.set(userId, id); } catch { return; }
      }
      if (!id || !el.isConnected) return;
      el.textContent = `${t("idLbl")}: ${fmtId(id)}`; el.hidden = false;
      el.onclick = async (e) => { e.stopPropagation(); try { await navigator.clipboard.writeText(fmtId(id)); toast(t("copied")); } catch { prompt(t("idLbl"), fmtId(id)); } };
    },
    open() {
      openSheet(`<h1>${esc(t("ps_title"))}</h1>
        <input class="ps-in" id="ps-in" type="search" maxlength="40" autocomplete="off" dir="auto" placeholder="${esc(t("ps_ph"))}">
        <div id="ps-list"><div class="empty">${esc(t("ps_hint"))}</div></div>`);
      const inp = document.getElementById("ps-in"), list = document.getElementById("ps-list");
      setTimeout(() => inp?.focus(), 60);
      let seq = 0, timer = 0;
      const run = async () => {
        const q = inp.value.trim(), my = ++seq;
        if (!q) { list.innerHTML = `<div class="empty">${esc(t("ps_hint"))}</div>`; return; }
        const { data, error } = await sb.rpc("search_people", { p_q: q });
        if (my !== seq || !list.isConnected) return;
        if (error) { list.innerHTML = `<div class="empty">${esc(t("loadFail"))}<br><small>${esc(error.message)}</small></div>`; return; }
        const rows = (data || []).filter((r) => !blocked.has(r.id));
        if (!rows.length) { list.innerHTML = `<div class="empty"><span class="big">🔍</span>${esc(t("ps_none"))}</div>`; return; }
        rows.forEach((r) => idCache.set(r.id, r.public_id));
        const need = rows.map((r) => r.id).filter((id) => !profileCache.has(id));
        if (need.length) {
          const r = await sb.from("profiles").select(PROFILE_COLS).in("id", need);
          (r.data || []).forEach((p) => profileCache.set(p.id, p));
          if (my !== seq || !list.isConnected) return;
        }
        const isNum = /^\d+$/.test(q);
        list.innerHTML = rows.map((r) => {
          const p = profileCache.get(r.id); if (!p) return "";
          const nm = String(p.name || "");
          const nameHtml = !isNum && nm.toLowerCase().startsWith(q.toLowerCase()) ? `<mark>${esc(nm.slice(0, q.length))}</mark>${esc(nm.slice(q.length))}` : esc(nm);
          const idTxt = fmtId(r.public_id);
          const idHtml = isNum && idTxt.startsWith(q) ? `<mark>${esc(q)}</mark>${esc(idTxt.slice(q.length))}` : esc(idTxt);
          return `<div class="ps-row" data-ps="${esc(r.id)}">${avHtml(p.name, p.avatar_url, "sm")}
            <div class="info"><div class="name" dir="auto">${nameHtml} ${flag(p.country)} ${lvHtml(p)}</div><div class="id">${esc(t("idLbl"))}: ${idHtml}</div></div></div>`;
        }).join("");
      };
      inp.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(run, 220); });
      list.addEventListener("click", (e) => {
        const row = e.target.closest("[data-ps]"); if (!row) return;
        closeSheet(); openProfile(row.dataset.ps);
      });
    },
  };
})();
