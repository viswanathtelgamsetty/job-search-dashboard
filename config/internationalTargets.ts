export type InternationalTargetStatus = "WATCH" | "VERIFY" | "REJECT";

export interface InternationalTargetCompany {
  id: string;
  name: string;
  website: string;
  careersUrl: string;
  headquarters: string;
  indiaEntityStatus: "NO_KNOWN_ENTITY" | "UNKNOWN" | "HAS_ENTITY";
  indiaRemoteStatus: "CONFIRMED" | "UNKNOWN" | "NOT_CURRENTLY_OPEN";
  compensation: string;
  roles: string[];
  status: InternationalTargetStatus;
  notes: string;
}

export const internationalTargetCompanies: InternationalTargetCompany[] = [
  {
    id: "automattic", name: "Automattic", website: "https://automattic.com", careersUrl: "https://automattic.com/work-with-us/",
    headquarters: "United States", indiaEntityStatus: "UNKNOWN", indiaRemoteStatus: "CONFIRMED",
    compensation: "International / role-dependent", roles: ["Senior Software Engineer", "Frontend Engineer", "Full Stack Engineer"],
    status: "VERIFY", notes: "Remote-first company. Verify the employing entity for an India-based hire before applying."
  },
  {
    id: "tailscale", name: "Tailscale", website: "https://tailscale.com", careersUrl: "https://tailscale.com/careers",
    headquarters: "United States / Canada", indiaEntityStatus: "NO_KNOWN_ENTITY", indiaRemoteStatus: "NOT_CURRENTLY_OPEN",
    compensation: "International", roles: ["Software Engineer", "Frontend / Product Engineering"],
    status: "WATCH", notes: "Current careers page lists team locations in Canada, US and UK. Watch for roles explicitly open to India."
  },
  {
    id: "duckduckgo", name: "DuckDuckGo", website: "https://duckduckgo.com", careersUrl: "https://duckduckgo.com/hiring",
    headquarters: "United States", indiaEntityStatus: "UNKNOWN", indiaRemoteStatus: "UNKNOWN",
    compensation: "International / role-dependent", roles: ["Senior Software Engineer", "Frontend Engineer", "Product Engineer"],
    status: "VERIFY", notes: "Distributed company. Verify India employment eligibility and employing entity for each opening."
  },
  {
    id: "supabase", name: "Supabase", website: "https://supabase.com", careersUrl: "https://supabase.com/careers",
    headquarters: "United States", indiaEntityStatus: "UNKNOWN", indiaRemoteStatus: "UNKNOWN",
    compensation: "International / role-dependent", roles: ["Frontend Engineer", "Full Stack Engineer", "Developer Experience"],
    status: "VERIFY", notes: "Strong fit for React/Next.js, PostgreSQL and AI. Verify the India employing entity before applying."
  },
  {
    id: "httpie", name: "HTTPie", website: "https://httpie.io", careersUrl: "https://httpie.io/jobs",
    headquarters: "International / distributed", indiaEntityStatus: "UNKNOWN", indiaRemoteStatus: "UNKNOWN",
    compensation: "International / role-dependent", roles: ["Senior Frontend Engineer", "Software Engineer"],
    status: "VERIFY", notes: "Senior Frontend Engineer is highly relevant to your React/TypeScript profile. Verify India hiring entity."
  },
  {
    id: "grid", name: "Grid", website: "https://gridverify.com", careersUrl: "https://jobs.ashbyhq.com/gridverify",
    headquarters: "United States", indiaEntityStatus: "UNKNOWN", indiaRemoteStatus: "UNKNOWN",
    compensation: "Some roles publish USD ranges", roles: ["Senior Frontend Engineer", "Software Engineer"],
    status: "VERIFY", notes: "Potentially attractive compensation. Never assume a US salary range applies to India."
  },
  {
    id: "umbrel", name: "Umbrel", website: "https://umbrel.com", careersUrl: "https://umbrel.crew.work",
    headquarters: "International", indiaEntityStatus: "UNKNOWN", indiaRemoteStatus: "UNKNOWN",
    compensation: "International / role-dependent", roles: ["Senior Frontend Engineer", "Product Engineer"],
    status: "VERIFY", notes: "Small technology company. Verify India eligibility and employing entity for each opening."
  },
  {
    id: "canonical", name: "Canonical", website: "https://canonical.com", careersUrl: "https://canonical.com/careers",
    headquarters: "United Kingdom", indiaEntityStatus: "UNKNOWN", indiaRemoteStatus: "CONFIRMED",
    compensation: "International / role-dependent", roles: ["Web Frontend Engineer", "Software Engineer", "Technical Architect"],
    status: "VERIFY", notes: "Worldwide/APAC remote roles exist. Because Canonical also hires in India, verify the exact employing entity."
  }
];

export const rejectedInternationalCompanies = [
  { name: "GitLab", reason: "GitLab India Private Limited is an Indian subsidiary/entity." },
  { name: "Elastic", reason: "Elastic Technologies (India) Private Limited is an Indian subsidiary." },
  { name: "Zapier", reason: "Zapier India Private Limited is active in India." }
];
