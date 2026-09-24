// Script to run POST /api/jobs/sync and analyze actual technology matching
async function run() {
  console.log("Triggering POST http://localhost:3000/api/jobs/sync ...");
  const response = await fetch("http://localhost:3000/api/jobs/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });

  if (!response.ok) {
    console.error("Sync failed with status:", response.status, await response.text());
    process.exit(1);
  }

  const data = await response.json();
  const { metrics, providers, jobs } = data;

  console.log("\n=======================================================");
  console.log("SYNC METRICS");
  console.log("=======================================================");
  console.log(`Raw jobs: ${metrics.rawJobsCount}`);
  console.log(`Duplicates: ${metrics.duplicatesCount}`);
  console.log(`Final jobs: ${metrics.finalJobsCount}`);
  console.log("\nProviders:");
  for (const p of providers) {
    console.log(`- ${p.name}: ${p.jobsReturned} jobs (${p.success ? "SUCCESS" : "FAILED"}${p.error ? `: ${p.error}` : ""})`);
  }

  // 1. All Jobs audit listing
  console.log("\n=======================================================");
  console.log("ALL JOBS AUDIT LISTING (ACTUAL TECHS & MATCH TRACEABILITY)");
  console.log("=======================================================");
  for (let i = 0; i < jobs.length; i++) {
    const j = jobs[i];
    console.log(`\n[${i + 1}] Company: ${j.company}`);
    console.log(`Title: ${j.title}`);
    console.log(`Role Family: ${j.roleFamily}`);
    console.log(`Relevance: ${j.match?.relevanceBucket}`);
    console.log(`Actual Technologies: ${JSON.stringify(j.actualJobTechnologies || j.skills || [])}`);
    console.log(`Matched Target Technologies: ${JSON.stringify(j.matchedTargetTechnologies || [])}`);
    
    const evidenceList = (j.technologyMatchDetails || [])
      .filter((t) => t.matched)
      .map((t) => `${t.technology}: "${t.evidence}"`);
    console.log(`Evidence: ${evidenceList.length > 0 ? evidenceList.join("; ") : "None"}`);
  }

  // 2. Actual technology distribution
  const actualTechCounts = {};
  const matchedTargetCounts = {};
  const relevanceCounts = {
    HIGH_RELEVANCE: 0,
    RELEVANT: 0,
    POSSIBLE: 0,
    LOW_RELEVANCE: 0,
  };

  for (const j of jobs) {
    const actuals = j.actualJobTechnologies || j.skills || [];
    for (const t of actuals) {
      actualTechCounts[t] = (actualTechCounts[t] || 0) + 1;
    }
    const matched = j.matchedTargetTechnologies || [];
    for (const t of matched) {
      matchedTargetCounts[t] = (matchedTargetCounts[t] || 0) + 1;
    }
    const bucket = j.match?.relevanceBucket || "LOW_RELEVANCE";
    relevanceCounts[bucket] = (relevanceCounts[bucket] || 0) + 1;
  }

  console.log("\n=======================================================");
  console.log("ACTUAL TECHNOLOGY DISTRIBUTION (Top 25 Detected in Postings)");
  console.log("=======================================================");
  const sortedActual = Object.entries(actualTechCounts).sort((a, b) => b[1] - a[1]);
  for (const [tech, count] of sortedActual.slice(0, 25)) {
    console.log(`- ${tech}: ${count}`);
  }

  console.log("\n=======================================================");
  console.log("MATCHED TARGET TECHNOLOGY DISTRIBUTION");
  console.log("=======================================================");
  const sortedMatched = Object.entries(matchedTargetCounts).sort((a, b) => b[1] - a[1]);
  for (const [tech, count] of sortedMatched) {
    console.log(`- ${tech}: ${count}`);
  }

  console.log("\n=======================================================");
  console.log("RELEVANCE DISTRIBUTION");
  console.log("=======================================================");
  for (const [bucket, count] of Object.entries(relevanceCounts)) {
    console.log(`- ${bucket}: ${count}`);
  }

  // 3. Top 20 Jobs
  console.log("\n=======================================================");
  console.log("TOP 20 JOBS");
  console.log("=======================================================");
  const top20 = jobs.slice(0, 20);
  for (let i = 0; i < top20.length; i++) {
    const j = top20[i];
    console.log(`\n--- #${i + 1} ---`);
    console.log(`Company: ${j.company}`);
    console.log(`Title: ${j.title}`);
    console.log(`Location: ${j.location} (${j.normalizedLocation})`);
    console.log(`Role Family: ${j.roleFamily}`);
    console.log(`Relevance: ${j.match?.relevanceBucket} (Score: ${j.match?.overallScore || "N/A"})`);
    console.log(`Actual Technologies: ${(j.actualJobTechnologies || j.skills || []).join(", ") || "None specified"}`);
    console.log(`Matched Target Technologies: ${(j.matchedTargetTechnologies || []).join(", ") || "None"}`);
    console.log(`Travel: ${j.travel?.type} ${j.travel?.percentage ? `(${j.travel.percentage}%)` : ""} ${j.travel?.evidence ? `[Evidence: "${j.travel.evidence}"]` : ""}`);
    console.log(`Salary: ${j.salaryState} (INR Min: ${j.salaryLpaMin || "N/A"} LPA)`);
    console.log(`Freshness: ${j.freshness} (${j.postedDaysAgo !== undefined ? `${j.postedDaysAgo} days ago` : "N/A"})`);
    console.log(`Match Reasons:`);
    for (const r of j.match?.reasons || []) {
      console.log(`  ${r}`);
    }
    console.log(`Cautions:`);
    for (const c of j.match?.cautions || []) {
      console.log(`  ${c}`);
    }
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
