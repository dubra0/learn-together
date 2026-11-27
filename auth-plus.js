/* 🔐 Sign in first — nobody enters without a real account.
   Welcome screen: 🍏 Apple (iPhone app) · G Google (website / Android) · ✉️ Email (6-digit code, no password).
   A new person then picks a photo + name and gives their date of birth (18+ only, checked by the server: update-44).
   People who already have an account keep it; nothing changes for them.
   Supabase setup (once): Email provider ON, email templates show {{ .Token }}, custom SMTP (Resend);
   Google provider ON (+ set GOOGLE_ON below to true); URL Configuration → Redirect URLs has the site address. */
(() => {
  const GOOGLE_ON = true;    // Google is set up (Google Cloud project "Learn Together" + Supabase → Providers → Google)

  const W = {
    en: { ap_tag: "Learn languages by talking", ap_live: "🎙️ Live rooms", ap_call: "📞 Calls", ap_chat: "💬 Chat",
      ap_apple: "Continue with Apple", ap_google: "Continue with Google", ap_email: "Continue with email", ap_terms: "By continuing you accept the", ap_termsL: "Terms & Privacy",
      ap_emT: "Enter your email", ap_emS: "We'll send you a 6-digit code to sign in.", ap_emL: "Email", ap_send: "Send code", ap_noPass: "🔒 No password needed", ap_private: "👁️ Your email is never shown",
      ap_emBad: "That email doesn't look right. Example: you@gmail.com", ap_sent: "✉️ Code sent", ap_codeT: "Enter the code", ap_codeS: "We sent a 6-digit code to", ap_change: "Change",
      ap_resend: "Send code again", ap_resendIn: "Send again ({n})", ap_spam: "💡 No code? Look in your Spam folder.", ap_codeBad: "That code is wrong or expired. Try again.",
      ap_wait: "Too many tries. Please wait a minute and try again.", ap_hello: "👋 Welcome!", ap_via: "Signed in with {how}", ap_dob: "Date of birth", ap_dobDay: "Day", ap_dobMonth: "Month", ap_dobYear: "Year",
      ap_dobNeed: "Please choose your date of birth.", ap_under18: "Sorry, Learn Together is only for people 18 or older.", ap_start: "Get started 🚀", ap_fail: "Something went wrong: ",
      ageConfirm: "I am 18 or older and I accept the", ageRequired: "Please confirm you are 18 or older.",
      ap_blocked: "🚫 Account blocked. This account was deleted and can't be used again." },
    ckb: { ap_tag: "فێربوونی زمان بە قسەکردن", ap_live: "🎙️ ژووری لایڤ", ap_call: "📞 کۆڵ", ap_chat: "💬 چات",
      ap_apple: "بەردەوامبە بە Apple", ap_google: "بەردەوامبە بە Google", ap_email: "بەردەوامبە بە ئیمەیڵ", ap_terms: "بە بەردەوامبوون، ڕازیت بە", ap_termsL: "مەرج و تایبەتمەندی",
      ap_emT: "ئیمەیڵەکەت بنووسە", ap_emS: "کۆدێکی ٦ ژمارەییت بۆ دەنێرین، و بەو کۆدە دەچیتە ژوورەوە.", ap_emL: "ئیمەیڵ", ap_send: "ناردنی کۆد", ap_noPass: "🔒 پاسۆرد پێویست نییە", ap_private: "👁️ ئیمەیڵەکەت بە کەس پیشان نادرێت",
      ap_emBad: "ئیمەیڵەکە دروست نییە. بۆ نموونە: you@gmail.com", ap_sent: "✉️ کۆدەکە نێردرا", ap_codeT: "کۆدەکە بنووسە", ap_codeS: "کۆدێکی ٦ ژمارەییمان نارد بۆ", ap_change: "گۆڕین",
      ap_resend: "ناردنەوەی کۆد", ap_resendIn: "ناردنەوە ({n})", ap_spam: "💡 کۆدەکەت نەگەیشت؟ سەیری بەشی Spam بکە.", ap_codeBad: "کۆدەکە هەڵەیە یان کاتی بەسەرچووە. دووبارە هەوڵ بدەرەوە.",
      ap_wait: "هەوڵی زۆرت دا. تکایە یەک خولەک چاوەڕێ بکە و دووبارە هەوڵ بدەرەوە.", ap_hello: "👋 بەخێربێیت!", ap_via: "چوویتە ژوورەوە بە {how}", ap_dob: "ڕۆژی لەدایکبوون", ap_dobDay: "ڕۆژ", ap_dobMonth: "مانگ", ap_dobYear: "ساڵ",
      ap_dobNeed: "تکایە ڕۆژی لەدایکبوونت هەڵبژێرە.", ap_under18: "ببورە، Learn Together تەنها بۆ کەسانی ١٨ ساڵ و سەرووترە.", ap_start: "دەستپێکردن 🚀", ap_fail: "هەڵەیەک ڕوویدا: ",
      ageConfirm: "تەمەنم ١٨ ساڵ یان زیاترە و ڕازیم بە", ageRequired: "تکایە دڵنیای بکەرەوە کە تەمەنت ١٨ ساڵ یان زیاترە.",
      ap_blocked: "🚫 ئەکاونت بلۆک کراوە. ئەم ئەکاونتە سڕاوەتەوە و ناتوانرێت دووبارە بەکاربهێنرێتەوە." },
    ar: { ap_tag: "تعلّم اللغات بالمحادثة", ap_live: "🎙️ غرف مباشرة", ap_call: "📞 مكالمات", ap_chat: "💬 دردشة",
      ap_apple: "المتابعة باستخدام Apple", ap_google: "المتابعة باستخدام Google", ap_email: "المتابعة بالبريد الإلكتروني", ap_terms: "بالمتابعة توافق على", ap_termsL: "الشروط والخصوصية",
      ap_emT: "أدخل بريدك الإلكتروني", ap_emS: "سنرسل لك رمزاً من 6 أرقام لتسجيل الدخول.", ap_emL: "البريد الإلكتروني", ap_send: "إرسال الرمز", ap_noPass: "🔒 لا حاجة لكلمة مرور", ap_private: "👁️ لا يظهر بريدك لأحد",
      ap_emBad: "البريد غير صحيح. مثال: you@gmail.com", ap_sent: "✉️ أُرسل الرمز", ap_codeT: "أدخل الرمز", ap_codeS: "أرسلنا رمزاً من 6 أرقام إلى", ap_change: "تغيير",
      ap_resend: "إعادة إرسال الرمز", ap_resendIn: "إعادة الإرسال ({n})", ap_spam: "💡 لم يصل الرمز؟ تحقق من مجلد Spam.", ap_codeBad: "الرمز خاطئ أو منتهي. حاول مجدداً.",
      ap_wait: "محاولات كثيرة. انتظر دقيقة ثم حاول مجدداً.", ap_hello: "👋 أهلاً بك!", ap_via: "سجّلت الدخول عبر {how}", ap_dob: "تاريخ الميلاد", ap_dobDay: "اليوم", ap_dobMonth: "الشهر", ap_dobYear: "السنة",
      ap_dobNeed: "يرجى اختيار تاريخ ميلادك.", ap_under18: "عذراً، Learn Together للأشخاص بعمر 18 سنة فأكثر فقط.", ap_start: "ابدأ 🚀", ap_fail: "حدث خطأ: ",
      ageConfirm: "عمري 18 سنة أو أكثر وأوافق على", ageRequired: "يرجى تأكيد أن عمرك 18 سنة أو أكثر.",
      ap_blocked: "🚫 الحساب محظور. هذا الحساب حُذف ولا يمكن استخدامه مجدداً." },
  };
  try { for (const [l, o] of Object.entries(W)) if (I18N[l]) Object.assign(I18N[l], o); } catch {}
  // the 13+ line in other languages becomes 18+ too
  try { for (const l of Object.keys(I18N)) for (const k of ["ageConfirm", "ageRequired", "reasonUnderage"]) if (typeof I18N[l][k] === "string") I18N[l][k] = I18N[l][k].replace(/13|١٣|۱۳/g, (m) => (m === "13" ? "18" : m === "١٣" ? "١٨" : "۱۸")); } catch {}

  try { applyI18n(); } catch {}   // the welcome form was already drawn with the old (13+) text

  const isIOSApp = (() => { try { return !!window.Capacitor?.isNativePlatform?.() && window.Capacitor.getPlatform() === "ios"; } catch { return false; } })();
  const showApple = () => !!window.AppleLogin?.available;
  const showGoogle = () => GOOGLE_ON && !isIOSApp;   // Google can't open inside the iPhone app yet

  const css = document.createElement("style");
  css.textContent = `
  #screen-name{background:radial-gradient(120% 55% at 50% 108%,rgba(226,182,90,.42),rgba(180,83,9,.18) 35%,transparent 62%),radial-gradient(90% 40% at 50% -6%,rgba(99,102,241,.28),transparent 70%),linear-gradient(180deg,#0e1440,#0a0f2c 45%,#090c22)!important;color:#f6eedb;min-height:100%}
  #screen-name .welcome-hero{display:none}
  #screen-name.ap-auth #name-form{display:none}
  #screen-name:not(.ap-auth) #ap{display:none}
  #ap{--g:#e2b65a;--g2:#f7d98b;--ink:#f6eedb;--mut:#b9b2a0;--ln:rgba(226,182,90,.22);position:relative;display:flex;flex-direction:column;min-height:calc(100dvh - 48px);padding:12px 4px 8px;color:var(--ink)}
  #ap::before{content:"";position:absolute;inset:0 -16px auto;height:55%;pointer-events:none;background-image:radial-gradient(rgba(247,217,139,.2) 1px,transparent 1.4px);background-size:18px 18px;-webkit-mask-image:linear-gradient(#000,transparent);mask-image:linear-gradient(#000,transparent)}
  #ap .p{display:flex;flex-direction:column;gap:12px;flex:1;position:relative}
  #ap .p[hidden]{display:none!important}
  #ap button{font:inherit}
  .ap-hero{display:grid;justify-items:center;text-align:center;margin:auto 0}
  .ap-stage{position:relative;width:300px;max-width:100%;height:210px;display:grid;place-items:center}
  .ap-orb{position:relative;width:118px;height:118px;display:grid;place-items:center}
  .ap-orb i{position:absolute;inset:0;border-radius:50%;border:1.5px solid rgba(226,182,90,.55);animation:apRing 3s ease-out infinite}
  .ap-orb i:nth-child(3){animation-delay:1s}.ap-orb i:nth-child(4){animation-delay:2s}
  @keyframes apRing{from{transform:scale(1);opacity:.8}to{transform:scale(2.1);opacity:0}}
  .ap-halo{position:absolute;inset:-26px;border-radius:50%;background:conic-gradient(from 0deg,transparent,rgba(247,217,139,.7),transparent 30%,rgba(99,102,241,.6),transparent 60%,rgba(247,217,139,.7),transparent);
    -webkit-mask:radial-gradient(circle,transparent 58%,#000 60%,#000 66%,transparent 68%);mask:radial-gradient(circle,transparent 58%,#000 60%,#000 66%,transparent 68%);animation:apSpin 6s linear infinite}
  @keyframes apSpin{to{transform:rotate(360deg)}}
  .ap-logo{position:relative;width:104px;height:104px;border-radius:32px;overflow:hidden;box-shadow:0 14px 40px rgba(245,158,11,.45);animation:apBreathe 3.2s ease-in-out infinite}
  .ap-logo img{width:100%;height:100%;display:block}
  @keyframes apBreathe{50%{transform:scale(1.05)}}
  .ap-bub{position:absolute;display:inline-flex;align-items:center;gap:6px;padding:5px 11px;border-radius:14px 14px 14px 4px;font-size:.78rem;font-weight:800;white-space:nowrap;background:rgba(18,26,70,.85);border:1px solid var(--ln);box-shadow:0 6px 18px rgba(0,0,0,.35);animation:apFloat 5s ease-in-out infinite}
  .ap-bub.b1{top:8px;right:6px}.ap-bub.b2{top:30px;left:0;animation-delay:-1.2s;border-radius:14px 14px 4px 14px}.ap-bub.b3{bottom:28px;right:0;animation-delay:-2.4s}.ap-bub.b4{bottom:8px;left:10px;animation-delay:-3.6s;border-radius:14px 14px 4px 14px}
  @keyframes apFloat{50%{transform:translateY(-7px)}}
  .ap-spk{position:absolute;color:#f7d98b;font-size:12px;text-shadow:0 0 8px #f7d98b;animation:apTw 2.4s ease-in-out infinite}
  .ap-spk.k1{top:22%;left:32%}.ap-spk.k2{top:12%;right:36%;animation-delay:-.6s}.ap-spk.k3{bottom:22%;left:28%;animation-delay:-1.2s}.ap-spk.k4{top:48%;right:16%;animation-delay:-.9s}
  @keyframes apTw{0%,100%{opacity:.15;transform:scale(.6)}50%{opacity:1;transform:scale(1.2)}}
  .ap-name{margin:8px 0 4px;font-size:2rem;font-weight:900;background:linear-gradient(100deg,#fff 20%,#f7d98b 40%,#fff 55%,#f7d98b 75%);background-size:250% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:apShine 5s linear infinite}
  @keyframes apShine{to{background-position:-250% 0}}
  .ap-tag{margin:0;color:var(--mut)}
  .ap-feats{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:14px}
  .ap-feats span{font-size:.78rem;font-weight:700;border:1px solid rgba(226,182,90,.35);background:linear-gradient(180deg,rgba(247,217,139,.12),rgba(255,255,255,.03));border-radius:999px;padding:5px 11px}
  .ap-stack{display:grid;gap:11px;padding-top:18px;border-top:1px solid rgba(226,182,90,.18)}
  .ap-btn{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;gap:10px;min-height:56px;border-radius:18px;font-weight:800;font-size:1rem;cursor:pointer;border:0;width:100%}
  .ap-btn:active{transform:scale(.97)}
  .ap-btn[disabled]{opacity:.55;cursor:default}
  .ap-btn svg{width:20px;height:20px;flex:none}
  .ap-apple{background:#000;color:#fff;border:1.5px solid rgba(255,255,255,.22)}
  .ap-apple svg{fill:#fff}
  .ap-google{background:#fff;color:#1f1f1f}
  .ap-gold{background:linear-gradient(180deg,#f7d98b,#d9a441);color:#2a1a00;box-shadow:0 8px 24px rgba(226,182,90,.35)}
  .ap-gold.sweep::after{content:"";position:absolute;top:0;bottom:0;width:40%;left:-60%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.55),transparent);transform:skewX(-20deg);animation:apSweep 3.5s ease-in-out infinite}
  @keyframes apSweep{0%,55%{left:-60%}100%{left:130%}}
  .ap-legal{margin:2px 0 0;text-align:center;color:var(--mut);font-size:.74rem;line-height:1.6}
  .ap-legal a{color:var(--g2)}
  .ap-back{position:absolute;top:0;inset-inline-start:0;width:38px;height:38px;border-radius:50%;border:1.5px solid var(--g);background:rgba(0,0,0,.35);color:var(--g2);cursor:pointer;z-index:1}
  .ap-steps{display:flex;justify-content:center;gap:6px;margin:6px 0 2px}
  .ap-steps i{width:26px;height:5px;border-radius:9px;background:rgba(255,255,255,.14)}
  .ap-steps i.on{background:linear-gradient(90deg,#f7d98b,#d9a441);box-shadow:0 0 10px rgba(226,182,90,.5)}
  .ap-badge{width:86px;height:86px;margin:6px auto 0;border-radius:28px;display:grid;place-items:center;font-size:2.3rem;background:linear-gradient(145deg,rgba(247,217,139,.25),rgba(18,26,70,.9));border:1.5px solid rgba(226,182,90,.6);box-shadow:0 0 40px rgba(226,182,90,.25)}
  .ap-h{margin:0;text-align:center;font-size:1.45rem;font-weight:900;color:#fff}
  .ap-s{margin:0;text-align:center;color:var(--mut);font-size:.9rem;line-height:1.6}
  .ap-s b{color:var(--g2);direction:ltr;unicode-bidi:isolate}
  .ap-glass{display:grid;gap:10px;padding:14px;border-radius:22px;background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02));border:1px solid rgba(226,182,90,.28)}
  .ap-lab{font-size:.85rem;font-weight:800}
  .ap-row{display:flex;align-items:center;gap:8px;direction:ltr;border:1.5px solid rgba(226,182,90,.45);border-radius:16px;padding:0 12px;background:rgba(6,9,24,.55)}
  .ap-row:focus-within{border-color:var(--g2);box-shadow:0 0 0 4px rgba(226,182,90,.18)}
  .ap-pre{width:30px;height:30px;border-radius:10px;display:grid;place-items:center;background:rgba(226,182,90,.18);color:var(--g2);font-weight:900;flex:none}
  .ap-row input{flex:1;min-width:0;border:0;background:transparent;color:var(--ink);padding:14px 4px;font:inherit;font-size:1rem;outline:none}
  .ap-chips{display:flex;flex-wrap:wrap;gap:6px;direction:ltr}
  .ap-chips button{border:1px solid rgba(226,182,90,.35);background:rgba(0,0,0,.25);color:var(--ink);border-radius:999px;padding:5px 10px;font-size:.76rem;font-weight:700;cursor:pointer}
  .ap-err{margin:0;min-height:1.2em;color:#fda4af;font-size:.82rem;text-align:center}
  .ap-trust{display:flex;flex-wrap:wrap;justify-content:center;gap:6px 14px;color:var(--mut);font-size:.76rem}
  .ap-code{display:flex;gap:7px;justify-content:center;direction:ltr;margin:4px 0}
  .ap-code input{width:46px;height:58px;text-align:center;font:inherit;font-size:1.5rem;font-weight:900;color:var(--ink);border:1.5px solid rgba(226,182,90,.45);background:rgba(6,9,24,.55);border-radius:16px;outline:none}
  .ap-code input:focus{border-color:var(--g2);box-shadow:0 0 0 3px rgba(226,182,90,.25)}
  .ap-code input:not(:placeholder-shown){border-color:var(--g2);background:rgba(226,182,90,.12)}
  .ap-link{border:0;background:none;color:var(--g2);font-weight:800;cursor:pointer;padding:4px}
  .ap-link[disabled]{color:var(--mut);cursor:default}
  .ap-tip{margin-top:auto;text-align:center;font-size:.8rem;color:var(--mut);background:rgba(0,0,0,.25);border:1px dashed rgba(226,182,90,.3);border-radius:14px;padding:9px 12px}
  /* profile step: the app's own name form, dressed to match */
  #screen-name:not(.ap-auth) .wrap{padding-top:18px}
  #name-form{background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02))!important;border:1px solid rgba(226,182,90,.28)!important;border-radius:22px!important;color:#f6eedb}
  .ap-who{display:flex;align-items:center;gap:10px;margin:0 0 12px;padding:10px 12px;border-radius:16px;background:rgba(52,211,153,.08);border:1px solid rgba(52,211,153,.35);font-size:.88rem}
  .ap-who b{display:block;color:#fff}.ap-who span{color:#b9b2a0;direction:ltr;unicode-bidi:isolate}
  .ap-who em{margin-inline-start:auto;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:#34d399;color:#022c1e;font-style:normal;font-weight:900}
  .ap-dob{display:grid;grid-template-columns:1fr 1.4fr 1.2fr;gap:8px}
  .ap-dob select{width:100%;border:1.5px solid rgba(226,182,90,.45);background:rgba(6,9,24,.55);color:#f6eedb;border-radius:14px;padding:12px 8px;font:inherit}
  .ap-dob select:focus{outline:none;border-color:#f7d98b}
  @media (prefers-reduced-motion:reduce){.ap-orb i,.ap-halo,.ap-logo,.ap-bub,.ap-spk,.ap-name,.ap-gold.sweep::after{animation:none}}`;
  document.head.appendChild(css);

  const GLOGO = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9c-.3 1.4-1 2.5-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8C3.9 20.6 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.8 14.2c-.2-.7-.4-1.4-.4-2.2s.1-1.5.4-2.2V7H2.1C1.4 8.5 1 10.2 1 12s.4 3.5 1.1 5l3.7-2.8z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2C17.5 2.1 15 1 12 1 7.7 1 3.9 3.4 2.1 7l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4z"/></svg>`;
  const scr = document.getElementById("screen-name");
  const wrap = scr?.querySelector(".wrap");
  const form = document.getElementById("name-form");
  if (!scr || !wrap || !form) return;

  // ---------- the welcome / email / code panels ----------
  scr.classList.add("ap-auth");   // start on the sign-in buttons; the profile form shows only after signing in
  wrap.insertAdjacentHTML("afterbegin", `<div id="ap">
    <section class="p" id="ap-start">
      <div class="ap-hero">
        <div class="ap-stage">
          <span class="ap-bub b1">🇬🇧 Hello!</span><span class="ap-bub b2">☀️ سڵاو</span><span class="ap-bub b3">🇹🇷 Merhaba</span><span class="ap-bub b4">🌙 مرحبا</span>
          <span class="ap-spk k1">✦</span><span class="ap-spk k2">✦</span><span class="ap-spk k3">✦</span><span class="ap-spk k4">✦</span>
          <div class="ap-orb"><span class="ap-halo"></span><i></i><i></i><i></i><div class="ap-logo"><img src="icons/icon-192.png" alt=""></div></div>
        </div>
        <h1 class="ap-name">Learn Together</h1><p class="ap-tag">${esc(t("ap_tag"))}</p>
        <div class="ap-feats"><span>${esc(t("ap_live"))}</span><span>${esc(t("ap_call"))}</span><span>${esc(t("ap_chat"))}</span></div>
      </div>
      <div class="ap-stack">
        ${showApple() ? `<button type="button" class="ap-btn ap-apple" id="ap-apple">${window.AppleLogin.logo || ""}<span>${esc(t("ap_apple"))}</span></button>` : ""}
        ${showGoogle() ? `<button type="button" class="ap-btn ap-google" id="ap-google">${GLOGO}<span>${esc(t("ap_google"))}</span></button>` : ""}
        <button type="button" class="ap-btn ap-gold sweep" id="ap-email">✉️ <span>${esc(t("ap_email"))}</span></button>
        <p class="ap-legal">${esc(t("ap_terms"))} <a href="privacy.html" target="_blank" rel="noopener">${esc(t("ap_termsL"))}</a></p>
      </div>
    </section>
    <section class="p" id="ap-mail" hidden>
      <button type="button" class="ap-back" data-ap="ap-start" aria-label="‹">›</button>
      <div class="ap-steps"><i class="on"></i><i></i><i></i></div>
      <div class="ap-badge">✉️</div>
      <h2 class="ap-h">${esc(t("ap_emT"))}</h2><p class="ap-s">${esc(t("ap_emS"))}</p>
      <div class="ap-glass">
        <label class="ap-lab" for="ap-em">${esc(t("ap_emL"))}</label>
        <div class="ap-row"><span class="ap-pre">@</span><input id="ap-em" type="email" inputmode="email" autocomplete="email" placeholder="you@gmail.com"></div>
        <div class="ap-chips" id="ap-doms"><button type="button">@gmail.com</button><button type="button">@icloud.com</button><button type="button">@yahoo.com</button><button type="button">@hotmail.com</button></div>
      </div>
      <p class="ap-err" id="ap-em-err"></p>
      <button type="button" class="ap-btn ap-gold" id="ap-send">${esc(t("ap_send"))} ←</button>
      <div class="ap-trust"><span>${esc(t("ap_noPass"))}</span><span>${esc(t("ap_private"))}</span></div>
    </section>
    <section class="p" id="ap-code" hidden>
      <button type="button" class="ap-back" data-ap="ap-mail" aria-label="‹">›</button>
      <div class="ap-steps"><i class="on"></i><i class="on"></i><i></i></div>
      <div class="ap-badge">🔐</div>
      <h2 class="ap-h">${esc(t("ap_codeT"))}</h2>
      <p class="ap-s">${esc(t("ap_codeS"))}<br><b id="ap-em-show"></b> · <button type="button" class="ap-link" data-ap="ap-mail">${esc(t("ap_change"))}</button></p>
      <div class="ap-code" id="ap-boxes">${[1, 2, 3, 4, 5, 6].map((i) => `<input id="ap-c${i}" inputmode="numeric" autocomplete="${i === 1 ? "one-time-code" : "off"}" maxlength="${i === 1 ? 6 : 1}" placeholder=" " aria-label="${i}">`).join("")}</div>
      <p class="ap-err" id="ap-c-err"></p>
      <div style="text-align:center"><button type="button" class="ap-link" id="ap-resend" disabled></button></div>
      <div class="ap-tip">${esc(t("ap_spam"))}</div>
    </section>
  </div>`);

  // the profile step (the app's own form): who I signed in as + date of birth (18+)
  form.insertAdjacentHTML("afterbegin", `<div class="ap-who" id="ap-who" hidden><span id="ap-who-ic">✉️</span><div><b id="ap-who-t"></b><span id="ap-who-v"></span></div><em>✓</em></div>`);
  const ageLabel = document.getElementById("age-check")?.closest("label");
  const months = Array.from({ length: 12 }, (_, i) => new Date(2000, i, 1).toLocaleString(document.documentElement.lang || undefined, { month: "long" }));
  const nowY = new Date().getFullYear();
  const dobHtml = `<label class="lbl">${esc(t("ap_dob"))}</label><div class="ap-dob">
    <select id="ap-d" aria-label="${esc(t("ap_dobDay"))}"><option value="">${esc(t("ap_dobDay"))}</option>${Array.from({ length: 31 }, (_, i) => `<option>${i + 1}</option>`).join("")}</select>
    <select id="ap-m" aria-label="${esc(t("ap_dobMonth"))}"><option value="">${esc(t("ap_dobMonth"))}</option>${months.map((m, i) => `<option value="${i + 1}">${esc(m)}</option>`).join("")}</select>
    <select id="ap-y" aria-label="${esc(t("ap_dobYear"))}"><option value="">${esc(t("ap_dobYear"))}</option>${Array.from({ length: 90 }, (_, i) => `<option>${nowY - 18 - i}</option>`).join("")}</select></div>`;
  if (ageLabel) ageLabel.insertAdjacentHTML("beforebegin", dobHtml); else form.querySelector("[type=submit]")?.insertAdjacentHTML("beforebegin", dobHtml);
  const startBtn = form.querySelector("[type=submit]"); if (startBtn) startBtn.textContent = t("ap_start");

  const $ = (id) => document.getElementById(id);
  const panels = ["ap-start", "ap-mail", "ap-code"];
  const go = (id) => { scr.classList.add("ap-auth"); panels.forEach((p) => ($(p).hidden = p !== id)); };
  document.querySelectorAll("#ap [data-ap]").forEach((b) => b.addEventListener("click", () => go(b.dataset.ap)));

  // signed in with a real account (not an anonymous one)?
  const realUser = (u) => !!u && !u.is_anonymous;
  const HOW = { apple: "Apple", google: "Google", email: "Email" };
  function toProfile(user, name) {
    scr.classList.remove("ap-auth");
    const prov = (user?.app_metadata?.provider || (user?.identities || [])[0]?.provider || "email");
    $("ap-who").hidden = false;
    $("ap-who-ic").textContent = prov === "apple" ? "🍏" : prov === "google" ? "G" : "✉️";
    $("ap-who-t").textContent = t("ap_via", { how: HOW[prov] || prov });
    $("ap-who-v").textContent = user?.email && !/privaterelay/i.test(user.email) ? user.email : "";
    const inp = $("name-input");
    const guess = name || user?.user_metadata?.full_name || user?.user_metadata?.name || "";
    if (inp && !inp.value && guess) inp.value = String(guess).slice(0, 30);
  }
  // after any sign-in: an existing person goes straight in, a new person fills the profile
  async function signedIn(name) {
    const { data } = await sb.auth.getUser();
    me = data?.user || me;
    await loadMyProfile();
    if (profile) { store.set("onboarded", "1"); return enterApp(); }
    toProfile(me, name);
  }

  // ---------- 🚫 a deleted account can't come back (the server answers "account_blocked": update-45) ----------
  const blocked = (err) => /account_blocked/i.test(String(err?.message || err || ""));
  function showBlocked() {
    go("ap-start");
    let bar = $("ap-blocked");
    if (!bar) {
      bar = document.createElement("div"); bar.id = "ap-blocked"; bar.setAttribute("role", "alert");
      bar.style.cssText = "margin:10px auto;max-width:420px;padding:12px 14px;border-radius:14px;background:rgba(127,29,29,.85);border:1px solid #f87171;color:#fff;font-weight:800;font-size:.9rem;line-height:1.6;text-align:center";
      $("ap-start").prepend(bar);
    }
    bar.textContent = t("ap_blocked");
  }
  // coming back from Google with "account_blocked" in the address
  try {
    const q = new URLSearchParams(location.search + "&" + location.hash.replace(/^#/, ""));
    if (blocked(q.get("error_description") || q.get("error") || "")) {
      history.replaceState(null, "", location.pathname);
      setTimeout(showBlocked, 300);
    }
  } catch {}

  // ---------- 🍏 Apple ----------
  $("ap-apple")?.addEventListener("click", async (e) => {
    const b = e.currentTarget; b.disabled = true;
    try { const r = await window.AppleLogin.login(); if (r) await signedIn(r.name); }
    catch (err) { blocked(err) ? showBlocked() : toast(err?.message || String(err)); }
    finally { b.disabled = false; }
  });
  // ---------- G Google (leaves the page and comes back signed in) ----------
  $("ap-google")?.addEventListener("click", async (e) => {
    e.currentTarget.disabled = true;
    const { error } = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin + location.pathname } });
    if (error) { e.currentTarget.disabled = false; toast(t("ap_fail") + error.message); }
  });

  // ---------- ✉️ email + 6-digit code ----------
  let email = "", timer = null;
  $("ap-email").addEventListener("click", () => { $("ap-em-err").textContent = ""; go("ap-mail"); setTimeout(() => $("ap-em").focus(), 60); });
  $("ap-doms").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    $("ap-em").value = ($("ap-em").value.trim().split("@")[0] || "") + b.textContent; $("ap-em").focus();
  });
  $("ap-em").addEventListener("keydown", (e) => { if (e.key === "Enter") $("ap-send").click(); });
  const errMsg = (err) => (blocked(err) ? t("ap_blocked") : /rate|too many|seconds/i.test(err?.message || "") ? t("ap_wait") : t("ap_fail") + (err?.message || err));
  async function sendCode() {
    const v = $("ap-em").value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { $("ap-em-err").textContent = t("ap_emBad"); return false; }
    $("ap-send").disabled = true; $("ap-em-err").textContent = "";
    const { error } = await sb.auth.signInWithOtp({ email: v, options: { shouldCreateUser: true } });
    $("ap-send").disabled = false;
    if (error) { $("ap-em-err").textContent = errMsg(error); return false; }
    email = v; toast(t("ap_sent")); return true;
  }
  function countdown() {
    let n = 60; const r = $("ap-resend"); r.disabled = true; r.textContent = t("ap_resendIn", { n });
    clearInterval(timer); timer = setInterval(() => { n--; if (n <= 0) { clearInterval(timer); r.disabled = false; r.textContent = "↻ " + t("ap_resend"); } else r.textContent = t("ap_resendIn", { n }); }, 1000);
  }
  const boxes = [1, 2, 3, 4, 5, 6].map((i) => $("ap-c" + i));
  $("ap-send").addEventListener("click", async () => {
    if (!(await sendCode())) return;
    $("ap-em-show").textContent = email; boxes.forEach((b) => (b.value = "")); $("ap-c-err").textContent = "";
    go("ap-code"); countdown(); setTimeout(() => boxes[0].focus(), 60);
  });
  $("ap-resend").addEventListener("click", async () => { if (await sendCode()) countdown(); });
  let checking = false;
  async function tryCode() {
    const code = boxes.map((b) => b.value).join("");
    if (code.length !== 6 || checking) return;
    checking = true; $("ap-c-err").textContent = "";
    const { error } = await sb.auth.verifyOtp({ email, token: code, type: "email" });
    checking = false;
    if (error) { $("ap-c-err").textContent = /rate|too many/i.test(error.message) ? t("ap_wait") : t("ap_codeBad"); boxes.forEach((b) => (b.value = "")); boxes[0].focus(); return; }
    clearInterval(timer);
    await signedIn("");
  }
  const fill = (digits, from) => { digits.split("").forEach((ch, k) => boxes[from + k] && (boxes[from + k].value = ch)); boxes[Math.min(from + digits.length, 5)].focus(); tryCode(); };
  boxes.forEach((b, i) => {
    b.addEventListener("input", () => {
      const d = b.value.replace(/\D/g, "");
      if (d.length > 1) { b.value = ""; return fill(d.slice(0, 6 - i), i); }   // the phone pasted / filled the whole code
      b.value = d; if (d && boxes[i + 1]) boxes[i + 1].focus(); tryCode();
    });
    b.addEventListener("keydown", (e) => { if (e.key === "Backspace" && !b.value && boxes[i - 1]) boxes[i - 1].focus(); });
    b.addEventListener("paste", (e) => { const d = (e.clipboardData?.getData("text") || "").replace(/\D/g, "").slice(0, 6); if (!d) return; e.preventDefault(); fill(d, 0); });
  });

  // ---------- 🔞 the profile form: a real account + date of birth (18+) ----------
  let dobOK = false;
  document.addEventListener("submit", async (e) => {
    if (e.target !== form || dobOK) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const { data: { session } } = await sb.auth.getSession();
    if (!realUser(session?.user)) { go("ap-start"); return; }            // nobody gets in without signing in first
    const d = +$("ap-d").value, m = +$("ap-m").value, y = +$("ap-y").value;
    if (!d || !m || !y) return toast(t("ap_dobNeed"));
    const dob = new Date(Date.UTC(y, m - 1, d));
    if (dob.getUTCDate() !== d) return toast(t("ap_dobNeed"));            // e.g. 31 February
    const iso = dob.toISOString().slice(0, 10);
    const { data: res, error } = await sb.rpc("set_birth_date", { p_date: iso });
    if (error) return toast(t("ap_fail") + error.message);
    if (res === "under_18") return toast(t("ap_under18"));
    if (res !== "ok") return toast(t("ap_dobNeed"));
    const age = $("age-check"); if (age) age.checked = true;
    dobOK = true;
    try { form.requestSubmit(); } finally { setTimeout(() => (dobOK = false), 0); }
  }, true);

  // ---------- which step to show ----------
  async function decide() {
    let user = null;
    try { user = (await sb.auth.getSession()).data.session?.user || null; } catch {}
    if (realUser(user)) {
      if (!profile) toProfile(user, "");
    } else go("ap-start");
  }
  const ready = setInterval(() => { if (typeof sb !== "undefined" && sb) { clearInterval(ready); decide(); sb.auth.onAuthStateChange((ev) => { if (ev === "SIGNED_IN" && !profile) decide(); }); } }, 50);
})();
