/* =====================================================================
   Talk Together — wallet: 🪙 coins, 💎 diamonds, premium gifts, withdrawals
   Every money action is checked on the server (update-12-wallet.sql).
   Uses globals from app.js: sb, me, profile, lk, currentRoom, t, esc, toast, openSheet, closeSheet,
   giftTargets, addSystem, amHost, hostBattle, openGifts, uiLang.
   Note: on purpose there is NO "buy" button or link in the app (Google Play rules).
   ===================================================================== */
"use strict";

/* ---------- strings ---------- */
const I18N_W = {
  en: { w_wallet: "Wallet", w_coins: "Coins", w_diamonds: "Diamonds", w_paidGifts: "Premium gifts", w_freeGifts: "Free gifts", w_send: "Send",
    w_noCoins: "Not enough coins.", w_sent: "Gift sent! 🎉", w_got: "{name} sent you {gift} · +{d} 💎", w_onHold: "On hold", w_available: "Available",
    w_holdNote: "Diamonds from gifts can be withdrawn after {n} days.", w_yourId: "Your ID", w_copyId: "Copy ID",
    w_convert: "Diamonds → coins", w_convertBtn: "Convert", w_converted: "+{n} 🪙 added", w_withdraw: "Withdraw money", w_amount: "Diamonds",
    w_method: "Send to", w_account: "Your number", w_youGet: "You get ${usd} (fee {fee}%)", w_request: "Request withdrawal",
    w_requested: "Request sent. You will be paid after review.", w_min: "Minimum {n} 💎", w_history: "History", w_myRequests: "My withdrawals",
    w_pending: "Waiting", w_paid: "Paid", w_rejected: "Rejected", w_e_too_much: "You don't have that many available.",
    w_e_one_pending: "You already have a request waiting.", w_e_bad_account: "Check your number.", w_e_below_min: "Below the minimum.",
    w_e_blocked: "You can't send gifts to this person.", w_e_bad_target: "This person can't receive gifts.", w_empty: "Nothing yet.",
    w_tx_recharge: "Recharge", w_tx_gift_sent: "Gift sent", w_tx_gift_received: "Gift received", w_tx_convert: "Converted",
    w_tx_withdraw: "Withdrawal", w_tx_withdraw_refund: "Refund", w_tx_admin: "Adjustment", w_adminWallet: "Wallet admin", w_to: "To",
    w_m_fib: "FIB", w_m_zaincash: "Zain Cash", w_m_fastpay: "FastPay", w_tapAgain: "Tap again to send" },
  ckb: { w_wallet: "جزدان", w_coins: "سکە", w_diamonds: "ئەڵماس", w_paidGifts: "دیاریی تایبەت", w_freeGifts: "دیاریی بەخۆڕایی", w_send: "بینێرە",
    w_noCoins: "سکەی پێویستت نییە.", w_sent: "دیارییەکە نێردرا! 🎉", w_got: "{name} {gift} ی بۆ ناردیت · +{d} 💎", w_onHold: "چاوەڕوانە", w_available: "ئامادەیە",
    w_holdNote: "ئەڵماسی دیارییەکان دوای {n} ڕۆژ دەتوانرێت ڕابکێشرێت.", w_yourId: "ID ـەکەت", w_copyId: "کۆپیکردنی ID",
    w_convert: "ئەڵماس ← سکە", w_convertBtn: "بیگۆڕە", w_converted: "+{n} 🪙 زیاد کرا", w_withdraw: "ڕاکێشانی پارە", w_amount: "ئەڵماس",
    w_method: "بنێرە بۆ", w_account: "ژمارەکەت", w_youGet: "وەردەگریت ${usd} (ڕسوم {fee}٪)", w_request: "داواکاریی ڕاکێشان",
    w_requested: "داواکارییەکە نێردرا. دوای پشکنین پارەکەت بۆ دەنێردرێت.", w_min: "کەمترین {n} 💎", w_history: "مێژوو", w_myRequests: "ڕاکێشانەکانم",
    w_pending: "چاوەڕوان", w_paid: "دراوە", w_rejected: "ڕەتکراوە", w_e_too_much: "ئەوەندە ئەڵماسی ئامادەت نییە.",
    w_e_one_pending: "داواکارییەکی ترت هەیە کە چاوەڕوانە.", w_e_bad_account: "ژمارەکەت بپشکنە.", w_e_below_min: "لە کەمترین بڕ کەمترە.",
    w_e_blocked: "ناتوانیت دیاری بۆ ئەم کەسە بنێریت.", w_e_bad_target: "ئەم کەسە ناتوانێت دیاری وەربگرێت.", w_empty: "هێشتا هیچ نییە.",
    w_tx_recharge: "شەحن", w_tx_gift_sent: "دیاری نێردرا", w_tx_gift_received: "دیاری وەرگیرا", w_tx_convert: "گۆڕین",
    w_tx_withdraw: "ڕاکێشان", w_tx_withdraw_refund: "گەڕاندنەوە", w_tx_admin: "ڕاستکردنەوە", w_adminWallet: "بەڕێوەبردنی جزدان", w_to: "بۆ",
    w_m_fib: "FIB", w_m_zaincash: "زەین کاش", w_m_fastpay: "FastPay", w_tapAgain: "دووبارە کرتە بکە بۆ ناردن" },
  ar: { w_wallet: "المحفظة", w_coins: "العملات", w_diamonds: "الألماس", w_paidGifts: "هدايا مميزة", w_freeGifts: "هدايا مجانية", w_send: "أرسل",
    w_noCoins: "لا توجد عملات كافية.", w_sent: "تم إرسال الهدية! 🎉", w_got: "{name} أرسل لك {gift} · +{d} 💎", w_onHold: "قيد الانتظار", w_available: "متاح",
    w_holdNote: "يمكن سحب ألماس الهدايا بعد {n} أيام.", w_yourId: "معرّفك", w_copyId: "نسخ المعرّف",
    w_convert: "ألماس ← عملات", w_convertBtn: "حوّل", w_converted: "تمت إضافة +{n} 🪙", w_withdraw: "سحب الأموال", w_amount: "ألماس",
    w_method: "أرسل إلى", w_account: "رقمك", w_youGet: "ستحصل على ${usd} (رسوم {fee}٪)", w_request: "طلب سحب",
    w_requested: "تم إرسال الطلب. سيتم الدفع بعد المراجعة.", w_min: "الحد الأدنى {n} 💎", w_history: "السجل", w_myRequests: "طلبات السحب",
    w_pending: "قيد الانتظار", w_paid: "مدفوع", w_rejected: "مرفوض", w_e_too_much: "ليس لديك هذا القدر المتاح.",
    w_e_one_pending: "لديك طلب قيد الانتظار بالفعل.", w_e_bad_account: "تحقق من رقمك.", w_e_below_min: "أقل من الحد الأدنى.",
    w_e_blocked: "لا يمكنك إرسال هدايا لهذا الشخص.", w_e_bad_target: "لا يمكن لهذا الشخص استلام الهدايا.", w_empty: "لا شيء بعد.",
    w_tx_recharge: "شحن", w_tx_gift_sent: "هدية مرسلة", w_tx_gift_received: "هدية مستلمة", w_tx_convert: "تحويل",
    w_tx_withdraw: "سحب", w_tx_withdraw_refund: "استرداد", w_tx_admin: "تعديل", w_adminWallet: "إدارة المحفظة", w_to: "إلى",
    w_m_fib: "FIB", w_m_zaincash: "زين كاش", w_m_fastpay: "FastPay", w_tapAgain: "اضغط مرة أخرى للإرسال" },
  tr: { w_wallet: "Cüzdan", w_coins: "Jeton", w_diamonds: "Elmas", w_paidGifts: "Özel hediyeler", w_freeGifts: "Ücretsiz hediyeler", w_send: "Gönder",
    w_noCoins: "Yeterli jeton yok.", w_sent: "Hediye gönderildi! 🎉", w_got: "{name} sana {gift} gönderdi · +{d} 💎", w_onHold: "Beklemede", w_available: "Kullanılabilir",
    w_holdNote: "Hediyelerden gelen elmaslar {n} gün sonra çekilebilir.", w_yourId: "Kimliğin", w_copyId: "ID'yi kopyala",
    w_convert: "Elmas → jeton", w_convertBtn: "Çevir", w_converted: "+{n} 🪙 eklendi", w_withdraw: "Para çek", w_amount: "Elmas",
    w_method: "Gönderilecek yer", w_account: "Numaran", w_youGet: "Alacağın: ${usd} (kesinti %{fee})", w_request: "Çekim iste",
    w_requested: "İstek gönderildi. İncelemeden sonra ödeme yapılacak.", w_min: "En az {n} 💎", w_history: "Geçmiş", w_myRequests: "Çekimlerim",
    w_pending: "Bekliyor", w_paid: "Ödendi", w_rejected: "Reddedildi", w_e_too_much: "Bu kadar kullanılabilir elmasın yok.",
    w_e_one_pending: "Bekleyen bir isteğin zaten var.", w_e_bad_account: "Numaranı kontrol et.", w_e_below_min: "En düşük miktarın altında.",
    w_e_blocked: "Bu kişiye hediye gönderemezsin.", w_e_bad_target: "Bu kişi hediye alamaz.", w_empty: "Henüz bir şey yok.",
    w_tx_recharge: "Yükleme", w_tx_gift_sent: "Gönderilen hediye", w_tx_gift_received: "Gelen hediye", w_tx_convert: "Çevirme",
    w_tx_withdraw: "Çekim", w_tx_withdraw_refund: "İade", w_tx_admin: "Düzeltme", w_adminWallet: "Cüzdan yönetimi", w_to: "Alıcı",
    w_m_fib: "FIB", w_m_zaincash: "Zain Cash", w_m_fastpay: "FastPay", w_tapAgain: "Göndermek için tekrar dokun" },
  fa: { w_wallet: "کیف پول", w_coins: "سکه", w_diamonds: "الماس", w_paidGifts: "هدیه‌های ویژه", w_freeGifts: "هدیه‌های رایگان", w_send: "ارسال",
    w_noCoins: "سکهٔ کافی ندارید.", w_sent: "هدیه فرستاده شد! 🎉", w_got: "{name} برای شما {gift} فرستاد · +{d} 💎", w_onHold: "در انتظار", w_available: "در دسترس",
    w_holdNote: "الماس هدیه‌ها پس از {n} روز قابل برداشت است.", w_yourId: "شناسهٔ شما", w_copyId: "کپی شناسه",
    w_convert: "الماس ← سکه", w_convertBtn: "تبدیل", w_converted: "+{n} 🪙 اضافه شد", w_withdraw: "برداشت پول", w_amount: "الماس",
    w_method: "ارسال به", w_account: "شمارهٔ شما", w_youGet: "دریافتی شما ${usd} (کارمزد {fee}٪)", w_request: "درخواست برداشت",
    w_requested: "درخواست فرستاده شد. پس از بررسی پرداخت می‌شود.", w_min: "حداقل {n} 💎", w_history: "تاریخچه", w_myRequests: "برداشت‌های من",
    w_pending: "در انتظار", w_paid: "پرداخت شد", w_rejected: "رد شد", w_e_too_much: "این مقدار الماس در دسترس ندارید.",
    w_e_one_pending: "یک درخواست در انتظار دارید.", w_e_bad_account: "شماره را بررسی کنید.", w_e_below_min: "کمتر از حداقل است.",
    w_e_blocked: "نمی‌توانید به این شخص هدیه بدهید.", w_e_bad_target: "این شخص نمی‌تواند هدیه بگیرد.", w_empty: "هنوز چیزی نیست.",
    w_tx_recharge: "شارژ", w_tx_gift_sent: "هدیهٔ ارسالی", w_tx_gift_received: "هدیهٔ دریافتی", w_tx_convert: "تبدیل",
    w_tx_withdraw: "برداشت", w_tx_withdraw_refund: "بازگشت", w_tx_admin: "اصلاح", w_adminWallet: "مدیریت کیف پول", w_to: "به",
    w_m_fib: "FIB", w_m_zaincash: "زین کش", w_m_fastpay: "FastPay", w_tapAgain: "برای ارسال دوباره بزنید" },
  de: { w_wallet: "Geldbörse", w_coins: "Münzen", w_diamonds: "Diamanten", w_paidGifts: "Premium-Geschenke", w_freeGifts: "Gratis-Geschenke", w_send: "Senden",
    w_noCoins: "Nicht genug Münzen.", w_sent: "Geschenk gesendet! 🎉", w_got: "{name} hat dir {gift} geschickt · +{d} 💎", w_onHold: "Gesperrt", w_available: "Verfügbar",
    w_holdNote: "Diamanten aus Geschenken sind nach {n} Tagen auszahlbar.", w_yourId: "Deine ID", w_copyId: "ID kopieren",
    w_convert: "Diamanten → Münzen", w_convertBtn: "Umwandeln", w_converted: "+{n} 🪙 hinzugefügt", w_withdraw: "Auszahlen", w_amount: "Diamanten",
    w_method: "Senden an", w_account: "Deine Nummer", w_youGet: "Du erhältst ${usd} (Gebühr {fee} %)", w_request: "Auszahlung anfordern",
    w_requested: "Anfrage gesendet. Auszahlung nach Prüfung.", w_min: "Mindestens {n} 💎", w_history: "Verlauf", w_myRequests: "Meine Auszahlungen",
    w_pending: "Wartet", w_paid: "Bezahlt", w_rejected: "Abgelehnt", w_e_too_much: "So viele hast du nicht verfügbar.",
    w_e_one_pending: "Du hast schon eine offene Anfrage.", w_e_bad_account: "Prüfe deine Nummer.", w_e_below_min: "Unter dem Mindestbetrag.",
    w_e_blocked: "Du kannst dieser Person nichts schenken.", w_e_bad_target: "Diese Person kann keine Geschenke erhalten.", w_empty: "Noch nichts.",
    w_tx_recharge: "Aufladung", w_tx_gift_sent: "Geschenk gesendet", w_tx_gift_received: "Geschenk erhalten", w_tx_convert: "Umgewandelt",
    w_tx_withdraw: "Auszahlung", w_tx_withdraw_refund: "Erstattung", w_tx_admin: "Korrektur", w_adminWallet: "Geldbörse verwalten", w_to: "An",
    w_m_fib: "FIB", w_m_zaincash: "Zain Cash", w_m_fastpay: "FastPay", w_tapAgain: "Zum Senden erneut tippen" },
  fr: { w_wallet: "Portefeuille", w_coins: "Pièces", w_diamonds: "Diamants", w_paidGifts: "Cadeaux premium", w_freeGifts: "Cadeaux gratuits", w_send: "Envoyer",
    w_noCoins: "Pas assez de pièces.", w_sent: "Cadeau envoyé ! 🎉", w_got: "{name} t'a envoyé {gift} · +{d} 💎", w_onHold: "En attente", w_available: "Disponible",
    w_holdNote: "Les diamants des cadeaux sont retirables après {n} jours.", w_yourId: "Ton identifiant", w_copyId: "Copier l'ID",
    w_convert: "Diamants → pièces", w_convertBtn: "Convertir", w_converted: "+{n} 🪙 ajoutées", w_withdraw: "Retirer de l'argent", w_amount: "Diamants",
    w_method: "Envoyer sur", w_account: "Ton numéro", w_youGet: "Tu reçois ${usd} (frais {fee} %)", w_request: "Demander un retrait",
    w_requested: "Demande envoyée. Paiement après vérification.", w_min: "Minimum {n} 💎", w_history: "Historique", w_myRequests: "Mes retraits",
    w_pending: "En attente", w_paid: "Payé", w_rejected: "Refusé", w_e_too_much: "Tu n'en as pas autant de disponibles.",
    w_e_one_pending: "Tu as déjà une demande en attente.", w_e_bad_account: "Vérifie ton numéro.", w_e_below_min: "En dessous du minimum.",
    w_e_blocked: "Tu ne peux pas offrir de cadeau à cette personne.", w_e_bad_target: "Cette personne ne peut pas recevoir de cadeaux.", w_empty: "Rien pour l'instant.",
    w_tx_recharge: "Recharge", w_tx_gift_sent: "Cadeau envoyé", w_tx_gift_received: "Cadeau reçu", w_tx_convert: "Conversion",
    w_tx_withdraw: "Retrait", w_tx_withdraw_refund: "Remboursement", w_tx_admin: "Ajustement", w_adminWallet: "Gestion du portefeuille", w_to: "À",
    w_m_fib: "FIB", w_m_zaincash: "Zain Cash", w_m_fastpay: "FastPay", w_tapAgain: "Touche encore pour envoyer" },
  es: { w_wallet: "Billetera", w_coins: "Monedas", w_diamonds: "Diamantes", w_paidGifts: "Regalos premium", w_freeGifts: "Regalos gratis", w_send: "Enviar",
    w_noCoins: "No tienes suficientes monedas.", w_sent: "¡Regalo enviado! 🎉", w_got: "{name} te envió {gift} · +{d} 💎", w_onHold: "Retenido", w_available: "Disponible",
    w_holdNote: "Los diamantes de regalos se pueden retirar tras {n} días.", w_yourId: "Tu ID", w_copyId: "Copiar ID",
    w_convert: "Diamantes → monedas", w_convertBtn: "Convertir", w_converted: "+{n} 🪙 añadidas", w_withdraw: "Retirar dinero", w_amount: "Diamantes",
    w_method: "Enviar a", w_account: "Tu número", w_youGet: "Recibes ${usd} (comisión {fee} %)", w_request: "Solicitar retiro",
    w_requested: "Solicitud enviada. Se pagará tras revisarla.", w_min: "Mínimo {n} 💎", w_history: "Historial", w_myRequests: "Mis retiros",
    w_pending: "Pendiente", w_paid: "Pagado", w_rejected: "Rechazado", w_e_too_much: "No tienes tantos disponibles.",
    w_e_one_pending: "Ya tienes una solicitud pendiente.", w_e_bad_account: "Revisa tu número.", w_e_below_min: "Por debajo del mínimo.",
    w_e_blocked: "No puedes enviar regalos a esta persona.", w_e_bad_target: "Esta persona no puede recibir regalos.", w_empty: "Nada todavía.",
    w_tx_recharge: "Recarga", w_tx_gift_sent: "Regalo enviado", w_tx_gift_received: "Regalo recibido", w_tx_convert: "Conversión",
    w_tx_withdraw: "Retiro", w_tx_withdraw_refund: "Reembolso", w_tx_admin: "Ajuste", w_adminWallet: "Gestión de billetera", w_to: "Para",
    w_m_fib: "FIB", w_m_zaincash: "Zain Cash", w_m_fastpay: "FastPay", w_tapAgain: "Toca otra vez para enviar" },
};
for (const [l, o] of Object.entries(I18N_W)) if (I18N[l]) Object.assign(I18N[l], o);

/* ---------- styles for the wallet + premium gift panel ---------- */
(() => {
  const s = document.createElement("style");
  s.textContent = `
  .w-bal{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0}
  .w-bal > div{border-radius:18px;padding:14px;color:#fff}
  .w-bal .c{background:linear-gradient(135deg,#f59e0b,#f97316)} .w-bal .d{background:linear-gradient(135deg,#8b5cf6,#3b82f6)}
  .w-bal b{display:block;font-size:1.5rem;font-variant-numeric:tabular-nums} .w-bal span{font-size:.8rem;opacity:.9}
  .w-sub{font-size:.75rem;opacity:.9;margin-top:4px}
  .w-id{display:flex;align-items:center;gap:8px;background:var(--soft);border-radius:14px;padding:10px 12px;margin:10px 0}
  .w-id code{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;background:none;font-size:.8rem}
  .w-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap} .w-row > *{flex:1;min-width:120px}
  .w-calc{font-size:.85rem;color:var(--muted);margin-top:6px}
  .w-list{display:flex;flex-direction:column;gap:6px;margin-top:6px}
  .w-item{display:flex;justify-content:space-between;gap:8px;padding:9px 12px;border-radius:12px;background:var(--soft);font-size:.86rem}
  .w-item .amt{font-weight:800;font-variant-numeric:tabular-nums;white-space:nowrap}
  .w-item .plus{color:#16a34a} .w-item .minus{color:#e11d48}
  .w-st{border-radius:999px;padding:1px 9px;font-size:.75rem;font-weight:700}
  .w-st.pending{background:#fef3c7;color:#92400e} .w-st.paid{background:#dcfce7;color:#166534} .w-st.rejected{background:#ffe4e6;color:#9f1239}
  .pg-head{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
  .pg-coins{font-weight:800;color:#f59e0b;font-variant-numeric:tabular-nums}
  .pg-tabs{display:flex;gap:6px;margin:10px 0}
  .pg-tabs button{flex:1;border:0;border-radius:12px;padding:8px 4px;font:inherit;font-weight:700;font-size:.82rem;background:var(--soft);color:var(--ink);cursor:pointer}
  .pg-tabs button.on{background:linear-gradient(135deg,#8b5cf6,#3b82f6);color:#fff}
  .pg-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;max-height:42vh;overflow-y:auto}
  .pg-item{border:2px solid transparent;background:var(--soft);border-radius:14px;padding:8px 2px 6px;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;font:inherit;color:inherit}
  .pg-item .e{font-size:2rem;line-height:1.15} .pg-item .p{font-size:.72rem;font-weight:800;color:#f59e0b;font-variant-numeric:tabular-nums}
  .pg-item.on{border-color:#f59e0b;background:rgba(245,158,11,.12)} .pg-item.poor{opacity:.45}`;
  document.head.appendChild(s);
})();

/* ---------- state ---------- */
const W = { wallet: null, catalog: [], tab: "small", chosen: null, sending: false };
const fmtN = (n) => Number(n || 0).toLocaleString("en");
const TIER_OF = (id) => (window.GiftFX?.tierOf(id)) || "small";

async function loadWallet() {
  if (!sb || !me) return null;
  const { data, error } = await sb.rpc("get_wallet");
  if (error) { console.warn("wallet", error); return null; }
  W.wallet = Array.isArray(data) ? data[0] : null;
  return W.wallet;
}
async function loadCatalog() {
  if (W.catalog.length) return W.catalog;
  const { data } = await sb.from("gift_catalog").select("id,emoji,price,sort").eq("active", true).order("sort");
  W.catalog = (data || []).filter((g) => window.GiftFX?.has(g.id));
  return W.catalog;
}
const statusMsg = (st) => ({ no_coins: t("w_noCoins"), blocked: t("w_e_blocked"), bad_target: t("w_e_bad_target"), banned: t("e_banned"),
  too_much: t("w_e_too_much"), one_pending: t("w_e_one_pending"), bad_account: t("w_e_bad_account"), below_min: t("w_e_below_min") }[st] || (t("error") + st));

/* =====================================================================
   🎁 Premium gifts inside a room
   ===================================================================== */
// targets: given (from a profile) or everyone who can receive in the current room
async function openPaidGifts(given) {
  const targets = Array.isArray(given) && given.length ? given : (typeof giftTargets === "function") ? giftTargets() : [];
  if (!targets.length) return toast(t("giftNoTarget"));
  if (!W.target || !targets.some((x) => x.id === W.target)) W.target = targets[0].id;
  // seen before: open instantly with what we know, then refresh the coin count quietly
  const early = !!W.catalog?.length;
  if (early) { if (!W.chosen) W.chosen = W.catalog[0].id; renderPaid(targets); }
  await Promise.all([loadWallet(), loadCatalog()]);
  if (!W.chosen) W.chosen = W.catalog[0]?.id || null;
  if (early && !$("#pg-send")) return; // closed, or another sheet was opened meanwhile
  renderPaid(targets);
}
function renderPaid(targets) {
  const coins = W.wallet?.coins || 0;
  const list = W.catalog.filter((g) => TIER_OF(g.id) === W.tab);
  const tabs = [["small", "💝"], ["animals", "🦁"], ["special", "✨"]];
  openSheet(`<div class="pg-head"><h1 style="margin:0">🪙 ${esc(t("w_paidGifts"))}</h1><span class="pg-coins">🪙 ${fmtN(coins)}</span></div>
    <div class="muted small" style="margin-top:8px">${esc(t("sendTo"))}</div>
    <div class="gift-targets">${targets.map((x) => `<button type="button" class="btn sm ${x.id === W.target ? "" : "ghost"}" data-pt="${esc(x.id)}">${x.side === "a" ? "❤️ " : x.side === "b" ? "💙 " : ""}${esc(x.name)}</button>`).join("")}</div>
    <div class="pg-tabs">${tabs.map(([k, ic]) => `<button type="button" data-tab="${k}" class="${W.tab === k ? "on" : ""}">${ic}</button>`).join("")}</div>
    <div class="pg-grid">${list.map((g) => `<button type="button" class="pg-item ${g.id === W.chosen ? "on" : ""} ${g.price > coins ? "poor" : ""}" data-pg="${esc(g.id)}">
      <span class="e">${g.emoji}</span><span class="p">🪙 ${fmtN(g.price)}</span></button>`).join("") || `<div class="muted">${esc(t("w_empty"))}</div>`}</div>
    <button type="button" class="btn block" id="pg-send" style="margin-top:12px" ${W.sending ? "disabled" : ""}>${esc(t("w_send"))} ${W.catalog.find((g) => g.id === W.chosen)?.emoji || "🎁"}</button>`);
  document.querySelectorAll("#sheet [data-pt]").forEach((b) => b.addEventListener("click", () => { W.target = b.dataset.pt; renderPaid(targets); }));
  document.querySelectorAll("#sheet [data-tab]").forEach((b) => b.addEventListener("click", () => {
    W.tab = b.dataset.tab; W.chosen = W.catalog.find((g) => TIER_OF(g.id) === W.tab)?.id || null; renderPaid(targets);
  }));
  document.querySelectorAll("#sheet [data-pg]").forEach((b) => b.addEventListener("click", () => {
    if (W.chosen === b.dataset.pg) return sendPaidGift(targets); // second tap sends
    W.chosen = b.dataset.pg; renderPaid(targets);
  }));
  $("#pg-send").addEventListener("click", () => sendPaidGift(targets));
}
async function sendPaidGift(targets) {
  const g = W.catalog.find((x) => x.id === W.chosen);
  if (!g || !W.target || W.sending) return;
  if ((W.wallet?.coins || 0) < g.price) return toast(t("w_noCoins"));
  W.sending = true;
  try {
    const { data, error } = await sb.rpc("send_gift", { p_to: W.target, p_gift: g.id, p_room: currentRoom?.id || null });
    if (error) throw error;
    const r = Array.isArray(data) ? data[0] : null;
    if (r?.o_status !== "ok") { toast(statusMsg(r?.o_status)); if (r) W.wallet = { ...W.wallet, coins: r.o_coins }; return; }
    W.wallet = { ...W.wallet, coins: r.o_coins };
    const toName = targets.find((x) => x.id === W.target)?.name || "";
    if (TIER_OF(g.id) !== "small" || !currentRoom) closeSheet();
    window.GiftFX?.play(g.id, profile?.name || "", toName); // I see mine right away; others get it from the server
    if (currentRoom && typeof addSystem === "function") addSystem(`🪙 ${profile?.name || ""} ${g.emoji} → ${toName}`);
    if (!currentRoom) toast(t("w_sent"));
  } catch (err) { console.error(err); toast(t("error") + (err?.message || err)); }
  finally { W.sending = false; if (!$("#sheet").hidden && $("#pg-send")) renderPaid(targets); }
}

/* everyone in the room sees a paid gift (it comes from the server, so it can't be faked) */
let giftSub = null;
function subscribePaidGifts() {
  if (giftSub || !sb || !me) return;
  giftSub = sb.channel("paid-gifts")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "gift_sends" }, (payload) => {
      const row = payload.new; if (!row) return;
      const emoji = window.GiftFX?.emoji(row.gift_id) || "🎁";
      if (row.room_id && currentRoom && row.room_id === currentRoom.id) window.TopGifters?.soon(); // 👑 top gifters strip
      if (row.room_id && currentRoom && row.room_id === currentRoom.id && row.from_id !== me.id) {
        window.GiftFX?.play(row.gift_id, row.from_name, row.to_name);
        if (typeof addSystem === "function") addSystem(`🪙 ${row.from_name} ${emoji} → ${row.to_name}`);
        // in a battle, premium gifts count too (1 point per 10 coins)
        try {
          if (typeof amHost === "function" && amHost() && typeof hostBattle !== "undefined" && hostBattle && !hostBattle.done) {
            const pts = Math.max(1, Math.round(row.price / 10));
            if (row.to_id === hostBattle.a) hostBattle.sa += pts; else if (row.to_id === hostBattle.b) hostBattle.sb += pts;
          }
        } catch {}
      }
      if (row.to_id === me.id) {
        // a gift for me from outside my current room (e.g. from my profile): I still see the animation
        const shownInRoom = row.room_id && currentRoom && row.room_id === currentRoom.id;
        if (!shownInRoom && row.from_id !== me.id) window.GiftFX?.play(row.gift_id, row.from_name, row.to_name);
        toast(t("w_got", { name: row.from_name || "", gift: emoji, d: fmtN(row.diamonds) }));
        loadWallet();
      }
    })
    .subscribe();
}
// start once the app has signed in
const wWait = setInterval(() => { if (typeof sb !== "undefined" && sb && typeof me !== "undefined" && me) { clearInterval(wWait); subscribePaidGifts(); } }, 1000);

/* =====================================================================
   💰 Wallet screen
   ===================================================================== */
async function openWallet() {
  if (!W.wallet) openSheet(`<h1>💰 ${esc(t("w_wallet"))}</h1><div class="empty">…</div>`); // show something right away
  const [, tx, wd] = await Promise.all([ // everything at once, not one after another
    loadWallet(),
    sb.from("wallet_tx").select("kind,coins,diamonds,ref,created_at").order("created_at", { ascending: false }).limit(30),
    sb.from("withdrawals").select("diamonds,usd_net,method,status,note,created_at").order("created_at", { ascending: false }).limit(10),
  ]);
  const w = W.wallet || { coins: 0, diamonds: 0, held: 0, withdrawable: 0, usd_per_1000: 0.99, withdraw_fee: 0.03, min_withdraw: 5000, hold_days: 7, payout_methods: ["fib", "zaincash", "fastpay"] };
  const fee = Number(w.withdraw_fee) * 100;
  const day = (s) => new Date(s).toLocaleDateString(uiLang, { day: "numeric", month: "short" });
  openSheet(`<h1>💰 ${esc(t("w_wallet"))}</h1>
    <div class="w-bal">
      <div class="c"><span>🪙 ${esc(t("w_coins"))}</span><b>${fmtN(w.coins)}</b></div>
      <div class="d"><span>💎 ${esc(t("w_diamonds"))}</span><b>${fmtN(w.diamonds)}</b>
        <div class="w-sub">${esc(t("w_available"))}: ${fmtN(w.withdrawable)} · ${esc(t("w_onHold"))}: ${fmtN(w.held)}</div></div>
    </div>
    <div class="w-id"><span>🪪</span><code>${esc(me.id)}</code><button type="button" class="btn sm" id="w-copy">📋 ${esc(t("w_copyId"))}</button></div>

    <div class="card">
      <div class="group-title" style="margin:0 0 8px">🔄 ${esc(t("w_convert"))}</div>
      <div class="w-row"><input id="w-conv" type="number" min="1" max="${Number(w.diamonds)}" inputmode="numeric" placeholder="💎 ${fmtN(w.diamonds)}">
        <button type="button" class="btn sm" id="w-conv-go">${esc(t("w_convertBtn"))}</button></div>
    </div>

    <div class="card">
      <div class="group-title" style="margin:0 0 8px">💵 ${esc(t("w_withdraw"))}</div>
      <label class="lbl" for="w-amt">${esc(t("w_amount"))} · ${esc(t("w_min", { n: fmtN(w.min_withdraw) }))}</label>
      <input id="w-amt" type="number" min="${Number(w.min_withdraw)}" max="${Number(w.withdrawable)}" inputmode="numeric" placeholder="💎 ${fmtN(w.withdrawable)}">
      <div class="w-calc" id="w-calc"></div>
      <label class="lbl" for="w-method">${esc(t("w_method"))}</label>
      <select id="w-method">${(w.payout_methods || []).map((m) => `<option value="${esc(m)}">${esc(t("w_m_" + m))}</option>`).join("")}</select>
      <label class="lbl" for="w-acc">${esc(t("w_account"))}</label>
      <input id="w-acc" inputmode="tel" autocomplete="off" dir="ltr" placeholder="07xx xxx xxxx">
      <button type="button" class="btn block" id="w-req" style="margin-top:12px">${esc(t("w_request"))}</button>
      <div class="muted small" style="margin-top:8px">⏳ ${esc(t("w_holdNote", { n: w.hold_days }))}</div>
    </div>

    <div class="group-title">🧾 ${esc(t("w_myRequests"))}</div>
    <div class="w-list">${(wd.data || []).map((r) => `<div class="w-item"><span>${day(r.created_at)} · ${esc(t("w_m_" + r.method))}${r.note ? " · " + esc(r.note) : ""}</span>
      <span class="amt">$${Number(r.usd_net).toFixed(2)} <span class="w-st ${esc(r.status)}">${esc(t("w_" + r.status))}</span></span></div>`).join("") || `<div class="muted small">${esc(t("w_empty"))}</div>`}</div>

    <div class="group-title">📜 ${esc(t("w_history"))}</div>
    <div class="w-list">${(tx.data || []).map((r) => {
      const parts = [];
      if (Number(r.coins)) parts.push(`<span class="${r.coins > 0 ? "plus" : "minus"}">${r.coins > 0 ? "+" : ""}${fmtN(r.coins)} 🪙</span>`);
      if (Number(r.diamonds)) parts.push(`<span class="${r.diamonds > 0 ? "plus" : "minus"}">${r.diamonds > 0 ? "+" : ""}${fmtN(r.diamonds)} 💎</span>`);
      return `<div class="w-item"><span dir="auto">${day(r.created_at)} · ${esc(t("w_tx_" + r.kind))}${r.ref ? " · " + esc(r.ref) : ""}</span><span class="amt">${parts.join(" ")}</span></div>`;
    }).join("") || `<div class="muted small">${esc(t("w_empty"))}</div>`}</div>`);

  $("#w-copy").addEventListener("click", async () => { try { await navigator.clipboard.writeText(me.id); toast(t("copied")); } catch { prompt(t("w_yourId"), me.id); } });
  const calc = () => {
    const a = Math.floor(Number($("#w-amt").value) || 0);
    const gross = a / 1000 * Number(w.usd_per_1000), net = gross - Math.round(gross * Number(w.withdraw_fee) * 100) / 100;
    $("#w-calc").textContent = a ? t("w_youGet", { usd: Math.max(0, net).toFixed(2), fee: fee.toFixed(fee % 1 ? 1 : 0) }) : "";
  };
  $("#w-amt").addEventListener("input", calc);
  $("#w-conv-go").addEventListener("click", async (e) => {
    const n = Math.floor(Number($("#w-conv").value) || 0); if (n < 1) return;
    e.target.disabled = true;
    const { data, error } = await sb.rpc("convert_diamonds", { p_amount: n });
    const r = Array.isArray(data) ? data[0] : null;
    if (error || r?.o_status !== "ok") { e.target.disabled = false; return toast(error ? t("error") + error.message : statusMsg(r?.o_status)); }
    toast(t("w_converted", { n: fmtN(n) })); openWallet();
  });
  $("#w-req").addEventListener("click", async (e) => {
    const n = Math.floor(Number($("#w-amt").value) || 0);
    if (n < Number(w.min_withdraw)) return toast(t("w_e_below_min"));
    e.target.disabled = true;
    const { data, error } = await sb.rpc("request_withdrawal", { p_amount: n, p_method: $("#w-method").value, p_account: $("#w-acc").value });
    const r = Array.isArray(data) ? data[0] : null;
    if (error || r?.o_status !== "ok") { e.target.disabled = false; return toast(error ? t("error") + error.message : statusMsg(r?.o_status)); }
    toast(t("w_requested")); openWallet();
  });
}
