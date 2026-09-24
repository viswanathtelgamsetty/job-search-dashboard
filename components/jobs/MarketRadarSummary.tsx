"use client";

import type { JobFiltersState, MarketRadarMetrics } from "@/types";

interface MarketRadarSummaryProps {
  metrics: MarketRadarMetrics;
  filters: JobFiltersState;
  onFilterChange: (partial: Partial<JobFiltersState>) => void;
}

export function MarketRadarSummary({
  metrics,
  filters,
  onFilterChange,
}: MarketRadarSummaryProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <span>📡 MARKET RADAR SUMMARY</span>
          <span className="text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded font-mono">
            {metrics.totalJobs} LIVE VACANCIES
          </span>
        </h2>
        <span className="text-[11px] text-slate-500 hidden sm:inline">
          Click any radar metric card to quick-filter
        </span>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <span>🎯 OPPORTUNITY ACTION STATUS</span>
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 text-[11px]">
              <span className="font-medium text-emerald-300">Priority opportunities</span> = High/Relevant career fit + Fresh/Recent posting
            </span>
          </div>
          {filters.opportunityPriority && filters.opportunityPriority !== "ALL" && (
            <button
              onClick={() => onFilterChange({ opportunityPriority: "ALL" })}
              className="text-[11px] text-cyan-400 hover:underline"
            >
              Clear Priority Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          <button
            onClick={() =>
              onFilterChange({
                opportunityPriority:
                  filters.opportunityPriority === "PRIORITY" ? "ALL" : "PRIORITY",
              })
            }
            className={`rounded-xl border p-2.5 transition text-left sm:text-center ${
              filters.opportunityPriority === "PRIORITY"
                ? "border-emerald-500 bg-emerald-950/40 shadow-sm"
                : "border-emerald-900/40 bg-emerald-950/20 hover:border-emerald-700/60"
            }`}
          >
            <div className="text-[10px] font-bold uppercase text-emerald-300">Priority Opportunities</div>
            <div className="mt-1 text-lg font-black text-emerald-400">{metrics.priorityOpportunities}</div>
            <div className="text-[9px] text-emerald-500">Apply & Act Now</div>
          </button>

          <button
            onClick={() =>
              onFilterChange({
                opportunityPriority:
                  filters.opportunityPriority === "ACTIVE" ? "ALL" : "ACTIVE",
              })
            }
            className={`rounded-xl border p-2.5 transition text-left sm:text-center ${
              filters.opportunityPriority === "ACTIVE"
                ? "border-cyan-500 bg-cyan-950/40 shadow-sm"
                : "border-slate-800 bg-slate-950/80 hover:border-slate-700"
            }`}
          >
            <div className="text-[10px] font-bold uppercase text-cyan-300">Active Opportunities</div>
            <div className="mt-1 text-lg font-black text-cyan-300">{metrics.activeOpportunities}</div>
            <div className="text-[9px] text-slate-500">Strong Fit • Older</div>
          </button>

          <button
            onClick={() =>
              onFilterChange({
                opportunityPriority:
                  filters.opportunityPriority === "WATCH" ? "ALL" : "WATCH",
              })
            }
            className={`rounded-xl border p-2.5 transition text-left sm:text-center ${
              filters.opportunityPriority === "WATCH"
                ? "border-amber-500 bg-amber-950/40 shadow-sm"
                : "border-slate-800 bg-slate-950/80 hover:border-slate-700"
            }`}
          >
            <div className="text-[10px] font-bold uppercase text-amber-300">Watch Opportunities</div>
            <div className="mt-1 text-lg font-black text-amber-300">{metrics.watchOpportunities}</div>
            <div className="text-[9px] text-slate-500">Possible Fit • Fresh</div>
          </button>

          <button
            onClick={() =>
              onFilterChange({
                opportunityPriority:
                  filters.opportunityPriority === "LOW" ? "ALL" : "LOW",
              })
            }
            className={`rounded-xl border p-2.5 transition text-left sm:text-center ${
              filters.opportunityPriority === "LOW"
                ? "border-slate-500 bg-slate-800 shadow-sm"
                : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
            }`}
          >
            <div className="text-[10px] font-bold uppercase text-slate-400">Low Opportunities</div>
            <div className="mt-1 text-lg font-black text-slate-400">{metrics.lowOpportunities}</div>
            <div className="text-[9px] text-slate-500">Adjacent • Older</div>
          </button>
        </div>
      </div>

      {/* Grid displaying career fit, mobility, and travel metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
        {/* Row 1: Career Fit Metrics */}
        <button
          onClick={() => onFilterChange({ relevance: "ALL" })}
          className={`rounded-xl border p-2.5 transition text-left sm:text-center ${
            filters.relevance === "ALL" && filters.search === "" && filters.domain === "ALL"
              ? "border-cyan-500/50 bg-slate-850"
              : "border-slate-800 bg-slate-900/80 hover:border-slate-700"
          }`}
        >
          <div className="text-[10px] font-bold uppercase text-slate-400">Total Jobs</div>
          <div className="mt-1 text-lg font-black text-white">{metrics.totalJobs}</div>
          <div className="text-[9px] text-slate-500">Live inventory</div>
        </button>

        <button
          onClick={() =>
            onFilterChange({
              relevance: filters.relevance === "HIGH_RELEVANCE" ? "ALL" : "HIGH_RELEVANCE",
            })
          }
          className={`rounded-xl border p-2.5 transition text-left sm:text-center ${
            filters.relevance === "HIGH_RELEVANCE"
              ? "border-emerald-500 bg-emerald-950/40 shadow-sm"
              : "border-emerald-900/40 bg-emerald-950/15 hover:border-emerald-700/60"
          }`}
        >
          <div className="text-[10px] font-bold uppercase text-emerald-300">High Relevance</div>
          <div className="mt-1 text-lg font-black text-emerald-400">{metrics.highRelevance}</div>
          <div className="text-[9px] text-emerald-500">Direct profile fit</div>
        </button>

        <button
          onClick={() =>
            onFilterChange({
              relevance: filters.relevance === "RELEVANT" ? "ALL" : "RELEVANT",
            })
          }
          className={`rounded-xl border p-2.5 transition text-left sm:text-center ${
            filters.relevance === "RELEVANT"
              ? "border-cyan-500 bg-cyan-950/40 shadow-sm"
              : "border-cyan-900/40 bg-cyan-950/15 hover:border-cyan-700/60"
          }`}
        >
          <div className="text-[10px] font-bold uppercase text-cyan-300">Relevant</div>
          <div className="mt-1 text-lg font-black text-cyan-300">{metrics.relevant}</div>
          <div className="text-[9px] text-cyan-500">Strong alignment</div>
        </button>

        <button
          onClick={() =>
            onFilterChange({
              relevance: filters.relevance === "POSSIBLE" ? "ALL" : "POSSIBLE",
            })
          }
          className={`rounded-xl border p-2.5 transition text-left sm:text-center ${
            filters.relevance === "POSSIBLE"
              ? "border-amber-500 bg-amber-950/40 shadow-sm"
              : "border-amber-900/40 bg-amber-950/15 hover:border-amber-700/60"
          }`}
        >
          <div className="text-[10px] font-bold uppercase text-amber-300">Possible</div>
          <div className="mt-1 text-lg font-black text-amber-400">{metrics.possible}</div>
          <div className="text-[9px] text-amber-500">Adjacent matches</div>
        </button>

        <button
          onClick={() =>
            onFilterChange({
              relevance: filters.relevance === "LOW_RELEVANCE" ? "ALL" : "LOW_RELEVANCE",
            })
          }
          className={`rounded-xl border p-2.5 transition text-left sm:text-center ${
            filters.relevance === "LOW_RELEVANCE"
              ? "border-slate-500 bg-slate-800"
              : "border-slate-800 bg-slate-900/80 hover:border-slate-700"
          }`}
        >
          <div className="text-[10px] font-bold uppercase text-slate-400">Low Relevance</div>
          <div className="mt-1 text-lg font-black text-slate-400">{metrics.lowRelevance}</div>
          <div className="text-[9px] text-slate-500">Non-core domains</div>
        </button>
      </div>

      {/* Row 2: Location & Mobility Radar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
        <button
          onClick={() =>
            onFilterChange({
              location: filters.location === "INDIA" ? "ALL" : "INDIA",
            })
          }
          className={`rounded-xl border p-2.5 transition text-left sm:text-center ${
            filters.location === "INDIA"
              ? "border-emerald-500 bg-emerald-950/40 shadow-sm"
              : "border-slate-800 bg-slate-900/80 hover:border-slate-700"
          }`}
        >
          <div className="text-[10px] font-bold uppercase text-slate-400">India Total</div>
          <div className="mt-1 text-lg font-black text-emerald-400">{metrics.india}</div>
          <div className="text-[9px] text-slate-500">India eligible</div>
        </button>

        <button
          onClick={() =>
            onFilterChange({
              location: filters.location === "HYDERABAD" ? "ALL" : "HYDERABAD",
            })
          }
          className={`rounded-xl border p-2.5 transition text-left sm:text-center ${
            filters.location === "HYDERABAD"
              ? "border-cyan-500 bg-cyan-950/40 shadow-sm"
              : "border-cyan-800/40 bg-cyan-950/20 hover:border-cyan-600/70"
          }`}
        >
          <div className="text-[10px] font-bold uppercase text-cyan-300">Hyderabad</div>
          <div className="mt-1 text-lg font-black text-cyan-300">{metrics.hyderabad}</div>
          <div className="text-[9px] text-cyan-500">Primary Hub</div>
        </button>

        <button
          onClick={() =>
            onFilterChange({
              location: filters.location === "REMOTE_INDIA" ? "ALL" : "REMOTE_INDIA",
            })
          }
          className={`rounded-xl border p-2.5 transition text-left sm:text-center ${
            filters.location === "REMOTE_INDIA"
              ? "border-sky-500 bg-sky-950/40 shadow-sm"
              : "border-slate-800 bg-slate-900/80 hover:border-slate-700"
          }`}
        >
          <div className="text-[10px] font-bold uppercase text-slate-400">Remote India</div>
          <div className="mt-1 text-lg font-black text-sky-400">{metrics.remoteIndia}</div>
          <div className="text-[9px] text-slate-500">Work from India</div>
        </button>

        <button
          onClick={() =>
            onFilterChange({
              location: filters.location === "REMOTE_GLOBAL" ? "ALL" : "REMOTE_GLOBAL",
            })
          }
          className={`rounded-xl border p-2.5 transition text-left sm:text-center ${
            filters.location === "REMOTE_GLOBAL"
              ? "border-indigo-500 bg-indigo-950/40 shadow-sm"
              : "border-slate-800 bg-slate-900/80 hover:border-slate-700"
          }`}
        >
          <div className="text-[10px] font-bold uppercase text-slate-400">Global Remote</div>
          <div className="mt-1 text-lg font-black text-indigo-400">{metrics.globalRemote}</div>
          <div className="text-[9px] text-slate-500">Worldwide distributed</div>
        </button>

        <button
          onClick={() =>
            onFilterChange({
              remoteType: filters.remoteType === "ONSITE" ? "ALL" : "ONSITE",
            })
          }
          className={`rounded-xl border p-2.5 transition text-left sm:text-center ${
            filters.remoteType === "ONSITE"
              ? "border-slate-500 bg-slate-800"
              : "border-slate-800 bg-slate-900/80 hover:border-slate-700"
          }`}
        >
          <div className="text-[10px] font-bold uppercase text-slate-400">Intl Onsite</div>
          <div className="mt-1 text-lg font-black text-slate-300">{metrics.internationalOnsite}</div>
          <div className="text-[9px] text-slate-500">Foreign onshore</div>
        </button>
      </div>

      {/* Row 3: Travel Radar & Freshness */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
        <button
          onClick={() =>
            onFilterChange({
              travelType:
                filters.travelType === "INTERNATIONAL_TRAVEL" ? "ALL" : "INTERNATIONAL_TRAVEL",
            })
          }
          className={`rounded-xl border p-2.5 transition text-left sm:text-center ${
            filters.travelType === "INTERNATIONAL_TRAVEL"
              ? "border-indigo-500 bg-indigo-950/40 shadow-sm"
              : "border-indigo-800/40 bg-indigo-950/20 hover:border-indigo-600/70"
          }`}
        >
          <div className="text-[10px] font-bold uppercase text-indigo-300">Intl Travel</div>
          <div className="mt-1 text-lg font-black text-indigo-300">{metrics.internationalTravel}</div>
          <div className="text-[9px] text-indigo-500">Cross-border travel</div>
        </button>

        <button
          onClick={() =>
            onFilterChange({
              travelType:
                filters.travelType === "CLIENT_SITE_TRAVEL" ? "ALL" : "CLIENT_SITE_TRAVEL",
            })
          }
          className={`rounded-xl border p-2.5 transition text-left sm:text-center ${
            filters.travelType === "CLIENT_SITE_TRAVEL"
              ? "border-cyan-500 bg-cyan-950/40 shadow-sm"
              : "border-cyan-800/40 bg-cyan-950/20 hover:border-cyan-600/70"
          }`}
        >
          <div className="text-[10px] font-bold uppercase text-cyan-300">Client Site Travel</div>
          <div className="mt-1 text-lg font-black text-cyan-300">{metrics.clientSiteTravel}</div>
          <div className="text-[9px] text-cyan-500">Customer onsite</div>
        </button>

        <button
          onClick={() =>
            onFilterChange({
              travelType:
                filters.travelType === "RELOCATION" ? "ALL" : "RELOCATION",
            })
          }
          className={`rounded-xl border p-2.5 transition text-left sm:text-center ${
            filters.travelType === "RELOCATION"
              ? "border-rose-500 bg-rose-950/40 shadow-sm"
              : "border-slate-800 bg-slate-900/80 hover:border-slate-700"
          }`}
        >
          <div className="text-[10px] font-bold uppercase text-slate-400">Relocation</div>
          <div className="mt-1 text-lg font-black text-rose-300">{metrics.relocation}</div>
          <div className="text-[9px] text-slate-500">Relocation package</div>
        </button>

        <button
          onClick={() =>
            onFilterChange({
              freshness: filters.freshness === "FRESH" ? "ALL" : "FRESH",
            })
          }
          className={`rounded-xl border p-2.5 transition text-left sm:text-center ${
            filters.freshness === "FRESH"
              ? "border-emerald-500 bg-emerald-950/40 shadow-sm"
              : "border-slate-800 bg-slate-900/80 hover:border-slate-700"
          }`}
        >
          <div className="text-[10px] font-bold uppercase text-emerald-300">Fresh Jobs</div>
          <div className="mt-1 text-lg font-black text-emerald-400">{metrics.freshJobs}</div>
          <div className="text-[9px] text-emerald-500">≤ 3 days ago</div>
        </button>

        <button
          onClick={() =>
            onFilterChange({
              freshness: filters.freshness === "RECENT" ? "ALL" : "RECENT",
            })
          }
          className={`rounded-xl border p-2.5 transition text-left sm:text-center ${
            filters.freshness === "RECENT"
              ? "border-amber-500 bg-amber-950/40 shadow-sm"
              : "border-slate-800 bg-slate-900/80 hover:border-slate-700"
          }`}
        >
          <div className="text-[10px] font-bold uppercase text-amber-300">Recent Jobs</div>
          <div className="mt-1 text-lg font-black text-amber-400">{metrics.recentJobs}</div>
          <div className="text-[9px] text-amber-500">≤ 14 days ago</div>
        </button>
      </div>

      {/* Row 4: International Opportunity Radar (Phase 7 Section 17) */}
      <div className="rounded-xl border border-indigo-900/50 bg-indigo-950/20 p-3.5 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <span>🌍 INTERNATIONAL OPPORTUNITY RADAR</span>
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 text-[11px]">
              Cross-border exposure, EMEA scope, client engagement & international mobility
            </span>
          </div>
          {(filters.market !== "ALL" || filters.opportunityType !== "ALL" || filters.internationalBucket !== "ALL") && (
            <button
              onClick={() => onFilterChange({ market: "ALL", opportunityType: "ALL", internationalBucket: "ALL", emeaCountry: "ALL" })}
              className="text-[11px] text-cyan-400 hover:underline"
            >
              Reset International Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center">
          {/* EMEA Opportunities */}
          <button
            onClick={() => onFilterChange({ market: filters.market === "EMEA" ? "ALL" : "EMEA" })}
            className={`rounded-xl border p-2.5 transition text-left sm:text-center ${
              filters.market === "EMEA"
                ? "border-purple-500 bg-purple-950/50 shadow-sm"
                : "border-purple-900/40 bg-purple-950/20 hover:border-purple-700/60"
            }`}
          >
            <div className="text-[10px] font-bold uppercase text-purple-300">EMEA Roles</div>
            <div className="mt-1 text-lg font-black text-purple-300">{metrics.emeaOpportunities}</div>
            <div className="text-[9px] text-purple-400/80">UK, Europe & Middle East</div>
          </button>

          {/* India -> EMEA Roles */}
          <button
            onClick={() =>
              onFilterChange({
                opportunityType:
                  filters.opportunityType === "INDIA_TO_EMEA" ? "ALL" : "INDIA_TO_EMEA",
              })
            }
            className={`rounded-xl border p-2.5 transition text-left sm:text-center ${
              filters.opportunityType === "INDIA_TO_EMEA"
                ? "border-fuchsia-500 bg-fuchsia-950/50 shadow-sm"
                : "border-fuchsia-900/40 bg-fuchsia-950/20 hover:border-fuchsia-700/60"
            }`}
          >
            <div className="text-[10px] font-bold uppercase text-fuchsia-300">India → EMEA</div>
            <div className="mt-1 text-lg font-black text-fuchsia-300">{metrics.indiaToEmeaOpportunities}</div>
            <div className="text-[9px] text-fuchsia-400/80">India base + EMEA scope</div>
          </button>

          {/* International Travel */}
          <button
            onClick={() =>
              onFilterChange({
                travelType:
                  filters.travelType === "INTERNATIONAL_TRAVEL" ? "ALL" : "INTERNATIONAL_TRAVEL",
              })
            }
            className={`rounded-xl border p-2.5 transition text-left sm:text-center ${
              filters.travelType === "INTERNATIONAL_TRAVEL"
                ? "border-indigo-500 bg-indigo-950/50 shadow-sm"
                : "border-indigo-900/40 bg-indigo-950/20 hover:border-indigo-700/60"
            }`}
          >
            <div className="text-[10px] font-bold uppercase text-indigo-300">Intl Travel</div>
            <div className="mt-1 text-lg font-black text-indigo-300">{metrics.internationalTravel}</div>
            <div className="text-[9px] text-indigo-400/80">Cross-border travel</div>
          </button>

          {/* Client-Site Travel */}
          <button
            onClick={() =>
              onFilterChange({
                travelType:
                  filters.travelType === "CLIENT_SITE_TRAVEL" ? "ALL" : "CLIENT_SITE_TRAVEL",
              })
            }
            className={`rounded-xl border p-2.5 transition text-left sm:text-center ${
              filters.travelType === "CLIENT_SITE_TRAVEL"
                ? "border-cyan-500 bg-cyan-950/50 shadow-sm"
                : "border-cyan-900/40 bg-cyan-950/20 hover:border-cyan-700/60"
            }`}
          >
            <div className="text-[10px] font-bold uppercase text-cyan-300">Client-Site Travel</div>
            <div className="mt-1 text-lg font-black text-cyan-300">{metrics.clientSiteTravel}</div>
            <div className="text-[9px] text-cyan-400/80">Customer onsite</div>
          </button>

          {/* Global Remote */}
          <button
            onClick={() =>
              onFilterChange({
                market: filters.market === "GLOBAL_REMOTE" ? "ALL" : "GLOBAL_REMOTE",
              })
            }
            className={`rounded-xl border p-2.5 transition text-left sm:text-center ${
              filters.market === "GLOBAL_REMOTE"
                ? "border-sky-500 bg-sky-950/50 shadow-sm"
                : "border-sky-900/40 bg-sky-950/20 hover:border-sky-700/60"
            }`}
          >
            <div className="text-[10px] font-bold uppercase text-sky-300">Global Remote</div>
            <div className="mt-1 text-lg font-black text-sky-300">{metrics.globalRemote}</div>
            <div className="text-[9px] text-sky-400/80">Worldwide hiring</div>
          </button>

          {/* International Priority Bucket */}
          <button
            onClick={() =>
              onFilterChange({
                internationalBucket:
                  filters.internationalBucket === "INTERNATIONAL_PRIORITY"
                    ? "ALL"
                    : "INTERNATIONAL_PRIORITY",
              })
            }
            className={`rounded-xl border p-2.5 transition text-left sm:text-center ${
              filters.internationalBucket === "INTERNATIONAL_PRIORITY"
                ? "border-emerald-500 bg-emerald-950/50 shadow-sm ring-1 ring-emerald-500/50"
                : "border-emerald-900/40 bg-emerald-950/20 hover:border-emerald-700/60"
            }`}
          >
            <div className="text-[10px] font-bold uppercase text-emerald-300">Intl Priority</div>
            <div className="mt-1 text-lg font-black text-emerald-300">{metrics.internationalPriorityCount}</div>
            <div className="text-[9px] text-emerald-400/80">Top global matches</div>
          </button>
        </div>
      </div>
    </section>
  );
}
