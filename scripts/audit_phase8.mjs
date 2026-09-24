// scripts/audit_phase8.mjs
async function runAudit() {
  console.log("Triggering live job sync via /api/jobs/sync...");
  const syncRes = await fetch("http://localhost:3000/api/jobs/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  const syncData = await syncRes.json();
  console.log("Sync response status:", syncRes.status);
  console.log("Provider Statuses:", syncData.providers);
  console.log("Metrics returned:", syncData.metrics);

  const jobs = (syncData.jobs && syncData.jobs.length > 0) ? syncData.jobs : [];

  console.log(`\nAuditing ${jobs.length} total jobs in database...`);

  // 1. Providers breakdown
  const rawByProvider = {};
  for (const j of jobs) {
    const src = j.source || "Unknown";
    rawByProvider[src] = (rawByProvider[src] || 0) + 1;
  }

  // 2. Metrics counters
  let indiaJobs = 0;
  let hydJobs = 0;
  let remoteIndia = 0;
  let globalRemote = 0;
  let emeaJobs = 0;
  let naJobs = 0;
  let apacJobs = 0;
  let indiaToEmea = 0;
  let indiaToUs = 0;
  let intlTravel = 0;
  let clientSiteTravel = 0;
  let relocation = 0;
  let knownWorkAuth = 0;
  let unknownWorkAuth = 0;

  const recCounts = { APPLY_NOW: 0, REVIEW: 0, WATCH: 0, SKIP: 0 };
  const fitCounts = { HIGH_RELEVANCE: 0, RELEVANT: 0, POSSIBLE: 0, LOW_RELEVANCE: 0 };

  for (const j of jobs) {
    const market = j.market || "UNKNOWN";
    const loc = (j.location || "").toLowerCase();
    const remote = j.remoteType || "ONSITE";

    if (market === "INDIA" || loc.includes("india")) {
      indiaJobs++;
      if (loc.includes("hyderabad")) hydJobs++;
      if (remote === "REMOTE" || loc.includes("remote")) remoteIndia++;
    } else if (market === "EMEA") {
      emeaJobs++;
    } else if (market === "NORTH_AMERICA") {
      naJobs++;
    } else if (market === "APAC") {
      apacJobs++;
    } else if (market === "GLOBAL_REMOTE" || loc.includes("worldwide") || loc.includes("global remote")) {
      globalRemote++;
    }

    if (j.isIndiaToEmea) indiaToEmea++;
    if (j.customerRegion === "US" || j.customerRegion === "NORTH_AMERICA" || (j.isIndiaEligible && /us|usa|united states/i.test(j.customerRegion || ""))) {
      indiaToUs++;
    }

    const tType = j.travel?.type || j.travelType;
    if (tType === "INTERNATIONAL_TRAVEL") intlTravel++;
    if (tType === "CLIENT_SITE_TRAVEL") clientSiteTravel++;
    if (tType === "RELOCATION") relocation++;

    const auth = j.workAuthorization?.authorization || "UNKNOWN";
    if (auth && auth !== "UNKNOWN") knownWorkAuth++;
    else unknownWorkAuth++;

    const rec = j.applicationRecommendation || j.match?.applicationRecommendation || "WATCH";
    if (recCounts[rec] !== undefined) recCounts[rec]++;
    else recCounts[rec] = 1;

    const cf = j.careerFit || j.match?.careerFit || "POSSIBLE";
    if (fitCounts[cf] !== undefined) fitCounts[cf]++;
    else fitCounts[cf] = 1;
  }

  console.log("\n==================================================");
  console.log("PHASE 8 LIVE SYNC METRICS SUMMARY");
  console.log("==================================================");
  console.log("Total unique jobs in DB:", jobs.length);
  console.log("Raw jobs by provider:", rawByProvider);
  console.log("Location Breakdown:");
  console.log(`- India Jobs: ${indiaJobs}`);
  console.log(`- Hyderabad Jobs: ${hydJobs}`);
  console.log(`- Remote India Jobs: ${remoteIndia}`);
  console.log(`- Global Remote Jobs: ${globalRemote}`);
  console.log(`- EMEA Jobs: ${emeaJobs}`);
  console.log(`- North America Jobs: ${naJobs}`);
  console.log(`- APAC Jobs: ${apacJobs}`);
  console.log("International & Travel Opportunities:");
  console.log(`- India -> EMEA Opportunities: ${indiaToEmea}`);
  console.log(`- India -> US Opportunities: ${indiaToUs}`);
  console.log(`- International Travel: ${intlTravel}`);
  console.log(`- Client-Site Travel: ${clientSiteTravel}`);
  console.log(`- Relocation: ${relocation}`);
  console.log("Work Authorization:");
  console.log(`- Known Work Auth: ${knownWorkAuth}`);
  console.log(`- Unknown Work Auth: ${unknownWorkAuth}`);
  console.log("Application Recommendations:");
  console.log(`- APPLY_NOW: ${recCounts.APPLY_NOW}`);
  console.log(`- REVIEW:    ${recCounts.REVIEW}`);
  console.log(`- WATCH:     ${recCounts.WATCH}`);
  console.log(`- SKIP:      ${recCounts.SKIP}`);
  console.log("Career Fit:");
  console.log(`- HIGH_RELEVANCE: ${fitCounts.HIGH_RELEVANCE}`);
  console.log(`- RELEVANT:       ${fitCounts.RELEVANT}`);
  console.log(`- POSSIBLE:       ${fitCounts.POSSIBLE}`);
  console.log(`- LOW_RELEVANCE:  ${fitCounts.LOW_RELEVANCE}`);
  console.log("==================================================\n");

  // Deterministic sorting:
  // 1. Career Fit
  // 2. Application Recommendation
  // 3. Role Tier
  // 4. Overall Score
  const fitOrder = { HIGH_RELEVANCE: 4, RELEVANT: 3, POSSIBLE: 2, LOW_RELEVANCE: 1 };
  const recOrder = { APPLY_NOW: 4, REVIEW: 3, WATCH: 2, SKIP: 1 };
  const tierOrder = { TIER_1: 5, TIER_2: 4, TIER_3: 3, TIER_4: 2, TIER_5: 1 };

  const sortedJobs = [...jobs].sort((a, b) => {
    const cfA = fitOrder[a.careerFit || a.match?.careerFit] || 0;
    const cfB = fitOrder[b.careerFit || b.match?.careerFit] || 0;
    if (cfB !== cfA) return cfB - cfA;

    const rA = recOrder[a.applicationRecommendation || a.match?.applicationRecommendation] || 0;
    const rB = recOrder[b.applicationRecommendation || b.match?.applicationRecommendation] || 0;
    if (rB !== rA) return rB - rA;

    const tA = tierOrder[a.roleTier || a.match?.roleTier] || 0;
    const tB = tierOrder[b.roleTier || b.match?.roleTier] || 0;
    if (tB !== tA) return tB - tA;

    const scoreA = a.match?.overallScore || a.overallScore || 0;
    const scoreB = b.match?.overallScore || b.overallScore || 0;
    return scoreB - scoreA;
  });

  const top50 = sortedJobs.slice(0, 50);

  console.log("TOP 50 OPPORTUNITY AUDIT (PHASE 8):");
  console.log("==================================================================================================================================================");

  top50.forEach((j, index) => {
    const num = index + 1;
    const title = (j.title || "").substring(0, 42);
    const fitString = (val) => {
      if (!val) return "NONE";
      if (typeof val === "string") return val;
      if (typeof val === "object" && val.strength) return String(val.strength);
      return "MODERATE";
    };

    const comp = (j.company || "").substring(0, 20);
    const loc = (j.location || "").substring(0, 24);
    const market = j.market || "UNKNOWN";
    const remote = j.remoteType || "ONSITE";
    const cf = j.careerFit || j.match?.careerFit || "POSSIBLE";
    const tier = j.roleTier || j.match?.roleTier || "TIER_3";
    const tech = fitString(j.technologyFit || j.match?.technologyFit);
    const dom = fitString(j.domainFit || j.match?.domainFit);
    const arch = fitString(j.architectureFit || j.match?.architectureFit);
    const client = fitString(j.clientConsultingFit || j.match?.clientConsultingFit);
    const intl = fitString(j.internationalFit || j.match?.internationalFit);
    const travel = (j.travel?.type || "NO_TRAVEL_MENTIONED").substring(0, 20);
    const custRegion = (j.customerRegion || "N/A").substring(0, 10);
    const workAuth = (j.workAuthorization?.authorization || "UNKNOWN").substring(0, 15);
    const rec = j.applicationRecommendation || j.match?.applicationRecommendation || "WATCH";
    const why = (j.match?.recommendationReasons?.[0] || j.match?.matchedSkills?.slice(0, 3).join(", ") || "Role profile alignment").substring(0, 35);
    const gaps = (j.match?.recommendationGaps?.[0] || j.match?.missingSkills?.slice(0, 2).join(", ") || "None identified").substring(0, 28);
    const src = j.source || "Unknown";

    console.log(
      `#${String(num).padStart(2, "0")} | ${title.padEnd(42)} | ${comp.padEnd(20)} | ${loc.padEnd(24)} | ${market.padEnd(14)} | ${remote.padEnd(7)} | ${cf.padEnd(14)} | ${tier.padEnd(6)} | ${tech.padEnd(8)} | ${dom.padEnd(8)} | ${arch.padEnd(8)} | ${client.padEnd(8)} | ${intl.padEnd(8)} | ${travel.padEnd(20)} | ${custRegion.padEnd(10)} | ${workAuth.padEnd(15)} | ${rec.padEnd(9)} | ${why.padEnd(35)} | ${gaps.padEnd(28)} | ${src}`
    );
  });

  // Negative Quality Check
  console.log("\n==================================================");
  console.log("NEGATIVE QUALITY AUDIT (TOP 20 ROLES):");
  console.log("==================================================");
  const negativeKeywords = [
    "qa", "sdet", "quality assurance", "test automation", "tester",
    "devops", "sre", "site reliability", "data scientist", "ai research",
    "cybersecurity", "security analyst", "ios developer", "android developer",
    "salesforce developer", "java developer", "recruiter", "intern", "graduate"
  ];

  let violations = 0;
  top50.slice(0, 20).forEach((j, i) => {
    const text = `${j.title} ${j.roleFamily}`.toLowerCase();
    const matchedNeg = negativeKeywords.filter((kw) => text.includes(kw));
    if (matchedNeg.length > 0) {
      console.warn(`[WARNING] Top #${i + 1} role "${j.title}" matched negative keyword(s): ${matchedNeg.join(", ")}`);
      violations++;
    }
  });

  if (violations === 0) {
    console.log("PASS: 0 negative roles (QA, SDET, DevOps, SRE, Data Science, etc.) found in the top 20.");
  } else {
    console.log(`Negative roles found in top 20: ${violations}`);
  }
  console.log("==================================================");
}

runAudit().catch((err) => {
  console.error("Audit error:", err);
  process.exit(1);
});
