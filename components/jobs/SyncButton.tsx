"use client";

import { useState } from "react";
import type { Job, MarketScanMetrics, ProviderStatus } from "@/types";
import { setLastSyncTime } from "@/lib/storage";

interface SyncButtonProps {
  onSyncComplete: (newJobs: Job[]) => void;
  existingJobs: Job[];
}

export function SyncButton({ onSyncComplete, existingJobs }: SyncButtonProps) {
  const [syncing, setSyncing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<MarketScanMetrics | null>(null);
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [showMetricsModal, setShowMetricsModal] = useState(false);

  async function handleSync() {
    setSyncing(true);
    setFeedback("Connecting to permitted job APIs & career boards...");

    try {
      const res = await fetch("/api/jobs/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ existingJobs }),
      });

      if (!res.ok) {
        throw new Error(`Sync failed with HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.success && Array.isArray(data.jobs)) {
        const now = new Date().toISOString();
        setLastSyncTime(now);
        onSyncComplete(data.jobs);

        if (data.metrics) {
          setMetrics(data.metrics);
        }
        if (data.providers) {
          setProviders(data.providers);
        }

        setShowMetricsModal(true);
        const count = data.newJobsCount || 0;
        setFeedback(`Scan complete: ${data.totalDiscovered} raw jobs found, ${count} new added.`);
      } else {
        setFeedback("Feeds synchronized successfully.");
      }
    } catch (err: unknown) {
      console.error("Sync error:", err);
      setFeedback("Sync error. Please check network connection.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-3">
        {feedback && (
          <span className="hidden sm:inline text-xs font-medium text-cyan-300 animate-fade-in bg-cyan-950/80 border border-cyan-800/80 px-2.5 py-1 rounded-lg">
            {feedback}
          </span>
        )}
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-50 transition"
        >
          <span className={syncing ? "animate-spin" : ""}>🔄</span>
          <span>{syncing ? "Scanning Market..." : "Scan Market Now"}</span>
        </button>
      </div>

      {/* Market Scan Metrics Modal */}
      {showMetricsModal && metrics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📡</span>
                <h3 className="text-base font-bold text-white">
                  Market Scan Complete
                </h3>
              </div>
              <button
                onClick={() => setShowMetricsModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Providers Status List */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Providers:
              </span>
              <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-950 p-2.5 font-mono text-xs">
                {providers.map((p) => {
                  let badge = "LIVE";
                  let badgeColor = "bg-emerald-950 text-emerald-300 border-emerald-800";
                  if (!p.enabled) {
                    badge = "DISABLED";
                    badgeColor = "bg-slate-800 text-slate-400 border-slate-700";
                  } else if (!p.success) {
                    badge = "ERROR";
                    badgeColor = "bg-rose-950 text-rose-300 border-rose-800";
                  }

                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between py-1.5 px-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">{p.name}</span>
                        <span
                          className={`rounded px-1.5 py-0.2 text-[10px] font-bold border ${badgeColor}`}
                        >
                          {badge}
                        </span>
                      </div>
                      <span className="text-white font-bold">{p.jobsReturned}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ingestion & Deduplication Stats */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                <span className="text-slate-400 block text-[11px]">Raw Jobs</span>
                <span className="text-base font-bold text-white">
                  {metrics.rawJobsCount}
                </span>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                <span className="text-slate-400 block text-[11px]">Duplicates</span>
                <span className="text-base font-bold text-amber-400">
                  {metrics.duplicatesCount}
                </span>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                <span className="text-slate-400 block text-[11px]">Final Jobs</span>
                <span className="text-base font-bold text-cyan-400">
                  {metrics.finalJobsCount}
                </span>
              </div>
            </div>

            {/* Location Coverage Breakdown */}
            <div className="space-y-1.5 pt-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Location Coverage:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="flex justify-between rounded-lg bg-slate-950 border border-slate-800/80 px-3 py-2">
                  <span className="text-cyan-400">Hyderabad:</span>
                  <span className="text-white font-bold">
                    {metrics.locationBreakdown.hyderabad}
                  </span>
                </div>
                <div className="flex justify-between rounded-lg bg-slate-950 border border-slate-800/80 px-3 py-2">
                  <span className="text-slate-300">India:</span>
                  <span className="text-white font-bold">
                    {metrics.locationBreakdown.india}
                  </span>
                </div>
                <div className="flex justify-between rounded-lg bg-slate-950 border border-slate-800/80 px-3 py-2">
                  <span className="text-slate-300">Remote Global:</span>
                  <span className="text-white font-bold">
                    {metrics.locationBreakdown.remoteGlobal}
                  </span>
                </div>
                <div className="flex justify-between rounded-lg bg-slate-950 border border-slate-800/80 px-3 py-2">
                  <span className="text-slate-300">International:</span>
                  <span className="text-white font-bold">
                    {metrics.locationBreakdown.international}
                  </span>
                </div>
              </div>
            </div>

            {/* Travel Classification Breakdown */}
            <div className="space-y-1.5 pt-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Travel Classification:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="flex justify-between rounded-lg bg-slate-950 border border-slate-800/80 px-3 py-1.5">
                  <span className="text-indigo-400 text-[11px]">Intl Travel:</span>
                  <span className="text-white font-bold">
                    {metrics.travelBreakdown.internationalTravel}
                  </span>
                </div>
                <div className="flex justify-between rounded-lg bg-slate-950 border border-slate-800/80 px-3 py-1.5">
                  <span className="text-cyan-400 text-[11px]">Client-Site:</span>
                  <span className="text-white font-bold">
                    {metrics.travelBreakdown.clientSiteTravel}
                  </span>
                </div>
                <div className="flex justify-between rounded-lg bg-slate-950 border border-slate-800/80 px-3 py-1.5">
                  <span className="text-sky-400 text-[11px]">Team Only:</span>
                  <span className="text-white font-bold">
                    {metrics.travelBreakdown.internationalTeamOnly}
                  </span>
                </div>
                <div className="flex justify-between rounded-lg bg-slate-950 border border-slate-800/80 px-3 py-1.5">
                  <span className="text-slate-400 text-[11px]">No Travel Mentioned:</span>
                  <span className="text-white font-bold">
                    {metrics.travelBreakdown.noTravelMentioned}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowMetricsModal(false)}
                className="rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500 transition"
              >
                Close Metrics
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
