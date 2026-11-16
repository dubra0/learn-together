/* =====================================================================
   🔔 Phone notifications (Web Push)
   - asks once (nicely) to turn notifications on, and there is an on/off switch in ⚙️ Settings
   - after I send a message / gift / follow / start a live, the server function "clever-task" (send-push.ts)
     checks that it really happened and notifies the other person(s)
   - iPhone: works only after "Add to Home Screen" (Apple's rule)
   Uses globals from app.js: sb, me, uiLang, store, toast, t, I18N, esc.
   ===================================================================== */
"use strict";

(() => {
  const W = {
    en: { pn_title: "Turn on notifications?", pn_text: "Know when friends go live, message you or send you a gift.", pn_on: "Turn on", pn_later: "Not now",
      pn_menu: "🔔 Notifications", pn_onState: "On", pn_offState: "Off", pn_done: "🔔 Notifications are on", pn_blocked: "Notifications are blocked. Allow them in your phone settings for this app.",
      pn_ios: "On iPhone, first add the app to your Home Screen (Share → Add to Home Screen), then turn notifications on.", pn_fail: "Could not turn on notifications: ", pn_offDone: "🔕 Notifications are off" },
    ckb: { pn_title: "ئاگادارکردنەوە هەڵبکەیت؟", pn_text: "بزانە کەی هاوڕێکانت لایڤ دەکەن، نامەت بۆ دەنێرن یان دیاریت بۆ دەنێرن.", pn_on: "هەڵیبکە", pn_later: "ئێستا نا",
      pn_menu: "🔔 ئاگادارکردنەوە", pn_onState: "هەڵکراوە", pn_offState: "کوژاوەتەوە", pn_done: "🔔 ئاگادارکردنەوە هەڵکرا", pn_blocked: "ئاگادارکردنەوە ڕێگری لێ کراوە. لە ڕێکخستنەکانی مۆبایلەکەت ڕێگەی پێ بدە بۆ ئەم ئەپە.",
      pn_ios: "لە iPhone، سەرەتا ئەپەکە بخە سەر شاشەی سەرەکی (Share ← Add to Home Screen)، پاشان ئاگادارکردنەوە هەڵبکە.", pn_fail: "نەتوانرا ئاگادارکردنەوە هەڵبکرێت: ", pn_offDone: "🔕 ئاگادارکردنەوە کوژایەوە" },
    ar: { pn_title: "تفعيل الإشعارات؟", pn_text: "اعرف متى يبدأ أصدقاؤك البث أو يراسلونك أو يرسلون لك هدية.", pn_on: "تفعيل", pn_later: "ليس الآن",
      pn_menu: "🔔 الإشعارات", pn_onState: "مفعّلة", pn_offState: "متوقفة", pn_done: "🔔 تم تفعيل الإشعارات", pn_blocked: "الإشعارات محظورة. اسمح بها من إعدادات الهاتف لهذا التطبيق.",
      pn_ios: "على iPhone أضف التطبيق أولاً إلى الشاشة الرئيسية (مشاركة ← إضافة إلى الشاشة الرئيسية) ثم فعّل الإشعارات.", pn_fail: "تعذر تفعيل الإشعارات: ", pn_offDone: "🔕 تم إيقاف الإشعارات" },
  };
  try { for (const [l, o] of Object.entries(W)) if (I18N[l]) Object.assign(I18N[l], o); } catch {}
})();

const PUSH_FN = "clever-task"; // the Supabase function with the code of supabase/send-push.ts
const pushSupported = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
const isIOSDevice = /iphone|ipad|ipod/i.test(navigator.userAgent);
const runsAsApp = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

function b64ToBytes(b64) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}
const bytesToB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

async function pushReg() {
  // the app registers sw.js on https; make sure it is there (also on first visits)
  let reg = await navigator.serviceWorker.getRegistration();
  if (!reg) reg = await navigator.serviceWorker.register("sw.js");
  return navigator.serviceWorker.ready.then(() => reg);
}

async function enablePush() {
  if (!pushSupported()) { toast(isIOSDevice ? t("pn_ios") : t("pn_fail") + "—"); return false; }
  if (isIOSDevice && !runsAsApp()) { toast(t("pn_ios")); return false; }
  try {
    const perm = await Notification.requestPermission();
    if (perm !== "granted") { toast(t("pn_blocked")); return false; }
    const reg = await pushReg();
    const { data, error } = await sb.functions.invoke(PUSH_FN, { body: { action: "key" } });
    if (error || !data?.key) throw new Error(error?.message || "server");
    let sub = await reg.pushManager.getSubscription();
    if (sub && sub.options?.applicationServerKey && bytesToB64(sub.options.applicationServerKey) !== data.key) { await sub.unsubscribe(); sub = null; }
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(data.key) });
    const j = sub.toJSON();
    const r = await sb.rpc("claim_push_sub", { p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth, p_lang: (typeof uiLang === "string" ? uiLang : "en").slice(0, 8) });
    if (r.error) throw r.error;
    try { store.set("pushOn", "1"); } catch {}
    toast(t("pn_done"));
    return true;
  } catch (err) { console.warn("push", err); toast(t("pn_fail") + (err?.message || err)); return false; }
}
async function disablePush() {
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (sub) { await sb.rpc("remove_push_sub", { p_endpoint: sub.endpoint }); await sub.unsubscribe(); }
  } catch (e) { console.warn(e); }
  try { store.set("pushOn", "0"); } catch {}
  toast(t("pn_offDone"));
}
async function pushIsOn() {
  if (!pushSupported() || Notification.permission !== "granted") return false;
  try { const reg = await navigator.serviceWorker.getRegistration(); return !!(await reg?.pushManager.getSubscription()); } catch { return false; }
}

/* tell the server something happened (it checks, then notifies) — never blocks the app */
function pushNotify(kind, extra) {
  try { if (!sb || !me) return; sb.functions.invoke(PUSH_FN, { body: { action: "notify", kind, ...extra } }).catch(() => {}); } catch {}
}

/* the friendly "turn on?" card: once after signing in, then again after 7 days if they said "not now" */
function maybeAskPush() {
  if (!pushSupported() || Notification.permission !== "default") return;
  if (isIOSDevice && !runsAsApp()) return;
  try { if (Date.now() < Number(store.get("pushAskLater") || 0)) return; } catch {}
  if (document.getElementById("push-ask")) return;
  const card = document.createElement("div");
  card.id = "push-ask";
  card.innerHTML = `<div class="pa-ic">🔔</div><div class="pa-t"><b>${esc(t("pn_title"))}</b><span>${esc(t("pn_text"))}</span></div>
    <div class="pa-b"><button type="button" class="btn sm" id="pa-on">${esc(t("pn_on"))}</button><button type="button" class="btn sm line" id="pa-later">${esc(t("pn_later"))}</button></div>`;
  document.body.appendChild(card);
  card.querySelector("#pa-on").addEventListener("click", async () => { card.remove(); await enablePush(); });
  card.querySelector("#pa-later").addEventListener("click", () => {
    try { store.set("pushAskLater", String(Date.now() + 7 * 24 * 3600e3)); } catch {}
    card.remove();
  });
}
// wait until signed in, then ask after a short moment; keep the phone's subscription fresh
const pushWait = setInterval(async () => {
  if (typeof me === "undefined" || !me || typeof sb === "undefined" || !sb) return;
  clearInterval(pushWait);
  setTimeout(maybeAskPush, 8000);
  try { if (store.get("pushOn") === "1" && Notification.permission === "granted") enablePushQuiet(); } catch {}
}, 1500);
// re-save the subscription silently (it can change, or the account on this phone can change)
async function enablePushQuiet() {
  try {
    const reg = await navigator.serviceWorker.getRegistration(); if (!reg) return;
    const sub = await reg.pushManager.getSubscription(); if (!sub) return;
    const j = sub.toJSON();
    await sb.rpc("claim_push_sub", { p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth, p_lang: (typeof uiLang === "string" ? uiLang : "en").slice(0, 8) });
  } catch {}
}

window.Push = { enable: enablePush, disable: disablePush, isOn: pushIsOn, notify: pushNotify, ask: maybeAskPush };
