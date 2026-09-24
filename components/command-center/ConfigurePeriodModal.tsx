"use client";

import { useEffect, useState } from "react";
import type { SearchPeriodSettings } from "@/types";

interface ConfigurePeriodModalProps {
  isOpen: boolean;
  settings: SearchPeriodSettings;
  onClose: () => void;
  onSave: (updated: SearchPeriodSettings) => void;
}

export function ConfigurePeriodModal({
  isOpen,
  settings,
  onClose,
  onSave,
}: ConfigurePeriodModalProps) {
  const [startDate, setStartDate] = useState(settings.searchStartDate);
  const [duration, setDuration] = useState(settings.durationDays);
  const [appsPerWeek, setAppsPerWeek] = useState(settings.applicationsPerWeekTarget);
  const [followUpsPerWeek, setFollowUpsPerWeek] = useState(settings.followUpsPerWeekTarget);
  const [inactiveDays, setInactiveDays] = useState(settings.inactiveThresholdDays);

  useEffect(() => {
    queueMicrotask(() => {
      setStartDate(settings.searchStartDate);
      setDuration(settings.durationDays);
      setAppsPerWeek(settings.applicationsPerWeekTarget);
      setFollowUpsPerWeek(settings.followUpsPerWeekTarget);
      setInactiveDays(settings.inactiveThresholdDays);
    });
  }, [settings]);

  if (!isOpen) return null;

  // Compute calculated end date
  const computeEndDate = (startStr: string, dur: number) => {
    try {
      const d = new Date(startStr + "T00:00:00.000Z");
      if (isNaN(d.getTime())) return startStr;
      const endD = new Date(d.getTime() + (Math.max(1, dur) - 1) * 24 * 60 * 60 * 1000);
      return endD.toISOString().slice(0, 10);
    } catch {
      return startStr;
    }
  };

  const calculatedEndDate = computeEndDate(startDate, duration);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const updated: SearchPeriodSettings = {
      searchStartDate: startDate,
      searchEndDate: calculatedEndDate,
      durationDays: Math.max(1, duration),
      applicationsPerDayTarget: Math.max(1, Math.round(appsPerWeek / 5)),
      applicationsPerWeekTarget: Math.max(1, appsPerWeek),
      followUpsPerWeekTarget: Math.max(1, followUpsPerWeek),
      inactiveThresholdDays: Math.max(1, inactiveDays),
    };

    onSave(updated);
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="configure-period-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-5">
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <h2
              id="configure-period-modal-title"
              className="text-lg font-bold text-white tracking-tight"
            >
              ⚙️ Configure 60-Day Campaign & Targets
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Personalized search period and user-configured pacing goals.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Start Date */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Campaign Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500">
              Preserved across page reloads. Defaults to when campaign first initialized.
            </p>
          </div>

          {/* Duration Days */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Duration (Days)</label>
              <input
                type="number"
                min={1}
                max={365}
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value, 10) || 60)}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Calculated End Date</label>
              <input
                type="text"
                readOnly
                value={calculatedEndDate}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-2 text-sm text-slate-400 font-mono"
              />
            </div>
          </div>

          {/* User-Configured Targets */}
          <div className="border-t border-slate-800 pt-3 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              User Activity Targets (Not Success Scores)
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Applications / Week
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={appsPerWeek}
                  onChange={(e) => setAppsPerWeek(parseInt(e.target.value, 10) || 10)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Follow-ups / Week
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={followUpsPerWeek}
                  onChange={(e) => setFollowUpsPerWeek(parseInt(e.target.value, 10) || 5)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Inactive Application Threshold */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Inactive Application Threshold</span>
                <span className="text-cyan-400 font-bold">{inactiveDays} Days</span>
              </div>
              <input
                type="range"
                min={3}
                max={30}
                value={inactiveDays}
                onChange={(e) => setInactiveDays(parseInt(e.target.value, 10) || 7)}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">
                Surfaces active applications that have had no updates in {inactiveDays} days.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-indigo-500 transition"
            >
              Save Campaign Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
