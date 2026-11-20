/* Loom & Bloom — app shell, router and every screen. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const t = (k) => I18N.t(k);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
  const app = $("#app");
  const modal = $("#modal");
  const modalBody = $("#modal-body");
  const ui = { intent: null, mode: "describe", returnTo: null, draft: null, cleanups: [], recognizer: null };

  const GARMENT_ICON = { saree: "🥻", kurta: "👘", dupatta: "🧣", stole: "🧣", fabric: "🧵", dhoti: "🩳", lehenga: "👗" };
  const SOURCE_COLOURS = { search: "#3b5ba5", feed: "#b8862a", link: "#138a75" }; // validated: CVD + contrast on white
  const EXAMPLES = [
    "blue and black combination desi saree",
    "red silk saree for wedding under ₹15000, 10 pieces",
    "indigo block print kurta, 50 pcs in 3 weeks",
    "नीली और काली सूती साड़ी 2500 रुपये तक, 30 पीस",
    "ಕೆಂಪು ಹತ್ತಿ ಸೀರೆ ಜರಿ ಅಂಚು, 20 ತುಂಡುಗಳು ಸಂಕ್ರಾಂತಿಗೆ"
  ];
  const SAMPLE_VOICE = {
    en: "This is our indigo and black ikat cotton saree with a zari border. My mother taught me this weave. One saree is 2800 rupees. I can make 40 a month and I need 12 days.",
    hi: "यह हमारी नीली और काली इकत सूती साड़ी है, ज़री बॉर्डर के साथ। यह बुनाई मैंने अपनी माँ से सीखी। एक साड़ी 2800 रुपये। महीने में 40 साड़ी बना सकती हूँ। 12 दिन लगेंगे।",
    kn: "ಇದು ನಮ್ಮ ನೀಲಿ ಮತ್ತು ಕಪ್ಪು ಇಕತ್ ಹತ್ತಿ ಸೀರೆ, ಜರಿ ಅಂಚು. ಈ ನೇಯ್ಗೆ ನನ್ನ ಅಮ್ಮನಿಂದ ಕಲಿತೆ. ಒಂದು ಸೀರೆ 2800 ರೂಪಾಯಿ. ತಿಂಗಳಿಗೆ 40 ಸೀರೆ ಮಾಡಬಹುದು. 12 ದಿನ ಬೇಕು.",
    ta: "இது எங்கள் நீலம் கருப்பு இகத் பருத்தி புடவை, ஜரிகை பார்டர். இந்த நெசவை என் அம்மாவிடம் கற்றேன். ஒரு புடவை 2800 ரூபாய். மாதத்திற்கு 40 புடவைகள் செய்யலாம். 12 நாட்கள் வேண்டும்.",
    te: "ఇది మా నీలం నలుపు ఇక్కత్ నూలు చీర, జరీ అంచు. ఈ నేత మా అమ్మ దగ్గర నేర్చుకున్నాను. ఒక చీర 2800 రూపాయలు. నెలకు 40 చీరలు చేయగలను. 12 రోజులు కావాలి.",
    bn: "এটা আমাদের নীল আর কালো ইকাত সুতি শাড়ি, জরি পাড়। এই বুনন মায়ের কাছে শিখেছি। একটা শাড়ি ২৮০০ টাকা। মাসে ৪০টা বানাতে পারি। ১২ দিন লাগবে।",
    mr: "ही आमची निळी आणि काळी इकत सुती साडी आहे, जरी काठ. ही विणकाम आईकडून शिकले. एक साडी 2800 रुपये. महिन्याला 40 साड्या करू शकते. 12 दिवस लागतील."
  };

  /* ============ helpers ============ */
  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast.tm);
    toast.tm = setTimeout(() => el.classList.remove("show"), 3000);
  }
  function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }

  function openModal(content, cls = "") {
    modal.className = cls;
    modalBody.replaceChildren();
    if (typeof content === "string") modalBody.innerHTML = content; else modalBody.append(content);
    if (!modal.open) modal.showModal();
    modal.scrollTop = 0;
    return modalBody;
  }
  function closeModal() { if (modal.open) modal.close(); }
  modal.addEventListener("close", () => {
    ui.cleanups.splice(0).forEach((f) => f());
    if (window.speechSynthesis) speechSynthesis.cancel();
  });
  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target.closest("[data-close]")) closeModal();
  });

  function speechLang() {
    const s = Store.session();
    if (s && s.role === "weaver") return Store.weaver().lang;
    return I18N.lang;
  }
  function speak(text, lang = speechLang()) {
    if (!window.speechSynthesis) { toast("🔇"); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const code = I18N.speechCode(lang);
    u.lang = code;
    u.rate = 0.92;
    const voices = speechSynthesis.getVoices();
    const v = voices.find((x) => x.lang.replace("_", "-").toLowerCase() === code.toLowerCase()) ||
      voices.find((x) => x.lang.toLowerCase().startsWith(lang));
    if (v) u.voice = v;
    else if (voices.length) toast(`🔇 ${I18N.langName(lang)} — ${t("no_voice_out")}`);
    speechSynthesis.speak(u);
  }
  if (window.speechSynthesis) speechSynthesis.getVoices();
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-say]");
    if (b) { e.preventDefault(); e.stopPropagation(); speak(b.dataset.say, b.dataset.sayLang || speechLang()); }
  });
  const sayBtn = (text, lang) => `<button type="button" class="say" data-say="${esc(text)}" ${lang ? `data-say-lang="${lang}"` : ""} aria-label="${t("listen")}" title="${t("listen")}">🔊</button>`;

  /* Live speech-to-text in any listed language. Returns the recognizer, or null if unsupported. */
  function startListening(lang, onText, onEnd) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    const r = new SR();
    r.lang = I18N.speechCode(lang);
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript + (e.results[i].isFinal ? " " : "");
      onText(text.replace(/\s+/g, " ").trim());
    };
    r.onerror = (e) => { if (e.error !== "aborted" && e.error !== "no-speech") toast("🎙 " + e.error); };
    r.onend = () => onEnd && onEnd();
    try { r.start(); } catch { return null; }
    return r;
  }

  function readImage(file, max = 900) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve({ data: c.toDataURL("image/jpeg", 0.82), canvas: c });
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  function download(blob, name) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  const shareLink = (id) => `${location.href.split("#")[0]}#/c/${id}?src=link`;
  const swatch = (k) => `<span class="sw" style="--c:${Art.hex(k)}" title="${esc(AI.word("colour", k, I18N.lang))}"></span>`;
  const wordList = (group, keys) => (keys || []).map((k) => AI.word(group, k, I18N.lang)).join(", ");

  function trustBadge(wid) {
    const tr = Store.trust(wid);
    return tr.isNew
      ? `<span class="badge new" title="${t("new_maker_hint")}">🌱 ${t("new_maker")}</span>`
      : `<span class="badge trust" title="${t("trust")}">★ ${t("trust")} ${tr.score}</span>`;
  }

  /* Name/story in a reader's language: the weaver's own edited text if it is in that language,
     otherwise a fresh draft from the structured design card (the "auto-translation"). */
  function textFor(l, lang) {
    const d = AI.draft(l, lang);
    if (l.custom && l.custom.lang === I18N.uiLang(lang)) return { ...d, name: l.custom.name || d.name, story: l.custom.story || d.story };
    return d;
  }
  const isTranslated = (l, lang) => (l.custom ? l.custom.lang : I18N.uiLang(l.transcriptLang)) !== I18N.uiLang(lang);

  function stepper(id, value, min = 1, max = 99999, step = 1, prefix = "") {
    return `<div class="stepper" data-stepper="${id}" data-min="${min}" data-max="${max}" data-step="${step}">
      <button type="button" data-d="-1" aria-label="−">−</button>
      <output id="${id}" data-prefix="${prefix}" data-v="${value}">${prefix}${prefix === "₹" ? Number(value).toLocaleString("en-IN") : value}</output>
      <button type="button" data-d="1" aria-label="+">+</button></div>`;
  }
  function bindSteppers(root, onChange) {
    for (const s of $$("[data-stepper]", root)) {
      const out = $("output", s);
      for (const b of $$("button", s)) {
        b.onclick = () => {
          const v = Math.max(+s.dataset.min, Math.min(+s.dataset.max, +out.dataset.v + +b.dataset.d * +s.dataset.step));
          out.dataset.v = v;
          out.textContent = out.dataset.prefix + (out.dataset.prefix === "₹" ? v.toLocaleString("en-IN") : v);
          onChange && onChange(s.dataset.stepper, v);
        };
      }
    }
  }
  const stepVal = (root, id) => +$(`#${id}`, root).dataset.v;

  /* ============ router ============ */
  function route() {
    const hash = location.hash || "#/";
    const [path, query] = hash.slice(1).split("?");
    const parts = path.split("/").filter(Boolean);
    const params = new URLSearchParams(query || "");
    const s = Store.session();
    if (s && s.role === "buyer" && Store.buyer()) I18N.lang = I18N.uiLang(Store.buyer().prefLang);
    else if (s && s.role === "weaver" && Store.weaver()) I18N.lang = I18N.uiLang(Store.weaver().lang);
    else I18N.lang = I18N.uiLang(Store.state.uiLang);
    document.documentElement.lang = I18N.lang;
    if (ui.recognizer) { ui.recognizer.stop(); ui.recognizer = null; }
    closeModal();
    ui.cleanups.splice(0).forEach((f) => f());
    window.scrollTo(0, 0);

    const [area, page, extra] = parts;
    if (area === "c" && page) return viewPublic(page, params.get("src") || "link");
    if (area === "buyer") {
      if (!s || s.role !== "buyer" || !Store.buyer()) return viewBuyerLogin();
      if (page === "foryou") return viewForYou();
      if (page === "requests") return viewRequests();
      return viewFind();
    }
    if (area === "weaver") {
      if (!s || s.role !== "weaver" || !Store.weaver()) return viewWeaverLogin();
      if (page === "new") return viewNew();
      if (page === "inbox") return viewInbox();
      if (page === "results") return viewResults();
      return viewWeaverHome(extra);
    }
    if (s && s.role === "buyer" && Store.buyer()) return go("#/buyer/find");
    if (s && s.role === "weaver" && Store.weaver()) return go("#/weaver/home");
    return viewEntry();
  }
  window.addEventListener("hashchange", route);

  /* ============ entry ============ */
  function langPills(current, onPick) {
    const wrap = document.createElement("div");
    wrap.className = "lang-pills";
    wrap.setAttribute("role", "radiogroup");
    wrap.setAttribute("aria-label", t("language"));
    for (const l of UI_LANGS) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = l.name;
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", String(l.code === current));
      b.onclick = () => onPick(l.code);
      wrap.append(b);
    }
    return wrap;
  }

  function viewEntry() {
    app.innerHTML = `
      <div class="entry">
        <header class="entry-top">
          <span class="wordmark">Loom <i>&amp;</i> Bloom</span>
          <div id="entry-langs"></div>
        </header>
        <section class="entry-hero">
          <p class="eyebrow">${t("eyebrow_entry")}</p>
          <h1>${t("tagline")}</h1>
          <p class="entry-sub">${t("entry_sub")}</p>
        </section>
        <h2 class="entry-q">${t("entry_q")} ${sayBtn(t("entry_q"))}</h2>
        <section class="roles">
          <a class="role role-buyer" href="#/buyer">
            <span class="role-pic" style="background-image:url('atelier.jpg')"></span>
            <span class="role-body"><span class="role-icon">🛍️</span><strong>${t("role_buyer")}</strong><span>${t("role_buyer_sub")}</span><span class="role-go">→</span></span>
          </a>
          <a class="role role-weaver" href="#/weaver">
            <span class="role-pic woven"><span class="role-loom">🧵</span></span>
            <span class="role-body"><span class="role-icon">🪡</span><strong>${t("role_weaver")}</strong><span>${t("role_weaver_sub")}</span><span class="role-go">→</span></span>
          </a>
        </section>
        <section class="entry-how">
          <div><span>🎙️</span><p>${t("how_1")}</p></div>
          <div><span>✨</span><p>${t("how_2")}</p></div>
          <div><span>📦</span><p>${t("how_3")}</p></div>
        </section>
        <footer class="entry-foot"><span>${t("voice_langs")}: ${VOICE_LANGS.map((l) => l.name).join(" · ")}</span>
          <button class="link" id="reset-demo">${t("reset_demo")}</button></footer>
      </div>`;
    $("#entry-langs").append(langPills(I18N.lang, (code) => { Store.setLang(code); route(); }));
    $("#reset-demo").onclick = () => { Store.reset(); toast("✓"); route(); };
  }

  /* ============ buyer: login ============ */
  function viewBuyerLogin() {
    app.innerHTML = `
      <div class="auth">
        <div class="auth-pic" style="background-image:url('atelier.jpg')"></div>
        <section class="auth-panel">
          <a class="back-link" href="#/">← ${t("back")}</a>
          <span class="wordmark">Loom <i>&amp;</i> Bloom</span>
          <h1>${t("buyer_login_title")}</h1>
          <p class="muted">${t("buyer_login_sub")}</p>
          <form id="buyer-form" class="form">
            <label>${t("business_name")}<input name="name" required autocomplete="organization" placeholder="Kaveri Boutique"></label>
            <fieldset class="seg-field"><legend>${t("account_type")}</legend>
              <label><input type="radio" name="type" value="shop" checked><span>🏬 ${t("type_shop")}</span></label>
              <label><input type="radio" name="type" value="wholesale"><span>🚚 ${t("type_wholesale")}</span></label>
              <label><input type="radio" name="type" value="single"><span>🙋 ${t("type_single")}</span></label>
            </fieldset>
            <label>${t("gstin")}<input name="gstin" autocomplete="off" placeholder="29ABCDE1234F1Z5"></label>
            <label>${t("pref_lang")}
              <select name="prefLang">${UI_LANGS.map((l) => `<option value="${l.code}" ${l.code === I18N.lang ? "selected" : ""}>${l.name}</option>`).join("")}</select>
            </label>
            <p class="hint">${t("auto_translate_hint")}</p>
            <button class="btn primary wide" type="submit">${t("continue")} →</button>
          </form>
        </section>
      </div>`;
    $("#buyer-form").onsubmit = (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      Store.loginBuyer({ name: f.get("name"), type: f.get("type"), gstin: f.get("gstin"), prefLang: f.get("prefLang") });
      const back = ui.returnTo; ui.returnTo = null;
      go(back || "#/buyer/find");
    };
  }

  /* ============ buyer: shell ============ */
  function forYou(b) {
    const best = new Map();
    for (const s of b.saved) {
      const intent = AI.understand(s.text);
      if (AI.intentIsEmpty(intent)) continue;
      for (const r of AI.rank(Store.published(), intent, I18N.lang)) {
        if (r.score >= 65 && (!best.has(r.listing.id) || best.get(r.listing.id).score < r.score)) best.set(r.listing.id, { ...r, request: s });
      }
    }
    return [...best.values()].sort((a, c) => (c.listing.boosted - a.listing.boosted) || (c.listing.createdAt - a.listing.createdAt));
  }

  function buyerShell(active) {
    const b = Store.buyer();
    const fy = forYou(b).length;
    const open = Store.outbox(b.id).filter((m) => m.reply && !m.seen).length;
    app.innerHTML = `
      <header class="topbar">
        <a class="wordmark" href="#/buyer/find">Loom <i>&amp;</i> Bloom</a>
        <nav class="tabs-nav" aria-label="Buyer">
          <a href="#/buyer/find" ${active === "find" ? 'aria-current="page"' : ""}>🔎 ${t("nav_search")}</a>
          <a href="#/buyer/foryou" ${active === "foryou" ? 'aria-current="page"' : ""}>✨ ${t("nav_foryou")}${fy ? ` <span class="count">${fy}</span>` : ""}</a>
          <a href="#/buyer/requests" ${active === "requests" ? 'aria-current="page"' : ""}>📨 ${t("nav_requests")}${open ? ` <span class="count">${open}</span>` : ""}</a>
        </nav>
        <div class="topbar-end">
          <label class="lang-select" title="${t("pref_lang")}"><span aria-hidden="true">🌐</span><span class="sr-only">${t("pref_lang")}</span>
            <select id="pref-lang">${UI_LANGS.map((l) => `<option value="${l.code}" ${l.code === b.prefLang ? "selected" : ""}>${l.name}</option>`).join("")}</select></label>
          <span class="who" title="${esc(b.name)}">${esc(b.name)}</span>
          <button class="link" id="sign-out">${t("sign_out")}</button>
        </div>
      </header>
      <main id="view" class="view"></main>`;
    $("#pref-lang").onchange = (e) => { b.prefLang = e.target.value; Store.save(); route(); };
    $("#sign-out").onclick = () => { Store.signOut(); ui.intent = null; go("#/"); };
    return $("#view");
  }

  /* ============ buyer: find ============ */
  function viewFind() {
    const b = Store.buyer();
    const v = buyerShell("find");
    v.innerHTML = `
      <section class="search-hero">
        <div class="search-copy">
          <p class="eyebrow">${t("type_" + b.type)}</p>
          <h1>${t("find_title")}</h1>
        </div>
        <div class="search-box">
          <div class="seg" role="tablist">
            <button role="tab" data-mode="describe" aria-selected="${ui.mode === "describe"}">✍️ ${t("search_describe")}</button>
            <button role="tab" data-mode="photo" aria-selected="${ui.mode === "photo"}">📷 ${t("search_photo")}</button>
          </div>
          <div id="mode-describe" ${ui.mode === "describe" ? "" : "hidden"}>
            <form id="q-form" class="q-form" role="search">
              <label class="sr-only" for="q">${t("search_describe")}</label>
              <input id="q" autocomplete="off" placeholder="${esc(t("search_ph"))}" value="${esc(ui.intent && ui.intent.raw || "")}">
              <button type="button" class="mic" id="q-mic" aria-label="${t("speak")}" title="${t("speak")}">🎙️</button>
              <button class="btn primary" type="submit">${t("search_btn")}</button>
            </form>
            <div class="examples"><span>${t("try_label")}</span>${EXAMPLES.map((e) => `<button type="button" class="chip ghost" data-ex="${esc(e)}">${esc(e)}</button>`).join("")}</div>
          </div>
          <div id="mode-photo" ${ui.mode === "photo" ? "" : "hidden"}>
            <label class="drop" id="ref-drop">
              <input type="file" accept="image/*" id="ref-file" class="sr-only">
              <span class="drop-icon">📷</span><span>${t("upload_ref")}</span>
            </label>
            <div id="ref-result"></div>
          </div>
        </div>
      </section>
      <section id="understood" class="understood" aria-live="polite"></section>
      <section id="results" class="results"></section>`;

    for (const tab of $$("[data-mode]", v)) {
      tab.onclick = () => { ui.mode = tab.dataset.mode; viewFind(); };
    }
    $("#q-form").onsubmit = (e) => { e.preventDefault(); runSearch($("#q").value); };
    for (const c of $$("[data-ex]", v)) c.onclick = () => { $("#q").value = c.dataset.ex; runSearch(c.dataset.ex); };
    $("#q-mic").onclick = () => {
      const mic = $("#q-mic");
      if (ui.recognizer) { ui.recognizer.stop(); return; }
      ui.recognizer = startListening(b.prefLang, (txt) => { $("#q").value = txt; }, () => {
        mic.classList.remove("live"); ui.recognizer = null;
        if ($("#q").value.trim()) runSearch($("#q").value);
      });
      if (!ui.recognizer) { toast(t("no_voice_input")); return; }
      mic.classList.add("live");
      toast("🎙️ " + t("listening"));
    };
    const fileIn = $("#ref-file");
    fileIn.onchange = () => fileIn.files[0] && photoSearch(fileIn.files[0]);
    const drop = $("#ref-drop");
    drop.ondragover = (e) => { e.preventDefault(); drop.classList.add("over"); };
    drop.ondragleave = () => drop.classList.remove("over");
    drop.ondrop = (e) => { e.preventDefault(); drop.classList.remove("over"); const f = e.dataTransfer.files[0]; if (f) photoSearch(f); };

    renderUnderstood();
    renderResults();
  }

  function runSearch(text) {
    if (!text.trim()) { ui.intent = null; renderUnderstood(); renderResults(); return; }
    ui.intent = AI.understand(text);
    renderUnderstood();
    renderResults();
    $("#understood").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function photoSearch(file) {
    const { data, canvas } = await readImage(file, 500);
    const pal = AI.paletteFromImage(canvas);
    ui.intent = { raw: "", garment: null, fabric: null, colours: pal.map((p) => p.key), styles: [], occasion: null, budget: null, quantity: null, deadline: null, fromPhoto: data };
    renderPhotoResult();
    renderUnderstood();
    renderResults();
  }

  function renderPhotoResult() {
    const box = $("#ref-result");
    if (!box || !ui.intent || !ui.intent.fromPhoto) return;
    box.innerHTML = `
      <div class="ref-row">
        <img src="${ui.intent.fromPhoto}" alt="" class="ref-thumb">
        <div>
          <p class="label">${t("colours_found")}</p>
          <div class="sw-row">${ui.intent.colours.map((c) => `${swatch(c)}<span>${esc(AI.word("colour", c, I18N.lang))}</span>`).join("")}</div>
          <p class="label">${t("select_garment")}</p>
          <div class="chips">${["saree", "kurta", "dupatta", "stole"].map((g) => `<button type="button" class="chip ${ui.intent.garment === g ? "on" : ""}" data-g="${g}">${GARMENT_ICON[g]} ${esc(AI.word("garment", g, I18N.lang))}</button>`).join("")}</div>
        </div>
      </div>`;
    for (const c of $$("[data-g]", box)) c.onclick = () => {
      ui.intent.garment = ui.intent.garment === c.dataset.g ? null : c.dataset.g;
      renderPhotoResult(); renderUnderstood(); renderResults();
    };
  }

  function renderUnderstood() {
    const box = $("#understood");
    if (!box) return;
    const i = ui.intent;
    if (!i || AI.intentIsEmpty(i)) { box.innerHTML = i && i.raw ? `<p class="muted">${t("nothing_understood")}</p>` : ""; return; }
    const L = I18N.lang;
    const chips = [];
    if (i.garment) chips.push(["garment", "garment", `${GARMENT_ICON[i.garment] || ""} ${AI.word("garment", i.garment, L)}`]);
    if (i.fabric) chips.push(["fabric", "fabric", "🧶 " + AI.word("fabric", i.fabric, L)]);
    i.colours.forEach((c, n) => chips.push(["colours", "colour:" + n, `${swatch(c)} ${esc(AI.word("colour", c, L))}`, true]));
    i.styles.forEach((s, n) => chips.push(["style", "style:" + n, "✨ " + AI.word("style", s, L)]));
    if (i.occasion) chips.push(["style", "occasion", "🎉 " + AI.word("occasion", i.occasion, L)]);
    if (i.budget) chips.push(["budget", "budget", "💰 ≤ " + money(i.budget)]);
    if (i.quantity) chips.push(["quantity", "quantity", `📦 ${i.quantity} ${t("pieces")}`]);
    if (i.deadline) chips.push(["deadline", "deadline", "📅 " + new Date(i.deadline).toLocaleDateString(L === "en" ? "en-IN" : L + "-IN", { day: "numeric", month: "short", year: "numeric" })]);
    box.innerHTML = `
      <div class="understood-head">
        <h2>🧠 ${t("understood")}</h2>
        ${i.raw ? `<button class="btn ghost small" id="save-req">🔖 ${t("save_request")}</button>` : ""}
      </div>
      <ul class="intent-chips">${chips.map(([label, key, text, isHtml]) => `
        <li><span class="k">${t(label)}</span><span class="v">${isHtml ? text : esc(text)}</span>
        <button type="button" data-rm="${key}" aria-label="✕ ${t(label)}">✕</button></li>`).join("")}
      </ul>`;
    for (const x of $$("[data-rm]", box)) x.onclick = () => {
      const [k, n] = x.dataset.rm.split(":");
      if (k === "colour") i.colours.splice(+n, 1);
      else if (k === "style") i.styles.splice(+n, 1);
      else i[k] = null;
      renderUnderstood(); renderResults();
    };
    const save = $("#save-req");
    if (save) save.onclick = () => { Store.saveRequest(i.raw); toast("🔖 " + t("saved_request")); viewFind(); };
  }

  function resultCard(r, source) {
    const l = r.listing;
    const L = I18N.lang;
    const d = textFor(l, L);
    const card = document.createElement("article");
    card.className = "card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `${d.name}, ${l.brand}${r.score != null ? `, ${r.score}% ${t("match")}` : ""}`);
    card.innerHTML = `
      <div class="card-pic">
        ${r.score != null ? `<span class="match" style="--p:${r.score}"><b>${r.score}%</b><small>${t("match")}</small></span>` : ""}
        ${l.boosted ? `<span class="tag boosted">🚀 ${t("boosted")}</span>` : ""}
      </div>
      <div class="card-body">
        <h3>${esc(d.name)}</h3>
        <p class="by">${t("by")} ${esc(l.brand)} ${trustBadge(l.weaverId)}</p>
        <p class="price"><strong>${money(l.price)}</strong> <small>${t("per_piece")}</small> <span class="dot">·</span> <small>${t("min_order")} ${l.minQty}</small></p>
        <div class="sw-row small">${l.colours.map(swatch).join("")}</div>
        ${r.reasons && r.reasons.length ? `<ul class="reasons">${r.reasons.map((x) => `<li class="${x.ok}">${x.ok === "yes" ? "✓" : x.ok === "near" ? "≈" : "✕"} ${esc(x.label)}</li>`).join("")}</ul>` : ""}
        ${r.request ? `<p class="because">🔖 “${esc(r.request.text)}”</p>` : ""}
      </div>`;
    card.querySelector(".card-pic").prepend(Art.imageEl(l));
    const open = () => openListing(l.id, source);
    card.onclick = open;
    card.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } };
    return card;
  }

  function renderResults() {
    const box = $("#results");
    if (!box) return;
    const i = ui.intent;
    let list;
    if (!i || AI.intentIsEmpty(i) && !i.raw) {
      list = [...Store.published()].sort((a, c) => (c.boosted - a.boosted) || (c.createdAt - a.createdAt)).map((l) => ({ listing: l, score: null, reasons: [] }));
      box.innerHTML = `<h2>${t("trending")}</h2>`;
    } else {
      list = AI.rank(Store.published(), i, I18N.lang).filter((r, n) => r.score >= 30 || n < 3);
      box.innerHTML = `<h2>${t("best_matches")} <small>${list.length}</small></h2>`;
    }
    const grid = document.createElement("div");
    grid.className = "grid";
    grid.append(...list.map((r) => resultCard(r, "search")));
    box.append(grid);
  }

  /* ============ buyer: for you ============ */
  function viewForYou() {
    const b = Store.buyer();
    const v = buyerShell("foryou");
    const recs = forYou(b);
    v.innerHTML = `
      <section class="page-head"><h1>✨ ${t("foryou_title")}</h1><p class="muted">${t("foryou_sub")}</p></section>
      <section class="saved">
        <h2>🔖 ${t("your_saved")}</h2>
        ${b.saved.length ? `<ul class="saved-list">${b.saved.map((s) => `<li><button class="link" data-run="${esc(s.text)}">“${esc(s.text)}”</button><button class="x" data-del="${s.id}" aria-label="✕">✕</button></li>`).join("")}</ul>` : `<p class="muted">${t("foryou_empty")}</p>`}
      </section>
      <section class="results"><div class="grid" id="fy-grid"></div></section>`;
    $("#fy-grid").append(...recs.map((r) => resultCard(r, "feed")));
    for (const x of $$("[data-del]", v)) x.onclick = () => { Store.removeRequest(x.dataset.del); viewForYou(); };
    for (const x of $$("[data-run]", v)) x.onclick = () => { ui.mode = "describe"; ui.intent = AI.understand(x.dataset.run); go("#/buyer/find"); };
  }

  /* ============ buyer: requests ============ */
  const TYPE_ICON = { sample: "📦", trial: "🧾", alter: "✏️", idea: "💡", contact: "💬" };
  const TYPE_KEY = { sample: "request_sample", trial: "order_trial", alter: "alter", idea: "send_idea", contact: "contact" };

  function viewRequests() {
    const b = Store.buyer();
    const v = buyerShell("requests");
    const msgs = Store.outbox(b.id);
    v.innerHTML = `<section class="page-head"><h1>📨 ${t("requests_title")}</h1></section>
      ${msgs.length ? `<ul class="msg-list">${msgs.map((m) => {
        const l = Store.listing(m.listingId);
        return `<li class="msg">
          <span class="msg-icon">${TYPE_ICON[m.type]}</span>
          <div class="msg-body">
            <p class="msg-title"><strong>${t(TYPE_KEY[m.type])}</strong> · ${esc(l ? textFor(l, I18N.lang).name : "")} · ${esc(l ? l.brand : "")}</p>
            ${m.qty ? `<p>📦 ${m.qty} ${t("pieces")}${m.amount ? ` · ${money(m.amount)}` : ""}</p>` : ""}
            ${m.note ? `<p class="muted">“${esc(m.note)}”</p>` : ""}
            ${m.reply ? `<p class="reply">↩ ${esc(m.reply)}</p>` : ""}
          </div>
          <span class="status ${m.status}">${t("status_" + m.status)}</span>
        </li>`;
      }).join("")}</ul>` : `<p class="muted empty">${t("requests_empty")}</p>`}`;
    msgs.forEach((m) => { if (m.reply) m.seen = true; });
    Store.save();
  }

  /* ============ listing detail (buyer + public) ============ */
  function listingDetailHTML(l, L) {
    const d = textFor(l, L);
    const w = Store.weaver(l.weaverId) || {};
    const translated = isTranslated(l, L);
    const origLang = l.custom ? l.custom.lang : l.transcriptLang;
    const original = [l.custom && l.custom.name, l.custom && l.custom.story, l.transcript].filter(Boolean).join("\n\n");
    return `
      <div class="listing-pic"></div>
      <div class="listing-info">
        <p class="eyebrow">${GARMENT_ICON[l.garment] || ""} ${esc(AI.word("garment", l.garment, L))}${w.place ? ` · ${esc(w.place)}` : ""}</p>
        <h2>${esc(d.name)}</h2>
        <p class="by">${t("by")} <strong>${esc(l.brand)}</strong> ${trustBadge(l.weaverId)} ${l.boosted ? `<span class="tag boosted">🚀 ${t("boosted")}</span>` : ""}</p>
        ${translated ? `<p class="translated">🌐 ${t("auto_translated")} ${esc(I18N.langName(origLang))} · <button class="link" id="toggle-orig">${t("show_original")}</button></p>` : ""}
        <p class="story">${esc(d.story)}</p>
        <blockquote class="orig" id="orig" lang="${esc(origLang)}" hidden>${esc(original).replace(/\n/g, "<br>")}</blockquote>
        <div class="row">${l.audio ? `<audio controls src="${l.audio}" class="maker-audio"></audio>` : `<button type="button" class="btn ghost small" data-say="${esc(l.transcript || d.story)}" data-say-lang="${esc(l.transcriptLang || L)}">🔊 ${t("hear_maker")}</button>`}</div>
        <dl class="facts">
          ${l.fabric ? `<div><dt>🧶 ${t("fabric")}</dt><dd>${esc(AI.word("fabric", l.fabric, L))}</dd></div>` : ""}
          <div><dt>🎨 ${t("colours")}</dt><dd class="sw-row">${l.colours.map((c) => `${swatch(c)}<span>${esc(AI.word("colour", c, L))}</span>`).join("")}</dd></div>
          ${l.styles.length ? `<div><dt>✨ ${t("style")}</dt><dd>${esc(wordList("style", l.styles))}</dd></div>` : ""}
          <div><dt>💰 ${t("price")}</dt><dd><strong>${money(l.price)}</strong></dd></div>
          <div><dt>📦 ${t("min_order")}</dt><dd>${l.minQty} ${t("pieces")}</dd></div>
          <div><dt>🧪 ${t("sample_pieces")}</dt><dd>${l.trialQty} ${t("pieces")}</dd></div>
          <div><dt>⏱ ${t("ready_in")}</dt><dd>${l.leadDays} ${t("days")}</dd></div>
        </dl>
        <div class="actions" id="actions"></div>
      </div>`;
  }

  function bindOriginalToggle(root) {
    const btn = $("#toggle-orig", root);
    if (!btn) return;
    btn.onclick = () => {
      const o = $("#orig", root);
      o.hidden = !o.hidden;
      btn.textContent = o.hidden ? t("show_original") : t("show_translated");
    };
  }

  function buyerActions(l, box) {
    const own = Store.session() && Store.session().role === "weaver" && Store.session().id === l.weaverId;
    if (own) { box.innerHTML = `<a class="btn ghost" href="#/c/${l.id}">🔗 ${t("open_shop_page")}</a>`; return; }
    box.innerHTML = `
      <button class="btn primary" data-act="sample">📦 ${t("request_sample")}</button>
      <button class="btn secondary" data-act="trial">🧾 ${t("order_trial")}</button>
      <button class="btn ghost" data-act="contact">💬 ${t("contact")}</button>
      <button class="btn ghost" data-act="alter">✏️ ${t("alter")}</button>
      <button class="btn ghost studio-btn" data-act="studio">🪄 ${t("studio")}</button>
      <p class="hint">${t("sample_note")}</p>`;
    for (const b of $$("[data-act]", box)) b.onclick = () => {
      const s = Store.session();
      if (!s || s.role !== "buyer") { ui.returnTo = `#/c/${l.id}`; closeModal(); go("#/buyer"); toast(t("login_to_continue")); return; }
      ({ sample: sampleDialog, trial: trialDialog, contact: contactDialog, alter: alterDialog, studio: openStudio })[b.dataset.act](l);
    };
  }

  function openListing(id, source = "search", countView = true) {
    const l = Store.listing(id);
    if (!l) return;
    const s = Store.session();
    if (countView && !(s && s.role === "weaver" && s.id === l.weaverId)) Store.view(id, source);
    const body = document.createElement("div");
    body.className = "listing";
    body.innerHTML = listingDetailHTML(l, I18N.lang);
    $(".listing-pic", body).append(Art.imageEl(l));
    openModal(body, "wide");
    bindOriginalToggle(body);
    buyerActions(l, $("#actions", body));
  }

  function subDialog(l, inner) {
    const wrap = document.createElement("div");
    wrap.className = "sub";
    wrap.innerHTML = `<button type="button" class="back-link" id="sub-back">← ${esc(textFor(l, I18N.lang).name)}</button>${inner}`;
    openModal(wrap, "");
    $("#sub-back", wrap).onclick = () => openListing(l.id, "search", false);
    return wrap;
  }
  function sent(l) {
    toast("✓ " + t("sent"));
    openListing(l.id, "search", false);
  }

  function sampleDialog(l) {
    const w = subDialog(l, `
      <h2>📦 ${t("request_sample")}</h2>
      <p class="muted">${t("sample_note")}</p>
      <div class="field"><span>${t("qty")}</span>${stepper("s-qty", l.trialQty, 1, 20)}</div>
      <label class="field">${t("your_note")}<textarea id="s-note" rows="3"></textarea></label>
      <button class="btn primary wide" id="s-send">${t("send")} →</button>`);
    bindSteppers(w);
    $("#s-send", w).onclick = () => { Store.send({ listingId: l.id, type: "sample", qty: stepVal(w, "s-qty"), note: $("#s-note", w).value.trim() }); sent(l); };
  }

  function trialDialog(l) {
    const w = subDialog(l, `
      <h2>🧾 ${t("order_trial")}</h2>
      <p class="muted">${t("trial_explain")}</p>
      <div class="field"><span>${t("qty")}</span>${stepper("t-qty", l.trialQty, l.trialQty, Math.max(l.trialQty, l.minQty * 4))}</div>
      <p class="total">${money(l.price)} × <span id="t-n">${l.trialQty}</span> = <strong id="t-total">${money(l.price * l.trialQty)}</strong></p>
      <label class="field">${t("your_note")}<textarea id="t-note" rows="2"></textarea></label>
      <button class="btn primary wide" id="t-pay">🔒 ${t("trial_pay")}</button>
      <p class="hint">${t("demo_pay")}</p>`);
    bindSteppers(w, (_, v) => { $("#t-n", w).textContent = v; $("#t-total", w).textContent = money(v * l.price); });
    $("#t-pay", w).onclick = () => {
      const q = stepVal(w, "t-qty");
      Store.send({ listingId: l.id, type: "trial", qty: q, amount: q * l.price, note: $("#t-note", w).value.trim() });
      sent(l);
    };
  }

  function contactDialog(l) {
    const w = subDialog(l, `
      <h2>💬 ${t("contact")}</h2>
      <p class="muted">${t("contact_explain")}</p>
      <label class="field">${t("your_note")}<textarea id="c-note" rows="4" required></textarea></label>
      <button class="btn primary wide" id="c-send">${t("send")} →</button>`);
    $("#c-send", w).onclick = () => {
      const note = $("#c-note", w).value.trim();
      if (!note) { $("#c-note", w).focus(); return; }
      Store.send({ listingId: l.id, type: "contact", note });
      sent(l);
    };
  }

  const CHANGES = [["ch_colour", "🎨"], ["ch_border", "▭"], ["ch_length", "📏"], ["ch_fabric", "🧶"], ["ch_blouse", "👚"], ["ch_pack", "🏷️"]];
  function alterDialog(l) {
    const w = subDialog(l, `
      <h2>✏️ ${t("changes_title")}</h2>
      <div class="check-chips">${CHANGES.map(([k, ic]) => `<label><input type="checkbox" value="${k}"><span>${ic} ${t(k)}</span></label>`).join("")}</div>
      <div class="field"><span>${t("qty")}</span>${stepper("a-qty", l.minQty, 1, 9999)}</div>
      <label class="field">${t("your_note")}<textarea id="a-note" rows="3"></textarea></label>
      <p class="hint">🪄 <button class="link" id="a-studio">${t("studio")}</button></p>
      <button class="btn primary wide" id="a-send">${t("send")} →</button>`);
    bindSteppers(w);
    $("#a-studio", w).onclick = () => openStudio(l);
    $("#a-send", w).onclick = () => {
      const changes = $$("input:checked", w).map((x) => x.value);
      Store.send({ listingId: l.id, type: "alter", changes, qty: stepVal(w, "a-qty"), note: $("#a-note", w).value.trim() });
      sent(l);
    };
  }

  /* ============ idea studio: layers only, the woven photo is never altered ============ */
  const STUDIO_COLOURS = ["red", "maroon", "pink", "orange", "mustard", "gold", "green", "teal", "blue", "indigo", "purple", "black", "white", "cream"];
  function motifSVG(colour, size) {
    const c = Art.hex(colour);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 46 46"><path d="M14 9 c6 0 9 6 6 11 c-2 4 -8 4 -8 0 c0 -3 4 -3 4 -1" fill="none" stroke="${c}" stroke-width="2.6"/><circle cx="34" cy="34" r="3.4" fill="${c}"/></svg>`;
  }
  function bandCSS(colour) {
    const c = Art.hex(colour);
    return `linear-gradient(${c}, ${c}) top/100% 3px no-repeat, linear-gradient(${c}, ${c}) bottom/100% 3px no-repeat, repeating-linear-gradient(90deg, ${c} 0 12px, rgba(255,255,255,.35) 12px 14px, ${c} 14px 22px, rgba(0,0,0,.25) 22px 24px)`;
  }

  function openStudio(l) {
    const S = {
      colour: { on: false, c: "indigo", a: 0.45 },
      motif: { on: false, c: "gold", a: 0.7, size: 46 },
      border: { on: false, c: "gold", h: 10, edges: false },
      light: { on: false, a: 0.55 },
      pins: [], pinMode: false
    };
    const swatches = (layer) => `<div class="sw-pick" role="radiogroup">${STUDIO_COLOURS.map((c) => `<button type="button" role="radio" data-layer="${layer}" data-c="${c}" style="--c:${Art.hex(c)}" aria-label="${esc(AI.word("colour", c, I18N.lang))}" aria-checked="${S[layer].c === c}"></button>`).join("")}</div>`;
    const w = subDialog(l, `
      <div class="studio">
        <div class="studio-left">
          <div class="studio-stage" id="stage">
            <div class="base" id="base"></div>
            <div class="layers" id="layers">
              <div class="ly ly-colour"></div><div class="ly ly-motif"></div>
              <div class="ly ly-border"><i></i><b></b><u></u></div>
              <div class="ly ly-light"></div><div class="ly ly-pins" id="pins"></div>
            </div>
          </div>
          <button type="button" class="btn ghost wide" id="compare">👁 ${t("compare")}</button>
        </div>
        <div class="studio-panel">
          <h2>🪄 ${t("studio_title")}</h2>
          <p class="muted">${t("studio_note")}</p>
          <ol class="layer-list">
            <li data-row="pins"><label class="ly-toggle"><input type="checkbox" id="pin-mode"> 📍 ${t("layer_pin")}</label>
              <div class="ly-ctl"><p class="hint">${t("pin_hint")}</p><ol id="pin-notes" class="pin-notes"></ol></div></li>
            <li data-row="light"><label class="ly-toggle"><input type="checkbox" data-on="light"> 💡 ${t("layer_light")}</label>
              <div class="ly-ctl"><input type="range" min="0.15" max="0.9" step="0.05" value="${S.light.a}" data-set="light.a" aria-label="${t("layer_light")}"></div></li>
            <li data-row="border"><label class="ly-toggle"><input type="checkbox" data-on="border"> ▭ ${t("layer_border")}</label>
              <div class="ly-ctl">${swatches("border")}<input type="range" min="4" max="26" step="1" value="${S.border.h}" data-set="border.h" aria-label="${t("size")}">
              <label class="mini"><input type="checkbox" data-set="border.edges"> ${t("edges")}</label></div></li>
            <li data-row="motif"><label class="ly-toggle"><input type="checkbox" data-on="motif"> ✿ ${t("layer_motif")}</label>
              <div class="ly-ctl">${swatches("motif")}<input type="range" min="24" max="80" step="2" value="${S.motif.size}" data-set="motif.size" aria-label="${t("size")}"></div></li>
            <li data-row="colour"><label class="ly-toggle"><input type="checkbox" data-on="colour"> 🎨 ${t("layer_colour")}</label>
              <div class="ly-ctl">${swatches("colour")}<input type="range" min="0.15" max="0.85" step="0.05" value="${S.colour.a}" data-set="colour.a" aria-label="${t("amount")}"></div></li>
            <li class="base-row">🔒 ${t("base_layer")}</li>
          </ol>
          <label class="field">${t("your_note")}<textarea id="idea-note" rows="2"></textarea></label>
          <button class="btn primary wide" id="send-idea">💡 ${t("send_idea")}</button>
        </div>
      </div>`);
    modal.className = "wide";
    $("#base", w).append(Art.imageEl(l));
    const stage = $("#stage", w);

    function apply() {
      const lc = $(".ly-colour", w), lm = $(".ly-motif", w), lb = $(".ly-border", w), ll = $(".ly-light", w);
      lc.hidden = !S.colour.on; lc.style.background = Art.hex(S.colour.c); lc.style.opacity = S.colour.a;
      lm.hidden = !S.motif.on; lm.style.backgroundImage = `url("${Art.svgUrl(motifSVG(S.motif.c, S.motif.size))}")`; lm.style.backgroundSize = `${S.motif.size}px`; lm.style.opacity = S.motif.a;
      lb.hidden = !S.border.on;
      const [bot, left, right] = lb.children;
      bot.style.height = S.border.h + "%"; bot.style.background = bandCSS(S.border.c);
      for (const e of [left, right]) { e.hidden = !S.border.edges; e.style.width = S.border.h * 0.6 + "%"; e.style.background = bandCSS(S.border.c).replace(/90deg/, "0deg"); }
      ll.hidden = !S.light.on; ll.style.opacity = S.light.a;
      for (const row of $$("[data-row]", w)) {
        const k = row.dataset.row;
        row.classList.toggle("on", k === "pins" ? S.pinMode || S.pins.length > 0 : S[k].on);
      }
      for (const b of $$(".sw-pick button", w)) b.setAttribute("aria-checked", String(S[b.dataset.layer].c === b.dataset.c));
      stage.classList.toggle("pinning", S.pinMode);
      $("#pins", w).innerHTML = S.pins.map((p, n) => `<span class="pin" style="left:${p.x}%;top:${p.y}%">${n + 1}</span>`).join("");
    }
    function renderPinNotes() {
      $("#pin-notes", w).innerHTML = S.pins.map((p, n) => `<li><span class="pin-n">${n + 1}</span><input value="${esc(p.note)}" data-pin="${n}" placeholder="${t("pin_note_ph")}"><button type="button" class="x" data-unpin="${n}" aria-label="✕">✕</button></li>`).join("");
      for (const i of $$("[data-pin]", w)) i.oninput = () => { S.pins[+i.dataset.pin].note = i.value; };
      for (const x of $$("[data-unpin]", w)) x.onclick = () => { S.pins.splice(+x.dataset.unpin, 1); renderPinNotes(); apply(); };
    }
    for (const c of $$("[data-on]", w)) c.onchange = () => { S[c.dataset.on].on = c.checked; apply(); };
    for (const r of $$("[data-set]", w)) r.oninput = r.onchange = () => {
      const [k, p] = r.dataset.set.split(".");
      S[k][p] = r.type === "checkbox" ? r.checked : +r.value;
      S[k].on = true; const box = $(`[data-on="${k}"]`, w); if (box) box.checked = true;
      apply();
    };
    for (const b of $$(".sw-pick button", w)) b.onclick = () => {
      const k = b.dataset.layer; S[k].c = b.dataset.c; S[k].on = true; $(`[data-on="${k}"]`, w).checked = true; apply();
    };
    $("#pin-mode", w).onchange = (e) => { S.pinMode = e.target.checked; apply(); };
    stage.onclick = (e) => {
      if (!S.pinMode) return;
      const r = stage.getBoundingClientRect();
      S.pins.push({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100, note: "" });
      renderPinNotes(); apply();
      const last = $$("[data-pin]", w).at(-1); if (last) last.focus();
    };
    const cmp = $("#compare", w);
    const hide = (on) => { $("#layers", w).style.visibility = on ? "hidden" : ""; cmp.classList.toggle("pressed", on); };
    cmp.onpointerdown = () => hide(true);
    cmp.onpointerup = cmp.onpointerleave = cmp.onpointercancel = () => hide(false);
    cmp.onkeydown = (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); hide(true); } };
    cmp.onkeyup = () => hide(false);

    $("#send-idea", w).onclick = async () => {
      const layers = [];
      if (S.colour.on) layers.push({ k: "layer_colour", c: S.colour.c });
      if (S.motif.on) layers.push({ k: "layer_motif", c: S.motif.c });
      if (S.border.on) layers.push({ k: "layer_border", c: S.border.c, edges: S.border.edges });
      if (S.light.on) layers.push({ k: "layer_light" });
      if (!layers.length && !S.pins.length) { toast(t("add_layer_first")); return; }
      $("#send-idea", w).disabled = true;
      const image = await compositeIdea(l, S);
      Store.send({ listingId: l.id, type: "idea", layers, pins: S.pins.map((p, n) => ({ n: n + 1, note: p.note })), note: $("#idea-note", w).value.trim(), image });
      sent(l);
    };
    apply();
  }

  /* Flattens base photo + idea layers into a JPEG for the weaver's inbox (base pixels untouched). */
  async function compositeIdea(l, S) {
    const W = 450, H = 600;
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const ctx = c.getContext("2d");
    Art.drawCover(ctx, await Art.loadDrawable(l), 0, 0, W, H);
    const masked = (paint) => {
      const off = document.createElement("canvas"); off.width = W; off.height = H;
      const o = off.getContext("2d"); paint(o);
      o.globalCompositeOperation = "destination-in";
      o.save(); o.translate(W / 2, H * 0.52); o.scale(0.92 * W / H, 1);
      const g = o.createRadialGradient(0, 0, 0, 0, 0, H * 0.5);
      g.addColorStop(0, "#000"); g.addColorStop(0.6, "#000"); g.addColorStop(1, "rgba(0,0,0,0)");
      o.fillStyle = g; o.fillRect(-W, -H, W * 2, H * 2); o.restore();
      return off;
    };
    if (S.colour.on) {
      ctx.save(); ctx.globalAlpha = S.colour.a; ctx.globalCompositeOperation = "color";
      ctx.drawImage(masked((o) => { o.fillStyle = Art.hex(S.colour.c); o.fillRect(0, 0, W, H); }), 0, 0); ctx.restore();
    }
    if (S.motif.on) {
      const img = await new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = Art.svgUrl(motifSVG(S.motif.c, S.motif.size)); });
      if (img) {
        ctx.save(); ctx.globalAlpha = S.motif.a;
        ctx.drawImage(masked((o) => { o.fillStyle = o.createPattern(img, "repeat"); o.fillRect(0, 0, W, H); }), 0, 0); ctx.restore();
      }
    }
    if (S.border.on) {
      const band = (x, y, w, h, vertical) => {
        ctx.fillStyle = Art.hex(S.border.c); ctx.fillRect(x, y, w, h);
        ctx.fillStyle = "rgba(255,255,255,.35)";
        if (vertical) for (let yy = y; yy < y + h; yy += 22) ctx.fillRect(x, yy, w, 2);
        else for (let xx = x; xx < x + w; xx += 22) ctx.fillRect(xx, y, 2, h);
      };
      const bh = H * S.border.h / 100;
      band(0, H - bh, W, bh, false);
      if (S.border.edges) { const ew = W * S.border.h * 0.6 / 100; band(0, 0, ew, H, true); band(W - ew, 0, ew, H, true); }
    }
    if (S.light.on) {
      ctx.save(); ctx.globalAlpha = S.light.a; ctx.globalCompositeOperation = "soft-light";
      const g = ctx.createRadialGradient(W * 0.5, H * 0.3, 20, W * 0.5, H * 0.5, H * 0.75);
      g.addColorStop(0, "#fff3d6"); g.addColorStop(1, "#2a1608");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
    }
    S.pins.forEach((p, n) => {
      const x = p.x / 100 * W, y = p.y / 100 * H;
      ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI * 2); ctx.fillStyle = "#8c2f28"; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = "#fff"; ctx.stroke();
      ctx.fillStyle = "#fff"; ctx.font = "700 14px Inter, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(String(n + 1), x, y + 1);
    });
    try { return c.toDataURL("image/jpeg", 0.78); } catch { return null; } // file:// pages can't export photo pixels
  }

  /* ============ public shop page (shareable, trackable) ============ */
  function viewPublic(id, src) {
    const l = Store.listing(id);
    const s = Store.session();
    if (!l) { app.innerHTML = `<div class="center-msg"><p>404</p><a class="btn ghost" href="#/">Loom &amp; Bloom</a></div>`; return; }
    if (!(s && s.role === "weaver" && s.id === l.weaverId) && !sessionStorageSeen(id, src)) Store.view(id, src);
    const L = I18N.lang;
    app.innerHTML = `
      <header class="topbar slim">
        <a class="wordmark" href="#/">Loom <i>&amp;</i> Bloom</a>
        <div class="topbar-end" id="pub-langs"></div>
      </header>
      <main class="view public">
        <article class="listing page">${listingDetailHTML(l, L)}</article>
        <p class="public-cta">${t("weaver_page_cta")}</p>
      </main>`;
    $(".listing-pic", app).append(Art.imageEl(l));
    bindOriginalToggle(app);
    buyerActions(l, $("#actions", app));
    const sel = document.createElement("select");
    sel.innerHTML = UI_LANGS.map((x) => `<option value="${x.code}" ${x.code === L ? "selected" : ""}>${x.name}</option>`).join("");
    sel.setAttribute("aria-label", t("pref_lang"));
    sel.onchange = () => {
      if (s && s.role === "buyer") { Store.buyer().prefLang = sel.value; Store.save(); }
      else if (s && s.role === "weaver") { Store.weaver().lang = sel.value; Store.save(); }
      else Store.setLang(sel.value);
      route();
    };
    const wrapSel = document.createElement("label");
    wrapSel.className = "lang-select";
    wrapSel.append("🌐 ", sel);
    $("#pub-langs").append(wrapSel);
  }
  /* Count one view per page per browser tab session, so language switches don't inflate stats. */
  function sessionStorageSeen(id, src) {
    try {
      const k = `seen:${id}:${src}`;
      if (sessionStorage.getItem(k)) return true;
      sessionStorage.setItem(k, "1");
    } catch { /* storage blocked: count it */ }
    return false;
  }

  /* ============ weaver: login ============ */
  function viewWeaverLogin() {
    app.innerHTML = `
      <div class="auth weaver-auth">
        <div class="auth-pic woven-art" aria-hidden="true"><span>🧵</span></div>
        <section class="auth-panel">
          <a class="back-link" href="#/">← ${t("back")}</a>
          <span class="wordmark">Loom <i>&amp;</i> Bloom</span>
          <h1>${t("weaver_login_title")} ${sayBtn(t("weaver_login_title"))}</h1>
          <p class="muted">${t("weaver_login_sub")}</p>
          <form id="weaver-form" class="form">
            <label>🏷️ ${t("brand_name")}
              <span class="input-mic"><input name="brand" id="brand" required placeholder="Sharada Handlooms" autocomplete="organization">
              <button type="button" class="mic small" id="brand-mic" aria-label="${t("speak")}">🎙️</button></span></label>
            <label>🗣️ ${t("weaver_lang")}
              <select name="lang" id="w-lang">${VOICE_LANGS.map((l) => `<option value="${l.code}" ${l.code === I18N.lang ? "selected" : ""}>${l.name}</option>`).join("")}</select></label>
            <button class="btn primary wide big" type="submit">✓ ${t("start")}</button>
            <p class="hint">${t("demo_weaver_hint")}</p>
          </form>
        </section>
      </div>`;
    $("#w-lang").onchange = (e) => { Store.setLang(I18N.uiLang(e.target.value)); I18N.lang = I18N.uiLang(e.target.value); const keep = $("#brand").value; viewWeaverLogin(); $("#w-lang").value = e.target.value; $("#brand").value = keep; };
    $("#brand-mic").onclick = () => {
      if (ui.recognizer) { ui.recognizer.stop(); return; }
      ui.recognizer = startListening($("#w-lang").value, (txt) => { $("#brand").value = txt; }, () => { $("#brand-mic").classList.remove("live"); ui.recognizer = null; });
      if (!ui.recognizer) { toast(t("no_voice_input")); return; }
      $("#brand-mic").classList.add("live");
    };
    $("#weaver-form").onsubmit = (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      Store.loginWeaver({ brand: f.get("brand"), lang: f.get("lang") });
      go("#/weaver/home");
    };
  }

  /* ============ weaver: shell ============ */
  function weaverShell(active) {
    const w = Store.weaver();
    const unread = Store.inbox(w.id).filter((m) => m.status === "new" || (m.type === "trial" && !m.seen)).length;
    const tr = Store.trust(w.id);
    app.innerHTML = `
      <header class="topbar weaver-top">
        <a class="wordmark" href="#/weaver/home">Loom <i>&amp;</i> Bloom</a>
        <div class="w-id"><span class="w-avatar" aria-hidden="true">${esc(w.brand.trim().charAt(0).toUpperCase())}</span>
          <span><strong>${esc(w.brand)}</strong>${trustBadge(w.id)}</span></div>
        <div class="topbar-end">
          <label class="lang-select" title="${t("weaver_lang")}"><span aria-hidden="true">🗣️</span><span class="sr-only">${t("weaver_lang")}</span>
            <select id="w-lang-top">${VOICE_LANGS.map((l) => `<option value="${l.code}" ${l.code === w.lang ? "selected" : ""}>${l.name}</option>`).join("")}</select></label>
          <button class="link" id="sign-out">${t("sign_out")}</button>
        </div>
      </header>
      <nav class="icon-nav" aria-label="Weaver">
        <a href="#/weaver/home" ${active === "home" ? 'aria-current="page"' : ""}><span class="ic">🧺</span><span>${t("w_collections")}</span></a>
        <a href="#/weaver/new" class="nav-new" ${active === "new" ? 'aria-current="page"' : ""}><span class="ic">➕</span><span>${t("w_new")}</span></a>
        <a href="#/weaver/inbox" ${active === "inbox" ? 'aria-current="page"' : ""}><span class="ic">✉️${unread ? `<span class="count">${unread}</span>` : ""}</span><span>${t("w_inbox")}</span></a>
        <a href="#/weaver/results" ${active === "results" ? 'aria-current="page"' : ""}><span class="ic">📈</span><span>${t("w_results")}</span></a>
      </nav>
      <main id="view" class="view weaver-view" data-trust="${tr.score}"></main>`;
    $("#w-lang-top").onchange = (e) => { w.lang = e.target.value; Store.save(); route(); };
    $("#sign-out").onclick = () => { Store.signOut(); ui.draft = null; go("#/"); };
    return $("#view");
  }

  /* ============ weaver: home ============ */
  function viewWeaverHome(highlight) {
    const w = Store.weaver();
    const v = weaverShell("home");
    const tr = Store.trust(w.id);
    const mine = Store.byWeaver(w.id);
    const L = I18N.lang;
    const hello = `${t("hello")}, ${w.brand}`;
    v.innerHTML = `
      <section class="w-hello">
        <div class="w-hello-text">
          <h1>🙏 ${esc(hello)} ${sayBtn(hello)}</h1>
          <p class="muted">${tr.isNew ? t("new_maker_hint") : t("trust_hint")}</p>
          <a class="btn primary big" href="#/weaver/new">➕ ${t("w_new")}</a>
        </div>
        <div class="trust-ring" style="--p:${tr.score}" role="img" aria-label="${t("trust")} ${tr.score}/100">
          <div><strong>${tr.score}</strong><span>${t("trust")}</span></div>
        </div>
        <ul class="trust-steps" aria-label="${t("trust")}">
          <li class="${mine.length ? "done" : ""}">📢 ${t("trust_step_publish")}</li>
          <li class="${tr.accepted ? "done" : ""}">📦 ${t("trust_step_sample")}</li>
          <li class="${tr.paid ? "done" : ""}">🧾 ${t("trust_step_trial")}</li>
        </ul>
      </section>
      <section>
        <div class="section-head"><h2>🧺 ${t("w_collections")}</h2><span class="muted">🚀 ${t("boost_left").replace("{n}", w.boostCredits)}</span></div>
        ${mine.length ? `<div class="w-grid" id="w-grid"></div>` : `<div class="empty-big"><span>🧵</span><p>${t("no_collections")}</p><a class="btn primary big" href="#/weaver/new">➕ ${t("w_new")}</a></div>`}
      </section>`;
    const grid = $("#w-grid", v);
    for (const l of mine) {
      const d = textFor(l, L);
      const comp = AI.completeness(l);
      const views = Object.values(l.stats.views).reduce((a, b) => a + b, 0);
      const card = document.createElement("article");
      card.className = "w-card" + (highlight === l.id ? " flash" : "");
      card.innerHTML = `
        <div class="w-card-pic"></div>
        <div class="w-card-body">
          <h3>${esc(d.name)} ${sayBtn(`${d.name}. ${t("views")} ${views}. ${t("samples")} ${l.stats.samples}. ${t("trials")} ${l.stats.trials}.`)}</h3>
          <div class="mini-stats">
            <span title="${t("views")}">👁 <b>${views}</b></span>
            <span title="${t("samples")}">📦 <b>${l.stats.samples}</b></span>
            <span title="${t("trials")}">🧾 <b>${l.stats.trials}</b></span>
          </div>
          <div class="meter" title="${t("completeness")} ${comp.pct}%"><span style="width:${comp.pct}%"></span></div>
          <small class="muted">${t("completeness")} ${comp.pct}%</small>
          <div class="row wrap">
            ${l.boosted ? `<span class="tag boosted">🚀 ${t("boosted")}</span>` : `<button class="btn small secondary" data-boost="${l.id}" ${w.boostCredits ? "" : "disabled"}>🚀 ${t("boost")}</button>`}
            <a class="btn small ghost" href="#/c/${l.id}">🔗 ${t("open_shop_page")}</a>
            <button class="btn small ghost" data-ads="${l.id}">🖼️ ${t("ad_poster")}</button>
          </div>
        </div>`;
      $(".w-card-pic", card).append(Art.imageEl(l));
      grid.append(card);
    }
    for (const b of $$("[data-boost]", v)) b.onclick = () => { if (Store.boost(b.dataset.boost)) { toast("🚀 " + t("boosted")); viewWeaverHome(b.dataset.boost); } };
    for (const b of $$("[data-ads]", v)) b.onclick = () => openAdKit(Store.listing(b.dataset.ads));
  }

  /* Poster + video + WhatsApp for an already published collection. */
  function openAdKit(l) {
    const w = Store.weaver();
    const d = textFor(l, w.lang);
    const box = document.createElement("div");
    box.innerHTML = `<h2>🖼️ ${esc(d.name)}</h2><div class="ad-kit" id="kit"></div>`;
    openModal(box, "wide");
    renderAdKit($("#kit", box), l, d, w.lang, true);
  }

  /* ============ weaver: new collection (LoomVoice wizard) ============ */
  const STEPS = [["step_photo", "📷"], ["step_voice", "🎙️"], ["step_terms", "🧾"], ["step_review", "✨"], ["step_publish", "✅"]];

  function newDraft() {
    const w = Store.weaver();
    return { step: 0, image: null, palette: [], lang: w.lang, transcript: "", audio: null, attrs: null, terms: null, custom: null, published: null };
  }

  function viewNew() {
    const w = Store.weaver();
    if (!ui.draft || ui.draft.weaverId !== w.id) ui.draft = { ...newDraft(), weaverId: w.id };
    const D = ui.draft;
    const v = weaverShell("new");
    v.innerHTML = `
      <ol class="stepper-bar" aria-label="LoomVoice">${STEPS.map(([k, ic], n) => `
        <li class="${n < D.step ? "done" : n === D.step ? "now" : ""}" ${n === D.step ? 'aria-current="step"' : ""}>
          <button type="button" data-go="${n}" ${n > D.step ? "disabled" : ""}><span class="ic">${n < D.step ? "✓" : ic}</span><span class="lbl">${t(k)}</span></button></li>`).join("")}
      </ol>
      <section class="wizard" id="wizard"></section>`;
    for (const b of $$("[data-go]", v)) b.onclick = () => { D.step = +b.dataset.go; viewNew(); };
    [stepPhoto, stepVoice, stepTerms, stepReview, stepPublish][D.step]($("#wizard", v), D);
  }
  function next(D) { D.step += 1; viewNew(); }

  function stepPhoto(box, D) {
    box.innerHTML = `
      <h1>📷 ${t("take_photo")} ${sayBtn(t("take_photo"))}</h1>
      <div class="photo-step">
        <label class="drop big-drop" id="w-drop">
          <input type="file" accept="image/*" capture="environment" id="w-file" class="sr-only">
          ${D.image ? `<span class="drop-preview"></span>` : `<span class="drop-icon">📷</span><span>${t("take_photo")}</span>`}
        </label>
        <div class="photo-side">
          <p class="label">${t("demo_photos")}</p>
          <div class="demo-photos">${[0, 1, 2].map((n) => `<button type="button" data-demo="${n}" style="background-image:url('collection.jpg');background-position:${n * 50}% center" aria-label="Demo ${n + 1}"></button>`).join("")}</div>
          ${D.palette.length ? `<p class="label">🎨 ${t("colours_seen")}</p><div class="sw-row big">${D.palette.map((c) => swatch(c)).join("")}</div>` : ""}
          <button class="btn primary big wide" id="photo-next" ${D.image ? "" : "disabled"}>${t("next")} →</button>
        </div>
      </div>`;
    if (D.image) {
      const fake = { title: "", image: D.image };
      $(".drop-preview", box).append(Art.imageEl(fake));
    }
    const take = async (file) => {
      const { data, canvas } = await readImage(file, 900);
      D.image = { kind: "upload", data };
      D.palette = AI.paletteFromImage(canvas).map((p) => p.key);
      stepPhoto(box, D);
    };
    $("#w-file", box).onchange = (e) => e.target.files[0] && take(e.target.files[0]);
    const drop = $("#w-drop", box);
    drop.ondragover = (e) => { e.preventDefault(); drop.classList.add("over"); };
    drop.ondragleave = () => drop.classList.remove("over");
    drop.ondrop = (e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) take(f); };
    for (const b of $$("[data-demo]", box)) b.onclick = async () => {
      D.image = { kind: "photo", src: "collection.jpg", crop: +b.dataset.demo };
      const dr = await Art.loadDrawable({ image: D.image });
      D.palette = dr ? AI.paletteFromImage(dr).map((p) => p.key) : [];
      stepPhoto(box, D);
    };
    $("#photo-next", box).onclick = () => next(D);
  }

  function stepVoice(box, D) {
    const supported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    box.innerHTML = `
      <h1>🎙️ ${t("step_voice")} ${sayBtn(t("voice_hint"))}</h1>
      <p class="muted voice-hint">${t("voice_hint")}</p>
      <div class="voice-icons" aria-hidden="true"><span>🧶</span><span>🎨</span><span>📖</span><span>💰</span><span>📦</span><span>⏱</span></div>
      <div class="voice-step">
        <div class="voice-left">
          <label class="lang-select big">🗣️ <select id="v-lang" aria-label="${t("weaver_lang")}">${VOICE_LANGS.map((l) => `<option value="${l.code}" ${l.code === D.lang ? "selected" : ""}>${l.name}</option>`).join("")}</select></label>
          <button type="button" class="big-mic" id="v-mic" aria-label="${t("record")}"><span>🎙️</span></button>
          <p class="mic-label" id="v-state">${supported ? t("record") : t("no_voice_input")}</p>
          <button type="button" class="btn ghost small" id="v-sample">▶ ${t("sample_voice")}</button>
        </div>
        <div class="voice-right">
          <label class="label" for="v-text">📝 ${t("heard")} · <span class="muted">${t("type_instead")}</span></label>
          <textarea id="v-text" rows="7" lang="${D.lang}">${esc(D.transcript)}</textarea>
          ${D.audio ? `<audio controls src="${D.audio}"></audio>` : ""}
          <div class="row"><button class="btn primary big" id="v-next" ${D.transcript.trim() ? "" : "disabled"}>${t("next")} →</button></div>
        </div>
      </div>`;
    const ta = $("#v-text", box), nextBtn = $("#v-next", box), mic = $("#v-mic", box), state = $("#v-state", box);
    ta.oninput = () => { D.transcript = ta.value; nextBtn.disabled = !ta.value.trim(); };
    $("#v-lang", box).onchange = (e) => { D.lang = e.target.value; ta.lang = D.lang; };
    let mediaRec = null, chunks = [], stream = null;
    const stopAll = () => {
      if (ui.recognizer) ui.recognizer.stop();
      if (mediaRec && mediaRec.state !== "inactive") mediaRec.stop();
    };
    mic.onclick = async () => {
      if (mic.classList.contains("live")) { stopAll(); return; }
      const before = D.transcript ? D.transcript + " " : "";
      ui.recognizer = startListening(D.lang, (txt) => { D.transcript = before + txt; ta.value = D.transcript; nextBtn.disabled = false; }, () => {
        mic.classList.remove("live"); state.textContent = t("record"); ui.recognizer = null;
        if (mediaRec && mediaRec.state !== "inactive") mediaRec.stop();
      });
      if (!ui.recognizer) { toast(t("no_voice_input")); ta.focus(); return; }
      mic.classList.add("live"); state.textContent = t("listening") + " · " + t("stop");
      // Keep the maker's real voice too, so buyers can "hear the maker".
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRec = new MediaRecorder(stream); chunks = [];
        mediaRec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
        mediaRec.onstop = () => {
          stream.getTracks().forEach((tr) => tr.stop());
          const blob = new Blob(chunks, { type: mediaRec.mimeType || "audio/webm" });
          if (blob.size < 700000) { const fr = new FileReader(); fr.onload = () => { D.audio = fr.result; }; fr.readAsDataURL(blob); }
        };
        mediaRec.start();
      } catch { /* no recording; transcript still works */ }
    };
    $("#v-sample", box).onclick = () => {
      const lang = SAMPLE_VOICE[D.lang] ? D.lang : "en";
      if (lang !== D.lang) { D.lang = lang; $("#v-lang", box).value = lang; }
      D.transcript = SAMPLE_VOICE[lang];
      ta.value = D.transcript; nextBtn.disabled = false;
      speak(D.transcript, lang);
    };
    nextBtn.onclick = () => {
      stopAll();
      if (window.speechSynthesis) speechSynthesis.cancel();
      const m = AI.understandMaker(D.transcript);
      const colours = m.colours.length ? m.colours : D.palette.slice(0, 2);
      D.attrs = { garment: m.garment || "saree", fabric: m.fabric, colours, styles: m.styles, occasion: m.occasion };
      D.terms = {
        price: m.price || 1500, leadDays: m.leadDays || 14, capacity: m.capacity || null,
        minQty: m.minQty || 10, trialQty: 3
      };
      D.custom = null;
      next(D);
    };
  }

  /* Terms + the structured design card: everything is tap-to-change, nothing needs reading. */
  function stepTerms(box, D) {
    const A = D.attrs, T = D.terms, L = I18N.lang;
    const preview = () => ({ ...A, ...T, image: D.image, transcript: D.transcript });
    box.innerHTML = `
      <h1>🧾 ${t("step_terms")} ${sayBtn(t("terms_say"))}</h1>
      <div class="terms-grid">
        <div class="card-pane">
          <h2>🪪 ${t("design_card")}</h2>
          <p class="label">${t("garment")}</p>
          <div class="chips" id="g-chips">${Object.keys(LEX.garment).map((g) => `<button type="button" class="chip ${A.garment === g ? "on" : ""}" data-g="${g}">${GARMENT_ICON[g]} ${esc(AI.word("garment", g, L))}</button>`).join("")}</div>
          <p class="label">${t("fabric")}</p>
          <div class="chips">${Object.keys(LEX.fabric).map((f) => `<button type="button" class="chip ${A.fabric === f ? "on" : ""}" data-f="${f}">🧶 ${esc(AI.word("fabric", f, L))}</button>`).join("")}</div>
          <p class="label">${t("colours")}</p>
          <div class="sw-pick big">${Object.keys(LEX.colour).map((c) => `<button type="button" role="checkbox" data-c="${c}" style="--c:${Art.hex(c)}" aria-checked="${A.colours.includes(c)}" aria-label="${esc(AI.word("colour", c, L))}" title="${esc(AI.word("colour", c, L))}"></button>`).join("")}</div>
          <p class="label">${t("style")}</p>
          <div class="chips">${Object.keys(LEX.style).map((s) => `<button type="button" class="chip ${A.styles.includes(s) ? "on" : ""}" data-s="${s}">✨ ${esc(AI.word("style", s, L))}</button>`).join("")}</div>
          <div class="meter big" id="comp-meter"><span></span></div>
          <p class="muted" id="comp-label"></p>
        </div>
        <div class="terms-pane">
          <div class="term"><span class="term-ic">💰</span><span class="term-l">${t("price")}</span>${stepper("tp", T.price, 100, 200000, 50, "₹")}</div>
          <div class="term"><span class="term-ic">🧪</span><span class="term-l">${t("sample_pieces")}</span>${stepper("tt", T.trialQty, 1, 20)}</div>
          <div class="term"><span class="term-ic">📦</span><span class="term-l">${t("min_order")}</span>${stepper("tm", T.minQty, 1, 500)}</div>
          <div class="term"><span class="term-ic">⏱</span><span class="term-l">${t("lead_time")}</span>${stepper("tl", T.leadDays, 1, 120)}</div>
          <button class="btn primary big wide" id="terms-next">✨ ${t("make_my_ad")} →</button>
        </div>
      </div>`;
    const refresh = () => {
      const c = AI.completeness(preview());
      $("#comp-meter span", box).style.width = c.pct + "%";
      $("#comp-label", box).textContent = `${t("completeness")} ${c.pct}%${c.missing.length ? " · " + c.missing.map((k) => t(k === "colours" ? "colours" : k)).join(", ") : " ✓"}`;
    };
    const toggle = (arr, v) => { const i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else arr.push(v); };
    for (const b of $$("[data-g]", box)) b.onclick = () => { A.garment = b.dataset.g; $$("[data-g]", box).forEach((x) => x.classList.toggle("on", x === b)); refresh(); };
    for (const b of $$("[data-f]", box)) b.onclick = () => { A.fabric = A.fabric === b.dataset.f ? null : b.dataset.f; $$("[data-f]", box).forEach((x) => x.classList.toggle("on", x.dataset.f === A.fabric)); refresh(); };
    for (const b of $$("[data-c]", box)) b.onclick = () => { toggle(A.colours, b.dataset.c); b.setAttribute("aria-checked", String(A.colours.includes(b.dataset.c))); refresh(); };
    for (const b of $$("[data-s]", box)) b.onclick = () => { toggle(A.styles, b.dataset.s); b.classList.toggle("on", A.styles.includes(b.dataset.s)); refresh(); };
    bindSteppers(box, (id, v) => { T[{ tp: "price", tt: "trialQty", tm: "minQty", tl: "leadDays" }[id]] = v; refresh(); });
    $("#terms-next", box).onclick = () => {
      if (!A.colours.length) { toast("🎨 " + t("colours")); return; }
      D.custom = null; next(D);
    };
    refresh();
  }

  function draftListing(D) {
    const w = Store.weaver();
    return {
      id: D.published || Store.uid("l_"), weaverId: w.id, brand: w.brand,
      ...D.attrs, ...D.terms, image: D.image, transcript: D.transcript, transcriptLang: D.lang,
      audio: D.audio, custom: D.custom, published: false, boosted: false, createdAt: Date.now(),
      stats: { views: { search: 0, feed: 0, link: 0 }, samples: 0, trials: 0 }
    };
  }

  function stepReview(box, D) {
    const L = I18N.lang;
    const l = draftListing(D);
    const auto = AI.draft(l, L);
    if (!D.custom) D.custom = { lang: L, name: auto.name, story: auto.story };
    l.custom = D.custom;
    const d = { ...auto, name: D.custom.name, story: D.custom.story };
    box.innerHTML = `
      <h1>✨ ${t("step_review")} ${sayBtn(`${d.name}. ${d.story}`)}</h1>
      <p class="muted">${t("review_hint")}</p>
      <div class="ad-kit" id="kit"></div>
      <div class="edit-texts">
        <label class="field">🏷️ ${t("collection_name")} ${sayBtn(d.name)}<input id="e-name" value="${esc(d.name)}"></label>
        <label class="field">📖 ${t("maker_story")} ${sayBtn(d.story)}<textarea id="e-story" rows="3">${esc(d.story)}</textarea></label>
        ${L !== "en" ? `<p class="hint">🌐 ${t("buyers_see_own_lang")}</p>` : ""}
      </div>
      <div class="row end"><button class="btn primary big" id="review-next">✅ ${t("looks_good")} →</button></div>`;
    renderAdKit($("#kit", box), l, d, L, false);
    let tm;
    const upd = () => {
      D.custom.name = $("#e-name", box).value; D.custom.story = $("#e-story", box).value;
      clearTimeout(tm); tm = setTimeout(() => stepReview(box, D), 900);
    };
    $("#e-name", box).onchange = upd; $("#e-story", box).onchange = upd;
    $("#review-next", box).onclick = () => next(D);
  }

  /* Poster, video ad, WhatsApp caption, shop pitch and product page — each one listenable. */
  function renderAdKit(box, l, d, lang, published) {
    const L = I18N.uiLang(lang);
    box.innerHTML = `
      <div class="kit-tabs" role="tablist">
        ${[["poster", "🖼️", "ad_poster"], ["video", "🎬", "ad_video"], ["wa", "💬", "ad_whatsapp"], ["pitch", "🏬", "ad_pitch"], ["page", "📄", "ad_page"]]
          .map(([k, ic, lbl], n) => `<button role="tab" data-kit="${k}" aria-selected="${n === 0}"><span>${ic}</span>${t(lbl)}</button>`).join("")}
      </div>
      <div class="kit-pane" data-pane="poster"><canvas class="poster" aria-label="${t("ad_poster")}"></canvas>
        <div class="row"><button class="btn ghost small" data-dl="poster">⬇ ${t("download")}</button></div></div>
      <div class="kit-pane" data-pane="video" hidden><canvas class="video" aria-label="${t("ad_video")}"></canvas>
        <div class="row"><button class="btn ghost small" data-play>▶ ${t("play")}</button><button class="btn ghost small" data-dl="video">⬇ ${t("download")}</button></div></div>
      <div class="kit-pane" data-pane="wa" hidden>
        <div class="phone"><div class="wa-top">💬 WhatsApp</div><div class="wa-bubble"><div class="wa-img"></div><p>${esc(d.whatsapp).replace(/\n/g, "<br>")}${published ? `<br><span class="wa-link">${esc(shareLink(l.id))}</span>` : ""}</p></div></div>
        <div class="row">${sayBtn(d.whatsapp.replace(/[🧵🙏]/g, ""), lang)}${published ? `<a class="btn small primary" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(d.whatsapp + "\n" + shareLink(l.id))}">💬 ${t("share_wa")}</a>` : ""}</div></div>
      <div class="kit-pane" data-pane="pitch" hidden>
        <blockquote class="pitch">${esc(d.pitch)}</blockquote>
        <div class="row">${sayBtn(d.pitch, lang)}</div>
        <p class="hint">${t("pitch_hint")}</p></div>
      <div class="kit-pane" data-pane="page" hidden><div class="mini-page"></div></div>`;
    for (const tab of $$("[data-kit]", box)) tab.onclick = () => {
      for (const x of $$("[data-kit]", box)) x.setAttribute("aria-selected", String(x === tab));
      for (const p of $$("[data-pane]", box)) p.hidden = p.dataset.pane !== tab.dataset.kit;
      if (tab.dataset.kit === "video") vid.play(); else vid.stop();
    };
    const poster = $("canvas.poster", box);
    Art.drawPoster(poster, l, d, L);
    const vid = Art.videoAd($("canvas.video", box), l, d, L);
    ui.cleanups.push(() => vid.stop());
    $(".wa-img", box).append(Art.imageEl(l));
    const mini = $(".mini-page", box);
    mini.innerHTML = listingDetailHTML(l, L);
    $(".listing-pic", mini).append(Art.imageEl(l));
    $("#actions", mini).innerHTML = `<span class="btn primary small">📦 ${t("request_sample")}</span><span class="btn secondary small">🧾 ${t("order_trial")}</span>`;
    for (const id of ["actions", "orig", "toggle-orig"]) { const el = $(`#${id}`, mini); if (el) el.removeAttribute("id"); }
    $("[data-play]", box).onclick = () => vid.play();
    for (const b of $$("[data-dl]", box)) b.onclick = async () => {
      const name = (l.brand + "-" + d.name).replace(/[^\p{L}\p{N}]+/gu, "-").slice(0, 60);
      try {
        if (b.dataset.dl === "poster") {
          poster.toBlob((blob) => blob ? download(blob, name + ".png") : toast(t("need_server")), "image/png");
        } else {
          b.disabled = true; b.textContent = "⏺ …";
          const blob = await vid.record();
          download(blob, name + ".webm");
          b.disabled = false; b.textContent = "⬇ " + t("download");
        }
      } catch {
        b.disabled = false; b.textContent = "⬇ " + t("download");
        toast(t("need_server"));
      }
    };
  }

  function stepPublish(box, D) {
    const L = I18N.lang;
    if (D.published) return publishedPanel(box, Store.listing(D.published));
    const l = draftListing(D);
    const d = textFor({ ...l, custom: D.custom }, L);
    box.innerHTML = `
      <h1>✅ ${t("step_publish")} ${sayBtn(t("approve_say"))}</h1>
      <div class="publish-grid">
        <canvas class="poster small" aria-label="${t("ad_poster")}"></canvas>
        <div>
          <ul class="checklist">
            <li>🖼️ ${t("ad_poster")} ✓</li><li>🎬 ${t("ad_video")} ✓</li><li>💬 ${t("ad_whatsapp")} ✓</li><li>🏬 ${t("ad_pitch")} ✓</li><li>📄 ${t("ad_page")} ✓</li>
          </ul>
          <p class="muted">🏷️ ${t("published_as")} <strong>${esc(l.brand)}</strong></p>
          <button class="btn primary huge wide" id="approve">✓ ${t("approve_publish")}</button>
        </div>
      </div>`;
    Art.drawPoster($("canvas", box), l, d, L);
    $("#approve", box).onclick = () => {
      l.published = true;
      l.title = AI.draft(l, "en").name;
      if (!Store.publish(l)) {
        // Storage full (large photo + audio): keep the listing without the recording.
        l.audio = null; Store.publish(l);
      }
      D.published = l.id;
      publishedPanel(box, l);
      $$(".stepper-bar li").forEach((li) => { li.classList.add("done"); li.classList.remove("now"); });
    };
  }

  function publishedPanel(box, l) {
    const w = Store.weaver();
    const d = textFor(l, w.lang);
    const link = shareLink(l.id);
    const matches = Object.values(Store.state.buyers).filter((b) => b.saved.some((s) => AI.scoreListing(l, AI.understand(s.text), "en").score >= 65)).length;
    box.innerHTML = `
      <div class="published">
        <div class="burst">🎉</div>
        <h1>${t("published")} ${sayBtn(t("published") + ". " + d.name)}</h1>
        <p class="muted">🏷️ ${esc(w.brand)} · ${esc(d.name)}</p>
        ${matches ? `<p class="reach">✨ ${t("shown_to_shops").replace("{n}", matches)}</p>` : ""}
        <div class="share-row">
          <input readonly value="${esc(link)}" aria-label="${t("copy_link")}" id="pub-link">
          <button class="btn secondary" id="copy">📋 ${t("copy_link")}</button>
          <a class="btn primary" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(d.whatsapp + "\n" + link)}">💬 ${t("share_wa")}</a>
        </div>
        <div class="ad-kit" id="kit"></div>
        <div class="row center">
          <a class="btn ghost" href="#/c/${l.id}">🔗 ${t("open_shop_page")}</a>
          <button class="btn ghost" id="another">➕ ${t("w_new")}</button>
          <a class="btn ghost" href="#/weaver/home">🧺 ${t("w_collections")}</a>
        </div>
      </div>`;
    renderAdKit($("#kit", box), l, d, w.lang, true);
    $("#copy", box).onclick = async () => {
      try { await navigator.clipboard.writeText(link); } catch { $("#pub-link", box).select(); document.execCommand("copy"); }
      toast("📋 " + t("copied"));
    };
    $("#another", box).onclick = () => { ui.draft = null; viewNew(); };
  }

  /* ============ weaver: inbox ============ */
  function viewInbox() {
    const w = Store.weaver();
    const v = weaverShell("inbox");
    const msgs = Store.inbox(w.id);
    const L = I18N.lang;
    v.innerHTML = `<section class="page-head"><h1>✉️ ${t("w_inbox")}</h1></section>
      ${msgs.length ? `<ul class="inbox">${msgs.map((m) => {
        const l = Store.listing(m.listingId);
        const name = l ? textFor(l, L).name : "";
        const say = [t(TYPE_KEY[m.type]), m.buyerName, m.qty ? `${m.qty} ${t("pieces")}` : "", (m.changes || []).map(t).join(", "), (m.layers || []).map((x) => t(x.k)).join(", ")].filter(Boolean).join(". ");
        return `<li class="in-msg ${m.status}">
          <div class="in-icon">${TYPE_ICON[m.type]}</div>
          <div class="in-body">
            <p class="in-title"><strong>${t(TYPE_KEY[m.type])}</strong> ${sayBtn(say)}</p>
            <p class="in-from">🏬 ${esc(m.buyerName)} · ${esc(name)}</p>
            <div class="in-facts">
              ${m.qty ? `<span class="fact">📦 ${m.qty}</span>` : ""}
              ${m.amount ? `<span class="fact paid">💰 ${money(m.amount)} ✓</span>` : ""}
              ${(m.changes || []).map((c) => `<span class="fact">${(CHANGES.find((x) => x[0] === c) || [])[1] || ""} ${t(c)}</span>`).join("")}
            </div>
            ${m.type === "idea" ? `<div class="idea">
              ${m.image ? `<img src="${m.image}" alt="${t("send_idea")}">` : l ? `<div class="idea-pic" data-pic="${l.id}"></div>` : ""}
              <ul>${(m.layers || []).map((x) => `<li>${x.c ? swatch(x.c) : ""} ${t(x.k)}${x.c ? ` · ${esc(AI.word("colour", x.c, L))}` : ""}</li>`).join("")}
              ${(m.pins || []).map((p) => `<li><span class="pin-n">${p.n}</span> ${esc(p.note || "📍")}</li>`).join("")}</ul></div>` : ""}
            ${m.note ? `<p class="in-note" lang="${esc(m.buyerLang)}">“${esc(m.note)}” <span class="muted">(${esc(I18N.langName(m.buyerLang))})</span> ${sayBtn(m.note, m.buyerLang)}</p>` : ""}
            ${m.reply ? `<p class="reply">↩ ${esc(m.reply)}</p>` : ""}
            ${m.type !== "trial" && m.status === "new" ? `<div class="row">
              <button class="btn primary small" data-accept="${m.id}">✓ ${t("accept")}</button>
              <button class="btn ghost small" data-reply="${m.id}">🎙️ ${t("reply")}</button></div>` : `<span class="status ${m.status}">${t("status_" + m.status)}</span>`}
          </div>
        </li>`;
      }).join("")}</ul>` : `<div class="empty-big"><span>✉️</span><p>${t("inbox_empty")}</p></div>`}`;
    for (const p of $$("[data-pic]", v)) p.append(Art.imageEl(Store.listing(p.dataset.pic)));
    for (const b of $$("[data-accept]", v)) b.onclick = () => { Store.setStatus(b.dataset.accept, "accepted", "✓ " + t("status_accepted")); toast("✓"); viewInbox(); };
    for (const b of $$("[data-reply]", v)) b.onclick = () => replyDialog(b.dataset.reply);
    msgs.forEach((m) => { if (m.type === "trial") m.seen = true; });
    Store.save();
  }

  function replyDialog(id) {
    const w = Store.weaver();
    const box = document.createElement("div");
    box.innerHTML = `<h2>🎙️ ${t("reply")}</h2>
      <button type="button" class="big-mic" id="r-mic" aria-label="${t("record")}"><span>🎙️</span></button>
      <label class="field">${t("type_instead")}<textarea id="r-text" rows="3" lang="${w.lang}"></textarea></label>
      <button class="btn primary wide" id="r-send">${t("send")} →</button>`;
    openModal(box);
    $("#r-mic", box).onclick = () => {
      const mic = $("#r-mic", box);
      if (ui.recognizer) { ui.recognizer.stop(); return; }
      ui.recognizer = startListening(w.lang, (txt) => { $("#r-text", box).value = txt; }, () => { mic.classList.remove("live"); ui.recognizer = null; });
      if (!ui.recognizer) { toast(t("no_voice_input")); return; }
      mic.classList.add("live");
    };
    ui.cleanups.push(() => { if (ui.recognizer) ui.recognizer.stop(); });
    $("#r-send", box).onclick = () => {
      const txt = $("#r-text", box).value.trim();
      if (!txt) return;
      Store.setStatus(id, "accepted", txt);
      closeModal(); toast("✓ " + t("sent")); viewInbox();
    };
  }

  /* ============ weaver: results ============ */
  function viewResults() {
    const w = Store.weaver();
    const v = weaverShell("results");
    const mine = Store.byWeaver(w.id).filter((l) => l.published);
    const L = I18N.lang;
    const sum = (f) => mine.reduce((a, l) => a + f(l), 0);
    const views = sum((l) => Object.values(l.stats.views).reduce((a, b) => a + b, 0));
    const samples = sum((l) => l.stats.samples);
    const trials = sum((l) => l.stats.trials);
    const revenue = Store.inbox(w.id).filter((m) => m.type === "trial").reduce((a, m) => a + (m.amount || 0), 0);
    const max = Math.max(1, ...mine.map((l) => Object.values(l.stats.views).reduce((a, b) => a + b, 0)));
    const srcLabel = { search: t("from_search"), feed: t("from_feed"), link: t("from_link") };
    v.innerHTML = `
      <section class="page-head"><h1>📈 ${t("w_results")} ${sayBtn(`${t("views")} ${views}. ${t("samples")} ${samples}. ${t("trials")} ${trials}.`)}</h1></section>
      <section class="stat-tiles">
        <div class="tile"><span class="tile-ic">👁</span><strong>${views}</strong><span>${t("views")}</span></div>
        <div class="tile"><span class="tile-ic">📦</span><strong>${samples}</strong><span>${t("samples")}</span><small>${t("interest")}</small></div>
        <div class="tile strong"><span class="tile-ic">🧾</span><strong>${trials}</strong><span>${t("trials")}</span><small>${t("real_demand")}</small></div>
        <div class="tile"><span class="tile-ic">💰</span><strong>${money(revenue)}</strong><span>${t("trial_income")}</span></div>
      </section>
      <p class="note">💡 ${t("sample_note")}</p>
      ${mine.length ? `
      <section class="funnels">
        <div class="section-head"><h2>${t("where_views")}</h2>
          <ul class="legend">${Object.entries(SOURCE_COLOURS).map(([k, c]) => `<li><span class="key" style="--c:${c}"></span>${srcLabel[k]}</li>`).join("")}</ul></div>
        <table class="sr-only"><caption>${t("where_views")}</caption><thead><tr><th>${t("collection_name")}</th>${Object.keys(SOURCE_COLOURS).map((k) => `<th>${srcLabel[k]}</th>`).join("")}<th>${t("samples")}</th><th>${t("trials")}</th></tr></thead>
          <tbody>${mine.map((l) => `<tr><td>${esc(textFor(l, L).name)}</td>${Object.keys(SOURCE_COLOURS).map((k) => `<td>${l.stats.views[k] || 0}</td>`).join("")}<td>${l.stats.samples}</td><td>${l.stats.trials}</td></tr>`).join("")}</tbody></table>
        <ul class="funnel-list" aria-hidden="true">${mine.map((l) => {
          const tot = Object.values(l.stats.views).reduce((a, b) => a + b, 0);
          return `<li class="funnel">
            <div class="f-pic" data-pic="${l.id}"></div>
            <div class="f-main">
              <p class="f-name">${esc(textFor(l, L).name)}</p>
              <div class="f-bar" style="width:${Math.max(4, (tot / max) * 100)}%">${Object.entries(SOURCE_COLOURS).map(([k, c]) => {
                const n = l.stats.views[k] || 0;
                return n ? `<span class="seg-${k}" style="flex:${n};--c:${c}" data-tip="${srcLabel[k]}: ${n}"></span>` : "";
              }).join("")}</div>
              <p class="f-nums"><span>👁 ${tot}</span><span>→ 📦 ${l.stats.samples}</span><span>→ 🧾 <b>${l.stats.trials}</b></span>
                <span class="muted">${tot ? Math.round((l.stats.samples / tot) * 100) : 0}% ${t("asked_sample")}</span></p>
            </div>
          </li>`;
        }).join("")}</ul>
      </section>` : `<div class="empty-big"><span>📈</span><p>${t("no_collections")}</p></div>`}`;
    for (const p of $$("[data-pic]", v)) p.append(Art.imageEl(Store.listing(p.dataset.pic)));
    // Hover/tap tooltip for each bar segment.
    const tip = document.createElement("div");
    tip.className = "tip"; tip.hidden = true; v.append(tip);
    for (const s of $$("[data-tip]", v)) {
      const show = (e) => { tip.textContent = s.dataset.tip; tip.hidden = false; const r = s.getBoundingClientRect(); tip.style.left = r.left + r.width / 2 + scrollX + "px"; tip.style.top = r.top + scrollY - 8 + "px"; e && e.stopPropagation(); };
      s.onpointerenter = show; s.onclick = show;
      s.onpointerleave = () => { tip.hidden = true; };
    }
  }

  /* ============ boot: two seconds of loom, then the site ============ */
  function boot() {
    const splash = $("#splash");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(() => {
      splash.classList.add("leaving");
      app.hidden = false;
      route();
      setTimeout(() => splash.remove(), 450);
    }, reduce ? 600 : 2000);
  }
  boot();
})();
