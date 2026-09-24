"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Application, ApplicationStatus, Job } from "@/types";
import {
  calculateApplicationFunnelMetrics,
  deleteApplication,
  getApplications,
  isFollowUpDue,
  markFollowUpDone,
  updateApplicationStatus,
} from "@/lib/applicationStore";
import { getStoredJobs } from "@/lib/storage";
import { ApplicationDetailModal } from "@/components/applications/ApplicationDetailModal";

const PIPELINE_COLUMNS: Array<{ id: ApplicationStatus; title: string; color: string; border: string }> = [
  { id: "SAVED", title: "Saved", color: "text-cyan-400", border: "border-cyan-800/80" },
  { id: "APPLIED", title: "Applied", color: "text-indigo-400", border: "border-indigo-800/80" },
  { id: "SCREENING", title: "Screening", color: "text-amber-400", border: "border-amber-800/80" },
  { id: "TECHNICAL", title: "Technical Round", color: "text-purple-400", border: "border-purple-800/80" },
  { id: "FINAL", title: "Final Stage", color: "text-rose-400", border: "border-rose-800/80" },
  { id: "OFFER", title: "Offers Received", color: "text-emerald-400", border: "border-emerald-700" },
];

const TERMINAL_STATUSES: Array<{ id: ApplicationStatus; title: string; color: string }> = [
  { id: "REJECTED", title: "Rejected", color: "text-red-400" },
  { id: "WITHDRAWN", title: "Withdrawn", color: "text-slate-400" },
  { id: "IGNORED", title: "Ignored", color: "text-slate-500" },
];

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobsMap, setJobsMap] = useState<Map<string, Job>>(new Map());
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [onlyFollowUpsDue, setOnlyFollowUpsDue] = useState(false);
  const [activeTab, setActiveTab] = useState<"PIPELINE" | "TERMINAL">("PIPELINE");
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  // Load jobs and applications
  useEffect(() => {
    function refreshData() {
      const storedJobs = getStoredJobs();
      const map = new Map<string, Job>();
      storedJobs.forEach((j) => map.set(j.id, j));
      setJobsMap(map);

      const storedApps = getApplications();
      setApplications(storedApps);
    }

    refreshData();

    window.addEventListener("job-market-radar:applications-updated", refreshData);
    return () => {
      window.removeEventListener("job-market-radar:applications-updated", refreshData);
    };
  }, []);

  // Funnel metrics calculation
  const metrics = useMemo(() => {
    return calculateApplicationFunnelMetrics(applications);
  }, [applications]);

  // Filtering
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const job = jobsMap.get(app.jobId);

      // Follow-up due filter
      if (onlyFollowUpsDue && !isFollowUpDue(app)) {
        return false;
      }

      // Opportunity priority filter
      if (priorityFilter !== "ALL" && job?.opportunityPriority !== priorityFilter) {
        return false;
      }

      // Search query
      if (search) {
        const q = search.toLowerCase();
        const titleMatch = job?.title?.toLowerCase().includes(q) || false;
        const companyMatch = job?.company?.toLowerCase().includes(q) || false;
        const recruiterMatch = app.recruiterName?.toLowerCase().includes(q) || false;
        const notesMatch = app.notes?.toLowerCase().includes(q) || false;
        if (!titleMatch && !companyMatch && !recruiterMatch && !notesMatch) {
          return false;
        }
      }

      return true;
    });
  }, [applications, jobsMap, onlyFollowUpsDue, priorityFilter, search]);

  function handleStatusChange(appId: string, nextStatus: ApplicationStatus) {
    const res = updateApplicationStatus(appId, nextStatus);
    if (res.success && res.application) {
      const updated = res.application;
      setApplications((prev) => prev.map((a) => (a.id === appId ? updated : a)));
      if (selectedApplication && selectedApplication.id === appId) {
        setSelectedApplication(updated);
      }
    }
  }

  function handleMarkFollowUp(appId: string) {
    const updated = markFollowUpDone(appId);
    if (updated) {
      setApplications((prev) => prev.map((a) => (a.id === appId ? updated : a)));
      if (selectedApplication && selectedApplication.id === appId) {
        setSelectedApplication(updated);
      }
    }
  }

  function handleDeleteApplication(appId: string) {
    deleteApplication(appId);
    setApplications((prev) => prev.filter((a) => a.id !== appId));
    if (selectedApplication && selectedApplication.id === appId) {
      setSelectedApplication(null);
    }
  }

  return (
    <div className="mx-auto max-w-[1680px] px-4 py-8 sm:px-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              Application Pipeline
            </h1>
            <span className="rounded-full bg-indigo-950 border border-indigo-800 px-2.5 py-0.5 text-xs font-semibold text-indigo-300">
              60-Day Funnel
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Track interview progression, client interactions, screening feedback, and offers.
          </p>
        </div>

        {/* View Toggle & Search */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("PIPELINE")}
              className={`rounded-lg px-3 py-1.5 transition ${
                activeTab === "PIPELINE"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Active Pipeline ({metrics.saved + metrics.applied + metrics.screening + metrics.technical + metrics.final + metrics.offers})
            </button>
            <button
              onClick={() => setActiveTab("TERMINAL")}
              className={`rounded-lg px-3 py-1.5 transition ${
                activeTab === "TERMINAL"
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Outcome / Archive ({metrics.rejected + metrics.withdrawn + metrics.ignored})
            </button>
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search role, company, recruiter..."
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Application Metrics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-3">
          <span className="text-[10px] uppercase font-bold text-slate-500">Saved</span>
          <div className="mt-1 text-xl font-black text-cyan-400">{metrics.saved}</div>
        </div>
        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-3">
          <span className="text-[10px] uppercase font-bold text-slate-500">Applied</span>
          <div className="mt-1 text-xl font-black text-indigo-400">{metrics.applied}</div>
        </div>
        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-3">
          <span className="text-[10px] uppercase font-bold text-slate-500">Screening</span>
          <div className="mt-1 text-xl font-black text-amber-400">{metrics.screening}</div>
        </div>
        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-3">
          <span className="text-[10px] uppercase font-bold text-slate-500">Technical</span>
          <div className="mt-1 text-xl font-black text-purple-400">{metrics.technical}</div>
        </div>
        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-3">
          <span className="text-[10px] uppercase font-bold text-slate-500">Final Stage</span>
          <div className="mt-1 text-xl font-black text-rose-400">{metrics.final}</div>
        </div>
        <div className="rounded-2xl border border-emerald-900/60 bg-emerald-950/30 p-3">
          <span className="text-[10px] uppercase font-bold text-emerald-400">Offers</span>
          <div className="mt-1 text-xl font-black text-emerald-300">{metrics.offers}</div>
        </div>
        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-3">
          <span className="text-[10px] uppercase font-bold text-slate-500">Rejected</span>
          <div className="mt-1 text-xl font-black text-red-400">{metrics.rejected}</div>
        </div>
        <div
          className={`rounded-2xl border p-3 cursor-pointer transition ${
            metrics.followUpsDue > 0
              ? "border-amber-500/60 bg-amber-950/30"
              : "border-slate-800/80 bg-slate-950/70"
          }`}
          onClick={() => setOnlyFollowUpsDue(!onlyFollowUpsDue)}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-amber-400">Follow-ups Due</span>
            {onlyFollowUpsDue && <span className="text-[10px] text-amber-300 font-bold">Active</span>}
          </div>
          <div className="mt-1 text-xl font-black text-amber-300">{metrics.followUpsDue}</div>
        </div>
      </div>

      {/* 60-Day Funnel Conversion Rate Bar */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-3 mb-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Pipeline Conversion Measurements
            </span>
            <span className="ml-2 text-[11px] text-slate-500">
              (Stage-to-stage transition rate across the 60-day search funnel)
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            Total Tracked: <span className="text-white font-bold">{metrics.totalApplications}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-3">
            <div className="text-slate-400 text-[11px]">Applied → Screening</div>
            <div className="mt-1 text-lg font-black text-indigo-300">
              {metrics.appliedToScreeningConversion !== null
                ? `${metrics.appliedToScreeningConversion}%`
                : "—"}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Resume & profile pass rate</div>
          </div>

          <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-3">
            <div className="text-slate-400 text-[11px]">Screening → Technical</div>
            <div className="mt-1 text-lg font-black text-amber-300">
              {metrics.screeningToTechnicalConversion !== null
                ? `${metrics.screeningToTechnicalConversion}%`
                : "—"}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Recruiter round advance rate</div>
          </div>

          <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-3">
            <div className="text-slate-400 text-[11px]">Technical → Final</div>
            <div className="mt-1 text-lg font-black text-purple-300">
              {metrics.technicalToFinalConversion !== null
                ? `${metrics.technicalToFinalConversion}%`
                : "—"}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Architecture & lead interview rate</div>
          </div>

          <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-3">
            <div className="text-slate-400 text-[11px]">Final → Offer</div>
            <div className="mt-1 text-lg font-black text-emerald-300">
              {metrics.finalToOfferConversion !== null
                ? `${metrics.finalToOfferConversion}%`
                : "—"}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Leadership & offer closure rate</div>
          </div>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-500 font-bold uppercase text-[10px]">Priority:</span>
          {["ALL", "PRIORITY", "ACTIVE", "WATCH", "LOW"].map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                priorityFilter === p
                  ? "border-cyan-500 bg-cyan-950/60 text-cyan-300"
                  : "border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {onlyFollowUpsDue && (
          <button
            onClick={() => setOnlyFollowUpsDue(false)}
            className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-300"
          >
            Clear Follow-up Filter ✕
          </button>
        )}
      </div>

      {/* EMPTY STATE */}
      {applications.length === 0 ? (
        <div className="rounded-3xl border border-slate-800/80 bg-slate-950/60 p-12 text-center space-y-4 max-w-xl mx-auto">
          <div className="text-4xl">📋</div>
          <h2 className="text-xl font-bold text-white">You haven&apos;t saved any jobs yet.</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Browse the Market Radar to discover high-priority opportunities matching your 12+ years
            Senior Technical Lead / Frontend Architect profile, then click &ldquo;Save Job&rdquo; or &ldquo;Apply&rdquo;
            to track them in this pipeline.
          </p>
          <div className="pt-2">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-indigo-500 transition"
            >
              🔍 Browse Market Radar Opportunities →
            </Link>
          </div>
        </div>
      ) : activeTab === "PIPELINE" ? (
        /* KANBAN PIPELINE VIEW */
        <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-slate-800">
          {PIPELINE_COLUMNS.map((col) => {
            const columnApps = filteredApplications.filter((a) => a.status === col.id);

            return (
              <div
                key={col.id}
                className="flex flex-col w-80 shrink-0 rounded-2xl border border-slate-800/80 bg-slate-950/70 p-3.5 shadow-xl"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${col.color}`}>{col.title}</span>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-300">
                      {columnApps.length}
                    </span>
                  </div>
                </div>

                {/* Column Cards */}
                <div className="flex-1 space-y-3 min-h-[220px]">
                  {columnApps.length === 0 ? (
                    <div className="h-32 flex items-center justify-center rounded-xl border border-dashed border-slate-800/80 text-xs text-slate-600">
                      No applications
                    </div>
                  ) : (
                    columnApps.map((app) => {
                      const job = jobsMap.get(app.jobId);
                      const followUpDue = isFollowUpDue(app);

                      return (
                        <div
                          key={app.id}
                          onClick={() => setSelectedApplication(app)}
                          className={`rounded-xl border p-3.5 cursor-pointer transition space-y-2.5 shadow-md ${
                            followUpDue
                              ? "border-amber-500/70 bg-amber-950/20 hover:border-amber-400"
                              : "border-slate-800 bg-slate-900/90 hover:border-slate-700"
                          }`}
                        >
                          {/* Card Top: Badges & Priority */}
                          <div className="flex flex-wrap items-center justify-between gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {job?.company || "Company"}
                            </span>
                            <div className="flex items-center gap-1">
                              {job?.opportunityPriority && (
                                <span
                                  className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                                    job.opportunityPriority === "PRIORITY"
                                      ? "bg-amber-400/20 text-amber-300 border border-amber-400/40"
                                      : "bg-slate-800 text-slate-400"
                                  }`}
                                >
                                  {job.opportunityPriority}
                                </span>
                              )}
                              {job?.careerFit && (
                                <span className="rounded bg-cyan-950 text-cyan-300 px-1.5 py-0.5 text-[9px] font-semibold border border-cyan-800/60">
                                  {job.careerFit.replace("_RELEVANCE", "")}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Role Title */}
                          <h3 className="text-xs font-bold text-white line-clamp-2">
                            {job?.title || "Role Title"}
                          </h3>

                          {/* Location & Remote */}
                          <div className="text-[11px] text-slate-400 flex items-center justify-between">
                            <span>{job?.location || "India"}</span>
                            {job?.remoteType && (
                              <span className="text-[10px] text-slate-500">{job.remoteType}</span>
                            )}
                          </div>

                          {/* Follow-up Due Alert */}
                          {followUpDue && (
                            <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-2 py-1 flex items-center justify-between text-[11px] text-amber-300">
                              <span>⏰ Follow-up Due</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkFollowUp(app.id);
                                }}
                                className="text-[10px] font-bold underline hover:text-white"
                              >
                                Mark Done
                              </button>
                            </div>
                          )}

                          {/* Recruiter / Referral / Salary */}
                          {(app.recruiterName || app.referral || app.salaryOffered || app.salaryExpected) && (
                            <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 space-y-0.5">
                              {app.recruiterName && (
                                <div>👤 Recruiter: {app.recruiterName}</div>
                              )}
                              {app.referral && (
                                <div className="text-indigo-400 font-medium">✓ Internal Referral {app.referralName ? `(${app.referralName})` : ""}</div>
                              )}
                              {app.salaryOffered ? (
                                <div className="text-emerald-400 font-semibold">
                                  Offered: ₹{(app.salaryOffered / 100000).toFixed(1)}L PA
                                </div>
                              ) : app.salaryExpected ? (
                                <div>Expected: ₹{(app.salaryExpected / 100000).toFixed(1)}L PA</div>
                              ) : null}
                            </div>
                          )}

                          {/* Card Footer: Dates & Quick Action */}
                          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                            <span>
                              {app.appliedAt
                                ? `Applied ${new Date(app.appliedAt).toLocaleDateString()}`
                                : `Saved ${new Date(app.createdAt).toLocaleDateString()}`}
                            </span>

                            {/* Quick Advance Dropdown */}
                            <select
                              value={app.status}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                handleStatusChange(app.id, e.target.value as ApplicationStatus)
                              }
                              className="rounded border border-slate-700 bg-slate-800 text-[10px] text-slate-300 px-1 py-0.5 outline-none"
                            >
                              <option value="SAVED">Saved</option>
                              <option value="APPLIED">Applied</option>
                              <option value="SCREENING">Screening</option>
                              <option value="TECHNICAL">Technical</option>
                              <option value="FINAL">Final</option>
                              <option value="OFFER">Offer</option>
                              <option value="REJECTED">Reject</option>
                              <option value="WITHDRAWN">Withdraw</option>
                              <option value="IGNORED">Ignore</option>
                            </select>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TERMINAL / ARCHIVE VIEW (REJECTED, WITHDRAWN, IGNORED) */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TERMINAL_STATUSES.map((terminal) => {
            const terminalApps = filteredApplications.filter((a) => a.status === terminal.id);

            return (
              <div
                key={terminal.id}
                className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-4 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${terminal.color}`}>{terminal.title}</span>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-400">
                      {terminalApps.length}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 min-h-[160px]">
                  {terminalApps.length === 0 ? (
                    <div className="h-28 flex items-center justify-center text-xs text-slate-600 border border-dashed border-slate-800 rounded-xl">
                      No {terminal.title.toLowerCase()} applications
                    </div>
                  ) : (
                    terminalApps.map((app) => {
                      const job = jobsMap.get(app.jobId);
                      return (
                        <div
                          key={app.id}
                          onClick={() => setSelectedApplication(app)}
                          className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 cursor-pointer hover:border-slate-700 transition space-y-2"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-400 uppercase">
                              {job?.company || "Company"}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(app.updatedAt).toLocaleDateString()}
                            </span>
                          </div>

                          <h3 className="text-xs font-bold text-white line-clamp-1">
                            {job?.title || "Role Title"}
                          </h3>

                          {app.rejectionReason && (
                            <div className="text-[11px] text-red-300 italic">
                              Reason: {app.rejectionReason}
                            </div>
                          )}

                          {app.withdrawalReason && (
                            <div className="text-[11px] text-slate-400 italic">
                              Reason: {app.withdrawalReason}
                            </div>
                          )}

                          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px]">
                            <span className="text-slate-500">ID: {app.id.slice(0, 12)}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(app.id, "APPLIED");
                              }}
                              className="text-cyan-400 font-semibold hover:underline"
                            >
                              ↺ Reopen
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Application Detail Modal */}
      {selectedApplication && (
        <ApplicationDetailModal
          application={selectedApplication}
          job={jobsMap.get(selectedApplication.jobId)}
          onClose={() => setSelectedApplication(null)}
          onUpdate={(updated) => {
            setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
            setSelectedApplication(updated);
          }}
          onDelete={handleDeleteApplication}
        />
      )}
    </div>
  );
}
