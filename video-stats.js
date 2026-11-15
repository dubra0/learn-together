/* =====================================================================
   📊 Video info: live numbers about the camera, to find why video looks blurry.
   Shows what this phone captures and sends, and what it receives from others.
   Uses globals from app.js: lk, cam, $, esc.
   ===================================================================== */
"use strict";
let vsTimer = 0;
const VS_REASON = { none: "✅ none", cpu: "⚠️ PHONE TOO SLOW (cpu)", bandwidth: "⚠️ INTERNET (bandwidth)", other: "⚠️ other" };

async function readVideoStats() {
  const out = { send: null, layers: [], recv: [] };
  if (!lk) return out;
  // ---- what I capture and send ----
  const pub = lk.localParticipant.getTrackPublication?.(LivekitClient.Track.Source.Camera);
  const lt = pub?.track;
  if (lt) {
    const st = lt.mediaStreamTrack?.getSettings?.() || {};
    out.send = { capture: `${st.width || "?"}×${st.height || "?"} @ ${Math.round(st.frameRate || 0)}fps`, filter: !!cam?.filterId, codec: pub.mimeType || "?" };
    try {
      const rep = await lt.sender?.getStats();
      const codecs = {};
      rep?.forEach((s) => { if (s.type === "codec") codecs[s.id] = s.mimeType; });
      rep?.forEach((s) => {
        if (s.type === "outbound-rtp" && s.kind === "video") {
          out.layers.push({ rid: s.rid || "-", size: `${s.frameWidth || 0}×${s.frameHeight || 0}`, fps: Math.round(s.framesPerSecond || 0),
            reason: s.qualityLimitationReason || "none", codec: codecs[s.codecId] || "", encoder: s.encoderImplementation || "",
            bytes: s.bytesSent || 0, ts: s.timestamp, key: s.id, active: s.active !== false });
        }
      });
    } catch {}
  }
  // ---- what I receive from others ----
  for (const p of lk.remoteParticipants.values()) {
    const rp = p.getTrackPublication?.(LivekitClient.Track.Source.Camera);
    const rt = rp?.track;
    if (!rt) continue;
    const item = { name: p.name || p.identity.slice(0, 6), size: "?", fps: 0, codec: rp.mimeType || "", bytes: 0, ts: 0, key: "r" + p.identity, decoder: "" };
    try {
      const rep = await rt.receiver?.getStats();
      const codecs = {};
      rep?.forEach((s) => { if (s.type === "codec") codecs[s.id] = s.mimeType; });
      rep?.forEach((s) => {
        if (s.type === "inbound-rtp" && s.kind === "video") {
          item.size = `${s.frameWidth || 0}×${s.frameHeight || 0}`; item.fps = Math.round(s.framesPerSecond || 0);
          item.codec = codecs[s.codecId] || item.codec; item.bytes = s.bytesReceived || 0; item.ts = s.timestamp; item.decoder = s.decoderImplementation || "";
        }
      });
    } catch {}
    out.recv.push(item);
  }
  return out;
}

const vsPrev = new Map();
function vsRate(key, bytes, ts) {
  const p = vsPrev.get(key); vsPrev.set(key, { bytes, ts });
  if (!p || !ts || ts <= p.ts) return "…";
  return ((bytes - p.bytes) * 8 / ((ts - p.ts) / 1000) / 1e6).toFixed(2) + " Mbps";
}

function openVideoStats() {
  clearInterval(vsTimer);
  const paint = async () => {
    if ($("#sheet").hidden || !$("#vs-body")) { clearInterval(vsTimer); return; }
    const s = await readVideoStats();
    const rows = [];
    if (s.send) {
      rows.push(`<b>📤 My camera</b><br>Camera gives: <b>${esc(s.send.capture)}</b>${s.send.filter ? " · ✨ filter ON (heavier)" : ""}`);
      s.layers.sort((a, b) => parseInt(b.size) - parseInt(a.size)).forEach((l) => rows.push(
        `↑ ${esc(l.rid)}: <b>${esc(l.size)}</b> · ${l.fps} fps · ${vsRate(l.key, l.bytes, l.ts)} · ${esc((l.codec || "").replace("video/", ""))}${l.encoder ? " (" + esc(l.encoder) + ")" : ""}<br>&nbsp;&nbsp;limited by: <b>${esc(VS_REASON[l.reason] || l.reason)}</b>`));
    } else rows.push("📤 My camera is off.");
    rows.push("<hr>");
    if (s.recv.length) s.recv.forEach((r) => rows.push(
      `<b>📥 ${esc(r.name)}</b>: <b>${esc(r.size)}</b> · ${r.fps} fps · ${vsRate(r.key, r.bytes, r.ts)} · ${esc((r.codec || "").replace("video/", ""))}${r.decoder ? " (" + esc(r.decoder) + ")" : ""}`));
    else rows.push("📥 Nobody else has a camera on.");
    rows.push(`<hr><span class="muted small">Screen ${screen.width}×${screen.height} ×${devicePixelRatio} · ${esc(navigator.userAgent.slice(0, 120))}</span>`);
    const b = $("#vs-body"); if (b) b.innerHTML = rows.join("<br>");
  };
  openSheet(`<h1>📊 Video info</h1>
    <div class="muted small">Take a screenshot of this and send it. It updates every 2 seconds.</div>
    <div id="vs-body" dir="ltr" style="text-align:left;font-size:.85rem;line-height:1.55;font-variant-numeric:tabular-nums;margin-top:10px">…</div>
    <button type="button" class="btn block" id="vs-close" style="margin-top:12px">OK</button>`);
  $("#vs-close").addEventListener("click", closeSheet);
  paint(); vsTimer = setInterval(paint, 2000);
}
