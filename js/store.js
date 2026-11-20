/* Demo data store. Everything lives in this browser's localStorage so the buyer and weaver
   portals can talk to each other in a single-browser demo. A real deployment replaces this
   module with API calls; the rest of the app only uses the functions exported here. */

const Store = (() => {
  const KEY = "loombloom.v1";
  const uid = (p) => p + Math.random().toString(36).slice(2, 9);
  const daysAgo = (n) => Date.now() - n * 86400000;

  const SEED_WEAVERS = [
    { id: "w_sharada", brand: "Sharada Handlooms", lang: "kn", place: "Ilkal, Karnataka" },
    { id: "w_bagru", brand: "Neel Bagru Collective", lang: "hi", place: "Bagru, Rajasthan" },
    { id: "w_shantipur", brand: "Shantipur Tant Ghar", lang: "bn", place: "Shantipur, West Bengal" },
    { id: "w_pochampally", brand: "Pochampally Ikat Sangha", lang: "te", place: "Pochampally, Telangana" },
    { id: "w_gadwal", brand: "Gadwal Weavers Circle", lang: "te", place: "Gadwal, Telangana" },
    { id: "w_kanchi", brand: "Kanchi Pattu Weavers", lang: "ta", place: "Kanchipuram, Tamil Nadu" },
    { id: "w_chanderi", brand: "Chanderi Kaarigar", lang: "hi", place: "Chanderi, Madhya Pradesh" },
    { id: "w_ponduru", brand: "Ponduru Khadi Sangham", lang: "te", place: "Ponduru, Andhra Pradesh" },
    { id: "w_kalam", brand: "Kalahasti Kalamkari House", lang: "te", place: "Srikalahasti, Andhra Pradesh" },
    { id: "w_mangalagiri", brand: "Mangalagiri Loom Co-op", lang: "te", place: "Mangalagiri, Andhra Pradesh" },
    { id: "w_bhagalpur", brand: "Bhagalpur Tussar Works", lang: "hi", place: "Bhagalpur, Bihar" }
  ];

  // [id, weaver, garment, fabric, colours, styles, occasion, price, minQty, trialQty, leadDays, capacity, image, transcript, stats(views s/f/l, samples, trials), age]
  const SEED_LISTINGS = [
    ["l_ilkal", "w_sharada", "saree", "cotton", ["red", "gold"], ["ilkal", "zari"], "festive", 2450, 10, 3, 12, 30, { kind: "photo", src: "collection.jpg", crop: 0 },
      "ಇದು ನಮ್ಮ ಇಳಕಲ್ ಹತ್ತಿ ಸೀರೆ. ಕೆಂಪು ಬಣ್ಣ, ಚಿನ್ನದ ಜರಿ ಅಂಚು. ನನ್ನ ಅಮ್ಮನಿಂದ ಕಲಿತ ನೇಯ್ಗೆ. ಒಂದು ಸೀರೆ 2450 ರೂಪಾಯಿ. ತಿಂಗಳಿಗೆ 30 ಸೀರೆ ಮಾಡಬಹುದು. 12 ದಿನದಲ್ಲಿ ಕಳುಹಿಸುತ್ತೇನೆ.", [64, 41, 22, 9, 3], 14],
    ["l_ilkal2", "w_sharada", "saree", "cotton", ["black", "red"], ["ilkal", "temple"], "festive", 2600, 10, 3, 14, 24, { kind: "svg" },
      "ಕಪ್ಪು ಮತ್ತು ಕೆಂಪು ಇಳಕಲ್ ಸೀರೆ, ಗೋಪುರ ಅಂಚು. 2600 ರೂಪಾಯಿ.", [22, 13, 4, 3, 0], 4],
    ["l_bagru", "w_bagru", "kurta", "cotton", ["indigo", "cream"], ["blockprint", "floral"], "daily", 1690, 20, 5, 10, 80, { kind: "photo", src: "collection.jpg", crop: 1 },
      "यह हमारा नील बगरू ब्लॉक प्रिंट सूती कुर्ता है। हाथ से छपाई, प्राकृतिक नील। 1690 रुपये। महीने में 80 कुर्ते। 10 दिन में तैयार।", [88, 52, 30, 14, 6], 20],
    ["l_shantipur", "w_shantipur", "dupatta", "cotton", ["pink", "mustard"], ["stripes", "tassels"], "daily", 1150, 15, 3, 8, 60, { kind: "photo", src: "collection.jpg", crop: 2 },
      "এটা আমাদের শান্তিপুরের সুতি ওড়না। গোলাপি আর সরষে রঙের ডোরা, ঝালর সহ। ১১৫০ টাকা। ৮ দিনে তৈরি।", [51, 30, 12, 6, 2], 9],
    ["l_ikat", "w_pochampally", "saree", "silk", ["black", "blue", "indigo"], ["ikat"], "party", 6200, 5, 2, 21, 12, { kind: "svg" },
      "ఇది మా పోచంపల్లి ఇక్కత్ పట్టు చీర. నలుపు నీలం రంగులు. 6200 రూపాయలు. 21 రోజుల్లో సిద్ధం.", [70, 38, 19, 7, 2], 30],
    ["l_checks", "w_gadwal", "saree", "cotton", ["blue", "black", "gold"], ["checks", "zari"], "daily", 2350, 10, 3, 14, 40, { kind: "svg" },
      "నీలం నలుపు గడుల నూలు చీర, జరీ అంచు. 2350 రూపాయలు. నెలకు 40 చీరలు. 14 రోజులు.", [33, 26, 9, 4, 1], 6],
    ["l_kanchi", "w_kanchi", "saree", "silk", ["green", "gold"], ["kanjeevaram", "temple", "zari"], "wedding", 14500, 3, 1, 30, 6, { kind: "svg" },
      "இது எங்கள் காஞ்சிபுரம் பட்டுப் புடவை. பச்சை நிறம், தங்க ஜரிகை கோயில் பார்டர். 14500 ரூபாய். 30 நாட்கள்.", [95, 60, 41, 11, 4], 40],
    ["l_jamdani", "w_shantipur", "saree", "muslin", ["white", "grey"], ["jamdani", "buta"], "festive", 4800, 6, 2, 20, 10, { kind: "svg" },
      "সাদা মসলিন জামদানি শাড়ি, ধূসর বুটি। ৪৮০০ টাকা। ২০ দিন।", [29, 18, 6, 2, 1], 12],
    ["l_chanderi", "w_chanderi", "dupatta", "silkcotton", ["peach", "gold"], ["buta", "zari"], "festive", 1850, 10, 3, 12, 50, { kind: "svg" },
      "चंदेरी सिल्क-कॉटन दुपट्टा, पीच रंग, ज़री बूटे। 1850 रुपये। 12 दिन।", [40, 22, 11, 5, 2], 16],
    ["l_khadi", "w_ponduru", "kurta", "khadi", ["cream", "brown"], ["plain"], "daily", 1450, 25, 5, 9, 70, { kind: "svg" },
      "పొందూరు ఖాదీ కుర్తా, క్రీమ్ రంగు. 1450 రూపాయలు. 9 రోజులు.", [26, 15, 7, 3, 1], 10],
    ["l_kalam", "w_kalam", "stole", "cotton", ["mustard", "black"], ["kalamkari", "tassels"], "daily", 950, 20, 5, 7, 120, { kind: "svg" },
      "శ్రీకాళహస్తి కలంకారి నూలు స్టోల్. ఆవ, నలుపు రంగులు. 950 రూపాయలు. 7 రోజులు.", [18, 9, 3, 1, 0], 3],
    ["l_mangalagiri", "w_mangalagiri", "saree", "cotton", ["yellow", "green"], ["zari", "plain"], "festive", 1950, 12, 3, 10, 45, { kind: "svg" },
      "మంగళగిరి నూలు చీర, పసుపు ఆకుపచ్చ, జరీ అంచు. 1950 రూపాయలు. 10 రోజులు.", [37, 21, 10, 4, 1], 18],
    ["l_tussar", "w_bhagalpur", "saree", "tussar", ["beige", "maroon"], ["stripes"], "festive", 3900, 8, 2, 15, 20, { kind: "svg" },
      "भागलपुरी टसर साड़ी, बेज रंग, मैरून धारियाँ। 3900 रुपये। 15 दिन।", [44, 25, 8, 3, 1], 22]
  ];

  function seed() {
    const weavers = {};
    for (const w of SEED_WEAVERS) weavers[w.id] = { ...w, createdAt: daysAgo(120), boostCredits: 2, seeded: true };
    const listings = SEED_LISTINGS.map(([id, wid, garment, fabric, colours, styles, occasion, price, minQty, trialQty, leadDays, capacity, image, transcript, st, age]) => {
      const w = weavers[wid];
      const l = { id, weaverId: wid, brand: w.brand, garment, fabric, colours, styles, occasion, price, minQty, trialQty, leadDays, capacity, image, transcript, transcriptLang: w.lang, published: true, boosted: id === "l_checks", createdAt: daysAgo(age), stats: { views: { search: st[0], feed: st[1], link: st[2] }, samples: st[3], trials: st[4] } };
      l.title = AI.draft(l, "en").name;
      return l;
    });
    const buyers = {
      b_kaveri: { id: "b_kaveri", name: "Kaveri Boutique", type: "shop", gstin: "", prefLang: "en", saved: [{ id: "s1", text: "handloom cotton saree with zari border under ₹3000", createdAt: daysAgo(6) }] }
    };
    const messages = [
      { id: uid("m"), listingId: "l_ilkal", weaverId: "w_sharada", buyerId: "b_kaveri", buyerName: "Kaveri Boutique", buyerLang: "en", type: "sample", qty: 3, note: "Love the border. Can we see 3 pieces before Sankranti stock?", status: "new", at: daysAgo(1) },
      { id: uid("m"), listingId: "l_ilkal", weaverId: "w_sharada", buyerId: "b_kaveri", buyerName: "Kaveri Boutique", buyerLang: "en", type: "alter", changes: ["ch_border", "ch_blouse"], qty: 20, note: "A wider gold border would sell better here.", status: "new", at: daysAgo(2) },
      { id: uid("m"), listingId: "l_ilkal", weaverId: "w_sharada", buyerId: "b_demo_other", buyerName: "Meera Textiles, Hubballi", buyerLang: "kn", type: "trial", qty: 3, amount: 7350, note: "", status: "paid", at: daysAgo(5) }
    ];
    return { v: 1, session: null, uiLang: "en", weavers, buyers, listings, messages };
  }

  let state;
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      state = raw ? JSON.parse(raw) : seed();
    } catch {
      state = seed();
    }
    if (!state || state.v !== 1) state = seed();
    return state;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); return true; }
    catch { return false; } // storage full or blocked: the demo keeps working in memory
  }
  function reset() { state = seed(); save(); }

  load();

  return {
    get state() { return state; },
    save, reset, uid,

    /* session & language */
    setLang(code) { state.uiLang = code; save(); },
    session() { return state.session; },
    signOut() { state.session = null; save(); },

    /* buyers */
    loginBuyer({ name, type, gstin, prefLang }) {
      let b = Object.values(state.buyers).find((x) => x.name.toLowerCase() === name.trim().toLowerCase());
      if (!b) { b = { id: uid("b_"), name: name.trim(), type, gstin, prefLang, saved: [] }; state.buyers[b.id] = b; }
      Object.assign(b, { type, gstin: gstin || b.gstin, prefLang });
      state.session = { role: "buyer", id: b.id };
      save();
      return b;
    },
    buyer(id = state.session && state.session.id) { return state.buyers[id]; },
    saveRequest(text) {
      const b = this.buyer();
      if (!b.saved.some((s) => s.text === text)) b.saved.unshift({ id: uid("s"), text, createdAt: Date.now() });
      save();
    },
    removeRequest(id) { const b = this.buyer(); b.saved = b.saved.filter((s) => s.id !== id); save(); },

    /* weavers */
    loginWeaver({ brand, lang }) {
      let w = Object.values(state.weavers).find((x) => x.brand.toLowerCase() === brand.trim().toLowerCase());
      if (!w) { w = { id: uid("w_"), brand: brand.trim(), lang, createdAt: Date.now(), boostCredits: 2 }; state.weavers[w.id] = w; }
      w.lang = lang;
      state.session = { role: "weaver", id: w.id };
      save();
      return w;
    },
    weaver(id = state.session && state.session.id) { return state.weavers[id]; },

    /* listings */
    published() { return state.listings.filter((l) => l.published); },
    listing(id) { return state.listings.find((l) => l.id === id); },
    byWeaver(wid) { return state.listings.filter((l) => l.weaverId === wid).sort((a, b) => b.createdAt - a.createdAt); },
    publish(l) {
      const existing = state.listings.findIndex((x) => x.id === l.id);
      if (existing >= 0) state.listings[existing] = l; else state.listings.unshift(l);
      return save();
    },
    view(id, source) {
      const l = this.listing(id);
      if (!l) return;
      const key = source === "link" ? "link" : source === "feed" ? "feed" : "search";
      l.stats.views[key] = (l.stats.views[key] || 0) + 1;
      save();
    },
    boost(id) {
      const l = this.listing(id);
      const w = state.weavers[l.weaverId];
      if (l.boosted || w.boostCredits <= 0) return false;
      l.boosted = true; w.boostCredits -= 1; save();
      return true;
    },

    /* messages: contact | sample | trial | alter | idea */
    send(msg) {
      const l = this.listing(msg.listingId);
      const b = this.buyer();
      const m = { id: uid("m"), weaverId: l.weaverId, buyerId: b.id, buyerName: b.name, buyerLang: b.prefLang, status: msg.type === "trial" ? "paid" : "new", at: Date.now(), ...msg };
      state.messages.unshift(m);
      if (m.type === "sample") l.stats.samples += 1;
      if (m.type === "trial") l.stats.trials += 1;
      if (!save()) {
        // Too big for storage (e.g. a large idea image): keep the request, drop the picture.
        delete m.image; save();
      }
      return m;
    },
    inbox(wid) { return state.messages.filter((m) => m.weaverId === wid).sort((a, b) => b.at - a.at); },
    outbox(bid) { return state.messages.filter((m) => m.buyerId === bid).sort((a, b) => b.at - a.at); },
    setStatus(id, status, reply) {
      const m = state.messages.find((x) => x.id === id);
      if (m) { m.status = status; if (reply) m.reply = reply; save(); }
    },

    /* reputation built from real activity, not from a portfolio */
    trust(wid) {
      const ls = state.listings.filter((l) => l.weaverId === wid && l.published);
      const ms = state.messages.filter((m) => m.weaverId === wid);
      const accepted = ms.filter((m) => m.status === "accepted").length;
      const paid = ls.reduce((s, l) => s + (l.stats.trials || 0), 0);
      const card = ls.length ? ls.reduce((s, l) => s + AI.completeness(l).pct, 0) / ls.length : 0;
      const score = Math.min(100, Math.round(15 + Math.min(ls.length, 3) * 8 + Math.min(accepted, 4) * 6 + Math.min(paid, 6) * 6 + card * 0.12));
      return { score, isNew: ls.length < 2 && paid === 0, paid, accepted };
    }
  };
})();
