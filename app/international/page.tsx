"use client";

import { useEffect, useMemo, useState } from "react";
import type { Job } from "@/types";
import { internationalTargetCompanies, rejectedInternationalCompanies } from "@/config/internationalTargets";
import { getStoredJobs, saveJobs } from "@/lib/storage";
import { SyncButton } from "@/components/jobs/SyncButton";
import type { ProviderStatus } from "@/types";

function isToday(value?: string) {
  if (!value) return false;
  const d = new Date(value);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function isRoleMatch(job: Job, roles: string[]) {
  const haystack = `${job.title} ${job.roleFamily} ${job.skills.join(" ")}`.toLowerCase();
  return roles.some((role) => {
    const tokens = role.toLowerCase().split(/\\s+/).filter((t) => t.length > 3);
    return tokens.length > 0 && tokens.some((token) => haystack.includes(token));
  });
}

function hasForeignCompensation(job: Job) {
  const currency = (job.currency || job.originalCurrency || "").toUpperCase();
  return currency.length > 0 && currency !== "INR" && currency !== "₹";
}

export default function InternationalPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedCompany, setSelectedCompany] = useState("ALL");
  const [search, setSearch] = useState("");
  const [todayOnly, setTodayOnly] = useState(true);
  const [remoteOnly, setRemoteOnly] = useState(true);
  const [foreignPayOnly, setForeignPayOnly] = useState(false);
  const [latestProviders, setLatestProviders] = useState<ProviderStatus[]>([]);

  useEffect(() => {
    queueMicrotask(() => setJobs(getStoredJobs()));
  }, []);

  function handleSync(newJobs: Job[], providers?: ProviderStatus[]) {
    saveJobs(newJobs);
    setJobs(newJobs);
    if (providers) setLatestProviders(providers);
  }

  const companyNames = useMemo(() => new Set(internationalTargetCompanies.map((c) => c.name.toLowerCase())), []);

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();

    return jobs
      .filter((job) => {
        if (!companyNames.has(job.company.toLowerCase())) return false;
        if (selectedCompany !== "ALL" && job.company !== selectedCompany) return false;
        if (todayOnly && !isToday(job.postedAt || job.discoveredAt)) return false;
        if (remoteOnly && job.remoteType !== "REMOTE") return false;
        if (foreignPayOnly && !hasForeignCompensation(job)) return false;
        if (q) {
          const text = `${job.title} ${job.company} ${job.location} ${job.description || ""} ${job.skills.join(" ")}`.toLowerCase();
          if (!text.includes(q)) return false;
        }

        const target = internationalTargetCompanies.find((c) => c.name.toLowerCase() === job.company.toLowerCase());
        return target ? isRoleMatch(job, target.roles) : false;
      })
      .sort((a, b) => {
        const aTime = new Date(a.postedAt || a.discoveredAt).getTime();
        const bTime = new Date(b.postedAt || b.discoveredAt).getTime();
        return bTime - aTime;
      });
  }, [jobs, selectedCompany, search, todayOnly, remoteOnly, foreignPayOnly, companyNames]);

  const companyStats = useMemo(() => {
    return internationalTargetCompanies.map((company) => {
      const companyJobs = jobs.filter((job) => job.company.toLowerCase() === company.name.toLowerCase());
      const newJobs = companyJobs.filter((job) => isToday(job.postedAt || job.discoveredAt));
      const indiaEligible = companyJobs.filter((job) => job.isIndiaEligible);
      return { company, total: companyJobs.length, newJobs: newJobs.length, indiaEligible: indiaEligible.length };
    });
  }, [jobs]);

  const newCount = companyStats.reduce((sum, item) => sum + item.newJobs, 0);
  const matchedCount = matches.length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">🌎 INTERNATIONAL DAILY SEARCH</h1>
            <span className="rounded-full bg-indigo-950 border border-indigo-800 px-3 py-0.5 text-xs font-semibold text-indigo-300">DAILY</span>
          </div>
          <p className="mt-1.5 max-w-3xl text-sm text-slate-400">
            Track foreign companies for full-time remote roles that can potentially be worked from India. The dashboard never assumes that a foreign salary or remote label means India eligibility; each role must be verified.
          </p>
        </div>
        <SyncButton onSyncComplete={handleSync} existingJobs={jobs} />
      </div>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ["Tracked Companies", internationalTargetCompanies.length],
          ["New Today", newCount],
          ["Matching Jobs", matchedCount],
          ["Provider Feeds", latestProviders.length || "—"],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">{label}</div>
            <div className="mt-1 text-2xl font-black text-white">{value}</div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
        <div className="flex flex-col xl:flex-row gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company, role, React, Next.js, architect..."
            className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500"
          />
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none"
          >
            <option value="ALL">All tracked companies</option>
            {internationalTargetCompanies.map((company) => <option key={company.id} value={company.name}>{company.name}</option>)}
          </select>
          <div className="flex flex-wrap items-center gap-2">
            {[
              ["Today only", todayOnly, setTodayOnly],
              ["Remote only", remoteOnly, setRemoteOnly],
              ["Foreign pay", foreignPayOnly, setForeignPayOnly],
            ].map(([label, value, setter]) => (
              <button
                key={String(label)}
                onClick={() => (setter as (v: boolean) => void)(!(value as boolean))}
                className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${value ? "border-indigo-500 bg-indigo-950 text-indigo-200" : "border-slate-700 bg-slate-900 text-slate-400"}`}
              >
                {value ? "✓ " : ""}{label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-300">Company Watchlist</h2>
          <span className="text-xs text-slate-500">India entity status is intentionally explicit</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {companyStats.map(({ company, total, newJobs, indiaEligible }) => (
            <button
              key={company.id}
              onClick={() => setSelectedCompany(company.name)}
              className={`text-left rounded-2xl border p-4 transition hover:border-indigo-600 ${selectedCompany === company.name ? "border-indigo-500 bg-indigo-950/30" : "border-slate-800 bg-slate-900/70"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-white">{company.name}</span>
                <span className={`rounded px-2 py-0.5 text-[10px] font-bold border ${company.status === "WATCH" ? "border-emerald-800 bg-emerald-950 text-emerald-300" : company.status === "REJECT" ? "border-rose-800 bg-rose-950 text-rose-300" : "border-amber-800 bg-amber-950 text-amber-300"}`}>{company.status}</span>
              </div>
              <div className="mt-2 text-xs text-slate-400">{company.headquarters}</div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg bg-slate-950 p-2"><b className="block text-white">{total}</b>jobs</div>
                <div className="rounded-lg bg-slate-950 p-2"><b className="block text-cyan-300">{newJobs}</b>today</div>
                <div className="rounded-lg bg-slate-950 p-2"><b className="block text-emerald-300">{indiaEligible}</b>India eligible</div>
              </div>
              <div className="mt-3 text-[11px] text-slate-500">India entity: <span className="text-slate-300">{company.indiaEntityStatus.replaceAll("_", " ")}</span></div>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-300">Matching International Jobs</h2>
          <span className="text-xs text-slate-500">{matches.length} shown</span>
        </div>

        {matches.map((job) => (
          <article key={job.id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 hover:border-slate-700 transition">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-white">{job.title}</h3>
                  <span className="rounded-full bg-cyan-950 border border-cyan-800 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">{job.company}</span>
                  {job.isIndiaEligible && <span className="rounded-full bg-emerald-950 border border-emerald-800 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">INDIA ELIGIBLE</span>}
                </div>
                <div className="mt-2 text-xs text-slate-400">{job.location} • {job.remoteType} • {job.seniority}</div>
                <div className="mt-2 text-xs text-slate-300">
                  {job.salaryDisclosed ? (job.originalSalary || job.convertedSalary || "Salary disclosed") : "Salary not disclosed"}
                  {job.currency ? ` • ${job.currency}` : ""}
                </div>
                {job.description && <p className="mt-3 line-clamp-3 text-xs leading-5 text-slate-400">{job.description}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <a href={job.url} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-500">Apply ↗</a>
                <a href={`/jobs?search=${encodeURIComponent(job.company)}`} className="rounded-xl border border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white">Radar</a>
              </div>
            </div>
          </article>
        ))}

        {matches.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 p-10 text-center">
            <div className="text-3xl">🌎</div>
            <h3 className="mt-2 font-bold text-white">No matching jobs in the current index</h3>
            <p className="mt-1 text-xs text-slate-500">Run “Scan Market Now”. The international watchlist uses the same ingestion engine as Market Radar.</p>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-rose-900/50 bg-rose-950/10 p-4">
        <h2 className="text-sm font-black uppercase tracking-wider text-rose-300">Excluded Companies</h2>
        <p className="mt-1 text-xs text-slate-500">These are excluded from the no-India-entity target list based on the current configuration; review periodically because corporate structures can change.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {rejectedInternationalCompanies.map((company) => (
            <span key={company.name} title={company.reason} className="rounded-lg border border-rose-900 bg-slate-950 px-3 py-1.5 text-xs text-slate-300">{company.name}</span>
          ))}
        </div>
      </section>
    </div>
  );
}
