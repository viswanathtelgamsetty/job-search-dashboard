/**
 * API Job Contract Regression Tests
 *
 * Verifies the persistence flow:
 *   Initial: GET /api/jobs => []
 *   After sync with mocked real provider: POST /api/jobs/sync => N real jobs
 *   Then: GET /api/jobs => same N real jobs
 *   And: GET /api/jobs contains 0 demo jobs
 *
 * These tests exercise the server-side module directly (no HTTP needed)
 * since the test runner cannot start a Next.js server.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { getServerJobs, setServerJobs, getServerJobCount } from "../lib/serverJobStore.ts";
import type { Job } from "../types/index.ts";

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function makeRealJob(id: string, title = "Senior Frontend Engineer"): Partial<Job> {
  return {
    id,
    title,
    company: "Accenture",
    location: "Hyderabad, India",
    remoteType: "HYBRID",
    skills: ["React", "TypeScript"],
    isDemo: false,
    status: "DISCOVERED",
    travel: { type: "UNKNOWN", percentage: 0, destinations: [], evidence: "", notes: "" },
    description: "Senior frontend role.",
  };
}

function makeDemoJob(id = "demo-job-001"): Partial<Job> {
  return {
    id,
    title: "Demo Technical Lead",
    company: "EPAM Systems (Demo)",
    location: "Hyderabad, India",
    remoteType: "HYBRID",
    skills: ["React"],
    isDemo: true,
    status: "DISCOVERED",
    travel: { type: "UNKNOWN", percentage: 0, destinations: [], evidence: "", notes: "" },
    description: "Demo job.",
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Reset store before each test group by clearing explicitly
// ──────────────────────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────────────────────
// 1. Initial state
// ──────────────────────────────────────────────────────────────────────────────

test("API contract: serverJobStore starts empty (simulates GET before first sync)", () => {
  // The store module is fresh on first import — but since Node caches modules
  // across tests, we reset it explicitly.
  setServerJobs([]);
  const jobs = getServerJobs();
  assert.equal(jobs.length, 0, "GET before sync must return 0 jobs");
  assert.deepEqual(jobs, [], "GET before sync must return empty array");
});

test("API contract: getServerJobCount returns 0 before any sync", () => {
  setServerJobs([]);
  assert.equal(getServerJobCount(), 0);
});

// ──────────────────────────────────────────────────────────────────────────────
// 2. After sync with real jobs
// ──────────────────────────────────────────────────────────────────────────────

test("API contract: setServerJobs (simulates POST /sync) persists real jobs", () => {
  setServerJobs([]);
  const syncedJobs = [
    makeRealJob("real-001", "Frontend Architect"),
    makeRealJob("real-002", "Solutions Architect"),
    makeRealJob("real-003", "Senior React Engineer"),
  ] as Job[];

  // Simulate what POST /api/jobs/sync does after runIngestion
  setServerJobs(syncedJobs);

  const stored = getServerJobs();
  assert.equal(stored.length, 3, "GET after sync must return 3 real jobs");
  assert.equal(getServerJobCount(), 3);
});

test("API contract: GET after sync returns same job ids as sync result", () => {
  const syncedJobs = [
    makeRealJob("real-001"),
    makeRealJob("real-002"),
    makeRealJob("real-003"),
  ] as Job[];
  setServerJobs(syncedJobs);

  const stored = getServerJobs();
  const storedIds = stored.map((j) => j.id).sort();
  const syncedIds = syncedJobs.map((j) => j.id).sort();
  assert.deepEqual(storedIds, syncedIds, "GET after sync must return the same job ids");
});

// ──────────────────────────────────────────────────────────────────────────────
// 3. Demo job exclusion — never in GET response
// ──────────────────────────────────────────────────────────────────────────────

test("API contract: GET contains 0 demo jobs after sync with only real jobs", () => {
  const syncedJobs = [
    makeRealJob("real-001"),
    makeRealJob("real-002"),
  ] as Job[];
  setServerJobs(syncedJobs);

  const stored = getServerJobs();
  const demoCount = stored.filter(
    (j) => j.isDemo === true || j.id.startsWith("demo-") || j.company.includes("(Demo)")
  ).length;
  assert.equal(demoCount, 0, "GET response must contain 0 demo jobs");
});

test("API contract: setServerJobs strips demo records before storing", () => {
  // Simulate a hypothetical bug where demo jobs slip into sync result
  const mixedJobs = [
    makeDemoJob("demo-job-001"),
    makeRealJob("real-001"),
    makeDemoJob("demo-job-002"),
    makeRealJob("real-002"),
  ] as Job[];

  setServerJobs(mixedJobs);

  const stored = getServerJobs();
  // Only real jobs should be stored
  assert.equal(stored.length, 2, "Only 2 real jobs should be stored");
  assert.ok(
    stored.every((j) => j.isDemo !== true),
    "No stored job may have isDemo=true"
  );
  assert.ok(
    stored.every((j) => !j.id.startsWith("demo-")),
    "No stored job id may start with 'demo-'"
  );
  assert.ok(
    stored.every((j) => !j.company.includes("(Demo)")),
    "No stored job company may contain '(Demo)'"
  );
});

test("API contract: GET after sync with all-demo input returns 0 jobs", () => {
  const onlyDemos = [
    makeDemoJob("demo-job-001"),
    makeDemoJob("demo-job-002"),
    makeDemoJob("demo-job-003"),
  ] as Job[];
  setServerJobs(onlyDemos);

  const stored = getServerJobs();
  assert.equal(stored.length, 0, "All-demo sync must result in 0 stored jobs");
  assert.equal(getServerJobCount(), 0);
});

// ──────────────────────────────────────────────────────────────────────────────
// 4. Persistence flow — full round-trip contract
// ──────────────────────────────────────────────────────────────────────────────

test("API contract: full persistence flow — empty → sync → read", () => {
  // Step 1: Initial state (simulates GET before first sync)
  setServerJobs([]);
  assert.equal(getServerJobs().length, 0, "Step 1: GET before sync must return []");

  // Step 2: Sync with real provider results (simulates POST /api/jobs/sync)
  const providerResults = [
    makeRealJob("gh-001", "Frontend Architect"),
    makeRealJob("gh-002", "Solutions Architect"),
    makeRealJob("remotive-001", "Senior React Developer"),
    makeRealJob("himalayas-3d2f8a1c", "Technical Lead - Frontend"),
  ] as Job[];
  setServerJobs(providerResults);
  assert.equal(getServerJobs().length, 4, "Step 2: POST sync stores 4 real jobs");

  // Step 3: Read after sync (simulates GET /api/jobs after sync)
  const getResult = getServerJobs();
  assert.equal(getResult.length, 4, "Step 3: GET after sync returns same 4 jobs");

  // Step 4: Demo count is always 0
  const demoCount = getResult.filter(
    (j) => j.isDemo === true || j.id.startsWith("demo-")
  ).length;
  assert.equal(demoCount, 0, "Step 4: GET contains 0 demo jobs");
});

test("API contract: second sync replaces store with new results (no stale data)", () => {
  // First sync
  setServerJobs([makeRealJob("old-001"), makeRealJob("old-002")] as Job[]);
  assert.equal(getServerJobCount(), 2);

  // Second sync with different jobs
  setServerJobs([
    makeRealJob("new-001"),
    makeRealJob("new-002"),
    makeRealJob("new-003"),
  ] as Job[]);

  const stored = getServerJobs();
  assert.equal(stored.length, 3, "Second sync replaces the store");
  assert.ok(stored.every((j) => j.id.startsWith("new-")), "All stored jobs are from second sync");
  assert.ok(!stored.some((j) => j.id.startsWith("old-")), "No stale jobs from first sync");
});

// ──────────────────────────────────────────────────────────────────────────────
// 5. Metrics contract — counts based on real jobs only
// ──────────────────────────────────────────────────────────────────────────────

test("API contract: totalDiscovered is based on real jobs count", () => {
  const realJobs = [
    makeRealJob("real-001"),
    makeRealJob("real-002"),
    makeRealJob("real-003"),
  ] as Job[];
  setServerJobs(realJobs);

  // totalDiscovered = count of what providers returned (real only)
  const totalDiscovered = getServerJobCount();
  assert.equal(totalDiscovered, 3, "totalDiscovered must equal real job count");
});

test("API contract: GET response contains no job with isDemo=true", () => {
  const jobs = [
    makeRealJob("real-001"),
    makeRealJob("real-002"),
  ] as Job[];
  setServerJobs(jobs);

  const stored = getServerJobs();
  assert.ok(
    stored.every((j) => j.isDemo !== true),
    "Every job in GET response must have isDemo !== true"
  );
  assert.ok(
    stored.every((j) => j.isDemo === false),
    "Every job in GET response must have isDemo === false"
  );
});
