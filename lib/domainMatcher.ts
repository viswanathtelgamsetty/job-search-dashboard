import type { CareerDomain, DomainMatchDetail } from "@/types";

export interface DomainPatternDefinition {
  domain: CareerDomain;
  name: string;
  pattern: RegExp;
  isPrimaryTarget?: boolean;
}

export const DOMAIN_DEFINITIONS: DomainPatternDefinition[] = [
  // 1. Primary Target Career Domains
  {
    domain: "FRONTEND",
    name: "Frontend Architecture & Engineering",
    pattern: /\b(?:frontend|front-end|ui(?:\/ux)?|react(?:\.js|js)?|next\.?js|angular|vue|typescript|javascript|design\s+systems?|micro-?frontends?|web\s+applications?|css|html)\b/i,
    isPrimaryTarget: true,
  },
  {
    domain: "DIGITAL_EXPERIENCE",
    name: "Digital Experience & DXP",
    pattern: /\b(?:digital\s+experience|dxp|adobe\s+experience\s+manager|aem|sitecore|optimizely|acquia|customer\s+experience|web\s+experience|experience\s+platform)\b/i,
    isPrimaryTarget: true,
  },
  {
    domain: "CMS",
    name: "Headless CMS & Content Platforms",
    pattern: /\b(?:contentful|headless\s+cms|contentstack|prismic|builder\.io|strapi|sanity|storyblok|cms|content\s+management(?:\s+system)?|decoupled\s+cms|wordpress)\b/i,
    isPrimaryTarget: true,
  },
  {
    domain: "COMMERCE",
    name: "Commerce & Headless Storefronts",
    pattern: /\b(?:shopify(?:\s+plus)?|commercetools|kibo|sfcc|salesforce\s+commerce\s+cloud|headless\s+commerce|e-?commerce|magento|bigcommerce|storefront|hydrogen)\b/i,
    isPrimaryTarget: true,
  },
  {
    domain: "ENTERPRISE_INTEGRATION",
    name: "Enterprise Integration & APIs",
    pattern: /\b(?:enterprise\s+integration|api\s+integration|rest(?:ful)?\s+apis?|graphql|middleware|mulesoft|boomi|webhooks|microservices\s+integration|system\s+integration|event-driven|message\s+broker)\b/i,
    isPrimaryTarget: true,
  },
  {
    domain: "SOLUTIONS_ARCHITECTURE",
    name: "Solutions Architecture",
    pattern: /\b(?:solutions?\s+architect(?:ure)?|solution\s+design|pre-?sales\s+architecture|customer\s+solutions?|solutions?\s+engineering)\b/i,
    isPrimaryTarget: true,
  },
  {
    domain: "TECHNICAL_ARCHITECTURE",
    name: "Technical Architecture",
    pattern: /\b(?:(?:technical|software|system|frontend|ui|cms|commerce|digital|cloud|enterprise|lead|principal|solutions?|data|sre|platform|staff|headless(?:\s+cms)?)\s+)?architect(?:ure|ing)?\b|\barchitectural\b/i,
    isPrimaryTarget: true,
  },
  {
    domain: "CLIENT_CONSULTING",
    name: "Client-Facing Technical Consulting",
    pattern: /\b(?:technical\s+consultant|technical\s+consulting|client-facing|customer-facing|advisory|client\s+advisory|technical\s+advisor|enterprise\s+clients?|stakeholder\s+management|client\s+engagement)\b/i,
    isPrimaryTarget: true,
  },
  {
    domain: "PROFESSIONAL_SERVICES",
    name: "Professional Services & Implementation",
    pattern: /\b(?:professional\s+services|implementation\s+consultant|implementation\s+engineer|solution\s+delivery|customer\s+onboarding|delivery\s+consultant)\b/i,
    isPrimaryTarget: true,
  },

  // 2. Core & Adjacent Domains
  {
    domain: "SOFTWARE_ENGINEERING",
    name: "Software Engineering",
    pattern: /\b(?:software\s+engine(?:er|ering)|software\s+developer|full-?stack|fullstack|backend\s+engine(?:er|ering)|application\s+developer)\b/i,
  },
  {
    domain: "DEVOPS",
    name: "DevOps & Infrastructure",
    pattern: /\b(?:devops|ci\/cd|pipeline|infrastructure\s+as\s+code|terraform|ansible|docker|containerization|cloud\s+infrastructure)\b/i,
  },
  {
    domain: "SRE",
    name: "Site Reliability Engineering & Observability",
    pattern: /\b(?:site\s+reliability|sre|observability|telemetry|apm|prometheus|grafana|datadog|incident\s+management|high\s+availability|slo|sli)\b/i,
  },
  {
    domain: "DATA_AI",
    name: "Data & AI",
    pattern: /\b(?:data\s+science|machine\s+learning|\bai\b|artificial\s+intelligence|llm|generative\s+ai|data\s+lake|data\s+warehouse|snowflake|bigquery|databricks|data\s+engineering)\b/i,
  },
  {
    domain: "SECURITY",
    name: "Security & Identity",
    pattern: /\b(?:information\s+security|cyber\s+security|appsec|iam|identity|okta|auth0|soc2|compliance|siem)\b/i,
  },
];

/**
 * Extracts a concise surrounding sentence or snippet (50-120 chars)
 * containing the matched domain evidence for audit traceability.
 */
function extractEvidenceSnippet(text: string, regex: RegExp): string | null {
  const match = regex.exec(text);
  if (!match) return null;

  const idx = match.index;
  const prevPeriod = Math.max(0, text.lastIndexOf(".", idx), text.lastIndexOf("\n", idx));
  const nextPeriod = text.indexOf(".", idx + match[0].length);
  const end = nextPeriod !== -1 ? nextPeriod + 1 : Math.min(text.length, idx + match[0].length + 50);
  const start = prevPeriod > 0 ? prevPeriod + 1 : Math.max(0, idx - 40);

  const snippet = text.slice(start, end).replace(/\s+/g, " ").trim();
  return snippet.length > 120 ? `${snippet.slice(0, 117)}...` : snippet;
}

/**
 * Deterministic evidence-based domain matching.
 * Scans title, description, and source skills against domain patterns.
 * Never infers domains without evidence.
 */
export function extractDomainMatches(
  title = "",
  description = "",
  skills: string[] = []
): DomainMatchDetail[] {
  const fullText = `${title} ${description} ${skills.join(" ")}`;
  const matches: DomainMatchDetail[] = [];

  for (const def of DOMAIN_DEFINITIONS) {
    const hasPattern = def.pattern.test(fullText);
    const hasInSkills = skills.some((s) => def.pattern.test(s));

    if (hasPattern || hasInSkills) {
      let evidence = extractEvidenceSnippet(fullText, def.pattern);
      if (!evidence && hasInSkills) {
        evidence = `Specified in job skills / tags`;
      }
      matches.push({
        domain: def.domain,
        matched: true,
        evidence: evidence || `Detected in job content for ${def.name}`,
      });
    }
  }

  // If no domains matched, assign OTHER with evidence
  if (matches.length === 0) {
    matches.push({
      domain: "OTHER",
      matched: true,
      evidence: `Role does not explicitly mention target technical domains`,
    });
  }

  return matches;
}

export function formatDomainName(domain: CareerDomain): string {
  const found = DOMAIN_DEFINITIONS.find((d) => d.domain === domain);
  if (found) return found.name;

  return domain
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
