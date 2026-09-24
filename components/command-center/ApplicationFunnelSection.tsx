"use client";

import Link from "next/link";
import type { ApplicationFunnelMetrics } from "@/types";

interface ApplicationFunnelSectionProps {
  funnel: ApplicationFunnelMetrics;
}

export function ApplicationFunnelSection({ funnel }: ApplicationFunnelSectionProps) {
  const stages = [
    {
      label: "Saved",
      count: funnel.saved,
      desc: "Prospects saved",
      color: "text-cyan-300",
      border: "border-cyan-500/40",
      bg: "bg-cyan-950/20",
    },
    {
      label: "Applied",
      count: funnel.applied,
      desc: "Submitted applications",
      color: "text-indigo-300",
      border: "border-indigo-500/40",
      bg: "bg-indigo-950/20",
    },
    {
      label: "Screening",
      count: funnel.screening,
      desc: "Initial recruiter chat",
      color: "text-amber-300",
      border: "border-amber-500/40",
      bg: "bg-amber-950/20",
    },
    {
      label: "Technical",
      count: funnel.technical,
      desc: "Deep tech / system round",
      color: "text-purple-300",
      border: "border-purple-500/40",
      bg: "bg-purple-950/20",
    },
    {
      label: "Final",
      count: funnel.final,
      desc: "Leadership / partner chat",
      color: "text-rose-300",
      border: "border-rose-500/40",
      bg: "bg-rose-950/20",
    },
    {
      label: "Offer",
      count: funnel.offers,
      desc: "Active offers received",
      color: "text-emerald-300 font-extrabold",
      border: "border-emerald-500/50",
      bg: "bg-emerald-950/30",
    },
  ];

  const conversions = [
    {
      label: "Applied → Screening",
      value: funnel.appliedToScreeningConversion,
      desc: "Historical conversion from submitted applications to screening round",
    },
    {
      label: "Screening → Technical",
      value: funnel.screeningToTechnicalConversion,
      desc: "Historical conversion from screening round to technical assessment",
    },
    {
      label: "Technical → Final",
      value: funnel.technicalToFinalConversion,
      desc: "Historical conversion from technical round to final leadership stage",
    },
    {
      label: "Final → Offer",
      value: funnel.finalToOfferConversion,
      desc: "Historical conversion from final stage to offer",
    },
  ];

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            <h2 className="text-lg font-black tracking-tight text-white uppercase">
              Application Pipeline Funnel
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Sequential progression across pipeline stages. (Historical stage-reach measurements only — not success predictions).
          </p>
        </div>

        <Link
          href="/applications"
          className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 underline self-start sm:self-center"
        >
          Manage Applications Kanban →
        </Link>
      </div>

      {/* Stage Cards with Connectors */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stages.map((stage, idx) => (
          <div
            key={stage.label}
            className={`relative flex flex-col justify-between rounded-xl border ${stage.border} ${stage.bg} p-4 transition`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {stage.label}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Stage #{idx + 1}</span>
              </div>
              <p className={`mt-2 text-2xl font-black ${stage.color}`}>{stage.count}</p>
              <p className="mt-0.5 text-[11px] text-slate-400">{stage.desc}</p>
            </div>

            {stage.label === "Offer" && funnel.rejected > 0 && (
              <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-red-400">
                Rejected / Closed: {funnel.rejected}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Sequential Conversion Metrics (Historical Reach Only) */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Historical Funnel Conversion Rates
          </span>
          <span className="text-[11px] text-slate-500">
            Based strictly on active application stage transitions
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {conversions.map((conv) => (
            <div
              key={conv.label}
              className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-1"
            >
              <span className="text-xs font-semibold text-slate-300">{conv.label}</span>
              <p className="text-xl font-bold text-white">
                {conv.value !== null ? `${conv.value}%` : "—"}
              </p>
              <p className="text-[10px] text-slate-500 leading-tight">{conv.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
