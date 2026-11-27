/* ◀ The phone's own Back works inside the app (Android ◀ button and back gesture, the browser's Back, Safari's edge swipe).
   Nothing is drawn on the screen: every time you open a sheet or a page, the app leaves a step in the phone's history,
   so pressing the phone's Back goes one step back — close the sheet, or leave the page, or leave the room —
   instead of closing the whole app. On the home screen, Back closes the app as usual. */
(() => {
  const visible = (el) => !!el && !el.hidden && el.offsetParent !== null;
  const SUB = /^(screen-create|screen-edit|screen-saved|screen-settings|screen-compose|screen-follows|screen-profile|screen-inbox|screen-dm|screen-room)$/;

  // ---------- what "one step back" does ----------
  function currentScreen() { return [...document.querySelectorAll("body > .screen")].find((s) => !s.hidden) || null; }
  function goBack() {
    const sheet = document.getElementById("sheet");
    if (sheet && !sheet.hidden) { orig.closeSheet(); return true; }
    const scr = currentScreen();
    if (!scr || !SUB.test(scr.id)) return false;
    const b = scr.id === "screen-room" ? document.getElementById("room-back")
      : [...scr.querySelectorAll("[data-back], #fw-back, #pf-back, #dm-back")].find(visible);
    if (b) { b.click(); return true; }
    return false;
  }

  // ---------- remember steps in the phone's history ----------
  let cur = history.state, popping = false;
  const realPush = history.pushState.bind(history);
  history.pushState = function (state, ...rest) { cur = state; return realPush(state, ...rest); };   // also see the story / photo viewers' steps
  const step = (kind) => { if (!popping) history.pushState({ lt: kind, at: Date.now() }, ""); };

  // closed with an on-screen button (×, ‹, tapping outside): take our step out of the history too, quietly
  let quiet = false;
  const unstep = (kind) => { if (!popping && cur && cur.lt === kind) { quiet = true; history.back(); } };

  const orig = { openSheet: window.openSheet, closeSheet: window.closeSheet, show: window.show };
  if (typeof orig.openSheet === "function") window.openSheet = function (...a) {
    const wasOpen = !document.getElementById("sheet")?.hidden;
    const r = orig.openSheet.apply(this, a);
    if (!wasOpen) step("sheet");
    return r;
  };
  if (typeof orig.closeSheet === "function") window.closeSheet = function (...a) {
    const wasOpen = !document.getElementById("sheet")?.hidden;
    const r = orig.closeSheet.apply(this, a);
    if (wasOpen) unstep("sheet");
    return r;
  };
  // the backdrop was wired to the old closeSheet before this file loaded
  document.getElementById("sheet-backdrop")?.addEventListener("click", () => unstep("sheet"));
  if (typeof orig.show === "function") window.show = function (id, ...a) {
    const before = currentScreen()?.id;
    const r = orig.show.call(this, id, ...a);
    if (id !== before) { if (SUB.test(id)) step("screen"); else if (SUB.test(before || "")) unstep("screen"); }
    return r;
  };

  addEventListener("popstate", (e) => {
    const popped = cur; cur = e.state;
    if (quiet) { quiet = false; return; }
    if (popped && (popped.st || popped.pv)) return;          // a story / photo viewer: it closes itself
    if (!popped || !popped.lt) return;
    popping = true;
    let did = false;
    try { did = goBack(); } finally { popping = false; }
    // that step was already closed with an on-screen button → skip it so one press still does something
    if (!did && cur && cur.lt) history.back();
  });

  // 🤖 the Android app: send the phone's Back button to the same place
  try {
    const App = window.Capacitor?.Plugins?.App;
    App?.addListener?.("backButton", () => { if (cur && (cur.lt || cur.st || cur.pv)) history.back(); else if (!goBack()) App.exitApp?.(); });
  } catch {}

  window.SwipeBack = { goBack };
})();
