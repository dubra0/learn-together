/* 👈 Swipe to go back, like on iPhone: drag sideways anywhere on the screen and let go → one step back.
   In right-to-left languages (Kurdish, Arabic, Persian) you swipe to the LEFT; in left-to-right languages to the RIGHT.
   One step back means: close the open sheet → or close the photo / story viewer → or leave the page you're on (its ‹ button).
   It never leaves a live room by itself (that has its own button), and it ignores sliders, text boxes and rows that scroll sideways.
   On Android the phone's own back button does the same. */
(() => {
  const MIN = 70;              // how far you have to drag (px)
  const visible = (el) => !!el && !el.hidden && el.offsetParent !== null;
  const rtl = () => (document.documentElement.dir || document.body.dir || getComputedStyle(document.body).direction) === "rtl";

  // the back button of the page that is showing now (null on the home tabs, in a room, and on the sign-in pages)
  function backButtonHere() {
    const scr = [...document.querySelectorAll("body > .screen")].find((s) => !s.hidden);
    if (!scr || /^(screen-main|screen-room|screen-onboarding|screen-setup|screen-name)$/.test(scr.id)) return null;
    return [...scr.querySelectorAll("[data-back], #fw-back, #pf-back, #dm-back")].find(visible) || null;
  }
  function canGoBack() {
    if (!document.getElementById("sheet")?.hidden) return true;
    if (history.state && (history.state.st || history.state.pv)) return true;   // story / post viewer
    return !!backButtonHere();
  }
  function goBack() {
    const sheet = document.getElementById("sheet");
    if (sheet && !sheet.hidden) { (typeof closeSheet === "function" ? closeSheet : () => { sheet.hidden = true; document.getElementById("sheet-backdrop").hidden = true; })(); return true; }
    if (history.state && (history.state.st || history.state.pv)) { history.back(); return true; }
    const b = backButtonHere(); if (b) { b.click(); return true; }
    return false;
  }

  // don't start a swipe on things that use sideways dragging themselves
  function blocked(el) {
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      if (n.matches?.("input, textarea, select, [contenteditable=''], [contenteditable='true'], canvas, video, [data-noswipe], #video-grid")) return true;
      const cs = getComputedStyle(n);
      if ((cs.overflowX === "auto" || cs.overflowX === "scroll") && n.scrollWidth > n.clientWidth + 4) return true;
    }
    return false;
  }

  // a small round arrow that follows the finger, so you can see the swipe working
  const css = document.createElement("style");
  css.textContent = `#swb{position:fixed;top:50%;z-index:9999;width:44px;height:44px;margin-top:-22px;border-radius:50%;display:grid;place-items:center;pointer-events:none;
    background:rgba(20,20,35,.78);color:#fff;font-size:22px;font-weight:800;box-shadow:0 6px 18px rgba(0,0,0,.35);opacity:0;transition:opacity .15s;backdrop-filter:blur(6px)}
    #swb.go{background:linear-gradient(180deg,#f7d98b,#e2b65a);color:#2a1a00}`;
  document.head.appendChild(css);
  const arrow = document.createElement("div"); arrow.id = "swb"; arrow.setAttribute("aria-hidden", "true");
  document.addEventListener("DOMContentLoaded", () => document.body.appendChild(arrow));
  if (document.body) document.body.appendChild(arrow);

  let sx = 0, sy = 0, st = 0, on = false, dir = 1;
  addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1 || blocked(e.target) || !canGoBack()) { on = false; return; }
    const t = e.touches[0]; sx = t.clientX; sy = t.clientY; st = Date.now(); on = true; dir = rtl() ? -1 : 1;
  }, { passive: true });
  addEventListener("touchmove", (e) => {
    if (!on) return;
    const t = e.touches[0], dx = (t.clientX - sx) * dir, dy = Math.abs(t.clientY - sy);
    if (dy > 40 && dy > Math.abs(dx)) { on = false; arrow.style.opacity = 0; return; }   // they are scrolling up/down
    if (dx > 10) {
      const p = Math.min(1, dx / MIN);
      arrow.textContent = dir > 0 ? "‹" : "›";
      arrow.style[dir > 0 ? "left" : "right"] = Math.min(60, dx * .5) - 10 + "px";
      arrow.style[dir > 0 ? "right" : "left"] = "auto";
      arrow.style.opacity = p; arrow.classList.toggle("go", p >= 1);
    }
  }, { passive: true });
  addEventListener("touchend", (e) => {
    arrow.style.opacity = 0;
    if (!on) return; on = false;
    const t = e.changedTouches[0], dx = (t.clientX - sx) * dir, dy = Math.abs(t.clientY - sy);
    if (dx >= MIN && dx > dy * 1.8 && Date.now() - st < 900) { if (goBack()) try { navigator.vibrate?.(8); } catch {} }
  }, { passive: true });
  addEventListener("touchcancel", () => { on = false; arrow.style.opacity = 0; }, { passive: true });

  // 🤖 Android: the phone's back button
  try {
    const App = window.Capacitor?.Plugins?.App;
    App?.addListener?.("backButton", () => { if (!goBack()) App.minimizeApp?.(); });
  } catch {}

  window.SwipeBack = { goBack, canGoBack };
})();
