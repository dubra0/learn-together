/* =====================================================================
   ✂️ Post editor (same as the approved demo): trim a video, turn its sound off / down,
   write texts on a video or photo and drag them anywhere.
   The video file is not re-made: the edits are saved with the post (posts.edit)
   and every player in the app plays the video with them (fast, even on weak phones).

   PostEditor.open({ kind: "video" | "image", src, edit }) → Promise<edit | null>
   PostEditor.decorate(root)  → shows texts / trim / sound for posts inside root
   PostEditor.clean(edit)     → safe copy of an edit (or null)
   Uses globals from app.js: esc, t, feedCache, uiLang
   ===================================================================== */
(() => {
  const W = {
    en: { pe_title: "Edit", pe_done: "✓ Done", pe_trim: "Trim", pe_sound: "Sound", pe_text: "Text",
      pe_trimHelp: "Drag the yellow handles. Only the part inside the yellow frame stays.", pe_secs: "{n} s",
      pe_vSound: "Video sound", pe_soundOn: "🔊 Sound on", pe_soundOff: "🔇 Sound off", pe_vol: "Volume",
      pe_soundHelp: "You can remove the video's sound completely, or turn it down.",
      pe_addText: "Add text", pe_editText: "Edit text", pe_ph: "Write here…", pe_plain: "Plain", pe_boxed: "In a box", pe_size: "Size",
      pe_add: "＋ Add", pe_ok: "✓ Done", pe_del: "🗑️ Delete", pe_textHelp: "Drag the text with your finger to put it anywhere. Tap it to change it.",
      pe_maxTexts: "You can add up to 6 texts.", pe_editBtn: "✏️ Edit" },
    ckb: { pe_title: "دەستکاری", pe_done: "✓ تەواو", pe_trim: "بڕین", pe_sound: "دەنگ", pe_text: "نووسین",
      pe_trimHelp: "دەستکە زەردەکان ڕابکێشە. تەنها بەشی ناو چوارچێوە زەردەکە دەمێنێتەوە.", pe_secs: "{n} چرکە",
      pe_vSound: "دەنگی ڤیدیۆکە", pe_soundOn: "🔊 دەنگ هەیە", pe_soundOff: "🔇 دەنگ لابراوە", pe_vol: "بەرزیی دەنگ",
      pe_soundHelp: "دەتوانیت دەنگی ڤیدیۆکە بە تەواوی لابەریت، یان کەمی بکەیتەوە.",
      pe_addText: "نووسین زیاد بکە", pe_editText: "دەستکاریی نووسین", pe_ph: "لێرە بنووسە…", pe_plain: "نووسینی ئاسایی", pe_boxed: "لەناو چوارچێوە", pe_size: "قەبارە",
      pe_add: "＋ زیادکردن", pe_ok: "✓ تەواو", pe_del: "🗑️ سڕینەوە", pe_textHelp: "دوای زیادکردن، نووسینەکە بە پەنجە ڕابکێشە بۆ هەر شوێنێک. لێی بدە بۆ دەستکاری.",
      pe_maxTexts: "زۆرترین ٦ نووسین دەتوانیت دابنێیت.", pe_editBtn: "✏️ دەستکاری" },
    ar: { pe_title: "تعديل", pe_done: "✓ تم", pe_trim: "قص", pe_sound: "الصوت", pe_text: "نص",
      pe_trimHelp: "اسحب المقبضين الأصفرين. يبقى فقط الجزء داخل الإطار الأصفر.", pe_secs: "{n} ث",
      pe_vSound: "صوت الفيديو", pe_soundOn: "🔊 الصوت يعمل", pe_soundOff: "🔇 الصوت مُزال", pe_vol: "مستوى الصوت",
      pe_soundHelp: "يمكنك إزالة صوت الفيديو بالكامل أو خفضه.",
      pe_addText: "أضف نصاً", pe_editText: "تعديل النص", pe_ph: "اكتب هنا…", pe_plain: "عادي", pe_boxed: "داخل إطار", pe_size: "الحجم",
      pe_add: "＋ إضافة", pe_ok: "✓ تم", pe_del: "🗑️ حذف", pe_textHelp: "اسحب النص بإصبعك إلى أي مكان. اضغط عليه لتعديله.",
      pe_maxTexts: "يمكنك إضافة 6 نصوص كحد أقصى.", pe_editBtn: "✏️ تعديل" },
  };
  try { for (const [l, o] of Object.entries(W)) if (I18N[l]) Object.assign(I18N[l], o); } catch {}

  const COLORS = ["#ffffff", "#000000", "#2fd1b3", "#ffb23f", "#f0463c", "#4f8cff", "#ff5fa2"];
  const LIGHT = new Set(["#ffffff", "#ffb23f", "#2fd1b3"]);
  const num = (v, lo, hi, d) => { const n = Number(v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };
  const fmt = (s) => { s = Math.max(0, s || 0); return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`; };

  /* ---------- an edit, checked (anyone could send anything, so never trust it) ---------- */
  function clean(e) {
    if (!e || typeof e !== "object") return null;
    const out = {};
    if (e.a != null || e.b != null) {
      const a = num(e.a, 0, 36000, 0), b = num(e.b, 0, 36000, 0);
      if (b > a + 0.5) { out.a = Math.round(a * 10) / 10; out.b = Math.round(b * 10) / 10; }
    }
    if (e.mute === true) out.mute = true;
    if (e.vol != null && num(e.vol, 0, 1, 1) < 1) out.vol = Math.round(num(e.vol, 0, 1, 1) * 100) / 100;
    if (Array.isArray(e.texts)) {
      const tx = e.texts.slice(0, 6).map((x) => x && typeof x === "object" && typeof x.s === "string" && x.s.trim() ? {
        s: x.s.slice(0, 80), c: COLORS.includes(x.c) ? x.c : "#ffffff", st: x.st === "boxed" ? "boxed" : "shadow",
        f: Math.round(num(x.f, 0.04, 0.14, 0.07) * 1000) / 1000, x: Math.round(num(x.x, 5, 95, 50)), y: Math.round(num(x.y, 5, 95, 50)),
      } : null).filter(Boolean);
      if (tx.length) out.texts = tx;
    }
    return Object.keys(out).length ? out : null;
  }

  /* ---------- texts on top of a post (feed, viewer, post sheet) ---------- */
  function textsHtml(texts) {
    return (texts || []).map((x) => {
      const box = x.st === "boxed";
      const style = `left:${x.x}%;top:${x.y}%;font-size:${(x.f * 100).toFixed(2)}vw;font-size:${(x.f * 100).toFixed(2)}cqw;` +
        (box ? `background:${x.c};color:${LIGHT.has(x.c) ? "#0b1512" : "#fff"}` : `color:${x.c}`);
      return `<div class="pe-t${box ? " boxed" : ""}" dir="auto" style="${style}">${esc(x.s)}</div>`;
    }).join("");
  }
  function hookVideo(v, e) {
    if (!v || v._pe) return; v._pe = 1;
    const a = e.a || 0, b = e.b || 0;
    if (a || b) {
      const into = () => { if (b && (v.currentTime < a - 0.3 || v.currentTime >= b)) { try { v.currentTime = a; } catch {} } };
      v.addEventListener("loadedmetadata", into);
      v.addEventListener("play", into);
      v.addEventListener("timeupdate", () => { if (b && v.currentTime >= b) { try { v.currentTime = a; } catch {} if (!v.loop && !v.classList.contains("reel-video")) v.pause(); } else if (v.currentTime < a - 0.3) { try { v.currentTime = a; } catch {} } });
      if (v.readyState >= 1) into();
    }
    if (e.mute || e.vol != null) {
      const fix = () => {
        if (e.mute && !v.muted) v.muted = true;
        if (e.vol != null && Math.abs(v.volume - e.vol) > 0.01) v.volume = e.vol;
      };
      v.addEventListener("volumechange", fix); v.addEventListener("play", fix); fix();
    }
  }
  function decorate(root) {
    if (!root) return;
    root.querySelectorAll("[data-post]").forEach((el) => {
      const post = feedCache.get(Number(el.dataset.post));
      const e = clean(post && post.edit);
      if (!e) return;
      const v = el.querySelector("video");
      hookVideo(v, e);
      if (e.mute) el.querySelectorAll("[data-mute]").forEach((m) => (m.hidden = true));   // no sound to turn on
      if (e.texts && !el.querySelector(".pe-ov")) {
        // the texts sit on the photo / video itself
        const ov = document.createElement("div");
        ov.className = "pe-ov"; ov.innerHTML = textsHtml(e.texts);
        if (el.classList.contains("reel")) el.insertBefore(ov, el.querySelector(".reel-shade"));
        else {
          const media = v || el.querySelector(".post-img"); if (!media) return;
          const box = document.createElement("div"); box.className = "pe-box";
          media.parentNode.insertBefore(box, media); box.appendChild(media); box.appendChild(ov);
        }
      }
    });
  }

  /* ---------- the editor ---------- */
  let css = false;
  function addCss() {
    if (css) return; css = true;
    const s = document.createElement("style");
    s.textContent = `
.pe-ov{position:absolute;inset:0;z-index:1;pointer-events:none;container-type:inline-size;overflow:hidden}
.pe-box{position:relative;container-type:inline-size}
.pe-box>.pe-ov{container-type:inline-size}
.pe-t{position:absolute;transform:translate(-50%,-50%);font-weight:900;padding:.2em .5em;border-radius:.45em;white-space:pre-wrap;text-align:center;max-width:88%;line-height:1.35;
  text-shadow:0 2px 6px rgba(0,0,0,.55);word-break:break-word}
.pe-t.boxed{text-shadow:none}
#pe{position:fixed;inset:0;z-index:90;background:#07110e;color:#eaf6f2;display:flex;flex-direction:column;gap:10px;
  padding:calc(10px + env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) calc(10px + env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));overflow-y:auto}
#pe *{box-sizing:border-box}
#pe button,#pe input,#pe textarea{font:inherit;color:inherit}
#pe button{cursor:pointer}
#pe .pe-bar{display:flex;align-items:center;justify-content:space-between;gap:8px;max-width:440px;width:100%;margin:0 auto}
#pe .pe-x{width:40px;height:40px;border-radius:50%;border:0;background:#18302a;font-size:18px}
#pe .pe-bar h1{margin:0;font-size:16px;font-weight:800}
#pe .pe-ok{border:0;border-radius:999px;height:40px;padding:0 18px;background:#2fd1b3;color:#04201a;font-weight:900}
#pe .pe-stage{position:relative;height:min(52vh,560px);aspect-ratio:9/16;max-width:100%;margin:0 auto;border-radius:20px;overflow:hidden;background:#000;flex:0 0 auto;container-type:inline-size;box-shadow:0 18px 44px rgba(0,0,0,.5)}
#pe .pe-stage video,#pe .pe-stage img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
#pe .pe-stage img{object-fit:contain}
#pe .pe-stage .pe-bg{position:absolute;inset:-30px;background-size:cover;background-position:center;filter:blur(26px) brightness(.5)}
#pe .pe-play{position:absolute;inset:0;border:0;background:transparent;display:grid;place-items:center;z-index:2}
#pe .pe-play span{width:58px;height:58px;border-radius:50%;background:rgba(0,0,0,.45);display:grid;place-items:center;font-size:22px;color:#fff;transition:opacity .3s}
#pe .playing .pe-play span{opacity:0}
#pe .pe-tb{position:absolute;bottom:0;inset-inline:0;height:4px;background:rgba(255,255,255,.2);z-index:4}
#pe .pe-tb i{display:block;height:100%;width:0;background:#2fd1b3}
#pe .pe-stage .pe-t{z-index:3;cursor:grab;user-select:none;touch-action:none}
#pe .pe-stage .pe-t.sel{outline:2px dashed rgba(255,255,255,.85);outline-offset:3px}
#pe .pe-panel{background:#0f1f1a;border-radius:20px;padding:14px;display:flex;flex-direction:column;gap:12px;max-width:440px;width:100%;margin:0 auto}
#pe .pe-panel h2{margin:0;font-size:14px;font-weight:800;display:flex;justify-content:space-between;gap:8px}
#pe .pe-panel h2 small{font-weight:600;color:#8fa9a0;font-size:12px;font-variant-numeric:tabular-nums}
#pe .pe-muted{color:#8fa9a0;font-size:12.5px;margin:0;line-height:1.6}
#pe .pe-tools{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:6px;max-width:440px;width:100%;margin:0 auto}
#pe .pe-tools button{border:0;background:#0f1f1a;border-radius:16px;padding:9px 2px 7px;display:flex;flex-direction:column;align-items:center;gap:3px;font-size:12px;font-weight:700;color:#8fa9a0}
#pe .pe-tools button b{font-size:19px;line-height:1.1}
#pe .pe-tools button[aria-pressed="true"]{background:#18302a;color:#eaf6f2;box-shadow:inset 0 0 0 1.5px #2fd1b3}
#pe .pe-trim{position:relative;height:56px;border-radius:12px;overflow:hidden;touch-action:none;user-select:none;background:#18302a}
#pe .pe-strip{position:absolute;inset:0;display:flex}
#pe .pe-strip canvas,#pe .pe-strip span{flex:1;min-width:0;height:100%;object-fit:cover;border-inline-end:1px solid rgba(0,0,0,.35)}
#pe .pe-shade{position:absolute;top:0;bottom:0;background:rgba(0,0,0,.62)}
#pe .pe-win{position:absolute;top:0;bottom:0;border:3px solid #ffb23f;border-radius:10px;pointer-events:none}
#pe .pe-h{position:absolute;top:0;bottom:0;width:22px;margin-left:-11px;background:#ffb23f;border-radius:8px;display:grid;place-items:center;color:#2a1800;font-weight:900;font-size:12px;cursor:ew-resize}
#pe .pe-ph{position:absolute;top:-3px;bottom:-3px;width:3px;background:#fff;border-radius:2px;pointer-events:none}
#pe .pe-row{display:flex;align-items:center;gap:10px}
#pe .pe-row label{flex:0 0 auto;font-size:13px;font-weight:700;min-width:96px}
#pe .pe-row input[type=range]{flex:1;min-width:0;accent-color:#2fd1b3}
#pe .pe-row output{width:40px;text-align:end;font-size:12px;color:#8fa9a0}
#pe .pe-tog{border:0;border-radius:999px;padding:8px 14px;background:#18302a;font-weight:800;font-size:13px}
#pe .pe-tog.on{background:#f0463c;color:#fff}
#pe .pe-tin{width:100%;border:1.5px solid #244038;background:#07110e;border-radius:14px;padding:10px 12px;font-size:16px;font-weight:700;resize:none}
#pe .pe-sw{display:flex;gap:8px;flex-wrap:wrap}
#pe .pe-sw button{width:30px;height:30px;border-radius:50%;border:2px solid #244038}
#pe .pe-sw button[aria-pressed="true"]{border-color:#fff;transform:scale(1.12)}
#pe .pe-seg{display:flex;gap:6px;flex-wrap:wrap}
#pe .pe-seg button{border:0;background:#18302a;border-radius:999px;padding:7px 12px;font-size:12.5px;font-weight:700}
#pe .pe-seg button[aria-pressed="true"]{background:#2fd1b3;color:#04201a}
#pe .pe-btns{display:flex;gap:8px}
#pe .pe-btns button{flex:1;border:0;border-radius:14px;height:42px;font-weight:800}
#pe .pe-btns .pri{background:#2fd1b3;color:#04201a}
#pe .pe-btns .del{background:#18302a;color:#ff8a80;flex:0 0 auto;padding:0 14px}
.pe-editbtn{position:absolute;bottom:8px;inset-inline-start:8px;border:0;border-radius:999px;background:rgba(0,0,0,.6);color:#fff;font-weight:800;padding:7px 14px;cursor:pointer;z-index:2}
#compose-preview .pe-ov,#compose-vpreview .pe-ov{border-radius:16px}`;
    document.head.appendChild(s);
  }

  function open(opts) {
    addCss();
    return new Promise((resolve) => {
      const isVid = opts.kind === "video";
      const old = clean(opts.edit) || {};
      const S = { a: old.a || 0, b: old.b || 0, dur: 0, mute: !!old.mute, vol: old.vol != null ? old.vol : 1,
        texts: (old.texts || []).map((x, i) => ({ ...x, id: i + 1 })), sel: null, tool: isVid ? "trim" : "text",
        draft: { s: "", c: "#ffffff", st: "boxed", f: 0.07 }, playing: false };
      let nextId = S.texts.length + 1;
      const wrap = document.createElement("div");
      wrap.id = "pe"; wrap.dir = document.documentElement.dir || "auto";
      wrap.innerHTML = `
        <div class="pe-bar"><button type="button" class="pe-x" aria-label="close">✕</button><h1>${esc(t("pe_title"))}</h1>
          <button type="button" class="pe-ok">${esc(t("pe_done"))}</button></div>
        <div class="pe-stage">
          ${isVid ? `<video playsinline preload="auto"></video><button type="button" class="pe-play" aria-label="play"><span>▶</span></button><div class="pe-tb"><i></i></div>`
                  : `<div class="pe-bg"></div><img alt="">`}
        </div>
        <div class="pe-panel"></div>
        <div class="pe-tools">${isVid ? `<button type="button" data-tool="trim"><b>✂️</b>${esc(t("pe_trim"))}</button>
          <button type="button" data-tool="sound"><b>🔊</b>${esc(t("pe_sound"))}</button>` : ""}
          <button type="button" data-tool="text"><b>Aa</b>${esc(t("pe_text"))}</button></div>`;
      document.body.appendChild(wrap);
      const $$ = (s) => wrap.querySelector(s);
      const stage = $$(".pe-stage"), panel = $$(".pe-panel");
      const v = $$("video"), im = $$("img");
      let raf = 0;

      const finish = (val) => { cancelAnimationFrame(raf); if (v) { v.pause(); v.removeAttribute("src"); v.load(); } wrap.remove(); resolve(val); };
      $$(".pe-x").addEventListener("click", () => finish(null));
      $$(".pe-ok").addEventListener("click", () => {
        const e = { texts: S.texts.map(({ s, c, st, f, x, y }) => ({ s, c, st, f, x, y })) };
        if (isVid && S.dur && (S.a > 0.05 || S.b < S.dur - 0.05)) { e.a = S.a; e.b = S.b; }
        if (isVid && S.mute) e.mute = true;
        if (isVid && !S.mute && S.vol < 0.99) e.vol = S.vol;
        finish(clean(e) || {});
      });

      /* video playback inside the editor */
      if (isVid) {
        v.src = opts.src; v.muted = S.mute; v.volume = S.vol;
        v.addEventListener("loadedmetadata", function ready() {
          // some recorded videos don't say how long they are until we jump to the end once
          if (!Number.isFinite(v.duration) && !ready.tried) {
            ready.tried = true;
            v.addEventListener("seeked", () => { ready.end = v.currentTime; v.currentTime = 0; ready(); }, { once: true });
            v.currentTime = 1e7; return;
          }
          S.dur = Number.isFinite(v.duration) ? v.duration : ready.end || 0;
          if (!S.b || S.b > S.dur) S.b = S.dur;
          if (S.a >= S.b) S.a = 0;
          v.currentTime = S.a;
          if (S.tool === "trim") showTool("trim");
        });
        const loop = () => {
          if (v.currentTime >= S.b) v.currentTime = S.a;
          const span = Math.max(0.1, S.b - S.a);
          $$(".pe-tb i").style.width = `${Math.min(100, Math.max(0, ((v.currentTime - S.a) / span) * 100))}%`;
          const ph = $$(".pe-ph"); if (ph && S.dur) ph.style.left = (v.currentTime / S.dur) * 100 + "%";
          if (!v.paused) raf = requestAnimationFrame(loop);
        };
        const play = () => { if (v.currentTime < S.a || v.currentTime >= S.b) v.currentTime = S.a; v.muted = S.mute; v.play().then(() => { stage.classList.add("playing"); $$(".pe-play span").textContent = "❚❚"; raf = requestAnimationFrame(loop); }).catch(() => {}); };
        const pause = () => { v.pause(); stage.classList.remove("playing"); $$(".pe-play span").textContent = "▶"; };
        S.pause = pause;
        $$(".pe-play").addEventListener("click", () => (v.paused ? play() : pause()));
      } else { im.src = opts.src; $$(".pe-bg").style.backgroundImage = `url("${opts.src}")`; S.pause = () => {}; }

      /* texts on the stage: drag to move, tap to edit */
      function drawTexts() {
        stage.querySelectorAll(".pe-t").forEach((e) => e.remove());
        for (const x of S.texts) {
          const div = document.createElement("div");
          div.innerHTML = textsHtml([x]);
          const el = div.firstElementChild; if (S.sel === x.id) el.classList.add("sel");
          el.addEventListener("pointerdown", (ev) => {
            ev.preventDefault(); ev.stopPropagation(); el.setPointerCapture(ev.pointerId);
            const r = stage.getBoundingClientRect(); const sx = ev.clientX, sy = ev.clientY; let moved = false;
            const mv = (e) => {
              if (Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy) > 4) moved = true;
              x.x = Math.min(95, Math.max(5, ((e.clientX - r.left) / r.width) * 100));
              x.y = Math.min(95, Math.max(5, ((e.clientY - r.top) / r.height) * 100));
              el.style.left = x.x + "%"; el.style.top = x.y + "%";
            };
            const up = () => { el.removeEventListener("pointermove", mv); el.removeEventListener("pointerup", up);
              if (!moved) { S.sel = x.id; S.draft = { s: x.s, c: x.c, st: x.st, f: x.f }; showTool("text"); } };
            el.addEventListener("pointermove", mv); el.addEventListener("pointerup", up);
          });
          stage.appendChild(el);
        }
      }

      function layoutTrim() {
        if (!S.dur) return;
        const pa = (S.a / S.dur) * 100, pb = (S.b / S.dur) * 100;
        $$(".pe-shl").style.cssText = `left:0;width:${pa}%`; $$(".pe-shr").style.cssText = `left:${pb}%;right:0`;
        $$(".pe-win").style.cssText = `left:${pa}%;width:${pb - pa}%`;
        $$(".pe-ha").style.left = pa + "%"; $$(".pe-hb").style.left = pb + "%";
        $$(".pe-tl").textContent = `${fmt(S.a)} – ${fmt(S.b)} · ${t("pe_secs", { n: Math.round(S.b - S.a) })}`;
      }
      let thumbs = null;
      function makeThumbs(box) {
        // small pictures of the video along the trim bar (best effort)
        if (thumbs) { box.replaceChildren(...thumbs.map((c) => { const k = document.createElement("canvas"); k.width = c.width; k.height = c.height; k.getContext("2d").drawImage(c, 0, 0); return k; })); return; }
        const n = 8, list = [], pv = document.createElement("video");
        pv.muted = true; pv.playsInline = true; pv.preload = "auto"; pv.src = opts.src;
        let i = 0, stop = false; setTimeout(() => { stop = true; }, 8000);
        const next = () => { if (stop || i >= n) { pv.removeAttribute("src"); pv.load(); if (list.length === n) thumbs = list; return; } pv.currentTime = Math.min(S.dur - 0.1, (S.dur * (i + 0.5)) / n); };
        pv.addEventListener("seeked", () => {
          const c = document.createElement("canvas"); c.width = 48; c.height = 64;
          try { const g = c.getContext("2d"), vr = pv.videoWidth / pv.videoHeight || 0.75, cr = 0.75;
            let sw = pv.videoWidth, sh = pv.videoHeight, sx = 0, sy = 0;
            if (vr > cr) { sw = sh * cr; sx = (pv.videoWidth - sw) / 2; } else { sh = sw / cr; sy = (pv.videoHeight - sh) / 2; }
            g.drawImage(pv, sx, sy, sw, sh, 0, 0, 48, 64); } catch {}
          list.push(c); const slot = box.children[i]; if (slot) slot.replaceWith(c); i++; next();
        });
        pv.addEventListener("loadedmetadata", next, { once: true });
      }
      function wireTrim() {
        const tr = $$(".pe-trim");
        const drag = (h, which) => h.addEventListener("pointerdown", (ev) => {
          ev.preventDefault(); h.setPointerCapture(ev.pointerId); S.pause();
          const mv = (e) => {
            const r = tr.getBoundingClientRect(); const tt = Math.min(S.dur, Math.max(0, ((e.clientX - r.left) / r.width) * S.dur));
            if (which === "a") { S.a = Math.min(tt, S.b - 1); v.currentTime = S.a; }
            else { S.b = Math.max(tt, S.a + 1); v.currentTime = Math.max(S.a, S.b - 0.1); }
            S.a = Math.max(0, S.a); S.b = Math.min(S.dur, S.b); layoutTrim();
          };
          const up = () => { h.removeEventListener("pointermove", mv); h.removeEventListener("pointerup", up); v.currentTime = S.a; };
          h.addEventListener("pointermove", mv); h.addEventListener("pointerup", up);
        });
        drag($$(".pe-ha"), "a"); drag($$(".pe-hb"), "b");
      }

      function showTool(tool) {
        S.tool = tool;
        if (tool !== "text" && S.sel) S.sel = null;
        wrap.querySelectorAll("[data-tool]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.tool === tool)));
        if (tool === "trim") {
          panel.innerHTML = `<h2>${esc(t("pe_trim"))} <small class="pe-tl"></small></h2>
            <div class="pe-trim" dir="ltr"><div class="pe-strip">${"<span></span>".repeat(8)}</div>
              <div class="pe-shade pe-shl"></div><div class="pe-shade pe-shr"></div><div class="pe-win"></div>
              <div class="pe-ph"></div><div class="pe-h pe-ha">‹</div><div class="pe-h pe-hb">›</div></div>
            <p class="pe-muted">${esc(t("pe_trimHelp"))}</p>`;
          if (S.dur) { layoutTrim(); wireTrim(); makeThumbs($$(".pe-strip")); }
        }
        if (tool === "sound") {
          panel.innerHTML = `<h2>${esc(t("pe_sound"))}</h2>
            <div class="pe-row"><label>${esc(t("pe_vSound"))}</label><button type="button" class="pe-tog ${S.mute ? "on" : ""}" id="pe-mute">${esc(S.mute ? t("pe_soundOff") : t("pe_soundOn"))}</button></div>
            <div class="pe-row"><label for="pe-vol">${esc(t("pe_vol"))}</label><input type="range" id="pe-vol" min="0" max="100" value="${Math.round(S.vol * 100)}" ${S.mute ? "disabled" : ""}><output>${Math.round(S.vol * 100)}%</output></div>
            <p class="pe-muted">${esc(t("pe_soundHelp"))}</p>`;
          $$("#pe-mute").addEventListener("click", () => { S.mute = !S.mute; v.muted = S.mute; showTool("sound"); });
          $$("#pe-vol").addEventListener("input", (e) => { S.vol = e.target.value / 100; v.volume = S.vol; e.target.nextElementSibling.textContent = e.target.value + "%"; });
        }
        if (tool === "text") {
          const d = S.draft, editing = S.sel != null;
          panel.innerHTML = `<h2>${esc(editing ? t("pe_editText") : t("pe_addText"))}</h2>
            <textarea class="pe-tin" id="pe-tin" rows="2" maxlength="80" dir="auto" placeholder="${esc(t("pe_ph"))}">${esc(d.s)}</textarea>
            <div class="pe-sw">${COLORS.map((c) => `<button type="button" data-c="${c}" aria-pressed="${d.c === c}" style="background:${c}" aria-label="${c}"></button>`).join("")}</div>
            <div class="pe-seg"><button type="button" data-st="shadow" aria-pressed="${d.st === "shadow"}">${esc(t("pe_plain"))}</button>
              <button type="button" data-st="boxed" aria-pressed="${d.st === "boxed"}">${esc(t("pe_boxed"))}</button></div>
            <div class="pe-row"><label for="pe-sz">${esc(t("pe_size"))}</label><input type="range" id="pe-sz" min="40" max="140" value="${Math.round(d.f * 1000)}"><output>${Math.round(d.f * 1000)}</output></div>
            <div class="pe-btns">${editing ? `<button type="button" class="del" id="pe-tdel">${esc(t("pe_del"))}</button>` : ""}<button type="button" class="pri" id="pe-tok">${esc(editing ? t("pe_ok") : t("pe_add"))}</button></div>
            <p class="pe-muted">${esc(t("pe_textHelp"))}</p>`;
          const sync = () => { if (editing) { const x = S.texts.find((y) => y.id === S.sel); if (x) Object.assign(x, { s: S.draft.s || " ", c: S.draft.c, st: S.draft.st, f: S.draft.f }); drawTexts(); } };
          $$("#pe-tin").addEventListener("input", (e) => { S.draft.s = e.target.value; sync(); });
          panel.querySelectorAll("[data-c]").forEach((b) => b.addEventListener("click", () => { S.draft.c = b.dataset.c; panel.querySelectorAll("[data-c]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); sync(); }));
          panel.querySelectorAll("[data-st]").forEach((b) => b.addEventListener("click", () => { S.draft.st = b.dataset.st; panel.querySelectorAll("[data-st]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); sync(); }));
          $$("#pe-sz").addEventListener("input", (e) => { S.draft.f = e.target.value / 1000; e.target.nextElementSibling.textContent = e.target.value; sync(); });
          $$("#pe-tok").addEventListener("click", () => {
            if (!editing) {
              if (!S.draft.s.trim()) return $$("#pe-tin").focus();
              if (S.texts.length >= 6) return toast(t("pe_maxTexts"));
              S.texts.push({ id: nextId++, ...S.draft, s: S.draft.s.slice(0, 80), x: 50, y: 40 });
            } else { const x = S.texts.find((y) => y.id === S.sel); if (x && !x.s.trim()) S.texts = S.texts.filter((y) => y !== x); }
            S.sel = null; S.draft = { s: "", c: S.draft.c, st: S.draft.st, f: S.draft.f }; showTool("text");
          });
          $$("#pe-tdel")?.addEventListener("click", () => { S.texts = S.texts.filter((x) => x.id !== S.sel); S.sel = null; S.draft = { s: "", c: "#ffffff", st: "boxed", f: 0.07 }; showTool("text"); });
        }
        drawTexts();
      }
      wrap.querySelectorAll("[data-tool]").forEach((b) => b.addEventListener("click", () => {
        if (b.dataset.tool === "text") { S.sel = null; S.draft = { s: "", c: S.draft.c, st: S.draft.st, f: S.draft.f }; }
        showTool(b.dataset.tool);
      }));
      showTool(S.tool);
    });
  }

  window.PostEditor = { open, decorate, clean, textsHtml };
})();
