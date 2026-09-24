"use client";

import type { JobFiltersState } from "@/types";

interface JobFiltersProps {
  filters: JobFiltersState;
  onChange: (filters: JobFiltersState) => void;
  onReset: () => void;
  availableSources: string[];
  availableRoleFamilies: string[];
  availableCompanies: string[];
  totalCount: number;
  filteredCount: number;
}

export function JobFilters({
  filters,
  onChange,
  onReset,
  availableSources,
  availableRoleFamilies,
  availableCompanies,
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
    filters.technology !== "ALL" ||
    filters.domain !== "ALL" ||
    filters.clientFacing !== "ALL" ||
    filters.relevance !== "ALL" ||
    filters.company !== "ALL" ||
    filters.experienceLevel !== "ALL" ||
    (filters.opportunityPriority && filters.opportunityPriority !== "ALL") ||
    (filters.freshness && filters.freshness !== "ALL") ||
    filters.postedWithinDays !== null ||
    (filters.market && filters.market !== "ALL") ||
    (filters.emeaCountry && filters.emeaCountry !== "ALL") ||
    (filters.opportunityType && filters.opportunityType !== "ALL") ||
    (filters.internationalExposure && filters.internationalExposure !== "ALL") ||
    (filters.workAuthorization && filters.workAuthorization !== "ALL") ||
    (filters.internationalBucket && filters.internationalBucket !== "ALL");

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
            placeholder="Search by title, company, skills, or notes (e.g. React, Contentful, Next.js)..."
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
            <option value="relevance">🎯 Priority Default (Priority &gt; Active &gt; Watch &gt; Low)</option>
            <option value="international">🌍 International Opportunity (Priority &gt; Active &gt; Watch)</option>
            <option value="clientFacing">💼 Client Facing First</option>
            <option value="market">🌐 Market Region (India &gt; EMEA &gt; Global Remote)</option>
            <option value="freshest">🟢 Freshest (Newest Jobs First)</option>
            <option value="newest">🕒 Most Recent (Posted/Discovered)</option>
            <option value="travel">✈️ Travel Opportunity (Intl & Client First)</option>
            <option value="location">📍 Location (Hyderabad First)</option>
            <option value="salary">💰 Highest Salary</option>
          </select>
        </div>
      </div>

      {/* Phase 7: First-Class Market Filter Row (Section 3) */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
        <span className="text-xs text-purple-400 font-semibold uppercase tracking-wider mr-1">
          Market:
        </span>
        {[
          { id: "ALL", label: "All Markets" },
          { id: "INDIA", label: "🇮🇳 India" },
          { id: "EMEA", label: "🌍 EMEA" },
          { id: "NORTH_AMERICA", label: "🇺🇸 North America" },
          { id: "APAC", label: "🌏 APAC" },
          { id: "GLOBAL_REMOTE", label: "🌐 Global Remote" },
          { id: "UNKNOWN", label: "Unspecified" },
        ].map((m) => {
          const isSelected = (filters.market || "ALL") === m.id;
          return (
            <button
              key={m.id}
              onClick={() => update({ market: m.id === "ALL" ? "ALL" : m.id, emeaCountry: "ALL" })}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                isSelected
                  ? "border-purple-500 bg-purple-500/20 text-purple-200 font-bold ring-1 ring-purple-500/50"
                  : "border-slate-800 bg-slate-950/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Within EMEA, Country Filter (Section 3) */}
      {(filters.market === "EMEA" || (filters.emeaCountry && filters.emeaCountry !== "ALL")) && (
        <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-xl bg-purple-950/20 border border-purple-900/40">
          <span className="text-xs text-purple-300 font-semibold uppercase tracking-wider mr-1">
            EMEA Countries:
          </span>
          {[
            { id: "ALL", label: "All EMEA" },
            { id: "UK", label: "UK" },
            { id: "IRELAND", label: "Ireland" },
            { id: "GERMANY", label: "Germany" },
            { id: "NETHERLANDS", label: "Netherlands" },
            { id: "FRANCE", label: "France" },
            { id: "SPAIN", label: "Spain" },
            { id: "SWITZERLAND", label: "Switzerland" },
            { id: "SWEDEN", label: "Sweden" },
            { id: "NORWAY", label: "Norway" },
            { id: "DENMARK", label: "Denmark" },
            { id: "FINLAND", label: "Finland" },
            { id: "UAE", label: "UAE" },
            { id: "SAUDI_ARABIA", label: "Saudi Arabia" },
            { id: "QATAR", label: "Qatar" },
            { id: "ISRAEL", label: "Israel" },
            { id: "SOUTH_AFRICA", label: "South Africa" },
            { id: "OTHER_EMEA", label: "Other EMEA" },
          ].map((c) => {
            const isSelected = (filters.emeaCountry || "ALL") === c.id;
            return (
              <button
                key={c.id}
                onClick={() => update({ emeaCountry: c.id, market: "EMEA" })}
                className={`rounded-md border px-2 py-1 text-[11px] font-medium transition ${
                  isSelected
                    ? "border-purple-400 bg-purple-500/30 text-white font-bold"
                    : "border-purple-900/60 bg-purple-950/40 text-purple-300 hover:border-purple-700"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Opportunity Type Quick Filters (Section 21) */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
        <span className="text-xs text-cyan-400 font-semibold uppercase tracking-wider mr-1">
          Opportunity:
        </span>
        {[
          { id: "ALL", label: "All" },
          { id: "INDIA_TO_EMEA", label: "🌍 India → EMEA" },
          { id: "INTERNATIONAL_TRAVEL", label: "✈️ International Travel" },
          { id: "CLIENT_FACING", label: "💼 Client Facing" },
          { id: "GLOBAL_REMOTE", label: "🌐 Global Remote" },
          { id: "RELOCATION", label: "📦 Relocation" },
        ].map((o) => {
          const isSelected = (filters.opportunityType || "ALL") === o.id;
          return (
            <button
              key={o.id}
              onClick={() => update({ opportunityType: o.id })}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                isSelected
                  ? "border-cyan-500 bg-cyan-500/20 text-cyan-200 font-bold ring-1 ring-cyan-500/50"
                  : "border-slate-800 bg-slate-950/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>

      {/* Opportunity Priority Quick Buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider mr-1">
          Priority:
        </span>

        <button
          onClick={() =>
            update({
              opportunityPriority: filters.opportunityPriority === "PRIORITY" ? "ALL" : "PRIORITY",
            })
          }
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            filters.opportunityPriority === "PRIORITY"
              ? "border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold ring-1 ring-emerald-500/50"
              : "border-slate-800 bg-slate-950/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
          }`}
        >
          ● Priority
        </button>

        <button
          onClick={() =>
            update({
              opportunityPriority: filters.opportunityPriority === "ACTIVE" ? "ALL" : "ACTIVE",
            })
          }
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            filters.opportunityPriority === "ACTIVE"
              ? "border-cyan-500 bg-cyan-500/20 text-cyan-300 font-bold"
              : "border-slate-800 bg-slate-950/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
          }`}
        >
          ○ Active
        </button>

        <button
          onClick={() =>
            update({
              opportunityPriority: filters.opportunityPriority === "WATCH" ? "ALL" : "WATCH",
            })
          }
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            filters.opportunityPriority === "WATCH"
              ? "border-amber-500 bg-amber-500/20 text-amber-300 font-bold"
              : "border-slate-800 bg-slate-950/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
          }`}
        >
          👁 Watch
        </button>

        <button
          onClick={() =>
            update({
              opportunityPriority: filters.opportunityPriority === "LOW" ? "ALL" : "LOW",
            })
          }
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            filters.opportunityPriority === "LOW"
              ? "border-slate-500 bg-slate-800 text-slate-200 font-bold"
              : "border-slate-800 bg-slate-950/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
          }`}
        >
          - Low
        </button>
      </div>

      {/* Primary Relevance Quick Buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider mr-1">
          Relevance:
        </span>

        <button
          onClick={() =>
            update({
              relevance: filters.relevance === "HIGH_RELEVANCE" ? "ALL" : "HIGH_RELEVANCE",
            })
          }
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            filters.relevance === "HIGH_RELEVANCE"
              ? "border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold"
              : "border-slate-800 bg-slate-950/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
          }`}
        >
          🌟 High Relevance
        </button>

        <button
          onClick={() =>
            update({
              relevance: filters.relevance === "RELEVANT" ? "ALL" : "RELEVANT",
            })
          }
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            filters.relevance === "RELEVANT"
              ? "border-cyan-500 bg-cyan-500/20 text-cyan-300"
              : "border-slate-800 bg-slate-950/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
          }`}
        >
          ✨ Relevant
        </button>

        <button
          onClick={() =>
            update({
              relevance: filters.relevance === "POSSIBLE" ? "ALL" : "POSSIBLE",
            })
          }
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            filters.relevance === "POSSIBLE"
              ? "border-amber-500 bg-amber-500/20 text-amber-300"
              : "border-slate-800 bg-slate-950/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
          }`}
        >
          🔍 Possible
        </button>

        <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

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

        {/* Remote India Toggle */}
        <button
          onClick={() =>
            update({
              location: filters.location === "REMOTE_INDIA" ? "ALL" : "REMOTE_INDIA",
            })
          }
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            filters.location === "REMOTE_INDIA"
              ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
              : "border-slate-800 bg-slate-950/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
          }`}
        >
          🇮🇳 Remote India
        </button>

        {/* International Travel Toggle */}
        <button
          onClick={() =>
            update({
              travelType:
                filters.travelType === "INTERNATIONAL_TRAVEL" ? "ALL" : "INTERNATIONAL_TRAVEL",
            })
          }
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            filters.travelType === "INTERNATIONAL_TRAVEL"
              ? "border-indigo-500 bg-indigo-500/20 text-indigo-300 shadow-sm"
              : "border-slate-800 bg-slate-950/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
          }`}
        >
          ✈️ International Travel
        </button>
      </div>

      {/* Advanced Filter Row (Dropdowns) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2">
        {/* Role Family */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
            Role Family
          </label>
          <select
            value={filters.roleFamily}
            onChange={(e) => update({ roleFamily: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Roles</option>
            {availableRoleFamilies.map((rf) => (
              <option key={rf} value={rf}>
                {rf.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        {/* Career Domain Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
            Career Domain
          </label>
          <select
            value={filters.domain || "ALL"}
            onChange={(e) => update({ domain: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-500 font-medium"
          >
            <option value="ALL">All Domains</option>
            <option value="FRONTEND">🎨 Frontend Architecture</option>
            <option value="COMMERCE">🛍️ Commerce & Headless</option>
            <option value="CMS">📝 Headless CMS</option>
            <option value="DIGITAL_EXPERIENCE">🌐 Digital Experience / DXP</option>
            <option value="SOLUTIONS_ARCHITECTURE">📐 Solutions Architecture</option>
            <option value="TECHNICAL_ARCHITECTURE">🏗️ Technical Architecture</option>
            <option value="CLIENT_CONSULTING">💼 Client Consulting</option>
            <option value="ENTERPRISE_INTEGRATION">🔌 Enterprise Integration / APIs</option>
            <option value="PROFESSIONAL_SERVICES">🚀 Professional Services</option>
            <option value="SOFTWARE_ENGINEERING">💻 Software Engineering</option>
            <option value="DEVOPS">⚙️ DevOps</option>
            <option value="SRE">🛡️ SRE & Observability</option>
            <option value="DATA_AI">🤖 Data & AI</option>
            <option value="SECURITY">🔒 Security</option>
          </select>
        </div>

        {/* Technology */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
            Technology
          </label>
          <select
            value={filters.technology}
            onChange={(e) => update({ technology: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Technologies</option>
            <option value="React">React</option>
            <option value="Next.js">Next.js</option>
            <option value="TypeScript">TypeScript</option>
            <option value="Contentful">Contentful</option>
            <option value="Headless CMS">Headless CMS</option>
            <option value="Angular">Angular</option>
            <option value="Commerce">Commerce</option>
            <option value="Digital Experience">Digital Experience</option>
            <option value="Frontend Architecture">Frontend Architecture</option>
            <option value="Node.js">Node.js</option>
            <option value="GraphQL">GraphQL</option>
            <option value="Design Systems">Design Systems</option>
          </select>
        </div>

        {/* Location Dropdown */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
            Location
          </label>
          <select
            value={filters.location}
            onChange={(e) => update({ location: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Locations</option>
            <option value="HYDERABAD">Hyderabad (Target)</option>
            <option value="BANGALORE">Bangalore / Bengaluru</option>
            <option value="PUNE">Pune</option>
            <option value="CHENNAI">Chennai</option>
            <option value="MUMBAI">Mumbai</option>
            <option value="DELHI_NCR">Delhi NCR / Gurgaon</option>
            <option value="INDIA">All India (Metro & Remote)</option>
            <option value="REMOTE_INDIA">Remote from India</option>
            <option value="REMOTE_GLOBAL">Worldwide Remote</option>
          </select>
        </div>

        {/* Seniority / Experience */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
            Seniority
          </label>
          <select
            value={filters.experienceLevel}
            onChange={(e) => update({ experienceLevel: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Levels</option>
            <option value="ARCHITECT">Architect</option>
            <option value="LEAD">Lead / Tech Lead</option>
            <option value="PRINCIPAL">Principal</option>
            <option value="STAFF">Staff Engineer</option>
            <option value="SENIOR">Senior</option>
            <option value="12PLUS">12+ Years Experience</option>
          </select>
        </div>

        {/* Travel Category */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
            Travel
          </label>
          <select
            value={filters.travelType}
            onChange={(e) => update({ travelType: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Travel Types</option>
            <option value="INTERNATIONAL_TRAVEL">✈️ International Travel</option>
            <option value="CLIENT_SITE_TRAVEL">🏢 Client-Site Travel</option>
            <option value="INTERNATIONAL_TEAM_ONLY">🌐 International Team Only</option>
            <option value="REMOTE_GLOBAL">🌍 Remote Global</option>
            <option value="RELOCATION">📦 Relocation</option>
            <option value="NO_TRAVEL_MENTIONED">No Travel Mentioned</option>
          </select>
        </div>
      </div>

      {/* Secondary Filter Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 pt-1 border-t border-slate-800/60">
        {/* Opportunity Priority */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
            Priority Action
          </label>
          <select
            value={filters.opportunityPriority || "ALL"}
            onChange={(e) => update({ opportunityPriority: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-500 font-medium"
          >
            <option value="ALL">All Priorities</option>
            <option value="PRIORITY">● Priority</option>
            <option value="ACTIVE">○ Active</option>
            <option value="WATCH">👁 Watch</option>
            <option value="LOW">- Low</option>
          </select>
        </div>
        {/* Client-Facing / Consulting */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
            Client-Facing
          </label>
          <select
            value={filters.clientFacing || "ALL"}
            onChange={(e) => update({ clientFacing: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Engagements</option>
            <option value="YES">🤝 Client-Facing / Consulting</option>
            <option value="NO">💻 Internal Platform Only</option>
          </select>
        </div>

        {/* Work Model */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
            Remote / Work Model
          </label>
          <select
            value={filters.remoteType}
            onChange={(e) => update({ remoteType: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Models</option>
            <option value="REMOTE">100% Remote</option>
            <option value="HYBRID">Hybrid</option>
            <option value="ONSITE">Onsite</option>
          </select>
        </div>

        {/* Company Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
            Company
          </label>
          <select
            value={filters.company}
            onChange={(e) => update({ company: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Companies</option>
            {availableCompanies.slice(0, 30).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Salary Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
            Compensation
          </label>
          <select
            value={filters.minSalaryLpa === null ? "ALL" : String(filters.minSalaryLpa)}
            onChange={(e) =>
              update({
                minSalaryLpa: e.target.value === "ALL" ? null : parseInt(e.target.value, 10),
              })
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
          >
            <option value="ALL">Any / Open Budget</option>
            <option value="35">≥ ₹35 LPA</option>
            <option value="40">≥ ₹40 LPA</option>
            <option value="50">≥ ₹50 LPA</option>
          </select>
        </div>

        {/* Job Source */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
            Source Provider
          </label>
          <select
            value={filters.source}
            onChange={(e) => update({ source: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Sources</option>
            {availableSources.map((src) => (
              <option key={src} value={src}>
                {src}
              </option>
            ))}
          </select>
        </div>

        {/* Freshness Classification */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
            Freshness Radar
          </label>
          <select
            value={filters.freshness || "ALL"}
            onChange={(e) => update({ freshness: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-500 font-medium"
          >
            <option value="ALL">All Freshness</option>
            <option value="FRESH">🟢 FRESH (≤ 3d)</option>
            <option value="RECENT">🟡 RECENT (≤ 14d)</option>
            <option value="OLDER">⏳ OLDER (&gt; 14d)</option>
            <option value="UNKNOWN">⚪ UNKNOWN</option>
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
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
          >
            <option value="ALL">Anytime</option>
            <option value="1">Last 24 Hours</option>
            <option value="3">Last 3 Days</option>
            <option value="7">Last 7 Days</option>
            <option value="14">Last 14 Days</option>
            <option value="30">Last 30 Days</option>
          </select>
        </div>

        {/* Work Authorization */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
            Work Authorization
          </label>
          <select
            value={filters.workAuthorization || "ALL"}
            onChange={(e) => update({ workAuthorization: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-500 font-medium"
          >
            <option value="ALL">All Auth States</option>
            <option value="INDIA_ELIGIBLE">🇮🇳 India Eligible</option>
            <option value="SPONSORSHIP_AVAILABLE">✨ Visa Sponsorship</option>
            <option value="LOCAL_WORK_AUTH_REQUIRED">🛂 Local Auth Required</option>
            <option value="SPONSORSHIP_NOT_AVAILABLE">🚫 No Sponsorship</option>
            <option value="REMOTE_LOCATION_RESTRICTED">📍 Country Restricted</option>
            <option value="UNKNOWN">⚪ Unspecified</option>
          </select>
        </div>

        {/* International Exposure */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
            Intl Exposure
          </label>
          <select
            value={filters.internationalExposure || "ALL"}
            onChange={(e) => update({ internationalExposure: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-500 font-medium"
          >
            <option value="ALL">All Exposure</option>
            <option value="INTERNATIONAL_CUSTOMERS">👥 Intl Customers (EMEA/US)</option>
            <option value="CLIENT_SITE_TRAVEL">🏢 Client-Site Travel</option>
            <option value="INTERNATIONAL_TRAVEL">✈️ International Travel</option>
            <option value="INTERNATIONAL_TEAM">🌐 International Team</option>
            <option value="RELOCATION">📦 Relocation</option>
          </select>
        </div>
      </div>

      {/* Results Count & Reset Filter Bar */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
        <div>
          Showing <span className="font-semibold text-white">{filteredCount}</span> of{" "}
          <span className="font-semibold text-slate-300">{totalCount}</span> opportunities
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
