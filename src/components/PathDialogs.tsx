import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { ArrowUpRight, Check, Clock, Zap, Sprout, Globe, ScanLine, FileSpreadsheet, Smartphone } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";
import { withLang } from "@/lib/relayData";
import Mandala from "./Mandala";
import LotusDivider, { LotusGlyph } from "./LotusDivider";

type Which = "register" | "login" | null;

interface Ctx {
  openRegister: () => void;
  openLogin: () => void;
}

const PathDialogContext = createContext<Ctx | null>(null);

export function usePathDialogs(): Ctx {
  const ctx = useContext(PathDialogContext);
  if (!ctx) throw new Error("usePathDialogs must be used within PathDialogProvider");
  return ctx;
}

type Approval = "auto" | "review";

interface Option {
  key: string;
  icon: ReactNode;
  tone: "gold" | "jade" | "lotus";
  name: TranslationKey;
  domain: string;
  href: string;
  /** the one line that decides for the reader */
  lead: TranslationKey;
  facts?: TranslationKey[];
  approval?: Approval;
  hint?: TranslationKey;
}

const TONES = {
  gold: "border-gold/50 bg-gold/10 text-gold-deep",
  jade: "border-jade/40 bg-jade/10 text-jade-deep",
  lotus: "border-lotus-deep/40 bg-lotus/30 text-[hsl(352_40%_40%)]",
};

function ApprovalBadge({ kind }: { kind: Approval }) {
  const { t } = useLanguage();
  const auto = kind === "auto";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.1em] ${
        auto ? "border-jade/40 bg-jade/12 text-jade-deep" : "border-gold/45 bg-gold/15 text-gold-deep"
      }`}
    >
      {auto ? <Check className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
      {t(auto ? "choose.approval.auto" : "choose.approval.review")}
    </span>
  );
}

function OptionCard({ option }: { option: Option }) {
  const { lang, t } = useLanguage();
  return (
    <a
      href={withLang(option.href, lang)}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex gap-4 rounded-2xl border border-gold/25 bg-white/60 p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/60 hover:bg-white/90 sm:p-5"
    >
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border ${TONES[option.tone]}`}>
        {option.icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <span className="font-display text-xl font-semibold leading-tight text-jade-deep">{t(option.name)}</span>
          <span className="font-body text-[10px] font-bold uppercase tracking-[0.18em] text-gold-deep/90">{option.domain}</span>
        </span>
        <span className="mt-1 block text-sm leading-relaxed text-foreground/80">{t(option.lead)}</span>
        {option.facts && (
          <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {option.facts.map((f) => (
              <span key={f} className="flex items-center gap-1.5 text-[13px] font-bold text-jade-deep/85">
                <LotusGlyph className="h-3 w-4 shrink-0 text-gold" />
                {t(f)}
              </span>
            ))}
          </span>
        )}
        {(option.approval || option.hint) && (
          <span className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            {option.approval && <ApprovalBadge kind={option.approval} />}
            {option.hint && <span className="text-xs italic leading-snug text-muted-foreground">{t(option.hint)}</span>}
          </span>
        )}
      </span>
      <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-gold-deep/60 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-gold-deep" />
    </a>
  );
}

/** Registration: Simple and the online shop approve themselves, Obilje is reviewed. */
const REGISTER: Option[] = [
  {
    key: "simple",
    icon: <Zap className="h-5 w-5" />,
    tone: "gold",
    name: "choose.reg.simple.name",
    domain: "simple.lanapays.us",
    href: "https://simple.lanapays.us/",
    lead: "choose.reg.simple.lead",
    facts: ["choose.reg.simple.reward", "choose.reg.simple.payment"],
    approval: "auto",
  },
  {
    key: "obilje",
    icon: <Sprout className="h-5 w-5" />,
    tone: "jade",
    name: "choose.reg.obilje.name",
    domain: "shop.lanapays.us",
    href: "https://shop.lanapays.us/welcome",
    lead: "choose.reg.obilje.lead",
    facts: ["choose.reg.obilje.reward", "choose.reg.obilje.payment"],
    approval: "review",
    hint: "choose.reg.obilje.hint",
  },
  {
    key: "online",
    icon: <Globe className="h-5 w-5" />,
    tone: "lotus",
    name: "choose.reg.online.name",
    domain: "pay.lanapays.us",
    href: "https://pay.lanapays.us/login",
    lead: "choose.reg.online.lead",
    facts: ["choose.reg.online.reward", "choose.reg.online.payment"],
    approval: "auto",
  },
];

const LOGIN: Option[] = [
  {
    key: "simple",
    icon: <Zap className="h-5 w-5" />,
    tone: "gold",
    name: "choose.log.simple.name",
    domain: "simple.lanapays.us",
    href: "https://simple.lanapays.us/",
    lead: "choose.log.simple.lead",
  },
  {
    key: "mobile",
    icon: <Smartphone className="h-5 w-5" />,
    tone: "jade",
    name: "choose.log.mobile.name",
    domain: "mobile.lanapays.us",
    href: "https://mobile.lanapays.us",
    lead: "choose.log.mobile.lead",
  },
  {
    key: "online",
    icon: <Globe className="h-5 w-5" />,
    tone: "lotus",
    name: "choose.log.online.name",
    domain: "pay.lanapays.us",
    href: "https://pay.lanapays.us/login",
    lead: "choose.log.online.lead",
  },
];

/** Tools a merchant only reaches once they already sell. */
const LOGIN_EXTRA: Option[] = [
  {
    key: "feed",
    icon: <FileSpreadsheet className="h-5 w-5" />,
    tone: "gold",
    name: "choose.log.feed.name",
    domain: "feed.lanapays.us",
    href: "https://feed.lanapays.us/login",
    lead: "choose.log.feed.lead",
  },
  {
    key: "pos",
    icon: <ScanLine className="h-5 w-5" />,
    tone: "jade",
    name: "choose.log.pos.name",
    domain: "pos.lanapays.us",
    href: "https://pos.lanapays.us/login",
    lead: "choose.log.pos.lead",
  },
];

export function PathDialogProvider({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const [which, setWhich] = useState<Which>(null);

  const openRegister = useCallback(() => setWhich("register"), []);
  const openLogin = useCallback(() => setWhich("login"), []);
  const value = useMemo(() => ({ openRegister, openLogin }), [openRegister, openLogin]);

  const isRegister = which === "register";

  return (
    <PathDialogContext.Provider value={value}>
      {children}
      <Dialog open={which !== null} onOpenChange={(open) => !open && setWhich(null)}>
        <DialogContent className="max-h-[92svh] max-w-2xl overflow-y-auto rounded-[1.6rem] border-gold/30 bg-[hsl(44_62%_98%)] p-0 shadow-[0_40px_80px_-40px_hsl(160_30%_15%/.6)]">
          <div className="relative overflow-hidden">
            <Mandala className="pointer-events-none absolute -right-24 -top-24 w-64 text-gold opacity-[0.09]" spin={false} />
            <div className="relative p-6 sm:p-8">
              <div className="text-center">
                <LotusGlyph className="mx-auto h-7 w-11 text-gold-deep" />
                <DialogTitle className="mt-2 font-display text-3xl font-semibold leading-tight text-jade-deep sm:text-4xl">
                  {t(isRegister ? "choose.reg.title" : "choose.log.title")}
                </DialogTitle>
                <DialogDescription className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                  {t(isRegister ? "choose.reg.subtitle" : "choose.log.subtitle")}
                </DialogDescription>
                <LotusDivider className="mt-4" />
              </div>

              <div className="mt-5 space-y-3">
                {(isRegister ? REGISTER : LOGIN).map((o) => (
                  <OptionCard key={o.key} option={o} />
                ))}
              </div>

              {isRegister ? (
                <p className="mt-5 rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-center text-[13px] leading-relaxed text-foreground/85">
                  {t("choose.reg.note")}
                </p>
              ) : (
                <>
                  <p className="mt-6 mb-3 text-center font-body text-[11px] font-bold uppercase tracking-[0.24em] text-gold-deep">
                    {t("choose.log.extra")}
                  </p>
                  <div className="space-y-3">
                    {LOGIN_EXTRA.map((o) => (
                      <OptionCard key={o.key} option={o} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PathDialogContext.Provider>
  );
}
