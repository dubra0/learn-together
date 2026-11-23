/* 📱 Post extras (needs supabase/update-35-feed-plus.sql)
   🔖 save posts (⚙️ Settings → Saved posts) · 💬 reply to comments + ❤️ like comments
   👁 views on every post · 📌 pin up to 3 posts on my profile · 🔁 repost (shown on my profile) */
(() => {
  const W = {
    en: { fp_save: "Save", fp_saved: "🔖 Saved", fp_unsaved: "Removed from saved", fp_savedTitle: "🔖 Saved posts", fp_noSaved: "No saved posts yet.",
      fp_repost: "Repost", fp_reposted: "🔁 Reposted on your profile", fp_unreposted: "Repost removed", fp_ownRepost: "You can't repost your own post",
      fp_pin: "📌 Pin on my profile", fp_unpin: "📌 Unpin", fp_pinned: "📌 Pinned", fp_pinLimit: "You can pin up to 3 posts", fp_reposts: "🔁 Reposts", fp_noReposts: "No reposts yet.",
      fp_reply: "Reply", fp_replyTo: "Replying to {name}", fp_replies: "{n} replies", fp_saveMenu: "🔖 Save post", fp_unsaveMenu: "🔖 Remove from saved", fp_repostBy: "🔁 {name} reposted" },
    ckb: { fp_save: "پاشەکەوت", fp_saved: "🔖 پاشەکەوت کرا", fp_unsaved: "لە پاشەکەوتەکان لابرا", fp_savedTitle: "🔖 پۆستە پاشەکەوتکراوەکان", fp_noSaved: "هێشتا هیچ پۆستێکت پاشەکەوت نەکردووە.",
      fp_repost: "ڕیپۆست", fp_reposted: "🔁 لە پرۆفایلەکەت بڵاو کرایەوە", fp_unreposted: "ڕیپۆستەکە لابرا", fp_ownRepost: "ناتوانیت پۆستی خۆت ڕیپۆست بکەیت",
      fp_pin: "📌 جێگیرکردن لە پرۆفایلەکەم", fp_unpin: "📌 لابردنی جێگیرکردن", fp_pinned: "📌 جێگیر کرا", fp_pinLimit: "تەنها دەتوانیت ٣ پۆست جێگیر بکەیت", fp_reposts: "🔁 ڕیپۆستەکان", fp_noReposts: "هێشتا هیچ ڕیپۆستێک نییە.",
      fp_reply: "وەڵام", fp_replyTo: "وەڵامی {name}", fp_replies: "{n} وەڵام", fp_saveMenu: "🔖 پاشەکەوتکردنی پۆست", fp_unsaveMenu: "🔖 لابردن لە پاشەکەوتەکان", fp_repostBy: "🔁 {name} ڕیپۆستی کرد" },
    ar: { fp_save: "حفظ", fp_saved: "🔖 تم الحفظ", fp_unsaved: "أُزيل من المحفوظات", fp_savedTitle: "🔖 المنشورات المحفوظة", fp_noSaved: "لا منشورات محفوظة بعد.",
      fp_repost: "إعادة نشر", fp_reposted: "🔁 أُعيد النشر في ملفك", fp_unreposted: "أُلغيت إعادة النشر", fp_ownRepost: "لا يمكنك إعادة نشر منشورك",
      fp_pin: "📌 تثبيت في ملفي", fp_unpin: "📌 إلغاء التثبيت", fp_pinned: "📌 تم التثبيت", fp_pinLimit: "يمكنك تثبيت 3 منشورات فقط", fp_reposts: "🔁 إعادات النشر", fp_noReposts: "لا إعادات نشر بعد.",
      fp_reply: "رد", fp_replyTo: "رد على {name}", fp_replies: "{n} ردود", fp_saveMenu: "🔖 حفظ المنشور", fp_unsaveMenu: "🔖 إزالة من المحفوظات", fp_repostBy: "🔁 أعاد {name} النشر" },
  };
  const W3 = {
    en: { fp_owner: "Author", fp_viewReplies: "View {n} replies", fp_copyLink: "Copy link" },
    ckb: { fp_owner: "نووسەر", fp_viewReplies: "بینینی {n} وەڵام", fp_copyLink: "کۆپی لینک" },
    ar: { fp_owner: "الكاتب", fp_viewReplies: "عرض {n} ردود", fp_copyLink: "نسخ الرابط" },
  };
  try { for (const [l, o] of Object.entries(W)) if (I18N[l]) Object.assign(I18N[l], o); } catch {}
  try { for (const [l, o] of Object.entries(W3)) if (I18N[l]) Object.assign(I18N[l], o); } catch {}

  const css = document.createElement("style");
  css.textContent = `
  .rail-btn.fp-on span:first-child{filter:drop-shadow(0 0 6px rgba(255,210,80,.8))}
  .ptile .pin{position:absolute;top:6px;inset-inline-start:6px;background:rgba(0,0,0,.55);color:#fff;border-radius:999px;padding:1px 7px;font-size:.72rem;font-weight:800;z-index:2}
  .cm .cm-acts{display:inline-flex;gap:12px;margin-inline-start:10px}
  .cm .cm-acts button{border:0;background:none;padding:0;cursor:pointer;color:var(--muted);font:inherit;font-size:.75rem;font-weight:800}
  .cm .cm-acts button.on{color:#ef4444}
  .cm.rep{margin-inline-start:34px}
  .cm-rbar{display:flex;align-items:center;gap:8px;padding:6px 10px;margin:6px 0 0;border-radius:12px;background:var(--soft);font-size:.8rem}
  .cm-rbar span{flex:1}.cm-rbar button{border:0;background:none;cursor:pointer;color:var(--ink)}
  .fp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:4px}

  /* 📱 a calmer full-screen post: round glass buttons, a 2-line caption (tap to read all) */
  .reel-rail{gap:16px}
  .reel-rail .rail-btn span:first-child{width:46px;height:46px;border-radius:50%;display:grid;place-items:center;font-size:1.5rem;background:rgba(0,0,0,.28);
    backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);filter:none}
  .reel-rail .rail-btn.on span:first-child{background:rgba(244,63,94,.28)}
  .reel-info .cap{max-height:none;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;cursor:pointer;line-height:1.55}
  .reel-info .cap.open{display:block;-webkit-line-clamp:unset;max-height:32vh;overflow:auto}
  .feed-top .plus,.feed-top .srch{width:36px;height:36px;border-radius:12px;font-size:1rem}

  /* 💬 the comment sheet: dark navy + gold */
  #sheet.cm-mode{--g:#e2b65a;--g2:#f7d98b;--cink:#f6eedb;--cmut:rgba(246,238,219,.6);background:linear-gradient(180deg,#141c4c,#0c1233);color:var(--cink);
    border-top:1.5px solid var(--g);height:74vh;max-height:74vh;display:flex;flex-direction:column;overflow:hidden;padding-bottom:0}
  #sheet.cm-mode .sheet-handle{background:rgba(226,182,90,.6)}
  #sheet.cm-mode #sheet-body{flex:1;min-height:0;display:flex;flex-direction:column}
  .cm2-head{display:flex;align-items:center;justify-content:space-between;padding:0 2px 10px;border-bottom:1px solid rgba(226,182,90,.18)}
  .cm2-head b{font-size:1.02rem}
  .cm2-x{width:32px;height:32px;border-radius:50%;border:0;background:rgba(255,255,255,.08);color:var(--cink);cursor:pointer;font-size:.9rem}
  .cm2-list{flex:1;min-height:0;overflow-y:auto;padding:12px 0;display:flex;flex-direction:column;gap:14px;overscroll-behavior:contain}
  .cm2-list .empty{color:var(--cmut)}
  .cm2{display:flex;gap:10px;align-items:flex-start}
  .cm2.rep{margin-inline-start:44px}
  .cm2-av{cursor:pointer;flex:none}
  .cm2-b{flex:1;min-width:0}
  .cm2-n{font-size:.8rem;font-weight:800;color:var(--g2);cursor:pointer}
  .cm2-n .ow{background:rgba(226,182,90,.18);border-radius:6px;padding:0 6px;margin-inline-start:6px;font-size:.7rem}
  .cm2-t{margin:2px 0 4px;line-height:1.55;font-size:.94rem;word-break:break-word;white-space:pre-wrap}
  .cm2-a{display:flex;gap:14px;color:var(--cmut);font-size:.75rem;font-weight:700}
  .cm2-a button{border:0;background:none;padding:0;color:inherit;font:inherit;font-weight:800;cursor:pointer}
  .cm2-lk{flex:none;display:grid;justify-items:center;border:0;background:none;color:var(--cmut);font:inherit;font-size:.72rem;font-weight:800;cursor:pointer;padding:2px 0 0}
  .cm2-lk span{font-size:1.2rem}
  .cm2-lk.on{color:#fb7185}
  .cm2-more{align-self:flex-start;margin-inline-start:44px;border:0;background:none;padding:0;color:var(--cmut);font:inherit;font-size:.78rem;font-weight:800;cursor:pointer}
  .cm2-more::before{content:"";display:inline-block;width:22px;height:1px;background:currentColor;vertical-align:middle;margin-inline-end:8px}
  .cm2-foot{border-top:1px solid rgba(226,182,90,.18);padding:6px 0 calc(10px + env(safe-area-inset-bottom))}
  .cm2-emo{display:flex;justify-content:space-around;padding:2px 0 8px}
  .cm2-emo button{border:0;background:none;font-size:1.35rem;cursor:pointer;transition:transform .15s}
  .cm2-emo button:active{transform:scale(1.3)}
  #sheet.cm-mode .cm-rbar{background:rgba(226,182,90,.14);color:var(--g2);margin:0 0 6px}
  #sheet.cm-mode .cm-rbar button{color:var(--g2)}
  .cm2-form{display:flex;align-items:center;gap:8px}
  .cm2-form input{flex:1;min-width:0;border:1.5px solid rgba(226,182,90,.45);background:rgba(0,0,0,.35);color:var(--cink);border-radius:999px;padding:11px 15px;font:inherit;font-size:.92rem}
  .cm2-form input::placeholder{color:var(--cmut)}
  .cm2-form input:focus{outline:none;border-color:var(--g2)}
  .cm2-send{width:42px;height:42px;border-radius:50%;border:0;cursor:pointer;display:grid;place-items:center;background:linear-gradient(180deg,#f7d98b,#d9a441);color:#2a1a00;flex:none}
  .cm2-send svg{width:18px;height:18px}

  /* ⋯ a grid of actions */
  .mo-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:4px}
  .mo-grid button{border:1px solid var(--line);background:var(--soft);color:var(--ink);border-radius:16px;padding:14px 4px;display:grid;justify-items:center;gap:6px;font:inherit;font-size:.8rem;font-weight:800;cursor:pointer}
  .mo-grid button span{font-size:1.45rem}
  .mo-grid .bad{color:#e5484d}`;
  document.head.appendChild(css);

  const saved = new Set(), reposted = new Set(), known = new Set(), cLiked = new Set();

  async function hydrate(ids) {
    const need = ids.filter((id) => !known.has(id));
    if (!need.length || !me) return;
    need.forEach((id) => known.add(id));
    const [s, r] = await Promise.all([
      sb.from("saved_posts").select("post_id").eq("user_id", me.id).in("post_id", need),
      sb.from("reposts").select("post_id").eq("user_id", me.id).in("post_id", need),
    ]);
    (s.data || []).forEach((x) => saved.add(x.post_id));
    (r.data || []).forEach((x) => reposted.add(x.post_id));
    need.forEach(paint);
  }
  function paint(id) {
    const post = feedCache.get(id);
    document.querySelectorAll(`[data-fsave="${id}"]`).forEach((b) => { b.classList.toggle("fp-on", saved.has(id)); b.firstElementChild.textContent = saved.has(id) ? "🔖" : "📑"; });
    document.querySelectorAll(`[data-frepost="${id}"]`).forEach((b) => { b.classList.toggle("fp-on", reposted.has(id)); b.lastElementChild.textContent = post?.repost_count || 0; });
  }
  async function toggleSave(id) {
    const on = saved.has(id);
    if (on) saved.delete(id); else saved.add(id);
    paint(id);
    const { error } = on ? await sb.from("saved_posts").delete().eq("user_id", me.id).eq("post_id", id) : await sb.from("saved_posts").insert({ post_id: id });
    if (error && error.code !== "23505") { if (on) saved.add(id); else saved.delete(id); paint(id); return toast(t("error") + error.message); }
    toast(on ? t("fp_unsaved") : t("fp_saved"));
  }
  async function toggleRepost(id) {
    const post = feedCache.get(id); if (!post) return;
    if (post.user_id === me.id) return toast(t("fp_ownRepost"));
    const on = reposted.has(id);
    if (on) { reposted.delete(id); post.repost_count = Math.max(0, (post.repost_count || 0) - 1); } else { reposted.add(id); post.repost_count = (post.repost_count || 0) + 1; }
    paint(id);
    const { error } = on ? await sb.from("reposts").delete().eq("user_id", me.id).eq("post_id", id) : await sb.from("reposts").insert({ post_id: id });
    if (error && error.code !== "23505") {
      if (on) { reposted.add(id); post.repost_count++; } else { reposted.delete(id); post.repost_count--; }
      paint(id); return toast(t("error") + error.message);
    }
    toast(on ? t("fp_unreposted") : t("fp_reposted"));
  }
  // 👁 a photo / text post counts as seen after 1.5 s on screen (videos already count while playing)
  let viewObs = null;
  function observeViews(root) {
    if (!viewObs) viewObs = new IntersectionObserver((entries) => entries.forEach((en) => {
      const el = en.target;
      if (en.isIntersecting && en.intersectionRatio >= 0.6) { clearTimeout(el._fv); el._fv = setTimeout(() => registerView(Number(el.dataset.post)), 1500); }
      else clearTimeout(el._fv);
    }), { threshold: [0, 0.6] });
    root.querySelectorAll(".reel[data-post]").forEach((el) => { if (!el.querySelector("video.reel-video")) viewObs.observe(el); });
  }

  /* ---- 💬 comments with replies and likes ---- */
  function cmHtml(c, post) {
    const u = c.user_id === me.id ? profile : profileCache.get(c.user_id) || { name: t("guest") };
    const canDel = c.user_id === me.id || post.user_id === me.id || isAdmin;
    const on = cLiked.has(c.id);
    return `<div class="cm2${c.parent_id ? " rep" : ""}" data-cid="${c.id}"><span class="cm2-av" data-person="${esc(c.user_id)}">${avHtml(u.name, u.avatar_url, c.parent_id ? "xs" : "sm")}</span>
      <div class="cm2-b"><div class="cm2-n" dir="auto" data-person="${esc(c.user_id)}">${esc(u.name)}${c.user_id === post.user_id ? `<span class="ow">${esc(t("fp_owner"))}</span>` : ""}</div>
        <div class="cm2-t" dir="auto">${esc(c.body)}</div>
        <div class="cm2-a"><span>${esc(shortTime(c.created_at))}</span><button type="button" data-cmr="${c.parent_id || c.id}" data-cmn="${esc(u.name)}">${esc(t("fp_reply"))}</button>
          ${canDel ? `<button type="button" data-cmdel="${c.id}">${esc(t("deleteComment"))}</button>` : ""}</div></div>
      <button type="button" class="cm2-lk${on ? " on" : ""}" data-cml="${c.id}"><span>${on ? "❤️" : "🤍"}</span>${c.like_count || 0}</button></div>`;
  }
  // first comments, each with its replies under it (hidden behind "View 3 replies" until opened)
  function listHtml(rows, post, open) {
    const top = rows.filter((c) => !c.parent_id), kids = new Map();
    rows.filter((c) => c.parent_id).forEach((c) => { if (!kids.has(c.parent_id)) kids.set(c.parent_id, []); kids.get(c.parent_id).push(c); });
    let html = top.map((c) => {
      const k = kids.get(c.id) || [];
      return cmHtml(c, post) + (k.length ? (open.has(c.id) ? k.map((x) => cmHtml(x, post)).join("") : `<button type="button" class="cm2-more" data-open="${c.id}">${esc(t("fp_viewReplies", { n: k.length }))}</button>`) : "");
    }).join("");
    // replies whose first comment is gone
    html += rows.filter((c) => c.parent_id && !top.some((x) => x.id === c.parent_id)).map((c) => cmHtml(c, post)).join("");
    return html;
  }
  async function openComments(postId) {
    const post = feedCache.get(postId); if (!post) return;
    let replyTo = null, rows = [];
    const open = new Set();
    openSheet(`<div class="cm2-head"><b>💬 <span id="cm-count">${post.comment_count || 0}</span> ${esc(t("comments"))}</b><button type="button" class="cm2-x" id="cm-close" aria-label="close">✕</button></div>
      <div id="cm-list" class="cm2-list"><div class="empty">…</div></div>
      <div class="cm2-foot">
        <div class="cm2-emo" id="cm-emo">${["❤️", "😂", "😮", "👏", "🔥", "🙏"].map((e) => `<button type="button">${e}</button>`).join("")}</div>
        <div id="cm-rbar"></div>
        <form class="cm2-form" id="cm-form">${avHtml(profile?.name, profile?.avatar_url, "xs")}<input id="cm-input" maxlength="300" autocomplete="off" dir="auto" placeholder="${esc(t("commentPh"))}">
          <button class="cm2-send" type="submit" aria-label="${esc(t("send"))}"><svg class="flip" viewBox="0 0 24 24" fill="currentColor"><path d="M3.4 20.4 21 12 3.4 3.6l.1 6.5L15 12 3.5 13.9z"/></svg></button></form>
      </div>`);
    document.getElementById("sheet").classList.add("cm-mode");
    document.getElementById("cm-close").addEventListener("click", closeSheet);
    document.getElementById("cm-emo").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; const i = document.getElementById("cm-input"); i.value += b.textContent; i.focus(); });
    const draw = () => {
      const l = document.getElementById("cm-list"); if (!l) return;
      l.innerHTML = rows.length ? listHtml(rows, post, open) : `<div class="empty"><span class="big">💬</span>${esc(t("noComments"))}</div>`;
    };
    const bar = () => {
      const b = document.getElementById("cm-rbar"); if (!b) return;
      b.innerHTML = replyTo ? `<div class="cm-rbar"><span dir="auto">↩️ ${esc(t("fp_replyTo", { name: replyTo.name }))}</span><button type="button" id="cm-rx">✕</button></div>` : "";
      document.getElementById("cm-rx")?.addEventListener("click", () => { replyTo = null; bar(); });
    };
    document.getElementById("cm-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const inp = document.getElementById("cm-input");
      const body = inp.value.trim().slice(0, 300); if (!body) return;
      inp.value = "";
      const row = { post_id: postId, body }; if (replyTo) row.parent_id = replyTo.id;
      const { data, error } = await sb.from("post_comments").insert(row).select().single();
      if (error) { inp.value = body; return toast(t("error") + error.message); }
      if (data.parent_id) open.add(data.parent_id);
      rows.push(data); replyTo = null; bar(); draw();
      setCommentCount(post, (post.comment_count || 0) + 1);
      document.querySelector(`#cm-list [data-cid="${data.id}"]`)?.scrollIntoView({ block: "nearest" });
    });
    document.getElementById("cm-list").addEventListener("click", async (e) => {
      const del = e.target.closest("[data-cmdel]");
      if (del) {
        if (!confirm(t("deleteComment") + "?")) return;
        const id = Number(del.dataset.cmdel);
        const { error } = await sb.from("post_comments").delete().eq("id", id);
        if (error) return toast(t("error") + error.message);
        const gone = rows.filter((c) => c.id === id || c.parent_id === id).length;
        rows = rows.filter((c) => c.id !== id && c.parent_id !== id); draw();
        setCommentCount(post, Math.max(0, (post.comment_count || 0) - gone));
        return;
      }
      const lk = e.target.closest("[data-cml]");
      if (lk) {
        const id = Number(lk.dataset.cml), c = rows.find((x) => x.id === id); if (!c) return;
        const on = cLiked.has(id);
        if (on) { cLiked.delete(id); c.like_count = Math.max(0, (c.like_count || 0) - 1); } else { cLiked.add(id); c.like_count = (c.like_count || 0) + 1; }
        draw();
        const { error } = on ? await sb.from("comment_likes").delete().eq("comment_id", id).eq("user_id", me.id) : await sb.from("comment_likes").insert({ comment_id: id });
        if (error && error.code !== "23505") { if (on) { cLiked.add(id); c.like_count++; } else { cLiked.delete(id); c.like_count--; } draw(); toast(t("error") + error.message); }
        return;
      }
      const op = e.target.closest("[data-open]");
      if (op) { open.add(Number(op.dataset.open)); draw(); return; }
      const rp = e.target.closest("[data-cmr]");
      if (rp) { replyTo = { id: Number(rp.dataset.cmr), name: rp.dataset.cmn }; bar(); document.getElementById("cm-input")?.focus(); return; }
      const who = e.target.closest("[data-person]");
      if (who) openProfile(who.dataset.person);
    });
    const { data } = await sb.from("post_comments").select("*").eq("post_id", postId).order("created_at", { ascending: true }).limit(300);
    rows = (data || []).filter((c) => !blocked.has(c.user_id));
    const missing = [...new Set(rows.map((c) => c.user_id))].filter((id) => !profileCache.has(id));
    if (missing.length) { const r = await sb.from("profiles").select(PROFILE_COLS).in("id", missing); (r.data || []).forEach((p) => profileCache.set(p.id, p)); }
    if (rows.length) {
      const r = await sb.from("comment_likes").select("comment_id").eq("user_id", me.id).in("comment_id", rows.map((c) => c.id));
      (r.data || []).forEach((x) => cLiked.add(x.comment_id));
    }
    draw();
  }

  async function postsByIds(ids) {
    if (!ids.length) return [];
    const { data } = await sb.from("posts").select("*").in("id", ids);
    const byId = new Map((data || []).map((p) => [p.id, p]));
    const list = ids.map((id) => byId.get(id)).filter((p) => p && !blocked.has(p.user_id));
    await hydratePosts(list);
    return list;
  }

  window.FeedPlus = {
    hydrate: (posts) => hydrate(posts.map((p) => p.id)),
    // extra buttons on the right side of a full-screen post
    railHtml: (post) => `<button type="button" class="rail-btn${reposted.has(post.id) ? " fp-on" : ""}" data-frepost="${post.id}"><span>🔁</span><span>${post.repost_count || 0}</span></button>
      <button type="button" class="rail-btn${saved.has(post.id) ? " fp-on" : ""}" data-fsave="${post.id}"><span>${saved.has(post.id) ? "🔖" : "📑"}</span><span>${esc(t("fp_save"))}</span></button>`,
    // ⋯ everything else about a post, in one grid
    openMenu(id) {
      const post = feedCache.get(id); if (!post) return;
      const mine = post.user_id === me.id;
      const b = (k, ic, label, cls = "") => `<button type="button" data-mo="${k}" class="${cls}"><span>${ic}</span>${esc(label)}</button>`;
      openSheet(`<div class="mo-grid">
        ${b("save", saved.has(id) ? "🔖" : "📑", saved.has(id) ? t("fp_saved") : t("fp_save"))}
        ${mine ? b("pin", "📌", post.pinned_at ? t("fp_unpin") : t("fp_pin")) : b("repost", "🔁", reposted.has(id) ? t("fp_unreposted") : t("fp_repost"))}
        ${post.body ? b("tr", "🌐", t("translate")) : ""}
        ${b("link", "🔗", t("fp_copyLink"))}
        ${mine || isAdmin ? b("del", "🗑️", t("deletePost"), "bad") : ""}
        ${mine ? "" : b("report", "🚩", t("reportPost"), "bad")}
      </div><button type="button" class="btn ghost block" id="mo-close" style="margin-top:12px">${esc(t("close"))}</button>`);
      document.getElementById("sheet").classList.add("mo-mode");
      document.getElementById("mo-close").addEventListener("click", closeSheet);
      document.querySelector("#sheet .mo-grid").addEventListener("click", async (e) => {
        const k = e.target.closest("[data-mo]")?.dataset.mo; if (!k) return;
        if (k === "del") return deletePost(id);   // it asks first, then closes
        closeSheet();
        if (k === "save") toggleSave(id);
        else if (k === "repost") toggleRepost(id);
        else if (k === "tr") translateText(post.body || "");
        else if (k === "report") openReport({ userId: post.user_id, postId: id });
        else if (k === "link") { const url = postLink(id); try { await navigator.clipboard.writeText(url); toast(t("linkCopied")); } catch { prompt(t("fp_copyLink"), url); } }
        else if (k === "pin") {
          const { data, error } = await sb.rpc("pin_post", { p_post: id });
          if (error) return toast(/pin_limit/.test(error.message) ? t("fp_pinLimit") : t("error") + error.message);
          post.pinned_at = data ? new Date().toISOString() : null; toast(data ? t("fp_pinned") : t("fp_unpin"));
        }
      });
    },
    wire(root) {
      root.querySelectorAll(".reel-info .cap").forEach((c) => c.addEventListener("click", (e) => { e.stopPropagation(); c.classList.toggle("open"); }));
      root.querySelectorAll("[data-fsave]").forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); toggleSave(Number(b.dataset.fsave)); }));
      root.querySelectorAll("[data-frepost]").forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); toggleRepost(Number(b.dataset.frepost)); }));
      observeViews(root);
      hydrate([...root.querySelectorAll(".reel[data-post]")].map((el) => Number(el.dataset.post)));
    },
    openComments,
    // 📌 / 🔖 inside the ⋯ menu of a post
    menuHtml(post) {
      const mine = post.user_id === me.id;
      return `${mine ? `<button type="button" id="fp-pin">${esc(post.pinned_at ? t("fp_unpin") : t("fp_pin"))}</button>` : ""}
        <button type="button" id="fp-save">${esc(saved.has(post.id) ? t("fp_unsaveMenu") : t("fp_saveMenu"))}</button>`;
    },
    wireMenu(post) {
      document.getElementById("fp-save")?.addEventListener("click", () => { closeSheet(); toggleSave(post.id); });
      document.getElementById("fp-pin")?.addEventListener("click", async () => {
        closeSheet();
        const { data, error } = await sb.rpc("pin_post", { p_post: post.id });
        if (error) return toast(/pin_limit/.test(error.message) ? t("fp_pinLimit") : t("error") + error.message);
        post.pinned_at = data ? new Date().toISOString() : null;
        toast(data ? t("fp_pinned") : t("fp_unpin"));
        if (!$("#screen-main").hidden && currentTab === "me") renderMeTab();
      });
    },
    // 📌 pinned posts first on a profile
    sortPinned(posts) {
      return [...posts].sort((a, b) => (b.pinned_at ? 1 : 0) - (a.pinned_at ? 1 : 0) || (a.pinned_at && b.pinned_at ? new Date(b.pinned_at) - new Date(a.pinned_at) : 0));
    },
    // 🔁 the posts someone reposted (newest first)
    async reposts(userId) {
      const { data } = await sb.from("reposts").select("post_id").eq("user_id", userId).order("created_at", { ascending: false }).limit(60);
      return postsByIds((data || []).map((r) => r.post_id));
    },
    // ⚙️ Settings → 🔖 Saved posts
    async openSaved() {
      openSheet(`<h1>${esc(t("fp_savedTitle"))}</h1><div id="fp-saved"><div class="empty">…</div></div>`);
      const { data } = await sb.from("saved_posts").select("post_id").eq("user_id", me.id).order("created_at", { ascending: false }).limit(120);
      const list = await postsByIds((data || []).map((r) => r.post_id));
      list.forEach((p) => saved.add(p.id));
      const box = document.getElementById("fp-saved"); if (!box) return;
      box.innerHTML = list.length ? `<div class="fp-grid">${list.map(tileHtml).join("")}</div>` : `<div class="empty"><span class="big">🔖</span>${esc(t("fp_noSaved"))}</div>`;
      box.querySelectorAll("[data-ptile]").forEach((b) => b.addEventListener("click", () => {
        const i = list.findIndex((x) => x.id === Number(b.dataset.ptile)); closeSheet(); if (i >= 0) openPostViewer(list, i);
      }));
    },
  };
})();
