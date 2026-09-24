import type { RoleFamily, RoleTier } from "@/types";

export interface RoleClassificationResult {
  primary: RoleFamily;
  secondary: RoleFamily[];
  evidence: string[];
}

export function classifyRoleTier(
  title: string,
  description = "",
  roleFamily: RoleFamily = "OTHER"
): { tier: RoleTier; reason: string } {
  const t = (title || "").toLowerCase();
  const d = (description || "").toLowerCase();

  // TIER 5: Non-technical / unrelated
  if (
    /\b(account\s+management|key\s+account|sales|recruiter|recruiting|recruitment|talent\s+acquisition|hr\b|human\s+resources|talent|marketing|(?:business|sales|people|office)\s+operations|operations\s+manager|customer\s+support|finance|office|admin\b|administrative|legal|scrum\s+master|project\s+manager|product\s+manager|qa\s+tester|manual\s+tester)\b/i.test(
      t
    )
  ) {
    return { tier: "TIER_5", reason: "Non-technical or unrelated domain role" };
  }

  // TIER 4: Backend / Cloud / DevOps / SRE / Data / AI / Security / Systems
  const isPureTier4 =
    /\b(cloud\s+operations|cloud\s+ops|devops|sre\b|site\s+reliability|infrastructure\s+engineer|platform\s+engineer|linux\s+engineer|systems?\s+engineer)\b/i.test(t) ||
    /\b(data\s+scientist|data\s+engineer|machine\s+learning|ai\s+engineer|ai\s+specialist|ai\s+researcher|deep\s+learning|nlp\s+engineer)\b/i.test(t) ||
    /\b(security\s+engineer|security\s+architect|infosec|cybersecurity)\b/i.test(t) ||
    /\b(rust\s+(?:engineering\s+lead|engineer|developer)|java\s+engineer|c\+\+\s+engineer|golang\s+engineer|backend\s+engineer|pure\s+backend)\b/i.test(t) ||
    roleFamily === "DATA_AI";

  const hasFrontendOrArchOverride =
    /\b(frontend|front[- ]end|ui\s+architect|solutions?\s+architect|digital\s+experience|cms\s+architect|commerce\s+architect)\b/i.test(t) ||
    (/\b(solutions?\s+architect|technical\s+architect)\b/i.test(t) && !/\b(security|data|cloud\s+ops)\b/i.test(t)) ||
    (/\b(frontend\s+architecture|react|next\.?js)\b/i.test(d) && /\b(lead|principal|staff)\b/i.test(t));

  if (isPureTier4 && !hasFrontendOrArchOverride) {
    return { tier: "TIER_4", reason: "Tier 4: Infrastructure, Cloud Operations, Data/AI, Security, or Systems Backend role" };
  }

  // TIER 1: Core target architecture & frontend leadership
  // Frontend Architect, Technical Architect, Solutions Architect, Digital Experience Architect,
  // CMS Architect, Commerce Architect, Client-facing Technical Architect,
  // Professional Services Architect, Senior/Staff/Principal Frontend Engineer
  const isTier1 =
    roleFamily === "FRONTEND_ARCHITECT" ||
    roleFamily === "COMMERCE" ||
    roleFamily === "CMS_DIGITAL_EXPERIENCE" ||
    roleFamily === "SENIOR_FRONTEND_ENGINEER" ||
    /\b(frontend\s+architect|front[- ]end\s+architect|ui\s+architect|web\s+architect)\b/i.test(t) ||
    /\b(technical\s+architect|tech\s+architect|enterprise\s+architect|system\s+architect|solutions?\s+architect|commerce\s+architect|cms\s+architect|dxp\s+architect)\b/i.test(t) ||
    /\b(professional\s+services\s+architect|consulting\s+architect|client[- ]facing\s+architect)\b/i.test(t) ||
    (/\b(architect)\b/i.test(t) && !/\b(security|data|hardware|building|landscape|cloud\s+ops)\b/i.test(t)) ||
    (/\b(senior|staff|principal|lead)\b/i.test(t) && /\b(frontend|front[- ]end|ui\s+engineer|ui\s+developer|react|web\s+application\s+developer)\b/i.test(t));

  if (isTier1) {
    return { tier: "TIER_1", reason: "Tier 1: Core Target Architecture or Senior Frontend role" };
  }

  // TIER 2: Technical Consultant, Solutions Consultant, Implementation Consultant, Customer Engineer, Solutions Engineer, Senior Full Stack Engineer (with frontend depth)
  const isTier2 =
    roleFamily === "TECHNICAL_CONSULTANT" ||
    roleFamily === "SOLUTIONS_ENGINEER" ||
    roleFamily === "IMPLEMENTATION_CONSULTANT" ||
    roleFamily === "PROFESSIONAL_SERVICES" ||
    roleFamily === "ENTERPRISE_INTEGRATION" ||
    /\b(technical\s+consultant|technology\s+consultant|solutions?\s+consultant|implementation\s+consultant|solutions?\s+engineer|customer\s+engineer|presales|pre-sales)\b/i.test(t) ||
    (/\b(full[- ]?stack)\b/i.test(t) && /\b(senior|staff|lead|principal)\b/i.test(t));

  if (isTier2) {
    return { tier: "TIER_2", reason: "Tier 2: Solutions Engineering, Technical Consulting, or Full Stack role" };
  }

  // TIER 3: Senior / Staff / Principal Software Engineer (generalist)
  const isTier3 =
    /\b(senior\s+software\s+engineer|sr\.?\s+software\s+engineer|staff\s+software\s+engineer|principal\s+software\s+engineer|lead\s+software\s+engineer|senior\s+developer|staff\s+developer|lead\s+developer)\b/i.test(t) ||
    roleFamily === "SOFTWARE_ENGINEERING" ||
    roleFamily === "TECHNICAL_LEAD";

  if (isTier3) {
    return { tier: "TIER_3", reason: "Tier 3: Senior/Staff/Principal Software Engineer (Generalist)" };
  }

  if (!/\b(engineer|architect|developer|programmer|lead|consultant|coder|tech|technical|devops|sre|software|cloud|platform|data|systems?)\b/i.test(t)) {
    return { tier: "TIER_5", reason: "Tier 5: Non-technical or unrelated domain role" };
  }

  return { tier: "TIER_4", reason: "Tier 4: General or adjacent engineering role" };
}

export function classifyRoleFamily(
  title: string,
  description = ""
): RoleClassificationResult {
  const t = (title || "").toLowerCase();
  const d = (description || "").toLowerCase();
  const combined = `${t} ${d}`;
  const evidence: string[] = [];
  const families: RoleFamily[] = [];

  // 1. FRONTEND_ARCHITECT
  if (
    /\b(frontend\s+architect|front[- ]end\s+architect|ui\s+architect|web\s+architect|lead\s+ui\s+architect|principal\s+frontend\s+architect)\b/i.test(
      t
    ) ||
    (/\b(frontend|front[- ]end|ui)\b/i.test(t) && /\b(architect)\b/i.test(t))
  ) {
    families.push("FRONTEND_ARCHITECT");
    evidence.push(`Title matches Frontend/UI Architect: "${title}"`);
  }

  // 2. CMS_DIGITAL_EXPERIENCE
  if (
    /\b(contentful|headless\s+cms|cms\s+architect|cms\s+consultant|digital\s+experience|dxp|aem|adobe\s+experience\s+manager|strapi|sanity|sitecore)\b/i.test(
      t
    ) ||
    (/\b(contentful|headless\s+cms|cms|digital\s+experience)\b/i.test(d) &&
      /\b(architect|consultant|lead|specialist)\b/i.test(t))
  ) {
    families.push("CMS_DIGITAL_EXPERIENCE");
    evidence.push(`Matches CMS / Digital Experience domain: "${title}"`);
  }

  // 3. COMMERCE
  if (
    /\b(commerce\s+architect|commerce\s+consultant|ecommerce\s+architect|shopify|commercetools|magento|sap\s+commerce)\b/i.test(
      t
    ) ||
    (/\b(commercetools|headless\s+commerce|shopify\s+plus|ecommerce)\b/i.test(d) &&
      /\b(architect|consultant|lead|engineer)\b/i.test(t))
  ) {
    families.push("COMMERCE");
    evidence.push(`Matches Commerce / eCommerce domain: "${title}"`);
  }

  // 4. ENTERPRISE_INTEGRATION
  if (
    /\b(integration\s+architect|enterprise\s+integration|api\s+architect|mulesoft|boomi)\b/i.test(
      t
    )
  ) {
    families.push("ENTERPRISE_INTEGRATION");
    evidence.push(`Matches Enterprise Integration: "${title}"`);
  }

  // 5. SOLUTIONS_ARCHITECT
  if (
    /\b(solutions?\s+architect|solution\s+architect|enterprise\s+solutions?\s+architect|cloud\s+solutions?\s+architect|client\s+solutions?\s+architect)\b/i.test(
      t
    )
  ) {
    families.push("SOLUTIONS_ARCHITECT");
    evidence.push(`Title matches Solutions Architect: "${title}"`);
  }

  // 6. TECHNICAL_ARCHITECT
  if (
    /\b(technical\s+architect|tech\s+architect|enterprise\s+architect|system\s+architect|software\s+architect|associate\s+technical\s+architect|principal\s+architect|chief\s+architect)\b/i.test(
      t
    ) ||
    (/\b(architect)\b/i.test(t) && !families.includes("FRONTEND_ARCHITECT") && !families.includes("SOLUTIONS_ARCHITECT"))
  ) {
    families.push("TECHNICAL_ARCHITECT");
    evidence.push(`Title matches Technical/Software Architect: "${title}"`);
  }

  // 7. TECHNICAL_LEAD
  const isNonTechnicalLead = /\b(account\s+management|key\s+account|sales|recruiting|hr\b|talent|marketing|operations|customer\s+support|finance|office)\b/i.test(t);
  const isSystemsOrBackendLead = /\b(rust|c\+\+|embedded|hardware|linux|firmware|devops|sre|cloud\s+ops)\b/i.test(t);
  if (
    !isNonTechnicalLead &&
    !isSystemsOrBackendLead &&
    (/\b(tech\s+lead|technical\s+lead|lead\s+frontend|lead\s+ui|lead\s+web)\b/i.test(t) ||
      (/\b(lead\s+engineer|lead\s+developer|lead\s+software\s+engineer|lead\s+full\s*stack)\b/i.test(t) && !/\b(rust|c\+\+|embedded)\b/i.test(t)) ||
      (/\b(team\s+lead)\b/i.test(t) && /\b(software|engineering|developer|frontend|tech|dev)\b/i.test(combined) && !isSystemsOrBackendLead))
  ) {
    families.push("TECHNICAL_LEAD");
    evidence.push(`Title matches Technical Lead: "${title}"`);
  }

  // 8. SOLUTIONS_ENGINEER
  if (
    /\b(solutions?\s+engineer|presales|pre-sales\s+engineer|sales\s+engineer|customer\s+solutions?\s+engineer)\b/i.test(
      t
    )
  ) {
    families.push("SOLUTIONS_ENGINEER");
    evidence.push(`Title matches Solutions/Presales Engineer: "${title}"`);
  }

  // 9. TECHNICAL_CONSULTANT
  if (
    /\b(technical\s+consultant|technology\s+consultant|solutions?\s+consultant|principal\s+consultant|senior\s+consultant|lead\s+consultant)\b/i.test(
      t
    )
  ) {
    families.push("TECHNICAL_CONSULTANT");
    evidence.push(`Title matches Technical Consultant: "${title}"`);
  }

  // 10. IMPLEMENTATION_CONSULTANT
  if (
    /\b(implementation\s+consultant|implementation\s+engineer|onboarding\s+consultant|deployment\s+specialist)\b/i.test(
      t
    )
  ) {
    families.push("IMPLEMENTATION_CONSULTANT");
    evidence.push(`Title matches Implementation Consultant: "${title}"`);
  }

  // 11. PROFESSIONAL_SERVICES
  if (
    /\b(professional\s+services|ps\s+engineer|client\s+services|services\s+architect|consulting\s+architect)\b/i.test(
      t
    )
  ) {
    families.push("PROFESSIONAL_SERVICES");
    evidence.push(`Title matches Professional Services: "${title}"`);
  }

  // 12. SENIOR_FRONTEND_ENGINEER (includes Frontend Web Application Developer)
  if (
    /\b(senior\s+frontend|sr\.?\s+frontend|senior\s+front[- ]end|senior\s+ui\s+engineer|staff\s+frontend|principal\s+frontend|senior\s+react|senior\s+web\s+developer|frontend\s+(?:web\s+application\s+)?developer|frontend\s+engineer|front[- ]end\s+developer|ui\s+developer|ui\s+engineer|web\s+application\s+developer)\b/i.test(
      t
    ) ||
    (/\b(frontend|front[- ]end|ui\s+engineer|react)\b/i.test(t) && /\b(senior|sr|lead|staff|developer|engineer)\b/i.test(t))
  ) {
    if (!families.includes("FRONTEND_ARCHITECT")) {
      families.push("SENIOR_FRONTEND_ENGINEER");
      evidence.push(`Title matches Frontend Engineering: "${title}"`);
    }
  }

  // 13. DATA_AI
  if (
    /\b(data\s+scientist|machine\s+learning|ai\s+engineer|data\s+engineer|deep\s+learning|ai\s+researcher|data\s+analyst|ai\s+specialist|lead\s+data\s+scientist|principal\s+data\s+scientist)\b/i.test(
      t
    )
  ) {
    families.push("DATA_AI");
    evidence.push(`Title matches Data & AI role: "${title}"`);
  }

  // 14. SOFTWARE_ENGINEERING (includes QA Engineer, SDET, General Dev, Rust/Systems)
  if (
    (/\b(qa\s+engineer|quality\s+assurance|test\s+engineer|sdet|test\s+automation|software\s+developer|software\s+engineer|full-?stack\s+engineer|backend\s+engineer|application\s+developer|rust\s+engineering\s+lead)\b/i.test(
      t
    ) || isSystemsOrBackendLead) &&
    !families.some((f) => [
      "FRONTEND_ARCHITECT",
      "TECHNICAL_ARCHITECT",
      "SOLUTIONS_ARCHITECT",
      "TECHNICAL_LEAD",
      "SENIOR_FRONTEND_ENGINEER",
      "COMMERCE",
      "CMS_DIGITAL_EXPERIENCE",
      "DATA_AI",
    ].includes(f))
  ) {
    families.push("SOFTWARE_ENGINEERING");
    evidence.push(`Title matches Software / Engineering: "${title}"`);
  }

  // Check description hints if title was ambiguous
  if (families.length === 0) {
    if (/\b(technical\s+lead|tech\s+lead)\b/i.test(combined) && !isSystemsOrBackendLead) {
      families.push("TECHNICAL_LEAD");
      evidence.push("Description indicates Technical Lead responsibilities");
    } else if (/\b(software\s+architect|system\s+architect)\b/i.test(combined)) {
      families.push("TECHNICAL_ARCHITECT");
      evidence.push("Description indicates Architect responsibilities");
    } else if (/\b(solutions?\s+architect)\b/i.test(combined)) {
      families.push("SOLUTIONS_ARCHITECT");
      evidence.push("Description indicates Solutions Architect responsibilities");
    } else if (/\b(senior\s+software\s+engineer|staff\s+software\s+engineer|principal\s+software\s+engineer)\b/i.test(t)) {
      families.push("SOFTWARE_ENGINEERING");
      evidence.push(`Staff/Principal software engineering role: "${title}"`);
    } else {
      families.push("OTHER");
      evidence.push("General engineering / uncategorized role");
    }
  }

  const primary = families[0];
  const secondary = families.slice(1);

  return {
    primary,
    secondary,
    evidence,
  };
}

export function formatRoleTier(tier: RoleTier): string {
  switch (tier) {
    case "TIER_1":
      return "Tier 1 (Core Target Architect / Sr Frontend)";
    case "TIER_2":
      return "Tier 2 (Consulting / Solutions / Full Stack)";
    case "TIER_3":
      return "Tier 3 (Generalist Sr/Staff/Principal)";
    case "TIER_4":
      return "Tier 4 (Backend / Cloud / DevOps / Data / AI)";
    case "TIER_5":
      return "Tier 5 (Unrelated / Non-Technical)";
  }
}

export function formatRoleFamily(role: RoleFamily): string {
  switch (role) {
    case "FRONTEND_ARCHITECT":
      return "Frontend Architect";
    case "TECHNICAL_ARCHITECT":
      return "Technical Architect";
    case "SOLUTIONS_ARCHITECT":
      return "Solutions Architect";
    case "TECHNICAL_LEAD":
      return "Technical Lead";
    case "SENIOR_FRONTEND_ENGINEER":
      return "Sr Frontend Engineer";
    case "SOLUTIONS_ENGINEER":
      return "Solutions Engineer";
    case "TECHNICAL_CONSULTANT":
      return "Technical Consultant";
    case "IMPLEMENTATION_CONSULTANT":
      return "Implementation Consultant";
    case "PROFESSIONAL_SERVICES":
      return "Professional Services";
    case "CMS_DIGITAL_EXPERIENCE":
      return "CMS & Digital Exp";
    case "COMMERCE":
      return "Commerce Consultant";
    case "ENTERPRISE_INTEGRATION":
      return "Enterprise Integration";
    case "DATA_AI":
      return "Data & AI";
    case "SOFTWARE_ENGINEERING":
      return "Software Engineer";
    case "OTHER":
      return "Engineering / Other";
  }
}
