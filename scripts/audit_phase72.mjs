// scripts/audit_phase72.mjs
async function runAudit() {
  console.log("Triggering live job sync via /api/jobs/sync...");
  const syncRes = await fetch("http://localhost:3000/api/jobs/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  const syncData = await syncRes.json();
  console.log(`Sync complete. Providers queried:`, syncData.providersQueried || syncData);

  const jobs = (syncData.jobs && syncData.jobs.length > 0) ? syncData.jobs : (jobsData.jobs || []);

  console.log(`Total live jobs audited: ${jobs.length}`);

  // Calculate counts for application recommendation
  const counts = {
    APPLY_NOW: 0,
    REVIEW: 0,
    WATCH: 0,
    SKIP: 0,
  };

  const careerFitCounts = {
    HIGH_RELEVANCE: 0,
    RELEVANT: 0,
    POSSIBLE: 0,
    LOW_RELEVANCE: 0,
  };

  for (const j of jobs) {
    const rec = j.applicationRecommendation || j.match?.applicationRecommendation || "WATCH";
    if (counts[rec] !== undefined) counts[rec]++;
    else counts[rec] = 1;

    const cf = j.careerFit || j.match?.careerFit || "POSSIBLE";
    if (careerFitCounts[cf] !== undefined) careerFitCounts[cf]++;
  }

  console.log("\n==================================================");
  console.log("APPLICATION RECOMMENDATION COUNTS:");
  console.log(`APPLY_NOW: ${counts.APPLY_NOW}`);
  console.log(`REVIEW:    ${counts.REVIEW}`);
  console.log(`WATCH:     ${counts.WATCH}`);
  console.log(`SKIP:      ${counts.SKIP}`);
  console.log("==================================================");
  console.log("CAREER FIT COUNTS:");
  console.log(`HIGH_RELEVANCE: ${careerFitCounts.HIGH_RELEVANCE}`);
  console.log(`RELEVANT:       ${careerFitCounts.RELEVANT}`);
  console.log(`POSSIBLE:       ${careerFitCounts.POSSIBLE}`);
  console.log(`LOW_RELEVANCE:  ${careerFitCounts.LOW_RELEVANCE}`);
  console.log("==================================================\n");

  // Sort jobs deterministically:
  // 1. Career Fit (HIGH_RELEVANCE > RELEVANT > POSSIBLE > LOW_RELEVANCE)
  // 2. Application Recommendation (APPLY_NOW > REVIEW > WATCH > SKIP)
  // 3. Role Tier (TIER_1 > TIER_2 > TIER_3 > TIER_4 > TIER_5)
  // 4. Overall Score desc
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

  const top30 = sortedJobs.slice(0, 30);

  console.log("TOP 30 QUALITY AUDIT (PHASE 7.2):");
  console.log("==================================================================================================================================================");
  console.log(
    [
      "#",
      "Title",
      "Company",
      "Location",
      "Market",
      "Career Fit",
      "Role Tier",
      "Tech Fit",
      "Domain Fit",
      "Arch Fit",
      "Client Fit",
      "Intl Fit",
      "Recommendation",
      "Why Fits",
      "Potential Gaps",
    ].join(" | ")
  );
  console.log("--------------------------------------------------------------------------------------------------------------------------------------------------");

  top30.forEach((j, idx) => {
    const title = (j.title || "").substring(0, 32);
    const company = (j.company || "").substring(0, 18);
    const location = (j.location || "").substring(0, 20);
    const market = j.market || "UNKNOWN";
    const careerFit = j.careerFit || "POSSIBLE";
    const roleTier = j.roleTier || "TIER_4";
    const techFit = j.technologyFit?.strength || (j.primaryTechnologiesMatched?.length > 0 ? "MATCHED" : "NONE");
    const domainFit = j.domainFit?.strength || (j.domains?.length > 0 ? "MATCHED" : "NONE");
    const archFit = j.architectureFit?.strength || (j.match?.architectureFit?.strength || "NONE");
    const clientFit = j.clientConsultingFit?.strength || (j.clientFacing === "YES" ? "STRONG" : "NONE");
    const intlFit = j.internationalFit?.strength || (j.isIndiaToEmea ? "STRONG" : "NONE");
    const rec = j.applicationRecommendation || "REVIEW";
    const whyFits = (j.match?.whyThisFits?.[0] || j.whyThisFits?.[0] || "").replace(/^[✓\s]+/, "").substring(0, 35);
    const gaps = (j.match?.potentialGaps?.[0] || j.potentialGaps?.[0] || "None detected").replace(/^[!\s]+/, "").substring(0, 35);

    console.log(
      [
        String(idx + 1).padStart(2),
        title.padEnd(32),
        company.padEnd(18),
        location.padEnd(20),
        market.padEnd(14),
        careerFit.padEnd(14),
        roleTier.padEnd(7),
        String(techFit).padEnd(8),
        String(domainFit).padEnd(10),
        String(archFit).padEnd(8),
        String(clientFit).padEnd(10),
        String(intlFit).padEnd(8),
        rec.padEnd(9),
        whyFits.padEnd(35),
        gaps,
      ].join(" | ")
    );
  });
  console.log("==================================================================================================================================================");

  // Check specifically for Agent Developer Test III or any test role
  console.log("\nChecking for any Agent Developer Test or Test QA contamination:");
  const testRoles = jobs.filter((j) => /\b(agent developer test|developer test|sdet|qa\b|tester)\b/i.test(j.title));
  if (testRoles.length > 0) {
    for (const tr of testRoles) {
      console.log(`Found: "${tr.title}" at "${tr.company}" | Tier: ${tr.roleTier} | Career Fit: ${tr.careerFit} | Rec: ${tr.applicationRecommendation}`);
    }
  } else {
    console.log("No test/QA contaminated roles found in active dataset.");
  }
}

runAudit().catch(console.error);
