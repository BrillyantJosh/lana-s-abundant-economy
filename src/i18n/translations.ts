export type Lang = 'en' | 'sl';

const translations = {
  // Header
  'header.title': { en: 'Economy of Abundance', sl: 'Ekonomija Obilja' },
  'header.login': { en: 'Log in', sl: 'Prijava' },

  // Hero / About
  'about.title': {
    en: 'Economy of Abundance transforms the Economy into something more',
    sl: 'Ekonomija Obilja preoblikuje Ekonomijo v nekaj več',
  },
  'about.description': {
    en: 'Breathe life into your products and services — as a token of gratitude, your business will receive up to 20% of the invoice value, and so will your customers.',
    sl: 'Vdahnite življenje svojim izdelkom in storitvam – v znak hvaležnosti bo vaše podjetje prejelo do 20 % vrednosti izdanega računa, enako pa tudi vaši kupci.',
  },

  // Action links
  'action.register': { en: 'Register farm, shop...', sl: 'Registriraj kmetijo, trgovino...' },
  'action.register.desc': { en: 'Register your business', sl: 'Registrirajte svojo dejavnost' },
  'action.wallet': { en: 'Check Wallet', sl: 'Preveri denarnico' },
  'action.wallet.desc': { en: 'Check your wallet balance', sl: 'Preverite stanje vaše denarnice' },
  'action.learn': { en: 'Learn more', sl: 'Več o tem' },
  'action.learn.desc': { en: 'More about the Economy of Abundance', sl: 'Več o Ekonomiji Obilja' },

  // Where to buy
  'shops.title': { en: 'Where can I Buy?', sl: 'Kje lahko kupim?' },
  'shops.shuffle': { en: 'Show others', sl: 'Prikaži druge' },
  'shops.loading': { en: 'Loading shops from Nostr relays...', sl: 'Nalagam trgovine iz Nostr relayjev...' },
  'shops.empty': { en: 'No active shops found at the moment.', sl: 'Trenutno ni aktivnih trgovin.' },
  'shops.viewAll': { en: 'View all {count} shops', sl: 'Poglej vseh {count} trgovin' },

  // Events
  'events.title': { en: 'Lana Events', sl: 'Lana Dogodki' },
  'events.loading': { en: 'Loading events from Nostr relays...', sl: 'Nalagam dogodke iz Nostr relayjev...' },
  'events.empty': { en: 'No upcoming events at the moment.', sl: 'Trenutno ni prihajajočih dogodkov.' },
  'events.live': { en: 'LIVE', sl: 'V ŽIVO' },
  'events.today': { en: 'Today', sl: 'Danes' },
  'events.online': { en: 'Online', sl: 'Spletno' },
  'events.inPerson': { en: 'In Person', sl: 'V živo' },
  'events.description': { en: 'Description', sl: 'Opis' },
  'events.schedule': { en: 'Schedule ({count} days)', sl: 'Urnik ({count} dni)' },
  'events.timezone': { en: 'Timezone: {tz}', sl: 'Časovni pas: {tz}' },
  'events.capacity': { en: 'Capacity: {n}', sl: 'Kapaciteta: {n}' },
  'events.value': { en: 'Value: {n} EUR', sl: 'Vrednost: {n} EUR' },
  'events.joinOnline': { en: 'Join Online', sl: 'Pridruži se spletno' },
  'events.watchYoutube': { en: 'Watch on YouTube', sl: 'Oglej si na YouTube' },
  'events.recording': { en: 'Recording', sl: 'Posnetek' },
  'events.guests': { en: '{count} guests invited', sl: '{count} povabljenih gostov' },

  // Learn More page
  'learn.title': { en: 'More about the Economy of Abundance', sl: 'Več o Ekonomiji Obilja' },
  'learn.lana8wonder.title': { en: 'Lana8Wonder', sl: 'Lana8Wonder' },
  'learn.lana8wonder.content': {
    en: 'By purchasing Lana8Wonder, you become a supporter of the Lana life cycle. The maximum amount an individual can invest in Lana is 100 Euros, receiving a Lana package that is gradually sold into the Economy of Abundance. Learn more at Lana8Wonder.com. Users can also earn Lana through consumption.',
    sl: 'Z nakupom Lana8Wonder postanete podpornik življenskega cikla Lane. Največji znesek, ki ga posameznik lahko vloži v Lano je 100 Evrov in s tem dobi paketek Lan, ki ga s časoma odprodaja v Ekonomijo Obilja. Več o tem na Lana8Wonder.com. Te Lane lahko uporabnik tudi pridobi skozi potrošnjo.',
  },
  'learn.crowdfunding.title': { en: 'Crowdfunding', sl: 'Crowdfunding' },
  'learn.crowdfunding.content': {
    en: 'Merchants have the opportunity to receive various donations to transform their businesses in the direction of Life.',
    sl: 'Trgovci imajo možnost dobiti razne donacije za preoblikovanje svojih dejavnosti v smeri Življenja.',
  },
  'learn.responsibility.title': { en: 'Unconditional Self-Responsibility', sl: 'Brezpogojna Samoodgovornost' },
  'learn.responsibility.content': {
    en: 'We are all conditioned to operate from old patterns rooted in the fear of not having enough, which makes us stingy about the quality we give. This causes anger in buyers, leading to conflicts. These conflicts are resolved through unconditional self-responsibility — the seller accepts it on one side, and the buyer on the other, as they may have had excessively high expectations.',
    sl: 'Vsi smo naučeni delovati po nekih starih vzorcih iz strahu, da nimamo dovolj zato smo vsi precej škrti ko zadeva kakovosti, ki jo dajemo od sebe. To povzroča pri kupcih jezo in dogajajo se konflikti. Te konflikte se razrešuje preko brezpogojne samoodgovornosti. Torej na eni strani jo sprejme prodajalec in na drugi strani jo sprejme kupec, ker je tudi slednji morda imeli previsoka pričakovanja.',
  },
  'learn.financing.title': { en: 'Consumer Financing', sl: 'Financiranje potrošnje' },
  'learn.financing.content': {
    en: 'The Economy of Abundance is a living financial mechanism that operates in cycles similar to breathing in and out. This economy grows organically and extremely stably, enabling stable returns for investors. People who educate themselves about how this system works can participate in financing.',
    sl: 'Ekonomija Obilja je živo finančno kolesje, ki se dogaja v ciklih podobnih vdihu in izdihu. Ta ekonomija raste organsko in izjemno stabilno zato tudi omogoča stabilne donose za vlagatelje. Pri financiranju lahko sodelujejo ljudje, ki se podučijo o delovanju tega sistema.',
  },

  // 404
  'notfound.title': { en: 'Oops! Page not found', sl: 'Ups! Stran ni najdena' },
  'notfound.back': { en: 'Return to Home', sl: 'Nazaj na domačo stran' },

  // Footer
  'footer.copy': { en: '© 2026 Economy of Abundance. All rights reserved.', sl: '© 2026 Ekonomija Obilja. Vse pravice pridržane.' },

  // Carousel
  'carousel.alt': { en: 'Economy of Abundance', sl: 'Ekonomija Obilja' },

  // Language switcher
  'lang.en': { en: 'EN', sl: 'EN' },
  'lang.sl': { en: 'SI', sl: 'SI' },
} as const;

export type TranslationKey = keyof typeof translations;

export default translations;
