/* =====================================================================
   👑 Top gifters
   - in a live room: the 3 people who sent the most coins since the live started (tap → full list)
   - in the Ranking tab: the top gifters of the whole app this week
   Data: Supabase function top_gifters() (supabase/update-13-top-gifters.sql).
   Uses globals from app.js: sb, me, currentRoom, $, esc, t, avHtml, openSheet, closeSheet, openProfile, I18N.
   ===================================================================== */
"use strict";
(function () {
const TXT = {
  en:  { tg_title: "Top gifters", tg_room: "Top gifters in this live", tg_week: "Top gifters this week", tg_none: "No gifts yet. Be the first! 🎁", tg_xp: "XP", tg_gifts: "Gifts" },
  ckb: { tg_title: "گەورەترین دیاریدەران", tg_room: "گەورەترین دیاریدەرانی ئەم لایڤە", tg_week: "گەورەترین دیاریدەرانی ئەم هەفتەیە", tg_none: "هێشتا کەس دیاری نەناردووە. تۆ یەکەم بە! 🎁", tg_xp: "XP", tg_gifts: "دیاری" },
  ar:  { tg_title: "أكبر الداعمين", tg_room: "أكبر الداعمين في هذا البث", tg_week: "أكبر الداعمين هذا الأسبوع", tg_none: "لا هدايا بعد. كن الأول! 🎁", tg_xp: "XP", tg_gifts: "الهدايا" },
  tr:  { tg_title: "En çok hediye verenler", tg_room: "Bu canlı yayında en çok hediye verenler", tg_week: "Bu haftanın en çok hediye verenleri", tg_none: "Henüz hediye yok. İlk sen ol! 🎁", tg_xp: "XP", tg_gifts: "Hediyeler" },
  fa:  { tg_title: "بیشترین هدیه‌دهندگان", tg_room: "بیشترین هدیه‌دهندگان این لایو", tg_week: "بیشترین هدیه‌دهندگان این هفته", tg_none: "هنوز هدیه‌ای نیست. اولین نفر باش! 🎁", tg_xp: "XP", tg_gifts: "هدیه‌ها" },
  de:  { tg_title: "Top-Schenker", tg_room: "Top-Schenker in diesem Live", tg_week: "Top-Schenker dieser Woche", tg_none: "Noch keine Geschenke. Sei der Erste! 🎁", tg_xp: "XP", tg_gifts: "Geschenke" },
  fr:  { tg_title: "Meilleurs donateurs", tg_room: "Meilleurs donateurs de ce live", tg_week: "Meilleurs donateurs de la semaine", tg_none: "Pas encore de cadeaux. Sois le premier ! 🎁", tg_xp: "XP", tg_gifts: "Cadeaux" },
  es:  { tg_title: "Mejores donantes", tg_room: "Mejores donantes de este directo", tg_week: "Mejores donantes de la semana", tg_none: "Aún no hay regalos. ¡Sé el primero! 🎁", tg_xp: "XP", tg_gifts: "Regalos" },
};
try { for (const [l, o] of Object.entries(TXT)) if (I18N[l]) Object.assign(I18N[l], o); } catch {}

const css = document.createElement("style");
css.textContent = `
  .tg-strip{display:flex;align-items:center;gap:6px;padding:0 12px 6px;position:relative;z-index:3;overflow-x:auto;scrollbar-width:none}
  .tg-strip::-webkit-scrollbar{display:none}
  .tg-strip button{display:inline-flex;align-items:center;gap:5px;border:0;cursor:pointer;color:#fff;font-weight:800;font-size:.75rem;
    background:rgba(0,0,0,.28);border-radius:999px;padding:3px 9px 3px 3px;white-space:nowrap;flex:0 0 auto;backdrop-filter:blur(6px)}
  .tg-strip .av{width:24px;height:24px;font-size:.65rem}
  .tg-strip .m{font-size:.85rem}
  .tg-strip .r1{box-shadow:inset 0 0 0 1.5px #fcd34d} .tg-strip .r2{box-shadow:inset 0 0 0 1.5px #cbd5e1} .tg-strip .r3{box-shadow:inset 0 0 0 1.5px #d97706}
  .tg-strip .all{padding:5px 10px}
  .tg-row{display:flex;align-items:center;gap:12px;padding:10px 4px;border-bottom:1px solid var(--line);cursor:pointer}
  .tg-row:last-child{border-bottom:0}
  .tg-row .n{width:28px;text-align:center;font-weight:900;font-size:1.05rem}
  .tg-row .nm{flex:1;min-width:0;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .tg-row .c{font-weight:900;font-variant-numeric:tabular-nums;white-space:nowrap}
  .tg-row.me{background:var(--soft);border-radius:14px}
  .rank-seg{display:flex;background:var(--soft);border-radius:14px;padding:4px;gap:4px;margin:8px 0 12px}
  .rank-seg button{flex:1;border:0;background:none;border-radius:10px;padding:8px;font-weight:800;color:var(--muted);cursor:pointer;font:inherit;font-weight:800}
  .rank-seg button.on{background:var(--card);color:var(--brand);box-shadow:var(--shadow)}`;
document.head.appendChild(css);

const fmt = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e4 ? Math.round(n / 1e3) + "K" : n >= 1e3 ? (n / 1e3).toFixed(1) + "K" : String(n || 0));
const medal = (i) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : String(i + 1));
const roomSince = () => currentRoom?.starts_at && new Date(currentRoom.starts_at) < new Date() ? currentRoom.starts_at : currentRoom?.created_at;

async function fetchTop(roomId, since, limit) {
  const { data, error } = await sb.rpc("top_gifters", { p_room: roomId || null, p_since: since, p_limit: limit });
  if (error) { console.warn("top_gifters", error.message); return null; }
  return data || [];
}
function rowsHtml(rows, off = 0) {
  if (!rows?.length) return `<div class="empty">${esc(t("tg_none"))}</div>`;
  return rows.map((r, i) => `<div class="tg-row ${r.user_id === me?.id ? "me" : ""}" data-tgp="${esc(r.user_id)}">
      <span class="n">${medal(i + off)}</span>${avHtml(r.name, r.avatar_url, "sm")}
      <span class="nm" dir="auto">${esc(r.name || t("guest"))}</span><span class="c">🪙 ${fmt(Number(r.coins))}</span></div>`).join("");
}
function wireRows(root) {
  root.querySelectorAll("[data-tgp]").forEach((el) => el.addEventListener("click", () => { closeSheet(); openProfile(el.dataset.tgp); }));
}

/* ---------- the strip at the top of a live room ---------- */
let seq = 0, timer = 0;
function strip() {
  let el = document.getElementById("top-gifters");
  if (!el) {
    el = document.createElement("div"); el.id = "top-gifters"; el.className = "tg-strip"; el.hidden = true;
    document.querySelector("#screen-room .stage-head")?.after(el);
  }
  return el;
}
async function refreshTopGifters() {
  const el = strip();
  if (!currentRoom || !sb) { el.hidden = true; el.innerHTML = ""; return; }
  const my = ++seq, roomId = currentRoom.id;
  const rows = await fetchTop(roomId, roomSince(), 3);
  if (my !== seq || currentRoom?.id !== roomId) return;
  if (!rows || !rows.length) { el.hidden = true; el.innerHTML = ""; return; }
  el.innerHTML = `<span style="font-size:1rem">👑</span>` + rows.map((r, i) =>
    `<button type="button" class="r${i + 1}" data-tg-open>${avHtml(r.name, r.avatar_url, "xs")}<span class="m">${medal(i)}</span>🪙 ${fmt(Number(r.coins))}</button>`).join("");
  el.hidden = false;
  el.querySelectorAll("[data-tg-open]").forEach((b) => b.addEventListener("click", openRoomTop));
}
// many gifts at once (combo): refresh once, shortly after the last one
function soon() { clearTimeout(timer); timer = setTimeout(refreshTopGifters, 1200); }
async function openRoomTop() {
  if (!currentRoom) return;
  openSheet(`<h1>👑 ${esc(t("tg_room"))}</h1><div id="tg-list"><div class="empty">…</div></div>`);
  const rows = await fetchTop(currentRoom.id, roomSince(), 20);
  const box = document.getElementById("tg-list"); if (!box) return;
  box.innerHTML = rowsHtml(rows); wireRows(box);
}

/* ---------- this week's top gifters (Ranking tab) ---------- */
async function weeklyHtml(box) {
  box.innerHTML = `<div class="empty">…</div>`;
  const since = new Date(Date.now() - 7 * 24 * 3600e3).toISOString();
  const rows = await fetchTop(null, since, 50);
  if (!box.isConnected) return;
  if (typeof podiumHtml === "function" && rows?.length) {
    // top 3 on the podium, the rest below
    box.innerHTML = podiumHtml(rows.slice(0, 3), (r) => `🪙 ${fmt(Number(r.coins))}`) +
      (rows.length > 3 ? `<div class="rank-card">${rowsHtml(rows.slice(3), 3)}</div>` : "");
    box.querySelectorAll("[data-person]").forEach((el) => el.addEventListener("click", () => openProfile(el.dataset.person)));
  } else box.innerHTML = `<div class="card" style="padding:6px 10px">${rowsHtml(rows)}</div>`;
  wireRows(box);
}

// keep the strip right when someone enters or leaves a live
let lastRoom = null;
setInterval(() => {
  const id = typeof currentRoom !== "undefined" && currentRoom ? currentRoom.id : null;
  if (id !== lastRoom) { lastRoom = id; refreshTopGifters(); }
}, 1000);

window.TopGifters = { refresh: refreshTopGifters, soon, openRoom: openRoomTop, weekly: weeklyHtml };
})();
