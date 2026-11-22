/* 🎙️ Room extras (needs supabase/update-36-rooms-plus.sql)
   🔒 rooms with a password · 📝 a note board at the top of a room (the host writes it) · 🎯 rooms by level */
(() => {
  const W = {
    en: { rp_locked: "🔒 Password", rp_pwLbl: "Password (4–8 digits)", rp_pwBad: "The password must be 4–8 digits", rp_ask: "🔒 This room has a password. Type it:", rp_wrong: "❌ Wrong password",
      rp_tries: "Too many wrong tries. Wait 10 minutes.", rp_tag: "🔒", rp_board: "📝 Note for everyone", rp_boardAdd: "📝 Add a note for everyone", rp_boardAsk: "📝 A note everyone in the room sees (empty = remove):",
      rp_allLevels: "🎯 All levels" },
    ckb: { rp_locked: "🔒 وشەی نهێنی", rp_pwLbl: "وشەی نهێنی (٤–٨ ژمارە)", rp_pwBad: "وشەی نهێنی دەبێت ٤–٨ ژمارە بێت", rp_ask: "🔒 ئەم ژوورە وشەی نهێنی هەیە. بینووسە:", rp_wrong: "❌ وشەی نهێنی هەڵەیە",
      rp_tries: "زۆر جار هەڵەت کرد. ١٠ خولەک چاوەڕێ بکە.", rp_tag: "🔒", rp_board: "📝 تێبینی بۆ هەمووان", rp_boardAdd: "📝 تێبینییەک بۆ هەمووان بنووسە", rp_boardAsk: "📝 تێبینییەک کە هەموو کەسێکی ژوورەکە دەیبینێت (بەتاڵ = لابردن):",
      rp_allLevels: "🎯 هەموو ئاستەکان" },
    ar: { rp_locked: "🔒 كلمة سر", rp_pwLbl: "كلمة السر (4–8 أرقام)", rp_pwBad: "يجب أن تكون كلمة السر 4–8 أرقام", rp_ask: "🔒 لهذه الغرفة كلمة سر. اكتبها:", rp_wrong: "❌ كلمة السر خاطئة",
      rp_tries: "محاولات خاطئة كثيرة. انتظر 10 دقائق.", rp_tag: "🔒", rp_board: "📝 ملاحظة للجميع", rp_boardAdd: "📝 أضف ملاحظة للجميع", rp_boardAsk: "📝 ملاحظة يراها الجميع في الغرفة (فارغ = حذف):",
      rp_allLevels: "🎯 كل المستويات" },
  };
  try { for (const [l, o] of Object.entries(W)) if (I18N[l]) Object.assign(I18N[l], o); } catch {}
  try { document.querySelectorAll('[data-i18n^="rp_"]').forEach((el) => (el.textContent = t(el.dataset.i18n))); } catch {}

  const css = document.createElement("style");
  css.textContent = `
  #room-board{position:relative;z-index:3;margin:0 0 10px;padding:10px 14px;border-radius:16px;background:rgba(255,255,255,.12);color:#fff;
    backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);font-weight:700;font-size:.9rem;line-height:1.4;white-space:pre-wrap;word-break:break-word;border:1px solid rgba(255,255,255,.18)}
  #room-board small{display:block;font-size:.7rem;opacity:.7;font-weight:800;margin-bottom:2px}
  #room-board.add{background:none;border-style:dashed;opacity:.75;text-align:center;cursor:pointer;font-size:.82rem}
  #room-board.host{cursor:pointer}
  #room-pw-box input{letter-spacing:4px;font-variant-numeric:tabular-nums}`;
  document.head.appendChild(css);

  window.RoomsPlus = {
    // 🔒 ask the password of a room; gives it back when it is right
    async askCode(r) {
      const code = (prompt(t("rp_ask")) || "").trim();
      if (!code) return null;
      const { data, error } = await sb.rpc("check_room_code", { p_room: r.id, p_code: code });
      if (error) { toast(/too_many/.test(error.message) ? t("rp_tries") : t("error") + error.message); return null; }
      if (data !== true) { toast(t("rp_wrong")); return null; }
      return code;
    },
    async lock(roomId, code) {
      const { error } = await sb.rpc("set_room_lock", { p_room: roomId, p_code: code });
      if (error) toast(t("error") + error.message);
      return !error;
    },
    validCode: (c) => /^[0-9]{4,8}$/.test(c || ""),
    // 📝 the note at the top of the room
    paint() {
      const el = document.getElementById("room-board"); if (!el) return;
      const r = typeof currentRoom !== "undefined" ? currentRoom : null;
      const host = !!r && typeof amHost === "function" && amHost();
      if (!r || (!r.board && !host)) { el.hidden = true; return; }
      el.hidden = false;
      el.classList.toggle("add", !r.board);
      el.classList.toggle("host", host);
      el.innerHTML = r.board ? `<small>${esc(t("rp_board"))}</small><span dir="auto">${esc(r.board)}</span>` : esc(t("rp_boardAdd"));
      el.onclick = host ? () => RoomsPlus.editBoard() : null;
    },
    async editBoard() {
      const r = currentRoom; if (!r) return;
      const v = prompt(t("rp_boardAsk"), r.board || "");
      if (v === null) return;
      const { data, error } = await sb.rpc("set_room_board", { p_room: r.id, p_text: v });
      if (error) return toast(t("error") + error.message);
      r.board = data || null; RoomsPlus.paint();
    },
    // a change to the room came in live (the note changed)
    update(row) {
      if (!row || typeof currentRoom === "undefined" || !currentRoom || row.id !== currentRoom.id) return;
      if ("board" in row) { currentRoom.board = row.board; RoomsPlus.paint(); }
    },
  };
})();
