"use client";

import type { JobFiltersState } from "@/types";

interface JobFiltersProps {
  filters: JobFiltersState;
  onChange: (filters: JobFiltersState) => void;
  onReset: () => void;
  availableSources: string[];
  availableRoleFamilies: string[];
  totalCount: number;
  filteredCount: number;
}

export function JobFilters({
  filters,
  onChange,
  onReset,
  availableSources,
  availableRoleFamilies,
  totalCount,
  filteredCount,
}: JobFiltersProps) {
  function update(partial: Partial<JobFiltersState>) {
    onChange({ ...filters, ...partial });
  }

  const isFiltered =
    Boolean(filters.search) ||
    filters.location !== "ALL" ||
    filters.remoteType !== "ALL" ||
    filters.minSalaryLpa !== null ||
    filters.roleFamily !== "ALL" ||
    filters.travelType !== "ALL" ||
    filters.source !== "ALL" ||
    filters.postedWithinDays !== null;

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
      {/* Top Search Input & Quick Sort */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-3.5 text-slate-500 text-sm">🔍</span>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            placeholder="Search by keyword, title, company, or skills (e.g. React, Contentful, Next.js)..."
            className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 transition"
          />
          {filters.search && (
            <button
              onClick={() => update({ search: "" })}
              className="absolute right-3 top-3 text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Sort by:</span>
          <select
            value={filters.sortBy}
            onChange={(e) =>
              update({ sortBy: e.target.value as JobFiltersState["sortBy"] })
            }
            aria-label="Sort jobs by"
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-xs text-slate-200 outline-none focus:border-cyan-500 font-medium"
          >
            <option value="newest">🕒 Newest Discovered</option>
            <option value="relevance">🎯 Best Profile Match</option>
            <option value="salary">💰 Highest Salary</option>
            <option value="travel">✈️ International Travel First</option>
            <option value="location">📍 Location</option>
          </select>
        </div>
      </div>

      {/* Primary Quick Filter Chips */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider mr-1">
          Quick Filters:
        </span>

        {/* Remote Toggle */}
        <button
          onClick={() =>
            update({
              remoteType: filters.remoteType === "REMOTE" ? "ALL" : "REMOTE",
            })
          }
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            filters.remoteType === "REMOTE"
              ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
              : "border-slate-800 bg-slate-950/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
          }`}
        >
          🌐 Remote Only
        </button>

        {/* Hyderabad Toggle */}
        <button
          onClick={() =>
            update({
              location: filters.location === "HYDERABAD" ? "ALL" : "HYDERABAD",
            })
          }
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            filters.location === "HYDERABAD"
              ? "border-cyan-500 bg-cyan-500/20 text-cyan-300"
              : "border-slate-800 bg-slate-950/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
          }`}
        >
          📍 Hyderabad
        </button>

        {/* ₹35L+ Compensation Toggle */}
        <button
          onClick={() =>
            update({
              minSalaryLpa: filters.minSalaryLpa === 35 ? null : 35,
            })
          }
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            filters.minSalaryLpa === 35
              ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
              : "border-slate-800 bg-slate-950/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
          }`}
        >
          💰 ₹35 LPA+
        </button>

        {/* International Travel Toggle */}
        <button
          onClick={() =>
            update({
              travelType:
                filters.travelType === "INTERNATIONAL" ? "ALL" : "INTERNATIONAL",
            })
          }
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            filters.travelType === "INTERNATIONAL"
              ? "border-indigo-500 bg-indigo-500/20 text-indigo-300 shadow-sm shadow-indigo-950"
              : "border-slate-800 bg-slate-950/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
          }`}
        >
          ✈️ International Travel
        </button>

        {/* Client-Site Travel Toggle */}
        <button
          onClick={() =>
            update({
              travelType:
                filters.travelType === "CLIENT_SITE" ? "ALL" : "CLIENT_SITE",
            })
          }
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            filters.travelType === "CLIENT_SITE"
              ? "border-cyan-500 bg-cyan-500/20 text-cyan-300"
              : "border-slate-800 bg-slate-950/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
          }`}
        >
          🏢 Client-Site Travel
        </button>
      </div>

      {/* Advanced Filter Row (Dropdowns) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-2">
        {/* Role Family */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
            Role Family
          </label>
          <select
            value={filters.roleFamily}
            onChange={(e) => update({ roleFamily: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Role Families</option>
            {availableRoleFamilies.map((rf) => (
              <option key={rf} value={rf}>
                {rf}
              </option>
            ))}
          </select>
        </div>

        {/* Location Dropdown */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
            Target Location
          </label>
          <select
            value={filters.location}
            onChange={(e) => update({ location: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Locations</option>
            <option value="HYDERABAD">Hyderabad</option>
            <option value="INDIA">India (Any City)</option>
            <option value="REMOTE">Remote / Worldwide</option>
          </select>
        </div>

        {/* Work Model */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
            Workplace Model
          </label>
          <select
            value={filters.remoteType}
            onChange={(e) => update({ remoteType: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Models</option>
            <option value="REMOTE">100% Remote</option>
            <option value="HYBRID">Hybrid</option>
            <option value="ONSITE">Onsite</option>
          </select>
        </div>

        {/* Source Provider */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
            Job Source
          </label>
          <select
            value={filters.source}
            onChange={(e) => update({ source: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Permitted Sources</option>
            {availableSources.map((src) => (
              <option key={src} value={src}>
                {src}
              </option>
            ))}
          </select>
        </div>

        {/* Posted Recency */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
            Posted Date
          </label>
          <select
            value={filters.postedWithinDays === null ? "ALL" : String(filters.postedWithinDays)}
            onChange={(e) =>
              update({
                postedWithinDays:
                  e.target.value === "ALL" ? null : parseInt(e.target.value, 10),
              })
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
          >
            <option value="ALL">Anytime</option>
            <option value="1">Last 24 Hours</option>
            <option value="3">Last 3 Days</option>
            <option value="7">Last 7 Days</option>
            <option value="14">Last 14 Days</option>
            <option value="30">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Results Count & Reset Filter Bar */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
        <div>
          Showing <span className="font-semibold text-white">{filteredCount}</span> of{" "}
          <span className="font-semibold text-slate-300">{totalCount}</span> active opportunities
        </div>

        {isFiltered && (
          <button
            onClick={onReset}
            className="text-cyan-400 hover:text-cyan-300 font-medium hover:underline flex items-center gap-1"
          >
            ↺ Reset all filters
          </button>
        )}
      </div>
    </section>
  );
}
