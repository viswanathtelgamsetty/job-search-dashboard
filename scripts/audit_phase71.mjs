// Phase 7.1 Live Ingestion and Top 30 Precision Ranking Audit Script

import { sortMarketRadarJobs } from "../lib/marketRadar.ts";

async function run() {
  console.log("==================================================");
  console.log("TRIGGERING LIVE INGESTION SYNC VIA API...");
  console.log("==================================================");

  const res = await fetch("http://localhost:3000/api/jobs/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    console.error("Sync API failed with status:", res.status, await res.text());
    process.exit(1);
  }

  const data = await res.json();
  const jobs = data.jobs || [];
  const rawJobsCount = data.totalDiscovered || jobs.length;

  console.log(`\nSync successful.`);
  console.log(`Total raw jobs fetched: ${rawJobsCount}`);
  console.log(`Total unique canonical jobs: ${jobs.length}`);

  // Sort jobs using Market Radar Relevance (Section 16 Priority Ranking)
  const sortedJobs = sortMarketRadarJobs(jobs, "relevance");
  const top30 = sortedJobs.slice(0, 30);

  console.log("\n==================================================");
  console.log("PHASE 7.1 TOP 30 LIVE AUDIT");
  console.log("==================================================\n");

  top30.forEach((job, idx) => {
    const num = idx + 1;
    const whyFits =
      job.match?.whyThisFits?.slice(0, 3).join(" | ") ||
      job.match?.reasons?.slice(0, 3).join(" | ") ||
      "Technical role alignment.";
    const gaps =
      job.match?.potentialGaps?.slice(0, 3).join(" | ") ||
      "None identified.";

    const matchedPrimaryTech =
      job.primaryTechnologiesMatched?.join(", ") ||
      job.match?.primaryTechnologiesMatched?.join(", ") ||
      "None";

    console.log(`--------------------------------------------------`);
    console.log(`[#${num}] ${job.title}`);
    console.log(`Company:                      ${job.company} (${job.source})`);
    console.log(`Location:                     ${job.location} | Normalized: ${job.normalizedLocation}`);
    console.log(`Market:                       ${job.market}${job.emeaCountry ? ` (${job.emeaCountry})` : ""}`);
    console.log(`Regions:                      ${job.regions?.join(", ") || "None specified"}`);
    console.log(`Opportunity Type:             ${job.opportunityType} (All: ${job.opportunityTypes?.join(", ") || "None"})`);
    console.log(`Career Fit:                   ${job.careerFit} | Priority: ${job.opportunityPriority || "N/A"}`);
    console.log(`Role Tier:                    ${job.roleTier || job.match?.roleTier || "N/A"}`);
    console.log(`Role Family:                  ${job.roleFamily} | Seniority: ${job.seniority}`);
    console.log(`Primary Domains:              ${job.domains?.join(", ") || "None"}`);
    console.log(`Matched Primary Technologies: ${matchedPrimaryTech}`);
    console.log(`Client Facing:                ${job.clientFacing}`);
    console.log(`International Exposure:       ${job.internationalExposure?.exposure || "NONE"}`);
    console.log(`Travel:                       ${job.travel?.type || "NONE"} (${job.travel?.percentage || 0}%)`);
    console.log(`Work Authorization:           ${job.workAuthorization?.authorization || "NOT_MENTIONED"}`);
    console.log(`Freshness:                    ${job.freshness} (${job.postedDaysAgo !== undefined ? `${job.postedDaysAgo}d ago` : "unknown"})`);
    console.log(`Why Fits:                     ${whyFits}`);
    console.log(`Potential Gaps:               ${gaps}`);
  });

  console.log(`\n==================================================`);
  console.log(`PHASE 7.1 AUDIT COMPLETE: Printed top ${top30.length} ranked opportunities.`);
  console.log(`==================================================\n`);
}

run().catch((err) => {
  console.error("Live audit script error:", err);
  process.exit(1);
});
