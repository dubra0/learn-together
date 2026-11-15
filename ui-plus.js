/* =====================================================================
   Talk Together — new design extras
   - 🪙 level page (levels 1–100 from coins sent as gifts) and the 2-second "came in" banner in lives (Lv 25+)
   - 📷 profile photo + background (cover) photo straight from the profile
   - posts open full screen from a profile, like the feed
   - 🎯 daily goal (minutes in rooms today), partner cards, ranking podium
   Uses globals from app.js: sb, me, profile, profileCache, feedCache, $, esc, t, avHtml, flag, LANGS, LEVEL_CODES,
   coinLevel, lvKind, lvHtml, LV_NEED, uploadPhoto, shrinkPhoto, safeAvatar, reelHtml, wireReels, reelObserver,
   renderMeTab, currentTab, openSheet, toast, I18N, store.
   ===================================================================== */
"use strict";

/* ---------- words ---------- */
(() => {
  const W = {
    en: { coverPhoto: "Background", lv_title: "My level", lv_only: "Your level goes up only by sending gifts. Quick at first, harder later.",
      lv_next: "🪙 {n} coins to Lv {lv}", lv_max: "🏆 Highest level reached", lv_perks: "Rewards of each level", lv_coins: "🪙 {n} coins sent",
      lv_came: "came in", goal_title: "Today's goal", goal_text: "{goal} minutes of talking", goal_left: "{n} of {goal} min · {left} min left to keep your streak",
      goal_done: "✅ Goal done! See you tomorrow 🔥", good_morning: "Good morning", good_evening: "Good evening", fit: "{n}% match",
      nativeL: "Native", learningL: "Learning", msgBtn: "💬 Message", followBtn: "＋ Follow", you: "You",
      perk1: "Level badge next to your name", perk10: "Bronze badge", perk20: "Silver badge + photo frame", perk25: "Your name shows for 2 s when you enter a live",
      perk30: "Special name colour in chat", perk40: "Gold badge + gold entrance", perk50: "Gold frame on your photo", perk60: "Ruby badge that shines",
      perk70: "Your chat messages in a special colour", perk80: "Diamond badge + big entrance", perk90: "Diamond crown on your photo", perk100: "Legend: rainbow entrance + moving crown",
      tierName: ["", "Beginner", "Bronze", "Silver", "Jade", "Gold", "Ruby", "Diamond", "Legend"] },
    ckb: { coverPhoto: "وێنەی باکگراوند", lv_title: "ئاستەکەم", lv_only: "ئاست تەنها بە ناردنی دیاری بەرز دەبێتەوە. سەرەتا زوو، دواتر قورستر.",
      lv_next: "🪙 {n} سکەی ماوە بۆ Lv {lv}", lv_max: "🏆 گەیشتیتە بەرزترین ئاست", lv_perks: "دیارییەکانی هەر ئاستێک", lv_coins: "🪙 {n} سکەت بە دیاری داوە",
      lv_came: "هاتە ژوورەوە", goal_title: "ئامانجی ئەمڕۆ", goal_text: "{goal} خولەک قسەکردن", goal_left: "{n} لە {goal} خولەک · {left} خولەکی ماوە بۆ پاراستنی ستریکەکەت",
      goal_done: "✅ ئامانجی ئەمڕۆت تەواو کرد! بەیانی دەبینینەوە 🔥", good_morning: "بەیانیت باش", good_evening: "ئێوارەت باش", fit: "{n}٪ گونجاو",
      nativeL: "زمانی دایکی", learningL: "فێر دەبێت", msgBtn: "💬 نامە", followBtn: "＋ بەدواکەوتن", you: "تۆ",
      perk1: "نیشانەی ئاست لە تەنیشت ناوت", perk10: "نیشانەی برۆنزی", perk20: "نیشانەی زیوی + چوارچێوەی وێنە", perk25: "ناوت ٢ چرکە دەردەکەوێت کاتێک دێیتە لایڤ",
      perk30: "ڕەنگی تایبەت بۆ ناوت لە چات", perk40: "نیشانەی زێڕین + هاتنە ژوورەوەی زێڕین", perk50: "چوارچێوەی زێڕین بۆ وێنەکەت", perk60: "نیشانەی یاقووتی بریسکەدار",
      perk70: "نامەکانت لە چات بە ڕەنگی تایبەت", perk80: "نیشانەی ئەڵماس + هاتنە ژوورەوەی گەورە", perk90: "تاجی ئەڵماس لەسەر وێنەکەت", perk100: "ئەفسانەیی: هاتنە ژوورەوەی ڕەنگاوڕەنگ + تاجی جووڵاو",
      tierName: ["", "سەرەتا", "برۆنزی", "زیوی", "یەشمی", "زێڕین", "یاقووتی", "ئەڵماس", "ئەفسانەیی"] },
    ar: { coverPhoto: "الخلفية", lv_title: "مستواي", lv_only: "يرتفع مستواك فقط بإرسال الهدايا. سريع في البداية وأصعب لاحقاً.",
      lv_next: "🪙 {n} عملة حتى Lv {lv}", lv_max: "🏆 وصلت لأعلى مستوى", lv_perks: "مكافآت كل مستوى", lv_coins: "🪙 أرسلت {n} عملة",
      lv_came: "دخل البث", goal_title: "هدف اليوم", goal_text: "{goal} دقيقة من التحدث", goal_left: "{n} من {goal} دقيقة · بقي {left} للحفاظ على السلسلة",
      goal_done: "✅ أكملت هدف اليوم! نراك غداً 🔥", good_morning: "صباح الخير", good_evening: "مساء الخير", fit: "توافق {n}٪",
      nativeL: "اللغة الأم", learningL: "يتعلم", msgBtn: "💬 رسالة", followBtn: "＋ متابعة", you: "أنت",
      perk1: "شارة المستوى بجانب اسمك", perk10: "شارة برونزية", perk20: "شارة فضية + إطار للصورة", perk25: "يظهر اسمك ثانيتين عند دخول البث",
      perk30: "لون خاص لاسمك في الدردشة", perk40: "شارة ذهبية + دخول ذهبي", perk50: "إطار ذهبي لصورتك", perk60: "شارة ياقوتية لامعة",
      perk70: "رسائلك بلون خاص", perk80: "شارة ماسية + دخول كبير", perk90: "تاج ماسي على صورتك", perk100: "أسطوري: دخول بألوان قوس قزح + تاج متحرك",
      tierName: ["", "مبتدئ", "برونزي", "فضي", "يشمي", "ذهبي", "ياقوتي", "ماسي", "أسطوري"] },
  };
  try { for (const [l, o] of Object.entries(W)) if (I18N[l]) Object.assign(I18N[l], o); } catch {}
})();
const tierWord = (k) => { const a = (I18N[uiLang] && I18N[uiLang].tierName) || I18N.en.tierName; return (a && a[k]) || ""; };
const fmtC = (n) => Number(n || 0).toLocaleString("en-US");

/* ---------- 📷 profile photo / background photo, right from the profile ---------- */
async function saveProfileImage(file, kind) {
  toast("📷 …");
  try {
    let url, patch;
    if (kind === "avatar") { url = await uploadPhoto(file); patch = { avatar_url: url }; }
    else {
      const blob = await shrinkPhoto(file, 1280, false);
      const path = `${me.id}/cover.jpg`;
      const up = await sb.storage.from("avatars").upload(path, blob, { upsert: true, contentType: "image/jpeg", cacheControl: "60" });
      if (up.error) throw up.error;
      url = sb.storage.from("avatars").getPublicUrl(path).data.publicUrl + "?v=" + Date.now();
      patch = { cover_url: url };
    }
    const { data, error } = await sb.from("profiles").update(patch).eq("id", me.id).select().single();
    if (error) throw error;
    profile = data; profileCache.set(me.id, data);
    toast("✅");
    if (currentTab === "me") renderMeTab();
    if (typeof renderTopbar === "function") renderTopbar();
  } catch (err) { console.error(err); toast(t("photoFail") + (err?.message || err)); }
}

/* ---------- 🪙 level page ---------- */
const PERK_LV = [1, 10, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100];
const PERK_IC = { 1: "🏷️", 10: "🥉", 20: "🥈", 25: "🎉", 30: "💬", 40: "🥇", 50: "🖼️", 60: "💗", 70: "✨", 80: "💎", 90: "👑", 100: "🏆" };
function openLevelSheet(p, isMe) {
  p = p || profile || {};
  const coins = Number(p.gift_coins || 0), L = coinLevel(coins), k = lvKind(L);
  const pct = L >= 100 ? 100 : Math.min(100, ((coins - LV_NEED[L]) / (LV_NEED[L + 1] - LV_NEED[L])) * 100);
  openSheet(`<div class="lv-hero">
      <div class="lv-big">${lvHtml(p)}</div>
      <div class="lv-tier">${esc(tierWord(k))}</div>
      <div class="lv-bar"><i style="width:${pct.toFixed(1)}%"></i></div>
      <div class="lv-next">${L >= 100 ? esc(t("lv_max")) : esc(t("lv_next", { n: fmtC(LV_NEED[L + 1] - coins), lv: L + 1 }))}</div>
    </div>
    <p class="muted small" style="margin:12px 2px">${esc(t("lv_only"))}</p>
    <h2 class="section" style="margin-top:6px">${esc(t("lv_perks"))}</h2>
    <div class="perks">${PERK_LV.map((lv) => `<div class="perk ${L >= lv ? "got" : ""}"><span class="ic">${PERK_IC[lv]}</span>
      <div class="pt"><b>${esc(t("perk" + lv))}</b><span>${lvHtml(LV_NEED[lv])}</span></div>${L >= lv ? '<span class="ok">✓</span>' : "🔒"}</div>`).join("")}</div>`);
}

/* ---------- 🎉 "came in" banner in a live: 2 seconds, small, level 25 and up ---------- */
function showEntrance(person) {
  try {
    if (!person) return;
    const L = coinLevel(person);
    if (L < 25) return;
    const host = document.getElementById("screen-room"); if (!host || host.hidden) return;
    const el = document.createElement("div");
    el.className = "entry k" + lvKind(L);
    el.innerHTML = `${avHtml(person.name, person.avatar_url, "xs")}<span dir="auto">${esc(person.name || "")}</span>${lvHtml(person)}<span>${esc(t("lv_came"))} ${L >= 100 ? "🏆" : L >= 80 ? "💎" : L >= 40 ? "✨" : "👋"}</span>`;
    host.appendChild(el);
    setTimeout(() => el.remove(), 2100);
  } catch (e) { console.warn(e); }
}
async function showEntranceFor(identity) {
  if (!identity) return;
  const p = identity === me?.id ? profile : profileCache.get(identity) || (typeof getProfile === "function" ? await getProfile(identity) : null);
  showEntrance(p);
}

/* ---------- posts open full screen from a profile (same as the feed) ---------- */
let pvObs = null;
function openPostViewer(posts, index) {
  closePostViewer();
  const wrap = document.createElement("div");
  wrap.id = "post-viewer";
  wrap.innerHTML = `<button type="button" class="pv-back" aria-label="back"><svg class="flip" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>
    <div class="pv-list">${posts.map((x) => { feedCache.set(x.id, x); return reelHtml(x); }).join("")}</div>`;
  document.body.appendChild(wrap);
  const list = wrap.querySelector(".pv-list");
  wireReels(list);
  // play the video on screen (inside this viewer, not the feed)
  pvObs = new IntersectionObserver((entries) => entries.forEach((en) => {
    const v = en.target;
    if (en.isIntersecting && en.intersectionRatio >= 0.6) { v.muted = feedMuted; v.play().catch(() => { v.muted = true; v.play().catch(() => {}); }); }
    else v.pause();
  }), { root: list, threshold: [0, 0.6] });
  list.querySelectorAll("video.reel-video").forEach((v) => { try { reelObserver().unobserve(v); } catch {} pvObs.observe(v); });
  requestAnimationFrame(() => { list.scrollTop = list.clientHeight * index; });
  wrap.querySelector(".pv-back").addEventListener("click", closePostViewer);
  history.pushState({ pv: 1 }, "");
}
function closePostViewer() {
  const w = document.getElementById("post-viewer"); if (!w) return;
  w.querySelectorAll("video").forEach((v) => v.pause());
  pvObs?.disconnect(); pvObs = null;
  w.remove();
}
window.addEventListener("popstate", () => closePostViewer());
// tapping a name inside the viewer opens a profile page: close the viewer first
document.addEventListener("click", (e) => { if (e.target.closest("#post-viewer .reel [data-person]")) closePostViewer(); }, true);

/* ---------- 🎯 daily goal: minutes in rooms today (kept on this phone) ---------- */
const GOAL_MIN = 15;
const todayKey = () => new Date().toISOString().slice(0, 10);
function todayMinutes() {
  try { const o = JSON.parse(store.get("todayMin") || "{}"); return o.d === todayKey() ? Number(o.m) || 0 : 0; } catch { return 0; }
}
function addTodayMinute() {
  const m = todayMinutes() + 1;
  try { store.set("todayMin", JSON.stringify({ d: todayKey(), m })); } catch {}
  if (m === GOAL_MIN) toast(t("goal_done"));
}
function goalCardHtml() {
  const n = Math.min(todayMinutes(), GOAL_MIN), left = Math.max(0, GOAL_MIN - n);
  return `<div class="goal-card"><canvas class="goal-cv" aria-hidden="true"></canvas>
    <div class="g-lbl">${esc(t("goal_title"))}</div>
    <div class="g-big">${esc(t("goal_text", { goal: GOAL_MIN }))}</div>
    <div class="g-bar"><i style="width:${(n / GOAL_MIN) * 100}%"></i></div>
    <small>${esc(left ? t("goal_left", { n, goal: GOAL_MIN, left }) : t("goal_done"))}</small></div>`;
}
// gentle sound waves behind the goal card
function startGoalWaves(root) {
  const cv = root.querySelector(".goal-cv"); if (!cv) return;
  const ctx = cv.getContext("2d");
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const draw = (tm) => {
    if (!cv.isConnected) return;
    const w = cv.clientWidth, h = cv.clientHeight;
    if (w && !document.hidden) {
      if (cv.width !== w * 2) { cv.width = w * 2; cv.height = h * 2; }
      ctx.setTransform(2, 0, 0, 2, 0, 0); ctx.clearRect(0, 0, w, h);
      [["rgba(47,209,179,.6)", 0], ["rgba(255,178,63,.5)", 2], ["rgba(120,166,255,.4)", 4]].forEach(([c, ph]) => {
        ctx.beginPath(); ctx.strokeStyle = c; ctx.lineWidth = 2;
        for (let x = 0; x <= w; x += 5) { const y = h * 0.62 + Math.sin(x / 38 + tm / 900 + ph) * 14 * Math.sin((x / w) * Math.PI); x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke();
      });
    }
    if (!still) setTimeout(() => requestAnimationFrame(draw), 50); // ~20 fps is plenty for this
  };
  requestAnimationFrame(draw);
}
function helloWord() { const h = new Date().getHours(); return h < 15 ? t("good_morning") : t("good_evening"); }

/* ---------- 🤝 partner cards ---------- */
function fitScore(p) {
  const myLearn = (profile?.learning || []).map((l) => l.lang), theirLearn = (p.learning || []).map((l) => l.lang);
  let s = 60;
  if (myLearn.includes(p.native_lang)) s += 20;
  if (profile?.native_lang && theirLearn.includes(profile.native_lang)) s += 15;
  s += Math.min(4, Math.floor((p.minutes || 0) / 60));
  return Math.min(99, s);
}
function partnerCard(p) {
  const learn = (p.learning || [])[0];
  const lname = (code) => (LANGS[code] || code || "—");
  return `<article class="pcard" data-person="${esc(p.id)}">
    <div class="pc-top">${avHtml(p.name, p.avatar_url, "md")}
      <div class="pc-who"><b dir="auto">${esc(p.name)} ${lvHtml(p)}</b><span>${flag(p.country)} ${esc(p.bio ? p.bio.slice(0, 40) : "")}</span></div>
      <span class="fit">${esc(t("fit", { n: fitScore(p) }))}</span></div>
    <div class="swap"><div>${esc(t("nativeL"))}<b>${esc(lname(p.native_lang))}</b></div><span class="arr">⇄</span>
      <div>${esc(t("learningL"))}<b>${esc(learn ? lname(learn.lang) : "—")}${learn && LEVEL_CODES[learn.level] ? " · " + esc(LEVEL_CODES[learn.level].split("–")[0]) : ""}</b></div></div>
  </article>`;
}

/* ---------- 🏆 podium for the top 3 ---------- */
function podiumHtml(rows, valueText) {
  if (!rows.length) return "";
  const at = (i) => rows[i];
  const one = (i, cls) => { const r = at(i); if (!r) return `<div class="pod ${cls}"></div>`;
    return `<div class="pod ${cls}" data-person="${esc(r.id || r.user_id)}">${i === 0 ? '<span class="crown">👑</span>' : ""}${avHtml(r.name, r.avatar_url, i === 0 ? "md" : "sm")}
      <b dir="auto">${esc(r.name || t("guest"))}</b><span class="pv">${valueText(r)}</span><div class="block">${i + 1}</div></div>`; };
  return `<div class="podium">${one(1, "second")}${one(0, "first")}${one(2, "third")}</div>`;
}
