/* =====================================================================
   Talk Together — app logic (v3 "Pro")
   ⚙️ Only CONFIG needs changing. Publishable/anon key ONLY — never a secret key.
   ===================================================================== */
"use strict";

const CONFIG = {
  SUPABASE_URL: "https://vjuqtzhefxpiqsmasfkb.supabase.co",
  SUPABASE_KEY: "sb_publishable_hs16UKvg16dApnabYQM9Cw_l2S-_XAU",
  FUNCTION: "smooth-worker", // the Supabase Edge Function that gives voice passes
};

/* ---------- languages people can practice (shown in their own name) ---------- */
const LANGS = {
  en: "🇬🇧 English", ar: "🇸🇦 العربية", es: "🇪🇸 Español", fr: "🇫🇷 Français", de: "🇩🇪 Deutsch",
  tr: "🇹🇷 Türkçe", fa: "🇮🇷 فارسی", ckb: "☀️ کوردی (سۆرانی)", kmr: "☀️ Kurdî (Kurmancî)",
  it: "🇮🇹 Italiano", pt: "🇵🇹 Português", ru: "🇷🇺 Русский", zh: "🇨🇳 中文", ja: "🇯🇵 日本語",
  ko: "🇰🇷 한국어", hi: "🇮🇳 हिन्दी", nl: "🇳🇱 Nederlands", sv: "🇸🇪 Svenska",
};
const LEVEL_CODES = { beginner: "A1–A2", intermediate: "B1–B2", advanced: "C1–C2" };
const COUNTRIES = ["IQ","IR","TR","SY","SA","AE","EG","JO","LB","KW","QA","OM","BH","YE","PS","MA","DZ","TN","LY","SD",
  "US","GB","CA","AU","IE","DE","FR","ES","IT","NL","BE","SE","NO","DK","FI","AT","CH","PL","GR","PT","RU","UA",
  "IN","PK","AF","BD","CN","JP","KR","ID","MY","PH","VN","TH","BR","MX","AR","CO","NG","KE","ZA","ET"];

/* ---------- small helpers ---------- */
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};
const flag = (cc) => (/^[A-Z]{2}$/.test(cc || "") ? String.fromCodePoint(...[...cc].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)) : "");
function countryName(cc) {
  try { return new Intl.DisplayNames([uiLang, "en"], { type: "region" }).of(cc) || cc; } catch { return cc; }
}
const AVATAR_PREFIX = CONFIG.SUPABASE_URL + "/storage/v1/object/public/avatars/";
const safeAvatar = (u) => (typeof u === "string" && u.startsWith(AVATAR_PREFIX) && u.length < 500 ? u : "");
function avHtml(name, url, size = "sm") {
  const inner = safeAvatar(url) ? `<img src="${esc(url)}" alt="" loading="lazy">` : esc([...(name || "?")][0] || "?");
  return `<span class="av ${size}">${inner}</span>`;
}
function partMeta(p) { try { return JSON.parse(p.metadata || "{}"); } catch { return {}; } }

/* ---------- interface language ---------- */
function pickUiLang() {
  const saved = store.get("uiLang");
  if (saved && I18N[saved]) return saved;
  for (const l of navigator.languages || [navigator.language || "en"]) {
    const code = String(l).toLowerCase();
    if (code.startsWith("ckb") || code === "ku-iq" || code === "ku-arab") return "ckb";
    const base = code.split("-")[0];
    if (I18N[base]) return base;
  }
  return "en";
}
let uiLang = pickUiLang();
const t = (key, vars) => {
  let s = (I18N[uiLang] && I18N[uiLang][key]) ?? I18N.en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v);
  return s;
};
const levelLabel = (lv) => `${t(lv)} (${LEVEL_CODES[lv] || ""})`;
const langOptions = (sel, withEmpty) =>
  (withEmpty ? `<option value="">${esc(t("choose"))}</option>` : "") +
  Object.entries(LANGS).map(([k, v]) => `<option value="${k}" ${k === sel ? "selected" : ""}>${esc(v)}</option>`).join("");
const levelOptions = (sel) => Object.keys(LEVEL_CODES).map((k) => `<option value="${k}" ${k === sel ? "selected" : ""}>${esc(levelLabel(k))}</option>`).join("");
const uiLangOptions = () => Object.entries(UI_LANGS).map(([k, v]) => `<option value="${k}" ${k === uiLang ? "selected" : ""}>🌐 ${esc(v)}</option>`).join("");

function setUiLang(l) {
  uiLang = l; store.set("uiLang", l); applyI18n();
}
function applyI18n() {
  document.documentElement.lang = uiLang;
  document.documentElement.dir = RTL.has(uiLang) ? "rtl" : "ltr";
  document.querySelectorAll("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => (el.placeholder = t(el.dataset.i18nPh)));
  $("#ob-lang").innerHTML = uiLangOptions();
  const keepLang = $("#room-lang").value, keepLevel = $("#room-level").value;
  $("#room-lang").innerHTML = langOptions(keepLang || "en");
  $("#room-level").innerHTML = levelOptions(keepLevel || "beginner");
  if (!$("#screen-onboarding").hidden) renderOnboarding();
  if (!$("#screen-main").hidden) renderTab();
  if (currentRoom) { setRoomHeader(currentRoom); renderPeople(); renderTopic(); }
}

/* ---------- toast ---------- */
let toastTimer;
function toast(msg, actionLabel, action) {
  const el = $("#toast");
  el.innerHTML = `<span>${esc(msg)}</span>` + (actionLabel ? `<button type="button">${esc(actionLabel)}</button>` : "");
  if (actionLabel) el.querySelector("button").onclick = () => { el.classList.remove("show"); action(); };
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), actionLabel ? 7000 : 3500);
}
function errText(code, fallback) { return code && I18N.en["e_" + code] ? t("e_" + code) : (code || fallback || ""); }

/* ---------- screens + bottom sheet ---------- */
function show(id) {
  document.querySelectorAll("body > .screen").forEach((s) => (s.hidden = s.id !== id));
  window.scrollTo(0, 0);
}
function openSheet(html) {
  $("#sheet-body").innerHTML = html;
  $("#sheet").hidden = false; $("#sheet-backdrop").hidden = false;
}
function closeSheet() { $("#sheet").hidden = true; $("#sheet-backdrop").hidden = true; }
$("#sheet-backdrop").addEventListener("click", closeSheet);
document.querySelectorAll("[data-back]").forEach((b) => b.addEventListener("click", () => goMain()));

/* ---------- state ---------- */
let sb = null, me = null, profile = null, isAdmin = false;
let lk = null, currentRoom = null, currentCode = null, listChannel = null, practiceTimer = null;
let currentTab = "rooms", roomFilter = "";
const following = new Set(), blocked = new Set(), profileCache = new Map();

/* =====================================================================
   Start
   ===================================================================== */
applyI18n();
const configured = !CONFIG.SUPABASE_URL.startsWith("PASTE") && !CONFIG.SUPABASE_KEY.startsWith("PASTE");
if (!configured) show("screen-setup"); else init();

async function init() {
  sb = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
  const { data: { session } } = await sb.auth.getSession();
  if (session) { me = session.user; await loadMyProfile(); }
  if (me && profile) return enterApp();
  if (!store.get("onboarded")) { obIndex = 0; renderOnboarding(); show("screen-onboarding"); }
  else show("screen-name");
}

// create my profile row, or update it if it already exists
// (insert + update instead of upsert: the id column is locked against updates on purpose)
async function saveProfileRow(row) {
  let r = await sb.from("profiles").insert(row).select().single();
  if (r.error && r.error.code === "23505") {
    const { id, ...rest } = row;
    r = await sb.from("profiles").update(rest).eq("id", id).select().single();
  }
  return r;
}

async function loadMyProfile() {
  const { data } = await sb.from("profiles").select("*").eq("id", me.id).maybeSingle();
  profile = data;
  if (!profile && me.user_metadata?.name) {
    // user from an older version: create the profile from what we know
    const row = { id: me.id, name: String(me.user_metadata.name).slice(0, 40), avatar_url: safeAvatar(me.user_metadata.avatar_url) || null };
    const ins = await saveProfileRow(row);
    profile = ins.data || null;
  }
  if (profile) profileCache.set(profile.id, profile);
}

/* =====================================================================
   Onboarding
   ===================================================================== */
const OB = [
  { art: "🎙️", title: "ob1Title", text: "ob1Text" },
  { art: "✋", title: "ob2Title", text: "ob2Text" },
  { art: "🔥", title: "ob3Title", text: "ob3Text" },
];
let obIndex = 0;
function renderOnboarding() {
  const s = OB[obIndex];
  $("#ob-slide").innerHTML = `<div class="ob-art">${s.art}</div><h1>${esc(t(s.title))}</h1><p>${esc(t(s.text))}</p>`;
  $("#ob-dots").innerHTML = OB.map((_, i) => `<i class="${i === obIndex ? "on" : ""}"></i>`).join("");
  $("#ob-next").textContent = obIndex === OB.length - 1 ? t("getStarted") : t("next");
}
function finishOnboarding() { store.set("onboarded", "1"); show("screen-name"); }
$("#ob-next").addEventListener("click", () => { if (obIndex < OB.length - 1) { obIndex++; renderOnboarding(); } else finishOnboarding(); });
$("#ob-skip").addEventListener("click", finishOnboarding);
$("#ob-lang").addEventListener("change", (e) => setUiLang(e.target.value));

/* =====================================================================
   Profile photos
   ===================================================================== */
let photoTarget = null, pendingPhoto = null;
function pickPhoto(target) { photoTarget = target; $("#photo-input").value = ""; $("#photo-input").click(); }
$("#name-photo-btn").addEventListener("click", () => pickPhoto("name"));
$("#edit-photo-btn").addEventListener("click", () => pickPhoto("edit"));
$("#photo-input").addEventListener("change", (e) => {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  pendingPhoto = f;
  const box = photoTarget === "edit" ? "#edit-photo-preview" : "#name-photo-preview";
  $(box).innerHTML = `<img src="${URL.createObjectURL(f)}" alt="">`;
});
function shrinkPhoto(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const size = 256, c = document.createElement("canvas");
      c.width = c.height = size;
      const s = Math.min(img.width, img.height);
      c.getContext("2d").drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      URL.revokeObjectURL(img.src);
      c.toBlob((b) => (b ? resolve(b) : reject(new Error("image"))), "image/jpeg", 0.85);
    };
    img.onerror = () => reject(new Error("image"));
    img.src = URL.createObjectURL(file);
  });
}
async function uploadPhoto(file) {
  const blob = await shrinkPhoto(file);
  const path = `${me.id}/avatar.jpg`;
  const up = await sb.storage.from("avatars").upload(path, blob, { upsert: true, contentType: "image/jpeg", cacheControl: "60" });
  if (up.error) throw up.error;
  return sb.storage.from("avatars").getPublicUrl(path).data.publicUrl + "?v=" + Date.now();
}

/* =====================================================================
   Sign up (name + age)
   ===================================================================== */
$("#name-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = $("#name-input").value.trim();
  if (name.length < 2) return toast(t("nameShort"));
  if (!$("#age-check").checked) return toast(t("ageRequired"));
  const btn = e.submitter; if (btn) btn.disabled = true;
  try {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) {
      const res = await sb.auth.signInAnonymously({ options: { data: { name } } });
      if (res.error) throw res.error;
      me = res.data.user;
    } else me = session.user;
    const row = { id: me.id, name };
    if (pendingPhoto) {
      try { row.avatar_url = await uploadPhoto(pendingPhoto); pendingPhoto = null; }
      catch (err) { console.error(err); toast(t("photoFail") + (err?.message || err)); }
    }
    const up = await saveProfileRow(row);
    if (up.error) throw up.error;
    profile = up.data; profileCache.set(profile.id, profile);
    store.set("onboarded", "1");
    enterApp();
  } catch (err) {
    console.error(err);
    toast(/anonymous/i.test(err?.message || "") ? t("anonDisabled") : t("error") + (err?.message || err));
  } finally { if (btn) btn.disabled = false; }
});

/* =====================================================================
   Main app + tabs
   ===================================================================== */
async function enterApp() {
  if (profile?.banned) { toast(t("e_banned")); }
  else if (inAppBrowser()) {
    toast(t("inAppWarn"), t("copyLink"), async () => {
      try { await navigator.clipboard.writeText(location.href); toast(t("linkCopied")); } catch { prompt(t("copyLink"), location.href); }
    });
  }
  await Promise.all([loadSocial(), checkAdmin()]);
  goMain("rooms");
  subscribeRooms();
  // opened from a shared link?
  const q = new URLSearchParams(location.search);
  const rid = q.get("room");
  if (rid) {
    history.replaceState(null, "", location.pathname);
    openRoomLink(rid, q.get("code"));
  }
}
async function loadSocial() {
  following.clear(); blocked.clear();
  const [f, b] = await Promise.all([
    sb.from("follows").select("followee").eq("follower", me.id),
    sb.from("blocks").select("blocked").eq("blocker", me.id),
  ]);
  (f.data || []).forEach((r) => following.add(r.followee));
  (b.data || []).forEach((r) => blocked.add(r.blocked));
}
async function checkAdmin() {
  const { data } = await sb.from("admins").select("user_id").eq("user_id", me.id).maybeSingle();
  isAdmin = !!data;
}
function goMain(tab) {
  if (tab) currentTab = tab;
  show("screen-main");
  renderTopbar();
  renderTab();
}
function renderTopbar() {
  $("#top-streak").textContent = `🔥 ${profile?.streak || 0}`;
  $("#top-me").innerHTML = avHtml(profile?.name, profile?.avatar_url, "sm").replace('class="av sm"', 'class="av sm" style="width:42px;height:42px"');
}
$("#top-me").addEventListener("click", () => goMain("me"));
$("#tabbar").addEventListener("click", (e) => {
  const b = e.target.closest("[data-tab]");
  if (b) goMain(b.dataset.tab);
});
function renderTab() {
  document.querySelectorAll("#tabbar [data-tab]").forEach((b) => b.classList.toggle("on", b.dataset.tab === currentTab));
  ["rooms", "partners", "ranking", "me"].forEach((k) => ($("#tab-" + k).hidden = k !== currentTab));
  $("#new-room-btn").hidden = currentTab !== "rooms";
  if (currentTab === "rooms") renderRoomsTab();
  if (currentTab === "partners") renderPartnersTab();
  if (currentTab === "ranking") renderRankingTab();
  if (currentTab === "me") renderMeTab();
}

/* ---------------- Rooms tab ---------------- */
let roomsSeq = 0;
async function renderRoomsTab() {
  const box = $("#tab-rooms");
  const name = profile?.name || t("guest");
  box.innerHTML = `
    <div class="hero">
      <div class="hello">${esc(t("hello", { name }))}</div>
      <div class="sub">${esc(t("appTagline"))}</div>
      <div class="stats"><span class="stat">🔥 ${profile?.streak || 0} ${esc(t("dayStreak"))}</span><span class="stat">⭐ ${profile?.xp || 0} ${esc(t("xp"))}</span></div>
    </div>
    <div class="chips" id="lang-chips">
      <button class="chip ${roomFilter ? "" : "on"}" data-f="">${esc(t("allLangs"))}</button>
      ${Object.entries(LANGS).map(([k, v]) => `<button class="chip ${roomFilter === k ? "on" : ""}" data-f="${k}">${esc(v)}</button>`).join("")}
    </div>
    <h2 class="section">${esc(t("liveNow"))}</h2><div id="live-list"><div class="empty">…</div></div>
    <div id="upcoming-wrap" hidden><h2 class="section">${esc(t("upcoming"))}</h2><div id="upcoming-list"></div></div>`;
  box.querySelector("#lang-chips").addEventListener("click", (e) => {
    const c = e.target.closest("[data-f]"); if (!c) return;
    roomFilter = c.dataset.f; renderRoomsTab();
  });
  await loadRooms();
}
async function loadRooms() {
  if (!sb || currentTab !== "rooms") return;
  const seq = ++roomsSeq;
  let q = sb.from("rooms").select("*").eq("is_live", true).order("created_at", { ascending: false }).limit(100);
  if (roomFilter) q = q.eq("language", roomFilter);
  const { data, error } = await q;
  if (seq !== roomsSeq || !$("#live-list")) return;
  if (error) { $("#live-list").innerHTML = `<div class="empty">${esc(t("loadFail"))}<br><small>${esc(error.message)}</small></div>`; return; }
  const now = Date.now(), H12 = 12 * 3600e3, D7 = 7 * 24 * 3600e3;
  const rows = (data || []).filter((r) => !blocked.has(r.host_id));
  const startOf = (r) => (r.starts_at ? new Date(r.starts_at).getTime() : new Date(r.created_at).getTime());
  // a live room must have heard from its host recently (rooms from before update 3 have no last_seen)
  const alive = (r) => !("last_seen" in r) || now - new Date(r.last_seen).getTime() < 150e3;
  const live = rows.filter((r) => startOf(r) <= now && now - startOf(r) < H12 && alive(r));
  const upcoming = rows.filter((r) => startOf(r) > now && startOf(r) - now < D7).sort((a, b) => startOf(a) - startOf(b));
  $("#live-list").innerHTML = live.length ? live.map(roomCard).join("")
    : `<div class="empty"><span class="big">🎧</span>${t("noRooms")}</div>`;
  $("#upcoming-wrap").hidden = !upcoming.length;
  $("#upcoming-list").innerHTML = upcoming.map(roomCard).join("");
  const all = [...live, ...upcoming];
  document.querySelectorAll("#tab-rooms [data-join]").forEach((b) =>
    b.addEventListener("click", () => joinRoom(all.find((r) => r.id === b.dataset.join))));
  document.querySelectorAll("#tab-rooms [data-start]").forEach((b) =>
    b.addEventListener("click", () => startScheduled(all.find((r) => r.id === b.dataset.start))));
  document.querySelectorAll("#tab-rooms [data-share]").forEach((b) =>
    b.addEventListener("click", () => shareRoom(all.find((r) => r.id === b.dataset.share))));
}
const fmtTime = (iso) => {
  try { return new Intl.DateTimeFormat(uiLang, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso)); }
  catch { return new Date(iso).toLocaleString(); }
};
function roomCard(r) {
  const upcoming = r.starts_at && new Date(r.starts_at).getTime() > Date.now();
  const mine = r.host_id === me.id;
  const tags = `<span class="tag ${upcoming ? "blue" : "live"}">${esc(upcoming ? t("startsAt", { time: fmtTime(r.starts_at) }) : "LIVE")}</span>
    <span class="tag">${esc(LANGS[r.language] || r.language)}</span><span class="tag blue">${esc(levelLabel(r.level))}</span>
    ${r.is_private ? `<span class="tag">${esc(t("privateTag"))}</span>` : ""}`;
  let actions;
  if (upcoming) {
    actions = mine
      ? `<span style="display:flex;gap:6px"><button class="btn ghost sm" data-share="${esc(r.id)}">${esc(t("share"))}</button><button class="btn sm" data-start="${esc(r.id)}">${esc(t("startNow"))}</button></span>`
      : `<button class="btn ghost sm" data-share="${esc(r.id)}">${esc(t("share"))}</button>`;
  } else actions = `<button class="btn sm" data-join="${esc(r.id)}">${esc(t("join"))}</button>`;
  return `<article class="room-card">
    <div class="rc-tags">${tags}</div>
    <h3 dir="auto">${esc(r.title)}</h3>
    <div class="rc-bottom"><span class="host">${avHtml(r.host_name, r.host_avatar, "xs")}<span dir="auto">${esc(r.host_name)}</span><span class="small">· ${esc(t("seats", { n: r.max_people || 20 }))}</span></span>${actions}</div>
  </article>`;
}
async function startScheduled(r) {
  if (!r) return;
  const nowIso = new Date().toISOString();
  const patch = { starts_at: nowIso };
  if ("last_seen" in r) patch.last_seen = nowIso;
  const { data, error } = await sb.from("rooms").update(patch).eq("id", r.id).select().single();
  if (error) return toast(t("error") + error.message);
  joinRoom(data);
}
function subscribeRooms() {
  if (listChannel) return;
  listChannel = sb.channel("rooms-list")
    .on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, (payload) => {
      const row = payload.new;
      if (payload.eventType === "INSERT" && row && following.has(row.host_id) && row.host_id !== me.id && !blocked.has(row.host_id) && !currentRoom) {
        toast(t("startedRoom", { name: row.host_name }), t("joinNow"), () => joinRoom(row));
      }
      if (currentRoom && row && row.id === currentRoom.id && row.is_live === false && row.host_id !== me.id) {
        toast(t("roomEnded")); leaveRoom(); return;
      }
      if (!$("#screen-main").hidden && currentTab === "rooms") reloadRoomsSoon();
    })
    .subscribe();
  // drop rooms whose host disappeared, even when nothing else changes
  setInterval(() => { if (!$("#screen-main").hidden && currentTab === "rooms") loadRooms(); }, 45000);
}
let reloadTimer = null;
function reloadRoomsSoon() { clearTimeout(reloadTimer); reloadTimer = setTimeout(loadRooms, 1500); }

/* ---------------- Create room ---------------- */
let createType = "public", createWhen = "now";
$("#new-room-btn").addEventListener("click", () => {
  if (profile?.banned) return toast(t("e_banned"));
  $("#room-title").value = "";
  if (roomFilter) $("#room-lang").value = roomFilter;
  setSeg("#room-type", (createType = "public"));
  setSeg("#room-when", (createWhen = "now"));
  $("#room-time-box").hidden = true;
  show("screen-create");
});
function setSeg(sel, v) { document.querySelectorAll(sel + " .chip").forEach((c) => c.classList.toggle("on", c.dataset.v === v)); }
$("#room-type").addEventListener("click", (e) => { const c = e.target.closest("[data-v]"); if (c) setSeg("#room-type", (createType = c.dataset.v)); });
$("#room-when").addEventListener("click", (e) => {
  const c = e.target.closest("[data-v]"); if (!c) return;
  setSeg("#room-when", (createWhen = c.dataset.v));
  $("#room-time-box").hidden = createWhen !== "later";
  if (createWhen === "later" && !$("#room-time").value) {
    const d = new Date(Date.now() + 3600e3); d.setMinutes(0, 0, 0);
    $("#room-time").value = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }
});
$("#create-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = $("#room-title").value.trim();
  if (title.length < 2) return toast(t("titleShort"));
  let startsAt = null;
  if (createWhen === "later") {
    const d = new Date($("#room-time").value);
    if (isNaN(d) || d.getTime() < Date.now() + 60e3) return toast(t("timeInPast"));
    startsAt = d.toISOString();
  }
  const btn = $("#create-submit"); btn.disabled = true;
  const row = {
    title, language: $("#room-lang").value, level: $("#room-level").value,
    host_name: (profile?.name || t("guest")).slice(0, 40), host_avatar: safeAvatar(profile?.avatar_url) || null,
    is_private: createType === "private",
    join_code: createType === "private" ? String(Math.floor(100000 + Math.random() * 900000)) : null,
    starts_at: startsAt, max_people: Number($("#room-max").value) || 20,
  };
  const { data, error } = await sb.from("rooms").insert(row).select().single();
  btn.disabled = false;
  if (error) { console.error(error); return toast(t("createFail") + error.message); }
  if (startsAt) { goMain("rooms"); toast(t("scheduled"), t("share"), () => shareRoom(data)); }
  else joinRoom(data, data.join_code);
});

/* ---------------- Share ---------------- */
function roomLink(r) {
  const u = new URL(location.href.split("?")[0].split("#")[0]);
  u.searchParams.set("room", r.id);
  if (r.join_code) u.searchParams.set("code", r.join_code);
  return u.toString();
}
async function shareRoom(r) {
  if (!r) return;
  const url = roomLink(r);
  const text = t("shareText", { lang: (LANGS[r.language] || r.language).replace(/^\S+\s/, ""), title: r.title });
  if (navigator.share) { try { await navigator.share({ title: "Talk Together", text, url }); return; } catch (e) { if (e?.name === "AbortError") return; } }
  try { await navigator.clipboard.writeText(`${text}\n${url}`); toast(t("linkCopied")); }
  catch { prompt(t("share"), url); }
}
async function openRoomLink(id, code) {
  const { data, error } = await sb.rpc("get_room", { p_id: id, p_code: code || null });
  const row = Array.isArray(data) ? data[0] : null;
  if (error || !row || !row.is_live) return toast(t("e_room_closed"));
  if (row.starts_at && new Date(row.starts_at).getTime() > Date.now() && row.host_id !== me.id) {
    return toast(`${t("e_not_started")} ${t("startsAt", { time: fmtTime(row.starts_at) })}`);
  }
  joinRoom(row, code);
}

/* ---------------- Partners tab ---------------- */
async function renderPartnersTab() {
  const box = $("#tab-partners");
  const learning = (profile?.learning || []).map((l) => l.lang).filter(Boolean);
  let html = `<h1>${esc(t("partnersTitle"))}</h1><p class="muted">${esc(t("partnersHint"))}</p>`;
  if (!profile?.native_lang || !learning.length) {
    html += `<div class="empty"><span class="big">🤝</span>${esc(t("setLangsFirst"))}<br><br><button class="btn sm" id="go-edit">${esc(t("editLangs"))}</button></div>`;
  } else html += `<div id="partner-list"><div class="empty">…</div></div>`;
  html += `<h2 class="section">${esc(t("followingTitle"))}</h2><div id="following-list"><div class="empty">…</div></div>`;
  box.innerHTML = html;
  box.querySelector("#go-edit")?.addEventListener("click", openEditProfile);

  if (profile?.native_lang && learning.length) {
    const { data } = await sb.from("profiles")
      .select("id,name,avatar_url,country,native_lang,learning,bio,xp,streak,minutes,best_streak")
      .neq("id", me.id).eq("banned", false).in("native_lang", learning)
      .contains("learning", JSON.stringify([{ lang: profile.native_lang }]))
      .order("xp", { ascending: false }).limit(30);
    const list = (data || []).filter((p) => !blocked.has(p.id));
    list.forEach((p) => profileCache.set(p.id, p));
    if ($("#partner-list")) $("#partner-list").innerHTML = list.length ? list.map(personRow).join("") : `<div class="empty"><span class="big">🌱</span>${esc(t("noPartners"))}</div>`;
  }
  const ids = [...following];
  let fl = [];
  if (ids.length) {
    const { data } = await sb.from("profiles").select("id,name,avatar_url,country,native_lang,learning,bio,xp,streak,minutes,best_streak").in("id", ids.slice(0, 100));
    fl = data || []; fl.forEach((p) => profileCache.set(p.id, p));
  }
  if ($("#following-list")) $("#following-list").innerHTML = fl.length ? fl.map(personRow).join("") : `<div class="empty">${esc(t("noFollowing"))}</div>`;
  box.querySelectorAll("[data-person]").forEach((el) => el.addEventListener("click", () => openProfile(el.dataset.person)));
}
function langsLine(p) {
  const native = p.native_lang ? `${t("speaks")}: ${(LANGS[p.native_lang] || p.native_lang)}` : "";
  const learn = (p.learning || []).map((l) => (LANGS[l.lang] || l.lang).replace(/^\S+\s/, "") + " " + (LEVEL_CODES[l.level] || "").split("–")[0]).join(", ");
  return [native, learn ? `${t("learns")}: ${learn}` : ""].filter(Boolean).join(" · ");
}
function personRow(p) {
  return `<div class="row-item" data-person="${esc(p.id)}">${avHtml(p.name, p.avatar_url, "sm")}
    <div class="info"><div class="name" dir="auto">${esc(p.name)} ${flag(p.country)}</div><div class="meta">${esc(langsLine(p))}</div></div>
    <span class="pill">⭐ ${p.xp || 0}</span></div>`;
}

/* ---------------- Ranking tab ---------------- */
async function renderRankingTab() {
  const box = $("#tab-ranking");
  box.innerHTML = `<h1>${esc(t("rankingTitle"))}</h1><div id="my-rank"></div><div id="rank-list"><div class="empty">…</div></div>`;
  const [top, above] = await Promise.all([
    sb.from("profiles").select("id,name,avatar_url,country,native_lang,learning,bio,xp,streak,minutes,best_streak").eq("banned", false).order("xp", { ascending: false }).limit(50),
    sb.from("profiles").select("id", { count: "exact", head: true }).eq("banned", false).gt("xp", profile?.xp || 0),
  ]);
  const rows = top.data || [];
  rows.forEach((p) => profileCache.set(p.id, p));
  if (!$("#rank-list")) return;
  $("#my-rank").innerHTML = `<div class="hero" style="margin:8px 0 14px"><div class="hello">${esc(t("yourRank", { n: (above.count || 0) + 1 }))}</div>
    <div class="stats"><span class="stat">⭐ ${profile?.xp || 0} ${esc(t("xp"))}</span><span class="stat">🔥 ${profile?.streak || 0}</span></div></div>`;
  const medal = (i) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1);
  $("#rank-list").innerHTML = rows.map((p, i) => `<div class="row-item ${p.id === me.id ? "me" : ""}" data-person="${esc(p.id)}">
      <span class="rank">${medal(i)}</span>${avHtml(p.name, p.avatar_url, "sm")}
      <div class="info"><div class="name" dir="auto">${esc(p.name)} ${flag(p.country)}</div><div class="meta">🔥 ${p.streak || 0} · ${p.minutes || 0} ${esc(t("minutesLbl"))}</div></div>
      <span class="pill">⭐ ${p.xp || 0}</span></div>`).join("") || `<div class="empty">—</div>`;
  box.querySelectorAll("[data-person]").forEach((el) => el.addEventListener("click", () => openProfile(el.dataset.person)));
}
function badgesHtml(p) {
  const list = [
    { ic: "🌱", k: "b10", got: (p.minutes || 0) >= 10 },
    { ic: "⏱️", k: "b60", got: (p.minutes || 0) >= 60 },
    { ic: "🏆", k: "b600", got: (p.minutes || 0) >= 600 },
    { ic: "🔥", k: "bStreak7", got: (p.best_streak || 0) >= 7 },
  ];
  return `<div class="badges">${list.map((b) => `<div class="badge-item ${b.got ? "got" : ""}"><div class="ic">${b.ic}</div>${esc(t(b.k))}</div>`).join("")}</div>`;
}

/* ---------------- Me tab ---------------- */
function renderMeTab() {
  const p = profile || {};
  $("#tab-me").innerHTML = `
    <div class="card">
      <div class="profile-head">
        <span class="ring">${avHtml(p.name, p.avatar_url, "lg")}</span>
        <div class="nm" dir="auto">${esc(p.name || "")} ${flag(p.country)}</div>
        ${p.bio ? `<div class="muted" dir="auto">${esc(p.bio)}</div>` : ""}
        <div class="muted small">${esc(langsLine(p))}</div>
      </div>
      <div class="stats3"><div><b>${p.xp || 0}</b><span>${esc(t("xp"))}</span></div><div><b>🔥 ${p.streak || 0}</b><span>${esc(t("dayStreak"))}</span></div><div><b>${p.minutes || 0}</b><span>${esc(t("minutesLbl"))}</span></div></div>
      <div class="group-title" style="margin:6px 0 10px">${esc(t("badges"))}</div>
      ${badgesHtml(p)}
    </div>
    <div class="menu">
      <button type="button" id="me-edit">✏️ ${esc(t("editProfile"))}</button>
      <button type="button" id="me-saved">⭐ ${esc(t("savedWords"))}</button>
    </div>
    <div class="menu">
      <label>🌐 ${esc(t("appLanguage"))}<select id="me-lang">${uiLangOptions()}</select></label>
      <a href="privacy.html" target="_blank" rel="noopener">📄 ${esc(t("privacy"))}</a>
      ${isAdmin ? `<a href="admin.html" target="_blank" rel="noopener">🛡️ ${esc(t("adminPanel"))}</a>` : ""}
      <button type="button" id="me-id">🪪 ${esc(t("yourId"))}<span class="end">${esc(me.id.slice(0, 8))}…</span></button>
      <button type="button" id="me-delete" class="danger">🗑️ ${esc(t("deleteAccount"))}</button>
    </div>`;
  $("#me-edit").addEventListener("click", openEditProfile);
  $("#me-saved").addEventListener("click", openSaved);
  $("#me-lang").addEventListener("change", (e) => setUiLang(e.target.value));
  $("#me-id").addEventListener("click", async () => { try { await navigator.clipboard.writeText(me.id); toast(t("copied")); } catch { prompt(t("yourId"), me.id); } });
  $("#me-delete").addEventListener("click", deleteAccount);
}

/* ---------------- Edit profile ---------------- */
let editLearning = [];
function openEditProfile() {
  const p = profile || {};
  pendingPhoto = null;
  $("#edit-photo-preview").innerHTML = safeAvatar(p.avatar_url) ? `<img src="${esc(p.avatar_url)}" alt="">` : "📷";
  $("#edit-name").value = p.name || "";
  const cs = COUNTRIES.map((c) => ({ c, n: countryName(c) })).sort((a, b) => a.n.localeCompare(b.n, uiLang));
  $("#edit-country").innerHTML = `<option value="">${esc(t("choose"))}</option>` + cs.map(({ c, n }) => `<option value="${c}" ${c === p.country ? "selected" : ""}>${flag(c)} ${esc(n)}</option>`).join("");
  $("#edit-native").innerHTML = langOptions(p.native_lang || "", true);
  editLearning = (p.learning || []).map((l) => ({ ...l }));
  if (!editLearning.length) editLearning.push({ lang: "", level: "beginner" });
  renderLearningRows();
  $("#edit-bio").value = p.bio || "";
  show("screen-edit");
}
function renderLearningRows() {
  $("#edit-learning").innerHTML = editLearning.map((l, i) => `<div class="learn-row">
      <select data-i="${i}" data-k="lang">${langOptions(l.lang, true)}</select>
      <select data-i="${i}" data-k="level">${levelOptions(l.level)}</select>
      <button type="button" class="icon-btn" data-del="${i}" aria-label="remove">✕</button></div>`).join("");
  $("#edit-add-lang").hidden = editLearning.length >= 3;
}
$("#edit-learning").addEventListener("change", (e) => {
  const s = e.target.closest("select[data-i]"); if (!s) return;
  editLearning[Number(s.dataset.i)][s.dataset.k] = s.value;
});
$("#edit-learning").addEventListener("click", (e) => {
  const b = e.target.closest("[data-del]"); if (!b) return;
  editLearning.splice(Number(b.dataset.del), 1); renderLearningRows();
});
$("#edit-add-lang").addEventListener("click", () => { if (editLearning.length < 3) { editLearning.push({ lang: "", level: "beginner" }); renderLearningRows(); } });
$("#edit-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = $("#edit-name").value.trim();
  if (name.length < 2) return toast(t("nameShort"));
  const btn = e.submitter; if (btn) btn.disabled = true;
  try {
    const seen = new Set();
    const learning = editLearning.filter((l) => l.lang && !seen.has(l.lang) && seen.add(l.lang)).map((l) => ({ lang: l.lang, level: l.level || "beginner" }));
    const row = { name, country: $("#edit-country").value || null, native_lang: $("#edit-native").value || null, learning, bio: $("#edit-bio").value.trim() || null };
    if (pendingPhoto) { row.avatar_url = await uploadPhoto(pendingPhoto); pendingPhoto = null; }
    const { data, error } = await sb.from("profiles").update(row).eq("id", me.id).select().single();
    if (error) throw error;
    profile = data; profileCache.set(profile.id, profile);
    toast(t("profileSaved"));
    goMain("me");
  } catch (err) { console.error(err); toast(t("error") + (err?.message || err)); }
  finally { if (btn) btn.disabled = false; }
});

/* ---------------- Saved words ---------------- */
async function openSaved() {
  show("screen-saved");
  const box = $("#saved-list");
  box.innerHTML = `<div class="empty">…</div>`;
  const { data } = await sb.from("saved_words").select("*").order("created_at", { ascending: false }).limit(200);
  const rows = data || [];
  box.innerHTML = rows.length ? rows.map((w) => `<div class="row-item" style="cursor:default">
      <div class="info"><div class="name" dir="auto" style="white-space:normal">${esc(w.text)}</div><div class="meta">${esc(new Date(w.created_at).toLocaleDateString(uiLang))}</div></div>
      <button class="icon-btn" data-tr="${esc(w.text)}" aria-label="translate">🌐</button>
      <button class="icon-btn" data-delw="${w.id}" aria-label="delete">🗑️</button></div>`).join("")
    : `<div class="empty"><span class="big">⭐</span>${esc(t("noSaved"))}</div>`;
  box.querySelectorAll("[data-tr]").forEach((b) => b.addEventListener("click", () => translateText(b.dataset.tr)));
  box.querySelectorAll("[data-delw]").forEach((b) => b.addEventListener("click", async () => {
    await sb.from("saved_words").delete().eq("id", Number(b.dataset.delw));
    openSaved();
  }));
}
function translateText(text) {
  const tl = uiLang === "ckb" ? "ckb" : uiLang;
  window.open(`https://translate.google.com/?sl=auto&tl=${encodeURIComponent(tl)}&text=${encodeURIComponent(text)}&op=translate`, "_blank", "noopener");
}
async function saveWord(text) {
  const { error } = await sb.from("saved_words").insert({ text: text.slice(0, 300) });
  toast(error ? t("error") + error.message : t("savedOk"));
}

/* ---------------- Delete account ---------------- */
async function deleteAccount() {
  if (!confirm(t("deleteConfirm"))) return;
  try {
    await sb.storage.from("avatars").remove([`${me.id}/avatar.jpg`]).catch(() => {});
    const { error } = await sb.rpc("delete_my_account");
    if (error) throw error;
    await sb.auth.signOut().catch(() => {});
    me = null; profile = null; following.clear(); blocked.clear();
    toast(t("deleted"));
    show("screen-name");
  } catch (err) { toast(t("error") + (err?.message || err)); }
}

/* =====================================================================
   Profile sheet, follow, block, report
   ===================================================================== */
async function getProfile(id) {
  if (profileCache.has(id)) return profileCache.get(id);
  const { data } = await sb.from("profiles").select("id,name,avatar_url,country,native_lang,learning,bio,xp,streak,minutes,best_streak").eq("id", id).maybeSingle();
  if (data) profileCache.set(id, data);
  return data;
}
async function openProfile(id, participant) {
  const p = (await getProfile(id)) || { id, name: participant?.name || t("guest"), avatar_url: partMeta(participant || {}).avatar };
  const isMe = id === me.id;
  const inRoom = participant && lk && currentRoom;
  const hostHere = inRoom && amHost() && !isMe && id !== currentRoom.host_id;
  const speaker = inRoom && isSpeaker(participant);
  let actions = "";
  if (!isMe) {
    actions += `<button class="btn ${following.has(id) ? "ghost" : ""}" id="sh-follow">${esc(following.has(id) ? t("unfollow") : t("follow"))}</button>`;
    if (hostHere) {
      if (speaker) actions += `<button class="btn ghost" id="sh-speaker">${esc(t("toListener"))}</button>`;
      else {
        actions += `<button class="btn ghost" id="sh-invite">🎙️ ${esc(t("inviteToStage"))}</button>`;
        if (handUp(participant)) actions += `<button class="btn ghost" id="sh-speaker">${esc(t("allow"))}</button>`;
      }
      actions += `<button class="btn danger-ghost" id="sh-kick">🚪 ${esc(t("removeFromRoom"))}</button>`;
    }
    actions += `<button class="btn line" id="sh-report">🚩 ${esc(t("report"))}</button>`;
    actions += `<button class="btn danger-ghost" id="sh-block">${esc(blocked.has(id) ? t("unblock") : "⛔ " + t("block"))}</button>`;
  }
  openSheet(`
    <div class="profile-head">
      <span class="ring">${avHtml(p.name, p.avatar_url, "lg")}</span>
      <div class="nm" dir="auto">${esc(p.name)} ${flag(p.country)}</div>
      ${p.bio ? `<div class="muted" dir="auto">${esc(p.bio)}</div>` : ""}
      <div class="muted small">${esc(langsLine(p))}</div>
    </div>
    <div class="stats3"><div><b>${p.xp || 0}</b><span>${esc(t("xp"))}</span></div><div><b>🔥 ${p.streak || 0}</b><span>${esc(t("dayStreak"))}</span></div><div><b>${p.minutes || 0}</b><span>${esc(t("minutesLbl"))}</span></div></div>
    ${badgesHtml(p)}
    <div class="actions">${actions}</div>`);
  $("#sh-follow")?.addEventListener("click", () => toggleFollow(id).then(() => openProfile(id, participant)));
  $("#sh-block")?.addEventListener("click", () => toggleBlock(id).then(() => closeSheet()));
  $("#sh-report")?.addEventListener("click", () => openReport({ userId: id }));
  $("#sh-speaker")?.addEventListener("click", async () => { closeSheet(); await setSpeaker(id, !speaker); });
  $("#sh-invite")?.addEventListener("click", async () => { closeSheet(); await inviteToStage(id); });
  $("#sh-kick")?.addEventListener("click", async () => {
    if (!confirm(t("removeConfirm", { name: p.name }))) return;
    closeSheet(); await hostAction({ action: "kick", identity: id });
  });
}
async function toggleFollow(id) {
  if (following.has(id)) { await sb.from("follows").delete().eq("follower", me.id).eq("followee", id); following.delete(id); }
  else { const { error } = await sb.from("follows").insert({ followee: id }); if (!error) following.add(id); else toast(t("error") + error.message); }
  if (currentTab === "partners" && !$("#screen-main").hidden) renderPartnersTab();
}
async function toggleBlock(id) {
  if (blocked.has(id)) { await sb.from("blocks").delete().eq("blocker", me.id).eq("blocked", id); blocked.delete(id); }
  else {
    const { error } = await sb.from("blocks").insert({ blocked: id });
    if (error) return toast(t("error") + error.message);
    blocked.add(id);
    if (following.has(id)) { await sb.from("follows").delete().eq("follower", me.id).eq("followee", id); following.delete(id); }
    toast(t("blockedOk"));
  }
  applyBlockToRoom();
}
function openReport({ userId, roomId }) {
  const reasons = [["spam", "reasonSpam"], ["harassment", "reasonHarass"], ["inappropriate", "reasonInappropriate"], ["underage", "reasonUnderage"], ["other", "reasonOther"]];
  openSheet(`<h1>🚩 ${esc(t("reportTitle"))}</h1>
    <form id="report-form">
      ${reasons.map(([v, k], i) => `<label class="reason"><input type="radio" name="reason" value="${v}" ${i === 0 ? "checked" : ""}>${esc(t(k))}</label>`).join("")}
      <textarea id="report-details" maxlength="500" dir="auto" placeholder="${esc(t("detailsPh"))}"></textarea>
      <div class="actions"><button type="button" class="btn line" id="report-cancel">${esc(t("cancel"))}</button><button type="submit" class="btn">${esc(t("send"))}</button></div>
    </form>`);
  $("#report-cancel").addEventListener("click", closeSheet);
  $("#report-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const reason = e.target.querySelector("input[name=reason]:checked")?.value || "other";
    const { error } = await sb.from("reports").insert({
      reported_user: userId || null, room_id: roomId || currentRoom?.id || null,
      reason, details: $("#report-details").value.trim() || null,
    });
    closeSheet();
    toast(error ? t("error") + error.message : t("reportSent"));
  });
}

/* =====================================================================
   Voice room (LiveKit) — stage with seats, audience, chat with replies
   ===================================================================== */
const MAX_STAGE = 8;               // seats on stage, host included
let replyTo = null, heartbeatTimer = null, accessToken = null;
const pendingInvites = new Set();  // people the host invited to the stage
const enc = (o) => new TextEncoder().encode(JSON.stringify(o));

function amHost() { return !!(currentRoom && me && currentRoom.host_id === me.id); }
function isSpeaker(p) { return !!p && (p.identity === currentRoom?.host_id || !!p.permissions?.canPublish); }
function handUp(p) { return p?.attributes?.hand === "1"; }
function allParticipants() { return lk ? [lk.localParticipant, ...lk.remoteParticipants.values()] : []; }
function stageCount() { return allParticipants().filter(isSpeaker).length; }
function findParticipant(id) { return !lk ? null : id === lk.localParticipant.identity ? lk.localParticipant : lk.remoteParticipants.get(id); }
function hostParticipant() { return currentRoom ? findParticipant(currentRoom.host_id) : null; }

function setRoomHeader(row) {
  $("#room-title-view").textContent = row.title;
  $("#room-tags").innerHTML = `<span class="tg live">LIVE</span><span class="tg">${esc(LANGS[row.language] || row.language)}</span>
    <span class="tg lv">${esc(LEVEL_CODES[row.level] || "")}</span>${row.is_private ? `<span class="tg">🔒</span>` : ""}`;
  const f = $("#room-follow");
  f.hidden = !me || row.host_id === me.id;
  if (!f.hidden) { const on = following.has(row.host_id); f.textContent = on ? t("unfollow") : t("follow"); f.classList.toggle("on", on); }
}
$("#room-follow").addEventListener("click", async () => { if (!currentRoom) return; await toggleFollow(currentRoom.host_id); setRoomHeader(currentRoom); });

/* ---------- help when voice can't start on a phone ---------- */
function inAppBrowser() {
  const ua = navigator.userAgent || "";
  return /FBAN|FBAV|FB_IAB|Instagram|Snapchat|musical_ly|TikTok|Line\/|; wv\)/i.test(ua);
}
function showVoiceHelp(message, link) {
  const tips = [t("tip1"), t("tip2"), t("tip3")];
  openSheet(`<div class="invite-card"><div class="big">🎧</div><h1>${esc(t("joinFailTitle"))}</h1></div>
    ${message ? `<div class="notice" dir="auto">${esc(message)}</div>` : ""}
    <ul class="muted" style="padding-inline-start:20px;margin:8px 0">${tips.map((x) => `<li style="margin:6px 0">${esc(x)}</li>`).join("")}</ul>
    <div class="actions"><button type="button" class="btn line" id="vh-copy">🔗 ${esc(t("copyLink"))}</button><button type="button" class="btn" id="vh-ok">${esc(t("close"))}</button></div>`);
  $("#vh-copy").addEventListener("click", async () => {
    const url = link || location.href;
    try { await navigator.clipboard.writeText(url); toast(t("linkCopied")); } catch { prompt(t("copyLink"), url); }
  });
  $("#vh-ok").addEventListener("click", closeSheet);
}

async function joinRoom(row, code) {
  if (!row || lk) return;
  if (profile?.banned) return toast(t("e_banned"));
  if (!LivekitClient.isBrowserSupported()) return showVoiceHelp(t("browserUnsupported"), roomLink({ ...row, join_code: code || row.join_code }));
  currentRoom = row; currentCode = code || row.join_code || null;
  replyTo = null; $("#reply-bar").hidden = true; pendingInvites.clear();
  setRoomHeader(row);
  $("#room-status").textContent = t("connecting");
  $("#seats").innerHTML = ""; $("#audience").innerHTML = ""; $("#topic-box").innerHTML = ""; $("#chat-list").innerHTML = "";
  $("#mic-btn").disabled = true; $("#mic-btn").hidden = true; $("#hand-btn").hidden = true; $("#topic-btn").hidden = true;
  show("screen-room");

  try {
    const { data: { session } } = await sb.auth.getSession();
    accessToken = session?.access_token || null;
    const { data, error } = await sb.functions.invoke(CONFIG.FUNCTION, { body: { roomId: row.id, code: currentCode } });
    if (error) {
      let code2 = "";
      try { code2 = (await error.context.json()).error; } catch {}
      const e2 = new Error(errText(code2, error.message));
      e2.known = !!(code2 && I18N.en["e_" + code2]); // room full, removed, not started… — no browser tips needed
      throw e2;
    }
    const E = LivekitClient.RoomEvent;
    const room = new LivekitClient.Room({
      adaptiveStream: true, dynacast: true,
      audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    lk = room;
    room
      .on(E.TrackSubscribed, (track, _pub, p) => {
        if (track.kind === "audio") $("#audio-sink").appendChild(track.attach());
        if (blocked.has(p.identity)) p.setVolume?.(0);
        renderPeople();
      })
      .on(E.TrackUnsubscribed, (track) => { track.detach().forEach((el) => el.remove()); renderPeople(); })
      .on(E.ParticipantConnected, (p) => { if (!blocked.has(p.identity)) addSystem(t("joined", { name: p.name || t("guest") })); renderPeople(); })
      .on(E.ParticipantDisconnected, (p) => { pendingInvites.delete(p.identity); renderPeople(); })
      .on(E.ActiveSpeakersChanged, renderPeople)
      .on(E.TrackMuted, renderPeople)
      .on(E.TrackUnmuted, renderPeople)
      .on(E.LocalTrackPublished, renderPeople)
      .on(E.LocalTrackUnpublished, renderPeople)
      .on(E.ParticipantMetadataChanged, renderPeople)
      .on(E.AudioPlaybackStatusChanged, updateAudioUnlock)
      .on(E.ParticipantPermissionsChanged, async (prev, p) => {
        const canSpeak = !!room.localParticipant.permissions?.canPublish;
        if (p === room.localParticipant && prev && !!prev.canPublish !== canSpeak) {
          if (canSpeak) { toast(t("youCanSpeak")); try { await room.localParticipant.setMicrophoneEnabled(true); } catch { toast(t("micDenied")); } }
          else toast(t("youAreListener"));
        }
        renderPeople();
      })
      .on(E.ParticipantAttributesChanged, (changed, p) => {
        if (amHost() && p !== room.localParticipant && changed.hand === "1") toast(t("handRaisedBy", { name: p.name || t("guest") }));
        if ("topic" in changed) renderTopic();
        renderPeople();
      })
      .on(E.DataReceived, (payload, p, _kind, topic) => {
        if (!p) return;
        let msg; try { msg = JSON.parse(new TextDecoder().decode(payload)); } catch { return; }
        if (topic === "chat" && msg?.type === "chat" && typeof msg.text === "string") addChat(p, msg.text.slice(0, 300), cleanReply(msg.reply));
        if (topic !== "control" || !msg) return;
        const fromHost = p.identity === currentRoom?.host_id;
        if (msg.type === "end" && fromHost) { toast(t("roomEnded")); leaveRoom(); }
        if (msg.type === "invite" && fromHost) showInvite(p);
        if (msg.type === "invite_accept" && amHost() && pendingInvites.has(p.identity)) {
          pendingInvites.delete(p.identity);
          if (stageCount() >= MAX_STAGE) toast(t("stageFull")); else setSpeaker(p.identity, true);
        }
        if (msg.type === "invite_decline" && amHost()) { pendingInvites.delete(p.identity); toast(t("inviteDeclined", { name: p.name || t("guest") })); }
      })
      .on(E.Disconnected, (reason) => {
        if (lk !== room) return;
        toast(reason === LivekitClient.DisconnectReason?.PARTICIPANT_REMOVED ? t("removedFromRoom") : t("disconnected"));
        leaveRoom();
      });

    await room.connect(data.url, data.token);
    try { await room.startAudio(); } catch {}
    if (room.localParticipant.permissions?.canPublish) {
      try { await room.localParticipant.setMicrophoneEnabled(true); } catch (err) { console.warn(err); toast(t("micDenied")); }
    }
    $("#mic-btn").disabled = false;
    addSystem(t("connected"));
    if (amHost()) startHeartbeat();
    applyBlockToRoom(); updateAudioUnlock(); renderPeople(); renderTopic();
    startPractice();
  } catch (err) {
    console.error(err);
    const msg = err?.message || String(err);
    const link = roomLink({ ...row, join_code: currentCode || row.join_code });
    await leaveRoom();
    if (err?.known) toast(msg);
    else showVoiceHelp(`${t("joinFail")}${msg}`, link);
  }
}

/* the host's app tells the server every 30 s that the room is still alive */
function startHeartbeat() {
  clearInterval(heartbeatTimer);
  const beat = () => { if (currentRoom && amHost()) sb.from("rooms").update({ last_seen: new Date().toISOString() }).eq("id", currentRoom.id).then(() => {}); };
  beat();
  heartbeatTimer = setInterval(beat, 30000);
}

function applyBlockToRoom() {
  if (!lk) return;
  lk.remoteParticipants.forEach((p) => p.setVolume?.(blocked.has(p.identity) ? 0 : 1));
}
function updateAudioUnlock() { $("#audio-unlock").hidden = !lk || lk.canPlaybackAudio; }
$("#audio-unlock").addEventListener("click", async () => { try { await lk?.startAudio(); } catch {} updateAudioUnlock(); });

/* ---------- stage + audience ---------- */
const SEAT_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/></svg>`;
function seatHtml(p, i) {
  if (!p) return `<button type="button" class="seat empty" data-seat="${i}"><span class="ring2">${i === 0 ? "👑" : SEAT_SVG}</span><span class="nm">${i + 1}</span></button>`;
  const name = p.name || t("guest"), meta = partMeta(p);
  const isHost = p.identity === currentRoom.host_id, isMe = p === lk.localParticipant;
  const speaking = p.isSpeaking && p.isMicrophoneEnabled;
  return `<button type="button" class="seat ${speaking ? "speaking" : ""}" data-pid="${esc(p.identity)}" ${blocked.has(p.identity) ? 'style="opacity:.4"' : ""}>
    <span class="ring2">${avHtml(name, meta.avatar, "md")}${!p.isMicrophoneEnabled ? '<span class="muted-ic">🔇</span>' : ""}
      ${meta.country ? `<span class="flag-b">${flag(meta.country)}</span>` : ""}${isHost ? '<span class="host-b">👑</span>' : ""}</span>
    <span class="nm" dir="auto">${esc(name)}${isMe ? " " + esc(t("you")) : ""}</span></button>`;
}
function audHtml(p) {
  const name = p.name || t("guest"), meta = partMeta(p);
  return `<button type="button" class="aud" data-pid="${esc(p.identity)}" ${blocked.has(p.identity) ? 'style="opacity:.4"' : ""}>
    ${avHtml(name, meta.avatar, "sm")}${handUp(p) ? '<span class="hand">✋</span>' : ""}${meta.country ? `<span class="fl">${flag(meta.country)}</span>` : ""}
    <span class="nm" dir="auto">${esc(name)}</span></button>`;
}
const AUD_SHOW = 12;
function listenersSorted() { return allParticipants().filter((p) => !isSpeaker(p)).sort((a, b) => handUp(b) - handUp(a)); }
function renderPeople() {
  if (!lk || !currentRoom) return;
  const all = allParticipants();
  const host = all.find((p) => p.identity === currentRoom.host_id) || null;
  const stage = [host, ...all.filter((p) => isSpeaker(p) && p !== host)].slice(0, MAX_STAGE);
  while (stage.length < MAX_STAGE) stage.push(null);
  $("#seats").innerHTML = stage.map(seatHtml).join("");
  const listeners = listenersSorted();
  $("#audience").innerHTML = listeners.slice(0, AUD_SHOW).map(audHtml).join("") +
    (listeners.length > AUD_SHOW ? `<button type="button" class="aud more" id="aud-more"><span class="av">+${listeners.length - AUD_SHOW}</span><span class="nm">${esc(t("othersCount"))}</span></button>` : "");
  $("#audience").hidden = !listeners.length;
  $("#room-status").textContent = t("people", { n: all.length }) + (listeners.length ? ` · ${t("listeningCount", { n: listeners.length })}` : "");

  const local = lk.localParticipant, canSpeak = isSpeaker(local), micOn = local.isMicrophoneEnabled;
  $("#mic-btn").hidden = !canSpeak; $("#hand-btn").hidden = canSpeak; $("#topic-btn").hidden = !amHost();
  $("#mic-btn").textContent = micOn ? "🎙️" : "🔇";
  $("#mic-btn").classList.toggle("on", micOn); $("#mic-btn").classList.toggle("off", !micOn);
  $("#mic-btn").title = micOn ? t("micOn") : t("micOff");
  $("#hand-btn").classList.toggle("on", handUp(local));
  $("#hand-btn").title = handUp(local) ? t("lowerHand") : t("raiseHand");
}

/* taps inside the room */
document.addEventListener("click", (e) => {
  if (!lk || $("#screen-room").hidden) return;
  const seat = e.target.closest("[data-seat]");
  if (seat) { onEmptySeat(); return; }
  if (e.target.closest("#aud-more")) { openAudienceSheet(); return; }
  const inv = e.target.closest("[data-invite]");
  if (inv) { closeSheet(); inviteToStage(inv.dataset.invite); return; }
  const person = e.target.closest("[data-pid]");
  if (person) { closeSheet(); openProfile(person.dataset.pid, findParticipant(person.dataset.pid)); }
});
function onEmptySeat() {
  const local = lk.localParticipant;
  if (amHost()) return openInvitePicker();
  if (!isSpeaker(local) && !handUp(local)) $("#hand-btn").click();
}
function openInvitePicker() {
  const list = listenersSorted();
  openSheet(`<h1>🎙️ ${esc(t("inviteToStage"))}</h1>` + (list.length ? list.map((p) => {
    const name = p.name || t("guest"), meta = partMeta(p);
    return `<div class="row-item" style="cursor:default">${avHtml(name, meta.avatar, "sm")}
      <div class="info"><div class="name" dir="auto">${esc(name)} ${flag(meta.country)} ${handUp(p) ? "✋" : ""}</div></div>
      <button type="button" class="btn sm" data-invite="${esc(p.identity)}">${esc(t("inviteBtn"))}</button></div>`;
  }).join("") : `<div class="empty">—</div>`));
}
function openAudienceSheet() {
  const list = listenersSorted();
  openSheet(`<h1>🎧 ${esc(t("listeners"))} (${list.length})</h1>` + list.map((p) => {
    const name = p.name || t("guest"), meta = partMeta(p);
    return `<div class="row-item" data-pid="${esc(p.identity)}">${avHtml(name, meta.avatar, "sm")}
      <div class="info"><div class="name" dir="auto">${esc(name)} ${flag(meta.country)} ${handUp(p) ? "✋" : ""}</div></div></div>`;
  }).join(""));
}

/* ---------- host actions ---------- */
async function hostAction(body) {
  const { error } = await sb.functions.invoke(CONFIG.FUNCTION, { body: { roomId: currentRoom.id, code: currentCode, ...body } });
  if (error) {
    let code = ""; try { code = (await error.context.json()).error; } catch {}
    toast(t("error") + errText(code, error.message));
  }
}
async function setSpeaker(identity, allow) {
  if (allow && stageCount() >= MAX_STAGE) return toast(t("stageFull"));
  await hostAction({ action: "set_speaker", identity, allow });
}
async function sendControl(obj, identities) {
  if (!lk) return;
  try { await lk.localParticipant.publishData(enc(obj), { reliable: true, topic: "control", destinationIdentities: identities }); }
  catch (err) { toast(t("error") + (err?.message || err)); }
}
async function inviteToStage(identity) {
  if (!amHost()) return;
  if (stageCount() >= MAX_STAGE) return toast(t("stageFull"));
  pendingInvites.add(identity);
  await sendControl({ type: "invite" }, [identity]);
  toast(t("inviteSent"));
}
function showInvite(hostP) {
  const name = hostP.name || t("guest");
  openSheet(`<div class="invite-card"><div class="big">🎙️</div><h1>${esc(t("invitedYou", { name }))}</h1></div>
    <div class="actions"><button type="button" class="btn line" id="inv-no">${esc(t("decline"))}</button><button type="button" class="btn" id="inv-yes">${esc(t("accept"))}</button></div>`);
  $("#inv-yes").addEventListener("click", () => { closeSheet(); sendControl({ type: "invite_accept" }, [hostP.identity]); });
  $("#inv-no").addEventListener("click", () => { closeSheet(); sendControl({ type: "invite_decline" }, [hostP.identity]); });
}

/* ---------- controls ---------- */
$("#mic-btn").addEventListener("click", async () => {
  if (!lk) return;
  const btn = $("#mic-btn"); btn.disabled = true;
  try { await lk.localParticipant.setMicrophoneEnabled(!lk.localParticipant.isMicrophoneEnabled); }
  catch (err) { toast(t("micFail") + (err?.message || err)); }
  btn.disabled = false; renderPeople();
});
$("#hand-btn").addEventListener("click", async () => {
  if (!lk) return;
  const up = !handUp(lk.localParticipant);
  try { await lk.localParticipant.setAttributes({ hand: up ? "1" : "0" }); if (up) toast(t("handSent")); }
  catch (err) { toast(t("error") + (err?.message || err)); }
  renderPeople();
});

/* topic cards (host draws, everyone sees — kept on the host's attributes) */
function renderTopic() {
  const topic = hostParticipant()?.attributes?.topic || "";
  $("#topic-box").innerHTML = topic ? `<div class="topic"><div class="lbl">🃏 ${esc(t("topicTitle"))}</div><div class="txt">${esc(topic)}</div></div>` : "";
}
$("#topic-btn").addEventListener("click", async () => {
  if (!lk || !amHost()) return;
  const list = TOPICS[currentRoom.level] || TOPICS.beginner;
  const cur = lk.localParticipant.attributes?.topic;
  let next = list[Math.floor(Math.random() * list.length)];
  if (list.length > 1) while (next === cur) next = list[Math.floor(Math.random() * list.length)];
  try { await lk.localParticipant.setAttributes({ topic: next }); } catch (err) { toast(t("error") + (err?.message || err)); }
  renderTopic();
});

/* ---------- chat with replies ---------- */
function cleanReply(r) {
  return r && typeof r.name === "string" && typeof r.text === "string" ? { name: r.name.slice(0, 40), text: r.text.slice(0, 80) } : null;
}
function scrollChat() {
  const body = $(".stage-body");
  if (body.scrollHeight - body.scrollTop - body.clientHeight < 220) body.scrollTop = body.scrollHeight;
}
function trimChat() { const list = $("#chat-list"); while (list.children.length > 150) list.firstElementChild.remove(); }
function addSystem(text) {
  const div = document.createElement("div");
  div.className = "smsg sys";
  div.innerHTML = `<div class="bub">${esc(text)}</div>`;
  $("#chat-list").appendChild(div); trimChat(); scrollChat();
}
function addChat(p, text, reply) {
  if (blocked.has(p.identity)) return;
  const mine = lk && p === lk.localParticipant, isHost = p.identity === currentRoom?.host_id;
  const name = p.name || t("guest");
  const div = document.createElement("div");
  div.className = `smsg ${mine ? "mine" : ""} ${isHost ? "host" : ""}`;
  div.innerHTML = `${avHtml(name, partMeta(p).avatar, "xs")}<div class="bub">
    ${reply ? `<div class="quote" dir="auto">↩ ${esc(reply.name)}: ${esc(reply.text)}</div>` : ""}
    <span class="who" dir="auto">${isHost ? "👑 " : ""}${esc(name)}</span><span dir="auto">${esc(text)}</span></div>`;
  div.querySelector(".bub").addEventListener("click", () => msgActions(name, text));
  $("#chat-list").appendChild(div); trimChat(); scrollChat();
}
function msgActions(name, text) {
  openSheet(`<div class="muted small" dir="auto" style="margin-bottom:8px"><b>${esc(name)}:</b> ${esc(text)}</div>
    <div class="menu" style="box-shadow:none">
      <button type="button" id="ma-reply">↩️ ${esc(t("reply"))}</button>
      <button type="button" id="ma-tr">🌐 ${esc(t("translate"))}</button>
      <button type="button" id="ma-save">⭐ ${esc(t("saveWord"))}</button>
      <button type="button" id="ma-close">${esc(t("close"))}</button></div>`);
  $("#ma-reply").addEventListener("click", () => { closeSheet(); setReply(name, text); });
  $("#ma-tr").addEventListener("click", () => { closeSheet(); translateText(text); });
  $("#ma-save").addEventListener("click", () => { closeSheet(); saveWord(text); });
  $("#ma-close").addEventListener("click", closeSheet);
}
function setReply(name, text) {
  replyTo = cleanReply({ name, text });
  $("#reply-text").textContent = `↩️ ${t("replyingTo", { name })}: ${text}`;
  $("#reply-bar").hidden = false;
  $("#chat-input").focus();
}
$("#reply-cancel").addEventListener("click", () => { replyTo = null; $("#reply-bar").hidden = true; });
let lastChatAt = 0;
$("#chat-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = $("#chat-input");
  const text = input.value.trim().slice(0, 300);
  if (!text || !lk || Date.now() - lastChatAt < 700) return;
  lastChatAt = Date.now();
  const msg = { type: "chat", text };
  if (replyTo) msg.reply = replyTo;
  try {
    await lk.localParticipant.publishData(enc(msg), { reliable: true, topic: "chat" });
    addChat(lk.localParticipant, text, replyTo);
    input.value = ""; replyTo = null; $("#reply-bar").hidden = true;
    $(".stage-body").scrollTop = $(".stage-body").scrollHeight;
  } catch (err) { toast(t("error") + (err?.message || err)); }
});

/* XP: one point a minute (two while speaking) */
function startPractice() {
  clearInterval(practiceTimer);
  practiceTimer = setInterval(async () => {
    if (!lk) return;
    const local = lk.localParticipant;
    const speaking = isSpeaker(local) && local.isMicrophoneEnabled;
    const before = profile?.streak || 0;
    const { data } = await sb.rpc("add_practice_minute", { p_speaking: speaking });
    const r = Array.isArray(data) ? data[0] : null;
    if (r && profile) {
      profile.xp = r.o_xp; profile.streak = r.o_streak; profile.minutes = r.o_minutes;
      profile.best_streak = Math.max(profile.best_streak || 0, r.o_streak);
      if (r.o_streak > before) toast(t("streakUp", { n: r.o_streak }));
    }
  }, 60000);
}

/* ---------- share / menu / leave / end ---------- */
$("#room-share").addEventListener("click", () => shareRoom({ ...currentRoom, join_code: currentCode || currentRoom?.join_code }));
$("#room-more").addEventListener("click", () => {
  openSheet(`<div class="menu" style="box-shadow:none">
    <button type="button" id="rm-share">🔗 ${esc(t("share"))}</button>
    ${amHost() ? `<button type="button" id="rm-invite">🎙️ ${esc(t("inviteToStage"))}</button>` : ""}
    ${amHost() ? `<button type="button" id="rm-end" class="danger">⏹ ${esc(t("endRoom"))}</button>`
               : `<button type="button" id="rm-report" class="danger">🚩 ${esc(t("reportRoom"))}</button>`}
    <button type="button" id="rm-leave">🚪 ${esc(t("leave"))}</button>
    <button type="button" id="rm-close">${esc(t("close"))}</button></div>`);
  $("#rm-share").addEventListener("click", () => { closeSheet(); $("#room-share").click(); });
  $("#rm-invite")?.addEventListener("click", openInvitePicker);
  $("#rm-end")?.addEventListener("click", () => { closeSheet(); endRoom(true); });
  $("#rm-report")?.addEventListener("click", () => openReport({ roomId: currentRoom?.id }));
  $("#rm-leave").addEventListener("click", () => { closeSheet(); tryLeave(); });
  $("#rm-close").addEventListener("click", closeSheet);
});
async function leaveRoom() {
  clearInterval(practiceTimer); practiceTimer = null;
  clearInterval(heartbeatTimer); heartbeatTimer = null;
  const room = lk; lk = null; currentRoom = null; currentCode = null; replyTo = null; pendingInvites.clear();
  if (room) { try { await room.disconnect(); } catch {} }
  $("#audio-sink").innerHTML = ""; $("#chat-list").innerHTML = ""; $("#audio-unlock").hidden = true; $("#reply-bar").hidden = true;
  closeSheet();
  if (me && profile) goMain("rooms");
}
/* when the host leaves, the room ends for everyone */
async function endRoom(ask) {
  if (!currentRoom) return;
  if (ask && !confirm(t("endConfirm"))) return;
  try { await lk?.localParticipant.publishData(enc({ type: "end" }), { reliable: true, topic: "control" }); } catch {}
  const { error } = await sb.from("rooms").update({ is_live: false }).eq("id", currentRoom.id);
  if (error) toast(t("error") + error.message);
  leaveRoom();
}
function tryLeave() {
  if (amHost()) { if (confirm(t("leaveEndConfirm"))) endRoom(false); }
  else leaveRoom();
}
$("#room-back").addEventListener("click", tryLeave);

window.addEventListener("pagehide", () => {
  // host closed the page: end the room right away (keepalive lets the request finish)
  if (currentRoom && amHost() && accessToken) {
    try {
      fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rooms?id=eq.${encodeURIComponent(currentRoom.id)}`, {
        method: "PATCH", keepalive: true,
        headers: { apikey: CONFIG.SUPABASE_KEY, Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ is_live: false }),
      });
    } catch {}
  }
  try { lk?.disconnect(); } catch {}
});

/* ---------- PWA ---------- */
if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
