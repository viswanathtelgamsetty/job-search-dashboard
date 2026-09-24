// Script to run POST /api/jobs/sync and analyze career domain fit matching
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

  // Distribution counts
  const careerFitCounts = {
    HIGH_RELEVANCE: 0,
    RELEVANT: 0,
    POSSIBLE: 0,
    LOW_RELEVANCE: 0,
  };

  const domainCounts = {};

  for (const j of jobs) {
    const fit = j.match?.careerFit || j.careerFit || j.match?.relevanceBucket || "LOW_RELEVANCE";
    careerFitCounts[fit] = (careerFitCounts[fit] || 0) + 1;

    const domains = j.domains || (j.domainMatches || []).map((d) => d.domain) || [];
    for (const d of domains) {
      domainCounts[d] = (domainCounts[d] || 0) + 1;
    }
  }

  console.log("\n=======================================================");
  console.log("CAREER FIT DISTRIBUTION");
  console.log("=======================================================");
  console.log(`Total jobs: ${jobs.length}`);
  console.log(`HIGH_RELEVANCE: ${careerFitCounts.HIGH_RELEVANCE}`);
  console.log(`RELEVANT: ${careerFitCounts.RELEVANT}`);
  console.log(`POSSIBLE: ${careerFitCounts.POSSIBLE}`);
  console.log(`LOW_RELEVANCE: ${careerFitCounts.LOW_RELEVANCE}`);

  console.log("\n=======================================================");
  console.log("CAREER DOMAIN DISTRIBUTION");
  console.log("=======================================================");
  const sortedDomains = Object.entries(domainCounts).sort((a, b) => b[1] - a[1]);
  for (const [dom, count] of sortedDomains) {
    console.log(`- ${dom}: ${count}`);
  }

  // Top 20 Jobs formatted compactly
  console.log("\n=======================================================");
  console.log("TOP 20 JOBS");
  console.log("=======================================================");
  const top20 = jobs.slice(0, 20);
  for (let i = 0; i < top20.length; i++) {
    const j = top20[i];
    const match = j.match || {};
    const careerFit = match.careerFit || j.careerFit || match.relevanceBucket || "UNKNOWN";
    const domains = (j.domains || (j.domainMatches || []).map((d) => d.domain) || []).join(", ");
    const actualTechs = (j.actualJobTechnologies || j.skills || []).join(", ") || "None specified";
    const matchedTechs = (j.matchedTargetTechnologies || []).join(", ") || "None";
    const travel = `${j.travel?.type || "NO_TRAVEL_MENTIONED"}${j.travel?.percentage ? ` (${j.travel.percentage}%)` : ""}`;
    const freshness = `${j.freshness || "UNKNOWN"}${j.postedDaysAgo !== undefined ? ` (${j.postedDaysAgo}d)` : ""}`;
    const whyFits = match.whyThisFits || match.reasons || [];
    const gaps = match.potentialGaps || match.cautions || [];

    console.log(`\n[${i + 1}] Company: ${j.company} | Title: ${j.title}`);
    console.log(`    Location: ${j.location} | Career Fit: ${careerFit} | Freshness: ${freshness}`);
    console.log(`    Role Family: ${j.roleFamily} | Domains: ${domains}`);
    console.log(`    Actual Techs: ${actualTechs}`);
    console.log(`    Matched Techs: ${matchedTechs}`);
    console.log(`    Travel: ${travel}`);
    console.log(`    Why This Fits:`);
    for (const w of whyFits) console.log(`      ${w}`);
    console.log(`    Potential Gaps:`);
    for (const g of gaps) console.log(`      ${g}`);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
