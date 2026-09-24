"use client";

import { useEffect, useState } from "react";
import type { Job } from "@/types";

interface JobIgnoreModalProps {
  job: Job | null;
  onClose: () => void;
  onConfirmIgnore: (job: Job, reason: string) => void;
}

export const SUGGESTED_IGNORE_REASONS = [
  "Not relevant",
  "Location",
  "Salary",
  "Seniority",
  "Technology mismatch",
  "Already applied elsewhere",
  "Visa/work authorization",
  "Not interested",
  "Duplicate",
  "Other",
] as const;

export function JobIgnoreModal({
  job,
  onClose,
  onConfirmIgnore,
}: JobIgnoreModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>(SUGGESTED_IGNORE_REASONS[0]);
  const [customReason, setCustomReason] = useState("");

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (job) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [job, onClose]);

  if (!job) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const finalReason = selectedReason === "Other" && customReason.trim()
      ? customReason.trim()
      : selectedReason;
    if (job) {
      onConfirmIgnore(job, finalReason);
    }
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-rose-400 font-bold text-lg">✕</span>
            <h3 className="text-base font-bold text-white">Ignore Opportunity</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg text-sm"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <p className="text-xs font-semibold text-slate-300">
              {job.title}
            </p>
            <p className="text-[11px] text-slate-500">
              {job.company} • {job.location}
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Reason for ignoring:
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-rose-500 focus:outline-none"
            >
              {SUGGESTED_IGNORE_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {selectedReason === "Other" && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Specify reason:
              </label>
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter custom reason..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-rose-500 focus:outline-none"
              />
            </div>
          )}

          <p className="text-[11px] text-slate-500">
            Ignored jobs will not repeatedly appear in your daily queue or radar, but are preserved in CRM history.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-rose-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-rose-500 transition shadow-sm shadow-rose-900/50"
            >
              Confirm Ignore
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
