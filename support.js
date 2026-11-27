/* 💬 Live support: a private chat between one person and the Learn Together team (update-46).
   Settings → 💬 Support opens the chat. The team's answers arrive live, and a red number shows unread answers.
   Admins answer from admin-support.html. */
(() => {
  const W = {
    en: { sp_row: "Support", sp_title: "💬 Support", sp_sub: "Write to the Learn Together team. We usually answer within a few hours.", sp_team: "Learn Together Support",
      sp_ph: "Write your message…", sp_send: "Send", sp_hello: "👋 Hi! How can we help you? Tell us about any problem, question or idea.", sp_tooMany: "Too many messages. Please wait a few minutes.",
      sp_fail: "Couldn't send: ", sp_new: "💬 Support answered you", sp_open: "Open" },
    ckb: { sp_row: "پشتگیری", sp_title: "💬 پشتگیری", sp_sub: "نامە بۆ تیمی Learn Together بنووسە. زۆربەی جار لە ماوەی چەند کاتژمێرێکدا وەڵام دەدەینەوە.", sp_team: "پشتگیری Learn Together",
      sp_ph: "نامەکەت بنووسە…", sp_send: "ناردن", sp_hello: "👋 سڵاو! چۆن یارمەتیت بدەین؟ هەر کێشە، پرسیار یان بیرۆکەیەکت هەیە پێمان بڵێ.", sp_tooMany: "نامەی زۆرت نارد. تکایە چەند خولەکێک چاوەڕێ بکە.",
      sp_fail: "نەنێردرا: ", sp_new: "💬 پشتگیری وەڵامی دایتەوە", sp_open: "کردنەوە" },
    ar: { sp_row: "الدعم", sp_title: "💬 الدعم", sp_sub: "اكتب لفريق Learn Together. نرد عادة خلال ساعات قليلة.", sp_team: "دعم Learn Together",
      sp_ph: "اكتب رسالتك…", sp_send: "إرسال", sp_hello: "👋 مرحباً! كيف نساعدك؟ أخبرنا بأي مشكلة أو سؤال أو فكرة.", sp_tooMany: "رسائل كثيرة. انتظر بضع دقائق.",
      sp_fail: "تعذّر الإرسال: ", sp_new: "💬 ردّ عليك الدعم", sp_open: "فتح" },
  };
  try { for (const [l, o] of Object.entries(W)) if (I18N[l]) Object.assign(I18N[l], o); for (const l of Object.keys(I18N)) for (const [k, v] of Object.entries(W.en)) if (!(k in I18N[l])) I18N[l][k] = v; } catch {}

  const css = document.createElement("style");
  css.textContent = `
  .sp-wrap{display:flex;flex-direction:column;height:min(72vh,620px)}
  .sp-list{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:8px;padding:10px 2px}
  .sp-msg{max-width:82%;padding:9px 12px;border-radius:16px;line-height:1.55;font-size:.93rem;white-space:pre-wrap;overflow-wrap:anywhere}
  .sp-msg small{display:block;font-size:.7rem;opacity:.7;margin-top:3px}
  .sp-me{align-self:flex-end;background:linear-gradient(180deg,#f7d98b,#e2b65a);color:#2a1a00;border-bottom-right-radius:5px}
  .sp-team{align-self:flex-start;background:rgba(127,127,127,.15);border-bottom-left-radius:5px}
  .sp-team b{display:block;font-size:.74rem;margin-bottom:2px}
  .sp-form{display:flex;gap:8px;align-items:flex-end;padding-top:8px;border-top:1px solid rgba(127,127,127,.2)}
  .sp-form textarea{flex:1;min-height:44px;max-height:120px;resize:none;border-radius:14px;padding:10px 12px;font:inherit;color:inherit;background:rgba(127,127,127,.1);border:1px solid rgba(127,127,127,.25)}
  .sp-form button{height:44px;padding:0 16px;border:0;border-radius:14px;font-weight:800;cursor:pointer;background:linear-gradient(180deg,#f7d98b,#e2b65a);color:#2a1a00}
  .sp-dot{display:inline-grid;place-items:center;min-width:20px;height:20px;padding:0 6px;border-radius:999px;background:#e11d48;color:#fff;font-size:.72rem;font-weight:800;margin-inline-start:6px}`;
  document.head.appendChild(css);

  const when = (s) => { try { return new Date(s).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); } catch { return ""; } };
  const bubble = (m) => m.from_admin
    ? `<div class="sp-msg sp-team" data-id="${m.id}"><b>🛡️ ${esc(t("sp_team"))}</b>${esc(m.body)}<small>${esc(when(m.created_at))}</small></div>`
    : `<div class="sp-msg sp-me" data-id="${m.id}">${esc(m.body)}<small>${esc(when(m.created_at))}</small></div>`;

  let chan = null, live = null, unread = 0;

  // the red number in settings
  async function refreshDot() {
    try { const { data } = await sb.rpc("support_unread"); unread = Number(data || 0); } catch { unread = 0; }
    const d = document.getElementById("me-support-dot"); if (d) { d.textContent = unread || ""; d.hidden = !unread; }
  }

  // always listening (while signed in) so an answer pops up even when the chat is closed
  function listen() {
    if (live || !me?.id) return;
    live = sb.channel("support-live-" + me.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages", filter: `user_id=eq.${me.id}` }, (p) => {
        const m = p.new; if (!m) return;
        const list = document.getElementById("sp-list");
        if (list) { if (!list.querySelector(`[data-id="${m.id}"]`)) { list.insertAdjacentHTML("beforeend", bubble(m)); list.scrollTop = list.scrollHeight; } if (m.from_admin) sb.rpc("support_seen"); }
        else if (m.from_admin) { refreshDot(); toast(t("sp_new"), t("sp_open"), open); }
      })
      .subscribe();
  }

  async function open() {
    openSheet(`<h1>${esc(t("sp_title"))}</h1><div class="muted small">${esc(t("sp_sub"))}</div>
      <div class="sp-wrap"><div class="sp-list" id="sp-list"><div class="sp-msg sp-team"><b>🛡️ ${esc(t("sp_team"))}</b>${esc(t("sp_hello"))}</div></div>
      <form class="sp-form" id="sp-form"><textarea id="sp-in" rows="1" maxlength="2000" placeholder="${esc(t("sp_ph"))}" aria-label="${esc(t("sp_ph"))}"></textarea><button type="submit">${esc(t("sp_send"))}</button></form></div>`);
    listen();
    const list = document.getElementById("sp-list");
    const { data } = await sb.from("support_messages").select("id,from_admin,body,created_at").eq("user_id", me.id).order("created_at", { ascending: true }).limit(300);
    (data || []).forEach((m) => list.insertAdjacentHTML("beforeend", bubble(m)));
    list.scrollTop = list.scrollHeight;
    sb.rpc("support_seen").then(refreshDot, () => {});
    const inp = document.getElementById("sp-in");
    inp.addEventListener("input", () => { inp.style.height = "auto"; inp.style.height = Math.min(120, inp.scrollHeight) + "px"; });
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); document.getElementById("sp-form").requestSubmit(); } });
    document.getElementById("sp-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const body = inp.value.trim(); if (!body) return;
      const btn = e.target.querySelector("button"); btn.disabled = true;
      const { data: id, error } = await sb.rpc("support_send", { p_body: body });
      btn.disabled = false;
      if (error) return toast(/too_many/.test(error.message) ? t("sp_tooMany") : t("sp_fail") + error.message);
      inp.value = ""; inp.style.height = "auto";
      if (!list.querySelector(`[data-id="${id}"]`)) list.insertAdjacentHTML("beforeend", bubble({ id, from_admin: false, body, created_at: new Date().toISOString() }));
      list.scrollTop = list.scrollHeight;
    });
    setTimeout(() => inp.focus(), 100);
  }

  // the row in settings (after "Messages")
  function settings() {
    const anchor = document.getElementById("me-inbox") || document.getElementById("me-id"); if (!anchor) return;
    document.getElementById("me-support")?.remove();
    anchor.insertAdjacentHTML("afterend", `<button type="button" id="me-support">💬 ${esc(t("sp_row"))}<span class="sp-dot" id="me-support-dot" hidden></span><span class="chev">›</span></button>`);
    document.getElementById("me-support").addEventListener("click", open);
    listen(); refreshDot();
  }

  window.Support = { settings, open, listen };
})();
