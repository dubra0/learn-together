/* 🍎 Buy coins with Apple (only inside the iPhone app from the App Store)
   - the website and Android keep recharge codes; this part does nothing there
   - purchases go through RevenueCat (it talks to Apple); Apple → RevenueCat → our server function "apple-coins",
     which checks the purchase and adds the coins (supabase/apple-coins.ts + update-42-apple-coins.sql).
     The app never adds coins by itself, so nobody can fake a purchase. */
(() => {
  const W = {
    en: { ia_title: "🍎 Buy coins", ia_sub: "Paid with your Apple ID", ia_buy: "Buy", ia_wait: "⏳ Adding your coins…", ia_done: "✅ {n} coins added!", ia_late: "✅ Paid. Your coins arrive in a moment.",
      ia_fail: "The purchase didn't go through: ", ia_cancel: "Purchase cancelled", ia_restore: "Not received? Check again", ia_none: "Coin packs aren't ready yet." },
    ckb: { ia_title: "🍎 کڕینی کۆین", ia_sub: "پارەدان بە Apple ID ـەکەت", ia_buy: "کڕین", ia_wait: "⏳ کۆینەکانت زیاد دەکرێن…", ia_done: "✅ {n} کۆین زیاد کرا!", ia_late: "✅ پارە درا. کۆینەکانت بەم زووانە دەگەن.",
      ia_fail: "کڕینەکە سەرکەوتوو نەبوو: ", ia_cancel: "کڕینەکە هەڵوەشایەوە", ia_restore: "نەگەیشت؟ دووبارە بپشکنە", ia_none: "پاکێجەکانی کۆین هێشتا ئامادە نین." },
    ar: { ia_title: "🍎 شراء العملات", ia_sub: "الدفع عبر Apple ID", ia_buy: "شراء", ia_wait: "⏳ نضيف عملاتك…", ia_done: "✅ أضيفت {n} عملة!", ia_late: "✅ تم الدفع. ستصل عملاتك بعد قليل.",
      ia_fail: "لم تتم عملية الشراء: ", ia_cancel: "أُلغي الشراء", ia_restore: "لم تصل؟ تحقق مجدداً", ia_none: "باقات العملات غير جاهزة بعد." },
  };
  try { for (const [l, o] of Object.entries(W)) if (I18N[l]) Object.assign(I18N[l], o); } catch {}

  const css = document.createElement("style");
  css.textContent = `
  .ia-box{border:1.5px solid #e2b65a;border-radius:20px;padding:12px;margin:0 0 14px;background:linear-gradient(180deg,rgba(226,182,90,.10),rgba(0,0,0,.05))}
  .ia-box h3{margin:0;font-size:1rem}.ia-box .s{color:var(--muted);font-size:.8rem;margin-bottom:10px}
  .ia-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
  .ia-p{border:1px solid var(--line);background:var(--card);border-radius:16px;padding:12px 8px;display:grid;justify-items:center;gap:4px;cursor:pointer;font:inherit;color:var(--ink)}
  .ia-p b{font-size:1.15rem;font-variant-numeric:tabular-nums}.ia-p .pr{font-size:.85rem;font-weight:900;color:#b8862e}
  .ia-p .bn{font-size:.68rem;font-weight:900;color:#16a34a}
  .ia-p[disabled]{opacity:.55}
  .ia-more{margin-top:8px;border:0;background:none;color:var(--muted);font:inherit;font-size:.78rem;text-decoration:underline;cursor:pointer}`;
  document.head.appendChild(css);

  const isIOSApp = () => { try { return !!window.Capacitor?.isNativePlatform?.() && window.Capacitor.getPlatform() === "ios"; } catch { return false; } };
  let P = null, ready = null, products = [], coinsOf = {};
  // the app has no bundled @capacitor/core, so talk to the native plugin straight through the bridge
  const native = (name) => {
    const C = window.Capacitor || {};
    if (typeof C.registerPlugin === "function") return C.registerPlugin(name);
    if (C.Plugins && C.Plugins[name]) return C.Plugins[name];
    return new Proxy({}, { get: (_, m) => (opts) => C.nativePromise(name, String(m), opts || {}) });
  };
  const plugin = () => P || (P = native("Purchases"));

  async function setup() {
    if (ready) return ready;
    ready = (async () => {
      const key = window.LT_NATIVE?.revenuecatKey;
      if (!key || !me) throw new Error("not_configured");
      await plugin().configure({ apiKey: key, appUserID: me.id });   // purchases are tied to this person's account
      const list = await sb.rpc("iap_products_list").then((r) => r.data || []);
      list.forEach((x) => (coinsOf[x.product_id] = x));
      const r = await plugin().getProducts({ productIdentifiers: list.map((x) => x.product_id), type: "NON_SUBSCRIPTION" });
      products = (r?.products || []).filter((p) => coinsOf[p.identifier]).sort((a, b) => a.price - b.price);
      return products;
    })();
    ready.catch(() => { ready = null; });
    return ready;
  }
  const fmt = (n) => Number(n || 0).toLocaleString("en-US");

  // wait until the server added the coins (it hears from Apple / RevenueCat a few seconds after paying)
  async function waitCoins(before, expect) {
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      const w = typeof loadWallet === "function" ? await loadWallet().catch(() => null) : null;
      if (w && Number(w.coins) >= before + expect) return true;
    }
    return false;
  }

  async function buy(p, btn) {
    btn.disabled = true;
    let start = 0;
    try { const w = typeof loadWallet === "function" ? await loadWallet() : null; if (w) start = Number(w.coins); } catch {}
    try {
      await plugin().purchaseStoreProduct({ product: p });
      toast(t("ia_wait"));
      const c = coinsOf[p.identifier]?.coins || 0;
      const ok = await waitCoins(start, c);
      toast(ok ? t("ia_done", { n: fmt(c) }) : t("ia_late"));
      if (typeof openWallet === "function" && document.getElementById("iap-box")) openWallet();
    } catch (e) {
      const m = String(e?.message || e || "");
      if (/cancel/i.test(m) || e?.userCancelled || e?.code === "1") toast(t("ia_cancel"));
      else toast(t("ia_fail") + m);
    } finally { btn.disabled = false; }
  }

  window.AppleIAP = {
    available: isIOSApp,
    // the 🍎 box at the top of the wallet
    async fill() {
      const box = document.getElementById("iap-box"); if (!box) return;
      box.className = "ia-box";
      box.innerHTML = `<h3>${esc(t("ia_title"))}</h3><div class="s">${esc(t("ia_sub"))}</div><div class="ia-grid"><div class="muted small">…</div></div>`;
      let list = [];
      try { list = await setup(); } catch (e) { box.querySelector(".ia-grid").innerHTML = `<div class="muted small">${esc(t("ia_none"))}</div>`; return; }
      if (!list.length) { box.querySelector(".ia-grid").innerHTML = `<div class="muted small">${esc(t("ia_none"))}</div>`; return; }
      box.querySelector(".ia-grid").innerHTML = list.map((p, i) => {
        const c = coinsOf[p.identifier];
        return `<button type="button" class="ia-p" data-i="${i}"><b>🪙 ${fmt(c.coins)}</b>${c.bonus ? `<span class="bn">+${esc(String(c.bonus))}%</span>` : ""}<span class="pr">${esc(p.priceString || "")}</span></button>`;
      }).join("") + "";
      box.insertAdjacentHTML("beforeend", `<button type="button" class="ia-more" id="ia-recheck">${esc(t("ia_restore"))}</button>`);
      box.querySelectorAll("[data-i]").forEach((b) => b.addEventListener("click", () => buy(list[Number(b.dataset.i)], b)));
      box.querySelector("#ia-recheck").addEventListener("click", async () => {
        try { await plugin().syncPurchases?.(); } catch {}
        if (typeof openWallet === "function") openWallet();
      });
    },
  };
})();
