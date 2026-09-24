import type { TargetCompany } from "@/types";

export const defaultTargetCompanies: TargetCompany[] = [
  {
    id: "comp-thoughtworks",
    name: "Thoughtworks",
    website: "https://www.thoughtworks.com",
    careersUrl: "https://www.thoughtworks.com/careers/jobs",
    industry: "Global Technology Consultancy",
    targetRoleFamilies: [
      "Technical Lead",
      "Solutions Architect",
      "Frontend Architect",
    ],
    internationalPresence: ["USA", "Europe", "Singapore", "Australia"],
    travelPossibility: "High (Client-site & International project travel 20-30%)",
    notes:
      "Premier engineering consultancy. Strong focus on modern frontend, micro-frontends, and client-facing architecture.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "comp-publicis-sapient",
    name: "Publicis Sapient",
    website: "https://www.publicissapient.com",
    careersUrl: "https://careers.publicissapient.com",
    industry: "Digital Business Transformation",
    targetRoleFamilies: [
      "Digital Experience Architect",
      "Frontend Architect",
      "Commerce Consultant",
    ],
    internationalPresence: ["USA", "UK", "Middle East", "Europe"],
    travelPossibility: "High (International client engagements, Middle East/US trips)",
    notes:
      "Enterprise digital experience leader. Heavy use of Contentful, headless CMS, React/Next.js and commerce platforms.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "comp-epam",
    name: "EPAM Systems",
    website: "https://www.epam.com",
    careersUrl: "https://www.epam.com/careers",
    industry: "Digital Platform Engineering",
    targetRoleFamilies: [
      "Senior Technical Lead",
      "Solutions Architect",
      "Technical Consultant",
    ],
    internationalPresence: ["USA", "Europe", "Switzerland", "Singapore"],
    travelPossibility: "Moderate to High (15-25% customer site visits)",
    notes:
      "Global software engineering powerhouse. Multiple large-scale enterprise headless CMS & e-commerce client initiatives.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "comp-nagarro",
    name: "Nagarro",
    website: "https://www.nagarro.com",
    careersUrl: "https://www.nagarro.com/en/careers",
    industry: "Digital Engineering & Services",
    targetRoleFamilies: [
      "Associate Technical Architect",
      "Frontend Architect",
      "Enterprise Integration Consultant",
    ],
    internationalPresence: ["Germany", "USA", "Austria", "Nordics"],
    travelPossibility: "Moderate (German & European client visits)",
    notes:
      "Heavy European client footprint. Great opportunities for onshore architecture workshops.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "comp-slalom",
    name: "Slalom Build",
    website: "https://www.slalombuild.com",
    careersUrl: "https://www.slalom.com/careers",
    industry: "Modern Tech Consulting",
    targetRoleFamilies: [
      "Solutions Architect",
      "Technical Lead",
      "Solutions Engineer",
    ],
    internationalPresence: ["USA", "UK", "Australia", "Japan"],
    travelPossibility: "High (Global customer implementations)",
    notes:
      "Modern cloud and frontend architecture consultancy with premium enterprise clients.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "comp-valtech",
    name: "Valtech",
    website: "https://www.valtech.com",
    careersUrl: "https://www.valtech.com/careers",
    industry: "Global Digital Experience & Commerce",
    targetRoleFamilies: [
      "Digital Experience Architect",
      "CMS / Digital Experience Consultant",
      "Commerce Consultant",
    ],
    internationalPresence: ["Europe", "USA", "Singapore", "UAE"],
    travelPossibility: "High (MACH Alliance projects, Middle East & European clients)",
    notes:
      "Pioneer in MACH architecture (Microservices, API-first, Cloud-native, Headless). Core focus on Contentful, Commercelayer, Next.js.",
    createdAt: new Date().toISOString(),
  },
];
