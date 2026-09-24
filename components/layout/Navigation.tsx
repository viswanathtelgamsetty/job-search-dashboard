"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: "/jobs", label: "Market Radar", icon: "🧭", badge: "Primary" },
    { href: "/", label: "Dashboard", icon: "📊" },
    { href: "/applications", label: "Applications", icon: "📋" },
    { href: "/companies", label: "Target Companies", icon: "🏢" },
    { href: "/settings", label: "Search Profile", icon: "⚙️" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <Link href="/jobs" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 font-bold text-white shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              📡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                  Job Market Radar
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-cyan-950/80 border border-cyan-800/60 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                  LIVE PULSE
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-slate-400">
                12+ yrs • Senior Tech Lead & Architect • International Travel
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {links.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? "bg-slate-800 text-white shadow-sm shadow-slate-900 border border-slate-700/80"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                }`}
              >
                <span>{link.icon}</span>
                <span className="hidden sm:inline">{link.label}</span>
                {link.badge && (
                  <span className="ml-1 rounded bg-cyan-500/20 text-cyan-300 px-1 py-0.2 text-[9px] font-semibold">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
