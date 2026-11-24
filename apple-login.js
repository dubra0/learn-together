/* 🍏 Sign in with Apple (only inside the iPhone app)
   - welcome screen: "Continue with Apple" → signs in (a new person then picks a name as usual)
   - ⚙️ Settings: "Save my account with Apple" → links Apple to the account you already have,
     so a new phone / reinstall gets the same account back (anonymous accounts are lost otherwise)
   Needs (once): Supabase → Authentication → Providers → Apple ON, Client IDs = com.learntogether.live,
   and "Allow manual linking" ON. The iPhone build adds the Sign in with Apple capability (codemagic.yaml). */
(() => {
  const W = {
    en: { al_btn: "Continue with Apple", al_or: "or", al_link: "Save my account with Apple", al_linked: "Apple ID linked", al_linkedOk: "✅ Your account is saved with Apple",
      al_taken: "This Apple ID already belongs to another account", al_fail: "Apple sign-in didn't work: ", al_pickName: "👋 Welcome! Now choose your name" },
    ckb: { al_btn: "چوونەژوورەوە بە Apple", al_or: "یان", al_link: "پاراستنی ئەکاونتەکەم بە Apple", al_linked: "Apple ID بەستراوە", al_linkedOk: "✅ ئەکاونتەکەت بە Apple پارێزرا",
      al_taken: "ئەم Apple ID ـە هی ئەکاونتێکی ترە", al_fail: "چوونەژوورەوە بە Apple سەرکەوتوو نەبوو: ", al_pickName: "👋 بەخێربێیت! ئێستا ناوێک هەڵبژێرە" },
    ar: { al_btn: "المتابعة باستخدام Apple", al_or: "أو", al_link: "احفظ حسابي مع Apple", al_linked: "Apple ID مرتبط", al_linkedOk: "✅ حُفظ حسابك مع Apple",
      al_taken: "معرّف Apple هذا مرتبط بحساب آخر", al_fail: "تعذّر تسجيل الدخول عبر Apple: ", al_pickName: "👋 أهلاً! اختر اسمك الآن" },
  };
  try { for (const [l, o] of Object.entries(W)) if (I18N[l]) Object.assign(I18N[l], o); } catch {}

  const isIOSApp = () => { try { return !!window.Capacitor?.isNativePlatform?.() && window.Capacitor.getPlatform() === "ios"; } catch { return false; } };
  if (!isIOSApp()) { window.AppleLogin = { settings() {} }; return; }

  const css = document.createElement("style");
  css.textContent = `
  .al-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:50px;border:0;border-radius:14px;background:#000;color:#fff;font:inherit;font-weight:800;font-size:1rem;cursor:pointer}
  .al-btn[disabled]{opacity:.6}
  .al-btn svg{width:18px;height:18px;fill:#fff}
  .al-or{display:flex;align-items:center;gap:10px;color:var(--muted);font-size:.8rem;margin:12px 0}
  .al-or::before,.al-or::after{content:"";flex:1;height:1px;background:var(--line)}`;
  document.head.appendChild(css);
  const LOGO = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.37 12.6c-.02-2.2 1.8-3.26 1.88-3.31-1.03-1.5-2.62-1.7-3.18-1.73-1.35-.14-2.64.8-3.33.8-.69 0-1.74-.78-2.87-.76-1.47.02-2.83.86-3.59 2.18-1.53 2.66-.39 6.6 1.1 8.76.73 1.06 1.6 2.24 2.73 2.2 1.1-.04 1.51-.71 2.84-.71 1.32 0 1.7.71 2.86.69 1.18-.02 1.93-1.07 2.65-2.13.84-1.22 1.18-2.41 1.2-2.47-.03-.01-2.3-.88-2.32-3.5zM14.2 6.14c.6-.73 1.01-1.75.9-2.76-.87.04-1.92.58-2.55 1.31-.56.65-1.05 1.69-.92 2.68.97.08 1.96-.49 2.57-1.23z"/></svg>`;

  let P = null;
  const plugin = () => P || (P = window.Capacitor.registerPlugin("SignInWithApple"));
  const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

  // ask Apple (the iPhone's own Sign in with Apple sheet) for a signed token
  async function appleToken() {
    const raw = hex(crypto.getRandomValues(new Uint8Array(32)));
    const hashed = hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw)));
    const r = await plugin().authorize({
      clientId: "com.learntogether.live",
      redirectURI: "https://dubra0.github.io/learn-together/",
      scopes: "email name",
      state: raw.slice(0, 12),
      nonce: hashed,               // Apple puts the hashed one in the token, Supabase checks it against the raw one
    });
    const res = r?.response || {};
    if (!res.identityToken) throw new Error("no_token");
    return { token: res.identityToken, nonce: raw, name: [res.givenName, res.familyName].filter(Boolean).join(" ") };
  }
  const cancelled = (e) => /cancel|1001/i.test(String(e?.message || e?.code || e || ""));

  // 1) welcome screen: Continue with Apple
  async function signIn(btn) {
    btn.disabled = true;
    try {
      const a = await appleToken();
      const { data, error } = await sb.auth.signInWithIdToken({ provider: "apple", token: a.token, nonce: a.nonce });
      if (error) throw error;
      me = data.user;
      await loadMyProfile();
      if (profile) { store.set("onboarded", "1"); return enterApp(); }
      // a new person: same name screen as always, already signed in
      const inp = document.getElementById("name-input");
      if (inp && !inp.value && a.name) inp.value = a.name.slice(0, 30);
      toast(t("al_pickName"));
    } catch (e) {
      if (!cancelled(e)) { console.error(e); toast(t("al_fail") + (e?.message || e)); }
    } finally { btn.disabled = false; }
  }
  function welcome() {
    const form = document.getElementById("name-form");
    if (!form || document.getElementById("al-start")) return;
    form.insertAdjacentHTML("afterbegin", `<button type="button" class="al-btn" id="al-start">${LOGO}<span>${esc(t("al_btn"))}</span></button><div class="al-or">${esc(t("al_or"))}</div>`);
    document.getElementById("al-start").addEventListener("click", (e) => signIn(e.currentTarget));
  }

  // 2) ⚙️ Settings → Account: link Apple to the account I already have
  const hasApple = () => (me?.identities || []).some((i) => i.provider === "apple");
  async function link(btn) {
    btn.disabled = true;
    try {
      const a = await appleToken();
      const { error } = await sb.auth.linkIdentity({ provider: "apple", token: a.token, nonce: a.nonce });
      if (error) throw error;
      const u = await sb.auth.getUser();
      if (u.data?.user) me = u.data.user;
      toast(t("al_linkedOk"));
      settings();
    } catch (e) {
      if (cancelled(e)) return;
      const m = String(e?.message || e?.code || e || "");
      toast(/already|exists|identity_already/i.test(m) ? t("al_taken") : t("al_fail") + m);
    } finally { btn.disabled = false; }
  }
  function settings() {
    const anchor = document.getElementById("me-id"); if (!anchor) return;
    document.getElementById("me-apple")?.remove();
    const on = hasApple();
    anchor.insertAdjacentHTML("afterend", on
      ? `<button type="button" id="me-apple" disabled>🍏 ${esc(t("al_linked"))}<span class="end">✓</span></button>`
      : `<button type="button" id="me-apple">🍏 ${esc(t("al_link"))}<span class="chev">›</span></button>`);
    if (!on) document.getElementById("me-apple").addEventListener("click", (e) => link(e.currentTarget));
  }

  welcome();
  window.AppleLogin = { settings };
})();
