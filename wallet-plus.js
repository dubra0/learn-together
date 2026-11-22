/* 💰 Wallet extras (needs supabase/update-39-wallet-plus.sql)
   💌 a message with a gift (the box is in the gift sheet; wallet.js sends it)
   🧧 red packet: the 🧧 button in a live → put coins in; everyone in the room taps the 🧧 that appears and gets a random share */
(() => {
  const W2 = {
    en: { wp_notePh: "💌 Add a message (optional)", wp_rp: "🧧 Red packet", wp_rpSub: "Put coins in this live. Everyone here can tap it and get a random share.",
      wp_total: "Coins in total", wp_shares: "For how many people", wp_put: "🧧 Put it in the live", wp_noCoins: "🪙 You don't have enough coins", wp_bad: "At least 10 coins, and at least 1 coin for each person",
      wp_slow: "Wait a moment before the next red packet", wp_sent: "🧧 Red packet sent!", wp_new: "🧧 {name} put {n} coins for {k} people — tap the 🧧!", wp_got: "🧧 You got {n} 🪙!",
      wp_already: "You already took {n} 🪙 from this one", wp_own: "That's your own red packet", wp_empty: "😅 Too late — it's empty", wp_left: "{n} left", wp_coins: "🪙 Your coins: {n}" },
    ckb: { wp_notePh: "💌 نامەیەک بنووسە (ئارەزوومەندانە)", wp_rp: "🧧 پاکەتی سوور", wp_rpSub: "کۆین لەم لایڤەدا دابنێ. هەموو کەسێکی ئێرە دەتوانێت دەستی لێ بدات و بەشێکی هەڕەمەکی وەربگرێت.",
      wp_total: "کۆی کۆینەکان", wp_shares: "بۆ چەند کەس", wp_put: "🧧 دایبنێ لە لایڤەکە", wp_noCoins: "🪙 کۆینی پێویستت نییە", wp_bad: "لانیکەم ١٠ کۆین، و بۆ هەر کەسێک لانیکەم ١ کۆین",
      wp_slow: "کەمێک چاوەڕێ بکە پێش پاکەتی داهاتوو", wp_sent: "🧧 پاکەتی سوور نێردرا!", wp_new: "🧧 {name} {n} کۆینی بۆ {k} کەس دانا — دەست لە 🧧 بدە!", wp_got: "🧧 {n} 🪙 ت وەرگرت!",
      wp_already: "پێشتر {n} 🪙 ت لەمە وەرگرتووە", wp_own: "ئەمە پاکەتی خۆتە", wp_empty: "😅 درەنگ بوو — بەتاڵ بوو", wp_left: "{n} ماوە", wp_coins: "🪙 کۆینەکانت: {n}" },
    ar: { wp_notePh: "💌 أضف رسالة (اختياري)", wp_rp: "🧧 الظرف الأحمر", wp_rpSub: "ضع عملات في هذا البث. يستطيع الجميع هنا لمسه والحصول على حصة عشوائية.",
      wp_total: "مجموع العملات", wp_shares: "لكم شخص", wp_put: "🧧 ضعه في البث", wp_noCoins: "🪙 عملاتك لا تكفي", wp_bad: "10 عملات على الأقل، وعملة واحدة على الأقل لكل شخص",
      wp_slow: "انتظر قليلاً قبل الظرف التالي", wp_sent: "🧧 تم إرسال الظرف الأحمر!", wp_new: "🧧 وضع {name} {n} عملة لـ {k} أشخاص — المس 🧧!", wp_got: "🧧 حصلت على {n} 🪙!",
      wp_already: "أخذت {n} 🪙 من هذا من قبل", wp_own: "هذا ظرفك أنت", wp_empty: "😅 تأخرت — فرغ", wp_left: "بقي {n}", wp_coins: "🪙 عملاتك: {n}" },
  };
  try { for (const [l, o] of Object.entries(W2)) if (I18N[l]) Object.assign(I18N[l], o); } catch {}

  const css = document.createElement("style");
  css.textContent = `
  .pg-note{width:100%;box-sizing:border-box;margin-top:10px;padding:10px 14px;border-radius:14px;border:1.5px solid var(--line);background:var(--card);color:var(--ink);font:inherit;font-size:.9rem}
  .pg-note:focus{outline:none;border-color:var(--brand)}
  #rp-float{position:absolute;top:calc(70px + env(safe-area-inset-top));inset-inline-end:10px;z-index:7;display:flex;flex-direction:column;gap:8px;align-items:flex-end;pointer-events:none}
  #rp-float button{pointer-events:auto;border:0;cursor:pointer;border-radius:16px;padding:6px 10px 6px 6px;display:flex;align-items:center;gap:6px;color:#fff;font:inherit;font-weight:800;font-size:.75rem;
    background:linear-gradient(135deg,#ef4444,#b91c1c);box-shadow:0 6px 18px rgba(185,28,28,.5);animation:rpbob 1.6s ease-in-out infinite}
  #rp-float button .e{font-size:1.6rem;line-height:1}
  #rp-float button .s{display:block;font-size:.65rem;opacity:.85;font-weight:700}
  @keyframes rpbob{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-4px) rotate(3deg)}}
  @media (prefers-reduced-motion:reduce){#rp-float button{animation:none}}
  .rp-burst{position:fixed;left:50%;top:42%;transform:translate(-50%,-50%);z-index:80;font-size:2.4rem;font-weight:900;color:#fff;text-shadow:0 4px 18px rgba(0,0,0,.5);
    pointer-events:none;animation:rpb 1.6s ease-out forwards;white-space:nowrap}
  @keyframes rpb{0%{opacity:0;transform:translate(-50%,-50%) scale(.4)}20%{opacity:1;transform:translate(-50%,-50%) scale(1.2)}100%{opacity:0;transform:translate(-50%,-140%) scale(1)}}
  .rp-form{display:grid;gap:10px;margin:10px 0}.rp-form label{display:grid;gap:4px;font-weight:700;font-size:.85rem}
  .rp-form input{padding:10px 12px;border-radius:12px;border:1.5px solid var(--line);background:var(--card);color:var(--ink);font:inherit}`;
  document.head.appendChild(css);

  const fmt = (n) => Number(n || 0).toLocaleString("en-US");
  let chan = null, chanRoom = null;
  const packets = new Map();   // id → packet (open ones in this live)

  function floatBox() {
    let f = document.getElementById("rp-float");
    if (!f) { const room = document.getElementById("screen-room"); if (!room) return null; f = document.createElement("div"); f.id = "rp-float"; room.appendChild(f); }
    return f;
  }
  function paint() {
    const f = floatBox(); if (!f) return;
    const now = Date.now();
    const open = [...packets.values()].filter((p) => new Date(p.expires_at).getTime() > now && p.left_shares > 0 && p.mine == null && p.from_id !== me.id);
    f.innerHTML = open.slice(0, 3).map((p) => `<button type="button" data-rp="${p.id}"><span class="e">🧧</span><span>${esc(String(p.from_name || "").slice(0, 14))}<span class="s">${esc(t("wp_left", { n: p.left_shares }))}</span></span></button>`).join("");
  }
  async function claim(id) {
    const { data, error } = await sb.rpc("claim_red_packet", { p_id: id });
    if (error) return toast(t("error") + error.message);
    const r = (Array.isArray(data) ? data[0] : data) || {};
    const p = packets.get(id);
    if (r.o_status === "ok") {
      if (p) { p.mine = r.o_coins; p.left_shares = Math.max(0, p.left_shares - 1); }
      const b = document.createElement("div"); b.className = "rp-burst"; b.textContent = `+${fmt(r.o_coins)} 🪙`; document.body.appendChild(b); setTimeout(() => b.remove(), 1700);
      toast(t("wp_got", { n: fmt(r.o_coins) }));
      if (typeof addSystem === "function") addSystem(`🧧 ${profile?.name || ""} +${fmt(r.o_coins)} 🪙`);
      if (typeof loadWallet === "function") loadWallet().catch(() => {});
    } else if (r.o_status === "already") { if (p) p.mine = r.o_coins; toast(t("wp_already", { n: fmt(r.o_coins) })); }
    else if (r.o_status === "own") toast(t("wp_own"));
    else { if (p) p.left_shares = 0; toast(t("wp_empty")); }
    paint();
  }
  async function loadOpen(roomId) {
    try {
      const { data } = await sb.rpc("room_red_packets", { p_room: roomId });
      if (chanRoom !== roomId) return;
      (data || []).forEach((p) => packets.set(p.id, p));
      paint();
    } catch {}
  }
  // the live I'm in: listen for new red packets only while I'm there
  function sync() {
    const id = (typeof currentRoom !== "undefined" && currentRoom?.id) || null;
    const btn = document.getElementById("rp-btn"); if (btn) btn.hidden = !id;
    if (id === chanRoom) return;
    if (chan) { try { sb.removeChannel(chan); } catch {} chan = null; }
    chanRoom = id; packets.clear(); paint();
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return;
    chan = sb.channel("rp-room-" + id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "red_packets", filter: `room_id=eq.${id}` }, (pl) => {
        const p = pl.new; if (!p || (typeof blocked !== "undefined" && blocked.has(p.from_id))) return;
        packets.set(p.id, { ...p, mine: null });
        if (typeof addSystem === "function") addSystem(t("wp_new", { name: p.from_name || "", n: fmt(p.total), k: p.shares }));
        paint();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "red_packets", filter: `room_id=eq.${id}` }, (pl) => {
        const p = pl.new, old = packets.get(p?.id); if (!p || !old) return;
        old.left_shares = p.left_shares; if (p.refunded) old.left_shares = 0; paint();
      })
      .subscribe();
    loadOpen(id);
  }
  async function openCreate() {
    if (typeof currentRoom === "undefined" || !currentRoom) return;
    let coins = 0;
    try { const w = typeof loadWallet === "function" ? await loadWallet() : null; coins = w?.coins || 0; } catch {}
    openSheet(`<h1>${esc(t("wp_rp"))}</h1><p class="muted small">${esc(t("wp_rpSub"))}</p>
      <div class="rp-form"><label>${esc(t("wp_total"))}<input id="rp-total" type="number" inputmode="numeric" min="10" step="10" value="100"></label>
        <label>${esc(t("wp_shares"))}<input id="rp-shares" type="number" inputmode="numeric" min="1" max="100" value="5"></label></div>
      <div class="muted small" style="margin-bottom:10px">${esc(t("wp_coins", { n: fmt(coins) }))}</div>
      <button type="button" class="btn block" id="rp-go">${esc(t("wp_put"))}</button>`);
    document.getElementById("rp-go").addEventListener("click", async (e) => {
      const total = Math.floor(Number(document.getElementById("rp-total").value)), shares = Math.floor(Number(document.getElementById("rp-shares").value));
      if (!(total >= 10) || !(shares >= 1) || shares > 100 || total < shares) return toast(t("wp_bad"));
      if (total > coins) return toast(t("wp_noCoins"));
      e.currentTarget.disabled = true;
      const { data, error } = await sb.rpc("create_red_packet", { p_room: currentRoom.id, p_total: total, p_shares: shares });
      const r = (Array.isArray(data) ? data[0] : data) || {};
      if (error) { e.currentTarget.disabled = false; return toast(t("error") + error.message); }
      if (r.o_status !== "ok") { e.currentTarget.disabled = false; return toast(r.o_status === "no_coins" ? t("wp_noCoins") : r.o_status === "slow_down" ? t("wp_slow") : t("wp_bad")); }
      closeSheet(); toast(t("wp_sent"));
      if (typeof addSystem === "function") addSystem(t("wp_new", { name: profile?.name || "", n: fmt(total), k: shares }));
      if (typeof loadWallet === "function") loadWallet().catch(() => {});
    });
  }

  // the 🧧 button next to 🎁 in a live
  function addButton() {
    const gift = document.getElementById("gift-btn");
    if (!gift || document.getElementById("rp-btn")) return;
    const b = document.createElement("button"); b.type = "button"; b.className = "s-round"; b.id = "rp-btn"; b.title = "red packet"; b.textContent = "🧧"; b.hidden = true;
    b.addEventListener("click", openCreate);
    gift.before(b);
  }
  document.addEventListener("click", (e) => { const b = e.target.closest("#rp-float [data-rp]"); if (b) claim(Number(b.dataset.rp)); });

  window.WalletPlus = { openCreate };
  const boot = setInterval(() => {
    if (typeof sb !== "undefined" && sb && typeof me !== "undefined" && me) { clearInterval(boot); addButton(); setInterval(sync, 1000); setInterval(paint, 15000); }
  }, 1000);
})();
