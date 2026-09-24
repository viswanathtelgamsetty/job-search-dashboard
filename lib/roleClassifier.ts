import type { RoleFamily } from "@/types";

export interface RoleClassificationResult {
  primary: RoleFamily;
  secondary: RoleFamily[];
  evidence: string[];
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
  if (
    /\b(tech\s+lead|technical\s+lead|team\s+lead|lead\s+engineer|lead\s+developer|lead\s+software\s+engineer|lead\s+full\s*stack|lead\s+frontend)\b/i.test(
      t
    )
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

  // 12. SENIOR_FRONTEND_ENGINEER
  if (
    /\b(senior\s+frontend|sr\.?\s+frontend|senior\s+front[- ]end|senior\s+ui\s+engineer|staff\s+frontend|principal\s+frontend|senior\s+react|senior\s+web\s+developer)\b/i.test(
      t
    ) ||
    (/\b(frontend|front[- ]end|ui\s+engineer|react)\b/i.test(t) && /\b(senior|sr|lead|staff)\b/i.test(t))
  ) {
    families.push("SENIOR_FRONTEND_ENGINEER");
    evidence.push(`Title matches Senior Frontend Engineer: "${title}"`);
  }

  // Check description hints if title was ambiguous
  if (families.length === 0) {
    if (/\b(technical\s+lead|tech\s+lead)\b/i.test(combined)) {
      families.push("TECHNICAL_LEAD");
      evidence.push("Description indicates Technical Lead responsibilities");
    } else if (/\b(software\s+architect|system\s+architect)\b/i.test(combined)) {
      families.push("TECHNICAL_ARCHITECT");
      evidence.push("Description indicates Architect responsibilities");
    } else if (/\b(solutions?\s+architect)\b/i.test(combined)) {
      families.push("SOLUTIONS_ARCHITECT");
      evidence.push("Description indicates Solutions Architect responsibilities");
    } else if (/\b(senior\s+software\s+engineer|staff\s+software\s+engineer|principal\s+software\s+engineer)\b/i.test(t)) {
      families.push("TECHNICAL_LEAD");
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
    case "OTHER":
      return "Engineering / Other";
  }
}
