export const CANONICAL_TECHNOLOGIES: Record<string, string> = {
  // Frontend frameworks & core
  react: "React",
  "react.js": "React",
  reactjs: "React",
  "next.js": "Next.js",
  nextjs: "Next.js",
  next: "Next.js",
  angular: "Angular",
  angularjs: "Angular",
  "angular.js": "Angular",
  typescript: "TypeScript",
  ts: "TypeScript",
  javascript: "JavaScript",
  js: "JavaScript",
  "vue.js": "Vue.js",
  vuejs: "Vue.js",
  vue: "Vue.js",
  html5: "HTML5",
  css3: "CSS3",
  tailwind: "Tailwind CSS",
  tailwindcss: "Tailwind CSS",

  // Architecture & Experience
  "frontend architecture": "Frontend Architecture",
  "front-end architecture": "Frontend Architecture",
  microfrontends: "Frontend Architecture",
  "micro-frontends": "Frontend Architecture",
  "design systems": "Design Systems",
  "design system": "Design Systems",
  "digital experience": "Digital Experience",
  dxp: "Digital Experience",
  "adobe experience manager": "Digital Experience",
  aem: "Digital Experience",

  // CMS & Headless
  contentful: "Contentful",
  "headless cms": "Headless CMS",
  headless: "Headless CMS",
  strapi: "Headless CMS",
  sanity: "Headless CMS",
  storyblok: "Headless CMS",

  // Commerce
  commerce: "Commerce",
  ecommerce: "Commerce",
  "e-commerce": "Commerce",
  shopify: "Commerce",
  "shopify plus": "Commerce",
  commercetools: "Commerce",
  magento: "Commerce",

  // Backend & APIs
  node: "Node.js",
  "node.js": "Node.js",
  nodejs: "Node.js",
  graphql: "GraphQL",
  "rest apis": "REST APIs",
  "rest api": "REST APIs",
  rest: "REST APIs",
  microservices: "Microservices",
  "enterprise architecture": "Enterprise Architecture",

  // Cloud & DevOps
  aws: "Cloud (AWS/GCP)",
  azure: "Cloud (AWS/GCP)",
  gcp: "Cloud (AWS/GCP)",
  cloud: "Cloud (AWS/GCP)",
  docker: "Containers",
  kubernetes: "Containers",
};

export function normalizeTechnology(tech: string): string {
  if (!tech) return "";
  const key = tech.trim().toLowerCase();
  if (CANONICAL_TECHNOLOGIES[key]) {
    return CANONICAL_TECHNOLOGIES[key];
  }
  // Title-case fallback
  return tech
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function extractAndNormalizeTechnologies(
  skills: string[] = [],
  text = ""
): string[] {
  const result = new Set<string>();

  // 1. Process provided skills array
  for (const s of skills) {
    if (!s) continue;
    const norm = normalizeTechnology(s);
    if (norm) result.add(norm);
  }

  // 2. Scan text for target technologies
  const lower = (text || "").toLowerCase();

  const patterns: [RegExp, string][] = [
    [/\breact(?:\.js|js)?\b/i, "React"],
    [/\bnext(?:\.js|js)?\b/i, "Next.js"],
    [/\bangular(?:\.js|js)?\b/i, "Angular"],
    [/\btypescript\b|\bts\b/i, "TypeScript"],
    [/\bnode(?:\.js|js)?\b/i, "Node.js"],
    [/\bcontentful\b/i, "Contentful"],
    [/\bheadless\s+cms\b|\bstrapi\b|\bsanity\b|\bstoryblok\b/i, "Headless CMS"],
    [/\bgraphql\b/i, "GraphQL"],
    [/\b(shopify|commercetools|headless\s+commerce|e-?commerce)\b/i, "Commerce"],
    [/\b(digital\s+experience|dxp|aem|adobe\s+experience\s+manager)\b/i, "Digital Experience"],
    [/\b(frontend\s+architecture|microfrontends|micro-frontends)\b/i, "Frontend Architecture"],
    [/\bdesign\s+systems?\b/i, "Design Systems"],
    [/\b(rest(?:ful)?\s+apis?|api\s+design)\b/i, "REST APIs"],
    [/\bmicroservices\b/i, "Microservices"],
  ];

  for (const [regex, canonical] of patterns) {
    if (regex.test(lower)) {
      result.add(canonical);
    }
  }

  return Array.from(result);
}
