import { useEffect, type AnchorHTMLAttributes, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

/** Scroll a section into view; `.section-anchor` supplies the offset for the fixed header. */
export function scrollToId(id: string, behavior: ScrollBehavior = "smooth"): boolean {
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ behavior, block: "start" });
  return true;
}

interface Props extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  /** section id on the landing page, without '#' */
  to: string;
  onNavigate?: () => void;
  children: ReactNode;
}

/**
 * In-page section link. On the landing page it scrolls without touching the
 * query string (a plain "/#id" href reloads the page when "?lang=" is present);
 * from any other route it navigates client-side to "/" with the hash, and the
 * landing page's hash effect finishes the scroll.
 */
export default function AnchorLink({ to, onNavigate, children, onClick, ...rest }: Props) {
  const location = useLocation();
  if (location.pathname === "/") {
    return (
      <a
        href={`#${to}`}
        {...rest}
        onClick={(e) => {
          onClick?.(e);
          if (e.defaultPrevented) return;
          e.preventDefault();
          scrollToId(to);
          window.history.replaceState(null, "", `${location.pathname}${location.search}#${to}`);
          onNavigate?.();
        }}
      >
        {children}
      </a>
    );
  }
  return (
    <Link to={{ pathname: "/", hash: `#${to}` }} {...rest} onClick={(e) => { onClick?.(e); onNavigate?.(); }}>
      {children}
    </Link>
  );
}

/** Scroll to `location.hash` on the landing page — on first load and after client-side navigation. */
export function useHashScroll() {
  const { hash } = useLocation();
  useEffect(() => {
    const id = hash.replace(/^#/, "");
    if (!id) return;
    if (!scrollToId(id, "smooth")) return;
    // sections grow as relay data arrives — settle once more a moment later
    const t = window.setTimeout(() => scrollToId(id, "smooth"), 700);
    return () => window.clearTimeout(t);
  }, [hash]);
}
