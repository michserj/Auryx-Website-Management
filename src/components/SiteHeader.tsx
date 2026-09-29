"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, CalendarDays } from "lucide-react";
import { Logo } from "./Logo";
import { NAV } from "./nav";


function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <Link href="/" aria-label="Auryx Software, Home" className="shrink-0 rounded-md">
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(pathname, item.href) ? "page" : undefined}
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-navy-700 aria-[current=page]:text-navy-700 aria-[current=page]:underline aria-[current=page]:decoration-gold-500 aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-[10px]"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/consultation" className="btn-navy hidden px-4 py-2.5 sm:inline-flex">
            <CalendarDays className="h-4 w-4" aria-hidden />
            Book a Consultation
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-navy-800 hover:bg-navy-50 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-line bg-white lg:hidden">
          <ul className="container-page flex flex-col py-3">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(pathname, item.href) ? "page" : undefined}
                  className="block rounded-lg px-3 py-3 text-base font-medium text-ink hover:bg-navy-50 aria-[current=page]:bg-navy-50 aria-[current=page]:text-navy-700"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="mt-2 grid gap-2 border-t border-line pt-4 sm:grid-cols-2">
              <Link href="/consultation" className="btn-navy w-full">
                Book a Consultation
              </Link>
              <Link href="/contact" className="btn-outline w-full">
                Send a Message
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
