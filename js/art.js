/* Visuals: procedural handloom garment art, listing images, the ad poster and the video ad.
   Uploaded/real photos are never repainted — ads place the photo as-is inside a frame. */

const Art = (() => {
  const hex = (k) => (LEX.colour[k] ? LEX.colour[k].hex : k);

  function shade(h, amt) {
    const [r, g, b] = AI.hexToRgb(h);
    const f = (c) => Math.max(0, Math.min(255, Math.round(c + amt * (amt > 0 ? 255 - c : c))));
    return `rgb(${f(r)},${f(g)},${f(b)})`;
  }

  /* ---------- procedural garment (used for demo listings without a photo) ---------- */
  function patternDefs(id, pattern, base, accent, accent2) {
    switch (pattern) {
      case "checks":
        return `<pattern id="${id}" width="44" height="44" patternUnits="userSpaceOnUse">
          <rect width="44" height="44" fill="${base}"/>
          <rect width="44" height="12" fill="${accent}" opacity=".85"/>
          <rect width="12" height="44" fill="${accent}" opacity=".85"/>
          <rect x="20" width="2" height="44" fill="${accent2}" opacity=".7"/>
          <rect y="20" width="44" height="2" fill="${accent2}" opacity=".7"/></pattern>`;
      case "stripes":
        return `<pattern id="${id}" width="34" height="10" patternUnits="userSpaceOnUse">
          <rect width="34" height="10" fill="${base}"/><rect width="8" height="10" fill="${accent}"/>
          <rect x="12" width="2" height="10" fill="${accent2}"/></pattern>`;
      case "ikat":
        return `<pattern id="${id}" width="60" height="70" patternUnits="userSpaceOnUse">
          <rect width="60" height="70" fill="${base}"/>
          <path d="M30 4 L52 35 L30 66 L8 35 Z" fill="none" stroke="${accent}" stroke-width="7" stroke-dasharray="9 3" opacity=".9"/>
          <path d="M30 22 L40 35 L30 48 L20 35 Z" fill="${accent2}" opacity=".85"/>
          <path d="M0 0 L8 10 M60 0 L52 10 M0 70 L8 60 M60 70 L52 60" stroke="${accent}" stroke-width="5" opacity=".8"/></pattern>`;
      case "buta":
        return `<pattern id="${id}" width="46" height="52" patternUnits="userSpaceOnUse">
          <rect width="46" height="52" fill="${base}"/>
          <path d="M14 10 c6 0 9 6 6 11 c-2 4 -8 4 -8 0 c0 -3 4 -3 4 -1" fill="none" stroke="${accent}" stroke-width="2.4"/>
          <circle cx="36" cy="38" r="3.2" fill="${accent}"/><circle cx="36" cy="38" r="1.2" fill="${base}"/></pattern>`;
      case "floral":
        return `<pattern id="${id}" width="56" height="56" patternUnits="userSpaceOnUse">
          <rect width="56" height="56" fill="${base}"/>
          <g fill="${accent}" transform="translate(16 16)">${[0, 60, 120, 180, 240, 300].map((a) => `<ellipse rx="4.2" ry="8" transform="rotate(${a}) translate(0 -7)"/>`).join("")}<circle r="3.4" fill="${accent2}"/></g>
          <g fill="${accent}" opacity=".8" transform="translate(44 44) scale(.6)">${[0, 72, 144, 216, 288].map((a) => `<ellipse rx="4" ry="8" transform="rotate(${a}) translate(0 -7)"/>`).join("")}</g>
          <path d="M22 30 q8 6 18 6" stroke="${accent}" stroke-width="1.6" fill="none" opacity=".7"/></pattern>`;
      case "kalamkari":
        return `<pattern id="${id}" width="70" height="70" patternUnits="userSpaceOnUse">
          <rect width="70" height="70" fill="${base}"/>
          <path d="M10 60 q15 -40 50 -50 M20 58 q10 -20 30 -30" stroke="${accent}" stroke-width="2.5" fill="none"/>
          <circle cx="58" cy="12" r="6" fill="none" stroke="${accent2}" stroke-width="2"/><path d="M30 40 l6 -6 l6 6 l-6 6 z" fill="${accent2}"/></pattern>`;
      default:
        return `<pattern id="${id}" width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="${base}"/><rect width="8" height="1" fill="${shade(base, -.12)}" opacity=".6"/>
          <rect width="1" height="8" fill="${shade(base, .12)}" opacity=".5"/></pattern>`;
    }
  }

  function patternFor(l) {
    const order = ["checks", "ikat", "stripes", "kalamkari", "floral", "blockprint", "buta", "jamdani"];
    const s = order.find((p) => (l.styles || []).includes(p));
    if (s === "blockprint") return "floral";
    if (s === "jamdani") return "buta";
    return s || "plain";
  }

  function garmentSVG(l) {
    const cols = (l.colours || ["cream"]).map(hex);
    const base = cols[0];
    const accent = cols[1] || shade(base, -.35);
    const accent2 = cols[2] || ((l.styles || []).includes("zari") ? hex("gold") : shade(accent, .35));
    const borderCol = (l.styles || []).includes("zari") || (l.styles || []).includes("temple") || (l.colours || []).includes("gold") ? hex("gold") : accent;
    const pattern = patternFor(l);
    const uid = "g" + Math.random().toString(36).slice(2, 8);
    const defs = `
      <linearGradient id="${uid}wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3e7d6"/><stop offset="1" stop-color="#e2cdb2"/></linearGradient>
      <linearGradient id="${uid}fold" x1="0" x2="1">
        ${[0, .12, .2, .34, .45, .58, .68, .8, .9, 1].map((o, i) => `<stop offset="${o}" stop-color="${i % 2 ? "#fff" : "#000"}" stop-opacity="${i % 2 ? .12 : .2}"/>`).join("")}
      </linearGradient>
      <pattern id="${uid}weave" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#000" opacity=".06"/><rect width="1" height="4" fill="#fff" opacity=".05"/></pattern>
      <pattern id="${uid}border" width="18" height="40" patternUnits="userSpaceOnUse"><rect width="18" height="40" fill="${borderCol}"/><path d="M0 40 L9 24 L18 40 Z" fill="${shade(borderCol, -.25)}"/><rect y="6" width="18" height="2" fill="${shade(borderCol, .3)}"/></pattern>
      ${patternDefs(uid + "p", pattern, base, accent, accent2)}
      <filter id="${uid}sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="14" stdDeviation="14" flood-color="#3b2416" flood-opacity=".28"/></filter>`;
    let body;
    if (l.garment === "kurta") {
      const path = "M230 150 Q300 175 370 150 L450 190 L500 330 L452 350 L420 260 L425 700 Q300 716 175 700 L180 260 L148 350 L100 330 L150 190 Z";
      body = `
        <path d="M300 92 q-14 0 -14 14 q0 10 14 16" stroke="#8a5a33" stroke-width="5" fill="none"/>
        <path d="M200 150 L300 112 L400 150" stroke="#8a5a33" stroke-width="7" fill="none" stroke-linecap="round"/>
        <g filter="url(#${uid}sh)"><path d="${path}" fill="url(#${uid}p)"/></g>
        <path d="${path}" fill="url(#${uid}weave)"/>
        <path d="${path}" fill="url(#${uid}fold)" opacity=".55"/>
        <path d="M270 158 Q300 200 330 158" fill="none" stroke="${borderCol}" stroke-width="6"/>
        <rect x="294" y="175" width="12" height="120" fill="${borderCol}" opacity=".9"/>
        <path d="M175 690 Q300 706 425 690 L425 700 Q300 716 175 700 Z" fill="${borderCol}"/>
        <rect x="175" y="664" width="250" height="28" fill="url(#${uid}border)" opacity=".9"/>`;
    } else {
      const wide = l.garment === "saree" || l.garment === "fabric" || l.garment === "dhoti";
      const x1 = wide ? 120 : 175, x2 = wide ? 480 : 425;
      const hem = l.garment === "fabric" ? 720 : 690;
      const bw = wide ? 34 : 22;
      const pallu = l.garment === "saree" ? `<rect x="${x1}" y="520" width="${x2 - x1}" height="${hem - 520}" fill="${accent}" opacity=".9"/>
        ${Array.from({ length: 6 }, (_, i) => `<rect x="${x1}" y="${535 + i * 24}" width="${x2 - x1}" height="${i % 2 ? 4 : 9}" fill="${borderCol}" opacity=".85"/>`).join("")}` : "";
      const tassels = (l.garment === "dupatta" || l.garment === "stole" || (l.styles || []).includes("tassels"))
        ? Array.from({ length: Math.floor((x2 - x1) / 22) }, (_, i) => `<path d="M${x1 + 11 + i * 22} ${hem} l0 26" stroke="${borderCol}" stroke-width="4"/><circle cx="${x1 + 11 + i * 22}" cy="${hem + 30}" r="5" fill="${borderCol}"/>`).join("")
        : "";
      body = `
        <rect x="${x1 - 40}" y="104" width="${x2 - x1 + 80}" height="14" rx="7" fill="#8a5a33"/>
        <circle cx="${x1 - 40}" cy="111" r="11" fill="#6f4426"/><circle cx="${x2 + 40}" cy="111" r="11" fill="#6f4426"/>
        <g filter="url(#${uid}sh)"><path d="M${x1} 116 L${x2} 116 L${x2} ${hem} Q${(x1 + x2) / 2} ${hem + 14} ${x1} ${hem} Z" fill="url(#${uid}p)"/></g>
        ${pallu}
        <rect x="${x1}" y="116" width="${bw}" height="${hem - 116}" fill="url(#${uid}border)"/>
        <rect x="${x2 - bw}" y="116" width="${bw}" height="${hem - 116}" fill="url(#${uid}border)"/>
        <path d="M${x1} 116 L${x2} 116 L${x2} ${hem} Q${(x1 + x2) / 2} ${hem + 14} ${x1} ${hem} Z" fill="url(#${uid}weave)"/>
        <path d="M${x1} 116 L${x2} 116 L${x2} ${hem} Q${(x1 + x2) / 2} ${hem + 14} ${x1} ${hem} Z" fill="url(#${uid}fold)"/>
        ${tassels}`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="600" height="800"><defs>${defs}</defs>
      <rect width="600" height="800" fill="url(#${uid}wall)"/>
      <rect y="742" width="600" height="58" fill="#d6bc9a"/><rect y="742" width="600" height="3" fill="#c4a682"/>
      <ellipse cx="300" cy="752" rx="200" ry="10" fill="#3b2416" opacity=".12"/>
      ${body}</svg>`;
  }

  function svgUrl(svg) { return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg); }

  /* Returns an element showing the listing's picture. */
  function imageEl(l, cls = "") {
    const img = l.image || { kind: "svg" };
    if (img.kind === "photo") {
      const d = document.createElement("div");
      d.className = `pic ${cls}`;
      d.setAttribute("role", "img");
      d.setAttribute("aria-label", l.title);
      d.style.backgroundImage = `url("${img.src}")`;
      d.style.backgroundSize = "300% 100%";
      d.style.backgroundPosition = `${img.crop * 50}% center`;
      return d;
    }
    const el = document.createElement("img");
    el.className = `pic ${cls}`;
    el.alt = l.title;
    el.src = img.kind === "upload" ? img.data : svgUrl(garmentSVG(l));
    return el;
  }

  /* Loads the listing's picture as a drawable image plus its source crop. */
  function loadDrawable(l) {
    return new Promise((resolve) => {
      const img = new Image();
      const kind = (l.image || {}).kind || "svg";
      img.onload = () => {
        if (kind === "photo") {
          const w = img.naturalWidth / 3;
          resolve({ img, sx: w * l.image.crop, sy: 0, sw: w, sh: img.naturalHeight });
        } else {
          resolve({ img, sx: 0, sy: 0, sw: img.naturalWidth || 600, sh: img.naturalHeight || 800 });
        }
      };
      img.onerror = () => resolve(null);
      img.src = kind === "photo" ? l.image.src : kind === "upload" ? l.image.data : svgUrl(garmentSVG(l));
    });
  }

  function drawCover(ctx, d, x, y, w, h, zoom = 1, panY = 0.5) {
    if (!d) { ctx.fillStyle = "#e7d6c0"; ctx.fillRect(x, y, w, h); return; }
    const r = Math.max(w / d.sw, h / d.sh) * zoom;
    const sw = w / r, sh = h / r;
    const sx = d.sx + (d.sw - sw) / 2;
    const sy = d.sy + (d.sh - sh) * panY;
    ctx.drawImage(d.img, sx, sy, sw, sh, x, y, w, h);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function wrap(ctx, text, maxW) {
    const words = String(text).split(" ");
    const lines = [];
    let line = "";
    for (const w of words) {
      const test = line ? line + " " + w : w;
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
    }
    if (line) lines.push(line);
    return lines;
  }

  const SERIF = "'Fraunces', Georgia, 'Nirmala UI', serif";
  const SANS = "'Inter', 'Nirmala UI', 'Noto Sans', system-ui, sans-serif";

  function loomMark(ctx, x, y, s, color = "#7a2a24") {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = color; ctx.lineWidth = s * 0.08;
    ctx.beginPath(); ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 8; i++) {
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(i * Math.PI / 4) * s * 0.42, Math.sin(i * Math.PI / 4) * s * 0.42); ctx.stroke();
    }
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, 0, s * 0.09, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  /* ---------- poster (1080 × 1350) ---------- */
  async function drawPoster(canvas, l, d, lang) {
    canvas.width = 1080; canvas.height = 1350;
    const ctx = canvas.getContext("2d");
    const pic = await loadDrawable(l);
    ctx.fillStyle = "#fbf7f0"; ctx.fillRect(0, 0, 1080, 1350);
    // woven edge
    for (let i = 0; i < 1080; i += 18) {
      ctx.fillStyle = i % 36 ? "#7a2a24" : "#c9a14a";
      ctx.fillRect(i, 0, 18, 14); ctx.fillRect(i, 1336, 18, 14);
    }
    loomMark(ctx, 92, 92, 64);
    ctx.fillStyle = "#2b1d17"; ctx.font = `600 40px ${SERIF}`; ctx.textBaseline = "middle";
    ctx.fillText(l.brand, 142, 92);
    ctx.fillStyle = "#7a2a24"; ctx.font = `600 22px ${SANS}`; ctx.textAlign = "right";
    ctx.fillText("✦ " + [l.fabric && AI.word("fabric", l.fabric, lang), AI.word("garment", l.garment || "saree", lang)].filter(Boolean).join(" "), 1010, 92);
    ctx.textAlign = "left";
    ctx.save(); roundRect(ctx, 70, 150, 940, 800, 28); ctx.clip();
    drawCover(ctx, pic, 70, 150, 940, 800, 1, 0.35);
    const g = ctx.createLinearGradient(0, 760, 0, 950); g.addColorStop(0, "rgba(20,10,6,0)"); g.addColorStop(1, "rgba(20,10,6,.55)");
    ctx.fillStyle = g; ctx.fillRect(70, 760, 940, 190);
    ctx.restore();
    // colour dots on the photo
    (l.colours || []).slice(0, 4).forEach((c, i) => {
      ctx.beginPath(); ctx.arc(120 + i * 62, 900, 22, 0, Math.PI * 2);
      ctx.fillStyle = hex(c); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = "#fff"; ctx.stroke();
    });
    ctx.fillStyle = "#2b1d17"; ctx.font = `500 62px ${SERIF}`; ctx.textBaseline = "alphabetic";
    const lines = wrap(ctx, d.name, 920).slice(0, 2);
    lines.forEach((ln, i) => ctx.fillText(ln, 70, 1035 + i * 70));
    const y = 1035 + lines.length * 70 + 10;
    const chips = [`₹${(l.price || 0).toLocaleString("en-IN")}`, `⏱ ${l.leadDays || "—"} ${I18N.t("days", lang)}`, `▣ ${I18N.t("min_order", lang)} ${l.minQty || "—"}`];
    ctx.font = `600 28px ${SANS}`;
    let cx = 70;
    for (const chip of chips) {
      const w = ctx.measureText(chip).width + 40;
      roundRect(ctx, cx, y, w, 56, 28); ctx.fillStyle = "#f1e5d3"; ctx.fill();
      ctx.fillStyle = "#2b1d17"; ctx.fillText(chip, cx + 20, y + 38);
      cx += w + 14;
    }
    const cta = I18N.t("request_sample", lang);
    ctx.font = `700 30px ${SANS}`;
    const cw = ctx.measureText(cta).width + 70;
    roundRect(ctx, 1010 - cw, 1230, cw, 72, 36); ctx.fillStyle = "#7a2a24"; ctx.fill();
    ctx.fillStyle = "#fff"; ctx.fillText(cta + " →", 1010 - cw + 30, 1276);
    ctx.fillStyle = "#7a6656"; ctx.font = `500 24px ${SANS}`;
    ctx.fillText(`${I18N.t("order_trial", lang)}: ${l.trialQty || 3} ${I18N.t("pieces", lang)}`, 70, 1276);
  }

  /* ---------- video ad (540 × 960, 9 s loop) ---------- */
  function videoAd(canvas, l, d, lang) {
    canvas.width = 540; canvas.height = 960;
    const ctx = canvas.getContext("2d");
    let pic = null, raf = 0, t0 = 0;
    const DURATION = 9000;
    const ready = loadDrawable(l).then((p) => { pic = p; frame(0); });
    const ease = (x) => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);

    function frame(ms) {
      const t = ms / 1000;
      ctx.clearRect(0, 0, 540, 960);
      if (t < 6) {
        const zoom = 1 + t * 0.03;
        drawCover(ctx, pic, 0, 0, 540, 960, zoom, 0.3 + t * 0.03);
        const g = ctx.createLinearGradient(0, 520, 0, 960);
        g.addColorStop(0, "rgba(20,10,6,0)"); g.addColorStop(1, "rgba(20,10,6,.78)");
        ctx.fillStyle = g; ctx.fillRect(0, 0, 540, 960);
        ctx.globalAlpha = ease(t / 0.8);
        loomMark(ctx, 48, 58, 40, "#fff");
        ctx.fillStyle = "#fff"; ctx.font = `600 26px ${SERIF}`; ctx.textBaseline = "middle";
        ctx.fillText(l.brand, 80, 58);
        ctx.textBaseline = "alphabetic";
        ctx.font = `500 44px ${SERIF}`;
        wrap(ctx, d.name, 470).slice(0, 2).forEach((ln, i) => ctx.fillText(ln, 36, 800 + i * 52 - ease((t - 0.3) / 1) * 20));
        ctx.globalAlpha = 1;
        if (t > 2.6) {
          // threads weaving across: one per colour
          const p = ease((t - 2.6) / 1.6);
          (l.colours || []).slice(0, 4).forEach((c, i) => {
            ctx.fillStyle = hex(c);
            ctx.fillRect(0, 640 + i * 16, 540 * p, 9);
            ctx.fillStyle = "rgba(255,255,255,.35)";
            for (let x = 0; x < 540 * p; x += 14) ctx.fillRect(x + (i % 2) * 7, 640 + i * 16, 6, 9);
          });
          ctx.globalAlpha = ease((t - 3.4) / 0.8);
          ctx.fillStyle = "#fff"; ctx.font = `600 22px ${SANS}`;
          const tag = [l.fabric && AI.word("fabric", l.fabric, lang), ...(l.styles || []).slice(0, 1).map((s) => AI.word("style", s, lang))].filter(Boolean).join(" · ");
          ctx.fillText("✦ " + tag, 36, 616);
          ctx.globalAlpha = 1;
        }
      } else {
        const p = ease((t - 6) / 0.7);
        ctx.fillStyle = "#fbf7f0"; ctx.fillRect(0, 0, 540, 960);
        ctx.save(); roundRect(ctx, 40, 60 + (1 - p) * 40, 460, 520, 22); ctx.clip();
        drawCover(ctx, pic, 40, 60, 460, 520, 1.05, 0.35); ctx.restore();
        ctx.globalAlpha = p;
        ctx.fillStyle = "#2b1d17"; ctx.font = `500 34px ${SERIF}`;
        wrap(ctx, d.name, 460).slice(0, 2).forEach((ln, i) => ctx.fillText(ln, 40, 640 + i * 42));
        ctx.font = `700 54px ${SANS}`; ctx.fillStyle = "#7a2a24";
        ctx.fillText(`₹${(l.price || 0).toLocaleString("en-IN")}`, 40, 760);
        ctx.font = `500 22px ${SANS}`; ctx.fillStyle = "#5c4a3e";
        ctx.fillText(`${I18N.t("per_piece", lang)} · ${I18N.t("ready_in", lang)} ${l.leadDays} ${I18N.t("days", lang)}`, 40, 796);
        const pulse = 1 + Math.sin(t * 6) * 0.03;
        ctx.save(); ctx.translate(270, 872); ctx.scale(pulse, pulse);
        roundRect(ctx, -220, -36, 440, 72, 36); ctx.fillStyle = "#7a2a24"; ctx.fill();
        ctx.fillStyle = "#fff"; ctx.font = `700 26px ${SANS}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(`${I18N.t("request_sample", lang)} · ${l.trialQty || 3}`, 0, 1);
        ctx.restore(); ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
        ctx.globalAlpha = 1;
      }
      // progress bar
      ctx.fillStyle = "rgba(255,255,255,.5)"; ctx.fillRect(0, 0, 540, 5);
      ctx.fillStyle = "#c9a14a"; ctx.fillRect(0, 0, 540 * (ms / DURATION), 5);
    }

    function loop(now) {
      const ms = (now - t0) % DURATION;
      frame(ms);
      raf = requestAnimationFrame(loop);
    }
    return {
      ready,
      play() { cancelAnimationFrame(raf); t0 = performance.now(); raf = requestAnimationFrame(loop); },
      stop() { cancelAnimationFrame(raf); },
      /* Records one full loop to a WebM file using the browser's MediaRecorder. */
      async record() {
        if (!canvas.captureStream || typeof MediaRecorder === "undefined") throw new Error("unsupported");
        const stream = canvas.captureStream(30);
        const mime = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find((m) => MediaRecorder.isTypeSupported(m)) || "";
        const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
        const chunks = [];
        rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
        const done = new Promise((r) => (rec.onstop = r));
        this.play(); rec.start();
        await new Promise((r) => setTimeout(r, DURATION));
        rec.stop(); await done;
        return new Blob(chunks, { type: "video/webm" });
      }
    };
  }

  return { garmentSVG, svgUrl, imageEl, loadDrawable, drawCover, drawPoster, videoAd, hex, roundRect };
})();
