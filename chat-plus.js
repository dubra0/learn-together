/* 💬 Chat extras (needs supabase/update-34-chat-plus.sql)
   ✓ sent / ✓✓ read (changes live) · "typing…" · 😍 reactions · ↩️ reply · 🗑️ delete for both
   🟢 online / last seen (+ "hide that I'm online" in Settings) · 🔇 mute a chat */
(() => {
  const W = {
    en: { cp_typing: "typing…", cp_online: "🟢 Online", cp_seen: "Last seen {t}", cp_reply: "↩️ Reply", cp_del: "🗑️ Delete for everyone", cp_delQ: "Delete this message for both of you?",
      cp_deleted: "Message deleted", cp_replyTo: "Replying to {name}", cp_you: "You", cp_mute: "🔇 Mute this chat", cp_unmute: "🔔 Unmute this chat", cp_muted: "🔇 Chat muted", cp_unmuted: "🔔 Chat unmuted",
      cp_hide: "🟢 Show when I'm online", cp_hideOn: "✅ On", cp_hideOff: "Hidden", cp_min: "{n} min ago", cp_hr: "{n} h ago", cp_now: "just now", cp_voice: "🎤 Voice message" },
    ckb: { cp_typing: "دەنووسێت…", cp_online: "🟢 ئۆنلاینە", cp_seen: "دوایین جار {t}", cp_reply: "↩️ وەڵامدانەوە", cp_del: "🗑️ سڕینەوە بۆ هەردوولا", cp_delQ: "ئەم نامەیە بۆ هەردووکتان بسڕدرێتەوە؟",
      cp_deleted: "نامەکە سڕایەوە", cp_replyTo: "وەڵامی {name}", cp_you: "خۆت", cp_mute: "🔇 بێدەنگکردنی ئەم چاتە", cp_unmute: "🔔 لابردنی بێدەنگی", cp_muted: "🔇 چاتەکە بێدەنگ کرا", cp_unmuted: "🔔 بێدەنگی لابرا",
      cp_hide: "🟢 نیشاندانی ئۆنلاینبوونم", cp_hideOn: "✅ داگیرساوە", cp_hideOff: "شاراوەیە", cp_min: "{n} خولەک لەمەوبەر", cp_hr: "{n} کاتژمێر لەمەوبەر", cp_now: "ئێستا", cp_voice: "🎤 نامەی دەنگی" },
    ar: { cp_typing: "يكتب…", cp_online: "🟢 متصل", cp_seen: "آخر ظهور {t}", cp_reply: "↩️ رد", cp_del: "🗑️ حذف للجميع", cp_delQ: "حذف هذه الرسالة لكما معاً؟",
      cp_deleted: "تم حذف الرسالة", cp_replyTo: "رد على {name}", cp_you: "أنت", cp_mute: "🔇 كتم هذه المحادثة", cp_unmute: "🔔 إلغاء الكتم", cp_muted: "🔇 تم كتم المحادثة", cp_unmuted: "🔔 تم إلغاء الكتم",
      cp_hide: "🟢 إظهار أنني متصل", cp_hideOn: "✅ مفعّل", cp_hideOff: "مخفي", cp_min: "منذ {n} د", cp_hr: "منذ {n} س", cp_now: "الآن", cp_voice: "🎤 رسالة صوتية" },
    tr: { cp_typing: "yazıyor…", cp_online: "🟢 Çevrimiçi", cp_seen: "Son görülme {t}", cp_reply: "↩️ Yanıtla", cp_del: "🗑️ Herkesten sil", cp_delQ: "Bu mesaj ikiniz için de silinsin mi?",
      cp_deleted: "Mesaj silindi", cp_replyTo: "{name} yanıtlanıyor", cp_you: "Sen", cp_mute: "🔇 Sohbeti sessize al", cp_unmute: "🔔 Sesi aç", cp_muted: "🔇 Sohbet sessizde", cp_unmuted: "🔔 Ses açıldı",
      cp_hide: "🟢 Çevrimiçi olduğumu göster", cp_hideOn: "✅ Açık", cp_hideOff: "Gizli", cp_min: "{n} dk önce", cp_hr: "{n} sa önce", cp_now: "az önce", cp_voice: "🎤 Sesli mesaj" },
    fa: { cp_typing: "در حال نوشتن…", cp_online: "🟢 آنلاین", cp_seen: "آخرین بازدید {t}", cp_reply: "↩️ پاسخ", cp_del: "🗑️ حذف برای همه", cp_delQ: "این پیام برای هر دو نفر حذف شود؟",
      cp_deleted: "پیام حذف شد", cp_replyTo: "پاسخ به {name}", cp_you: "تو", cp_mute: "🔇 بی‌صدا کردن گفتگو", cp_unmute: "🔔 باصدا کردن", cp_muted: "🔇 گفتگو بی‌صدا شد", cp_unmuted: "🔔 باصدا شد",
      cp_hide: "🟢 نمایش آنلاین بودنم", cp_hideOn: "✅ روشن", cp_hideOff: "پنهان", cp_min: "{n} دقیقه پیش", cp_hr: "{n} ساعت پیش", cp_now: "همین الان", cp_voice: "🎤 پیام صوتی" },
    de: { cp_typing: "schreibt…", cp_online: "🟢 Online", cp_seen: "Zuletzt online {t}", cp_reply: "↩️ Antworten", cp_del: "🗑️ Für alle löschen", cp_delQ: "Diese Nachricht für euch beide löschen?",
      cp_deleted: "Nachricht gelöscht", cp_replyTo: "Antwort an {name}", cp_you: "Du", cp_mute: "🔇 Chat stummschalten", cp_unmute: "🔔 Stumm aufheben", cp_muted: "🔇 Chat stumm", cp_unmuted: "🔔 Ton an",
      cp_hide: "🟢 Zeigen, wenn ich online bin", cp_hideOn: "✅ An", cp_hideOff: "Versteckt", cp_min: "vor {n} Min.", cp_hr: "vor {n} Std.", cp_now: "gerade eben", cp_voice: "🎤 Sprachnachricht" },
    fr: { cp_typing: "écrit…", cp_online: "🟢 En ligne", cp_seen: "Vu {t}", cp_reply: "↩️ Répondre", cp_del: "🗑️ Supprimer pour tous", cp_delQ: "Supprimer ce message pour vous deux ?",
      cp_deleted: "Message supprimé", cp_replyTo: "Réponse à {name}", cp_you: "Toi", cp_mute: "🔇 Mettre en sourdine", cp_unmute: "🔔 Réactiver le son", cp_muted: "🔇 Discussion en sourdine", cp_unmuted: "🔔 Son réactivé",
      cp_hide: "🟢 Montrer quand je suis en ligne", cp_hideOn: "✅ Activé", cp_hideOff: "Masqué", cp_min: "il y a {n} min", cp_hr: "il y a {n} h", cp_now: "à l'instant", cp_voice: "🎤 Message vocal" },
    es: { cp_typing: "escribiendo…", cp_online: "🟢 En línea", cp_seen: "Últ. vez {t}", cp_reply: "↩️ Responder", cp_del: "🗑️ Eliminar para todos", cp_delQ: "¿Eliminar este mensaje para ambos?",
      cp_deleted: "Mensaje eliminado", cp_replyTo: "Respondiendo a {name}", cp_you: "Tú", cp_mute: "🔇 Silenciar chat", cp_unmute: "🔔 Quitar silencio", cp_muted: "🔇 Chat silenciado", cp_unmuted: "🔔 Silencio quitado",
      cp_hide: "🟢 Mostrar cuando estoy en línea", cp_hideOn: "✅ Activado", cp_hideOff: "Oculto", cp_min: "hace {n} min", cp_hr: "hace {n} h", cp_now: "ahora", cp_voice: "🎤 Mensaje de voz" },
  };
  try { for (const [l, o] of Object.entries(W)) if (I18N[l]) Object.assign(I18N[l], o); } catch {}

  const css = document.createElement("style");
  css.textContent = `
  .dmsg .tk{margin-inline-start:4px;font-weight:800;letter-spacing:-2px}
  .dmsg .tk.rd{color:#7dd3fc}
  .dmsg:not(.mine) .tk{display:none}
  .dmsg .rq{display:block;font-size:.78rem;opacity:.85;border-inline-start:3px solid currentColor;padding:2px 8px;margin:0 0 5px;border-radius:6px;
    background:rgba(127,127,127,.15);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:240px}
  .dmsg .rq b{display:block;font-size:.7rem}
  .dmsg{flex-wrap:wrap}
  .dmsg .rx{flex-basis:100%;display:flex;gap:4px;margin-top:-4px;padding:0 6px}
  .dmsg.mine .rx{justify-content:flex-end}
  .dmsg .rx span{background:var(--card);border:1px solid var(--line);border-radius:999px;padding:1px 7px;font-size:.8rem;box-shadow:var(--shadow);color:var(--ink)}
  .dmsg .rx span.me{border-color:var(--brand)}
  .dmsg.gone{opacity:0;transform:scale(.9);transition:.2s}
  .dm-wn{display:flex;flex-direction:column;min-width:0;line-height:1.15}
  .dm-wn > span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .dm-st{font-size:.74rem;font-weight:600;color:var(--muted)}
  .dm-st.typing{color:var(--brand)}
  .dm-mute{flex:0 0 auto}
  .cp-rbar{display:flex;align-items:center;gap:8px;max-width:680px;margin:0 auto 6px;padding:6px 10px;border-radius:12px;background:var(--soft);font-size:.82rem}
  .cp-rbar .t{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .cp-rbar button{border:0;background:none;cursor:pointer;font-size:1rem;color:var(--ink)}
  .cp-emo{display:flex;justify-content:space-between;gap:6px;margin:4px 0 12px}
  .cp-emo button{flex:1;border:0;background:var(--soft);border-radius:14px;font-size:1.5rem;padding:8px 0;cursor:pointer}
  .cp-emo button.on{outline:2px solid var(--brand)}`;
  document.head.appendChild(css);

  const EMO = ["❤️", "😂", "😮", "😢", "👍", "🔥"];
  const S = { other: null, chan: null, byId: new Map(), reacts: new Map(), replyTo: null, stTimer: 0, typingT: 0, lastTyping: 0, seenAt: null };
  let readChan = null;

  // 🔇 muted chats live on this phone (the service worker also reads them, so their notifications come silently)
  const muted = new Set((() => { try { return JSON.parse(localStorage.getItem("mutedChats") || "[]"); } catch { return []; } })());
  const saveMuted = () => {
    try { localStorage.setItem("mutedChats", JSON.stringify([...muted])); } catch {}
    try { caches.open("lt-prefs").then((c) => c.put("muted.json", new Response(JSON.stringify([...muted]), { headers: { "content-type": "application/json" } }))); } catch {}
  };

  const ago = (iso) => {
    const s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (s < 60) return t("cp_now");
    if (s < 3600) return t("cp_min", { n: Math.floor(s / 60) });
    if (s < 86400) return t("cp_hr", { n: Math.floor(s / 3600) });
    return shortTime(iso);
  };
  const snip = (m) => (m?.body ? String(m.body).slice(0, 80) : t("cp_voice"));
  const nameOf = (uid) => (uid === me.id ? t("cp_you") : S.other?.name || t("guest"));

  function paintReacts(mid) {
    const div = document.querySelector(`#dm-list .dmsg[data-mid="${mid}"]`); if (!div) return;
    let rx = div.querySelector(".rx");
    const r = S.reacts.get(Number(mid)) || {};
    const list = Object.entries(r);
    if (!list.length) { rx?.remove(); return; }
    if (!rx) { rx = document.createElement("div"); rx.className = "rx"; div.appendChild(rx); }
    rx.innerHTML = list.map(([u, e]) => `<span class="${u === me.id ? "me" : ""}">${esc(e)}</span>`).join("");
  }
  function setTick(mid, read) {
    const tk = document.querySelector(`#dm-list .dmsg[data-mid="${mid}"] .tk`); if (!tk) return;
    tk.classList.toggle("rd", !!read); tk.textContent = read ? "✓✓" : "✓";
  }
  function paintStatus() {
    const st = document.getElementById("dm-st"); if (!st) return;
    if (Date.now() - S.typingT < 3500) { st.textContent = t("cp_typing"); st.classList.add("typing"); return; }
    st.classList.remove("typing");
    const at = S.seenAt ? new Date(S.seenAt).getTime() : 0;
    st.textContent = !at ? "" : Date.now() - at < 130e3 ? t("cp_online") : t("cp_seen", { t: ago(S.seenAt) });
  }
  async function loadSeen() {
    if (!S.other) return;
    try { const { data } = await sb.rpc("last_seen_of", { p_user: S.other }); S.seenAt = data || null; } catch {}
    paintStatus();
  }
  function replyBar() {
    let bar = document.getElementById("cp-rbar");
    if (!S.replyTo) { bar?.remove(); return; }
    if (!bar) {
      bar = document.createElement("div"); bar.id = "cp-rbar"; bar.className = "cp-rbar";
      document.querySelector("#screen-dm .dm-bottom")?.prepend(bar);
    }
    bar.innerHTML = `<span>↩️</span><span class="t" dir="auto"><b>${esc(t("cp_replyTo", { name: nameOf(S.replyTo.sender) }))}</b> · ${esc(snip(S.replyTo))}</span><button type="button" aria-label="cancel">✕</button>`;
    bar.querySelector("button").onclick = () => { S.replyTo = null; replyBar(); };
    document.getElementById("dm-input")?.focus();
  }
  async function react(m, emoji) {
    const mine = (S.reacts.get(m.id) || {})[me.id];
    const r = { ...(S.reacts.get(m.id) || {}) };
    let res;
    if (mine === emoji) { delete r[me.id]; res = await sb.from("message_reactions").delete().eq("message_id", m.id).eq("user_id", me.id); }
    else if (mine) { r[me.id] = emoji; res = await sb.from("message_reactions").update({ emoji }).eq("message_id", m.id).eq("user_id", me.id); }
    else { r[me.id] = emoji; res = await sb.from("message_reactions").insert({ message_id: m.id, user_id: me.id, emoji }); }
    if (res.error) return toast(t("error") + res.error.message);
    S.reacts.set(m.id, r); paintReacts(m.id);
    S.chan?.send({ type: "broadcast", event: "react", payload: { mid: m.id, user: me.id, emoji: r[me.id] || null } });
  }
  async function del(m) {
    if (!confirm(t("cp_delQ"))) return;
    const { error } = await sb.from("messages").delete().eq("id", m.id).eq("sender", me.id);
    if (error) return toast(t("error") + error.message);
    if (m.audio_path) sb.storage.from("voice-notes").remove([m.audio_path]).catch(() => {});
    removeMsg(m.id);
    S.chan?.send({ type: "broadcast", event: "del", payload: { mid: m.id } });
    toast(t("cp_deleted"));
  }
  function removeMsg(mid) {
    const div = document.querySelector(`#dm-list .dmsg[data-mid="${mid}"]`);
    if (div) { div.classList.add("gone"); setTimeout(() => div.remove(), 220); }
    S.byId.delete(Number(mid));
  }
  function wireHeader() {
    const hd = document.querySelector("#screen-dm > .appbar"); if (!hd) return;
    let b = document.getElementById("dm-mute");
    if (!b) { b = document.createElement("button"); b.type = "button"; b.id = "dm-mute"; b.className = "icon-btn dm-mute"; hd.appendChild(b);
      b.addEventListener("click", () => {
        if (!S.other) return;
        if (muted.has(S.other)) { muted.delete(S.other); toast(t("cp_unmuted")); } else { muted.add(S.other); toast(t("cp_muted")); }
        saveMuted(); paintMute();
      });
    }
    paintMute();
  }
  function paintMute() { const b = document.getElementById("dm-mute"); if (b) { const m = S.other && muted.has(S.other); b.textContent = m ? "🔇" : "🔔"; b.title = m ? t("cp_unmute") : t("cp_mute"); b.setAttribute("aria-label", b.title); } }

  // ✓✓ my messages turn blue as soon as they are read
  function listenRead() {
    if (readChan || !sb || !me) return;
    readChan = sb.channel("dmread-" + me.id)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: `sender=eq.${me.id}` }, (p) => {
        const m = p.new; if (!m) return;
        const old = S.byId.get(m.id); if (old) old.read_at = m.read_at;
        setTick(m.id, !!m.read_at);
      })
      .subscribe();
  }
  // 🟢 tell the server I'm here, about once a minute while the app is open
  let beat = 0;
  function heartbeat() {
    try { if (me && document.visibilityState === "visible") sb.rpc("touch_seen").then(() => {}, () => {}); } catch {}
  }
  function startBeat() {
    if (beat) return;
    beat = setInterval(() => { try { if (typeof me !== "undefined" && me) { heartbeat(); listenRead(); } } catch {} }, 60e3);
    setTimeout(() => { try { if (typeof me !== "undefined" && me) { heartbeat(); listenRead(); } } catch {} }, 4000);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") heartbeat(); });
  }
  startBeat();

  window.ChatPlus = {
    isMuted: (id) => muted.has(id),
    // called by appendDm for every message bubble
    decorate(div, m, mine) {
      div.dataset.mid = m.id;
      S.byId.set(m.id, m);
      const b = div.querySelector(".b");
      if (b && m.reply_to) {
        const q = S.byId.get(m.reply_to);
        const rq = document.createElement("span"); rq.className = "rq"; rq.dir = "auto";
        rq.innerHTML = q ? `<b>${esc(nameOf(q.sender))}</b>${esc(snip(q))}` : "↩️ …";
        b.prepend(rq);
        rq.addEventListener("click", (e) => { e.stopPropagation(); document.querySelector(`#dm-list .dmsg[data-mid="${m.reply_to}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" }); });
      }
      // hold a message (or right-click) for the menu — works for voice messages too
      let hold = 0;
      const start = () => { hold = setTimeout(() => { hold = 0; ChatPlus.menu(m); }, 480); };
      const stop = () => { if (hold) { clearTimeout(hold); hold = 0; } };
      div.addEventListener("touchstart", start, { passive: true });
      ["touchend", "touchmove", "touchcancel"].forEach((ev) => div.addEventListener(ev, stop, { passive: true }));
      div.addEventListener("contextmenu", (e) => { e.preventDefault(); ChatPlus.menu(m); });
      if (S.reacts.has(m.id)) paintReacts(m.id);
    },
    menu(m) {
      const myR = (S.reacts.get(m.id) || {})[me.id];
      const mine = m.sender === me.id;
      openSheet(`${m.body ? `<div class="muted small" dir="auto" style="margin-bottom:8px">${esc(String(m.body).slice(0, 300))}</div>` : ""}
        <div class="cp-emo">${EMO.map((e) => `<button type="button" data-emo="${e}" class="${myR === e ? "on" : ""}">${e}</button>`).join("")}</div>
        <div class="menu" style="box-shadow:none">
          ${dmCanSend ? `<button type="button" id="cp-reply">${esc(t("cp_reply"))}</button>` : ""}
          ${m.body ? `<button type="button" id="cp-tr">🌐 ${esc(t("translate"))}</button><button type="button" id="cp-save">⭐ ${esc(t("saveWord"))}</button>` : ""}
          ${mine ? `<button type="button" id="cp-del" class="danger">${esc(t("cp_del"))}</button>` : ""}
          <button type="button" id="cp-close">${esc(t("close"))}</button></div>`);
      document.querySelectorAll("#sheet [data-emo]").forEach((b) => b.addEventListener("click", () => { closeSheet(); react(m, b.dataset.emo); }));
      document.getElementById("cp-reply")?.addEventListener("click", () => { closeSheet(); S.replyTo = m; replyBar(); });
      document.getElementById("cp-tr")?.addEventListener("click", () => { closeSheet(); translateText(m.body); });
      document.getElementById("cp-save")?.addEventListener("click", () => { closeSheet(); saveWord(m.body); });
      document.getElementById("cp-del")?.addEventListener("click", () => { closeSheet(); del(m); });
      document.getElementById("cp-close")?.addEventListener("click", closeSheet);
    },
    // a chat opened (before its messages are drawn)
    open(otherId) {
      ChatPlus.close();
      S.other = otherId; S.byId = new Map(); S.reacts = new Map(); S.replyTo = null; S.typingT = 0; S.seenAt = null;
      // name + a small line under it (online / last seen / typing…)
      const who = document.getElementById("dm-who");
      const nm = who?.querySelector(":scope > span:last-child");
      if (who && nm && !who.querySelector(".dm-wn")) {
        const wn = document.createElement("div"); wn.className = "dm-wn";
        nm.replaceWith(wn); wn.appendChild(nm);
        const st = document.createElement("small"); st.className = "dm-st"; st.id = "dm-st"; wn.appendChild(st);
      }
      wireHeader();
      listenRead();
      const key = [me.id, otherId].sort().join(":");
      S.chan = sb.channel("dmx:" + key, { config: { broadcast: { self: false } } })
        .on("broadcast", { event: "typing" }, (p) => { if (p.payload?.user === S.other) { S.typingT = Date.now(); paintStatus(); setTimeout(paintStatus, 3600); } })
        .on("broadcast", { event: "react" }, (p) => {
          const { mid, user, emoji } = p.payload || {}; if (user !== S.other || !mid) return;
          const r = { ...(S.reacts.get(mid) || {}) }; if (emoji && EMO.includes(emoji)) r[user] = emoji; else delete r[user];
          S.reacts.set(mid, r); paintReacts(mid);
        })
        .on("broadcast", { event: "del" }, (p) => { const mid = Number(p.payload?.mid); if (mid && S.byId.get(mid)?.sender === S.other) removeMsg(mid); })
        .subscribe();
      loadSeen();
      S.stTimer = setInterval(loadSeen, 30e3);
      const inp = document.getElementById("dm-input");
      if (inp && !inp._cpTyping) {
        inp._cpTyping = true;
        inp.addEventListener("input", () => {
          if (!S.chan || Date.now() - S.lastTyping < 2500 || !inp.value) return;
          S.lastTyping = Date.now();
          S.chan.send({ type: "broadcast", event: "typing", payload: { user: me.id } });
        });
      }
      replyBar();
    },
    // its messages are on the screen now: get the reactions
    async loaded(msgs) {
      const ids = (msgs || []).map((m) => m.id);
      if (!ids.length) return;
      const other = S.other;
      const { data } = await sb.from("message_reactions").select("message_id,user_id,emoji").in("message_id", ids.slice(-300));
      if (other !== S.other) return;
      (data || []).forEach((r) => { const o = S.reacts.get(r.message_id) || {}; o[r.user_id] = r.emoji; S.reacts.set(r.message_id, o); });
      [...S.reacts.keys()].forEach(paintReacts);
    },
    close() {
      if (S.chan) { try { sb.removeChannel(S.chan); } catch {} S.chan = null; }
      clearInterval(S.stTimer); S.stTimer = 0; S.other = null; S.replyTo = null; replyBar();
    },
    // what to add to a message I send now (the reply), then the reply bar goes away
    sendExtra() {
      if (!S.replyTo) return {};
      const r = { reply_to: S.replyTo.id }; S.replyTo = null; replyBar(); return r;
    },
    // ⚙️ Settings → 🟢 show when I'm online
    async wireHide() {
      const btn = document.getElementById("me-hide"), st = document.getElementById("me-hide-st");
      if (!btn || !st) return;
      let hide = false;
      const show = () => { st.textContent = hide ? t("cp_hideOff") : t("cp_hideOn"); };
      try { const { data, error } = await sb.rpc("my_hide_online"); if (!error) hide = data === true; } catch {}
      show();
      btn.addEventListener("click", async () => {
        btn.disabled = true;
        const { data, error } = await sb.rpc("set_hide_online", { p_hide: !hide });
        btn.disabled = false;
        if (error) return toast(t("error") + error.message);
        hide = data === true; show();
      });
    },
  };
  saveMuted();
})();
