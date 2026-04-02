import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import HeroCarousel from "@/components/HeroCarousel";
import { Store, Wallet, BookOpen, ShoppingBag, Calendar, MapPin, Tag, Loader2, RefreshCw } from "lucide-react";

interface MerchantUnit {
  name: string;
  category: string;
  categoryDetail: string;
  receiverCity: string;
  receiverCountry: string;
  image: string;
  content: string;
  pubkey: string;
  unitId: string;
  createdAt: number;
}

const RELAYS = [
  'wss://relay.lanavault.space',
  'wss://relay.lanacoin-eternity.com',
  'wss://relay.lanaheartvoice.com',
];

function fetchMerchantsFromRelays(timeout = 15000): Promise<MerchantUnit[]> {
  return new Promise((resolve) => {
    const allEvents: any[] = [];
    const seenIds = new Set<string>();
    let completed = 0;

    const onDone = () => {
      completed++;
      if (completed >= RELAYS.length) {
        // Deduplicate by pubkey:d-tag, keep newest
        const byKey = new Map<string, any>();
        for (const ev of allEvents) {
          const dTag = ev.tags?.find((t: string[]) => t[0] === 'd')?.[1] || '';
          const key = `${ev.pubkey}:${dTag}`;
          const existing = byKey.get(key);
          if (!existing || ev.created_at > existing.created_at) byKey.set(key, ev);
        }

        const units: MerchantUnit[] = [];
        for (const ev of byKey.values()) {
          const get = (n: string) => ev.tags?.find((t: string[]) => t[0] === n)?.[1] || '';
          const images = ev.tags?.filter((t: string[]) => t[0] === 'image').map((t: string[]) => t[1]) || [];
          const status = get('status') || 'active';
          const name = get('name');
          if (status !== 'active' || !name || images.length === 0) continue;
          units.push({
            name,
            category: get('category'),
            categoryDetail: get('category_detail'),
            receiverCity: get('receiver_city'),
            receiverCountry: get('receiver_country'),
            image: images[0],
            content: ev.content || '',
            pubkey: ev.pubkey,
            unitId: get('unit_id') || get('d') || '',
            createdAt: ev.created_at,
          });
        }
        resolve(units);
      }
    };

    for (const relayUrl of RELAYS) {
      try {
        const ws = new WebSocket(relayUrl);
        const subId = `m_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const t = setTimeout(() => { try { ws.close(); } catch {} onDone(); }, timeout);

        ws.onopen = () => ws.send(JSON.stringify(['REQ', subId, { kinds: [30901] }]));
        ws.onmessage = (e) => {
          try {
            const msg = JSON.parse(e.data);
            if (msg[0] === 'EVENT' && msg[1] === subId && !seenIds.has(msg[2].id)) {
              seenIds.add(msg[2].id);
              allEvents.push(msg[2]);
            }
            if (msg[0] === 'EOSE') { clearTimeout(t); ws.close(); onDone(); }
          } catch {}
        };
        ws.onerror = () => { clearTimeout(t); onDone(); };
      } catch { onDone(); }
    }
  });
}

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

const events = [
  { title: "Lana Delavnica: Osnove Ekonomije Obilja", date: "15. april 2026", location: "Ljubljana" },
  { title: "Srečanje skupnosti Lana", date: "28. april 2026", location: "Maribor" },
  { title: "Lana Festival Obilja 2026", date: "10. maj 2026", location: "Bled" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const Index = () => {
  const [merchants, setMerchants] = useState<MerchantUnit[]>([]);
  const [displayed, setDisplayed] = useState<MerchantUnit[]>([]);
  const [isMerchantsLoading, setIsMerchantsLoading] = useState(true);

  useEffect(() => {
    fetchMerchantsFromRelays().then(units => {
      setMerchants(units);
      setDisplayed(pickRandom(units, 3));
      setIsMerchantsLoading(false);
    });
  }, []);

  const handleShuffle = () => setDisplayed(pickRandom(merchants, 3));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h1 className="text-2xl font-display font-bold text-primary">Ekonomija Obilja</h1>
        <a
          href="https://mobile.lanapays.us"
          className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          Log in
        </a>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-16">
        {/* Carousel */}
        <HeroCarousel />

        {/* About */}
        <motion.section
          className="text-center max-w-3xl mx-auto space-y-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-4xl font-display font-bold text-primary">
            Ekonomija Obilja preoblikuje Ekonomijo v nekaj več
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-lg text-muted-foreground leading-relaxed">
            V Ekonomiji Obilja se ne gre samo zato, da imamo več denarja, ampak se preoblikuje naš odnos do denarja v bolj lahkotnega.
          </motion.p>
        </motion.section>

        {/* Action Links */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Store, label: "Register farm, shop...", href: "https://shop.lanapays.us", desc: "Registrirajte svojo dejavnost" },
            { icon: Wallet, label: "Check Wallet", href: "https://check.lanapays.us", desc: "Preverite stanje vaše denarnice" },
            { icon: BookOpen, label: "Learn more", href: "/learn-more", internal: true, desc: "Več o Ekonomiji Obilja" },
          ].map((item, i) => {
            const content = (
              <motion.div
                key={item.label}
                variants={fadeUp}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="flex flex-col items-center p-8 rounded-xl bg-card border border-border hover:shadow-lg hover:border-gold transition-all cursor-pointer group"
              >
                <item.icon className="w-10 h-10 text-gold mb-4 group-hover:scale-110 transition-transform" />
                <span className="font-display font-semibold text-lg text-foreground">{item.label}</span>
                <span className="text-sm text-muted-foreground mt-1">{item.desc}</span>
              </motion.div>
            );
            if (item.internal) return <Link key={item.label} to={item.href!}>{content}</Link>;
            return <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer">{content}</a>;
          })}
        </section>

        {/* Where to Buy */}
        <section>
          <motion.div
            className="flex items-center justify-between mb-6"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
          >
            <h2 className="text-2xl font-display font-bold text-primary flex items-center gap-3">
              <ShoppingBag className="w-7 h-7 text-gold" /> Where can I Buy?
            </h2>
            {merchants.length > 3 && (
              <button
                onClick={handleShuffle}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition"
              >
                <RefreshCw className="w-4 h-4" />
                Show others
              </button>
            )}
          </motion.div>

          {isMerchantsLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <p className="text-sm">Loading shops from Nostr relays...</p>
            </div>
          )}

          {!isMerchantsLoading && displayed.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Store className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No active shops found at the moment.</p>
            </div>
          )}

          {!isMerchantsLoading && displayed.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {displayed.map((unit, i) => (
                <motion.a
                  key={unit.unitId}
                  href={`https://shop.lanapays.us/shop/${unit.pubkey}/${unit.unitId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  variants={fadeUp} custom={i + 1}
                  initial="hidden" whileInView="visible" viewport={{ once: true }}
                  className="rounded-xl bg-card border border-border overflow-hidden hover:shadow-lg hover:border-gold transition-all cursor-pointer group"
                >
                  <div className="h-40 overflow-hidden relative">
                    <img
                      src={unit.image}
                      alt={unit.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-white font-display font-semibold text-lg leading-tight drop-shadow-md">
                        {unit.name}
                      </h3>
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    {unit.category && (
                      <p className="text-muted-foreground text-sm flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5" />
                        <span className="truncate">{unit.category}{unit.categoryDetail ? ` / ${unit.categoryDetail}` : ''}</span>
                      </p>
                    )}
                    {(unit.receiverCity || unit.receiverCountry) && (
                      <p className="text-muted-foreground text-sm flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="truncate">{[unit.receiverCity, unit.receiverCountry].filter(Boolean).join(', ')}</span>
                      </p>
                    )}
                    {unit.content && (
                      <p className="text-muted-foreground text-sm line-clamp-2">{unit.content}</p>
                    )}
                  </div>
                </motion.a>
              ))}
            </div>
          )}

          {!isMerchantsLoading && merchants.length > 0 && (
            <motion.div
              className="text-center mt-6"
              variants={fadeUp} custom={4}
              initial="hidden" whileInView="visible" viewport={{ once: true }}
            >
              <a
                href="https://shop.lanapays.us"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                <Store className="w-4 h-4" />
                View all {merchants.length} shops
              </a>
            </motion.div>
          )}
        </section>

        {/* Events */}
        <section>
          <motion.h2
            className="text-2xl font-display font-bold text-primary mb-6 flex items-center gap-3"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
          >
            <Calendar className="w-7 h-7 text-gold" /> Lana Events
          </motion.h2>
          <div className="space-y-4">
            {events.map((event, i) => (
              <motion.div
                key={event.title}
                variants={fadeUp} custom={i + 1}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="flex items-center gap-6 p-5 rounded-xl bg-card border border-border hover:border-gold transition-colors"
              >
                <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-primary flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground">{event.title}</h3>
                  <p className="text-sm text-muted-foreground">{event.date} · {event.location}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      <footer className="text-center py-8 text-sm text-muted-foreground border-t border-border">
        © 2026 Ekonomija Obilja. Vsa pravica pridržana.
      </footer>
    </div>
  );
};

export default Index;
