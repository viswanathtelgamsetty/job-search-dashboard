"use client";

import Link from "next/link";
import type { MarketActivityMetrics } from "@/types";

interface MarketActivitySectionProps {
  metrics: MarketActivityMetrics;
}

export function MarketActivitySection({ metrics }: MarketActivitySectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📡</span>
            <h2 className="text-lg font-black tracking-tight text-white uppercase">
              Market Activity & Live Ingestion Signals
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Canonical breakdown across career-fit dimensions, freshness, locations, and travel requirements.
          </p>
        </div>

        <Link
          href="/jobs"
          className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 underline self-start sm:self-center"
        >
          Explore Market Radar ({metrics.totalJobs}) →
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Jobs */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Total Discovered
          </span>
          <p className="mt-1 text-2xl font-black text-white">{metrics.totalJobs}</p>
          <p className="text-[11px] text-slate-500">live canonical listings</p>
        </div>

        {/* High Career Fit */}
        <div className="rounded-xl border border-emerald-950/60 border-emerald-800/40 bg-slate-900/70 p-3.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
            High Career Fit
          </span>
          <p className="mt-1 text-2xl font-black text-emerald-300">{metrics.highCareerFit}</p>
          <p className="text-[11px] text-emerald-500/80">exact profile alignment</p>
        </div>

        {/* Relevant Fit */}
        <div className="rounded-xl border border-cyan-950/60 border-cyan-800/40 bg-slate-900/70 p-3.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
            Relevant Fit
          </span>
          <p className="mt-1 text-2xl font-black text-cyan-300">{metrics.relevant}</p>
          <p className="text-[11px] text-cyan-500/80">strong lead/architect match</p>
        </div>

        {/* Possible Fit */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Possible Fit
          </span>
          <p className="mt-1 text-2xl font-black text-amber-300">{metrics.possible}</p>
          <p className="text-[11px] text-slate-500">adjacent or partial match</p>
        </div>

        {/* Fresh Signals */}
        <div className="rounded-xl border border-emerald-900/30 bg-slate-900/70 p-3.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
            Fresh (≤ 3 Days)
          </span>
          <p className="mt-1 text-2xl font-black text-emerald-300">{metrics.fresh}</p>
          <p className="text-[11px] text-slate-500">highest response velocity</p>
        </div>

        {/* Recent Signals */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Recent (4-14 Days)
          </span>
          <p className="mt-1 text-2xl font-black text-slate-200">{metrics.recent}</p>
          <p className="text-[11px] text-slate-500">active market openings</p>
        </div>

        {/* Hyderabad Tech Hub */}
        <div className="rounded-xl border border-indigo-900/40 bg-slate-900/70 p-3.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400">
            Hyderabad Metro
          </span>
          <p className="mt-1 text-2xl font-black text-indigo-300">{metrics.hyderabad}</p>
          <p className="text-[11px] text-slate-500">primary base preference</p>
        </div>

        {/* India Eligible */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            India Eligible
          </span>
          <p className="mt-1 text-2xl font-black text-slate-200">{metrics.india}</p>
          <p className="text-[11px] text-slate-500">domestic or hiring in India</p>
        </div>

        {/* Remote India */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Remote (India)
          </span>
          <p className="mt-1 text-2xl font-black text-slate-200">{metrics.remoteIndia}</p>
          <p className="text-[11px] text-slate-500">remote eligibility confirmed</p>
        </div>

        {/* Global Remote */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Global Remote
          </span>
          <p className="mt-1 text-2xl font-black text-slate-200">{metrics.globalRemote}</p>
          <p className="text-[11px] text-slate-500">worldwide distributed roles</p>
        </div>

        {/* International Travel */}
        <div className="rounded-xl border border-indigo-800/40 bg-slate-900/70 p-3.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400">
            International Travel
          </span>
          <p className="mt-1 text-2xl font-black text-indigo-300">{metrics.internationalTravel}</p>
          <p className="text-[11px] text-indigo-400/80">US / EU / Global client site</p>
        </div>

        {/* Client-Site Travel */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Client-Site Travel
          </span>
          <p className="mt-1 text-2xl font-black text-slate-200">{metrics.clientSiteTravel}</p>
          <p className="text-[11px] text-slate-500">domestic / overseas visits</p>
        </div>

        {/* EMEA Regional Opportunities */}
        <div className="rounded-xl border border-purple-800/40 bg-slate-900/70 p-3.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-400">
            EMEA Markets
          </span>
          <p className="mt-1 text-2xl font-black text-purple-300">{metrics.emea ?? 0}</p>
          <p className="text-[11px] text-purple-400/80">UK, EU & Middle East</p>
        </div>

        {/* India -> EMEA Opportunities */}
        <div className="rounded-xl border border-fuchsia-800/40 bg-slate-900/70 p-3.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-fuchsia-400">
            India → EMEA
          </span>
          <p className="mt-1 text-2xl font-black text-fuchsia-300">{metrics.indiaToEmea ?? 0}</p>
          <p className="text-[11px] text-fuchsia-400/80">India base + EMEA clients</p>
        </div>

        {/* Client-Facing Roles */}
        <div className="rounded-xl border border-amber-800/40 bg-slate-900/70 p-3.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">
            Client-Facing
          </span>
          <p className="mt-1 text-2xl font-black text-amber-300">{metrics.clientFacing ?? 0}</p>
          <p className="text-[11px] text-amber-400/80">customer consulting / PS</p>
        </div>

        {/* International Priority */}
        <div className="rounded-xl border border-cyan-800/40 bg-slate-900/70 p-3.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
            Intl Priority
          </span>
          <p className="mt-1 text-2xl font-black text-cyan-300">{metrics.internationalPriority ?? 0}</p>
          <p className="text-[11px] text-cyan-400/80">top international leads</p>
        </div>
      </div>
    </section>
  );
}
