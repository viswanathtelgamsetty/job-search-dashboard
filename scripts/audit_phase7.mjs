// Phase 7 Live Audit and Top 30 Inspection Script

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

  // ==================================================
  // SECTION 32: LIVE AUDIT METRICS
  // ==================================================

  const indiaJobs = jobs.filter((j) => j.market === "INDIA" || j.isIndiaEligible);
  const hyderabadJobs = jobs.filter((j) => j.normalizedLocation === "HYDERABAD");
  const remoteIndiaJobs = jobs.filter(
    (j) => j.normalizedLocation === "REMOTE_INDIA" || (j.remoteType === "REMOTE" && j.isIndiaEligible)
  );

  const emeaJobs = jobs.filter((j) => j.market === "EMEA");
  const ukJobs = jobs.filter((j) => j.emeaCountry === "UK");
  const germanyJobs = jobs.filter((j) => j.emeaCountry === "GERMANY");
  const netherlandsJobs = jobs.filter((j) => j.emeaCountry === "NETHERLANDS");
  const uaeJobs = jobs.filter((j) => j.emeaCountry === "UAE");
  const saudiJobs = jobs.filter((j) => j.emeaCountry === "SAUDI_ARABIA");
  const otherEmeaJobs = jobs.filter(
    (j) => j.market === "EMEA" && !["UK", "GERMANY", "NETHERLANDS", "UAE", "SAUDI_ARABIA"].includes(j.emeaCountry || "")
  );

  const northAmericaJobs = jobs.filter((j) => j.market === "NORTH_AMERICA");
  const apacJobs = jobs.filter((j) => j.market === "APAC");
  const globalRemoteJobs = jobs.filter((j) => j.market === "GLOBAL_REMOTE");
  const unknownMarketJobs = jobs.filter((j) => j.market === "UNKNOWN");

  const intlTeamJobs = jobs.filter((j) => j.internationalExposure?.exposure === "INTERNATIONAL_TEAM");
  const intlCustomerJobs = jobs.filter((j) => j.internationalExposure?.exposure === "INTERNATIONAL_CUSTOMERS");
  const clientSiteTravelJobs = jobs.filter(
    (j) => j.internationalExposure?.exposure === "CLIENT_SITE_TRAVEL" || j.travel?.type === "CLIENT_SITE_TRAVEL"
  );
  const intlTravelJobs = jobs.filter(
    (j) => j.internationalExposure?.exposure === "INTERNATIONAL_TRAVEL" || j.travel?.type === "INTERNATIONAL_TRAVEL"
  );
  const relocationJobs = jobs.filter(
    (j) => j.internationalExposure?.exposure === "RELOCATION" || j.travel?.type === "RELOCATION"
  );

  const clientFacingJobs = jobs.filter((j) => j.clientFacing === "YES");
  const workAuthKnownJobs = jobs.filter((j) => j.workAuthorization && j.workAuthorization.authorization !== "UNKNOWN");
  const workAuthUnknownJobs = jobs.filter((j) => !j.workAuthorization || j.workAuthorization.authorization === "UNKNOWN");

  const highFitJobs = jobs.filter((j) => j.careerFit === "HIGH_RELEVANCE");
  const relevantFitJobs = jobs.filter((j) => j.careerFit === "RELEVANT");
  const possibleFitJobs = jobs.filter((j) => j.careerFit === "POSSIBLE");
  const lowFitJobs = jobs.filter((j) => j.careerFit === "LOW_RELEVANCE");

  const intlPriorityJobs = jobs.filter((j) => j.internationalOpportunity?.bucket === "INTERNATIONAL_PRIORITY");
  const intlActiveJobs = jobs.filter((j) => j.internationalOpportunity?.bucket === "INTERNATIONAL_ACTIVE");
  const intlWatchJobs = jobs.filter((j) => j.internationalOpportunity?.bucket === "INTERNATIONAL_WATCH");
  const notIntlJobs = jobs.filter((j) => j.internationalOpportunity?.bucket === "NOT_INTERNATIONAL");

  console.log("\n==================================================");
  console.log("PHASE 7 SECTION 32: LIVE AUDIT BREAKDOWN");
  console.log("==================================================");
  console.log(`Total raw jobs:                  ${rawJobsCount}`);
  console.log(`Total unique canonical jobs:     ${jobs.length}`);
  console.log("--------------------------------------------------");
  console.log(`India Total:                     ${indiaJobs.length}`);
  console.log(`  Hyderabad Hub:                 ${hyderabadJobs.length}`);
  console.log(`  Remote India:                  ${remoteIndiaJobs.length}`);
  console.log("--------------------------------------------------");
  console.log(`EMEA Total:                      ${emeaJobs.length}`);
  console.log(`  UK:                            ${ukJobs.length}`);
  console.log(`  Germany:                       ${germanyJobs.length}`);
  console.log(`  Netherlands:                   ${netherlandsJobs.length}`);
  console.log(`  UAE:                           ${uaeJobs.length}`);
  console.log(`  Saudi Arabia:                  ${saudiJobs.length}`);
  console.log(`  Other EMEA:                    ${otherEmeaJobs.length}`);
  console.log("--------------------------------------------------");
  console.log(`North America:                   ${northAmericaJobs.length}`);
  console.log(`APAC:                            ${apacJobs.length}`);
  console.log(`Global Remote:                   ${globalRemoteJobs.length}`);
  console.log(`Unknown Market:                  ${unknownMarketJobs.length}`);
  console.log("--------------------------------------------------");
  console.log(`International Team:              ${intlTeamJobs.length}`);
  console.log(`International Customers:         ${intlCustomerJobs.length}`);
  console.log(`Client-Site Travel:              ${clientSiteTravelJobs.length}`);
  console.log(`International Travel:            ${intlTravelJobs.length}`);
  console.log(`Relocation:                      ${relocationJobs.length}`);
  console.log("--------------------------------------------------");
  console.log(`Client-Facing Roles:             ${clientFacingJobs.length}`);
  console.log(`Work Auth Known:                 ${workAuthKnownJobs.length}`);
  console.log(`Work Auth Unknown:               ${workAuthUnknownJobs.length}`);
  console.log("--------------------------------------------------");
  console.log(`Career Fit HIGH_RELEVANCE:       ${highFitJobs.length}`);
  console.log(`Career Fit RELEVANT:             ${relevantFitJobs.length}`);
  console.log(`Career Fit POSSIBLE:             ${possibleFitJobs.length}`);
  console.log(`Career Fit LOW_RELEVANCE:        ${lowFitJobs.length}`);
  console.log("--------------------------------------------------");
  console.log(`INTERNATIONAL_PRIORITY:          ${intlPriorityJobs.length}`);
  console.log(`INTERNATIONAL_ACTIVE:            ${intlActiveJobs.length}`);
  console.log(`INTERNATIONAL_WATCH:             ${intlWatchJobs.length}`);
  console.log(`NOT_INTERNATIONAL:               ${notIntlJobs.length}`);
  console.log("==================================================");

  // ==================================================
  // SECTION 33: TOP 30 QUALITY AUDIT
  // ==================================================

  // Deterministic sorting based on Opportunity Priority + Career Fit + Freshness
  const fitOrder = { HIGH_RELEVANCE: 4, RELEVANT: 3, POSSIBLE: 2, LOW_RELEVANCE: 1 };
  const intlOrder = { INTERNATIONAL_PRIORITY: 4, INTERNATIONAL_ACTIVE: 3, INTERNATIONAL_WATCH: 2, NOT_INTERNATIONAL: 1 };

  const sortedJobs = [...jobs].sort((a, b) => {
    // 1. International priority bucket
    const ibA = intlOrder[a.internationalOpportunity?.bucket || "NOT_INTERNATIONAL"] || 0;
    const ibB = intlOrder[b.internationalOpportunity?.bucket || "NOT_INTERNATIONAL"] || 0;
    if (ibB !== ibA) return ibB - ibA;

    // 2. Career fit
    const cfA = fitOrder[a.careerFit] || 0;
    const cfB = fitOrder[b.careerFit] || 0;
    if (cfB !== cfA) return cfB - cfA;

    // 3. Score
    const scA = a.internationalOpportunity?.score || 0;
    const scB = b.internationalOpportunity?.score || 0;
    if (scB !== scA) return scB - scA;

    // 4. Recency
    return (new Date(b.postedAt || "").getTime() || 0) - (new Date(a.postedAt || "").getTime() || 0);
  });

  const top30 = sortedJobs.slice(0, 30);

  console.log("\n==================================================");
  console.log("PHASE 7 SECTION 33: TOP 30 OPPORTUNITY AUDIT");
  console.log("==================================================\n");

  top30.forEach((job, idx) => {
    const num = idx + 1;
    const whyFits =
      job.match?.whyThisFits?.slice(0, 2).join("; ") ||
      job.match?.reasons?.slice(0, 2).join("; ") ||
      "Senior role and technical alignment.";
    const gaps =
      job.match?.potentialGaps?.slice(0, 2).join("; ") ||
      job.dataQualityWarnings?.slice(0, 2).join("; ") ||
      "None identified.";

    const matchedTech =
      job.match?.breakdown?.technologyMatch?.details
        ?.filter((d) => d.matched)
        ?.map((d) => d.technology)
        ?.join(", ") ||
      job.actualJobTechnologies?.join(", ") ||
      "None";

    console.log(`--------------------------------------------------`);
    console.log(`[#${num}] ${job.title}`);
    console.log(`Company:                 ${job.company} (${job.source})`);
    console.log(`Location:                ${job.location} | Normalized: ${job.normalizedLocation}`);
    console.log(`Market:                  ${job.market}${job.emeaCountry ? ` (${job.emeaCountry})` : ""}`);
    console.log(`Opportunity Type:        ${job.opportunityType} (All: ${job.opportunityTypes?.join(", ") || "None"})`);
    console.log(`Career Fit:              ${job.careerFit} | Priority: ${job.opportunityPriority || "N/A"}`);
    console.log(`Role Family:             ${job.roleFamily} | Seniority: ${job.seniority}`);
    console.log(`Domains:                 Primary: ${job.domains?.join(", ") || "None"}`);
    console.log(`Matched Technologies:    ${matchedTech}`);
    console.log(`Client Facing:           ${job.clientFacing} (Evidence: "${job.clientFacingDetail?.evidence || "N/A"}")`);
    console.log(`International Exposure:  ${job.internationalExposure?.exposure} (Evidence: "${job.internationalExposure?.evidence || "N/A"}")`);
    console.log(`Travel:                  ${job.travel?.type} ${job.travel?.travelCategory || ""} (Evidence: "${job.travel?.evidence || "N/A"}")`);
    console.log(`Work Authorization:      ${job.workAuthorization?.authorization} (Evidence: "${job.workAuthorization?.evidence || "N/A"}")`);
    console.log(`Freshness:               ${job.freshness} (${job.postedDaysAgo !== undefined ? `${job.postedDaysAgo}d ago` : "unknown"})`);
    console.log(`Intl Bucket:             ${job.internationalOpportunity?.bucket} (Score: ${job.internationalOpportunity?.score})`);
    console.log(`Why It Fits:             ${whyFits}`);
    console.log(`Potential Gaps:          ${gaps}`);
  });

  console.log(`\n==================================================`);
  console.log(`AUDIT COMPLETE: Printed top ${top30.length} ranked opportunities.`);
  console.log(`==================================================\n`);
}

run().catch((err) => {
  console.error("Live audit script error:", err);
  process.exit(1);
});
