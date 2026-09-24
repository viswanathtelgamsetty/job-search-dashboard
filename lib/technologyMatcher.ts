import type { TechnologyMatchDetail } from "@/types";

// Comprehensive catalog of recognizable software technologies & skills
// Used ONLY to detect technologies actually present in job source text/metadata
export const TECH_PATTERNS: Array<{
  name: string;
  pattern: RegExp;
  isFrontendTarget?: boolean;
}> = [
  // Primary target frontend & CMS technologies
  { name: "React", pattern: /\b(?:react(?:\.js|js)?)\b/i, isFrontendTarget: true },
  { name: "Next.js", pattern: /\b(?:next\.?js|nextjs)\b/i, isFrontendTarget: true },
  { name: "Angular", pattern: /\b(?:angular(?:\.js|js)?)\b/i, isFrontendTarget: true },
  { name: "TypeScript", pattern: /\btypescript\b/i, isFrontendTarget: true },
  { name: "JavaScript", pattern: /\b(?:javascript|es6|es20\d\d)\b/i, isFrontendTarget: true },
  { name: "Contentful", pattern: /\bcontentful\b/i, isFrontendTarget: true },
  { name: "Headless CMS", pattern: /\b(?:headless\s+cms|strapi|sanity|storyblok)\b/i, isFrontendTarget: true },
  { name: "Commerce", pattern: /\b(?:shopify(?:\s+plus)?|commercetools|headless\s+commerce|magento)\b/i, isFrontendTarget: true },
  { name: "Digital Experience", pattern: /\b(?:digital\s+experience|dxp|adobe\s+experience\s+manager|aem)\b/i, isFrontendTarget: true },
  { name: "Frontend Architecture", pattern: /\b(?:frontend\s+architecture|front-end\s+architecture|micro-?frontends?)\b/i, isFrontendTarget: true },
  { name: "Design Systems", pattern: /\bdesign\s+systems?\b/i, isFrontendTarget: true },
  { name: "GraphQL", pattern: /\bgraphql\b/i, isFrontendTarget: true },
  {
    name: "Node.js",
    pattern: /\b(?:node\.?js|nodejs|node(?:\s*,\s*(?:react|python|java|\.net|typescript|go|ruby|express|c#))|node(?:\s+(?:backend|runtime|server|developer|engineer|services?|microservices?)))\b/i,
    isFrontendTarget: true,
  },
  { name: "REST APIs", pattern: /\b(?:rest(?:ful)?\s+apis?|api\s+design)\b/i, isFrontendTarget: true },

  // Other common technologies (so non-target jobs accurately show their real stack!)
  { name: "Vue.js", pattern: /\b(?:vue(?:\.js|js)?)\b/i },
  { name: "Java", pattern: /\bjava\b/i },
  { name: "Python", pattern: /\bpython\b/i },
  { name: "Go", pattern: /\b(?:golang|go\s*lang)\b/i },
  { name: "C++", pattern: /\bc\+\+\b/i },
  { name: "C#", pattern: /\bc#|\.net\b/i },
  { name: "PHP", pattern: /\bphp\b/i },
  { name: "Ruby", pattern: /\bruby(?:\s+on\s+rails)?\b/i },
  { name: "Rust", pattern: /\brust\b/i },
  { name: "Swift", pattern: /\bswift\b/i },
  { name: "Kotlin", pattern: /\bkotlin\b/i },
  { name: "AWS", pattern: /\b(?:aws|amazon\s+web\s+services)\b/i },
  { name: "Azure", pattern: /\bazure\b/i },
  { name: "GCP", pattern: /\b(?:gcp|google\s+cloud)\b/i },
  { name: "Kubernetes", pattern: /\b(?:kubernetes|k8s)\b/i },
  { name: "Docker", pattern: /\bdocker\b/i },
  { name: "PostgreSQL", pattern: /\b(?:postgresql|postgres)\b/i },
  { name: "MongoDB", pattern: /\bmongodb\b/i },
  { name: "Redis", pattern: /\bredis\b/i },
  { name: "Kafka", pattern: /\bkafka\b/i },
  { name: "Elasticsearch", pattern: /\belasticsearch\b/i },
  { name: "Terraform", pattern: /\bterraform\b/i },
  { name: "Microservices", pattern: /\bmicroservices\b/i },
];

/**
 * Extracts technologies actually mentioned in source skills and text.
 * Never injects defaults or profile targets.
 */
export function extractActualJobTechnologies(
  sourceSkills: string[] = [],
  text = ""
): string[] {
  const result = new Set<string>();

  // 1. Process explicit skills from source
  for (const s of sourceSkills) {
    if (!s) continue;
    const clean = s.trim();
    if (!clean) continue;

    // Handle explicit short tags
    const lowerClean = clean.toLowerCase();
    if (lowerClean === "ts") {
      result.add("TypeScript");
      continue;
    }
    if (lowerClean === "js") {
      result.add("JavaScript");
      continue;
    }
    if (lowerClean === "golang" || lowerClean === "go") {
      result.add("Go");
      continue;
    }
    if (lowerClean === "k8s") {
      result.add("Kubernetes");
      continue;
    }

    // Check if it matches a known canonical technology
    let matched = false;
    for (const item of TECH_PATTERNS) {
      if (item.pattern.test(clean)) {
        result.add(item.name);
        matched = true;
        break;
      }
    }
    // If not in canonical list, keep clean version as long as it's not a generic word
    if (!matched) {
      if (!/^(architecture|enterprise solutions|engineering|lead|senior|principal|director|manager|specialist)$/i.test(clean)) {
        result.add(clean);
      }
    }
  }

  // 2. Scan text (title and description) for canonical technologies
  if (text) {
    for (const item of TECH_PATTERNS) {
      if (item.pattern.test(text)) {
        result.add(item.name);
      }
    }
  }

  return Array.from(result);
}

/**
 * Extracts a concise surrounding sentence or snippet (50-120 chars)
 * containing the target match for audit traceability.
 */
function extractEvidenceSnippet(text: string, regex: RegExp): string | null {
  const match = regex.exec(text);
  if (!match) return null;

  const idx = match.index;
  // Try to find sentence boundaries (. ! ? \n)
  const prevPeriod = Math.max(0, text.lastIndexOf(".", idx), text.lastIndexOf("\n", idx));
  const nextPeriod = text.indexOf(".", idx + match[0].length);
  const end = nextPeriod !== -1 ? nextPeriod + 1 : Math.min(text.length, idx + match[0].length + 50);
  const start = prevPeriod > 0 ? prevPeriod + 1 : Math.max(0, idx - 40);

  const snippet = text.slice(start, end).replace(/\s+/g, " ").trim();
  return snippet.length > 120 ? `${snippet.slice(0, 117)}...` : snippet;
}

/**
 * Evidence-based target technology matcher.
 * Checks each target technology against actual job text & skills.
 * NEVER fabricates evidence or assumes a match from seniority/role.
 */
export function matchTargetTechnologies(
  targetTechnologies: string[],
  jobText: string,
  actualJobTechs: string[]
): {
  matched: TechnologyMatchDetail[];
  unmatched: TechnologyMatchDetail[];
} {
  const matched: TechnologyMatchDetail[] = [];
  const unmatched: TechnologyMatchDetail[] = [];

  for (const target of targetTechnologies) {
    // Find pattern for this target
    const entry = TECH_PATTERNS.find(
      (p) => p.name.toLowerCase() === target.toLowerCase()
    );

    const pattern = entry ? entry.pattern : new RegExp(`\\b${target.replace(/[.+*?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");

    // Check if present in actual extracted skills or jobText
    const inSkills = actualJobTechs.some((s) => pattern.test(s));
    const inText = pattern.test(jobText);

    if (inSkills || inText) {
      let evidence = extractEvidenceSnippet(jobText, pattern);
      if (!evidence && inSkills) {
        evidence = `Specified in job skills: "${target}"`;
      }
      matched.push({
        technology: target,
        matched: true,
        evidence: evidence || `Found in job specification: ${target}`,
      });
    } else {
      unmatched.push({
        technology: target,
        matched: false,
        evidence: null,
      });
    }
  }

  return { matched, unmatched };
}
