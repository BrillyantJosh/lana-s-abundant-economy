import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Loader2, Radio, Clock, Globe, MapPin, Languages, ChevronDown, ChevronUp, ExternalLink, Users, Tag, Video } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import SectionHeading from "./SectionHeading";
import {
  fetchEventsFromRelays,
  getEventStatus,
  formatEventDate,
  formatEventTime,
  LANGUAGE_LABELS,
  EVENT_TYPE_LABELS,
  LANG_TO_EVENT_LANG,
  fadeUp,
  type LanaEvent,
} from "@/lib/relayData";

export default function EventsSection() {
  const { lang, t } = useLanguage();
  const [allEvents, setAllEvents] = useState<LanaEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetchEventsFromRelays().then((events) => {
      setAllEvents(events);
      setIsLoading(false);
    });
  }, []);

  // Events in the chosen language + every in-person event (location matters regardless of language).
  const events = useMemo(() => {
    const eventLang = LANG_TO_EVENT_LANG[lang] || "en";
    return allEvents.filter((e) => e.language === eventLang || !e.isOnline);
  }, [allEvents, lang]);

  const toggle = (dTag: string) => setExpanded((prev) => (prev === dTag ? null : dTag));

  return (
    <div id="dogodki" className="section-anchor">
      <SectionHeading
        compact
        icon={<Calendar className="h-5 w-5" />}
        kicker={t("events.kicker")}
        title={t("events.title")}
        subtitle={t("events.subtitle")}
        aside={
          <a href={`https://lana.events?lang=${lang}`} target="_blank" rel="noopener noreferrer" className="link-arrow text-sm">
            {t("events.portal")} <ExternalLink className="h-3.5 w-3.5" />
          </a>
        }
      />

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="mb-2 h-6 w-6 animate-spin" />
          <p className="text-sm">{t("events.loading")}</p>
        </div>
      )}

      {!isLoading && events.length === 0 && (
        <div className="rounded-[1.4rem] glass py-12 text-center text-muted-foreground">
          <Calendar className="mx-auto mb-2 h-10 w-10 opacity-40" />
          <p className="text-sm">{t("events.empty")}</p>
        </div>
      )}

      {!isLoading && events.length > 0 && (
        <div className="space-y-4">
          {events.map((event, i) => {
            const status = getEventStatus(event);
            const isExpanded = expanded === event.dTag;
            return (
              <motion.div
                key={event.dTag}
                variants={fadeUp}
                custom={Math.min(i + 1, 4)}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="overflow-hidden rounded-[1.4rem] glass card-frame transition-colors hover:border-gold/60"
              >
                <button type="button" onClick={() => toggle(event.dTag)} className="flex w-full items-start gap-3 p-4 text-left sm:gap-6 sm:p-5" aria-expanded={isExpanded}>
                  {event.cover ? (
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-gold/25 sm:h-20 sm:w-20">
                      <img src={event.cover} alt="" loading="lazy" className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-gold/35 bg-white/60 text-jade-deep">
                      <Calendar className="h-6 w-6" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      {status === "happening-now" && (
                        <span className="inline-flex animate-pulse items-center gap-1 rounded-full bg-lotus/45 px-2 py-0.5 text-xs font-bold text-[hsl(352_45%_36%)]">
                          <Radio className="h-3 w-3" /> {t("events.live")}
                        </span>
                      )}
                      {status === "today" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gold/20 px-2 py-0.5 text-xs font-bold text-gold-deep">
                          <Clock className="h-3 w-3" /> {t("events.today")}
                        </span>
                      )}
                      {event.isOnline ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-jade/12 px-2 py-0.5 text-xs font-medium text-jade-deep">
                          <Globe className="h-3 w-3" /> {t("events.online")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-xs font-medium text-gold-deep">
                          <MapPin className="h-3 w-3" /> {t("events.inPerson")}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 rounded-full bg-lotus/35 px-2 py-0.5 text-xs font-medium text-[hsl(352_40%_38%)]">
                        <Languages className="h-3 w-3" /> {LANGUAGE_LABELS[event.language] || event.language}
                      </span>
                      {event.eventType && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{EVENT_TYPE_LABELS[event.eventType] || event.eventType}</span>
                      )}
                    </div>

                    <h4 className="font-display text-xl font-semibold leading-tight text-jade-deep sm:text-[1.35rem]">{event.title}</h4>

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatEventDate(event.start, event.timezone, lang)}
                        {" · "}
                        {formatEventTime(event.start, event.timezone, lang)}
                        {event.end && ` – ${formatEventTime(event.end, event.timezone, lang)}`}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {event.location}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-1 shrink-0 text-muted-foreground">{isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}</div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                      <div className="space-y-4 border-t border-gold/15 px-4 pb-4 sm:px-5 sm:pb-5">
                        {event.cover && (
                          <div className="mt-4 max-h-64 overflow-hidden rounded-xl">
                            <img src={event.cover} alt={event.title} className="h-full w-full object-cover" />
                          </div>
                        )}
                        {event.content && (
                          <div className="mt-4">
                            <h5 className="mb-1 font-body text-sm font-bold text-foreground">{t("events.description")}</h5>
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{event.content}</p>
                          </div>
                        )}
                        {event.schedule.length > 0 && (
                          <div>
                            <h5 className="mb-2 flex items-center gap-1.5 font-body text-sm font-bold text-foreground">
                              <Clock className="h-4 w-4" /> {t("events.schedule", { count: event.schedule.length })}
                            </h5>
                            <div className="space-y-1.5">
                              {event.schedule.map((entry, idx) => (
                                <div key={idx} className="flex items-center gap-3 rounded-lg bg-white/50 px-3 py-2 text-sm text-muted-foreground">
                                  <span className="w-6 font-bold text-foreground">{idx + 1}.</span>
                                  <span>{formatEventDate(entry.start, event.timezone, lang)}</span>
                                  <span>
                                    {formatEventTime(entry.start, event.timezone, lang)}
                                    {entry.end && ` – ${formatEventTime(entry.end, event.timezone, lang)}`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                          {event.timezone && (
                            <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4 shrink-0" /><span>{t("events.timezone", { tz: event.timezone })}</span></div>
                          )}
                          {event.location && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4 shrink-0" />
                              <span>{event.location}</span>
                              {event.lat && event.lon && (
                                <a href={`https://maps.google.com/?q=${event.lat},${event.lon}`} target="_blank" rel="noopener noreferrer" className="text-jade hover:underline" aria-label={t("events.openMap")} title={t("events.openMap")}>
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              )}
                            </div>
                          )}
                          {event.capacity && (
                            <div className="flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4 shrink-0" /><span>{t("events.capacity", { n: event.capacity })}</span></div>
                          )}
                          {event.fiatValue != null && event.fiatValue > 0 && (
                            <div className="flex items-center gap-2 text-muted-foreground"><Tag className="h-4 w-4 shrink-0" /><span>{t("events.value", { n: event.fiatValue })}</span></div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {event.onlineUrl && (
                            <a href={event.onlineUrl} target="_blank" rel="noopener noreferrer" className="btn btn-jade !py-2 text-xs" onClick={(e) => e.stopPropagation()}>
                              <Globe className="h-4 w-4" /> {t("events.joinOnline")}
                            </a>
                          )}
                          {event.youtubeUrl && (
                            <a href={event.youtubeUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost !py-2 text-xs" onClick={(e) => e.stopPropagation()}>
                              <Video className="h-4 w-4" /> {t("events.watchYoutube")}
                            </a>
                          )}
                          {event.youtubeRecordingUrl && (
                            <a href={event.youtubeRecordingUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost !py-2 text-xs" onClick={(e) => e.stopPropagation()}>
                              <Video className="h-4 w-4" /> {t("events.recording")}
                            </a>
                          )}
                        </div>
                        {event.guests.length > 0 && <div className="text-sm text-muted-foreground">{t("events.guests", { count: event.guests.length })}</div>}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
