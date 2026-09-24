"use client";

import { useState } from "react";
import type { Application, Job } from "@/types";
import { categorizeFollowUp } from "@/lib/applicationStore";

interface FollowUpsSectionProps {
  applications: Application[];
  jobsMap: Map<string, Job>;
  onMarkComplete: (appId: string) => void;
  onReschedule: (appId: string, newDateIso: string, note?: string) => void;
  onOpenApplication: (app: Application) => void;
}

export function FollowUpsSection({
  applications,
  jobsMap,
  onMarkComplete,
  onReschedule,
  onOpenApplication,
}: FollowUpsSectionProps) {
  const [filter, setFilter] = useState<"ALL" | "OVERDUE" | "DUE_TODAY" | "UPCOMING">("ALL");
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newNote, setNewNote] = useState("");

  const activeAppsWithFollowUp = applications.filter((app) => {
    const cat = categorizeFollowUp(app);
    return cat !== "NONE";
  });

  const overdue = activeAppsWithFollowUp.filter((a) => categorizeFollowUp(a) === "OVERDUE");
  const dueToday = activeAppsWithFollowUp.filter((a) => categorizeFollowUp(a) === "DUE_TODAY");
  const upcoming = activeAppsWithFollowUp.filter((a) => categorizeFollowUp(a) === "UPCOMING");

  const filtered =
    filter === "OVERDUE"
      ? overdue
      : filter === "DUE_TODAY"
      ? dueToday
      : filter === "UPCOMING"
      ? upcoming
      : activeAppsWithFollowUp;

  function handleStartReschedule(app: Application) {
    setReschedulingId(app.id);
    const existingDate = (app.nextFollowUpAt || app.followUpDate || "").slice(0, 10);
    setNewDate(existingDate || new Date().toISOString().slice(0, 10));
    setNewNote(app.followUpNote || "");
  }

  function handleSaveReschedule(appId: string) {
    if (!newDate) return;
    onReschedule(appId, `${newDate}T09:00:00.000Z`, newNote.trim() || undefined);
    setReschedulingId(null);
  }

  if (activeAppsWithFollowUp.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-center text-slate-400">
        <p className="text-xs font-semibold text-slate-300">
          No follow-ups currently scheduled.
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Schedule follow-ups on your active applications to stay on recruiters&apos; radar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
            <span>📅</span> Follow-Up Management ({activeAppsWithFollowUp.length})
          </h3>
          <p className="text-xs text-slate-400">
            Keep touchpoints warm. Reschedule, update follow-up notes, or mark follow-ups complete.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              filter === "ALL" ? "bg-slate-800 text-white font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            All ({activeAppsWithFollowUp.length})
          </button>
          <button
            onClick={() => setFilter("OVERDUE")}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              filter === "OVERDUE"
                ? "bg-rose-950 text-rose-300 font-bold border border-rose-800"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Overdue ({overdue.length})
          </button>
          <button
            onClick={() => setFilter("DUE_TODAY")}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              filter === "DUE_TODAY"
                ? "bg-indigo-950 text-indigo-300 font-bold border border-indigo-800"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Due Today ({dueToday.length})
          </button>
          <button
            onClick={() => setFilter("UPCOMING")}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              filter === "UPCOMING"
                ? "bg-slate-800 text-cyan-300 font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Upcoming ({upcoming.length})
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((app) => {
          const job = jobsMap.get(app.jobId);
          const cat = categorizeFollowUp(app);

          const catBadge = {
            OVERDUE: "bg-rose-500/20 text-rose-300 border-rose-500/50 font-bold animate-pulse",
            DUE_TODAY: "bg-indigo-500/20 text-indigo-300 border-indigo-500/50 font-bold",
            UPCOMING: "bg-slate-800 text-slate-300 border-slate-700",
            NONE: "bg-slate-800 text-slate-400",
          }[cat];

          const dateStr = (app.nextFollowUpAt || app.followUpDate || "").slice(0, 10);
          const isEditing = reschedulingId === app.id;

          return (
            <div
              key={app.id}
              className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4
                    onClick={() => onOpenApplication(app)}
                    className="text-sm font-bold text-white hover:text-cyan-300 transition cursor-pointer"
                  >
                    {job?.title || "Application"}
                  </h4>
                  <p className="text-xs text-slate-400">
                    <strong className="text-slate-200">{job?.company || app.source || "Target Company"}</strong> •
                    Stage: <span className="text-indigo-300 font-semibold">{app.status}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`rounded-lg border px-2.5 py-0.5 text-[11px] ${catBadge}`}>
                    {cat === "OVERDUE" && "⚠️ OVERDUE"}
                    {cat === "DUE_TODAY" && "⚡ DUE TODAY"}
                    {cat === "UPCOMING" && "🗓️ UPCOMING"}
                  </span>
                  <span className="text-xs font-semibold text-slate-300">
                    {dateStr}
                  </span>
                </div>
              </div>

              {app.followUpNote && (
                <p className="text-xs text-slate-300 bg-slate-950/60 rounded-lg p-2.5 border border-slate-800/80">
                  💬 <strong className="text-slate-400">Follow-up Note:</strong> {app.followUpNote}
                </p>
              )}

              {/* Inline Reschedule Form */}
              {isEditing ? (
                <div className="rounded-xl border border-indigo-800/60 bg-indigo-950/20 p-3 space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Optional follow-up note..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-white"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setReschedulingId(null)}
                      className="rounded-lg border border-slate-700 px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveReschedule(app.id)}
                      className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-bold text-white hover:bg-indigo-500"
                    >
                      Save Reschedule
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/60">
                  <button
                    onClick={() => onMarkComplete(app.id)}
                    className="rounded-lg border border-emerald-700/60 bg-emerald-950/30 px-3 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/50 transition cursor-pointer"
                  >
                    ✓ Mark Complete
                  </button>

                  <button
                    onClick={() => handleStartReschedule(app)}
                    className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
                  >
                    🗓️ Reschedule
                  </button>

                  <button
                    onClick={() => onOpenApplication(app)}
                    className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
                  >
                    📋 Open Application
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
