"use client";

import Link from "next/link";
import type { TargetRoleDistribution } from "@/types";

interface TargetRoleDistributionSectionProps {
  distribution: TargetRoleDistribution;
}

export function TargetRoleDistributionSection({
  distribution,
}: TargetRoleDistributionSectionProps) {
  return (
    <section className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xl">🎯</span>
          <h2 className="text-lg font-black tracking-tight text-white uppercase">
            Target Role & Career Domain Distribution
          </h2>
        </div>
        <p className="text-xs text-slate-400">
          Factual job counts across existing target profile domains and travel requirements. (Unranked, factual distribution).
        </p>
      </div>

      {/* 10 Target Career Domains */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {distribution.domains.map((item) => (
          <Link
            key={item.domain}
            href={`/jobs?domain=${item.domain}`}
            className="group rounded-xl border border-slate-800 bg-slate-900/70 p-3.5 hover:border-cyan-500/50 hover:bg-slate-850 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 group-hover:text-cyan-300 transition">
                {item.label}
              </span>
              <span className="text-lg font-black text-white">{item.count}</span>
            </div>
            <p className="mt-1 text-[10px] text-slate-500 uppercase font-mono">{item.domain}</p>
          </Link>
        ))}
      </div>

      {/* Work Arrangements & Travel Requirements */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Work Arrangements & Travel Opportunities
        </span>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* International Travel */}
          <div className="rounded-lg border border-indigo-900/40 bg-slate-950 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-300">✈️ International Travel</span>
              <span className="text-xl font-black text-indigo-300">
                {distribution.workArrangements.internationalTravel}
              </span>
            </div>
            <p className="mt-1 text-[10px] text-slate-400">
              Roles explicitly requiring US / EU / Global client-site travel
            </p>
          </div>

          {/* Client-Site Travel */}
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">🏢 Client-Site Travel</span>
              <span className="text-xl font-black text-white">
                {distribution.workArrangements.clientSiteTravel}
              </span>
            </div>
            <p className="mt-1 text-[10px] text-slate-400">
              Domestic client meetings and enterprise partner engagements
            </p>
          </div>

          {/* Remote Global */}
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">🌍 Remote Global</span>
              <span className="text-xl font-black text-white">
                {distribution.workArrangements.remoteGlobal}
              </span>
            </div>
            <p className="mt-1 text-[10px] text-slate-400">
              Worldwide remote roles with cross-border team distribution
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
