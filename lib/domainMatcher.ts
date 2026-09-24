import type { CareerDomain, DomainMatchDetail } from "@/types";

export interface DomainRule {
  domain: CareerDomain;
  name: string;
  titlePattern: RegExp;
  descriptionPattern: RegExp;
  skillPattern?: RegExp;
  isPrimaryTarget?: boolean;
}

/**
 * Explicit domain detection rules.
 * Strictly separates title declarations, core responsibility phrases, and skills.
 * Never assigns domains based on stray mentions or boilerplate.
 */
export const DOMAIN_RULES: DomainRule[] = [
  // 1. FRONTEND
  {
    domain: "FRONTEND",
    name: "Frontend Architecture & Engineering",
    titlePattern: /\b(?:frontend|front-end|ui(?:\s+engineer|\s+developer|\s+architect)?|web\s+application\s+developer|web\s+developer|react|angular|vue|next\.?js|javascript\s+developer|typescript\s+developer)\b/i,
    descriptionPattern: /\b(?:front-?end\s+(?:architecture|engineering|development|applications?)|user\s+interface(?:s)?|ui\s+(?:engineering|development|components?)|client-?side\s+(?:architecture|engineering|development)|web\s+applications?\s+(?:development|frontend)|single\s+page\s+applications?|design\s+systems?|micro-?frontends?|building\s+.*?\b(?:react(?:\.js)?|next\.?js|angular|vue(?:\.js)?)\b|(?:react(?:\.js)?|next\.?js|angular|vue)\s+storefronts?)\b/i,
    skillPattern: /^(?:react(?:\.js)?|next\.?js|angular|vue(?:\.js)?|typescript|javascript|frontend|ui\/ux|design systems?|html5?|css3?)$/i,
    isPrimaryTarget: true,
  },

  // 2. DIGITAL_EXPERIENCE
  {
    domain: "DIGITAL_EXPERIENCE",
    name: "Digital Experience & DXP",
    titlePattern: /\b(?:digital\s+experience|dxp|adobe\s+experience\s+manager|aem\s+architect|sitecore\s+architect)\b/i,
    descriptionPattern: /\b(?:digital\s+experience\s+platforms?|dxp|adobe\s+experience\s+manager|aem|sitecore|optimizely|acquia|customer\s+experience\s+platforms?|web\s+experience\s+platforms?|experience\s+driven\s+architecture)\b/i,
    skillPattern: /^(?:digital experience|dxp|aem|sitecore|optimizely)$/i,
    isPrimaryTarget: true,
  },

  // 3. CMS
  {
    domain: "CMS",
    name: "Headless CMS & Content Platforms",
    titlePattern: /\b(?:contentful|headless\s+cms|contentstack|prismic|builder\.io|strapi|sanity|storyblok|cms\s+architect|cms\s+developer|cms\s+consultant)\b/i,
    descriptionPattern: /\b(?:contentful|headless\s+cms|contentstack|prismic|builder\.io|strapi|sanity|storyblok|content\s+management\s+system(?:s)?|decoupled\s+cms|content\s+model(?:ing|s)?|authoring\s+workflows?)\b/i,
    skillPattern: /^(?:contentful|headless cms|contentstack|prismic|builder\.io|strapi|sanity|storyblok|cms)$/i,
    isPrimaryTarget: true,
  },

  // 4. COMMERCE
  {
    domain: "COMMERCE",
    name: "Commerce & Headless Storefronts",
    titlePattern: /\b(?:shopify(?:\s+plus)?|commerce(?:\s+architect|\s+developer)?|e-?commerce(?:\s+architect|\s+developer)?|storefront|commercetools|kibo|sfcc|magento|bigcommerce)\b/i,
    descriptionPattern: /\b(?:shopify(?:\s+plus)?|commercetools|kibo|sfcc|salesforce\s+commerce\s+cloud|headless\s+commerce|e-?commerce\s+(?:platform|storefront|architecture|development)|storefront\s+(?:engineering|development)|hydrogen(?:\s+storefronts?)?|checkout\s+(?:experience|integration)|cart\s+and\s+checkout)\b/i,
    skillPattern: /^(?:shopify|commercetools|kibo|sfcc|headless commerce|commerce|e-commerce|magento|bigcommerce)$/i,
    isPrimaryTarget: true,
  },

  // 5. ENTERPRISE_INTEGRATION
  {
    domain: "ENTERPRISE_INTEGRATION",
    name: "Enterprise Integration & APIs",
    titlePattern: /\b(?:enterprise\s+integration|api\s+architect|integration\s+architect|integration\s+engineer|mulesoft|boomi)\b/i,
    descriptionPattern: /\b(?:enterprise\s+integration|mulesoft|boomi|api\s+integration\s+(?:architecture|platform)|system\s+integration\s+architecture|middleware\s+integration|enterprise\s+service\s+bus|esb|rest(?:ful)?\s+apis?\s+integration|graphql\s+federation|webhook\s+integrations?)\b/i,
    skillPattern: /^(?:enterprise integration|api integration|mulesoft|boomi|middleware|rest apis|graphql)$/i,
    isPrimaryTarget: true,
  },

  // 6. SOLUTIONS_ARCHITECTURE
  {
    domain: "SOLUTIONS_ARCHITECTURE",
    name: "Solutions Architecture",
    titlePattern: /\b(?:solutions?\s+architect(?:ure)?|solution\s+designer|solutions?\s+engineering\s+director)\b/i,
    descriptionPattern: /\b(?:solutions?\s+architecture|solution\s+design\s+for\s+(?:clients?|customers?)|pre-?sales\s+architecture|customer\s+solutions?\s+design|designing\s+end-to-end\s+solutions?)\b/i,
    skillPattern: /^(?:solutions architecture|solution design|pre-sales architecture)$/i,
    isPrimaryTarget: true,
  },

  // 7. TECHNICAL_ARCHITECTURE
  {
    domain: "TECHNICAL_ARCHITECTURE",
    name: "Technical Architecture",
    titlePattern: /\b(?:(?:technical|software|system|enterprise|lead|principal|chief|applications?|cms|commerce|digital|frontend|ui)\s+)?architect(?:ure|ing)?\b/i,
    descriptionPattern: /\b(?:own(?:ing|s)?\s+(?:the\s+)?(?:technical|software|system|application|frontend)\s+architecture|lead(?:ing)?\s+(?:the\s+)?(?:technical|software|system|application)\s+architecture|architectural\s+(?:governance|design|patterns|roadmap)|architecting\s+(?:enterprise|scalable|distributed|headless)\s+(?:systems?|applications?|solutions?|platforms?)|responsible\s+for\s+(?:the\s+)?(?:technical|software|system)\s+architecture)\b/i,
    skillPattern: /^(?:technical architecture|software architecture|system architecture|architectural governance)$/i,
    isPrimaryTarget: true,
  },

  // 8. CLIENT_CONSULTING
  {
    domain: "CLIENT_CONSULTING",
    name: "Client-Facing Technical Consulting",
    titlePattern: /\b(?:technical\s+consultant|technology\s+consultant|solutions?\s+consultant|client\s+advisor|advisory\s+consultant)\b/i,
    descriptionPattern: /\b(?:client-facing\s+(?:consulting|technical|architecture)|customer-facing\s+(?:consulting|advisory|architecture)|technical\s+advisory\s+(?:services|to\s+clients?)|client\s+(?:stakeholder\s+management|engagement|consulting)|consulting\s+engagements?|advising\s+enterprise\s+clients?|(?:customer|client|implementation)\s+consulting|consulting\s+(?:services\s+)?for\s+(?:enterprise\s+)?clients?)\b/i,
    skillPattern: /^(?:client consulting|technical consulting|customer-facing|advisory)$/i,
    isPrimaryTarget: true,
  },

  // 9. PROFESSIONAL_SERVICES
  {
    domain: "PROFESSIONAL_SERVICES",
    name: "Professional Services & Implementation",
    titlePattern: /\b(?:professional\s+services|implementation\s+consultant|implementation\s+engineer|solution\s+delivery\s+consultant)\b/i,
    descriptionPattern: /\b(?:professional\s+services|customer\s+implementation|implementation\s+consulting|solution\s+delivery\s+to\s+customers?|onboarding\s+enterprise\s+clients?|client\s+implementation\s+projects?)\b/i,
    skillPattern: /^(?:professional services|implementation consultant|solution delivery)$/i,
    isPrimaryTarget: true,
  },

  // 10. SOFTWARE_ENGINEERING
  {
    domain: "SOFTWARE_ENGINEERING",
    name: "Software Engineering",
    titlePattern: /\b(?:software\s+engineer|software\s+developer|full-?stack|backend\s+engineer|application\s+developer|qa\s+engineer|test\s+engineer|sdet)\b/i,
    descriptionPattern: /\b(?:software\s+development|software\s+engineering|building\s+applications?|application\s+development|codebase|agile\s+software\s+delivery)\b/i,
    skillPattern: /^(?:software engineering|software development|fullstack|backend)$/i,
  },

  // 11. DEVOPS
  {
    domain: "DEVOPS",
    name: "DevOps & Infrastructure",
    titlePattern: /\b(?:devops|ci\/cd|infrastructure\s+engineer|platform\s+engineer|cloud\s+engineer)\b/i,
    descriptionPattern: /\b(?:devops\s+practices?|ci\/cd\s+pipelines?|infrastructure\s+as\s+code|terraform|kubernetes\s+cluster\s+management|container\s+orchestration)\b/i,
    skillPattern: /^(?:devops|ci\/cd|infrastructure as code|terraform|docker|kubernetes)$/i,
  },

  // 12. SRE
  {
    domain: "SRE",
    name: "Site Reliability Engineering & Observability",
    titlePattern: /\b(?:sre|site\s+reliability\s+engineer|reliability\s+engineer|observability\s+engineer)\b/i,
    descriptionPattern: /\b(?:site\s+reliability\s+engineering|slo|sli|error\s+budgets?|observability\s+platform|incident\s+response|telemetry|apm)\b/i,
    skillPattern: /^(?:sre|site reliability|observability|telemetry|prometheus|grafana|datadog)$/i,
  },

  // 13. DATA_AI
  {
    domain: "DATA_AI",
    name: "Data & AI",
    titlePattern: /\b(?:data\s+scientist|machine\s+learning|ai\s+engineer|data\s+engineer|analytics\s+engineer|deep\s+learning|nlp|llm|artificial\s+intelligence)\b/i,
    descriptionPattern: /\b(?:data\s+science|machine\s+learning\s+models?|predictive\s+models?|data\s+pipelines?|generative\s+ai|large\s+language\s+models?|data\s+warehouse|analytics\s+engineering)\b/i,
    skillPattern: /^(?:data science|machine learning|ai|artificial intelligence|llm|data engineering|python|deep learning)$/i,
  },

  // 14. SECURITY
  {
    domain: "SECURITY",
    name: "Security & Identity",
    titlePattern: /\b(?:security\s+engineer|cybersecurity|appsec|infosec|information\s+security|cloud\s+security|iam)\b/i,
    descriptionPattern: /\b(?:cybersecurity|application\s+security|threat\s+modeling|penetration\s+testing|security\s+compliance|soc2|iam\s+governance)\b/i,
    skillPattern: /^(?:security|cybersecurity|appsec|infosec|soc2|iam)$/i,
  },
];

/**
 * Strips known generic agency footers, recruitment disclaimers, and boilerplate
 * that list unrelated vacancies/stacks (e.g. Lemon.io "NOT YOUR TECH STACK?" footer).
 */
function cleanJobDescriptionForDomainAnalysis(raw: string): string {
  if (!raw) return "";

  // 1. Strip Lemon.io style vacancy footer
  const footerPattern = /\b(?:NOT\s+YOUR\s+TECH\s+STACK\?|About\s+Coalition\s+Technologies:|Who\s+We\s+Are:|About\s+Our\s+Company:|Other\s+open\s+positions:)/i;
  const match = footerPattern.exec(raw);
  if (match) {
    return raw.slice(0, match.index).trim();
  }

  return raw;
}

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
 * Deterministic evidence-based domain matching with discipline guards.
 * Each domain can ONLY be assigned when there is explicit evidence in actual job sources.
 * Never derives domains from target profile or unrelated technologies.
 */
export function extractDomainMatches(
  title = "",
  description = "",
  skills: string[] = []
): DomainMatchDetail[] {
  const cleanTitle = (title || "").trim();
  const cleanDesc = cleanJobDescriptionForDomainAnalysis(description || "");
  const matches: DomainMatchDetail[] = [];
  const assignedDomains = new Set<CareerDomain>();

  // =========================================================================
  // Discipline Guards (Anti-Contamination)
  // =========================================================================
  const isNonTechnicalRole = /\b(?:office\s+assistant|administrative|executive\s+assistant|receptionist|office\s+manager|bookkeeper|accountant|hr\b|recruiter|talent\s+acquisition)\b/i.test(cleanTitle) &&
    !/\b(?:architect|engineer|developer)\b/i.test(cleanTitle);

  // If the role is explicitly non-technical (e.g. Office Assistant), it can ONLY be OTHER.
  if (isNonTechnicalRole) {
    return [
      {
        domain: "OTHER",
        matched: true,
        evidence: `Role is administrative / non-technical: "${cleanTitle}"`,
        source: "title",
      },
    ];
  }

  const isDataRole = /\b(?:data\s+scientist|machine\s+learning|ai\s+engineer|data\s+engineer|deep\s+learning|ai\s+researcher|data\s+analyst)\b/i.test(cleanTitle);
  const isQARole = /\b(?:qa\s+engineer|quality\s+assurance|test\s+engineer|sdet|test\s+automation)\b/i.test(cleanTitle);

  // =========================================================================
  // Pass 1: Title-Based Domain Matching (Authoritative Source: "title")
  // =========================================================================
  for (const rule of DOMAIN_RULES) {
    if (rule.titlePattern.test(cleanTitle)) {
      // Disallow inappropriate title cross-over
      if (rule.domain === "TECHNICAL_ARCHITECTURE" && isNonTechnicalRole) continue;

      matches.push({
        domain: rule.domain,
        matched: true,
        evidence: cleanTitle,
        source: "title",
      });
      assignedDomains.add(rule.domain);
    }
  }

  // =========================================================================
  // Pass 2: Contextual Description Matching (Source: "description")
  // =========================================================================
  for (const rule of DOMAIN_RULES) {
    if (assignedDomains.has(rule.domain)) continue;

    // Discipline Contamination Guards:
    // A Data Scientist role must NOT become FRONTEND, CMS, or COMMERCE from description mentions
    if (isDataRole && ["FRONTEND", "CMS", "COMMERCE", "TECHNICAL_ARCHITECTURE"].includes(rule.domain)) {
      continue;
    }

    // A QA Engineer role must NOT become COMMERCE, CMS, or FRONTEND from description mentions
    if (isQARole && ["COMMERCE", "CMS", "FRONTEND", "TECHNICAL_ARCHITECTURE"].includes(rule.domain)) {
      continue;
    }

    if (rule.descriptionPattern.test(cleanDesc)) {
      const snippet = extractEvidenceSnippet(cleanDesc, rule.descriptionPattern);
      if (snippet) {
        matches.push({
          domain: rule.domain,
          matched: true,
          evidence: snippet,
          source: "description",
        });
        assignedDomains.add(rule.domain);
      }
    }
  }

  // =========================================================================
  // Pass 3: Verified Skills / Tags Matching (Source: "skills")
  // Only assign if the skill directly specifies the domain itself.
  // =========================================================================
  for (const rule of DOMAIN_RULES) {
    if (assignedDomains.has(rule.domain) || !rule.skillPattern) continue;

    // In Pass 3 (Skills / Tags), do not allow cross-discipline contamination from generic provider tag dumps:
    if (isDataRole && !["DATA_AI", "SOFTWARE_ENGINEERING"].includes(rule.domain)) continue;
    if (isQARole && !["SOFTWARE_ENGINEERING"].includes(rule.domain)) continue;

    const matchedSkill = skills.find((s) => rule.skillPattern!.test(s.trim()));
    if (matchedSkill) {
      matches.push({
        domain: rule.domain,
        matched: true,
        evidence: `Source skill tag: "${matchedSkill}"`,
        source: "skills",
      });
      assignedDomains.add(rule.domain);
    }
  }

  // If no technical domains were explicitly evidenced, assign OTHER
  if (matches.length === 0) {
    matches.push({
      domain: "OTHER",
      matched: true,
      evidence: `Role does not explicitly mention target technical domains`,
      source: "title",
    });
  }

  return matches;
}

export function formatDomainName(domain: CareerDomain): string {
  const found = DOMAIN_RULES.find((d) => d.domain === domain);
  if (found) return found.name;

  return domain
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
