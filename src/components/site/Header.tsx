"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, Menu, Search, Star, X } from "lucide-react";
import clsx from "clsx";
import { NAV, type NavItem } from "@/lib/site";
import { getWatchlist } from "@/lib/watchlist";
import { NavConnect } from "@/components/NavConnect";
import { Logo } from "./Logo";

const isActive = (item: NavItem, path: string) =>
  (item.match ?? []).some((m) => path === m || path.startsWith(m + "/"));

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [watchCount, setWatchCount] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sync = () => setWatchCount(getWatchlist().length);
    sync();
    window.addEventListener("equency:watchlist", sync);
    return () => window.removeEventListener("equency:watchlist", sync);
  }, []);

  // Close menus on route change (state adjusted during render, not in an effect).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMobile(false);
    setOpen(null);
  }

  useEffect(() => {
    document.documentElement.style.overflow = mobile ? "hidden" : "";
  }, [mobile]);

  const openCmdk = () => window.dispatchEvent(new CustomEvent("equency:open-cmdk"));

  return (
    <header
      className={clsx(
        "fixed inset-x-0 top-0 z-50 py-3.5 transition-[background-color,box-shadow,backdrop-filter] duration-300",
        scrolled || mobile ? "bg-paper/90 shadow-[0_1px_0_var(--color-line)] backdrop-blur-xl backdrop-saturate-150" : "bg-transparent",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 md:px-8 lg:grid lg:grid-cols-[1fr_auto_1fr]">
        <Link href="/" aria-label="EQUENCY home" className="text-ink">
          <Logo />
        </Link>

        <nav aria-label="Primary" className="hidden lg:block" onMouseLeave={() => setOpen(null)}>
          <ul className="flex items-center gap-1">
            {NAV.map((item) => {
              const active = isActive(item, pathname);
              return (
                <li key={item.label} className="relative" onMouseEnter={() => setOpen(item.children ? item.label : null)}>
                  {item.href ? (
                    <Link
                      href={item.href}
                      className={clsx("block px-3 py-2 text-base transition-colors hover:text-ink", active ? "text-core" : "text-ink-2")}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      aria-expanded={open === item.label}
                      onClick={() => setOpen((o) => (o === item.label ? null : item.label))}
                      className={clsx("flex items-center gap-1 px-3 py-2 text-base transition-colors hover:text-ink", active ? "text-core" : "text-ink-2")}
                    >
                      {item.label}
                      <ChevronDown size={14} className={clsx("transition-transform duration-200", open === item.label && "rotate-180")} />
                    </button>
                  )}
                  <AnimatePresence>
                    {open === item.label && item.children && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.98 }}
                        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute left-1/2 top-full w-72 -translate-x-1/2 pt-3"
                      >
                        <div className="rounded-lg border border-line bg-card/95 p-2 shadow-[0_24px_60px_-20px_rgba(12,18,34,0.25)] backdrop-blur-md">
                          {item.children.map((c) => (
                            <Link key={c.label} href={c.href} className="block rounded-md px-3 py-2.5 transition-colors hover:bg-paper">
                              <div className="text-sm text-ink">{c.label}</div>
                              <div className="font-body text-xs text-ink-3">{c.desc}</div>
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="hidden items-center justify-end gap-2 lg:flex">
          <button
            type="button"
            onClick={openCmdk}
            aria-label="Search (⌘K)"
            className="flex h-9 items-center gap-2 rounded px-2.5 text-sm text-ink-3 ring-1 ring-inset ring-line-2 transition-colors hover:text-ink"
          >
            <Search size={14} />
            <kbd className="font-body text-[11px]">⌘K</kbd>
          </button>
          <Link
            href="/watchlist"
            aria-label="Watchlist"
            className="relative grid size-9 place-items-center rounded text-ink-2 ring-1 ring-inset ring-line-2 transition-colors hover:text-core"
          >
            <Star size={15} />
            {watchCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 grid min-w-4 place-items-center rounded-full bg-strategy px-1 text-[10px] leading-4 text-white">
                {watchCount}
              </span>
            )}
          </Link>
          <NavConnect />
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <button type="button" onClick={openCmdk} aria-label="Search" className="grid size-11 place-items-center rounded ring-1 ring-inset ring-line-2">
            <Search size={18} />
          </button>
          <button
            type="button"
            aria-label={mobile ? "Close menu" : "Open menu"}
            onClick={() => setMobile((m) => !m)}
            className="grid size-11 place-items-center rounded ring-1 ring-inset ring-line-2"
          >
            {mobile ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobile && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "calc(100dvh - 72px)" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-y-auto overscroll-contain bg-paper lg:hidden"
          >
            <div className="flex flex-col gap-6 px-5 pb-10 pt-6">
              {NAV.map((item, i) => (
                <motion.div key={item.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i + 0.1 }}>
                  {item.href ? (
                    <Link href={item.href} className="text-2xl text-ink-2">{item.label}</Link>
                  ) : (
                    <>
                      <div className="eyebrow mb-2 text-xs text-core">{item.label}</div>
                      <div className="flex flex-col gap-2">
                        {item.children?.map((c) => (
                          <Link key={c.label} href={c.href} className="text-2xl text-ink-2">{c.label}</Link>
                        ))}
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
              <div className="mt-2 flex items-center gap-3">
                <Link href="/watchlist" className="flex items-center gap-2 text-lg text-ink-2">
                  <Star size={16} /> Watchlist {watchCount > 0 && `(${watchCount})`}
                </Link>
              </div>
              <NavConnect />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
