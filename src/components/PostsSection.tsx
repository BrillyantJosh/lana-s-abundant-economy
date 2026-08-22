import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Newspaper, Loader2, Video, ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import SectionHeading from "./SectionHeading";
import { POST_TYPE_COLORS, POST_TYPE_LABELS, getYoutubeEmbedUrl, fadeUp, type Post } from "@/lib/relayData";

export default function PostsSection() {
  const { lang, t } = useLanguage();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/posts")
      .then((r) => r.json())
      .then((data) => {
        setPosts(data.posts || []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const langPosts = useMemo(() => posts.filter((p) => p.language === lang), [posts, lang]);
  const filtered = useMemo(() => (filter ? langPosts.filter((p) => p.types.includes(filter)) : langPosts), [langPosts, filter]);
  const types = useMemo(() => {
    const set = new Set<string>();
    langPosts.forEach((p) => p.types.forEach((x) => set.add(x)));
    return Array.from(set);
  }, [langPosts]);

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${active ? "border-jade bg-jade text-cream" : "border-gold/40 bg-white/50 text-jade-deep hover:border-jade"}`;

  return (
    <div id="novice" className="section-anchor">
      <SectionHeading compact icon={<Newspaper className="h-5 w-5" />} kicker={t("posts.kicker")} title={t("posts.title")} subtitle={t("posts.subtitle")} />

      {types.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button type="button" onClick={() => setFilter(null)} className={chip(!filter)}>{t("posts.filterAll")}</button>
          {types.map((type) => (
            <button key={type} type="button" onClick={() => setFilter(filter === type ? null : type)} className={chip(filter === type)}>
              {POST_TYPE_LABELS[type]?.[lang] || type}
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="mb-2 h-6 w-6 animate-spin" />
          <p className="text-sm">{t("posts.loading")}</p>
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="rounded-[1.4rem] glass py-12 text-center text-muted-foreground">
          <Newspaper className="mx-auto mb-2 h-10 w-10 opacity-40" />
          <p className="text-sm">{t("posts.empty")}</p>
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((post, i) => {
            const isExpanded = expanded === post.id;
            const embedUrl = getYoutubeEmbedUrl(post.youtube_url);
            return (
              <motion.div
                key={post.id}
                variants={fadeUp}
                custom={Math.min(i + 1, 4)}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className={`overflow-hidden rounded-[1.4rem] glass card-frame transition-colors hover:border-gold/60 ${isExpanded ? "md:col-span-2" : ""}`}
              >
                <button type="button" onClick={() => setExpanded(isExpanded ? null : post.id)} className="w-full p-4 text-left sm:p-5" aria-expanded={isExpanded}>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {post.types.map((type) => (
                      <span key={type} className={`rounded-full px-2 py-0.5 text-xs font-bold ${POST_TYPE_COLORS[type] || "bg-muted text-muted-foreground"}`}>
                        {POST_TYPE_LABELS[type]?.[lang] || type}
                      </span>
                    ))}
                    {post.youtube_url && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-lotus/35 px-2 py-0.5 text-xs font-medium text-[hsl(352_40%_38%)]">
                        <Video className="h-3 w-3" /> YouTube
                      </span>
                    )}
                    <span className="ml-auto text-xs text-muted-foreground">{new Date(post.created_at * 1000).toLocaleDateString(lang === "sl" ? "sl-SI" : "en-GB")}</span>
                  </div>
                  <h4 className="font-display text-xl font-semibold leading-tight text-jade-deep">{post.title}</h4>
                  {!isExpanded && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.body}</p>}
                  <div className="mt-2 flex items-center justify-end text-muted-foreground">{isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}</div>
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                      <div className="space-y-4 border-t border-gold/15 px-4 pb-4 sm:px-5 sm:pb-5">
                        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{post.body}</p>
                        {embedUrl && (
                          <div className="aspect-video overflow-hidden rounded-xl">
                            <iframe src={embedUrl} title={post.title} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                          </div>
                        )}
                        {post.youtube_url && !embedUrl && (
                          <a href={post.youtube_url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost !py-2 text-xs">
                            <Video className="h-4 w-4" /> {t("posts.watchVideo")}
                          </a>
                        )}
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
