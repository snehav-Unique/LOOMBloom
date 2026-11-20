/* Multilingual textile vocabulary.
   Each concept lists its display word per UI language (en, hi, kn, ta, te, bn, mr)
   and extra spoken/written forms in `syn` (including ml, gu, pa and common romanisations).
   The same table drives understanding (text -> concept) and drafting (concept -> any language). */

const LEX = {
  garment: {
    saree:   { en: "saree", hi: "साड़ी", kn: "ಸೀರೆ", ta: "புடவை", te: "చీర", bn: "শাড়ি", mr: "साडी", syn: ["sari", "sarees", "saris", "saree", "सारी", "சேலை", "സാരി", "સાડી", "ਸਾੜੀ", "ଶାଢ଼ୀ", "sadi", "seere", "chira", "pudavai"] },
    kurta:   { en: "kurta", hi: "कुर्ता", kn: "ಕುರ್ತಾ", ta: "குர்தா", te: "కుర్తా", bn: "কুর্তা", mr: "कुर्ता", syn: ["kurti", "kurtas", "कुर्ती", "ಕುರ್ತಿ", "குர்தி", "కుర్తీ", "কুর্তি", "കുർത്ത", "કુર્તા"] },
    dupatta: { en: "dupatta", hi: "दुपट्टा", kn: "ದುಪಟ್ಟಾ", ta: "துப்பட்டா", te: "దుపట్టా", bn: "ওড়না", mr: "ओढणी", syn: ["dupattas", "odhni", "chunni", "चुन्नी", "ओढ़नी", "ದುಪ್ಪಟ್ಟ", "দোপাট্টা", "ദുപ്പട്ട", "દુપટ્ટો"] },
    stole:   { en: "stole", hi: "स्टोल", kn: "ಸ್ಟೋಲ್", ta: "ஸ்டோல்", te: "స్టోల్", bn: "স্টোল", mr: "स्टोल", syn: ["stoles", "shawl", "shawls", "शॉल", "ಶಾಲು", "சால்வை", "శాలువా", "শাল", "शाल"] },
    fabric:  { en: "running fabric", hi: "थान कपड़ा", kn: "ಥಾನ್ ಬಟ್ಟೆ", ta: "துணி தான்", te: "తాన్ బట్ట", bn: "থান কাপড়", mr: "थान कापड", syn: ["yardage", "running material", "by the metre", "by the meter", "metres", "meters", "थान", "मीटर"] },
    dhoti:   { en: "dhoti", hi: "धोती", kn: "ಪಂಚೆ", ta: "வேட்டி", te: "పంచె", bn: "ধুতি", mr: "धोतर", syn: ["veshti", "mundu", "panche", "dhotis", "ಧೋತಿ", "முண்டு", "ధోతి", "മുണ്ട്", "ધોતી"] },
    lehenga: { en: "lehenga", hi: "लहंगा", kn: "ಲೆಹೆಂಗಾ", ta: "லெஹெங்கா", te: "లెహంగా", bn: "লেহেঙ্গা", mr: "लेहेंगा", syn: ["lehnga", "ghagra", "घाघरा", "langa", "ಲಂಗ", "பாவாடை", "లంగా"] }
  },

  fabric: {
    cotton: { en: "cotton", hi: "सूती", kn: "ಹತ್ತಿ", ta: "பருத்தி", te: "నూలు", bn: "সুতি", mr: "सुती", syn: ["cotton", "कॉटन", "कपास", "ಕಾಟನ್", "காட்டன்", "కాటన్", "పత్తి", "কটন", "সুতির", "സുതി", "പരുത്തി", "સુતરાઉ", "કોટન", "ਸੂਤੀ", "sooti", "suti"] },
    silk:   { en: "silk", hi: "रेशम", kn: "ರೇಷ್ಮೆ", ta: "பட்டு", te: "పట్టు", bn: "রেশম", mr: "रेशीम", syn: ["silk", "सिल्क", "रेशमी", "ಸಿಲ್ಕ್", "சில்க்", "సిల్క్", "সিল্ক", "പട്ട്", "സിൽക്ക്", "રેશમ", "સિલ્ક", "ਰੇਸ਼ਮ", "pattu", "resham"] },
    linen:  { en: "linen", hi: "लिनन", kn: "ಲಿನನ್", ta: "லினன்", te: "లినెన్", bn: "লিনেন", mr: "लिनन", syn: ["linen", "flax"] },
    khadi:  { en: "khadi", hi: "खादी", kn: "ಖಾದಿ", ta: "கதர்", te: "ఖాదీ", bn: "খাদি", mr: "खादी", syn: ["khaddar", "khadi", "ಖಾದಿ", "காதி", "ഖാദി", "ખાદી"] },
    tussar: { en: "tussar silk", hi: "टसर", kn: "ಟಸ್ಸರ್", ta: "டஸ்ஸர்", te: "టస్సర్", bn: "তসর", mr: "टसर", syn: ["tussar", "tussah", "tasar", "kosa", "तसर", "कोसा"] },
    muslin: { en: "muslin", hi: "मलमल", kn: "ಮಲ್ಮಲ್", ta: "மஸ்லின்", te: "మస్లిన్", bn: "মসলিন", mr: "मलमल", syn: ["mulmul", "malmal", "muslin"] },
    silkcotton: { en: "silk-cotton", hi: "सिल्क-कॉटन", kn: "ಸಿಲ್ಕ್ ಕಾಟನ್", ta: "சில்க் காட்டன்", te: "సిల్క్ కాటన్", bn: "সিল্ক-কটন", mr: "सिल्क-कॉटन", syn: ["silk cotton", "silk-cotton", "sico", "chanderi", "चंदेरी", "maheshwari", "महेश्वरी"] }
  },

  colour: {
    red:    { hex: "#b3261e", en: "red", hi: "लाल", kn: "ಕೆಂಪು", ta: "சிவப்பு", te: "ఎరుపు", bn: "লাল", mr: "लाल", syn: ["red", "रक्त", "ಕೆಂಪ", "ఎర్ర", "ചുവപ്പ്", "લાલ", "ਲਾਲ", "lal", "madder", "sindoor", "kempu"] },
    maroon: { hex: "#6d1f2a", en: "maroon", hi: "मैरून", kn: "ಮರೂನ್", ta: "மெரூன்", te: "మెరూన్", bn: "মেরুন", mr: "मरून", syn: ["maroon", "wine", "burgundy", "कत्थई", "കടും ചുവപ്പ്"] },
    pink:   { hex: "#d9718f", en: "pink", hi: "गुलाबी", kn: "ಗುಲಾಬಿ", ta: "இளஞ்சிவப்பு", te: "గులాబీ", bn: "গোলাপি", mr: "गुलाबी", syn: ["pink", "rose", "rani", "gulabi", "ரோஸ்", "പിങ്ക്", "ગુલાબી", "ਗੁਲਾਬੀ"] },
    orange: { hex: "#e0782a", en: "orange", hi: "नारंगी", kn: "ಕಿತ್ತಳೆ", ta: "ஆரஞ்சு", te: "నారింజ", bn: "কমলা", mr: "नारिंगी", syn: ["orange", "saffron", "kesari", "केसरिया", "भगवा", "ಕೇಸರಿ", "காவி", "కాషాయ", "গেরুয়া", "ഓറഞ്ച്", "કેસરી", "rust"] },
    peach:  { hex: "#f2b493", en: "peach", hi: "पीच", kn: "ಪೀಚ್", ta: "பீச்", te: "పీచ్", bn: "পীচ", mr: "पीच", syn: ["peach", "coral", "salmon"] },
    yellow: { hex: "#e8b923", en: "yellow", hi: "पीला", kn: "ಹಳದಿ", ta: "மஞ்சள்", te: "పసుపు", bn: "হলুদ", mr: "पिवळा", syn: ["yellow", "haldi", "पीली", "पिवळी", "മഞ്ഞ", "પીળો", "ਪੀਲਾ"] },
    mustard:{ hex: "#c8962e", en: "mustard", hi: "सरसों", kn: "ಸಾಸಿವೆ", ta: "கடுகு", te: "ఆవ", bn: "সরষে", mr: "मोहरी", syn: ["mustard", "ochre", "turmeric", "haldi yellow"] },
    gold:   { hex: "#c9a14a", en: "gold", hi: "सुनहरा", kn: "ಚಿನ್ನದ", ta: "தங்க", te: "బంగారు", bn: "সোনালী", mr: "सोनेरी", syn: ["gold", "golden", "zari colour", "सुनहरी", "ಚಿನ್ನ", "தங்கம்", "బంగారం", "সোনালি", "സ്വർണ്ണ", "સોનેરી", "ਸੁਨਹਿਰੀ"] },
    green:  { hex: "#2f7d4f", en: "green", hi: "हरा", kn: "ಹಸಿರು", ta: "பச்சை", te: "ఆకుపచ్చ", bn: "সবুজ", mr: "हिरवा", syn: ["green", "hara", "हरी", "हिरवी", "పచ్చ", "പച്ച", "લીલો", "ਹਰਾ", "parrot", "emerald"] },
    teal:   { hex: "#1f6f6f", en: "teal", hi: "टील", kn: "ಟೀಲ್", ta: "டீல்", te: "టీల్", bn: "টিল", mr: "टील", syn: ["teal", "peacock", "मोरपंखी", "ಮಯೂರ", "மயில்", "నెమలి"] },
    blue:   { hex: "#2c56a0", en: "blue", hi: "नीला", kn: "ನೀಲಿ", ta: "நீலம்", te: "నీలం", bn: "নীল", mr: "निळा", syn: ["blue", "नीली", "निळी", "நீல", "నీలి", "നീല", "વાદળી", "ਨੀਲਾ", "neela", "sky"] },
    indigo: { hex: "#26325e", en: "indigo", hi: "नील", kn: "ಇಂಡಿಗೋ", ta: "அவுரி", te: "నీలిమందు", bn: "নীলরঙা", mr: "नीळ", syn: ["indigo", "navy", "neel", "dark blue", "गहरा नीला", "ಗಾಢ ನೀಲಿ", "கருநீலம்", "ముదురు నీలం", "গাঢ় নীল"] },
    purple: { hex: "#6b3f8a", en: "purple", hi: "बैंगनी", kn: "ನೇರಳೆ", ta: "ஊதா", te: "ఊదా", bn: "বেগুনি", mr: "जांभळा", syn: ["purple", "violet", "lavender", "जामुनी", "जांभळी", "പർപ്പിൾ", "જાંબલી"] },
    black:  { hex: "#1d1b1a", en: "black", hi: "काला", kn: "ಕಪ್ಪು", ta: "கருப்பு", te: "నలుపు", bn: "কালো", mr: "काळा", syn: ["black", "kala", "काली", "काळी", "கறுப்பு", "నల్ల", "കറുപ്പ്", "કાળો", "ਕਾਲਾ", "charcoal"] },
    white:  { hex: "#f4f1ea", en: "white", hi: "सफ़ेद", kn: "ಬಿಳಿ", ta: "வெள்ளை", te: "తెలుపు", bn: "সাদা", mr: "पांढरा", syn: ["white", "सफेद", "पांढरी", "తెల్ల", "വെള്ള", "સફેદ", "ਚਿੱਟਾ", "ivory"] },
    cream:  { hex: "#ead9b8", en: "cream", hi: "क्रीम", kn: "ಕ್ರೀಮ್", ta: "கிரீம்", te: "క్రీమ్", bn: "ক্রিম", mr: "क्रीम", syn: ["cream", "off-white", "off white", "offwhite", "natural", "ecru", "kora", "कोरा"] },
    beige:  { hex: "#cdb38f", en: "beige", hi: "बेज", kn: "ಬೀಜ್", ta: "பீஜ்", te: "బీజ్", bn: "বেইজ", mr: "बेज", syn: ["beige", "sand", "tan", "khaki", "fawn"] },
    brown:  { hex: "#7a4b2a", en: "brown", hi: "भूरा", kn: "ಕಂದು", ta: "பழுப்பு", te: "గోధుమ", bn: "বাদামি", mr: "तपकिरी", syn: ["brown", "coffee", "chocolate", "भूरी", "ബ്രൗൺ", "ભૂરો"] },
    grey:   { hex: "#8a8a86", en: "grey", hi: "स्लेटी", kn: "ಬೂದು", ta: "சாம்பல்", te: "బూడిద", bn: "ধূসর", mr: "राखाडी", syn: ["grey", "gray", "silver", "ग्रे", "चाँदी", "ಬೂದಿ", "வெள்ளி", "వెండి", "রুপালি", "ചാര", "રાખોડી"] }
  },

  style: {
    zari:     { en: "zari border", hi: "ज़री बॉर्डर", kn: "ಜರಿ ಅಂಚು", ta: "ஜரிகை பார்டர்", te: "జరీ అంచు", bn: "জরি পাড়", mr: "जरी काठ", syn: ["zari", "jari", "zardozi", "ज़री", "जरी", "ಜರಿ", "ஜரிகை", "జరీ", "জরি", "സരി", "જરી", "gold border"] },
    temple:   { en: "temple border", hi: "मंदिर बॉर्डर", kn: "ದೇವಸ್ಥಾನ ಅಂಚು", ta: "கோயில் பார்டர்", te: "గుడి అంచు", bn: "মন্দির পাড়", mr: "मंदिर काठ", syn: ["temple", "korvai", "mandir", "मंदिर", "ಗೋಪುರ", "கோபுரம்", "కోవెల"] },
    checks:   { en: "checks", hi: "चेक", kn: "ಚೌಕಳಿ", ta: "கட்டம்", te: "గడులు", bn: "চেক", mr: "चौकडी", syn: ["check", "checks", "checked", "checkered", "chequered", "gingham", "khana", "चौकड़ी", "चारखाना", "ಚೆಕ್ಸ್", "செக்", "kattam", "narayanpet"] },
    stripes:  { en: "stripes", hi: "धारियाँ", kn: "ಪಟ್ಟೆ", ta: "கோடுகள்", te: "చారలు", bn: "ডোরা", mr: "पट्टे", syn: ["stripe", "stripes", "striped", "lines", "धारी", "धारीदार", "ಗೆರೆ", "கோடு", "చార", "ডোরাকাটা", "വര"] },
    ikat:     { en: "ikat", hi: "इकत", kn: "ಇಕತ್", ta: "இகத்", te: "ఇక్కత్", bn: "ইকাত", mr: "इकत", syn: ["ikat", "ikkat", "pochampally", "patola", "पटोला", "पोचमपल्ली", "తెలియా", "telia", "sambalpuri", "संबलपुरी"] },
    blockprint: { en: "block print", hi: "ब्लॉक प्रिंट", kn: "ಬ್ಲಾಕ್ ಪ್ರಿಂಟ್", ta: "பிளாக் பிரிண்ட்", te: "బ్లాక్ ప్రింట్", bn: "ব্লক প্রিন্ট", mr: "ब्लॉक प्रिंट", syn: ["block print", "block-print", "blockprint", "hand block", "bagru", "sanganeri", "dabu", "ajrakh", "छपाई", "बगरू", "अजरख"] },
    floral:   { en: "floral", hi: "फूलदार", kn: "ಹೂವಿನ", ta: "பூ வேலை", te: "పూల", bn: "ফুলেল", mr: "फुलांची", syn: ["floral", "flower", "flowers", "phool", "फूल", "ಹೂ", "பூ", "పువ్వు", "ফুল", "പൂ", "ફૂલ"] },
    buta:     { en: "butas", hi: "बूटे", kn: "ಬೂಟಾ", ta: "புட்டா", te: "బుటా", bn: "বুটি", mr: "बुट्टे", syn: ["buta", "butta", "booti", "buti", "butis", "motif", "motifs", "बूटी", "बूटा", "ಬುಟ್ಟಾ", "புட்டி", "బుట్టా", "বুটা"] },
    kalamkari:{ en: "kalamkari", hi: "कलमकारी", kn: "ಕಲಂಕಾರಿ", ta: "கலம்காரி", te: "కలంకారి", bn: "কলমকারি", mr: "कलमकारी", syn: ["kalamkari", "hand painted", "hand-painted", "painted"] },
    jamdani:  { en: "jamdani", hi: "जामदानी", kn: "ಜಾಮ್ದಾನಿ", ta: "ஜாம்தானி", te: "జామ్దానీ", bn: "জামদানি", mr: "जामदानी", syn: ["jamdani", "dhakai", "ঢাকাই"] },
    ilkal:    { en: "Ilkal", hi: "इलकल", kn: "ಇಳಕಲ್", ta: "இளகல்", te: "ఇల్కల్", bn: "ইলকল", mr: "इरकल", syn: ["ilkal", "irkal", "ಇಲಕಲ್", "इरकली", "tope teni", "kasuti", "ಕಸೂತಿ"] },
    kanjeevaram: { en: "Kanjeevaram", hi: "कांजीवरम", kn: "ಕಾಂಜೀವರಂ", ta: "காஞ்சிபுரம்", te: "కంచి", bn: "কাঞ্জিভরম", mr: "कांजीवरम", syn: ["kanjivaram", "kanchipuram", "kanchi", "kanjeevaram", "காஞ்சி", "காஞ்சீவரம்"] },
    plain:    { en: "plain weave", hi: "सादा", kn: "ಸಾದಾ", ta: "சாதா", te: "సాదా", bn: "সাদামাটা", mr: "साधा", syn: ["plain", "solid", "minimal", "सादी", "साधी", "ಸರಳ", "எளிய", "సాదా"] },
    tassels:  { en: "tassels", hi: "फुंदने", kn: "ಕುಚ್ಚು", ta: "குஞ்சம்", te: "కుచ్చులు", bn: "ঝালর", mr: "गोंडे", syn: ["tassel", "tassels", "latkan", "लटकन", "kuchu", "fringe"] }
  },

  occasion: {
    wedding: { en: "wedding", hi: "शादी", kn: "ಮದುವೆ", ta: "திருமணம்", te: "పెళ్ళి", bn: "বিয়ে", mr: "लग्न", syn: ["wedding", "bridal", "marriage", "विवाह", "दुल्हन", "ಮದುವೆಗೆ", "கல்யாணம்", "వివాహ", "বিবাহ", "കല്യാണം", "લગ્ન", "ਵਿਆਹ"] },
    festive: { en: "festive", hi: "त्योहार", kn: "ಹಬ್ಬ", ta: "பண்டிகை", te: "పండుగ", bn: "উৎসব", mr: "सण", syn: ["festive", "festival", "puja", "pooja", "diwali", "pongal", "onam", "durga", "eid", "ugadi", "दिवाली", "पूजा", "ದೀಪಾವಳಿ", "பொங்கல்", "దీపావళి", "পুজো", "ഓണം", "તહેવાર"] },
    daily:   { en: "everyday", hi: "रोज़ाना", kn: "ದಿನನಿತ್ಯ", ta: "தினசரி", te: "రోజువారీ", bn: "রোজকার", mr: "रोजचे", syn: ["daily", "everyday", "office", "casual", "रोज़", "ऑफिस", "ಆಫೀಸ್", "அலுவலக", "ఆఫీస్", "অফিস"] },
    party:   { en: "party", hi: "पार्टी", kn: "ಪಾರ್ಟಿ", ta: "பார்ட்டி", te: "పార్టీ", bn: "পার্টি", mr: "पार्टी", syn: ["party", "evening", "reception", "cocktail"] }
  }
};

/* Small words used inside sentence templates. */
const WORDS = {
  and:   { en: "and", hi: "और", kn: "ಮತ್ತು", ta: "மற்றும்", te: "మరియు", bn: "আর", mr: "आणि" },
  rs:    { en: "₹", hi: "₹", kn: "₹", ta: "₹", te: "₹", bn: "₹", mr: "₹" }
};

/* Lists of spoken words that mean money / days / pieces in each language. */
const UNIT_WORDS = {
  money: ["₹", "rs", "rs.", "inr", "rupees", "rupee", "rupaye", "रुपये", "रुपए", "रुपया", "रुपयांना", "रुपये", "ರೂಪಾಯಿ", "ರೂ", "ரூபாய்", "ரூ", "రూపాయలు", "రూ", "টাকা", "রুপি", "രൂപ", "રૂપિયા", "ਰੁਪਏ", "budget", "under", "below", "within", "upto", "up to", "max", "price", "दाम", "कीमत", "ಬೆಲೆ", "விலை", "ధర", "দাম", "किंमत"],
  days: ["day", "days", "दिन", "दिवस", "ದಿನ", "ದಿನದಲ್ಲಿ", "ದಿನಗಳಲ್ಲಿ", "நாள்", "நாட்கள்", "நாட்களில்", "రోజు", "రోజుల", "రోజులు", "দিন", "দিনে", "ദിവസം", "દિવસ", "ਦਿਨ"],
  weeks: ["week", "weeks", "हफ्ते", "हफ़्ते", "सप्ताह", "आठवडे", "ವಾರ", "வாரம்", "వారాలు", "সপ্তাহ", "ആഴ്ച", "અઠવાડિયા"],
  pieces: ["pcs", "pc", "pieces", "piece", "nos", "units", "sets", "पीस", "नग", "ತುಂಡು", "ತುಂಡುಗಳು", "துண்டு", "துண்டுகள்", "ముక్కలు", "পিস", "টি", "টা","എണ്ണം", "નંગ", "ਪੀਸ"],
  month: ["month", "per month", "a month", "महीने", "महीना", "महिन्याला", "ತಿಂಗಳಿಗೆ", "ತಿಂಗಳು", "மாதம்", "மாதத்திற்கு", "నెలకు", "నెల", "মাসে", "মাস", "മാസം", "મહિને"]
};

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/* Upcoming Indian festival dates that buyers commonly use as deadlines (2026–27 season). */
const FESTIVALS = [
  { names: ["christmas", "क्रिसमस"], date: "2026-12-25" },
  { names: ["new year", "नया साल"], date: "2027-01-01" },
  { names: ["sankranti", "pongal", "makar", "lohri", "संक्रांति", "पोंगल", "ಸಂಕ್ರಾಂತಿ", "பொங்கல்", "సంక్రాంతి"], date: "2027-01-14" },
  { names: ["republic day"], date: "2027-01-26" },
  { names: ["valentine"], date: "2027-02-14" },
  { names: ["holi", "होली"], date: "2027-03-22" },
  { names: ["ugadi", "gudi padwa", "ಯುಗಾದಿ", "ఉగాది", "गुढीपाडवा"], date: "2027-04-07" },
  { names: ["vishu", "baisakhi", "poila boishakh", "puthandu", "tamil new year", "बैसाखी", "পয়লা বৈশাখ"], date: "2027-04-14" },
  { names: ["eid", "ईद"], date: "2027-03-10" },
  { names: ["onam", "ഓണം"], date: "2027-08-25" },
  { names: ["durga puja", "pujo", "পুজো", "दुर्गा पूजा", "navratri", "नवरात्रि", "dasara", "dussehra", "ದಸರಾ"], date: "2027-10-10" },
  { names: ["diwali", "deepavali", "दिवाली", "दीपावली", "ದೀಪಾವಳಿ", "தீபாவளி", "దీపావళి"], date: "2027-10-29" },
  { names: ["wedding season", "shaadi season"], date: "2027-01-20" }
];

/* Native-script digits -> ASCII digits, so "೨೫೦೦" and "२५००" read as 2500. */
const DIGIT_MAPS = [
  "०१२३४५६७८९", "೦೧೨೩೪೫೬೭೮೯", "௦௧௨௩௪௫௬௭௮௯", "౦౧౨౩౪౫౬౭౮౯",
  "০১২৩৪৫৬৭৮৯", "൦൧൨൩൪൫൬൭൮൯", "૦૧૨૩૪૫૬૭૮૯", "੦੧੨੩੪੫੬੭੮੯", "୦୧୨୩୪୫୬୭୮୯"
];
