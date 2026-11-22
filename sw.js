// Service worker: makes the app open fast even on weak internet. Never caches Supabase / LiveKit traffic.
//  - app files: try the internet for the newest version, but if it takes more than 2.5 s use the saved copy
//  - libraries with a fixed version (jsdelivr) and fonts: never change, so always from the saved copy
const CACHE = "talk-together-v45";
// 🎁 gift videos + sounds come WITH the app: downloaded once when the app is installed/opened, then kept on the phone.
// They have their own box (not emptied on app updates). A new or changed gift video → add/rename it here and bump GIFTS.
const GIFTS = "learn-together-gifts-v1";
const GIFT_FILES = ["gifts/volcano.mov.MOV", "gifts/eagle.mp4", "gifts/horse.mp4", "gifts/elephant.mp4", "gifts/wolf.MOV", "gifts/lightning%20storm.mp4", "gifts/lion.MP4", "gifts/dragon.MP4",
  "gifts/water.mp4", "gifts/plain.mp4", "gifts/fire%20dragon.MP4", "sounds/lion-roar.mp3"];
const SHELL = ["./", "index.html", "theme.css", "ui-plus.js", "safety.js", "push.js", "random-call.js", "visitors.js", "people-search.js", "chat-plus.js", "feed-plus.js", "rooms-plus.js", "me-plus.js", "settings-plus.js", "wallet-plus.js", "post-editor.js", "stories.js", "room-looks.js", "levels.js", "app.js", "i18n.js", "topics.js", "gift-fx.js", "wallet.js", "video-stats.js", "face-lenses.js", "top-gifters.js",
  "privacy.html", "manifest.json", "icons/icon-192.png", "icons/icon-512.png"];
const FOREVER = ["cdn.jsdelivr.net", "fonts.gstatic.com", "fonts.googleapis.com"];

self.addEventListener("install", (e) => {
  // "reload" = take the files fresh from the internet, never an older copy the browser still remembers
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== GIFTS && k !== "lt-prefs").map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => saveGifts()),
  );
});
// fetch the gift files that are not saved yet, one by one (a missing file never stops the others)
async function saveGifts() {
  const box = await caches.open(GIFTS);
  for (const f of GIFT_FILES) {
    try {
      if (await box.match(f)) continue;
      const res = await fetch(f, { cache: "no-store" });
      if (res.ok) await box.put(f, res);
    } catch {}
  }
}

function save(req, res) {
  if (res && res.status !== 206 && (res.ok || res.type === "opaque")) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {}); }
  return res;
}

// 🔔 a notification arrived from our server (send-push)
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data ? e.data.text() : "" }; }
  const scope = self.registration.scope;
  e.waitUntil((async () => {
    // 🔇 a chat I muted: the notification still comes, but silently (no sound, no buzz)
    let quiet = false;
    try {
      const r = await (await caches.open("lt-prefs")).match("muted.json");
      const list = r ? await r.json() : [];
      quiet = typeof d.tag === "string" && d.tag.startsWith("dm-") && Array.isArray(list) && list.includes(d.tag.slice(3));
    } catch {}
    await self.registration.showNotification(d.title || "Learn Together", {
      body: d.body || "",
      icon: d.icon || scope + "icons/icon-192.png",
      badge: scope + "icons/icon-192.png",
      tag: d.tag || undefined,
      renotify: !!d.tag && !quiet,
      silent: quiet,
      data: { url: typeof d.url === "string" && d.url.startsWith(scope) ? d.url : scope },
    });
  })());
});
// windows that told us they are the installed app (home-screen icon), not a browser tab
const appWindows = new Set();
self.addEventListener("message", (e) => {
  if (e.data?.type === "standalone" && e.source?.id) appWindows.add(e.source.id);
});

// tapping it opens the INSTALLED app at the right place (a chat, a live, a profile) — never a browser tab with the link on top
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = e.notification.data?.url || self.registration.scope;
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const app = wins.find((w) => appWindows.has(w.id));
    if (app) {
      try { await app.focus(); } catch {}
      app.postMessage({ type: "open", url }); // open the chat/live inside the running app, no reload
      return;
    }
    // app not open: openWindow launches the installed app (Android opens in-scope links in the app)
    await self.clients.openWindow(url);
  })());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // fixed-version libraries + fonts: saved copy first (instant), internet only the first time
  if (FOREVER.includes(url.hostname) && !url.pathname.endsWith(".task")) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => save(req, res))));
    return;
  }
  // 🎬 gift videos the admin added (stored on Supabase): saved on the phone after the first time,
  // so each phone downloads each video only once (saves internet and the Supabase free quota)
  if (url.pathname.includes("/storage/v1/object/public/gift-videos/")) {
    if (req.headers.has("range")) return;
    e.respondWith(caches.open(GIFTS).then(async (box) => {
      const hit = await box.match(url.href);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok && res.status === 200) box.put(url.href, res.clone()).catch(() => {});
      return res;
    }));
    return;
  }
  if (url.origin !== location.origin) return;

  // 🎁 gift videos / sounds: the saved copy first (instant, no internet), the internet only if it isn't saved yet.
  // A video asking for just a part of the file (Range) goes straight to the internet — a saved whole file can't answer that.
  if (/\/(gifts|sounds)\//.test(url.pathname)) {
    if (req.headers.has("range")) return;
    e.respondWith(caches.open(GIFTS).then(async (box) => {
      const key = url.pathname.slice(url.pathname.indexOf(/\/gifts\//.test(url.pathname) ? "gifts/" : "sounds/"));
      const hit = await box.match(key);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok && res.status === 200) box.put(key, res.clone()).catch(() => {});
      return res;
    }));
    return;
  }

  // app files: newest from the internet, but don't wait more than 2.5 s for it
  e.respondWith(new Promise((resolve) => {
    let done = false;
    const fallback = () => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match("index.html"));
    const timer = setTimeout(() => fallback().then((r) => { if (r && !done) { done = true; resolve(r); } }), 2500);
    // "no-cache" = always ask the server if the file changed (a tiny check), so an update shows at once
    // (a page opening can't carry extra options, so for pages we ask by address)
    fetch(req.mode === "navigate" ? new Request(req.url, { cache: "no-cache", credentials: "same-origin" }) : new Request(req, { cache: "no-cache" })).then((res) => {
      save(req, res);
      if (!done) { done = true; clearTimeout(timer); resolve(res); }
    }).catch(() => {
      clearTimeout(timer);
      if (!done) fallback().then((r) => { done = true; resolve(r || Response.error()); });
    });
  }));
});
