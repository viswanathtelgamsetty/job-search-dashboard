"use client";

import { useEffect, useState } from "react";
import type { Job, JobStatus } from "@/types";
import { getStoredJobs, updateJobStatusInStorage } from "@/lib/storage";

const COLUMNS: Array<{ id: JobStatus; title: string; color: string; border: string }> = [
  { id: "DISCOVERED", title: "Discovered", color: "text-slate-400", border: "border-slate-800" },
  { id: "SAVED", title: "Saved", color: "text-cyan-400", border: "border-cyan-800/80" },
  { id: "APPLIED", title: "Applied", color: "text-indigo-400", border: "border-indigo-800/80" },
  { id: "SCREENING", title: "Screening", color: "text-amber-400", border: "border-amber-800/80" },
  { id: "TECHNICAL", title: "Technical Round", color: "text-purple-400", border: "border-purple-800/80" },
  { id: "FINAL", title: "Final Stage", color: "text-rose-400", border: "border-rose-800/80" },
  { id: "OFFER", title: "Offers Received", color: "text-emerald-400", border: "border-emerald-700" },
  { id: "REJECTED", title: "Archived / Rejected", color: "text-slate-500", border: "border-slate-800" },
];

export default function ApplicationsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState("");
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    const stored = getStoredJobs();
    queueMicrotask(() => setJobs(stored));
  }, []);

  function handleMove(jobId: string, nextStatus: JobStatus) {
    const updated = updateJobStatusInStorage(jobId, nextStatus);
    setJobs(updated);
  }

  function handleSaveNotes(jobId: string) {
    const updated = updateJobStatusInStorage(jobId, undefined as unknown as JobStatus, noteText);
    setJobs(updated);
    setEditingNotesId(null);
  }

  const filteredJobs = jobs.filter((job) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      job.title.toLowerCase().includes(q) ||
      job.company.toLowerCase().includes(q) ||
      job.skills.some((s) => s.toLowerCase().includes(q))
    );
  });

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              Application Pipeline
            </h1>
            <span className="rounded-full bg-indigo-950 border border-indigo-800 px-2.5 py-0.5 text-xs font-semibold text-indigo-300">
              Kanban Board
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Track interview progression, client interactions, screening feedback, and offers.
          </p>
        </div>

        {/* Filter Input */}
        <div className="w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter pipeline by role or company..."
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Kanban Board Container (Horizontal Scrollable) */}
      <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-slate-800">
        {COLUMNS.map((col) => {
          const columnJobs = filteredJobs.filter((j) => j.status === col.id);

          return (
            <div
              key={col.id}
              className="flex flex-col w-80 shrink-0 rounded-2xl border border-slate-800/80 bg-slate-950/70 p-4 shadow-xl"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${col.color}`}>{col.title}</span>
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-300">
                    {columnJobs.length}
                  </span>
                </div>
              </div>

              {/* Cards List */}
              <div className="flex-1 space-y-3 min-h-[300px]">
                {columnJobs.map((job) => (
                  <div
                    key={job.id}
                    className={`rounded-xl border ${col.border} bg-slate-900/90 p-4 space-y-2.5 shadow-md hover:border-slate-600 transition`}
                  >
                    {/* Header: Title & Company */}
                    <div>
                      <h4 className="text-sm font-bold text-white line-clamp-2">
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-cyan-400 transition"
                        >
                          {job.title}
                        </a>
                      </h4>
                      <p className="text-xs text-slate-300 font-semibold mt-0.5">
                        {job.company}
                      </p>
                    </div>

                    {/* Metadata tags */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-300">
                        📍 {job.location}
                      </span>
                      {job.salaryDisclosed && job.salaryLpaMin && (
                        <span className="rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 font-medium">
                          💰 ₹{job.salaryLpaMin}L+
                        </span>
                      )}
                      {job.travel.type === "INTERNATIONAL" && (
                        <span className="rounded bg-indigo-950 text-indigo-300 border border-indigo-800/70 px-2 py-0.5 font-medium">
                          ✈️ Intl Travel
                        </span>
                      )}
                    </div>

                    {/* Notes Display / Edit */}
                    {job.notes && editingNotesId !== job.id && (
                      <div
                        onClick={() => {
                          setEditingNotesId(job.id);
                          setNoteText(job.notes || "");
                        }}
                        className="rounded-lg bg-slate-950 p-2 text-[11px] text-slate-300 cursor-pointer hover:border hover:border-slate-700 transition"
                      >
                        <p className="line-clamp-3">📝 {job.notes}</p>
                      </div>
                    )}

                    {editingNotesId === job.id ? (
                      <div className="space-y-1.5">
                        <textarea
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="Interview notes, recruiter contacts..."
                          className="w-full rounded border border-slate-700 bg-slate-950 p-1.5 text-xs text-white outline-none"
                          rows={3}
                        />
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => setEditingNotesId(null)}
                            className="px-2 py-0.5 text-[10px] text-slate-400 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveNotes(job.id)}
                            className="rounded bg-cyan-600 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-cyan-500"
                          >
                            Save Note
                          </button>
                        </div>
                      </div>
                    ) : (
                      !job.notes && (
                        <button
                          onClick={() => {
                            setEditingNotesId(job.id);
                            setNoteText("");
                          }}
                          className="text-[10px] text-slate-500 hover:text-slate-300"
                        >
                          + Add interview note
                        </button>
                      )
                    )}

                    {/* Stage Selector Action */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <select
                        value={job.status}
                        onChange={(e) => handleMove(job.id, e.target.value as JobStatus)}
                        aria-label="Change job status"
                        className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-slate-300 outline-none focus:border-cyan-500"
                      >
                        {COLUMNS.map((c) => (
                          <option key={c.id} value={c.id}>
                            Move: {c.title}
                          </option>
                        ))}
                      </select>

                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-cyan-400 hover:underline"
                      >
                        Open ↗
                      </a>
                    </div>
                  </div>
                ))}

                {columnJobs.length === 0 && (
                  <div className="flex items-center justify-center h-28 rounded-xl border border-dashed border-slate-800 text-slate-600 text-xs">
                    No jobs
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
