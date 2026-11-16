/* =====================================================================
   📸 Stories (same as the approved demo)
   - a row at the top of 💬 Chats: my story (＋) and my friends' stories, new ones first
   - a ring around a person's photo in the chat list and on their profile → tap to watch
     (people who are not friends can watch from the profile too)
   - full-screen viewer: 5 s each, tap left/right, hold to pause, reply / ❤️ 🔥
     → a reply goes to the owner's chat with the story picture (only the owner sees it)
   - my own story: who watched it 👁, delete 🗑
   - make a story: text on a colour, or a photo from the phone; gone after 24 hours
   Uses globals from app.js: sb, me, profile, $, esc, t, avHtml, flag, toast, profileCache, loadProfiles,
   getProfile, mutualFriends, shortTime, shrinkPhoto, safeAvatar, openSheet, closeSheet, openDm, openProfilePage, blocked
   ===================================================================== */
(() => {
  const W = {
    en: { st_mine: "My story", st_add: "Add to story", st_ph: "Write something…", st_photo: "📷 Photo from phone", st_post: "📸 Share",
      st_posted: "✓ Your story is shared. It stays for 24 hours.", st_reply: "Reply to {name}…", st_sent: "✓ Sent to {name}'s chat",
      st_seenBy: "👁 {n} watched", st_viewers: "Who watched", st_noViewers: "No one has watched yet.", st_del: "🗑️ Delete story",
      st_deleted: "Story deleted", st_paused: "❚❚ Paused", st_gone: "This story has ended", st_replyTo: "📸 Replied to your story",
      st_myReply: "📸 You replied to their story", st_chatSnip: "📸 Story reply", st_fail: "Couldn't share: ", st_too: "You can have up to 20 stories at a time." },
    ckb: { st_mine: "ستۆریی من", st_add: "زیادکردن بۆ ستۆری", st_ph: "شتێک بنووسە…", st_photo: "📷 وێنە لە مۆبایل", st_post: "📸 بڵاوکردنەوە",
      st_posted: "✓ ستۆرییەکەت بڵاوکرایەوە. بۆ ٢٤ کاتژمێر دەمێنێتەوە.", st_reply: "وەڵامێک بنووسە بۆ {name}…", st_sent: "✓ لە چاتی {name} نێردرا",
      st_seenBy: "👁 {n} کەس بینیویانە", st_viewers: "کێ بینیویەتی", st_noViewers: "هێشتا کەس نەیبینیوە.", st_del: "🗑️ سڕینەوەی ستۆری",
      st_deleted: "ستۆرییەکە سڕایەوە", st_paused: "❚❚ وەستاوە", st_gone: "ئەم ستۆرییە تەواو بووە", st_replyTo: "📸 وەڵامی ستۆرییەکەتی دایەوە",
      st_myReply: "📸 وەڵامی ستۆرییەکەیت دایەوە", st_chatSnip: "📸 وەڵامی ستۆری", st_fail: "نەتوانرا بڵاو بکرێتەوە: ", st_too: "زۆرترین ٢٠ ستۆری لە یەک کاتدا." },
    ar: { st_mine: "قصتي", st_add: "أضف إلى القصة", st_ph: "اكتب شيئاً…", st_photo: "📷 صورة من الهاتف", st_post: "📸 نشر",
      st_posted: "✓ تم نشر قصتك. تبقى 24 ساعة.", st_reply: "رد على {name}…", st_sent: "✓ أُرسل إلى محادثة {name}",
      st_seenBy: "👁 شاهدها {n}", st_viewers: "من شاهدها", st_noViewers: "لم يشاهدها أحد بعد.", st_del: "🗑️ حذف القصة",
      st_deleted: "تم حذف القصة", st_paused: "❚❚ متوقف", st_gone: "انتهت هذه القصة", st_replyTo: "📸 رد على قصتك",
      st_myReply: "📸 رددت على قصته", st_chatSnip: "📸 رد على قصة", st_fail: "تعذر النشر: ", st_too: "يمكنك نشر 20 قصة كحد أقصى." },
  };
  try { for (const [l, o] of Object.entries(W)) if (I18N[l]) Object.assign(I18N[l], o); } catch {}

  const BGS = ["linear-gradient(160deg,#0fa88f,#0c1a17)", "linear-gradient(160deg,#ffb23f,#ff5f6d)", "linear-gradient(160deg,#4f8cff,#1b2f66)",
    "linear-gradient(160deg,#ff5fa2,#7a1f5c)", "linear-gradient(160deg,#7a5cff,#21124d)", "linear-gradient(160deg,#13261f,#2fd1b3)"];
  const bgOf = (n) => BGS[Math.abs(Number(n) || 0) % BGS.length];
  const STORY_RE = /^\[story:(\d{1,12})\]\s?([\s\S]*)$/;

  // state
  let byUser = new Map();          // user_id → [stories, oldest first]
  const seen = new Set();          // story ids I watched
  const storyCache = new Map();    // id → story (also old ones, for chat cards)
  let loadedAt = 0, loading = null;

  async function load(force) {
    if (!sb || !me) return byUser;
    if (!force && Date.now() - loadedAt < 60000) return byUser;
    if (loading) return loading;
    loading = (async () => {
      const { data, error } = await sb.from("stories").select("id,user_id,image_url,body,bg,created_at,expires_at")
        .gt("expires_at", new Date().toISOString()).order("created_at", { ascending: true }).limit(600);
      if (error) { console.warn("stories", error.message); return byUser; }
      const m = new Map();
      for (const s of data || []) {
        if (blocked?.has?.(s.user_id)) continue;
        storyCache.set(s.id, s);
        if (!m.has(s.user_id)) m.set(s.user_id, []);
        m.get(s.user_id).push(s);
      }
      byUser = m;
      const ids = (data || []).map((s) => s.id);
      if (ids.length) {
        const v = await sb.from("story_views").select("story_id").eq("viewer", me.id).in("story_id", ids.slice(-300));
        (v.data || []).forEach((x) => seen.add(x.story_id));
      }
      loadedAt = Date.now();
      return byUser;
    })();
    try { return await loading; } finally { loading = null; }
  }
  const has = (uid) => (byUser.get(uid) || []).length > 0;
  const allSeen = (uid) => (byUser.get(uid) || []).every((s) => seen.has(s.id));
  const ringCls = (uid) => (has(uid) ? (allSeen(uid) ? "st-ring seen" : "st-ring new") : "");

  /* ---------- 💬 the row at the top of Chats ---------- */
  async function fillRow(box) {
    if (!box) return;
    await load();
    const friends = mutualFriends();
    await loadProfiles(friends);
    const withStory = friends.filter(has).sort((a, b) => allSeen(a) - allSeen(b));
    const without = friends.filter((id) => !has(id));
    const mineHas = has(me.id);
    const av = (p, cls) => `<span class="st-av ${cls}">${avHtml(p?.name || "?", p?.avatar_url, "md")}</span>`;
    box.classList.add("st-row");
    box.innerHTML = `<button type="button" class="st-c" data-st-mine="1">
        ${av(profile, mineHas ? ringCls(me.id) : "st-add")}${!mineHas ? '<span class="st-plus">＋</span>' : ""}<span class="fn">${esc(t("st_mine"))}</span></button>` +
      withStory.map((id) => { const p = profileCache.get(id) || {}; return `<button type="button" class="st-c" data-st-user="${esc(id)}">${av(p, ringCls(id))}<span class="fn" dir="auto">${esc(p.name || t("guest"))}</span></button>`; }).join("") +
      without.map((id) => { const p = profileCache.get(id) || {}; return `<button type="button" class="st-c" data-dm="${esc(id)}">${av(p, "")}<span class="fn" dir="auto">${esc(p.name || t("guest"))}</span></button>`; }).join("");
    box.querySelector("[data-st-mine]").addEventListener("click", () => (has(me.id) ? openViewer([me.id], 0) : openMaker()));
    box.querySelector("[data-st-mine]").addEventListener("contextmenu", (e) => { e.preventDefault(); openMaker(); });
    box.querySelectorAll("[data-st-user]").forEach((b) => b.addEventListener("click", () => openViewer(withStory, withStory.indexOf(b.dataset.stUser))));
    box.querySelectorAll("[data-dm]").forEach((b) => b.addEventListener("click", () => openDm(b.dataset.dm)));
  }

  /* ---------- rings on photos in the chat list ---------- */
  async function ringList(box) {
    if (!box) return;
    await load();
    box.querySelectorAll("[data-dm]").forEach((row) => {
      const uid = row.dataset.dm; if (!has(uid)) return;
      const a = row.querySelector(".av"); if (!a || a.parentElement.classList.contains("st-av")) return;
      const w = document.createElement("span"); w.className = "st-av sm " + ringCls(uid);
      a.replaceWith(w); w.appendChild(a);
      w.addEventListener("click", (e) => { e.stopPropagation(); openViewer([uid], 0); });
    });
  }

  /* ---------- ring on someone's profile photo (friends or not) ---------- */
  async function decorateProfile(root, p, isMe) {
    if (!root || !p?.id) return;
    await load();
    const btn = root.querySelector(".pf2-av"); if (!btn) return;
    btn.classList.remove("st-new", "st-seen");
    if (!has(p.id)) return;
    btn.classList.add(allSeen(p.id) ? "st-seen" : "st-new");
    if (isMe) return;   // my own photo button changes the picture; my story is in Chats
    btn.addEventListener("click", (e) => { if (e.target.closest(".pf2-lv")) return; openViewer([p.id], 0); });
  }

  /* ---------- the full-screen viewer ---------- */
  let V = null;
  function closeViewer() {
    if (!V) return;
    cancelAnimationFrame(V.raf); V.el.remove(); V = null;
    document.querySelectorAll(".st-row").forEach((b) => fillRow(b));
    const il = document.getElementById("inbox-list"); if (il) ringList(il);
  }
  async function openViewer(users, ui, si) {
    users = users.filter(has); if (!users.length) return;
    ui = Math.max(0, Math.min(users.length - 1, ui || 0));
    await loadProfiles(users);
    if (!V) {
      const el = document.createElement("div"); el.id = "st-view";
      document.body.appendChild(el);
      V = { el, raf: 0 };
      history.pushState({ st: 1 }, "");
    }
    V.users = users; V.ui = ui;
    const list = byUser.get(users[ui]);
    V.si = si != null ? si : Math.max(0, list.findIndex((s) => !seen.has(s.id)));
    show();
  }
  function show() {
    const uid = V.users[V.ui], list = byUser.get(uid) || [], s = list[V.si];
    if (!s) return closeViewer();
    const p = profileCache.get(uid) || { name: t("guest") };
    const mine = uid === me.id;
    const img = safeAvatar(s.image_url);
    V.el.innerHTML = `<div class="sv-bars">${list.map((_, k) => `<i><b style="width:${k < V.si ? 100 : 0}%"></b></i>`).join("")}</div>
      <div class="sv-head"><button type="button" class="sv-who" data-sv-prof="1">${avHtml(p.name, p.avatar_url, "sm")}<span><b dir="auto">${esc(mine ? t("st_mine") : p.name)} ${flag(p.country)}</b><small>${esc(shortTime(s.created_at))}</small></span></button>
        ${mine ? `<button type="button" class="sv-ic" data-sv-add="1" aria-label="add">＋</button>` : ""}
        <button type="button" class="sv-ic" data-sv-x="1" aria-label="close">✕</button></div>
      <div class="sv-media" style="background:${img ? "#000" : bgOf(s.bg)}">
        ${img ? `<div class="sv-blur" style="background-image:url('${esc(img)}')"></div><img src="${esc(img)}" alt="">` : ""}
        ${s.body ? `<div class="sv-txt${img ? " on-img" : ""}" dir="auto">${esc(s.body)}</div>` : ""}</div>
      <button type="button" class="sv-tap sv-l" aria-label="next"></button><button type="button" class="sv-tap sv-r" aria-label="back"></button>
      <div class="sv-foot">${mine
        ? `<button type="button" class="sv-viewers" data-sv-views="1">👁 …</button><button type="button" class="sv-ic" data-sv-del="1" aria-label="delete">🗑️</button>`
        : `<form class="sv-form"><input id="sv-in" maxlength="300" dir="auto" autocomplete="off" placeholder="${esc(t("st_reply", { name: p.name }))}"></form>
           <button type="button" class="sv-react" data-r="❤️">❤️</button><button type="button" class="sv-react" data-r="🔥">🔥</button>`}</div>`;
    // mark as watched
    if (!mine && !seen.has(s.id)) { seen.add(s.id); sb.from("story_views").insert({ story_id: s.id }).then(() => {}); }
    if (mine) sb.from("story_views").select("viewer", { count: "exact", head: true }).eq("story_id", s.id)
      .then(({ count }) => { const b = V?.el.querySelector("[data-sv-views]"); if (b) b.textContent = t("st_seenBy", { n: count || 0 }); });

    // progress: 5 s for each
    const bar = V.el.querySelectorAll(".sv-bars i b")[V.si];
    V.dur = 5000; V.start = performance.now(); V.paused = false; V.done = 0;
    const tick = () => {
      if (!V) return;
      if (!V.paused) {
        const pct = Math.min(1, (performance.now() - V.start) / V.dur);
        if (bar) bar.style.width = pct * 100 + "%";
        if (pct >= 1) return next();
      }
      V.raf = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(V.raf); V.raf = requestAnimationFrame(tick);

    const rtl = (document.documentElement.dir || "ltr") === "rtl";
    const L = V.el.querySelector(".sv-l"), R = V.el.querySelector(".sv-r");
    for (const [el, fwd] of [[L, rtl], [R, !rtl]]) {
      let hold = 0, held = false;
      el.addEventListener("pointerdown", () => { held = false; hold = setTimeout(() => { held = true; pause(true); }, 260); });
      el.addEventListener("pointerup", () => { clearTimeout(hold); if (held) pause(false); });
      el.addEventListener("pointerleave", () => { clearTimeout(hold); if (held) { held = false; pause(false); } });
      el.addEventListener("click", () => { if (held) { held = false; return; } fwd ? next() : prev(); });
    }
    V.el.querySelector("[data-sv-x]").addEventListener("click", () => history.back());
    V.el.querySelector("[data-sv-prof]").addEventListener("click", () => { const id = uid; history.back(); setTimeout(() => openProfilePage(id), 60); });
    V.el.querySelector("[data-sv-add]")?.addEventListener("click", () => { history.back(); setTimeout(openMaker, 60); });
    V.el.querySelector("[data-sv-views]")?.addEventListener("click", () => openViewers(s));
    V.el.querySelector("[data-sv-del]")?.addEventListener("click", () => delStory(s));
    const inp = V.el.querySelector("#sv-in");
    if (inp) {
      inp.addEventListener("focus", () => pause(true));
      inp.addEventListener("blur", () => pause(false));
      V.el.querySelector(".sv-form").addEventListener("submit", (e) => { e.preventDefault(); const v = inp.value.trim(); if (!v) return; inp.value = ""; inp.blur(); reply(s, p, v); });
    }
    V.el.querySelectorAll("[data-r]").forEach((b) => b.addEventListener("click", () => {
      const f = document.createElement("span"); f.className = "sv-fly"; f.textContent = b.dataset.r;
      const r = b.getBoundingClientRect(); f.style.left = r.left + "px"; f.style.top = r.top - 10 + "px";
      document.body.appendChild(f); setTimeout(() => f.remove(), 1100);
      reply(s, p, b.dataset.r, true);
    }));
  }
  function pause(on) {
    if (!V || V.paused === on) return;
    if (on) { V.paused = true; V.done = performance.now() - V.start; const tg = document.createElement("div"); tg.className = "sv-paused"; tg.textContent = t("st_paused"); V.el.appendChild(tg); }
    else { V.paused = false; V.start = performance.now() - (V.done || 0); V.el.querySelector(".sv-paused")?.remove(); }
  }
  function next() {
    if (!V) return;
    const list = byUser.get(V.users[V.ui]) || [];
    if (V.si + 1 < list.length) { V.si++; return show(); }
    if (V.ui + 1 < V.users.length) { V.ui++; const l2 = byUser.get(V.users[V.ui]) || []; V.si = Math.max(0, l2.findIndex((x) => !seen.has(x.id))); return show(); }
    history.back();
  }
  function prev() {
    if (!V) return;
    if (V.si > 0) { V.si--; return show(); }
    if (V.ui > 0) { V.ui--; V.si = 0; return show(); }
    V.si = 0; show();
  }
  // the phone's back button closes the viewer
  addEventListener("popstate", () => { if (V) closeViewer(); });

  async function reply(s, p, text, quiet) {
    const { error } = await sb.rpc("story_reply", { p_story: s.id, p_text: text });
    if (error) {
      const m = error.message || "";
      return toast(/story_gone/.test(m) ? t("st_gone") : /blocked/.test(m) ? t("mutualOnly") : /slow_down/.test(m) ? t("error") + "⏳" : t("error") + m);
    }
    if (!quiet) toast(t("st_sent", { name: p.name || "" }));
    window.Push?.notify?.("dm", { target: s.user_id });
  }
  async function openViewers(s) {
    pause(true);
    const { data } = await sb.from("story_views").select("viewer,seen_at").eq("story_id", s.id).order("seen_at", { ascending: false }).limit(300);
    const ids = (data || []).map((x) => x.viewer);
    await loadProfiles(ids);
    openSheet(`<h1>${esc(t("st_viewers"))} · ${ids.length}</h1>
      ${ids.length ? `<div class="list">${(data || []).map((x) => { const q = profileCache.get(x.viewer) || { name: t("guest") };
        return `<div class="row-item" data-pp="${esc(x.viewer)}">${avHtml(q.name, q.avatar_url, "sm")}<div class="info"><div class="name" dir="auto">${esc(q.name)} ${flag(q.country)}</div>
          <div class="meta">${esc(shortTime(x.seen_at))}</div></div></div>`; }).join("")}</div>` : `<div class="empty">${esc(t("st_noViewers"))}</div>`}`);
    document.querySelectorAll("#sheet-body [data-pp]").forEach((r) => r.addEventListener("click", () => { closeSheet(); const id = r.dataset.pp; history.back(); setTimeout(() => openProfilePage(id), 60); }));
    const unpause = () => { pause(false); document.getElementById("sheet-backdrop")?.removeEventListener("click", unpause); };
    document.getElementById("sheet-backdrop")?.addEventListener("click", unpause);
  }
  async function delStory(s) {
    pause(true);
    const { error } = await sb.from("stories").delete().eq("id", s.id);
    if (error) { pause(false); return toast(t("error") + error.message); }
    const path = (s.image_url || "").split("/storage/v1/object/public/avatars/")[1];
    if (path) sb.storage.from("avatars").remove([path.split("?")[0]]);
    const l = byUser.get(me.id) || []; byUser.set(me.id, l.filter((x) => x.id !== s.id));
    if (!byUser.get(me.id).length) byUser.delete(me.id);
    toast(t("st_deleted"));
    if (!has(me.id)) return history.back();
    V.si = Math.min(V.si, byUser.get(me.id).length - 1); show();
  }

  /* ---------- make a story ---------- */
  function openMaker() {
    if (profile?.banned) return toast(t("e_banned"));
    let bg = Math.floor(Math.random() * BGS.length), file = null, url = "";
    const m = document.createElement("div"); m.id = "st-make";
    m.innerHTML = `<div class="mk-canvas"><img alt="" hidden><textarea id="mk-t" rows="3" maxlength="200" dir="auto" placeholder="${esc(t("st_ph"))}"></textarea></div>
      <div class="mk-bar"><button type="button" data-mk-x="1" aria-label="close">✕</button><b>${esc(t("st_add"))}</b><span></span></div>
      <div class="mk-tools"><div class="mk-bgs">${BGS.map((b, k) => `<button type="button" data-bg="${k}" style="background:${b}" aria-label="${k + 1}"></button>`).join("")}</div>
        <div class="mk-row"><label>${esc(t("st_photo"))}<input type="file" accept="image/*"></label>
          <button type="button" class="mk-share" disabled>${esc(t("st_post"))}</button></div></div>`;
    document.body.appendChild(m);
    const ta = m.querySelector("#mk-t"), im = m.querySelector("img"), share = m.querySelector(".mk-share");
    const paint = () => {
      m.querySelector(".mk-canvas").style.background = url ? "#000" : BGS[bg];
      im.hidden = !url; if (url) im.src = url;
      m.classList.toggle("has-img", !!url);
      m.querySelectorAll("[data-bg]").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.bg === bg && !url)));
      share.disabled = !url && !ta.value.trim();
    };
    m.querySelectorAll("[data-bg]").forEach((b) => b.addEventListener("click", () => { bg = +b.dataset.bg; if (url) URL.revokeObjectURL(url); url = ""; file = null; paint(); }));
    ta.addEventListener("input", paint);
    m.querySelector("input[type=file]").addEventListener("change", (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; file = f; if (url) URL.revokeObjectURL(url); url = URL.createObjectURL(f); paint(); });
    m.querySelector("[data-mk-x]").addEventListener("click", () => { if (url) URL.revokeObjectURL(url); m.remove(); });
    share.addEventListener("click", async () => {
      share.disabled = true;
      let path = null;
      try {
        let image_url = null;
        if (file) {
          const blob = await shrinkPhoto(file, 1080, false);
          const id = (crypto.randomUUID && crypto.randomUUID()) || String(Date.now());
          path = `${me.id}/story-${id}.jpg`;
          const up = await sb.storage.from("avatars").upload(path, blob, { contentType: "image/jpeg", cacheControl: "86400" });
          if (up.error) throw up.error;
          image_url = sb.storage.from("avatars").getPublicUrl(path).data.publicUrl;
        }
        const body = ta.value.trim().slice(0, 200) || null;
        const { data, error } = await sb.from("stories").insert({ image_url, body, bg }).select().single();
        if (error) throw error;
        storyCache.set(data.id, data);
        if (!byUser.has(me.id)) byUser.set(me.id, []);
        byUser.get(me.id).push(data);
        if (url) URL.revokeObjectURL(url);
        m.remove();
        toast(t("st_posted"));
        document.querySelectorAll(".st-row").forEach((b) => fillRow(b));
      } catch (err) {
        if (path) sb.storage.from("avatars").remove([path]);
        share.disabled = false;
        const msg = err?.message || String(err);
        toast(/row-level|policy/i.test(msg) ? t("st_too") : t("st_fail") + msg);
      }
    });
    paint();
    setTimeout(() => ta.focus(), 60);
  }

  /* ---------- 💬 a story reply inside a chat ---------- */
  async function getStory(id) {
    if (storyCache.has(id)) return storyCache.get(id);
    const { data } = await sb.from("stories").select("id,user_id,image_url,body,bg,created_at,expires_at").eq("id", id).maybeSingle();
    if (data) storyCache.set(id, data);
    return data || null;
  }
  const parseReply = (body) => { const m = STORY_RE.exec(body || ""); return m ? { id: Number(m[1]), text: m[2] || "" } : null; };
  function chatCard(div, m, mine, tm) {
    const r = parseReply(m.body); if (!r) return false;
    div.innerHTML = `<div class="b st-msg"><div class="st-lbl">${esc(mine ? t("st_myReply") : t("st_replyTo"))}</div>
      <button type="button" class="st-thumb"><span class="st-th-in">📸</span></button>
      <div dir="auto" class="st-rtext">${esc(r.text)}</div>${tm}</div>`;
    getStory(r.id).then((s) => {
      const th = div.querySelector(".st-thumb"); if (!th) return;
      if (!s) { th.innerHTML = `<span class="st-th-in gone">${esc(t("st_gone"))}</span>`; return; }
      const img = safeAvatar(s.image_url);
      th.style.background = img ? `#000 center/cover url('${esc(img)}')` : bgOf(s.bg);
      th.innerHTML = img ? "" : `<span class="st-th-in" dir="auto">${esc((s.body || "").slice(0, 60))}</span>`;
      th.addEventListener("click", async () => {
        if (new Date(s.expires_at).getTime() <= Date.now() && s.user_id !== me.id) return toast(t("st_gone"));
        await load(true);
        if (has(s.user_id)) { const l = byUser.get(s.user_id); const i = l.findIndex((x) => x.id === s.id); openViewer([s.user_id], 0, i >= 0 ? i : 0); }
        else toast(t("st_gone"));
      });
    });
    return true;
  }
  const snippet = (body) => { const r = parseReply(body); return r ? `${t("st_chatSnip")}: ${r.text}` : null; };

  /* ---------- styles ---------- */
  const css = document.createElement("style");
  css.textContent = `
.st-row{display:flex;gap:12px;overflow-x:auto;padding:4px 2px 10px;scrollbar-width:none}
.st-row::-webkit-scrollbar{display:none}
.st-row .st-c{border:0;background:none;padding:0;display:flex;flex-direction:column;align-items:center;gap:5px;flex:0 0 auto;width:66px;position:relative;cursor:pointer;color:inherit}
.st-row .fn{font-size:11.5px;font-weight:700;max-width:66px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.st-av{display:inline-grid;place-items:center;border-radius:50%;padding:3px;flex:0 0 auto}
.st-av .av{border:2.5px solid var(--bg);box-shadow:none!important}
.st-av.st-ring.new{background:conic-gradient(from 210deg,#ffb23f,#ff8a3d,#ff5fa2,#2fd1b3,#ffb23f)}
.st-av.st-ring.seen{background:#9aa9a4}
.st-av.st-add .av{border:2px dashed var(--line)}
.st-av.sm{padding:2px;cursor:pointer}
.st-plus{position:absolute;top:44px;inset-inline-end:4px;width:22px;height:22px;border-radius:50%;background:var(--brand);color:#fff;font-size:14px;font-weight:900;display:grid;place-items:center;border:2.5px solid var(--bg)}
.pf2-av.st-new::before{background:conic-gradient(from 210deg,#ffb23f,#ff8a3d,#ff5fa2,#2fd1b3,#ffb23f)!important}
.pf2-av.st-seen::before{background:#9aa9a4!important;box-shadow:none!important}
#st-view{position:fixed;inset:0;z-index:95;background:#000;color:#fff;animation:stz .2s ease-out;user-select:none}
@keyframes stz{from{transform:scale(.94);opacity:0}}
.sv-bars{position:absolute;top:calc(10px + env(safe-area-inset-top));inset-inline:10px;display:flex;gap:4px;z-index:3;direction:ltr}
.sv-bars i{flex:1;height:3px;border-radius:3px;background:rgba(255,255,255,.3);overflow:hidden}
.sv-bars i b{display:block;height:100%;width:0;background:#fff}
.sv-head{position:absolute;top:calc(22px + env(safe-area-inset-top));inset-inline:10px;display:flex;align-items:center;gap:8px;z-index:4}
.sv-who{flex:1;min-width:0;display:flex;align-items:center;gap:10px;border:0;background:none;color:#fff;text-align:start;cursor:pointer;padding:0}
.sv-who span{min-width:0}.sv-who b{display:block;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sv-who small{font-size:11.5px;opacity:.75}
.sv-ic{border:0;background:rgba(255,255,255,.14);color:#fff;width:38px;height:38px;border-radius:50%;font-size:16px;cursor:pointer;flex:0 0 auto}
.sv-media{position:absolute;inset:0;display:grid;place-items:center;overflow:hidden}
.sv-blur{position:absolute;inset:-30px;background-size:cover;background-position:center;filter:blur(26px) brightness(.5)}
.sv-media img{position:relative;max-width:100%;max-height:100%;object-fit:contain}
.sv-txt{position:relative;padding:28px;max-width:640px;font-size:clamp(1.4rem,6.5vw,2.2rem);font-weight:900;line-height:1.5;text-align:center;white-space:pre-wrap;word-break:break-word;text-shadow:0 2px 10px rgba(0,0,0,.35)}
.sv-txt.on-img{position:absolute;bottom:18%;inset-inline:0;margin:auto;font-size:clamp(1.1rem,5vw,1.6rem);background:rgba(0,0,0,.45);border-radius:16px;padding:10px 16px;width:max-content;max-width:88%}
.sv-tap{position:absolute;top:80px;bottom:90px;width:38%;z-index:2;border:0;background:none;cursor:pointer;-webkit-tap-highlight-color:transparent}
.sv-l{left:0}.sv-r{right:0}
.sv-foot{position:absolute;bottom:calc(14px + env(safe-area-inset-bottom));inset-inline:12px;display:flex;gap:8px;align-items:center;z-index:4}
.sv-form{flex:1;min-width:0}
.sv-form input{width:100%;height:46px;border-radius:999px;border:1.5px solid rgba(255,255,255,.55);background:rgba(0,0,0,.3);color:#fff;padding:0 16px;font:inherit;font-size:15px}
.sv-form input::placeholder{color:rgba(255,255,255,.7)}
.sv-react{border:0;background:none;font-size:27px;width:44px;height:44px;cursor:pointer;transition:transform .15s}
.sv-react:active{transform:scale(1.3)}
.sv-viewers{flex:1;border:0;background:rgba(255,255,255,.14);color:#fff;border-radius:999px;height:46px;font:inherit;font-weight:800;cursor:pointer}
.sv-paused{position:absolute;top:calc(70px + env(safe-area-inset-top));left:50%;transform:translateX(-50%);z-index:4;background:rgba(0,0,0,.5);border-radius:999px;padding:3px 12px;font-size:12px;font-weight:700}
.sv-fly{position:fixed;z-index:99;font-size:34px;pointer-events:none;animation:svfly 1.1s ease-out forwards}
@keyframes svfly{to{transform:translateY(-240px) scale(1.6);opacity:0}}
#st-make{position:fixed;inset:0;z-index:96;color:#fff;display:flex;flex-direction:column;animation:stz .2s ease-out}
#st-make .mk-canvas{flex:1;position:relative;display:grid;place-items:center;overflow:hidden}
#st-make img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#000}
#st-make textarea{position:relative;width:86%;max-width:600px;background:none;border:0;resize:none;text-align:center;font:inherit;font-size:clamp(1.4rem,6.5vw,2.2rem);font-weight:900;line-height:1.5;outline:none;color:#fff;text-shadow:0 2px 10px rgba(0,0,0,.3)}
#st-make.has-img textarea{position:absolute;bottom:22%;font-size:clamp(1.1rem,5vw,1.6rem);background:rgba(0,0,0,.45);border-radius:16px;padding:8px 14px}
#st-make textarea::placeholder{color:rgba(255,255,255,.65)}
#st-make .mk-bar{position:absolute;top:calc(12px + env(safe-area-inset-top));inset-inline:12px;display:flex;justify-content:space-between;align-items:center;z-index:2}
#st-make .mk-bar button{border:0;background:rgba(0,0,0,.35);color:#fff;width:40px;height:40px;border-radius:50%;font-size:17px;cursor:pointer}
#st-make .mk-bar span{width:40px}
#st-make .mk-tools{position:absolute;bottom:calc(14px + env(safe-area-inset-bottom));inset-inline:12px;display:flex;flex-direction:column;gap:12px;z-index:2;max-width:560px;margin:0 auto}
#st-make .mk-bgs{display:flex;gap:10px;justify-content:center}
#st-make .mk-bgs button{width:32px;height:32px;border-radius:50%;border:2.5px solid rgba(255,255,255,.45);cursor:pointer}
#st-make .mk-bgs button[aria-pressed="true"]{border-color:#fff;transform:scale(1.15)}
#st-make .mk-row{display:flex;gap:8px}
#st-make .mk-row label,#st-make .mk-row button{flex:1;border:0;border-radius:16px;height:50px;font:inherit;font-weight:900;display:flex;align-items:center;justify-content:center;gap:6px;position:relative;overflow:hidden;cursor:pointer}
#st-make .mk-row label{background:rgba(0,0,0,.45);color:#fff}
#st-make .mk-row label input{position:absolute;inset:0;opacity:0;cursor:pointer}
#st-make .mk-share{background:#2fd1b3;color:#04201a}
#st-make .mk-share:disabled{opacity:.5;cursor:default}
.st-msg{max-width:240px}
.st-lbl{font-size:11.5px;font-weight:800;opacity:.75;margin-bottom:6px}
.st-thumb{display:grid;place-items:center;width:120px;aspect-ratio:9/16;border-radius:14px;border:0;padding:8px;color:#fff;background:#0c1a17;cursor:pointer;overflow:hidden;font:inherit}
.st-th-in{font-size:12px;font-weight:800;text-align:center;line-height:1.4;word-break:break-word}
.st-th-in.gone{opacity:.7;font-weight:700}
.st-rtext{margin-top:6px;font-size:1rem;white-space:pre-wrap;word-break:break-word}
@media (prefers-reduced-motion:reduce){#st-view,#st-make{animation:none}}`;
  document.head.appendChild(css);

  window.Stories = { load, fillRow, ringList, decorateProfile, openViewer, openMaker, chatCard, snippet, has };
})();
