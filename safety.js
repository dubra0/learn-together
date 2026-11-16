/* =====================================================================
   🛡️ Room safety
   - bad words in live chat become *** (English, Kurdish, Arabic, Turkish, Persian)
   - the host can turn off someone's mic, or stop / allow their chat (done on the server: smooth-worker)
   - the person is told when the host does this
   Uses globals from app.js: lk, currentRoom, amHost, hostAction, toast, t, I18N, $.
   ===================================================================== */
"use strict";

(() => {
  const W = {
    en: { sf_muteMic: "🔇 Turn off mic", sf_muteChat: "🚫 Stop chat", sf_allowChat: "💬 Allow chat", sf_micOff: "🔇 The host turned off your mic",
      sf_chatOff: "🚫 The host stopped your chat in this room", sf_chatOn: "💬 You can chat again", sf_done: "✅ Done", sf_noChat: "🚫 The host stopped your chat" },
    ckb: { sf_muteMic: "🔇 کوژاندنەوەی مایک", sf_muteChat: "🚫 ڕاگرتنی چات", sf_allowChat: "💬 ڕێگەدان بە چات", sf_micOff: "🔇 خاوەنی ژوور مایکەکەی کوژاندیتەوە",
      sf_chatOff: "🚫 خاوەنی ژوور چاتی لێ ڕاگرتیت لەم ژوورەدا", sf_chatOn: "💬 دەتوانیت دووبارە بنووسیت", sf_done: "✅ کرا", sf_noChat: "🚫 خاوەنی ژوور چاتی لێ ڕاگرتوویت" },
    ar: { sf_muteMic: "🔇 إيقاف الميكروفون", sf_muteChat: "🚫 إيقاف الدردشة", sf_allowChat: "💬 السماح بالدردشة", sf_micOff: "🔇 أوقف المضيف الميكروفون الخاص بك",
      sf_chatOff: "🚫 أوقف المضيف دردشتك في هذه الغرفة", sf_chatOn: "💬 يمكنك الدردشة مجدداً", sf_done: "✅ تم", sf_noChat: "🚫 أوقف المضيف دردشتك" },
  };
  try { for (const [l, o] of Object.entries(W)) if (I18N[l]) Object.assign(I18N[l], o); } catch {}
})();

/* ---------- bad-word filter ----------
   whole words only (so normal words that contain the same letters are not touched);
   a word ending in * also catches longer forms (fuck → fucking, fucker …) */
const BAD_WORDS = [
  // English
  "fuck*", "motherfuck*", "shit", "shits", "shitty", "bullshit", "shithead", "bitch*", "bastard*", "asshole*", "dick", "dickhead", "pussy", "cunt*", "whore*", "slut*",
  "nigger*", "nigga*", "faggot*", "retard*", "wanker*", "porn*",
  // Kurdish (Sorani)
  "قەحبە*", "قحبە*", "قەحپە*", "کیر", "کێر", "کیرم", "قوز", "قوزی", "حیز", "حیزە", "بێشەرەف", "بی‌شەرەف", "گووخۆر", "دایکی قەحبە",
  // Arabic
  "قحبة", "قحبه", "شرموط*", "منيوك*", "منيك", "عرص", "زب", "زبي", "كس", "كسمك", "كس امك", "ابن الكلب", "ابن القحبة", "خول", "متناك",
  // Turkish
  "amk", "aq", "orospu*", "siktir*", "sikerim", "sikik", "yarrak*", "piç", "pic", "göt", "götveren", "amına*",
  // Persian
  "جنده*", "کسکش", "کونی", "مادرجنده", "کیری",
];
const norm = (s) => s.normalize("NFC").replace(/[ً-ْـ]/g, "");      // drop Arabic marks and stretching
const BAD_RE = (() => {
  const esc = (w) => norm(w).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = BAD_WORDS.map((w) => (w.endsWith("*") ? esc(w.slice(0, -1)) + "[\\p{L}]*" : esc(w)));
  return new RegExp(`(?<![\\p{L}\\p{N}])(?:${parts.join("|")})(?![\\p{L}\\p{N}])`, "giu");
})();
function cleanText(s) {
  if (typeof s !== "string" || !s) return s;
  const star = (m) => "*".repeat(Math.min(6, [...m].length));
  BAD_RE.lastIndex = 0;
  const plain = norm(s);
  if (BAD_RE.test(plain)) { BAD_RE.lastIndex = 0; return plain.replace(BAD_RE, star); }
  // fuuuuck → fuck (letters said many times) — only changes the text when it hides a bad word
  const squeezed = plain.replace(/(\p{L})\1{2,}/gu, "$1");
  BAD_RE.lastIndex = 0;
  if (BAD_RE.test(squeezed)) { BAD_RE.lastIndex = 0; return squeezed.replace(BAD_RE, star); }
  return s;
}

/* ---------- host tools in the profile sheet of someone in the room ---------- */
function safetyButtons(participant) {
  if (!participant || !currentRoom || typeof amHost !== "function" || !amHost()) return "";
  const canChat = participant.permissions ? participant.permissions.canPublishData !== false : true;
  const micOn = !!participant.isMicrophoneEnabled;
  return (micOn ? `<button class="btn ghost" id="sf-mic">${esc(t("sf_muteMic"))}</button>` : "") +
    `<button class="btn ${canChat ? "danger-ghost" : "ghost"}" id="sf-chat" data-allow="${canChat ? "0" : "1"}">${esc(t(canChat ? "sf_muteChat" : "sf_allowChat"))}</button>`;
}
function wireSafetyButtons(identity) {
  $("#sf-mic")?.addEventListener("click", async () => {
    closeSheet();
    await hostAction({ action: "mute", identity });
    toast(t("sf_done"));
  });
  $("#sf-chat")?.addEventListener("click", async (e) => {
    const allow = e.currentTarget.dataset.allow === "1";
    closeSheet();
    await hostAction({ action: "chat", identity, allow });
    toast(t("sf_done"));
  });
}

/* ---------- tell the person when the host turns off their mic or chat ---------- */
let sfWired = null;
setInterval(() => {
  if (typeof lk === "undefined" || !lk || sfWired === lk) return;
  sfWired = lk;
  const room = lk, E = LivekitClient.RoomEvent;
  let hadChat = room.localParticipant.permissions?.canPublishData !== false;
  room.on(E.ParticipantPermissionsChanged, (_prev, p) => {
    if (p !== room.localParticipant) return;
    const canChat = p.permissions?.canPublishData !== false;
    if (canChat !== hadChat) toast(t(canChat ? "sf_chatOn" : "sf_chatOff"));
    hadChat = canChat;
    const input = document.getElementById("chat-input");
    if (input) { input.disabled = !canChat; input.placeholder = canChat ? (t("chatPh") || "") : t("sf_noChat"); }
  });
  room.on(E.TrackMuted, (pub, p) => {
    // muted by the host (not by me pressing the mic button)
    if (p === room.localParticipant && pub?.source === LivekitClient.Track.Source.Microphone && !window._selfMuting) toast(t("sf_micOff"));
  });
}, 1000);
