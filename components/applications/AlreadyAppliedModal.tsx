"use client";

import { useEffect } from "react";
import type { Application, Job } from "@/types";

interface AlreadyAppliedModalProps {
  job: Job | null;
  application: Application | null;
  onClose: () => void;
  onOpenApplication?: (app: Application) => void;
}

export function AlreadyAppliedModal({
  job,
  application,
  onClose,
  onOpenApplication,
}: AlreadyAppliedModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!job || !application) return null;

  const appliedDateStr = application.appliedAt
    ? new Date(application.appliedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Recently applied";

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-indigo-700 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-indigo-400 font-bold text-lg">ℹ️</span>
            <h3 className="text-base font-bold text-white">Already Applied</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg text-sm"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="rounded-xl border border-indigo-900/60 bg-indigo-950/30 p-3.5">
            <p className="text-xs font-bold text-white">{job.title}</p>
            <p className="text-[11px] text-indigo-300 font-medium">{job.company}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">📍 {job.location}</p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Application Status:</span>
              <span className="font-bold rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 text-[11px]">
                {application.status}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Applied Date:</span>
              <span className="font-semibold text-white">{appliedDateStr}</span>
            </div>
            {application.nextFollowUpAt && (
              <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Next Follow-up:</span>
                <span className="font-semibold text-amber-300">
                  {new Date(application.nextFollowUpAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-300">
            You have already recorded an application for this vacancy. Duplicate application submissions are prevented to preserve clean CRM pipeline metrics.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-700 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
            >
              Close
            </button>
            {onOpenApplication && (
              <button
                onClick={() => {
                  onClose();
                  onOpenApplication(application);
                }}
                className="rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 transition shadow-sm"
              >
                Open Application CRM
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
