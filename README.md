# Loom & Bloom

A handloom marketplace that links weavers directly with shops and buyers.

- **Weavers** start with just a brand name. They photograph a real piece and describe it by voice in their own language. **LoomVoice** turns that into a poster, a video ad, a WhatsApp caption, a pitch for shops and a product page. The weaver approves everything before it is published under their name.
- **Buyers** (shops, wholesalers or single-piece buyers) describe what they want in any language, or show a reference photo, and get ranked matches. They can request a sample, order a small paid trial batch, contact the weaver, ask for changes, or sketch ideas on see-through layers over the weaver's photo.

## Run it

No build step and no dependencies. Serve the folder over HTTP:

```sh
python -m http.server 8000
# then open http://localhost:8000
```

Use **Chrome or Edge** for voice input (Web Speech API). Opening `index.html` straight from disk mostly works, but downloading the poster or video needs a local server, because browsers block exporting canvas pixels on `file://` pages.

## 3-minute demo

1. **Splash and entry.** A white screen with a working loom and a spinning charkha plays for 2 seconds. Then pick a language (7 UI languages) and choose a role.
2. **Buyer.** Choose *I'm buying*, then use any name.
   - Search `blue and black combination desi saree`. The *We understood* chips show garment, fabric, colours, style, budget, quantity and deadline. Remove any chip to re-rank.
   - Try a Hindi or Kannada example chip, then switch *Show everything in* to Tamil. Listings are rewritten in the buyer's language (*Auto-translated from …* → *Show original*).
   - Use *Show a photo* to upload any image. Its colours are read and matched.
   - Open a listing, then choose *Try ideas on the photo*. Colour mood, border band, motifs, lighting and numbered pins are separate layers. *Hold to see original*, then *Send idea to weaver*.
   - Use *Save this request*. New matching collections appear in **For you**.
3. **Weaver.** Sign out, choose *I weave*, type `Sharada Handlooms` and pick ಕನ್ನಡ. This demo account already has a sample request, a change request and a paid trial.
   - **New collection**: pick a demo photo, then choose *Use a sample voice note* (or press the mic and speak). Next, tap-to-fix the design card and set the price, trial batch, minimum order and days. Then see your poster, video ad, WhatsApp, shop pitch and product page; every text has a 🔊 listen button. Finally, *Approve & publish* gives a trackable link and WhatsApp share.
   - **Messages**: requests appear as icons and translated chips. *Accept* or reply by voice.
   - **Results**: views by source (search, *For you* feed, shared link), then samples (interest), then paid trials (real demand).

*Reset demo data* is at the bottom of the entry page.

## How it's built

| File | What it does |
|---|---|
| `js/i18n.js`, `js/i18n-more.js` | UI strings in English, हिन्दी, ಕನ್ನಡ, தமிழ், తెలుగు, বাংলা, मराठी. Voice input also supports മലയാളം, ગુજરાતી, ਪੰਜਾਬੀ, ଓଡ଼ିଆ, অসমীয়া, اردو. |
| `js/lexicon.js` | Multilingual textile vocabulary (garments, fabrics, colours, weaves, occasions, units, festival dates). Used both to *understand* and to *write*. |
| `js/ai.js` | The on-device AI engine: request parsing (native-script digits, ₹/k/lakh, "50 pcs in 3 weeks", festival deadlines), weaver-note parsing (price, days, monthly capacity), CIELAB colour matching, explained ranking, photo palette reading, multilingual drafting. |
| `js/art.js` | Procedural handloom art for demo listings, the 1080×1350 poster, and the 9-second video ad (exported as WebM via `MediaRecorder`). |
| `js/store.js` | Demo data in `localStorage`, so both portals talk to each other in one browser. It also holds the trust score, built from activity rather than a portfolio. |
| `js/app.js` | Router and all screens. |

### What's real and what's simulated

- **Real:** speech-to-text (browser Web Speech API, in the chosen Indian language), read-aloud (speech synthesis, where the device has that voice), photo colour extraction, ranking, poster and video generation, the layer studio, and view, sample and trial tracking.
- **Rule-based, not an LLM:** extraction and drafting use the vocabulary tables and templates. "Auto-translation" regenerates each listing in the reader's language from its structured design card. The weaver's own words are always kept and shown as the original. Free-text notes between buyer and weaver are not machine-translated yet.
- **Demo only:** accounts (no verification; GSTIN is not checked), payments (no money moves), and storage (one browser). A shared link only opens on the same browser until there is a backend.

### Going to production

Replace `Store` with an API (accounts, listings, messages, analytics) and put a hosted language model behind `AI.understand`, `AI.understandMaker` and `AI.draft`. They have the same signatures, so the screens don't change. Add server-side speech recognition for languages and browsers the Web Speech API doesn't cover, and a real payment gateway for trial orders.

Translations were written for this prototype. Have native speakers review them before launch.
