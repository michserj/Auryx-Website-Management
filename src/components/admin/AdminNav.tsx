"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BookOpen,
  Bot,
  Briefcase,
  CalendarDays,
  ExternalLink,
  FileText,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  MessagesSquare,
  Settings,
  X,
} from "lucide-react";
import { Logo } from "../Logo";

const GROUPS = [
  {
    label: "Overview",
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Leads",
    items: [
      { href: "/admin/inquiries", label: "Contact inquiries", icon: Inbox },
      { href: "/admin/bookings", label: "Consultations", icon: CalendarDays },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/content", label: "Pages & About", icon: FileText },
      { href: "/admin/services", label: "Services", icon: Briefcase },
      { href: "/admin/case-studies", label: "Case studies", icon: BookOpen },
    ],
  },
  {
    label: "Chatbot",
    items: [
      { href: "/admin/chatbot/knowledge", label: "Knowledge base", icon: Bot },
      { href: "/admin/chatbot/conversations", label: "Conversations", icon: MessagesSquare },
    ],
  },
  {
    label: "Configuration",
    items: [{ href: "/admin/settings", label: "Settings", icon: Settings }],
  },
];

export function AdminNav({ email, logout }: { email: string; logout: () => Promise<void> }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const active = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));

  const nav = (
    <nav aria-label="Admin" className="flex h-full flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {GROUPS.map((g) => (
          <div key={g.label}>
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-navy-300">{g.label}</p>
            <ul className="mt-2 space-y-0.5">
              {g.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active(item.href) ? "page" : undefined}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-navy-100 hover:bg-white/5 hover:text-white aria-[current=page]:bg-white/10 aria-[current=page]:text-white"
                  >
                    <item.icon className="h-4 w-4 text-gold-400" aria-hidden />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="space-y-1 border-t border-white/10 p-3">
        <Link href="/" target="_blank" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-navy-200 hover:bg-white/5 hover:text-white">
          <ExternalLink className="h-4 w-4" aria-hidden /> View website
        </Link>
        <form action={logout}>
          <button type="submit" className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-navy-200 hover:bg-white/5 hover:text-white">
            <LogOut className="h-4 w-4" aria-hidden /> Sign out
          </button>
        </form>
        <p className="truncate px-3 pt-1 text-xs text-navy-300" title={email}>
          {email}
        </p>
      </div>
    </nav>
  );

  return (
    <>
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-white px-4 lg:hidden">
        <Logo />
        <button type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((v) => !v)} className="rounded-lg p-2 hover:bg-navy-50">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 top-14 z-30 bg-navy-950 lg:hidden">
          {nav}
        </div>
      )}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-navy-950 lg:flex">
        <div className="flex h-16 items-center border-b border-white/10 px-5">
          <Logo tone="light" />
        </div>
        {nav}
      </aside>
    </>
  );
}
