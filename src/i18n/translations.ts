export type Lang = 'en' | 'sl';

const translations = {
  // Header / navigation
  'header.title': { en: 'Economy of Abundance', sl: 'Ekonomija Obilja' },
  'header.login': { en: 'Log in', sl: 'Prijava' },
  'header.register': { en: 'Register', sl: 'Registracija' },
  'nav.live': { en: 'Live system', sl: 'Sistem v živo' },
  'nav.pillars': { en: 'Services', sl: 'Sklopi' },
  'nav.more': { en: 'More', sl: 'Več' },
  'nav.tech': { en: 'Technical solutions', sl: 'Tehnične rešitve' },
  'nav.menu': { en: 'Menu', sl: 'Meni' },

  // Hero
  'hero.kicker': { en: 'Economy of Abundance', sl: 'Ekonomija Obilja' },
  'hero.title': { en: 'Together we build the Economy of Abundance', sl: 'Gradimo skupaj Ekonomijo Obilja' },
  'hero.tagline': { en: '… and we have a good time :)', sl: '… in se mamo fajn :)' },
  'hero.lead': {
    en: 'A payment system that gives back more than it takes: the merchant receives the full invoice plus up to 20% on top, the customer gets LANA back, and investors finance real, local and ecological consumption.',
    sl: 'Plačilni sistem, ki vrne več, kot vzame: trgovec prejme celoten račun in do 20 % nagrade povrhu, kupec prejme LANO nazaj, vlagatelji pa financirajo resnično, lokalno in ekološko potrošnjo.',
  },
  'hero.cta.register': { en: 'Register your business', sl: 'Registriraj dejavnost' },
  'hero.cta.login': { en: 'Open the till', sl: 'Prijava v blagajno' },
  'hero.cta.learn': { en: 'More about the Economy of Abundance', sl: 'Več o Ekonomiji Obilja' },
  'hero.scroll': { en: 'See the system live', sl: 'Poglej sistem v živo' },

  // Live system (reference data from LanaConnects.us)
  'live.kicker': { en: 'Live', sl: 'V živo' },
  'live.title': { en: 'The system, live', sl: 'Sistem v živo' },
  'live.subtitle': {
    en: 'The same figures LanaConnects.us shows — refreshed every minute.',
    sl: 'Isti podatki, kot jih kaže LanaConnects.us — osveženi vsako minuto.',
  },
  'live.source': { en: 'Source: LanaConnects.us', sl: 'Vir: LanaConnects.us' },
  'live.updated': { en: 'Updated {ago}', sl: 'Osveženo {ago}' },
  'live.stale': { en: 'showing last known figures', sl: 'prikazani zadnji znani podatki' },
  'live.partial': { en: 'some sources are unavailable', sl: 'nekateri viri niso dosegljivi' },
  'live.loading': { en: 'Loading live data …', sl: 'Nalagam žive podatke …' },
  'live.error': { en: 'Live data is currently unavailable.', sl: 'Živi podatki trenutno niso dosegljivi.' },
  'live.retry': { en: 'Try again', sl: 'Poskusi znova' },
  'live.info.title': { en: 'Current system information', sl: 'Trenutne informacije o sistemu' },
  'live.split': { en: 'Current Split', sl: 'Trenutni Split' },
  'live.days': { en: 'Days in this Split', sl: 'Dni v tem Splitu' },
  'live.providers': { en: 'Total providers', sl: 'Skupno ponudnikov' },
  'live.latestProviders': { en: 'Three most recently registered providers', sl: 'Zadnji trije vpisani ponudniki' },
  'live.registered': { en: 'registered {ago}', sl: 'vpisan {ago}' },
  'live.noProviders': { en: 'There are currently no newly registered providers.', sl: 'Trenutno ni novih registriranih ponudnikov.' },
  'live.trades.title': { en: 'Latest trades in the Split', sl: 'Zadnji trejdi v Splitu' },
  'live.trades.showUnpaid': { en: 'Show unpaid', sl: 'Prikaži neplačane' },
  'live.trades.showAll': { en: 'Show all trades', sl: 'Prikaži vse trejde' },
  'live.trades.viewAll': { en: 'View all 100 trades', sl: 'Poglej vseh 100 trejdov' },
  'live.trades.unpaidTotal': { en: 'Total unpaid', sl: 'Skupaj neplačano' },
  'live.trades.empty': { en: 'No trades to show right now.', sl: 'Trenutno ni prikazanih trejdov.' },
  'live.trades.emptyUnpaid': { en: 'No unpaid trades right now.', sl: 'Trenutno ni neplačanih trejdov.' },
  'live.status.pending': { en: 'IN PROGRESS', sl: 'V TEKU' },
  'live.status.paid': { en: 'PAID', sl: 'PLAČANO' },
  'live.status.partial': { en: 'PARTIAL', sl: 'DELNO' },
  'live.status.failed': { en: 'FAILED', sl: 'NEUSPELO' },
  'live.funding.title': { en: 'Waiting for investment', sl: 'Čaka na vlaganje' },
  'live.funding.investors': { en: '{n} active investors', sl: '{n} aktivnih vlagateljev' },
  'live.funding.circulation': { en: 'LANA in circulation', sl: 'Znesek LANA v obtoku' },
  'live.funding.distribution': { en: 'Indicative amount for distribution', sl: 'Okvirni znesek za distribucijo' },
  'live.funding.split': { en: '20% donation · 80% to holders', sl: '20 % donacija · 80 % imetnikom' },
  'live.funding.note': {
    en: 'Funds awaiting new projects and providers in this Split.',
    sl: 'Sredstva, ki čakajo na nove projekte in ponudnike v tem Splitu.',
  },
  'live.funding.invest': { en: 'Become an investor', sl: 'Postani vlagatelj' },
  'live.video.title': { en: 'How are trades financed?', sl: 'Kako se financirajo posli?' },
  'live.video.text': {
    en: 'Watch a short video on how the Economy of Abundance creates financial support for fair, ecological and sustainable trade.',
    sl: 'Oglej si kratek video in spoznaj, kako Ekonomija Obilja ustvarja finančno podporo za poštene, ekološke in trajnostne posle.',
  },
  'live.video.play': { en: 'Play the video', sl: 'Predvajaj video' },

  // I. Services
  'pillars.kicker': { en: 'I. Services', sl: 'I. Sklopi' },
  'pillars.title': { en: 'Three doors into the same economy', sl: 'Trije vhodi v isto ekonomijo' },
  'pillars.subtitle': {
    en: 'Pick the door that fits your business. All three lead into the same flow: the customer pays exactly the invoice, the merchant receives it in full plus a reward on top.',
    sl: 'Izberi vhod, ki ustreza tvoji dejavnosti. Vsi trije vodijo v isti tok: kupec plača točno toliko, kot piše na računu, trgovec pa prejme celoten račun in nagrado povrhu.',
  },
  'pillars.simple.name': { en: 'Simple', sl: 'Simple' },
  'pillars.simple.tag': { en: 'Sell for LANA in two minutes', sl: 'Prodaj za LANO v dveh minutah' },
  'pillars.simple.desc': {
    en: 'No cash, no queue, no approval. Scan your Lana card, enter your business and bank details — and you are selling within two minutes. Purchases are funded by the customer’s own coins, so self-service registration needs no one’s sign-off.',
    sl: 'Brez gotovine, brez čakanja, brez odobritve. Skeniraš svojo Lana kartico, vpišeš dejavnost in bančni račun – in v dveh minutah že prodajaš. Nakup financirajo kupčevi lastni kovanci, zato samopostrežna registracija ne potrebuje nikogaršnje odobritve.',
  },
  'pillars.simple.b1': { en: 'LANA only — no cash rail', sl: 'Samo LANA – brez gotovinskega tira' },
  'pillars.simple.b2': { en: 'Merchant reward 2% (5% with Lana8Wonder)', sl: 'Nagrada trgovcu 2 % (5 % z Lana8Wonder)' },
  'pillars.simple.b3': { en: 'Your key never leaves your device', sl: 'Ključ nikoli ne zapusti tvoje naprave' },
  'pillars.simple.cta': { en: 'Open Simple', sl: 'Odpri Simple' },
  'pillars.mobile.name': { en: 'Economy of Abundance', sl: 'Ekonomija Obilja' },
  'pillars.mobile.tag': { en: 'The merchant till: cash and LANA', sl: 'Blagajna za trgovce: gotovina in LANA' },
  'pillars.mobile.desc': {
    en: 'The mobile till for registered merchants. The customer pays in cash or in LANA, the merchant receives the full invoice plus a reward on top (up to 20%), and the customer gets part of the value back in LANA. Remote payments through a /pay link.',
    sl: 'Mobilna blagajna za registrirane trgovce. Kupec plača z gotovino ali z LANO, trgovec prejme celoten račun in nagrado povrhu (do 20 %), kupec pa dobi del vrednosti nazaj v LANI. Plačilo na daljavo prek povezave /pay.',
  },
  'pillars.mobile.b1': { en: 'Cash + LANA at the same till', sl: 'Gotovina + LANA pri isti blagajni' },
  'pillars.mobile.b2': { en: 'The customer gets LANA back', sl: 'Kupec prejme LANO nazaj' },
  'pillars.mobile.b3': { en: 'Remote payment by link or QR', sl: 'Plačilo na daljavo s povezavo ali QR' },
  'pillars.mobile.cta': { en: 'Open the till', sl: 'Prijava v blagajno' },
  'pillars.pay.name': { en: 'LanaPay', sl: 'LanaPay' },
  'pillars.pay.tag': { en: 'Pay with LanaPay in online shops', sl: 'Plačaj z LanaPay v spletni trgovini' },
  'pillars.pay.desc': {
    en: 'Add a “Pay with LanaPay” button to an existing online shop. The shopper lands on a hosted checkout, signs the payment in their own browser, and your server learns about it through a signed webhook.',
    sl: 'Obstoječi spletni trgovini dodaš gumb »Plačaj z LanaPay«. Kupec pride na gostovano plačilno stran, podpiše plačilo v svojem brskalniku, tvoj strežnik pa izve za plačilo prek podpisanega webhooka.',
  },
  'pillars.pay.b1': { en: 'Payment links, lanapay.js button, REST API', sl: 'Plačilne povezave, gumb lanapay.js, REST API' },
  'pillars.pay.b2': { en: 'Signed webhooks and a WooCommerce plugin', sl: 'Podpisani webhooki in vtičnik WooCommerce' },
  'pillars.pay.b3': { en: 'No fees — a reward on top for the merchant', sl: 'Nič provizij – nagrada trgovcu povrhu' },
  'pillars.pay.cta': { en: 'Open LanaPay', sl: 'Odpri LanaPay' },

  // II. More
  'more.kicker': { en: 'II. More', sl: 'II. Več' },
  'more.title': { en: 'What’s on, where to buy, and the foundations', sl: 'Dogajanje, trgovine in temelji' },
  'more.subtitle': {
    en: 'Upcoming events, featured shops across the network, and the framework the whole system rests on.',
    sl: 'Prihajajoči dogodki, izbrane trgovine po omrežju in okvir, na katerem stoji celoten sistem.',
  },

  // Where to buy
  'shops.title': { en: 'Where can I buy?', sl: 'Kje lahko kupujem?' },
  'shops.subtitle': { en: 'Featured providers in the network — and the portals by field.', sl: 'Izbrani ponudniki v omrežju – in portali po področjih.' },
  'shops.shuffle': { en: 'Show others', sl: 'Prikaži druge' },
  'shops.loading': { en: 'Loading shops from Nostr relays …', sl: 'Nalagam trgovine iz Nostr relayjev …' },
  'shops.empty': { en: 'No active shops found at the moment.', sl: 'Trenutno ni aktivnih trgovin.' },
  'shops.viewAll': { en: 'View all {count} shops', sl: 'Poglej vseh {count} trgovin' },
  'shops.portals': { en: 'Portals by field', sl: 'Portali po področjih' },

  // Portal buttons
  'portals.farms':        { en: 'Lana Producers',   sl: 'Lana Pridelovalci' },
  'portals.shops':        { en: 'Lana Shops',       sl: 'Lana Trgovine' },
  'portals.restaurants':  { en: 'Lana Restaurants & Cafes', sl: 'Lana Restavracije & Kavarne' },
  'portals.beauty':       { en: 'Lana Beauty & Care', sl: 'Lana Lepota & Nega' },
  'portals.fashion':      { en: 'Lana Fashion',     sl: 'Lana Moda' },
  'portals.furniture':    { en: 'Lana Furniture',   sl: 'Lana Pohištvo' },
  'portals.construction': { en: 'Lana Construction', sl: 'Lana Gradnja' },
  'portals.kids':         { en: 'Lana Kids',        sl: 'Lana Otroci' },
  'portals.pets':         { en: 'Lana Animals',      sl: 'Lana Živali' },
  'portals.vacations':    { en: 'Lana Vacations',   sl: 'Lana Počitnice' },
  'portals.marketplace':  { en: 'Lana Used Goods Marketplace', sl: 'Lana Tržnica rabljenih izdelkov' },
  'portals.events':       { en: 'Lana Events & Workshops',      sl: 'Lana Dogodki & Delavnice' },

  // Events
  'events.title': { en: 'Lana Events', sl: 'Lana Dogodki' },
  'events.subtitle': { en: 'Workshops, meetups and gatherings — online and in person.', sl: 'Delavnice, srečanja in druženja – spletno in v živo.' },
  'events.portal': { en: 'All events on lana.events', sl: 'Vsi dogodki na lana.events' },
  'events.loading': { en: 'Loading events from Nostr relays …', sl: 'Nalagam dogodke iz Nostr relayjev …' },
  'events.empty': { en: 'No upcoming events at the moment.', sl: 'Trenutno ni prihajajočih dogodkov.' },
  'events.live': { en: 'LIVE', sl: 'POTEKA' },
  'events.today': { en: 'Today', sl: 'Danes' },
  'events.online': { en: 'Online', sl: 'Spletno' },
  'events.inPerson': { en: 'In Person', sl: 'V živo' },
  'events.description': { en: 'Description', sl: 'Opis' },
  'events.schedule': { en: 'Schedule ({count} days)', sl: 'Urnik ({count}-dnevni)' },
  'events.timezone': { en: 'Timezone: {tz}', sl: 'Časovni pas: {tz}' },
  'events.capacity': { en: 'Capacity: {n}', sl: 'Kapaciteta: {n}' },
  'events.value': { en: 'Value: {n} EUR', sl: 'Vrednost: {n} EUR' },
  'events.joinOnline': { en: 'Join Online', sl: 'Pridruži se spletno' },
  'events.watchYoutube': { en: 'Watch on YouTube', sl: 'Oglej si na YouTube' },
  'events.recording': { en: 'Recording', sl: 'Posnetek' },
  'events.guests': { en: '{count} guests invited', sl: 'Povabljeni gostje: {count}' },
  'events.openMap': { en: 'Open in Google Maps', sl: 'Odpri v Google Zemljevidih' },

  // BEF
  'bef.kicker': { en: 'The framework', sl: 'Okvir' },
  'events.kicker': { en: 'Community', sl: 'Skupnost' },
  'shops.kicker': { en: 'Network', sl: 'Omrežje' },
  'posts.kicker': { en: 'Editorial', sl: 'Uredništvo' },
  'bef.title': { en: 'What is the system built on?', sl: 'Na kakšni podlagi deluje sistem?' },
  'bef.intro': {
    en: 'The Balanced Exchange Framework (BEF) is the overarching operational and transparency framework of the Balanced Economy of Abundance. LANA is its first and reference implementation. BEF is not a coin, an exchange or an investment product — it is a framework in which different forms of value can coexist and remain in balance.',
    sl: 'Balanced Exchange Framework (BEF) je krovni operativni in transparentnostni okvir Uravnotežene ekonomije obilja. LANA je njegova prva in referenčna izvedba. BEF ni coin, borza ali investicijski produkt – je okvir, v katerem lahko različne oblike vrednosti soobstajajo in ostanejo v ravnovesju.',
  },
  'bef.triad.title': { en: 'Three equal pillars', sl: 'Trije enakovredni stebri' },
  'bef.triad.exchange.name': { en: 'Exchange', sl: 'Exchange' },
  'bef.triad.exchange': {
    en: 'How value circulates: Lana8Wonder (personal balance), LanaPays.us (circulation) and Common Good Funding (creation & giving).',
    sl: 'Kako vrednost kroži: Lana8Wonder (osebno ravnovesje), LanaPays.us (kroženje) in Common Good Funding (ustvarjanje in dajanje).',
  },
  'bef.triad.alignment.name': { en: 'Alignment', sl: 'Alignment' },
  'bef.triad.alignment': {
    en: 'How a shared direction forms: proposal → resistance treated as information → alignment.',
    sl: 'Kako nastane skupna smer: predlog → odpor kot informacija → uskladitev.',
  },
  'bef.triad.own.name': { en: 'Self-responsibility / OWN', sl: 'Samoodgovornost / OWN' },
  'bef.triad.own': {
    en: 'How responsibility returns to the individual: reflection → alignment → change.',
    sl: 'Kako se odgovornost vrne posamezniku: refleksija → uskladitev → sprememba.',
  },
  'bef.flow.title': { en: 'LanaPays.us inside the framework', sl: 'LanaPays.us znotraj okvira' },
  'bef.flow.text': {
    en: 'LanaPays.us is the circulation pillar of Exchange: real consumption between customers and merchants, the capital input of direct.lana.fund that finances it, and the treasury recirculation of lana.discount. The customer pays exactly the invoice; the merchant receives the full amount plus a reward (2%, 5% or up to 20% in the Abundance model) funded by the investor — LanaPays deducts nothing from a sale.',
    sl: 'LanaPays.us je steber kroženja v Exchangeu: resnična potrošnja med kupci in trgovci, kapitalski vložek direct.lana.fund, ki jo financira, in zakladniška recirkulacija lana.discount. Kupec plača točno toliko, kot piše na računu; trgovec prejme celoten znesek in nagrado (2 %, 5 % ali do 20 % v modelu obilja), ki jo financira vlagatelj – LanaPays od prodaje ne odbije ničesar.',
  },
  'bef.principles.title': { en: 'Principles', sl: 'Načela' },
  'bef.p1': {
    en: 'Coexistence instead of replacement — BEF does not seek to replace the financial world; it helps different forms of value coexist.',
    sl: 'Soobstoj namesto zamenjave – BEF ne nadomešča finančnega sveta, ampak pomaga različnim oblikam vrednosti soobstajati.',
  },
  'bef.p2': {
    en: 'Growth → maturity → maintenance — the Split is a development mechanism, not an endless goal.',
    sl: 'Rast → zrelost → vzdrževanje – Split je razvojni mehanizem, ne neskončni cilj.',
  },
  'bef.p3': {
    en: 'Function before label — legal qualification always follows the actual function and applicable law.',
    sl: 'Funkcija pred nalepko – pravna kvalifikacija vedno sledi dejanski funkciji in veljavnemu pravu.',
  },
  'bef.p4': {
    en: 'Transparency — every published version of the framework is immutable and every change is verifiable.',
    sl: 'Transparentnost – vsaka objavljena verzija okvira je nespremenljiva, vsaka sprememba preverljiva.',
  },
  'bef.cta': { en: 'Read the full framework', sl: 'Preberi celoten okvir' },
  'bef.version': { en: 'Framework version {v} · {date}', sl: 'Verzija okvira {v} · {date}' },

  // Posts / News
  'posts.title': { en: 'News & Guides', sl: 'Novice & Navodila' },
  'posts.subtitle': { en: 'Instructions, answers and announcements from the editorial team.', sl: 'Navodila, odgovori in objave uredništva.' },
  'posts.loading': { en: 'Loading posts …', sl: 'Nalagam objave …' },
  'posts.empty': { en: 'No posts yet.', sl: 'Ni še objav.' },
  'posts.readMore': { en: 'Read more', sl: 'Preberi več' },
  'posts.watchVideo': { en: 'Watch video', sl: 'Oglej si video' },
  'posts.filterAll': { en: 'All', sl: 'Vse' },

  // III. Technical solutions
  'tech.kicker': { en: 'III. Technical solutions', sl: 'III. Tehnične rešitve' },
  'tech.title': { en: 'For tills, catalogues and quick payouts', sl: 'Za blagajne, kataloge in hitra izplačila' },
  'tech.subtitle': {
    en: 'Tools for providers who already run their own systems — and for those who want no login at all.',
    sl: 'Orodja za ponudnike, ki že imajo svoj sistem – in za tiste, ki nočejo nobene prijave.',
  },
  'tech.pos.name': { en: 'LanaPay POS', sl: 'LanaPay POS' },
  'tech.pos.tag': { en: 'POS & ERP integration for physical tills', sl: 'Integracija POS in ERP za fizične blagajne' },
  'tech.pos.desc': {
    en: 'The till rings up the sale in fiat (EUR, GBP or USD), scans the customer’s Lana card and settles it with one API call — in LANA or in cash — with a synchronous answer while the customer is still at the counter. The scanned card travels as one opaque value, so the POS never changes when new currencies arrive.',
    sl: 'Blagajna izda račun v fiat valuti (EUR, GBP ali USD), skenira kupčevo Lana kartico in z enim API klicem poravna nakup – v LANI ali z gotovino – s sinhronim odgovorom, medtem ko kupec še stoji pri blagajni. Skenirana kartica potuje kot ena sama neprebrana vrednost, zato se ob novih valutah POS ne spreminja.',
  },
  'tech.pos.b1': { en: 'One REST call per sale, synchronous outcome', sl: 'En REST klic na prodajo, sinhron izid' },
  'tech.pos.b2': { en: 'Cash or LANA — every sale says which tenders it can take', sl: 'Gotovina ali LANA – vsaka prodaja pove, kateri tir je na voljo' },
  'tech.pos.b3': { en: 'Webhooks for the back office and ERP', sl: 'Webhooki za zaledje in ERP' },
  'tech.pos.cta': { en: 'POS documentation', sl: 'Dokumentacija POS' },
  'tech.feed.name': { en: 'Lana Feed', sl: 'Lana Feed' },
  'tech.feed.tag': { en: 'Bulk catalogue import', sl: 'Masovni uvoz katalogov' },
  'tech.feed.desc': {
    en: 'Upload the export your system already produces — CSV, XLSX, JSON or XML in any shape. AI proposes the column mapping once, then every product is published as a signed offer in your storefront on shop.lanapays.us. Re-imports update only the rows that changed.',
    sl: 'Naloži izvoz, ki ga tvoj sistem že zna narediti – CSV, XLSX, JSON ali XML v kakršnikoli obliki. Umetna inteligenca enkrat predlaga preslikavo stolpcev, nato se vsak izdelek objavi kot podpisana ponudba v tvoji trgovini na shop.lanapays.us. Ponovni uvoz posodobi le spremenjene vrstice.',
  },
  'tech.feed.b1': { en: 'Up to 10,000 rows per import', sl: 'Do 10.000 vrstic na uvoz' },
  'tech.feed.b2': { en: 'Images served from the public Blossom server', sl: 'Slike s javnega strežnika Blossom' },
  'tech.feed.b3': { en: 'Offers signed in the browser, never by the server', sl: 'Ponudbe podpiše brskalnik, nikoli strežnik' },
  'tech.feed.cta': { en: 'Open Lana Feed', sl: 'Odpri Lana Feed' },
  'tech.fund.name': { en: 'LanaFund.Me', sl: 'LanaFund.Me' },
  'tech.fund.tag': { en: 'Scan a key, get paid', sl: 'Skeniraj ključ, prejmi plačilo' },
  'tech.fund.desc': {
    en: 'No login and no approval to wait for: scan your card, enter your payout details and accept LANA payments. The amount lands on your bank account within three days and a 3% reward arrives in LANA on the scanned card. Made for one-off sales, events and everything that needs no permanent till.',
    sl: 'Brez prijave in brez čakanja na odobritev: skeniraš kartico, vneseš podatke za izplačilo in sprejemaš plačila v LANI. Znesek prejmeš na račun v treh dneh, 3 % nagrade pa v LANI na skenirano kartico. Za enkratne prodaje, dogodke in vse, kar ne potrebuje stalne blagajne.',
  },
  'tech.fund.b1': { en: 'Two scans — register and receive', sl: 'Dva skena – registracija in prejem' },
  'tech.fund.b2': { en: 'Payout to the bank within 3 days', sl: 'Izplačilo na banko v 3 dneh' },
  'tech.fund.b3': { en: 'Remote payment request by link', sl: 'Zahtevek za plačilo na daljavo' },
  'tech.fund.cta': { en: 'Open LanaFund.Me', sl: 'Odpri LanaFund.Me' },

  // Shared
  'common.open': { en: 'Open', sl: 'Odpri' },
  'common.visit': { en: 'Visit', sl: 'Obišči' },

  // Learn More page
  'learn.title': { en: 'More about the Economy of Abundance', sl: 'Več o Ekonomiji Obilja' },
  'learn.back': { en: 'Back to the home page', sl: 'Nazaj na domačo stran' },
  'learn.lana8wonder.title': { en: 'Lana8Wonder', sl: 'Lana8Wonder' },
  'learn.lana8wonder.content': {
    en: 'By purchasing Lana8Wonder, you become a supporter of the Lana life cycle. The maximum amount an individual can invest in Lana is 100 Euros, and with that they receive a Lana package that is gradually sold into the Economy of Abundance. More about this at Lana8Wonder.com. These Lanas can also be obtained by the user through consumption.',
    sl: 'Z nakupom Lana8Wonder postanete podpornik življenjskega cikla Lane. Največji znesek, ki ga posameznik lahko vloži v Lano, je 100 evrov; s tem dobi paketek Lan, ki ga sčasoma odprodaja v Ekonomijo Obilja. Več o tem na Lana8Wonder.com. Te Lane lahko uporabnik pridobi tudi s potrošnjo.',
  },
  'learn.crowdfunding.title': { en: 'Crowdfunding', sl: 'Crowdfunding' },
  'learn.crowdfunding.content': {
    en: 'Merchants have the opportunity to receive various donations to transform their activities and way of working in the direction of Life.',
    sl: 'Trgovci imajo možnost pridobiti razne donacije za preoblikovanje svojih dejavnosti in načina delovanja v smeri Življenja.',
  },
  'learn.responsibility.title': { en: 'Unconditional Self-Responsibility', sl: 'Brezpogojna Samoodgovornost' },
  'learn.responsibility.content': {
    en: 'We are all taught to act according to some old patterns out of fear of not having enough, so we are all quite stingy when it comes to the quality we give. This causes anger in buyers and conflicts occur. These conflicts are resolved through unconditional self-responsibility — the seller accepts it on one side, and the buyer on the other, as the latter may also have had excessively high expectations.',
    sl: 'Vsi smo naučeni delovati po nekih starih vzorcih iz strahu, da nimamo dovolj, zato smo vsi precej škrti, kar zadeva kakovost, ki jo dajemo od sebe. To povzroča jezo pri kupcih in prihaja do konfliktov. Te konflikte razrešujemo prek brezpogojne samoodgovornosti – na eni strani jo sprejme prodajalec, na drugi pa kupec, ker je morda tudi slednji imel previsoka pričakovanja.',
  },
  'learn.financing.title': { en: 'Consumer Financing', sl: 'Financiranje potrošnje' },
  'learn.financing.content': {
    en: 'The Economy of Abundance is a living financial mechanism that happens in cycles similar to inhaling and exhaling. This economy grows organically and extremely stably, which is why it also enables stable returns for investors. People who educate themselves about the workings of this system can participate in financing.',
    sl: 'Ekonomija Obilja je živo finančno kolesje, ki se dogaja v ciklih, podobnih vdihu in izdihu. Ta ekonomija raste organsko in izjemno stabilno, zato tudi omogoča stabilne donose za vlagatelje. Pri financiranju lahko sodelujejo ljudje, ki se podučijo o delovanju tega sistema.',
  },

  // 404
  'notfound.title': { en: 'Oops! Page not found', sl: 'Ups! Stran ni najdena' },
  'notfound.back': { en: 'Return to Home', sl: 'Nazaj na domačo stran' },

  // Footer
  'footer.tagline': { en: 'Together we build the Economy of Abundance — and have a good time :)', sl: 'Gradimo skupaj Ekonomijo Obilja – in se mamo fajn :)' },
  'footer.col.pillars': { en: 'Services', sl: 'Sklopi' },
  'footer.col.more': { en: 'More', sl: 'Več' },
  'footer.col.tech': { en: 'Technical solutions', sl: 'Tehnične rešitve' },
  'footer.col.eco': { en: 'Ecosystem', sl: 'Ekosistem' },
  'footer.eco.connects': { en: 'LanaConnects.us — live system', sl: 'LanaConnects.us – sistem v živo' },
  'footer.eco.direct': { en: 'direct.lana.fund — investors', sl: 'direct.lana.fund – vlagatelji' },
  'footer.eco.shop': { en: 'shop.lanapays.us — business units', sl: 'shop.lanapays.us – poslovne enote' },
  'footer.eco.discount': { en: 'lana.discount — treasury', sl: 'lana.discount – zakladnica' },
  'footer.eco.wonder': { en: 'Lana8Wonder — personal balance', sl: 'Lana8Wonder – osebno ravnovesje' },
  'footer.eco.wallet': { en: 'Check your wallet', sl: 'Preveri denarnico' },
  'footer.eco.bef': { en: 'BalancedExchangeFrame.work', sl: 'BalancedExchangeFrame.work' },
  'footer.events': { en: 'Events', sl: 'Dogodki' },
  'footer.shops': { en: 'Where can I buy?', sl: 'Kje lahko kupujem?' },
  'footer.bef': { en: 'The framework (BEF)', sl: 'Okvir (BEF)' },
  'footer.posts': { en: 'News & Guides', sl: 'Novice & Navodila' },
  'footer.admin': { en: 'Editorial', sl: 'Uredništvo' },
  'footer.copy': { en: '© 2026 Economy of Abundance. All rights reserved.', sl: '© 2026 Ekonomija Obilja. Vse pravice pridržane.' },

  // Language switcher
  'lang.en': { en: 'EN', sl: 'EN' },
  'lang.sl': { en: 'SI', sl: 'SI' },
} as const;

export type TranslationKey = keyof typeof translations;

export default translations;
