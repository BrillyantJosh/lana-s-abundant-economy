import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Sprout, Heart, HandCoins, TrendingUp } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const sections = [
  {
    icon: Sprout,
    title: "Lana8Wonder",
    content: `Z nakupom Lana8Wonder postanete podpornik življenskega cikla Lane. Največji znesek, ki ga posameznik lahko vloži v Lano je 100 Evrov in s tem dobi paketek Lan, ki ga s časoma odprodaja v Ekonomijo Obilja. Več o tem na Lana8Wonder.com. Te Lane lahko uporabnik tudi pridobi skozi potrošnjo.`,
    link: { label: "Lana8Wonder.com", href: "https://lana8wonder.com" },
  },
  {
    icon: Heart,
    title: "Crowdfunding",
    content: `Trgovci imajo možnost dobiti razne donacije za preoblikovanje svojih dejavnosti v smeri Življenja.`,
  },
  {
    icon: HandCoins,
    title: "Brezpogojna Samoodgovornost",
    content: `Vsi smo naučeni delovati po nekih starih vzorcih iz strahu, da nimamo dovolj zato smo vsi precej škrti ko zadeva kakovosti, ki jo dajemo od sebe. To povzroča pri kupcih jezo in dogajajo se konflikti. Te konflikte se razrešuje preko brezpogojne samoodgovornosti. Torej na eni strani jo sprejme prodajalec in na drugi strani jo sprejme kupec, ker je tudi slednji morda imeli previsoka pričakovanja.`,
  },
  {
    icon: TrendingUp,
    title: "Financiranje potrošnje",
    content: `Ekonomija Obilja je živo finančno kolesje, ki se dogaja v ciklih podobnih vdihu in izdihu. Ta ekonomija raste organsko in izjemno stabilno zato tudi omogoča stabilne donose za vlagatelje. Pri financiranju lahko sodelujejo ljudje, ki se podučijo o delovanju tega sistema.`,
  },
];

const LearnMore = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <Link to="/" className="flex items-center gap-2 text-primary font-display font-bold text-xl hover:opacity-80 transition-opacity">
          <ArrowLeft className="w-5 h-5" /> Ekonomija Obilja
        </Link>
        <a
          href="https://mobile.lanapays.us"
          className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          Log in
        </a>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12 space-y-10">
        <motion.h1
          className="text-3xl md:text-4xl font-display font-bold text-primary text-center"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        >
          Več o Ekonomiji Obilja
        </motion.h1>

        {sections.map((section, i) => (
          <motion.div
            key={section.title}
            variants={fadeUp}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="p-8 rounded-xl bg-card border border-border"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
                <section.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground">{section.title}</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">{section.content}</p>
            {section.link && (
              <a
                href={section.link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 text-sm font-semibold text-gold hover:underline"
              >
                {section.link.label} →
              </a>
            )}
          </motion.div>
        ))}
      </main>

      <footer className="text-center py-8 text-sm text-muted-foreground border-t border-border">
        © 2026 Ekonomija Obilja. Vsa pravica pridržana.
      </footer>
    </div>
  );
};

export default LearnMore;
