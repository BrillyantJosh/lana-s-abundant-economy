import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import HeroCarousel from "@/components/HeroCarousel";
import { Store, Wallet, BookOpen, ShoppingBag, Calendar, MapPin } from "lucide-react";

const shops = [
  { name: "Bio Tržnica Ljubljana", location: "Ljubljana, Slovenija", type: "Ekološka tržnica" },
  { name: "Zeleni Kotiček", location: "Maribor, Slovenija", type: "Trgovina z lokalno hrano" },
  { name: "Naravna Pot", location: "Celje, Slovenija", type: "Trgovina z naravnimi izdelki" },
];

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
          <motion.h2
            className="text-2xl font-display font-bold text-primary mb-6 flex items-center gap-3"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
          >
            <ShoppingBag className="w-7 h-7 text-gold" /> Where can I Buy?
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {shops.map((shop, i) => (
              <motion.div
                key={shop.name}
                variants={fadeUp} custom={i + 1}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="p-6 rounded-xl bg-card border border-border"
              >
                <h3 className="font-display font-semibold text-foreground text-lg">{shop.name}</h3>
                <p className="text-muted-foreground text-sm mt-1 flex items-center gap-1"><MapPin className="w-4 h-4" />{shop.location}</p>
                <span className="inline-block mt-3 text-xs font-semibold px-3 py-1 rounded-full bg-muted text-muted-foreground">{shop.type}</span>
              </motion.div>
            ))}
          </div>
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
