/**
 * Server-side in-memory job store.
 *
 * This module holds the current real job collection on the server process.
 * It is written by POST /api/jobs/sync and read by GET /api/jobs.
 *
 * Contract guarantees:
 *  - NEVER stores demo jobs (isDemo === true, id starts "demo-", company has "(Demo)")
 *  - Survives within a server process lifecycle (reset on cold restart → client re-syncs)
 *  - Safe to import in both API routes; module-level singleton per Node.js process
 */

import type { Job } from "@/types";

/** Strip any demo records from a collection. */
function stripDemoJobs(jobs: Job[]): Job[] {
  return jobs.filter(
    (j) =>
      j.isDemo !== true &&
      !j.id.startsWith("demo-") &&
      !j.company.includes("(Demo)")
  );
}

// Module-level store — one instance per server process.
let _jobs: Job[] = [];

/** Returns the currently stored real jobs. Never includes demo records. */
export function getServerJobs(): Job[] {
  return _jobs;
}

/**
 * Replaces the server job store with the provided collection.
 * Demo records are stripped before storage regardless of source.
 */
export function setServerJobs(jobs: Job[]): void {
  _jobs = stripDemoJobs(jobs);
}

/** Returns the count of currently stored real jobs. */
export function getServerJobCount(): number {
  return _jobs.length;
}
