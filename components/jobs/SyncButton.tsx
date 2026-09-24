"use client";

import { useState } from "react";
import type { Job } from "@/types";
import { setLastSyncTime } from "@/lib/storage";

interface SyncButtonProps {
  onSyncComplete: (newJobs: Job[]) => void;
  existingJobs: Job[];
}

export function SyncButton({ onSyncComplete, existingJobs }: SyncButtonProps) {
  const [syncing, setSyncing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleSync() {
    setSyncing(true);
    setFeedback("Connecting to permitted job APIs & career boards...");

    try {
      const res = await fetch("/api/jobs/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ existingJobs }),
      });

      if (!res.ok) {
        throw new Error(`Sync failed with HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.success && Array.isArray(data.jobs)) {
        const now = new Date().toISOString();
        setLastSyncTime(now);
        onSyncComplete(data.jobs);
        const count = data.newJobsCount || 0;
        setFeedback(
          count > 0
            ? `Discovered ${count} new active opportunities!`
            : "Radar updated: All active feeds synchronized."
        );
      } else {
        setFeedback("Feeds synchronized successfully.");
      }
    } catch (err: unknown) {
      console.error("Sync error:", err);
      setFeedback("Sync error. Please check your network connection.");
    } finally {
      setSyncing(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {feedback && (
        <span className="hidden sm:inline text-xs font-medium text-cyan-300 animate-fade-in bg-cyan-950/80 border border-cyan-800/80 px-2.5 py-1 rounded-lg">
          {feedback}
        </span>
      )}
      <button
        onClick={handleSync}
        disabled={syncing}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-50 transition"
      >
        <span className={syncing ? "animate-spin" : ""}>🔄</span>
        <span>{syncing ? "Scanning Market..." : "Scan Market Now"}</span>
      </button>
    </div>
  );
}
