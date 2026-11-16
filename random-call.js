/* =====================================================================
   📞 Random call: a one-to-one voice call with anyone (any country, any language)
   - free: 30 minutes a day, each call up to 10 minutes · ➕ 5 min = 500 🪙 · ⭐ Premium 30 days = 15,000 🪙 (5 h a day)
   - 18+ only · blocked people are never matched · report / block in one tap
   Server: supabase/update-16-random-call.sql (matching + minutes + buying) and smooth-worker action "rc_token".
   Uses globals from app.js: sb, me, profile, lk, CONFIG, LivekitClient, $, esc, t, I18N, avHtml, flag, lvHtml, getProfile,
   toggleFollow, toggleBlock, following, openReport, openPaidGifts, openSheet, closeSheet, toast, VOICE_PUBLISH.
   ===================================================================== */
"use strict";

(() => {
  const W = {
    en: { rc_card: "📞 Talk to someone new", rc_cardSub: "A random voice call with anyone in the world", rc_title: "📞 New friend",
      rc_heroT: "Talk to someone new", rc_heroS: "Anyone, from any country · voice only", rc_online: "{n} people in calls now", rc_start: "📞 Start",
      rc_free: "🆓 Free", rc_freeBig: "30 min", rc_freeSub: "a day · each call up to 10 min", rc_pro: "⭐ Premium", rc_proBig: "5 hours", rc_proSub: "a day · 15,000 🪙 / month",
      rc_today: "Today", rc_plus5: "➕ 5 min · 500 🪙", rc_buyPro: "⭐ Premium · 15,000 🪙", rc_coins: "🪙 Your coins: {n}", rc_rules18: "🔞 18+ only",
      rc_rulesRep: "🚩 If someone is rude, report or block them with one tap", rc_searching: "Looking for someone…", rc_cancel: "Cancel",
      rc_topic: "💡 Something to talk about", rc_topicNext: "🔄 Another topic", rc_mic: "Mic", rc_speaker: "Sound", rc_gift: "Gift", rc_follow: "Follow",
      rc_next: "⏭️ Someone else", rc_end: "📵 End", rc_report: "🚩 Report", rc_block: "⛔ Block", rc_talked: "Talked for {t}", rc_how: "How was it?",
      rc_new: "📞 Someone new", rc_back: "Back", rc_followBig: "＋ Follow, to talk again", rc_left: "{name} left the call",
      rc_callOver: "⏱️ This call's 10 minutes are over", rc_callOverS: "Start a new call, or get ⭐ Premium for up to 5 hours a day",
      rc_dayOver: "⏱️ Your 30 minutes for today are used up", rc_dayOverS: "You get 30 new minutes tomorrow, or buy more below",
      rc_18T: "🔞 Are you 18 or older?", rc_18S: "Random calls are only for adults. Be kind: rude people get reported and removed.", rc_18Yes: "Yes, I'm 18+", rc_18No: "No",
      rc_inLive: "Leave the live room first", rc_noCoins: "🪙 Not enough coins", rc_bought5: "✅ +5 minutes added for today", rc_boughtPro: "⭐ Premium is on for 30 days",
      rc_proOn: "⭐ Premium until {d}", rc_fail: "Could not connect the call: ", rc_banned: "Your account is blocked.", rc_thanks: "Thanks! ⭐", rc_followed: "✅ Following" },
    ckb: { rc_card: "📞 قسە لەگەڵ کەسێکی نوێ", rc_cardSub: "پەیوەندی دەنگی هەڕەمەکی لەگەڵ هەر کەسێک لە جیهاندا", rc_title: "📞 هاوڕێی نوێ",
      rc_heroT: "قسە لەگەڵ کەسێکی نوێ بکە", rc_heroS: "هەر کەسێک لە هەر وڵاتێک · تەنها بە دەنگ", rc_online: "{n} کەس ئێستا لە پەیوەندیدان", rc_start: "📞 دەست پێبکە",
      rc_free: "🆓 بەخۆڕایی", rc_freeBig: "30 خولەک", rc_freeSub: "ڕۆژانە · هەر پەیوەندییەک تا 10 خولەک", rc_pro: "⭐ Premium", rc_proBig: "5 کاتژمێر", rc_proSub: "ڕۆژانە · 15,000 🪙 لە مانگێکدا",
      rc_today: "ئەمڕۆ", rc_plus5: "➕ 5 خولەک · 500 🪙", rc_buyPro: "⭐ Premium · 15,000 🪙", rc_coins: "🪙 سکەکانت: {n}", rc_rules18: "🔞 تەنها بۆ ١٨ ساڵ بەسەرەوە",
      rc_rulesRep: "🚩 هەر کەسێک خراپ بوو، بە یەک دەستلێدان ڕاپۆرت یان بلۆکی بکە", rc_searching: "دەگەڕێین بۆ کەسێک…", rc_cancel: "پاشگەزبوونەوە",
      rc_topic: "💡 بابەتێک بۆ قسەکردن", rc_topicNext: "🔄 بابەتێکی تر", rc_mic: "مایک", rc_speaker: "دەنگ", rc_gift: "دیاری", rc_follow: "فۆڵۆو",
      rc_next: "⏭️ کەسێکی تر", rc_end: "📵 کۆتایی", rc_report: "🚩 ڕاپۆرت", rc_block: "⛔ بلۆک", rc_talked: "ماوەی قسەکردن: {t}", rc_how: "چۆن بوو؟",
      rc_new: "📞 کەسێکی نوێ", rc_back: "گەڕانەوە", rc_followBig: "＋ فۆڵۆوی بکە بۆ ئەوەی جارێکی تر قسە بکەن", rc_left: "{name} پەیوەندییەکەی جێهێشت",
      rc_callOver: "⏱️ ١٠ خولەکی ئەم پەیوەندییە تەواو بوو", rc_callOverS: "دەتوانیت پەیوەندییەکی نوێ بکەیت، یان بە ⭐ Premium ڕۆژانە تا ٥ کاتژمێر قسە بکە",
      rc_dayOver: "⏱️ ٣٠ خولەکی ئەمڕۆت تەواو بوو", rc_dayOverS: "بەیانی دووبارە ٣٠ خولەکت دەبێت، یان لە خوارەوە زیاتر بکڕە",
      rc_18T: "🔞 تەمەنت ١٨ ساڵ یان زیاترە؟", rc_18S: "پەیوەندی هەڕەمەکی تەنها بۆ گەورەکانە. ڕێزدار بە: ئەوەی بێڕێزی بکات ڕاپۆرت دەکرێت و دەردەکرێت.", rc_18Yes: "بەڵێ، ١٨+ م", rc_18No: "نەخێر",
      rc_inLive: "سەرەتا لە لایڤەکە دەرچۆ", rc_noCoins: "🪙 سکەت بەس نییە", rc_bought5: "✅ +٥ خولەک زیاد کرا بۆ ئەمڕۆ", rc_boughtPro: "⭐ Premium بۆ ٣٠ ڕۆژ چالاک کرا",
      rc_proOn: "⭐ Premium تا {d}", rc_fail: "پەیوەندییەکە نەکرا: ", rc_banned: "ئەکاونتەکەت ڕاگیراوە.", rc_thanks: "سوپاس! ⭐", rc_followed: "✅ فۆڵۆوت کرد" },
    ar: { rc_card: "📞 تحدث مع شخص جديد", rc_cardSub: "مكالمة صوتية عشوائية مع أي شخص في العالم", rc_title: "📞 صديق جديد",
      rc_heroT: "تحدث مع شخص جديد", rc_heroS: "أي شخص من أي بلد · صوت فقط", rc_online: "{n} شخص في مكالمات الآن", rc_start: "📞 ابدأ",
      rc_free: "🆓 مجاني", rc_freeBig: "30 دقيقة", rc_freeSub: "يومياً · كل مكالمة حتى 10 دقائق", rc_pro: "⭐ Premium", rc_proBig: "5 ساعات", rc_proSub: "يومياً · 15,000 🪙 شهرياً",
      rc_today: "اليوم", rc_plus5: "➕ 5 دقائق · 500 🪙", rc_buyPro: "⭐ Premium · 15,000 🪙", rc_coins: "🪙 عملاتك: {n}", rc_rules18: "🔞 لمن هم فوق 18 فقط",
      rc_rulesRep: "🚩 إذا أساء أحد، أبلغ عنه أو احظره بلمسة", rc_searching: "نبحث عن شخص…", rc_cancel: "إلغاء",
      rc_topic: "💡 موضوع للحديث", rc_topicNext: "🔄 موضوع آخر", rc_mic: "الميكروفون", rc_speaker: "الصوت", rc_gift: "هدية", rc_follow: "متابعة",
      rc_next: "⏭️ شخص آخر", rc_end: "📵 إنهاء", rc_report: "🚩 إبلاغ", rc_block: "⛔ حظر", rc_talked: "مدة الحديث: {t}", rc_how: "كيف كانت؟",
      rc_new: "📞 شخص جديد", rc_back: "رجوع", rc_followBig: "＋ تابعه لتتحدثا مجدداً", rc_left: "غادر {name} المكالمة",
      rc_callOver: "⏱️ انتهت 10 دقائق هذه المكالمة", rc_callOverS: "ابدأ مكالمة جديدة أو احصل على ⭐ Premium حتى 5 ساعات يومياً",
      rc_dayOver: "⏱️ انتهت دقائقك الثلاثون لليوم", rc_dayOverS: "تحصل على 30 دقيقة جديدة غداً، أو اشترِ المزيد بالأسفل",
      rc_18T: "🔞 هل عمرك 18 أو أكثر؟", rc_18S: "المكالمات العشوائية للبالغين فقط. كن لطيفاً: من يسيء يُبلغ عنه ويُطرد.", rc_18Yes: "نعم، 18+", rc_18No: "لا",
      rc_inLive: "اخرج من البث أولاً", rc_noCoins: "🪙 عملاتك لا تكفي", rc_bought5: "✅ أضيفت 5 دقائق لليوم", rc_boughtPro: "⭐ تم تفعيل Premium لمدة 30 يوماً",
      rc_proOn: "⭐ Premium حتى {d}", rc_fail: "تعذر الاتصال: ", rc_banned: "حسابك محظور.", rc_thanks: "شكراً! ⭐", rc_followed: "✅ تمت المتابعة" },
  };
  try { for (const [l, o] of Object.entries(W)) if (I18N[l]) Object.assign(I18N[l], o); } catch {}

  const css = document.createElement("style");
  css.textContent = `
  .rc-home{cursor:pointer;display:grid;gap:14px}
  .rc-home .rh-row{display:flex;align-items:center;gap:12px}
  .rc-home .rh-globe{font-size:2.4rem;line-height:1}
  .rc-home .rh-row2{display:flex;align-items:center;justify-content:space-between;gap:10px}
  .rc-home .rh-online{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.1);border-radius:999px;padding:5px 12px;font-weight:800;font-size:.82rem;font-variant-numeric:tabular-nums}
  .rc-home .rh-online::before{content:"";width:8px;height:8px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 4px rgba(34,197,94,.25)}
  .rc-home .btn{box-shadow:none}
  .rc-card{display:flex;align-items:center;gap:12px;width:100%;margin:12px 0 0;padding:14px;border-radius:22px;border:1.5px solid var(--line);background:var(--card);cursor:pointer;text-align:start;color:var(--ink)}
  .rc-card .ic{width:48px;height:48px;border-radius:16px;background:var(--soft);display:grid;place-items:center;font-size:1.5rem;flex:0 0 auto}
  .rc-card b{display:block;font-weight:900}
  .rc-card span{display:block;color:var(--muted);font-size:.82rem}
  .rc-card .go{margin-inline-start:auto;font-weight:900;color:var(--brand);font-size:1.2rem}
  #rc{position:fixed;inset:0;z-index:44;background:var(--bg);color:var(--ink);display:flex;flex-direction:column;overflow:hidden}
  #rc .rc-v{flex:1;overflow-y:auto;padding:calc(14px + env(safe-area-inset-top)) 16px calc(20px + env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:14px;max-width:560px;width:100%;margin:0 auto}
  #rc .rc-v[hidden]{display:none}
  #rc .dark{background:var(--stage);color:#eef7f3}
  #rc .rc-top{display:flex;align-items:center;justify-content:space-between;gap:10px}
  #rc .rc-top h2{margin:0;font-size:1.3rem;font-weight:900}
  #rc .x{width:42px;height:42px;border-radius:14px;border:1px solid var(--line);background:var(--card);cursor:pointer;color:var(--ink);font-size:1.1rem}
  #rc .pill{border-radius:999px;padding:5px 12px;font-weight:800;font-size:.82rem;background:var(--soft);color:var(--brand)}
  #rc .hero{background:var(--stage);color:#eef7f3;border-radius:28px;padding:24px 18px;text-align:center;
    background-image:radial-gradient(90% 120% at 100% 0%,rgba(47,209,179,.4),transparent 60%),radial-gradient(70% 90% at 0% 100%,rgba(255,178,63,.32),transparent 60%)}
  #rc .hero .g{font-size:3.2rem;line-height:1}
  #rc .hero h3{margin:10px 0 4px;font-size:1.3rem;font-weight:900}
  #rc .hero p{margin:0;opacity:.8;font-size:.9rem}
  #rc .online{display:inline-flex;align-items:center;gap:8px;margin-top:14px;background:rgba(255,255,255,.1);border-radius:999px;padding:6px 14px;font-weight:800;font-variant-numeric:tabular-nums}
  #rc .online::before{content:"";width:9px;height:9px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 4px rgba(34,197,94,.25)}
  #rc .big{font-size:1.15rem;padding:18px;border-radius:22px}
  #rc .plans,#rc .buyrow{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  #rc .plan{border-radius:20px;padding:14px;border:1.5px solid var(--line);background:var(--card);display:grid;gap:3px;align-content:start}
  #rc .plan b{font-weight:900} #rc .plan .n{font-size:1.4rem;font-weight:900} #rc .plan span{color:var(--muted);font-size:.78rem}
  #rc .plan.pro{border-color:var(--amber);background:var(--amber-soft)}
  #rc .today{display:flex;align-items:center;gap:10px;background:var(--card);border:1px solid var(--line);border-radius:18px;padding:12px 14px;font-weight:800;font-size:.85rem;color:var(--muted)}
  #rc .today .bar{flex:1;height:8px;border-radius:99px;background:var(--line);overflow:hidden}
  #rc .today .bar i{display:block;height:100%;background:var(--brand);border-radius:99px}
  #rc .btn.amber{background:var(--amber);color:#3a2400}
  #rc .buyrow .btn{padding:12px 6px;font-size:.86rem}
  #rc .muted{color:var(--muted);font-size:.84rem;text-align:center}
  #rc .rules{list-style:none;padding:0;margin:0;display:grid;gap:4px;color:var(--muted);font-size:.82rem}
  #rc .radar{position:relative;width:220px;height:220px;display:grid;place-items:center;margin:auto auto 0}
  #rc .radar i{position:absolute;inset:0;border-radius:50%;border:2px solid rgba(47,209,179,.6);animation:rcring 2.4s ease-out infinite}
  #rc .radar i:nth-child(2){animation-delay:.8s} #rc .radar i:nth-child(3){animation-delay:1.6s}
  @keyframes rcring{from{transform:scale(.35);opacity:1}to{transform:scale(1.1);opacity:0}}
  #rc .radar .av{width:96px;height:96px;font-size:2.2rem;box-shadow:0 0 0 6px rgba(47,209,179,.25)}
  #rc .flags{font-size:1.6rem;letter-spacing:6px;text-align:center}
  #rc .ctr{text-align:center;font-weight:900;font-size:1.2rem}
  #rc .call-top{display:flex;justify-content:space-between;align-items:center;gap:8px}
  #rc .glass{background:rgba(255,255,255,.1);color:#fff;border:0;border-radius:999px;padding:6px 12px;font-weight:800;cursor:pointer;font:inherit;font-weight:800;font-size:.85rem}
  #rc .timer{font-weight:900;font-variant-numeric:tabular-nums;background:rgba(255,255,255,.1);border-radius:999px;padding:5px 14px}
  #rc .timer.low{background:#f0463c}
  #rc .partner{display:grid;justify-items:center;gap:6px;text-align:center;margin-top:8px}
  #rc .partner .ring3{position:relative;width:132px;height:132px;display:grid;place-items:center}
  #rc .partner .ring3.talk::before{content:"";position:absolute;inset:-6px;border-radius:50%;border:3px solid #2fd1b3;animation:rctalk 1.1s ease-out infinite}
  @keyframes rctalk{0%{transform:scale(.94);opacity:1}100%{transform:scale(1.15);opacity:0}}
  #rc .partner .av{width:120px;height:120px;font-size:2.8rem}
  #rc .partner b{font-size:1.3rem;font-weight:900}
  #rc .partner span{opacity:.8;font-size:.88rem}
  #rc .topic{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:14px;text-align:center}
  #rc .topic small{color:#ffc164;font-weight:800}
  #rc .topic .q{font-weight:800;font-size:1.05rem;margin-top:2px}
  #rc .topic button{margin-top:8px;color:#7fe3cf;font-weight:800;font-size:.85rem;background:none;border:0;cursor:pointer;font:inherit;font-weight:800}
  #rc .ctrls{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:auto}
  #rc .c{display:grid;justify-items:center;gap:4px;font-size:.72rem;font-weight:700;background:none;border:0;color:#fff;cursor:pointer;font-family:inherit}
  #rc .c .ic{width:58px;height:58px;border-radius:50%;background:rgba(255,255,255,.1);display:grid;place-items:center;font-size:1.4rem}
  #rc .c.on .ic{background:var(--amber);color:#3a2400}
  #rc .endrow{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  #rc .end{background:#f0463c;color:#fff;box-shadow:none}
  #rc .nxt{background:rgba(255,255,255,.12);color:#fff;box-shadow:none}
  #rc .done{background:var(--card);border:1px solid var(--line);border-radius:24px;padding:18px;text-align:center;display:grid;justify-items:center;gap:6px}
  #rc .done b{font-size:1.2rem;font-weight:900}
  #rc .stars{display:flex;gap:6px;justify-content:center;font-size:1.8rem}
  #rc .stars button{filter:grayscale(1);opacity:.45;background:none;border:0;cursor:pointer;font-size:inherit}
  #rc .stars button.on{filter:none;opacity:1}
  #rc .limit{border:1.5px solid var(--amber);background:var(--amber-soft);border-radius:20px;padding:14px;display:grid;gap:8px;text-align:center}
  #rc .limit b{font-weight:900}
  #rc .fly{position:absolute;left:50%;bottom:220px;font-size:3rem;pointer-events:none;animation:rcfly 2s ease-out forwards}
  @keyframes rcfly{0%{transform:translate(-50%,0) scale(.4);opacity:0}15%{opacity:1;transform:translate(-50%,-40px) scale(1.2)}100%{transform:translate(-50%,-300px);opacity:0}}
  @media (prefers-reduced-motion: reduce){#rc *{animation:none!important}}`;
  document.head.appendChild(css);
})();

const RC = { st: null, room: null, partner: null, pProf: null, left: 0, callLeft: 0, talked: 0, unsent: 0, timer: 0, poll: 0, flagT: 0,
  joinWait: 0, ending: false, muted: false, silent: false, topic: 0, lastEnd: "" };
const RC_TOPICS = ["What's your favorite food? 🍕", "Where would you like to travel? ✈️", "What music do you like? 🎧", "Tell me about your city 🏙️",
  "What do you do on weekends? 🌴", "Teach me one word in your language 💬", "What's your dream job? 💼", "Cats or dogs? 🐱🐶", "What movie did you like recently? 🎬"];
const RC_FLAGS = ["🇬🇧 🇹🇷 🇩🇪", "🇸🇦 🇮🇶 🇫🇷", "🇪🇸 🇮🇹 🇯🇵", "🇺🇸 🇮🇷 🇧🇷", "🇨🇳 🇰🇷 🇮🇳"];
const rcMMSS = (s) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;
const rcFmt = (n) => Number(n || 0).toLocaleString("en-US");

// the big dark card at the top of the rooms page (where "today's goal" used to be)
function rcCardHtml() {
  return `<div class="goal-card rc-home" id="rc-open" role="button" tabindex="0">
    <canvas class="goal-cv" aria-hidden="true"></canvas>
    <div class="rh-row"><span class="rh-globe">🌍</span><div><div class="g-big">${esc(t("rc_card"))}</div><small>${esc(t("rc_cardSub"))}</small></div></div>
    <div class="rh-row2"><span class="rh-online" id="rc-home-online">…</span><button type="button" class="btn sm" id="rc-open-go">${esc(t("rc_start"))}</button></div>
  </div>`;
}
// live number of people in calls + the moving waves behind the card
async function rcFillCard(box) {
  try {
    const { data } = await sb.rpc("rc_status");
    const s = Array.isArray(data) ? data[0] : data;
    const el = box.querySelector("#rc-home-online");
    if (el && s) el.textContent = t("rc_online", { n: rcFmt(Math.max(1, s.o_online || 0)) });
    else if (el) el.textContent = t("rc_cardSub");
  } catch {}
}

function rcEl() {
  let el = document.getElementById("rc");
  if (el) return el;
  el = document.createElement("div");
  el.id = "rc";
  el.innerHTML = `
  <div class="rc-v" id="rc-start">
    <div class="rc-top"><button type="button" class="x" id="rc-close" aria-label="close">✕</button><h2>${esc(t("rc_title"))}</h2><span class="pill" id="rc-plan">${esc(t("rc_free"))}</span></div>
    <div class="hero"><div class="g">🌍</div><h3>${esc(t("rc_heroT"))}</h3><p>${esc(t("rc_heroS"))}</p><div class="online" id="rc-online">…</div></div>
    <button type="button" class="btn big" id="rc-go">${esc(t("rc_start"))}</button>
    <div class="plans">
      <div class="plan"><b>${esc(t("rc_free"))}</b><span class="n">${esc(t("rc_freeBig"))}</span><span>${esc(t("rc_freeSub"))}</span></div>
      <div class="plan pro"><b>${esc(t("rc_pro"))}</b><span class="n">${esc(t("rc_proBig"))}</span><span>${esc(t("rc_proSub"))}</span></div>
    </div>
    <div class="today"><span>${esc(t("rc_today"))}</span><div class="bar"><i id="rc-bar"></i></div><span id="rc-used">…</span></div>
    <div class="buyrow"><button type="button" class="btn ghost" data-rcbuy="plus5">${esc(t("rc_plus5"))}</button><button type="button" class="btn amber" data-rcbuy="premium">${esc(t("rc_buyPro"))}</button></div>
    <div class="muted" id="rc-coins"></div>
    <ul class="rules"><li>${esc(t("rc_rules18"))}</li><li>${esc(t("rc_rulesRep"))}</li></ul>
  </div>
  <div class="rc-v dark" id="rc-search" hidden>
    <div class="radar"><i></i><i></i><i></i>${avHtml(profile?.name, profile?.avatar_url, "lg")}</div>
    <div class="ctr">${esc(t("rc_searching"))}</div>
    <div class="flags" id="rc-flags">🇬🇧 🇹🇷 🇩🇪</div>
    <button type="button" class="btn line" style="color:#fff;border-color:rgba(255,255,255,.25);margin-bottom:auto" id="rc-cancel">${esc(t("rc_cancel"))}</button>
  </div>
  <div class="rc-v dark" id="rc-call" hidden>
    <div class="call-top"><button type="button" class="glass" id="rc-report">${esc(t("rc_report"))}</button><span class="timer" id="rc-timer">10:00</span><button type="button" class="glass" id="rc-block">${esc(t("rc_block"))}</button></div>
    <div class="partner"><div class="ring3" id="rc-ring"><span id="rc-pav"></span></div><b id="rc-pname" dir="auto"></b><span id="rc-psub"></span></div>
    <div class="topic"><small>${esc(t("rc_topic"))}</small><div class="q" id="rc-topic"></div><button type="button" id="rc-topic-next">${esc(t("rc_topicNext"))}</button></div>
    <div class="ctrls">
      <button type="button" class="c" id="rc-mic"><span class="ic">🎙️</span>${esc(t("rc_mic"))}</button>
      <button type="button" class="c" id="rc-spk"><span class="ic">🔊</span>${esc(t("rc_speaker"))}</button>
      <button type="button" class="c" id="rc-gift"><span class="ic">🎁</span>${esc(t("rc_gift"))}</button>
      <button type="button" class="c" id="rc-fol"><span class="ic">＋</span>${esc(t("rc_follow"))}</button>
    </div>
    <div class="endrow"><button type="button" class="btn nxt" id="rc-next">${esc(t("rc_next"))}</button><button type="button" class="btn end" id="rc-end">${esc(t("rc_end"))}</button></div>
    <div id="rc-audio" hidden></div>
  </div>
  <div class="rc-v" id="rc-done" hidden>
    <div class="done"><span id="rc-dav"></span><b id="rc-dname" dir="auto"></b><span class="muted" id="rc-dtime"></span>
      <div style="margin-top:6px;font-weight:800">${esc(t("rc_how"))}</div>
      <div class="stars" id="rc-stars">${"<button type=\"button\">⭐</button>".repeat(5)}</div></div>
    <div class="limit" id="rc-limit" hidden><b id="rc-limit-t"></b><span class="muted" id="rc-limit-s"></span>
      <div class="buyrow"><button type="button" class="btn ghost" data-rcbuy="plus5">${esc(t("rc_plus5"))}</button><button type="button" class="btn amber" data-rcbuy="premium">${esc(t("rc_buyPro"))}</button></div>
      <span class="muted" id="rc-coins2"></span></div>
    <button type="button" class="btn ghost" id="rc-dfol">${esc(t("rc_followBig"))}</button>
    <button type="button" class="btn big" id="rc-again">${esc(t("rc_new"))}</button>
    <button type="button" class="btn line" id="rc-home">${esc(t("rc_back"))}</button>
  </div>`;
  document.body.appendChild(el);

  const q = (s) => el.querySelector(s);
  q("#rc-close").addEventListener("click", closeRandomCall);
  q("#rc-go").addEventListener("click", rcSearch);
  q("#rc-again").addEventListener("click", rcSearch);
  q("#rc-cancel").addEventListener("click", () => { rcStopSearch(); sb.rpc("rc_leave"); rcView("start"); rcLoadStatus(); });
  q("#rc-home").addEventListener("click", () => { rcView("start"); rcLoadStatus(); });
  q("#rc-end").addEventListener("click", () => rcEndCall("me"));
  q("#rc-next").addEventListener("click", async () => { await rcEndCall("next"); rcSearch(); });
  q("#rc-topic-next").addEventListener("click", () => { RC.topic = (RC.topic + 1) % RC_TOPICS.length; q("#rc-topic").textContent = RC_TOPICS[RC.topic]; });
  q("#rc-mic").addEventListener("click", async (e) => {
    if (!RC.room) return;
    RC.muted = !RC.muted;
    try { await RC.room.localParticipant.setMicrophoneEnabled(!RC.muted); } catch {}
    e.currentTarget.classList.toggle("on", RC.muted); e.currentTarget.querySelector(".ic").textContent = RC.muted ? "🔇" : "🎙️";
  });
  q("#rc-spk").addEventListener("click", (e) => {
    RC.silent = !RC.silent;
    el.querySelectorAll("#rc-audio audio").forEach((a) => (a.muted = RC.silent));
    e.currentTarget.classList.toggle("on", RC.silent); e.currentTarget.querySelector(".ic").textContent = RC.silent ? "🔈" : "🔊";
  });
  q("#rc-gift").addEventListener("click", () => {
    if (!RC.partner) return;
    if (typeof openPaidGifts === "function") openPaidGifts([{ id: RC.partner, name: RC.pProf?.name || t("guest") }]);
  });
  const follow = async () => {
    if (!RC.partner || following.has(RC.partner)) return toast(t("rc_followed"));
    await toggleFollow(RC.partner); toast(t("rc_followed"));
    const f = q("#rc-fol"); f.classList.add("on"); f.querySelector(".ic").textContent = "✓";
  };
  q("#rc-fol").addEventListener("click", follow);
  q("#rc-dfol").addEventListener("click", follow);
  q("#rc-report").addEventListener("click", () => { if (RC.partner) openReport({ userId: RC.partner }); });
  q("#rc-block").addEventListener("click", async () => {
    if (!RC.partner) return;
    const id = RC.partner;
    await rcEndCall("me");
    if (!blocked.has(id)) await toggleBlock(id);
  });
  q("#rc-stars").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const all = [...q("#rc-stars").children], n = all.indexOf(b);
    all.forEach((x, i) => x.classList.toggle("on", i <= n));
    toast(t("rc_thanks"));
  });
  el.addEventListener("click", (e) => { const b = e.target.closest("[data-rcbuy]"); if (b) rcBuy(b.dataset.rcbuy); });
  return el;
}
function rcView(name) { const el = rcEl(); el.querySelectorAll(".rc-v").forEach((v) => (v.hidden = v.id !== "rc-" + name)); }

async function openRandomCall() {
  if (typeof lk !== "undefined" && lk) return toast(t("rc_inLive"));
  rcEl(); rcView("start");
  await rcLoadStatus();
}
async function closeRandomCall() {
  rcStopSearch();
  if (RC.room) await rcEndCall("me");
  try { sb.rpc("rc_leave"); } catch {}
  document.getElementById("rc")?.remove();
}

async function rcLoadStatus() {
  const { data, error } = await sb.rpc("rc_status");
  if (error) { console.warn(error); return; }
  RC.st = Array.isArray(data) ? data[0] : data;
  const s = RC.st || {}, el = rcEl();
  const pro = s.o_premium_until && new Date(s.o_premium_until) > new Date();
  el.querySelector("#rc-online").textContent = t("rc_online", { n: rcFmt(Math.max(1, s.o_online || 0)) });
  el.querySelector("#rc-plan").textContent = pro ? t("rc_proOn", { d: new Date(s.o_premium_until).toLocaleDateString(uiLang, { day: "numeric", month: "short" }) }) : t("rc_free");
  el.querySelector("#rc-bar").style.width = Math.min(100, ((s.o_used || 0) / Math.max(1, s.o_limit || 1)) * 100) + "%";
  el.querySelector("#rc-used").textContent = `${Math.floor((s.o_used || 0) / 60)} / ${Math.floor((s.o_limit || 0) / 60)}`;
  const c = t("rc_coins", { n: rcFmt(s.o_coins) });
  el.querySelector("#rc-coins").textContent = c; el.querySelector("#rc-coins2").textContent = c;
}

async function rcBuy(what) {
  const { data, error } = await sb.rpc("rc_buy", { p_what: what });
  if (error) return toast(t("error") + error.message);
  const r = Array.isArray(data) ? data[0] : data;
  if (r?.o_status === "no_coins") {
    toast(t("rc_noCoins"));
    if (typeof openWallet === "function") setTimeout(openWallet, 600);
    return;
  }
  if (r?.o_status !== "ok") return toast(t("error") + (r?.o_status || ""));
  toast(what === "premium" ? t("rc_boughtPro") : t("rc_bought5"));
  await rcLoadStatus();
  if (!document.getElementById("rc-done")?.hidden) rcView("start");
}

/* ---------- 18+ check (once) ---------- */
function rcAskAdult() {
  return new Promise((resolve) => {
    openSheet(`<div class="invite-card"><div class="big">🔞</div><h1>${esc(t("rc_18T"))}</h1><p class="muted">${esc(t("rc_18S"))}</p></div>
      <div class="actions"><button type="button" class="btn line" id="rc18-no">${esc(t("rc_18No"))}</button><button type="button" class="btn" id="rc18-yes">${esc(t("rc_18Yes"))}</button></div>`);
    $("#rc18-no").addEventListener("click", () => { closeSheet(); resolve(false); });
    $("#rc18-yes").addEventListener("click", async () => { closeSheet(); await sb.rpc("rc_confirm_adult"); resolve(true); });
  });
}

/* ---------- searching ---------- */
function rcStopSearch() { clearInterval(RC.poll); clearInterval(RC.flagT); RC.poll = 0; }
async function rcSearch() {
  if (!RC.st || !RC.st.o_adult) {
    await rcLoadStatus();
    if (!RC.st?.o_adult) { const ok = await rcAskAdult(); if (!ok) return; RC.st && (RC.st.o_adult = true); }
  }
  rcView("search");
  let f = 0; clearInterval(RC.flagT);
  RC.flagT = setInterval(() => { const x = document.getElementById("rc-flags"); if (x) x.textContent = RC_FLAGS[f++ % RC_FLAGS.length]; }, 450);
  const tick = async () => {
    const { data, error } = await sb.rpc("rc_join");
    if (!RC.poll) return; // cancelled meanwhile
    if (error) { console.warn(error); return; }
    const r = Array.isArray(data) ? data[0] : data;
    if (r?.o_status === "matched") { rcStopSearch(); rcConnect(r.o_room, r.o_partner); }
    else if (r?.o_status === "limit") { rcStopSearch(); rcShowDone(null, 0, "day"); }
    else if (r?.o_status === "banned") { rcStopSearch(); toast(t("rc_banned")); rcView("start"); }
    else if (r?.o_status === "adult") { rcStopSearch(); RC.st && (RC.st.o_adult = false); rcView("start"); rcSearch(); }
  };
  clearInterval(RC.poll);
  RC.poll = setInterval(tick, 2000);
  tick();
}

/* ---------- the call ---------- */
async function rcConnect(roomId, partnerId) {
  RC.partner = partnerId; RC.talked = 0; RC.unsent = 0; RC.ending = false; RC.muted = false; RC.silent = false;
  RC.pProf = (typeof getProfile === "function" ? await getProfile(partnerId) : null) || { id: partnerId, name: t("guest") };
  const el = rcEl();
  el.querySelector("#rc-pav").innerHTML = avHtml(RC.pProf.name, RC.pProf.avatar_url, "lg");
  el.querySelector("#rc-pname").textContent = `${RC.pProf.name || t("guest")} ${flag(RC.pProf.country) || ""}`.trim();
  el.querySelector("#rc-psub").innerHTML = `${typeof lvHtml === "function" ? lvHtml(RC.pProf) : ""} ${esc((LANGS[RC.pProf.native_lang] || "").toString())}`;
  RC.topic = Math.floor(Math.random() * RC_TOPICS.length);
  el.querySelector("#rc-topic").textContent = RC_TOPICS[RC.topic];
  ["#rc-mic", "#rc-spk", "#rc-fol"].forEach((s) => el.querySelector(s).classList.remove("on"));
  el.querySelector("#rc-mic .ic").textContent = "🎙️"; el.querySelector("#rc-spk .ic").textContent = "🔊";
  el.querySelector("#rc-fol .ic").textContent = following.has(partnerId) ? "✓" : "＋";
  el.querySelector("#rc-ring").classList.remove("talk");
  rcView("call");

  try {
    const { data, error } = await sb.functions.invoke(CONFIG.FUNCTION, { body: { roomId, action: "rc_token" } });
    if (error || !data?.token) {
      let code = ""; try { code = (await error?.context?.json())?.error; } catch {}
      if (code === "limit") return rcShowDone(null, 0, "day");
      throw new Error(code || error?.message || "token");
    }
    RC.left = Number(data.left) || 600;
    RC.callLeft = Math.min(600, RC.left);
    const E = LivekitClient.RoomEvent;
    const room = new LivekitClient.Room({ adaptiveStream: true, dynacast: true,
      audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      publishDefaults: typeof VOICE_PUBLISH === "function" ? VOICE_PUBLISH() : undefined });
    RC.room = room;
    room
      .on(E.TrackSubscribed, (track) => { if (track.kind === "audio") { const a = track.attach(); a.muted = RC.silent; el.querySelector("#rc-audio").appendChild(a); } })
      .on(E.TrackUnsubscribed, (track) => track.detach().forEach((x) => x.remove()))
      .on(E.ParticipantConnected, () => clearTimeout(RC.joinWait))
      .on(E.ParticipantDisconnected, () => { if (!RC.ending) rcEndCall("them"); })
      .on(E.ActiveSpeakersChanged, (sp) => el.querySelector("#rc-ring").classList.toggle("talk", sp.some((p) => p.identity === partnerId)))
      .on(E.Disconnected, () => { if (!RC.ending && RC.room === room) rcEndCall("them"); });
    await room.connect(data.url, data.token);
    try { await room.startAudio(); } catch {}
    await room.localParticipant.setMicrophoneEnabled(true);
    // the other person never came: find someone else
    clearTimeout(RC.joinWait);
    if (!room.remoteParticipants.size) RC.joinWait = setTimeout(async () => { if (RC.room === room && !room.remoteParticipants.size) { await rcEndCall("quiet"); rcSearch(); } }, 15000);
    clearInterval(RC.timer);
    RC.timer = setInterval(rcTick, 1000);
    rcPaintTimer();
  } catch (err) {
    console.warn(err); toast(t("rc_fail") + (err?.message || err));
    await rcEndCall("quiet"); rcView("start"); rcLoadStatus();
  }
}
function rcPaintTimer() {
  const tm = document.getElementById("rc-timer"); if (!tm) return;
  const s = Math.min(RC.callLeft, RC.left);
  tm.textContent = rcMMSS(s); tm.classList.toggle("low", s <= 60);
}
function rcTick() {
  if (!RC.room) return;
  if (RC.room.remoteParticipants.size) { RC.talked++; RC.unsent++; RC.callLeft--; RC.left--; }
  if (RC.unsent >= 30) { const n = RC.unsent; RC.unsent = 0; rcSendTime(n); }
  rcPaintTimer();
  if (RC.left <= 0) rcEndCall("day");
  else if (RC.callLeft <= 0) rcEndCall("call");
}
async function rcSendTime(n) {
  try {
    const { data } = await sb.rpc("rc_tick", { p_secs: n });
    const r = Array.isArray(data) ? data[0] : data;
    if (r && typeof r.o_left === "number") RC.left = Math.min(RC.left, r.o_left);
  } catch {}
}
async function rcEndCall(why) {
  if (RC.ending) return;
  RC.ending = true;
  clearInterval(RC.timer); clearTimeout(RC.joinWait);
  if (RC.unsent > 0) { const n = RC.unsent; RC.unsent = 0; await rcSendTime(n); }
  const room = RC.room; RC.room = null;
  try { await room?.disconnect(); } catch {}
  document.querySelectorAll("#rc-audio audio").forEach((a) => a.remove());
  try { await sb.rpc("rc_leave"); } catch {}
  if (why === "next" || why === "quiet") return;
  rcShowDone(RC.pProf, RC.talked, why);
}
function rcShowDone(p, talked, why) {
  const el = rcEl();
  el.querySelector("#rc-dav").innerHTML = p ? avHtml(p.name, p.avatar_url, "md") : `<span style="font-size:2.4rem">⏱️</span>`;
  el.querySelector("#rc-dname").textContent = p ? (p.name || t("guest")) : t("rc_dayOver");
  el.querySelector("#rc-dtime").textContent = why === "them" && p ? `${t("rc_left", { name: p.name || t("guest") })} · ${rcMMSS(talked)}` : t("rc_talked", { t: rcMMSS(talked) });
  el.querySelector("#rc-stars").parentElement.querySelectorAll("#rc-stars button").forEach((b) => b.classList.remove("on"));
  const lim = el.querySelector("#rc-limit");
  lim.hidden = !(why === "call" || why === "day");
  el.querySelector("#rc-limit-t").textContent = why === "day" ? t("rc_dayOver") : t("rc_callOver");
  el.querySelector("#rc-limit-s").textContent = why === "day" ? t("rc_dayOverS") : t("rc_callOverS");
  el.querySelector("#rc-dfol").hidden = !p || following.has(p.id);
  el.querySelector(".done").hidden = !p;
  rcView("done");
  rcLoadStatus();
}
window.addEventListener("pagehide", () => { try { if (RC.room || RC.poll) sb.rpc("rc_leave"); } catch {} });
