// Service worker: makes the app open fast even on weak internet. Never caches Supabase / LiveKit traffic.
//  - app files: try the internet for the newest version, but if it takes more than 2.5 s use the saved copy
//  - libraries with a fixed version (jsdelivr) and fonts: never change, so always from the saved copy
const CACHE = "talk-together-v5";
const SHELL = ["./", "index.html", "app.js", "i18n.js", "topics.js", "gift-fx.js", "wallet.js", "video-stats.js", "face-lenses.js", "top-gifters.js",
  "privacy.html", "manifest.json", "icons/icon-192.png", "icons/icon-512.png"];
const FOREVER = ["cdn.jsdelivr.net", "fonts.gstatic.com", "fonts.googleapis.com"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function save(req, res) {
  if (res && (res.ok || res.type === "opaque")) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
  return res;
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // fixed-version libraries + fonts: saved copy first (instant), internet only the first time
  if (FOREVER.includes(url.hostname) && !url.pathname.endsWith(".task")) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => save(req, res))));
    return;
  }
  if (url.origin !== location.origin) return;

  // app files: newest from the internet, but don't wait more than 2.5 s for it
  e.respondWith(new Promise((resolve) => {
    let done = false;
    const fallback = () => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match("index.html"));
    const timer = setTimeout(() => fallback().then((r) => { if (r && !done) { done = true; resolve(r); } }), 2500);
    fetch(req).then((res) => {
      save(req, res);
      if (!done) { done = true; clearTimeout(timer); resolve(res); }
    }).catch(() => {
      clearTimeout(timer);
      if (!done) fallback().then((r) => { done = true; resolve(r || Response.error()); });
    });
  }));
});
