/* Loom & Bloom — on-device "AI" engine.
   Everything here runs in the browser with no server:
   - understand(text): pulls garment, fabric, colours, style, occasion, budget, quantity, deadline
     out of free text or a speech transcript in any supported language.
   - understandMaker(text): same, plus the weaver's price, days needed and monthly capacity.
   - rank(listings, intent): scores and explains matches.
   - paletteFromImage(img): reads the main colours of a photo.
   - draft(listing, lang): writes collection name, maker story, WhatsApp caption and shop pitch
     in the requested language from the structured attributes.
   To swap in a hosted language model later, keep these function signatures and call a backend. */

const AI = (() => {
  const LANGS_WITH_TEMPLATES = ["en", "hi", "kn", "ta", "te", "bn", "mr"];

  /* ---------- text helpers ---------- */
  function normalise(text) {
    let out = String(text || "");
    for (const map of DIGIT_MAPS) {
      for (let i = 0; i < 10; i++) out = out.split(map[i]).join(String(i));
    }
    return out.replace(/[“”"]/g, " ").replace(/\s+/g, " ").trim();
  }

  const isAscii = (s) => /^[\x00-\x7F]+$/.test(s);
  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  function termIndex(lower, term) {
    const t = term.toLowerCase();
    if (isAscii(t)) {
      const re = new RegExp(`(^|[^a-z])${escapeRe(t)}(s|es)?(?![a-z])`, "i");
      const m = re.exec(lower);
      return m ? m.index + m[1].length : -1;
    }
    return lower.indexOf(t);
  }

  function termsFor(entry) {
    const terms = [];
    for (const [k, v] of Object.entries(entry)) {
      if (k === "hex") continue;
      if (Array.isArray(v)) terms.push(...v); else terms.push(v);
    }
    return terms.filter(Boolean);
  }

  /* Returns concept keys of a group found in the text, ordered by where they appear.
     Overlapping matches resolve longest-first, so Hindi "नीली" (blue) is not also read as "नील" (indigo). */
  function findConcepts(text, group) {
    const lower = text.toLowerCase();
    const matches = [];
    for (const [key, entry] of Object.entries(LEX[group])) {
      for (const term of termsFor(entry)) {
        const t = term.toLowerCase();
        let from = 0;
        while (from < lower.length) {
          const i = termIndex(lower.slice(from), t);
          if (i < 0) break;
          matches.push({ key, start: from + i, end: from + i + t.length });
          from += i + t.length;
        }
      }
    }
    matches.sort((a, b) => (b.end - b.start) - (a.end - a.start));
    const taken = [];
    const seen = new Map();
    for (const m of matches) {
      // A shorter term inside a longer accepted one (or starting at the same place) is ignored.
      if (taken.some((t) => m.start < t.end && m.end > t.start)) continue;
      taken.push(m);
      if (!seen.has(m.key) || m.start < seen.get(m.key)) seen.set(m.key, m.start);
    }
    return [...seen.entries()].sort((a, b) => a[1] - b[1]).map(([k]) => k);
  }

  function word(group, key, lang) {
    const entry = LEX[group] && LEX[group][key];
    if (!entry) return key;
    return entry[lang] || entry.en;
  }

  /* ---------- numbers, money, quantities, dates ---------- */
  function numbersIn(text) {
    const found = [];
    const re = /(\d{1,3}(?:,\d{2,3})+|\d+(?:\.\d+)?)\s*(k|thousand|हज़ार|हजार|ಸಾವಿರ|ஆயிரம்|వేల|వేలు|হাজার|lakh|lac|लाख)?/gi;
    let m;
    while ((m = re.exec(text))) {
      let n = parseFloat(m[1].replace(/,/g, ""));
      const mult = (m[2] || "").toLowerCase();
      if (mult === "k" || mult === "thousand" || /हज़ार|हजार|ಸಾವಿರ|ஆயிரம்|వేల|వేలు|হাজার/.test(mult)) n *= 1000;
      if (/lakh|lac|लाख/.test(mult)) n *= 100000;
      found.push({ n, start: m.index, end: m.index + m[0].length });
    }
    return found;
  }

  function near(text, start, end, words, before = 22, after = 16) {
    const win = text.slice(Math.max(0, start - before), Math.min(text.length, end + after)).toLowerCase();
    return words.some((w) => termIndex(win, w) >= 0);
  }
  const touchesAfter = (text, end, words) => near(text, end, end, words, 0, 14);

  const MONEY_BEFORE = ["₹", "rs", "rs.", "inr", "under", "below", "upto", "up to", "max", "budget", "price", "around", "दाम", "कीमत", "बजट", "ಬೆಲೆ", "விலை", "ధర", "দাম", "किंमत"];
  const MONEY_AFTER = UNIT_WORDS.money.slice(0, 22);

  /* Index of the closest of `words` that starts right after `end` (within `span` chars), or Infinity. */
  function firstAfter(text, end, words, span = 14) {
    const win = text.slice(end, end + span).toLowerCase();
    let best = Infinity;
    for (const w of words) {
      const i = termIndex(win, w);
      if (i >= 0 && i < best) best = i;
    }
    return best;
  }

  function classifyNumbers(text) {
    const out = { money: [], days: [], weeks: [], pieces: [], month: [], bare: [] };
    const garmentWords = Object.values(LEX.garment).flatMap(termsFor);
    let prevEnd = 0;
    for (const num of numbersIn(text)) {
      const lookBack = text.slice(Math.max(prevEnd, num.start - 12), num.start);
      prevEnd = num.end;
      if (isDateNumber(text, num)) continue;
      // Nearest unit word after the number wins ("50 pcs in 3 weeks": 50 -> pcs, 3 -> weeks).
      const after = {
        money: firstAfter(text, num.end, MONEY_AFTER),
        weeks: firstAfter(text, num.end, UNIT_WORDS.weeks),
        days: firstAfter(text, num.end, UNIT_WORDS.days),
        month: firstAfter(text, num.end, UNIT_WORDS.month),
        pieces: Math.min(firstAfter(text, num.end, UNIT_WORDS.pieces), firstAfter(text, num.end, garmentWords))
      };
      const [unit, dist] = Object.entries(after).sort((a, b) => a[1] - b[1])[0];
      const lb = lookBack.toLowerCase();
      const moneyBefore = MONEY_BEFORE.some((w) => termIndex(lb, w) >= 0);
      const monthBefore = UNIT_WORDS.month.some((w) => termIndex(lb, w) >= 0);
      if (moneyBefore && !(dist <= 2 && unit !== "money")) out.money.push(num.n);
      else if (dist !== Infinity && !(unit === "pieces" && monthBefore)) out[unit].push(num.n);
      else if (monthBefore) out.month.push(num.n);
      else out.bare.push(num.n);
    }
    return out;
  }

  function isDateNumber(text, num) {
    const after = text.slice(num.end, num.end + 6).toLowerCase().trim();
    const before = text.slice(Math.max(0, num.start - 6), num.start).toLowerCase().trim();
    if (MONTHS.some((m) => after.startsWith(m) || before.endsWith(m) || before.endsWith(m + "."))) return true;
    if (/^(st|nd|rd|th)\b/.test(after)) return true;
    if (/^[\/\-]\d/.test(text.slice(num.end, num.end + 2))) return true;
    if (/\d[\/\-]$/.test(text.slice(Math.max(0, num.start - 2), num.start))) return true;
    return false;
  }

  function addDays(n) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + Math.round(n));
    return d;
  }

  function parseDeadline(text) {
    const lower = text.toLowerCase();
    const today = new Date();
    // 20 Dec / Dec 20 / 20th December
    let m = lower.match(/(\d{1,2})(?:st|nd|rd|th)?\s*(?:of\s*)?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?(?:\s*(\d{4}))?/) ||
            lower.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(\d{4}))?/);
    if (m) {
      const dayFirst = /\d/.test(m[1]);
      const day = +(dayFirst ? m[1] : m[2]);
      const mon = MONTHS.indexOf(dayFirst ? m[2] : m[1]);
      let year = m[3] ? +m[3] : today.getFullYear();
      let d = new Date(year, mon, day, 12);
      if (!m[3] && d < today) d = new Date(year + 1, mon, day, 12);
      return d;
    }
    m = lower.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/);
    if (m) {
      let year = m[3] ? (+m[3] < 100 ? 2000 + +m[3] : +m[3]) : today.getFullYear();
      let d = new Date(year, +m[2] - 1, +m[1], 12);
      if (!m[3] && d < today) d = new Date(year + 1, +m[2] - 1, +m[1], 12);
      if (!isNaN(d)) return d;
    }
    for (const f of FESTIVALS) {
      if (f.names.some((n) => termIndex(lower, n) >= 0)) return new Date(f.date + "T12:00:00");
    }
    if (/next week|अगले हफ्ते|अगले हफ़्ते/.test(lower)) return addDays(7);
    if (/next month|अगले महीने|ಮುಂದಿನ ತಿಂಗಳು|அடுத்த மாதம்|వచ్చే నెల|পরের মাসে|पुढच्या महिन्यात/.test(lower)) return addDays(30);
    if (/urgent|asap|turant|तुरंत|जल्दी/.test(lower)) return addDays(7);
    return null;
  }

  function quantityFromWords(lower) {
    if (/\b(single|one|1)\s*(piece|pc|saree|kurta|dupatta|stole)\b|just one|for myself|एक पीस|एक साड़ी|ಒಂದು ಸೀರೆ|ஒரு புடவை|ఒక చీర|একটি শাড়ি|एक साडी/.test(lower)) return 1;
    if (/\bdozen\b|दर्जन/.test(lower)) return 12;
    return null;
  }

  /* ---------- buyer understanding ---------- */
  function understand(raw) {
    const text = normalise(raw);
    const lower = text.toLowerCase();
    const nums = classifyNumbers(text);
    const garments = findConcepts(text, "garment");
    const fabrics = findConcepts(text, "fabric");
    const intent = {
      raw: text,
      garment: garments[0] || null,
      fabric: fabrics[0] || null,
      colours: findConcepts(text, "colour"),
      styles: findConcepts(text, "style"),
      occasion: findConcepts(text, "occasion")[0] || null,
      budget: null,
      quantity: quantityFromWords(lower),
      deadline: parseDeadline(text)
    };
    // "gold" mentioned together with zari is the border, but still a colour cue — keep both.
    if (nums.money.length) intent.budget = Math.max(...nums.money);
    if (nums.pieces.length) intent.quantity = nums.pieces[0];
    if (!intent.deadline && nums.weeks.length) intent.deadline = addDays(nums.weeks[0] * 7);
    if (!intent.deadline && nums.days.length) intent.deadline = addDays(nums.days[0]);
    // Bare numbers: big ones are money, small ones are quantity.
    for (const n of nums.bare) {
      if (!intent.budget && n >= 300) intent.budget = n;
      else if (!intent.quantity && n > 0 && n < 300) intent.quantity = n;
    }
    return intent;
  }

  function intentIsEmpty(i) {
    return !i.garment && !i.fabric && !i.colours.length && !i.styles.length && !i.occasion && !i.budget && !i.quantity && !i.deadline;
  }

  /* ---------- weaver understanding ---------- */
  function understandMaker(raw) {
    const base = understand(raw);
    const text = base.raw;
    const nums = classifyNumbers(text);
    const maker = {
      garment: base.garment,
      fabric: base.fabric,
      colours: base.colours,
      styles: base.styles,
      occasion: base.occasion,
      price: nums.money.length ? nums.money[0] : (nums.bare.find((n) => n >= 300) || null),
      leadDays: nums.days.length ? nums.days[0] : (nums.weeks.length ? nums.weeks[0] * 7 : null),
      capacity: nums.month.length ? nums.month[0] : null,
      minQty: null
    };
    const minMatch = text.toLowerCase().match(/(?:minimum|min\.?|at least|कम से कम|ಕನಿಷ್ಠ|குறைந்தது|కనీసం|কমপক্ষে|किमान)\s*(\d+)/);
    if (minMatch) maker.minQty = +minMatch[1];
    else if (nums.pieces.length) maker.minQty = Math.min(...nums.pieces);
    return maker;
  }

  /* ---------- colour science (sRGB -> CIELAB, ΔE76) ---------- */
  function hexToRgb(hex) {
    const h = hex.replace("#", "");
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  }
  function rgbToLab([r, g, b]) {
    const lin = (c) => { c /= 255; return c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92; };
    const [R, G, B] = [lin(r), lin(g), lin(b)];
    const x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
    const y = (R * 0.2126 + G * 0.7152 + B * 0.0722);
    const z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
    const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
    return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
  }
  const LAB = Object.fromEntries(Object.entries(LEX.colour).map(([k, v]) => [k, rgbToLab(hexToRgb(v.hex))]));
  function deltaE(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); }
  function colourCloseness(a, b) {
    if (a === b) return 1;
    const d = deltaE(LAB[a], LAB[b]);
    if (d < 22) return 0.75;
    if (d < 38) return 0.4;
    return 0;
  }
  function nearestColour(rgb) {
    const lab = rgbToLab(rgb);
    let best = null; let bestD = Infinity;
    for (const [k, l] of Object.entries(LAB)) {
      const d = deltaE(lab, l);
      if (d < bestD) { bestD = d; best = k; }
    }
    return best;
  }

  /* Reads the dominant named colours of an image (centre-weighted, skips the backdrop edges). */
  function paletteFromImage(img) {
    const size = 72;
    const c = document.createElement("canvas");
    c.width = size; c.height = size;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    // Accepts an <img>/<canvas>, or a drawable {img, sx, sy, sw, sh} from Art.loadDrawable.
    if (img && img.img) ctx.drawImage(img.img, img.sx, img.sy, img.sw, img.sh, 0, 0, size, size);
    else ctx.drawImage(img, 0, 0, size, size);
    let data;
    try { data = ctx.getImageData(0, 0, size, size).data; } catch { return []; }
    const tally = {};
    let total = 0;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = (x - size / 2) / (size / 2), dy = (y - size / 2) / (size / 2);
        const w = Math.max(0, 1 - (dx * dx + dy * dy) * 0.85);
        if (w <= 0.05) continue;
        const i = (y * size + x) * 4;
        const name = nearestColour([data[i], data[i + 1], data[i + 2]]);
        tally[name] = (tally[name] || 0) + w;
        total += w;
      }
    }
    return Object.entries(tally)
      .map(([k, v]) => ({ key: k, share: v / total }))
      .sort((a, b) => b.share - a.share)
      .filter((c, i) => c.share > 0.07 || i === 0)
      .slice(0, 3);
  }

  /* ---------- ranking ---------- */
  function daysUntil(date) {
    return Math.ceil((new Date(date) - new Date()) / 86400000);
  }

  function scoreListing(l, intent, lang) {
    const reasons = [];
    let got = 0, max = 0;
    const add = (weight, frac, label) => {
      max += weight; got += weight * frac;
      reasons.push({ ok: frac >= 0.99 ? "yes" : frac > 0 ? "near" : "no", label });
    };
    if (intent.garment) add(26, l.garment === intent.garment ? 1 : 0, word("garment", intent.garment, lang));
    if (intent.fabric) {
      const close = l.fabric === intent.fabric ? 1 : (["silk", "silkcotton", "tussar"].includes(l.fabric) && ["silk", "silkcotton", "tussar"].includes(intent.fabric)) ? 0.5 : 0;
      add(18, close, word("fabric", intent.fabric, lang));
    }
    for (const c of intent.colours.slice(0, 3)) {
      const best = Math.max(0, ...l.colours.map((lc) => colourCloseness(c, lc)));
      add(16, best, word("colour", c, lang));
    }
    for (const s of intent.styles.slice(0, 3)) add(10, l.styles.includes(s) ? 1 : 0, word("style", s, lang));
    if (intent.occasion) add(6, l.occasion === intent.occasion ? 1 : 0, word("occasion", intent.occasion, lang));
    if (intent.budget) {
      const frac = l.price <= intent.budget ? 1 : l.price <= intent.budget * 1.15 ? 0.5 : 0;
      add(12, frac, `₹${l.price.toLocaleString("en-IN")} ≤ ₹${intent.budget.toLocaleString("en-IN")}`);
    }
    if (intent.quantity) {
      const q = intent.quantity;
      const frac = q >= l.minQty ? (l.capacity && q > l.capacity * 2 ? 0.5 : 1) : q >= l.trialQty ? 0.8 : 0.5;
      add(6, frac, `${q} ${I18N.t("pieces", lang)}`);
    }
    if (intent.deadline) {
      const left = daysUntil(intent.deadline);
      add(8, left >= l.leadDays ? 1 : left >= l.leadDays * 0.7 ? 0.4 : 0, `${I18N.t("ready_in", lang)} ${l.leadDays} ${I18N.t("days", lang)}`);
    }
    let score;
    if (max === 0) {
      // Nothing structured understood: fall back to plain word overlap.
      const words = intent.raw.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
      const hay = [l.title, l.brand, l.transcript || ""].join(" ").toLowerCase();
      const hits = words.filter((w) => hay.includes(w)).length;
      score = words.length ? Math.round((hits / words.length) * 80) : 50;
    } else {
      score = (got / max) * 100;
    }
    // Small, visible nudges: complete design cards and active boosts rank slightly higher.
    score += completeness(l).pct / 50;
    if (l.boosted) score += 3;
    return { score: Math.max(0, Math.min(99, Math.round(score))), reasons };
  }

  function rank(listings, intent, lang) {
    return listings
      .map((l) => ({ listing: l, ...scoreListing(l, intent, lang) }))
      .sort((a, b) => b.score - a.score);
  }

  /* ---------- design card completeness & trust ---------- */
  function completeness(l) {
    const checks = [
      ["photo", !!l.image],
      ["garment", !!l.garment],
      ["fabric", !!l.fabric],
      ["colours", l.colours && l.colours.length > 0],
      ["style", l.styles && l.styles.length > 0],
      ["price", !!l.price],
      ["lead_time", !!l.leadDays],
      ["maker_story", !!(l.transcript || l.story)],
      ["min_order", !!l.minQty]
    ];
    const done = checks.filter((c) => c[1]).length;
    return { pct: Math.round((done / checks.length) * 100), missing: checks.filter((c) => !c[1]).map((c) => c[0]) };
  }

  /* ---------- drafting in any template language ---------- */
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  function draft(l, lang, brandOverride) {
    const L = LANGS_WITH_TEMPLATES.includes(lang) ? lang : "en";
    const brand = brandOverride || l.brand;
    const g = word("garment", l.garment || "saree", L);
    const f = l.fabric ? word("fabric", l.fabric, L) : "";
    const cols = (l.colours || []).slice(0, 3).map((c) => word("colour", c, L));
    const and = WORDS.and[L];
    const colourText = cols.length > 1 ? `${cols.slice(0, -1).join(", ")} ${and} ${cols.at(-1)}` : (cols[0] || "");
    const sty = (l.styles || []).slice(0, 2).map((s) => word("style", s, L));
    const styleText = sty.join(", ");
    const signature = sty[0] || "";
    const price = l.price ? l.price.toLocaleString("en-IN") : "—";
    const lead = l.leadDays || "—";
    const trial = l.trialQty || 3;
    const minQty = l.minQty || 10;
    const c1 = cols[0] || "", c2 = cols[1] || "";

    const name = L === "en"
      ? [cap(c1) + (c2 ? ` & ${cap(c2)}` : ""), signature.split(" ").map(cap).join(" "), cap(g)].filter(Boolean).join(" ")
      : [c1 + (c2 ? `–${c2}` : ""), signature, g].filter(Boolean).join(" ");

    const T = {
      en: {
        story: `Woven by hand at ${brand}. This ${[f, g].filter(Boolean).join(" ")} carries ${colourText}${styleText ? `, finished with ${styleText}` : ""}. Each piece spends days on the loom, so no two are exactly alike.`,
        whatsapp: `🧵 New from ${brand}: ${name}\n${[cap(f), colourText].filter(Boolean).join(" · ")}\n₹${price} per piece · ready in ${lead} days\nTry ${trial} pieces first. Reply SAMPLE 🙏`,
        pitch: `${name} by ${brand}. Handwoven ${[f, g].filter(Boolean).join(" ")}, ₹${price} a piece, minimum order ${minQty}. Not sure yet? Start with a trial batch of ${trial} and restock when it sells.`
      },
      hi: {
        story: `${brand} में हाथ से बुनी गई। यह ${[f, g].filter(Boolean).join(" ")} ${colourText} रंगों में है${styleText ? `, ${styleText} के साथ` : ""}। हर पीस करघे पर कई दिन लेता है, इसलिए हर एक अनोखा है।`,
        whatsapp: `🧵 ${brand} से नया: ${name}\n${[f, colourText].filter(Boolean).join(" · ")}\n₹${price} प्रति पीस · ${lead} दिन में तैयार\nपहले ${trial} पीस आज़माएँ। SAMPLE लिखें 🙏`,
        pitch: `${brand} का ${name}। हाथ से बुनी ${[f, g].filter(Boolean).join(" ")}, ₹${price} प्रति पीस, न्यूनतम ऑर्डर ${minQty}। पहले ${trial} पीस का ट्रायल बैच लें, बिके तो और मँगाएँ।`
      },
      kn: {
        story: `${brand} ನಲ್ಲಿ ಕೈಯಿಂದ ನೇಯ್ದದ್ದು. ಈ ${[f, g].filter(Boolean).join(" ")} ${colourText} ಬಣ್ಣಗಳಲ್ಲಿದೆ${styleText ? `, ${styleText} ಜೊತೆಗೆ` : ""}. ಪ್ರತಿ ತುಂಡು ಮಗ್ಗದ ಮೇಲೆ ಹಲವು ದಿನ ತೆಗೆದುಕೊಳ್ಳುತ್ತದೆ, ಹಾಗಾಗಿ ಪ್ರತಿಯೊಂದೂ ವಿಶಿಷ್ಟ.`,
        whatsapp: `🧵 ${brand} ಇಂದ ಹೊಸದು: ${name}\n${[f, colourText].filter(Boolean).join(" · ")}\nಪ್ರತಿ ತುಂಡು ₹${price} · ${lead} ದಿನಗಳಲ್ಲಿ ಸಿದ್ಧ\nಮೊದಲು ${trial} ತುಂಡು ಪ್ರಯತ್ನಿಸಿ. SAMPLE ಎಂದು ಉತ್ತರಿಸಿ 🙏`,
        pitch: `${brand} ಅವರ ${name}. ಕೈಮಗ್ಗದ ${[f, g].filter(Boolean).join(" ")}, ಪ್ರತಿ ತುಂಡು ₹${price}, ಕನಿಷ್ಠ ಆರ್ಡರ್ ${minQty}. ಮೊದಲು ${trial} ತುಂಡುಗಳ ಪ್ರಯೋಗ ಬ್ಯಾಚ್ ತೆಗೆದುಕೊಳ್ಳಿ, ಮಾರಾಟವಾದರೆ ಮತ್ತೆ ತರಿಸಿ.`
      },
      ta: {
        story: `${brand} இல் கையால் நெய்யப்பட்டது. இந்த ${[f, g].filter(Boolean).join(" ")} ${colourText} நிறங்களில் உள்ளது${styleText ? `, ${styleText} உடன்` : ""}. ஒவ்வொன்றும் தறியில் பல நாட்கள் எடுக்கும், எனவே ஒவ்வொன்றும் தனித்துவமானது.`,
        whatsapp: `🧵 ${brand} இலிருந்து புதியது: ${name}\n${[f, colourText].filter(Boolean).join(" · ")}\nஒன்றுக்கு ₹${price} · ${lead} நாட்களில் தயார்\nமுதலில் ${trial} துண்டுகளை முயற்சிக்கவும். SAMPLE என்று பதில் அனுப்புங்கள் 🙏`,
        pitch: `${brand} வழங்கும் ${name}. கைத்தறி ${[f, g].filter(Boolean).join(" ")}, ஒன்றுக்கு ₹${price}, குறைந்தபட்ச ஆர்டர் ${minQty}. முதலில் ${trial} துண்டுகளின் சோதனைத் தொகுப்பு வாங்குங்கள்.`
      },
      te: {
        story: `${brand} లో చేతితో నేసినది. ఈ ${[f, g].filter(Boolean).join(" ")} ${colourText} రంగులలో ఉంది${styleText ? `, ${styleText} తో` : ""}. ప్రతి ముక్క మగ్గంపై ఎన్నో రోజులు తీసుకుంటుంది, అందుకే ప్రతిదీ ప్రత్యేకం.`,
        whatsapp: `🧵 ${brand} నుండి కొత్తది: ${name}\n${[f, colourText].filter(Boolean).join(" · ")}\nఒక్కదానికి ₹${price} · ${lead} రోజుల్లో సిద్ధం\nముందు ${trial} ముక్కలు ప్రయత్నించండి. SAMPLE అని జవాబివ్వండి 🙏`,
        pitch: `${brand} వారి ${name}. చేనేత ${[f, g].filter(Boolean).join(" ")}, ఒక్కదానికి ₹${price}, కనీస ఆర్డర్ ${minQty}. ముందు ${trial} ముక్కల ట్రయల్ బ్యాచ్ తీసుకోండి.`
      },
      bn: {
        story: `${brand}-এ হাতে বোনা। এই ${[f, g].filter(Boolean).join(" ")} ${colourText} রঙে${styleText ? `, ${styleText} সহ` : ""}। প্রতিটি পিস তাঁতে অনেক দিন নেয়, তাই প্রতিটি অনন্য।`,
        whatsapp: `🧵 ${brand} থেকে নতুন: ${name}\n${[f, colourText].filter(Boolean).join(" · ")}\nপ্রতি পিস ₹${price} · ${lead} দিনে তৈরি\nআগে ${trial}টি চেষ্টা করুন। SAMPLE লিখে উত্তর দিন 🙏`,
        pitch: `${brand}-এর ${name}। হাতে বোনা ${[f, g].filter(Boolean).join(" ")}, প্রতি পিস ₹${price}, ন্যূনতম অর্ডার ${minQty}। আগে ${trial}টির ট্রায়াল ব্যাচ নিন।`
      },
      mr: {
        story: `${brand} येथे हाताने विणलेली. ही ${[f, g].filter(Boolean).join(" ")} ${colourText} रंगात आहे${styleText ? `, ${styleText} सह` : ""}. प्रत्येक नग मागावर अनेक दिवस घेतो, म्हणून प्रत्येक वेगळा आहे.`,
        whatsapp: `🧵 ${brand} कडून नवीन: ${name}\n${[f, colourText].filter(Boolean).join(" · ")}\nप्रति नग ₹${price} · ${lead} दिवसांत तयार\nआधी ${trial} नग वापरून पहा. SAMPLE असे उत्तर द्या 🙏`,
        pitch: `${brand} चा ${name}. हातमागावरील ${[f, g].filter(Boolean).join(" ")}, प्रति नग ₹${price}, किमान ऑर्डर ${minQty}. आधी ${trial} नगांची ट्रायल बॅच घ्या.`
      }
    }[L];
    return { lang: L, name, ...T };
  }

  return {
    understand, understandMaker, intentIsEmpty, rank, scoreListing, paletteFromImage,
    nearestColour, completeness, draft, word, daysUntil, normalise, hexToRgb
  };
})();

if (typeof module !== "undefined") module.exports = { AI };
