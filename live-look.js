/* 🎙️ The new look of a live room
   - top: host photo · room name · Lv · ID · ＋follow · share · ⏻
   - under it: 🏆 coins gifted in this live (tap → top gifters) · photos of the people here + 👤 count (tap → list)
   - seats in rows of 5, the note board, chat
   - bottom: 🔊 sound · 💬 write · (🎙️ / ✋) · 🎁 · ⌘ more tools
   - ⏻ → "Minimize" (keep listening while you use the app; a bubble brings you back) or "Exit" */
(() => {
  const W = {
    en: { ll_min: "Minimize", ll_exit: "Exit", ll_tools: "More", ll_back: "Back to the live", ll_soundOff: "🔈 Room sound off", ll_soundOn: "🔊 Room sound on",
      ll_inLive: "You're in a live — exit it first", stageFull: "The stage is full (10 seats)." },
    ckb: { ll_min: "بچووککردنەوە", ll_exit: "دەرچوون", ll_tools: "زیاتر", ll_back: "گەڕانەوە بۆ لایڤ", ll_soundOff: "🔈 دەنگی ژوورەکە کوژایەوە", ll_soundOn: "🔊 دەنگی ژوورەکە هەڵکرا",
      ll_inLive: "تۆ لە لایڤێکدایت — سەرەتا لێی دەربچۆ", stageFull: "شانۆکە پڕە (١٠ کورسی)." },
    ar: { ll_min: "تصغير", ll_exit: "خروج", ll_tools: "المزيد", ll_back: "العودة إلى البث", ll_soundOff: "🔈 صوت الغرفة مغلق", ll_soundOn: "🔊 صوت الغرفة مفتوح",
      ll_inLive: "أنت في بث — اخرج منه أولاً", stageFull: "المنصة ممتلئة (10 مقاعد)." },
  };
  try { for (const [l, o] of Object.entries(W)) if (I18N[l]) Object.assign(I18N[l], o); } catch {}

  const css = document.createElement("style");
  css.textContent = `
  /* a dark, golden room (a background the host picks still wins) */
  #screen-room.stage-screen{background:
    radial-gradient(120% 60% at 110% 20%,rgba(212,160,60,.20),transparent 55%),
    radial-gradient(90% 50% at -20% 75%,rgba(212,160,60,.14),transparent 60%),
    linear-gradient(160deg,#0b0b0e 0%,#121218 45%,#08080a 100%)}
  #screen-room.stage-screen{isolation:isolate}
  #screen-room.stage-screen::before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.55;z-index:-1;
    background:
      radial-gradient(140% 90% at 120% 10%,transparent 58%,rgba(232,186,90,.55) 58.3%,transparent 58.9%),
      radial-gradient(150% 100% at -30% 95%,transparent 60%,rgba(232,186,90,.45) 60.3%,transparent 60.8%),
      radial-gradient(120% 80% at 130% 70%,transparent 62%,rgba(255,215,140,.35) 62.2%,transparent 62.6%)}
  #screen-room.video-mode::before,#screen-room.rl-on::before{display:none}

  /* top bar */
  #screen-room .stage-head{gap:8px}
  #screen-room .stage-head #room-back{display:none}
  .ll-card{flex:1;min-width:0;display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:5px 6px 5px 5px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
  .ll-card .ll-av .av{width:44px;height:44px;border-radius:12px;font-size:1rem}
  .ll-card .s-title .t{font-size:.98rem}
  .ll-card .s-sub .tg{background:rgba(255,255,255,.14)}
  .ll-card .s-sub .tg.ll-lv{background:#22c55e;color:#04210f}
  .ll-card .s-sub .tg.ll-id{background:none;padding:0;font-weight:800;opacity:.9}
  .ll-card .s-sub .tg.live{display:none}
  #screen-room .s-follow{border-radius:12px;padding:0;width:44px;height:38px;display:grid;place-items:center;font-size:0;background:#3b82f6;color:#fff;flex:0 0 auto}
  #screen-room .s-follow::before{content:"";width:22px;height:22px;background:currentColor;
    -webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M15 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm-9 0V9H4v3H1v2h3v3h2v-3h3v-2zm9 2c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4z'/%3E%3C/svg%3E") center/contain no-repeat;
            mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M15 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm-9 0V9H4v3H1v2h3v3h2v-3h3v-2zm9 2c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4z'/%3E%3C/svg%3E") center/contain no-repeat}
  #screen-room .s-follow.on{background:rgba(255,255,255,.16)}
  #screen-room .s-follow.on::before{-webkit-mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z'/%3E%3C/svg%3E");mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z'/%3E%3C/svg%3E")}
  #screen-room .stage-head .s-btn{background:none}
  #screen-room .stage-head .s-btn svg{width:24px;height:24px}
  #screen-room #room-eye{display:none}

  /* 🏆 + people row */
  .ll-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:0 12px 6px}
  .ll-trophy{display:inline-flex;align-items:center;gap:8px;border:0;cursor:pointer;color:#ffd77a;font:inherit;font-weight:900;font-size:.9rem;
    padding:6px 22px 6px 12px;background:linear-gradient(90deg,rgba(90,70,40,.9),rgba(60,50,35,.55));clip-path:polygon(0 0,100% 0,88% 50%,100% 100%,0 100%);font-variant-numeric:tabular-nums}
  .ll-trophy .i{font-size:1.15rem}
  .ll-ppl{display:flex;align-items:center;gap:6px;border:0;background:none;cursor:pointer;color:#fff;font:inherit;padding:0}
  .ll-ppl .stk{display:flex}.ll-ppl .stk .av{width:28px;height:28px;font-size:.7rem;border:2px solid #15151a}.ll-ppl .stk .av+.av{margin-inline-start:-10px}
  .ll-ppl .n{background:rgba(255,255,255,.9);color:#111;border-radius:999px;padding:3px 10px;font-weight:900;font-size:.82rem;font-variant-numeric:tabular-nums}
  #screen-room #top-gifters{display:none}

  /* seats: rows of 5 */
  #screen-room .seats{grid-template-columns:repeat(5,1fr);gap:14px 4px}
  #screen-room .seat .ring2{width:60px;height:60px;padding:2px}
  #screen-room .seat .ring2 .av{width:56px;height:56px;font-size:1.15rem}
  #screen-room .seat.empty .ring2{width:60px;height:60px;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,215,140,.25)}
  #screen-room .seat .nm{font-size:.74rem;max-width:66px;font-weight:700}
  #screen-room .seat .flag-b,#screen-room .seat .muted-ic{width:18px;height:18px;font-size:.6rem}
  #screen-room #audience{display:none}
  #screen-room #room-board{background:rgba(20,20,24,.72);border:1px solid rgba(255,255,255,.14);border-radius:14px}

  /* bottom bar */
  #screen-room .s-bottom{background:linear-gradient(180deg,transparent,rgba(0,0,0,.55) 35%)}
  #screen-room .s-form{flex-wrap:wrap}
  #screen-room .s-form input,#screen-room .s-form .send{display:none}
  #screen-room.ll-typing .s-form input{display:block;order:-2;flex:1 1 calc(100% - 56px)}
  #screen-room.ll-typing .s-form .send{display:grid;order:-1}
  #screen-room .s-round{background:rgba(255,255,255,.14);border:1.5px solid rgba(255,255,255,.22);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
  #screen-room .s-round.ll-gift{background:radial-gradient(circle at 50% 40%,#5a4320,#2a2010);border-color:#c9a24a;width:52px;height:52px;flex-basis:52px;font-size:1.4rem}
  #screen-room .ll-spacer{flex:1}
  #screen-room .s-round.ll-off{background:rgba(239,68,68,.75)}
  .ll-tools{position:absolute;bottom:calc(100% + 6px);inset-inline-end:12px;display:none;grid-template-columns:repeat(4,52px);gap:10px;padding:12px;border-radius:20px;
    background:rgba(20,20,26,.92);border:1px solid rgba(255,255,255,.12);box-shadow:0 12px 34px rgba(0,0,0,.5);z-index:20}
  .ll-tools.on{display:grid}
  .ll-tools .s-round{width:52px;height:52px;flex:none}
  .ll-tools .s-round[hidden]{display:none}

  /* ⏻ minimize / exit */
  .ll-exit{position:fixed;inset:0;z-index:90;background:rgba(0,0,0,.55);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);display:flex;justify-content:center;gap:44px;
    padding-top:calc(90px + env(safe-area-inset-top));align-items:flex-start}
  .ll-exit button{border:0;background:none;color:#fff;font:inherit;font-weight:800;display:flex;flex-direction:column;align-items:center;gap:10px;cursor:pointer}
  .ll-exit .c{width:88px;height:88px;border-radius:50%;background:rgba(255,255,255,.78);color:#222;display:grid;place-items:center}
  .ll-exit .c svg{width:36px;height:36px}
  /* the bubble while the live is minimized */
  #ll-mini{position:fixed;inset-inline-end:14px;bottom:calc(var(--tabbar,68px) + 26px + env(safe-area-inset-bottom));z-index:45;width:62px;height:62px;border-radius:50%;border:0;padding:0;cursor:pointer;
    box-shadow:0 0 0 3px #e8ba5a,0 10px 26px rgba(0,0,0,.45);background:#111;overflow:visible}
  #ll-mini .av{width:62px;height:62px;border-radius:50%}
  #ll-mini::after{content:"";position:absolute;inset:-7px;border-radius:50%;border:2px solid rgba(232,186,90,.7);animation:llpulse 1.6s ease-out infinite}
  #ll-mini .eq{position:absolute;bottom:-4px;left:50%;transform:translateX(-50%);background:#e8ba5a;color:#2a1c00;border-radius:999px;padding:1px 7px;font-size:.62rem;font-weight:900}
  @keyframes llpulse{from{transform:scale(.9);opacity:1}to{transform:scale(1.25);opacity:0}}
  @media (prefers-reduced-motion:reduce){#ll-mini::after{animation:none}}`;
  document.head.appendChild(css);

  const ICON_POWER = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 3v9"/><path d="M6.3 6.3a8 8 0 1 0 11.4 0"/></svg>`;
  const ICON_MIN = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/></svg>`;
  const ICON_SOUND = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>`;
  const ICON_CHAT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12Z"/></svg>`;
  const ICON_TOOLS = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6a3 3 0 1 0-3 3h3zM15 6a3 3 0 1 1 3 3h-3zM9 18a3 3 0 1 1-3-3h3zM15 18a3 3 0 1 0 3-3h-3zM9 9h6v6H9z"/></svg>`;

  const $r = (s) => document.querySelector("#screen-room " + s);
  let built = false, soundOff = false, minimized = false;

  function build() {
    if (built) return;
    const head = $r(".stage-head"), title = $r(".s-title"), form = document.getElementById("chat-form");
    if (!head || !title || !form) return;
    built = true;
    // top: [photo · name · Lv · ID] [＋] [share] [⏻]
    const card = document.createElement("div"); card.className = "ll-card";
    card.innerHTML = `<span class="ll-av" id="ll-av"></span>`;
    title.before(card); card.appendChild(title);
    const follow = document.getElementById("room-follow"); if (follow) card.appendChild(follow);
    const pw = document.createElement("button"); pw.type = "button"; pw.className = "s-btn"; pw.id = "ll-power"; pw.setAttribute("aria-label", t("ll_exit")); pw.innerHTML = ICON_POWER;
    head.appendChild(pw);
    pw.addEventListener("click", openExit);
    card.querySelector("#ll-av").addEventListener("click", () => { if (currentRoom) openProfile(currentRoom.host_id); });
    // 🏆 + people
    const row = document.createElement("div"); row.className = "ll-row";
    row.innerHTML = `<button type="button" class="ll-trophy" id="ll-trophy"><span class="i">🏆</span><span id="ll-coins">0</span><span>›</span></button>
      <button type="button" class="ll-ppl" id="ll-ppl"><span class="stk" id="ll-stk"></span><span class="n" id="ll-n">👤 0</span></button>`;
    head.after(row);
    row.querySelector("#ll-trophy").addEventListener("click", () => window.TopGifters?.openRoom());
    row.querySelector("#ll-ppl").addEventListener("click", () => { if (typeof openAudienceSheet === "function") openAudienceSheet(); });
    // bottom: [🔊] [💬] ……… [🎙️/✋] [🎁] [⌘]
    const sound = mk("ll-sound", ICON_SOUND), chat = mk("ll-chat", ICON_CHAT), tools = mk("ll-toolsbtn", ICON_TOOLS), spacer = document.createElement("span");
    spacer.className = "ll-spacer";
    const panel = document.createElement("div"); panel.className = "ll-tools"; panel.id = "ll-tools";
    form.prepend(sound, chat, spacer);
    const gift = document.getElementById("gift-btn");
    if (gift) { gift.classList.add("ll-gift"); form.appendChild(gift); }
    form.appendChild(tools);
    $r(".s-bottom").appendChild(panel);
    ["topic-btn", "bg-btn", "stage-down-btn", "filter-btn", "flip-btn", "cam-btn", "room-share", "room-more"].forEach((id) => {
      const el = document.getElementById(id); if (!el) return;
      if (id === "room-share" || id === "room-more") { el.classList.remove("s-btn"); el.classList.add("s-round"); }
      panel.appendChild(el);
    });
    // keep mic / hand next to the gift
    ["hand-btn", "mic-btn"].forEach((id) => { const el = document.getElementById(id); if (el && gift) gift.before(el); });
    sound.addEventListener("click", () => {
      soundOff = !soundOff; applySound();
      sound.classList.toggle("ll-off", soundOff); toast(soundOff ? t("ll_soundOff") : t("ll_soundOn"));
    });
    chat.addEventListener("click", () => {
      const on = !document.getElementById("screen-room").classList.contains("ll-typing");
      document.getElementById("screen-room").classList.toggle("ll-typing", on);
      if (on) document.getElementById("chat-input")?.focus();
    });
    tools.addEventListener("click", (e) => { e.stopPropagation(); grabLate(); panel.classList.toggle("on"); });
    document.addEventListener("click", (e) => { if (!e.target.closest("#ll-tools, #ll-toolsbtn")) panel.classList.remove("on"); });
    panel.addEventListener("click", (e) => { if (e.target.closest("button")) setTimeout(() => panel.classList.remove("on"), 50); });
    form.addEventListener("submit", () => setTimeout(() => document.getElementById("screen-room").classList.remove("ll-typing"), 0));
  }
  function mk(id, svg) { const b = document.createElement("button"); b.type = "button"; b.className = "s-round"; b.id = id; b.innerHTML = svg; return b; }
  // buttons other parts add later (🧧) go into ⌘ too
  function grabLate() { const rp = document.getElementById("rp-btn"), panel = document.getElementById("ll-tools"); if (rp && panel && rp.parentElement !== panel) panel.appendChild(rp); }
  function applySound() {
    try { if (lk) lk.remoteParticipants.forEach((p) => p.setVolume?.(soundOff || blocked.has(p.identity) ? 0 : 1)); } catch {}
    document.querySelectorAll("#audio-sink audio").forEach((a) => (a.muted = soundOff));
  }

  // the host's photo, level and 10-digit ID in the top card (called again each time the header is redrawn)
  let headFor = null, headInfo = null;
  function putTags() {
    const tags = document.getElementById("room-tags"); if (!tags || !headInfo) return;
    tags.querySelectorAll(".ll-lv,.ll-id").forEach((x) => x.remove());
    const { lv, pid } = headInfo;
    tags.insertAdjacentHTML("afterbegin", `${lv ? `<span class="tg ll-lv">Lv.${lv}</span>` : ""}${pid ? `<span class="tg ll-id">ID:${esc(String(pid))}</span>` : ""}`);
  }
  async function header() {
    build();
    const r = typeof currentRoom !== "undefined" ? currentRoom : null; if (!r) return;
    const av = document.getElementById("ll-av");
    if (av) av.innerHTML = avHtml(r.host_name, r.host_avatar, "sm");
    if (headFor === r.id) return putTags();
    headFor = r.id; headInfo = null;
    let host = null, pid = null;
    try { [host, pid] = await Promise.all([getProfile(r.host_id), sb.rpc("public_id_of", { p_user: r.host_id }).then((x) => x.data, () => null)]); } catch {}
    if (!currentRoom || currentRoom.id !== r.id) return;
    headInfo = { lv: host && typeof coinLevel === "function" ? coinLevel(host) : null, pid };
    putTags();
  }
  // 🏆 coins gifted in this live
  let coinsSeq = 0;
  async function trophy() {
    const r = typeof currentRoom !== "undefined" ? currentRoom : null, el = document.getElementById("ll-coins");
    if (!r || !el) return;
    const my = ++coinsSeq;
    const since = r.starts_at && new Date(r.starts_at) < new Date() ? r.starts_at : r.created_at;
    try {
      const { data } = await sb.rpc("top_gifters", { p_room: r.id, p_since: since, p_limit: 200 });
      if (my !== coinsSeq) return;
      const sum = (data || []).reduce((s, x) => s + Number(x.coins || 0), 0);
      el.textContent = sum >= 1e6 ? (sum / 1e6).toFixed(1) + "M" : sum >= 1e3 ? (sum / 1e3).toFixed(1) + "K" : String(sum);
    } catch {}
  }
  // the photos of people here + how many
  function people() {
    if (typeof lk === "undefined" || !lk) return;
    const all = [lk.localParticipant, ...lk.remoteParticipants.values()];
    const n = document.getElementById("ll-n"), stk = document.getElementById("ll-stk");
    if (n) n.textContent = `👤 ${all.length}`;
    if (stk) {
      const ls = all.filter((p) => !(typeof isSpeaker === "function" && isSpeaker(p))).slice(0, 3);
      stk.innerHTML = ls.map((p) => avHtml(p.name, (typeof partMeta === "function" ? partMeta(p) : {}).avatar, "xs")).join("");
    }
  }

  /* ⏻ */
  function openExit() {
    const o = document.createElement("div"); o.className = "ll-exit";
    o.innerHTML = `<button type="button" data-x="min"><span class="c">${ICON_MIN}</span>${esc(t("ll_min"))}</button>
      <button type="button" data-x="exit"><span class="c">${ICON_POWER}</span>${esc(t("ll_exit"))}</button>`;
    document.body.appendChild(o);
    o.addEventListener("click", (e) => {
      const b = e.target.closest("[data-x]");
      o.remove();
      if (!b) return;
      if (b.dataset.x === "min") minimize();
      else if (typeof tryLeave === "function") tryLeave();
    });
  }
  function minimize() {
    if (typeof lk === "undefined" || !lk || !currentRoom) return;
    minimized = true;
    closeSheet();
    goMain();
    let m = document.getElementById("ll-mini");
    if (!m) {
      m = document.createElement("button"); m.type = "button"; m.id = "ll-mini"; m.setAttribute("aria-label", t("ll_back"));
      document.body.appendChild(m);
      m.addEventListener("click", restore);
    }
    m.innerHTML = `${avHtml(currentRoom.host_name, currentRoom.host_avatar, "md")}<span class="eq">LIVE</span>`;
    m.hidden = false;
  }
  function restore() {
    const m = document.getElementById("ll-mini"); if (m) m.hidden = true;
    minimized = false;
    if (typeof lk !== "undefined" && lk && currentRoom) { show("screen-room"); if (typeof renderPeople === "function") renderPeople(); }
  }

  window.LiveLook = { header, isMinimized: () => minimized, restore };

  // keep everything up to date while a live is open (cheap checks)
  setInterval(() => {
    const inLive = typeof lk !== "undefined" && !!lk && typeof currentRoom !== "undefined" && !!currentRoom;
    const m = document.getElementById("ll-mini");
    if (!inLive) { minimized = false; headFor = null; if (m) m.hidden = true; document.getElementById("screen-room")?.classList.remove("ll-typing"); return; }
    // back on the live screen some other way → no bubble
    if (minimized && !document.getElementById("screen-room").hidden) { minimized = false; if (m) m.hidden = true; }
    people(); grabLate();
    if (soundOff) applySound();
  }, 1000);
  setInterval(trophy, 15000);
  const boot = setInterval(() => { if (document.getElementById("chat-form")) { clearInterval(boot); build(); } }, 300);
  // a gift in this live → the 🏆 number soon
  const _soon = window.TopGifters?.soon;
  if (window.TopGifters && _soon) window.TopGifters.soon = function () { _soon.apply(this, arguments); clearTimeout(trophy._t); trophy._t = setTimeout(trophy, 1500); };
  // the first number when a live opens
  let lastId = null;
  setInterval(() => { const id = typeof currentRoom !== "undefined" && currentRoom ? currentRoom.id : null; if (id !== lastId) { lastId = id; if (id) { header(); trophy(); } } }, 700);
})();
