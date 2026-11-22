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
  try { for (const [l, o] of Object.entries(W)) if (I18N[l]) Object.assign(I18N[l], o); } catch {}

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
  .fp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:4px}`;
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
    return `<div class="cm${c.parent_id ? " rep" : ""}" data-cid="${c.id}"><span data-person="${esc(c.user_id)}" style="cursor:pointer">${avHtml(u.name, u.avatar_url, "xs")}</span>
      <div class="cm-b"><b dir="auto" data-person="${esc(c.user_id)}">${esc(u.name)}</b> <span dir="auto">${esc(c.body)}</span>
        <div class="tm"><span>${esc(shortTime(c.created_at))}</span>
          <span class="cm-acts"><button type="button" data-cml="${c.id}" class="${on ? "on" : ""}">${on ? "❤️" : "🤍"} ${c.like_count || 0}</button>
            <button type="button" data-cmr="${c.id}" data-cmn="${esc(u.name)}">${esc(t("fp_reply"))}</button></span>
          ${canDel ? `<button type="button" data-cmdel="${c.id}">${esc(t("deleteComment"))}</button>` : ""}</div></div></div>`;
  }
  function ordered(rows) {
    const top = rows.filter((c) => !c.parent_id), kids = new Map();
    rows.filter((c) => c.parent_id).forEach((c) => { if (!kids.has(c.parent_id)) kids.set(c.parent_id, []); kids.get(c.parent_id).push(c); });
    const out = [];
    top.forEach((c) => { out.push(c); (kids.get(c.id) || []).forEach((k) => out.push(k)); });
    // replies whose first comment is gone: show them at the end
    rows.filter((c) => c.parent_id && !top.some((x) => x.id === c.parent_id)).forEach((c) => out.push(c));
    return out;
  }
  async function openComments(postId) {
    const post = feedCache.get(postId); if (!post) return;
    let replyTo = null, rows = [];
    openSheet(`<h1>💬 ${esc(t("comments"))} <span class="muted" id="cm-count">${post.comment_count || 0}</span></h1>
      <div id="cm-list"><div class="empty">…</div></div>
      <div id="cm-rbar"></div>
      <form class="cm-form" id="cm-form"><input id="cm-input" maxlength="300" autocomplete="off" dir="auto" placeholder="${esc(t("commentPh"))}">
        <button class="btn" type="submit">${esc(t("send"))}</button></form>`);
    const draw = () => { const l = document.getElementById("cm-list"); if (l) l.innerHTML = rows.length ? ordered(rows).map((c) => cmHtml(c, post)).join("") : `<div class="empty">${esc(t("noComments"))}</div>`; };
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
    wire(root) {
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
