// Verification script for Phase 3.2.2: Domain Evidence Precedence Audit
async function run() {
  console.log("Syncing live jobs from http://localhost:3000/api/jobs/sync ...");
  const response = await fetch("http://localhost:3000/api/jobs/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });

  if (!response.ok) {
    console.error("Sync failed with status:", response.status, await response.text());
    process.exit(1);
  }

  const data = await response.json();
  const { jobs } = data;

  console.log("\n=======================================================");
  console.log("DOMAIN EVIDENCE PRECEDENCE AUDIT (TOP 20 JOBS)");
  console.log("=======================================================");
  console.log(`Total live jobs: ${jobs.length}\n`);

  const top20 = jobs.slice(0, 20);
  for (let i = 0; i < top20.length; i++) {
    const j = top20[i];
    const primaryDomains = (j.domains || []).join(", ") || "OTHER";
    const secondaryDomains = (j.secondaryEvidenceDomains || []).join(", ") || "None";
    const actualTechs = (j.actualJobTechnologies || j.skills || []).join(", ") || "None specified";
    const domainDetails = j.domainMatches || [];

    console.log(`[${i + 1}] ${j.company} | ${j.title}`);
    console.log(`    Location: ${j.location} | Career Fit: ${j.match?.careerFit}`);
    console.log(`    Role Family: ${j.roleFamily}`);
    console.log(`    Primary Domains (STRONG/MODERATE): ${primaryDomains}`);
    console.log(`    Secondary Domains (WEAK tags): ${secondaryDomains}`);
    console.log(`    Domain Evidence:`);
    for (const d of domainDetails) {
      if (d.matched) {
        console.log(`      - ${d.domain} [Strength: ${d.strength || "N/A"}, Source: ${d.source || "N/A"}]: "${d.evidence}"`);
      }
    }
    console.log(`    Actual Technologies: ${actualTechs}\n`);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
