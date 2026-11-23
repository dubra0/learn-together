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
  // 💎 the shop of nice IDs (update-40)
  const N = {
    en: { ps_niceTitle: "Nice IDs", ps_niceSub: "Buy a special ID with coins. It replaces your ID (your old ID is gone).", ps_buy: "Buy", ps_sold: "Sold", ps_mine: "Yours ✅",
      ps_buyQ: "Buy the ID {id} for {p} coins? Your ID becomes {id}.", ps_bought: "🎉 Your ID is now {id}!", ps_noCoins: "🪙 You don't have enough coins", ps_myId: "Your ID: {id}" },
    ckb: { ps_niceTitle: "ID ـی جوان", ps_niceSub: "ID ـێکی تایبەت بە کۆین بکڕە. دەبێتە ID ـی تۆ و ID ـە کۆنەکەت نامێنێت.", ps_buy: "کڕین", ps_sold: "فرۆشراوە", ps_mine: "هی تۆیە ✅",
      ps_buyQ: "ID ـی {id} بە {p} کۆین دەکڕیت؟ ID ـەکەت دەبێتە {id}.", ps_bought: "🎉 ئێستا ID ـەکەت {id} ـە!", ps_noCoins: "🪙 کۆینی پێویستت نییە", ps_myId: "ID ـەکەت: {id}" },
    ar: { ps_niceTitle: "معرّفات مميزة", ps_niceSub: "اشترِ معرّفاً مميزاً بالعملات. يصبح معرّفك (ويختفي القديم).", ps_buy: "شراء", ps_sold: "مُباع", ps_mine: "لك ✅",
      ps_buyQ: "شراء المعرّف {id} بـ {p} عملة؟ سيصبح معرّفك {id}.", ps_bought: "🎉 معرّفك الآن {id}!", ps_noCoins: "🪙 عملاتك لا تكفي", ps_myId: "معرّفك: {id}" },
  };
  try { for (const [l, o] of Object.entries(N)) if (W[l]) Object.assign(W[l], o); else W[l] = o; } catch {}
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
  .pf2-idline::after{content:"📋";font-size:.75rem;opacity:.7}
  /* 💎 nice IDs: a moving, shining background (gold = 1111, purple = 1212, blue-green = 1122) */
  .nid{display:inline-flex;align-items:center;gap:4px;padding:2px 11px;border-radius:999px;color:#fff;font-weight:900;letter-spacing:1.5px;font-variant-numeric:tabular-nums;
    position:relative;overflow:hidden;background-size:220% 100%;animation:nidshift 4s linear infinite;text-shadow:0 1px 2px rgba(0,0,0,.35);vertical-align:middle;isolation:isolate}
  .nid::after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 35%,rgba(255,255,255,.55) 50%,transparent 65%);transform:translateX(-100%);animation:nidshine 2.6s ease-in-out infinite;z-index:-1}
  .nid.t1{background-image:linear-gradient(90deg,#b45309,#f59e0b,#fde047,#f59e0b,#ef4444,#b45309);box-shadow:0 0 14px rgba(245,158,11,.65),inset 0 0 0 1px rgba(255,255,255,.35)}
  .nid.t2{background-image:linear-gradient(90deg,#6d28d9,#ec4899,#8b5cf6,#3b82f6,#6d28d9);box-shadow:0 0 12px rgba(139,92,246,.55),inset 0 0 0 1px rgba(255,255,255,.3)}
  .nid.t3{background-image:linear-gradient(90deg,#0e7490,#06b6d4,#10b981,#3b82f6,#0e7490);box-shadow:0 0 10px rgba(6,182,212,.5),inset 0 0 0 1px rgba(255,255,255,.3)}
  @keyframes nidshift{to{background-position:220% 0}}
  @keyframes nidshine{0%,60%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
  @media (prefers-reduced-motion:reduce){.nid,.nid::after{animation:none}}
  .pf2-idline.nice{padding:0}.pf2-idline.nice::after{content:none}
  .ni-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:12px}
  .ni{display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px 6px 12px;border-radius:18px;border:0;cursor:pointer;font:inherit;color:#fff;position:relative;overflow:hidden;
    background-size:220% 100%;animation:nidshift 5s linear infinite;isolation:isolate}
  .ni::after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 35%,rgba(255,255,255,.35) 50%,transparent 65%);transform:translateX(-100%);animation:nidshine 3s ease-in-out infinite;z-index:-1}
  .ni.t1{background-image:linear-gradient(120deg,#7c2d12,#d97706,#facc15,#d97706,#7c2d12);box-shadow:0 8px 22px rgba(217,119,6,.45)}
  .ni.t2{background-image:linear-gradient(120deg,#3b0764,#7c3aed,#db2777,#7c3aed,#3b0764);box-shadow:0 8px 22px rgba(124,58,237,.4)}
  .ni.t3{background-image:linear-gradient(120deg,#083344,#0891b2,#059669,#0891b2,#083344);box-shadow:0 8px 22px rgba(8,145,178,.35)}
  .ni b{font-size:1.7rem;font-weight:900;letter-spacing:4px;font-variant-numeric:tabular-nums;text-shadow:0 2px 10px rgba(0,0,0,.4)}
  .ni .tag{position:absolute;top:6px;inset-inline-start:8px;font-size:.7rem}
  .ni span.p{font-size:.78rem;font-weight:900;background:rgba(0,0,0,.28);border-radius:999px;padding:3px 10px}
  .ni.sold{filter:grayscale(.85);opacity:.5;cursor:default}.ni.mine{outline:3px solid #fff;outline-offset:-3px}
  @media (prefers-reduced-motion:reduce){.ni,.ni::after{animation:none}}`;
  document.head.appendChild(css);

  const idCache = new Map();
  const fmtId = (n) => String(n || "");
  // 💎 which kind of nice ID (normal IDs have 10 digits)
  const niceTier = (id) => {
    const s = String(id || ""); if (!s || s.length >= 10) return "";
    if (/^(\d)\1{3}$/.test(s)) return "t1";          // 8888
    if (/^(\d)(\d)\1\2$/.test(s)) return "t2";       // 1212
    return "t3";                                     // 1122 and the rest
  };
  const idBadge = (id) => { const k = niceTier(id); return k ? `<span class="nid ${k}">💎 ${esc(fmtId(id))}</span>` : esc(fmtId(id)); };

  async function openNiceIds() {
    openSheet(`<h1>💎 ${esc(t("ps_niceTitle"))}</h1><div class="muted small">${esc(t("ps_niceSub"))}</div><div class="muted small" id="ni-me" style="margin-top:6px"></div><div id="ni-list"><div class="empty">…</div></div>`);
    const [list, mine] = await Promise.all([sb.rpc("list_nice_ids"), sb.rpc("public_id_of", { p_user: me.id })]);
    const box = document.getElementById("ni-list"); if (!box) return;
    if (mine.data && document.getElementById("ni-me")) document.getElementById("ni-me").textContent = t("ps_myId", { id: String(mine.data) });
    if (list.error) { box.innerHTML = `<div class="empty">${esc(t("loadFail"))}<br><small>${esc(list.error.message)}</small></div>`; return; }
    const rows = list.data || [];
    box.innerHTML = `<div class="ni-grid">${rows.map((r) => `<button type="button" class="ni ${niceTier(r.id) || "t3"} ${r.mine ? "mine" : r.sold ? "sold" : ""}" data-ni="${r.id}" data-np="${r.price}" ${r.sold && !r.mine ? "disabled" : ""}>
      <span class="tag">💎</span><b>${esc(String(r.id))}</b><span class="p">${r.mine ? esc(t("ps_mine")) : r.sold ? esc(t("ps_sold")) : `🪙 ${Number(r.price).toLocaleString("en-US")}`}</span></button>`).join("")}</div>`;
    box.addEventListener("click", async (e) => {
      const b = e.target.closest("[data-ni]"); if (!b || b.classList.contains("sold") || b.classList.contains("mine")) return;
      const id = b.dataset.ni, p = Number(b.dataset.np).toLocaleString("en-US");
      if (!confirm(t("ps_buyQ", { id, p }))) return;
      b.disabled = true;
      const { data, error } = await sb.rpc("buy_nice_id", { p_id: Number(id) });
      if (error) { b.disabled = false; return toast(t("error") + error.message); }
      const r = (Array.isArray(data) ? data[0] : data) || {};
      if (r.o_status === "ok") {
        idCache.set(me.id, Number(id));
        toast(t("ps_bought", { id }));
        if (typeof loadWallet === "function") loadWallet().catch(() => {});
        closeSheet(); openNiceIds();
      } else { b.disabled = false; toast(r.o_status === "no_coins" ? t("ps_noCoins") : t("ps_sold")); if (r.o_status === "sold") { closeSheet(); openNiceIds(); } }
    });
  }

  window.PeopleSearch = {
    openNiceIds, niceTier, idBadge,
    // 🪪 put the ID under the name on a profile
    async fillId(root, userId) {
      const el = root.querySelector(".pf2-idline"); if (!el || !userId) return;
      let id = idCache.get(userId);
      if (id == null) {
        try { const { data, error } = await sb.rpc("public_id_of", { p_user: userId }); if (error) return; id = data; idCache.set(userId, id); } catch { return; }
      }
      if (!id || !el.isConnected) return;
      if (niceTier(id)) { el.classList.add("nice"); el.innerHTML = idBadge(id); } // 💎 a bought nice ID shines
      else { el.classList.remove("nice"); el.textContent = `${t("idLbl")}: ${fmtId(id)}`; }
      el.hidden = false;
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
          const idHtml = niceTier(r.public_id) ? idBadge(r.public_id) : isNum && idTxt.startsWith(q) ? `<mark>${esc(q)}</mark>${esc(idTxt.slice(q.length))}` : esc(idTxt);
          return `<div class="ps-row" data-ps="${esc(r.id)}">${avHtml(p.name, p.avatar_url, "sm")}
            <div class="info"><div class="name" dir="auto">${nameHtml} ${flag(p.country)} ${lvHtml(p)}</div><div class="id">${niceTier(r.public_id) ? "" : esc(t("idLbl")) + ": "}${idHtml}</div></div></div>`;
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
