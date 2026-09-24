// Verification script for Phase 3.2.1: Domain Matching & Anti-Contamination Audit
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
  console.log("DOMAIN MATCHING AUDIT (EVIDENCE & ANTI-CONTAMINATION)");
  console.log("=======================================================");
  console.log(`Total live jobs: ${jobs.length}\n`);

  for (let i = 0; i < jobs.length; i++) {
    const j = jobs[i];
    const domains = (j.domains || []).join(", ") || "OTHER";
    const actualTechs = (j.actualJobTechnologies || j.skills || []).join(", ") || "None specified";
    const domainDetails = j.domainMatches || [];

    console.log(`[${i + 1}] ${j.company} | ${j.title}`);
    console.log(`    Role Family: ${j.roleFamily}`);
    console.log(`    Domains: ${domains}`);
    console.log(`    Domain Evidence:`);
    for (const d of domainDetails) {
      if (d.matched) {
        console.log(`      - ${d.domain} [Source: ${d.source || "N/A"}]: "${d.evidence}"`);
      }
    }
    console.log(`    Actual Technologies: ${actualTechs}\n`);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
