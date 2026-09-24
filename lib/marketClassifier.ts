import type { EmeaCountry, MarketRegion } from "@/types";

export interface MarketClassificationResult {
  market: MarketRegion;
  regions?: string[];
  emeaCountry?: EmeaCountry;
  evidence: string;
  isEmea: boolean;
}

interface CountryPattern {
  country: EmeaCountry;
  regex: RegExp;
  label: string;
}

const EMEA_COUNTRY_PATTERNS: CountryPattern[] = [
  {
    country: "UK",
    regex: /\b(united kingdom|uk|great britain|england|scotland|wales|northern ireland|london|manchester|birmingham|edinburgh|glasgow|bristol|cambridge|oxford|leeds)\b/i,
    label: "UK",
  },
  {
    country: "IRELAND",
    regex: /\b(ireland|republic of ireland|dublin|cork|galway|limerick)\b/i,
    label: "Ireland",
  },
  {
    country: "GERMANY",
    regex: /\b(germany|deutschland|berlin|munich|münchen|hamburg|frankfurt|cologne|köln|stuttgart|düsseldorf|duesseldorf|leipzig)\b/i,
    label: "Germany",
  },
  {
    country: "NETHERLANDS",
    regex: /\b(netherlands|holland|amsterdam|rotterdam|utrecht|the hague|eindhoven)\b/i,
    label: "Netherlands",
  },
  {
    country: "FRANCE",
    regex: /\b(france|paris|lyon|marseille|toulouse|bordeaux|nice|nantes)\b/i,
    label: "France",
  },
  {
    country: "SPAIN",
    regex: /\b(spain|españa|madrid|barcelona|valencia|seville|malaga|bilbao)\b/i,
    label: "Spain",
  },
  {
    country: "SWITZERLAND",
    regex: /\b(switzerland|schweiz|suisse|zurich|zürich|geneva|genève|basel|bern|lausanne)\b/i,
    label: "Switzerland",
  },
  {
    country: "SWEDEN",
    regex: /\b(sweden|sverige|stockholm|gothenburg|göteborg|malmö|malmo)\b/i,
    label: "Sweden",
  },
  {
    country: "NORWAY",
    regex: /\b(norway|norge|oslo|bergen|trondheim|stavanger)\b/i,
    label: "Norway",
  },
  {
    country: "DENMARK",
    regex: /\b(denmark|danmark|copenhagen|københavn|aarhus|odense)\b/i,
    label: "Denmark",
  },
  {
    country: "FINLAND",
    regex: /\b(finland|suomi|helsinki|espoo|tampere|vantaa|oulu)\b/i,
    label: "Finland",
  },
  {
    country: "UAE",
    regex: /\b(uae|united arab emirates|dubai|abu dhabi|sharjah)\b/i,
    label: "UAE",
  },
  {
    country: "SAUDI_ARABIA",
    regex: /\b(saudi arabia|saudi|ksa|riyadh|jeddah|dammam|khobar)\b/i,
    label: "Saudi Arabia",
  },
  {
    country: "QATAR",
    regex: /\b(qatar|doha)\b/i,
    label: "Qatar",
  },
  {
    country: "ISRAEL",
    regex: /\b(israel|tel aviv|jerusalem|haifa|herzliya)\b/i,
    label: "Israel",
  },
  {
    country: "SOUTH_AFRICA",
    regex: /\b(south africa|johannesburg|cape town|durban|pretoria)\b/i,
    label: "South Africa",
  },
  {
    country: "OTHER_EMEA",
    regex: /\b(emea|europe|european union|middle east|poland|warsaw|krakow|wroclaw|italy|rome|milan|austria|vienna|belgium|brussels|portugal|lisbon|porto|czech republic|czechia|prague|romania|bucharest|greece|athens|hungary|budapest|turkey|türkiye|istanbul|estonia|tallinn|latvia|lithuania|croatia|zagreb)\b/i,
    label: "Other EMEA",
  },
];

const NORTH_AMERICA_REGEX = /\b(united states|usa|us|u\.s\.|canada|san francisco|new york|nyc|seattle|austin|chicago|boston|los angeles|toronto|vancouver|montreal|ontario|california|texas|washington|virginia)\b/i;

const LATAM_REGEX = /\b(latam|latin america|south america|brazil|argentina|mexico|colombia|chile|peru)\b/i;

const APAC_REGEX = /\b(apac|asia pacific|singapore|australia|sydney|melbourne|brisbane|japan|tokyo|new zealand|auckland|hong kong|malaysia|kuala lumpur|indonesia|jakarta|philippines|manila|vietnam|thailand|bangkok|south korea|seoul|taiwan)\b/i;

const INDIA_LOCATION_REGEX = /\b(india|hyderabad|telangana|bengaluru|bangalore|karnataka|mumbai|pune|maharashtra|delhi|new delhi|noida|gurgaon|gurugram|chennai|tamil nadu|kolkata|west bengal|ahmedabad|gujarat|kochi|kerala|chandigarh|jaipur)\b/i;

const GLOBAL_REMOTE_REGEX = /\b(worldwide|anywhere in the world|work from anywhere|global remote|remote worldwide|remote - global|remote \(worldwide\)|any location)\b/i;

export function detectSupportedRegions(text: string): string[] {
  const regions: string[] = [];
  const t = text.toLowerCase();

  const isNA =
    /\b(northern america|north america|usa|united states|u\.s\.|canada)\b/i.test(t) ||
    (/\b(americas)\b/i.test(t) && !/\b(latin america|south america)\b/i.test(t));
  if (isNA) regions.push("NORTH_AMERICA");

  const isLatam = /\b(latam|latin america|south america|brazil|argentina|colombia|chile|peru)\b/i.test(t) ||
    (/\bmexico\b/i.test(t) && !/\b(usa|canada|united states)\b/i.test(t));
  if (isLatam) regions.push("LATAM");

  const isEmea = /\b(emea|europe|european union|uk|united kingdom|great britain|germany|netherlands|france|spain|switzerland|sweden|norway|denmark|finland|uae|saudi arabia|qatar|israel|south africa|ireland|poland|italy)\b/i.test(t);
  if (isEmea) regions.push("EMEA");

  const isApac = /\b(apac|asia pacific|asia|australia|singapore|japan|new zealand|hong kong|malaysia|indonesia|philippines|vietnam|thailand|south korea|taiwan)\b/i.test(t);
  if (isApac) regions.push("APAC");

  return regions;
}

export const classifyMarket = classifyMarketAndEmeaCountry;

export function classifyMarketAndEmeaCountry(
  location?: string,
  description = ""
): MarketClassificationResult {
  const loc = (location || "").trim();

  // If location is completely missing / empty
  if (!loc) {
    if (GLOBAL_REMOTE_REGEX.test(description)) {
      return {
        market: "GLOBAL_REMOTE",
        regions: ["NORTH_AMERICA", "LATAM", "EMEA", "APAC"],
        evidence: "Description specifies worldwide/global remote",
        isEmea: false,
      };
    }
    return {
      market: "UNKNOWN",
      evidence: "Location missing from source posting",
      isEmea: false,
    };
  }

  // 1. Explicit Global Remote check in location
  if (GLOBAL_REMOTE_REGEX.test(loc)) {
    return {
      market: "GLOBAL_REMOTE",
      regions: ["NORTH_AMERICA", "LATAM", "EMEA", "APAC"],
      evidence: `Location indicates global remote: "${loc}"`,
      isEmea: false,
    };
  }

  // 2. Multi-Region Remote Check (e.g. "Northern America, LATAM, Europe, APAC", "Americas, Europe, Israel")
  // Do NOT collapse multi-region into single EMEA or single NA!
  const detectedRegions = detectSupportedRegions(loc);
  if (detectedRegions.length >= 2) {
    const isGlobal = detectedRegions.length >= 4;
    return {
      market: isGlobal ? "GLOBAL_REMOTE" : "MULTI_REGION_REMOTE",
      regions: detectedRegions,
      evidence: `Explicitly supports multiple geographic regions: [${detectedRegions.join(", ")}] from "${loc}"`,
      isEmea: false,
    };
  }

  // 3. India Location check
  // Even if company is German/US multinational, if the role location is India, market is INDIA.
  if (INDIA_LOCATION_REGEX.test(loc)) {
    return {
      market: "INDIA",
      regions: ["INDIA"],
      evidence: `Location is based in India: "${loc}"`,
      isEmea: false,
    };
  }

  // 4. Single LATAM Location check
  if (detectedRegions.length === 1 && detectedRegions[0] === "LATAM") {
    return {
      market: "LATAM",
      regions: ["LATAM"],
      evidence: `Location matches LATAM: "${loc}"`,
      isEmea: false,
    };
  }

  // 5. EMEA Location check
  for (const item of EMEA_COUNTRY_PATTERNS) {
    if (item.regex.test(loc)) {
      return {
        market: "EMEA",
        regions: ["EMEA"],
        emeaCountry: item.country,
        evidence: `Location matches EMEA (${item.label}): "${loc}"`,
        isEmea: true,
      };
    }
  }

  // 6. North America Location check
  if (NORTH_AMERICA_REGEX.test(loc)) {
    return {
      market: "NORTH_AMERICA",
      regions: ["NORTH_AMERICA"],
      evidence: `Location matches North America: "${loc}"`,
      isEmea: false,
    };
  }

  // 6b. LATAM Location check
  if (LATAM_REGEX.test(loc)) {
    return {
      market: "LATAM",
      regions: ["LATAM"],
      evidence: `Location matches LATAM: "${loc}"`,
      isEmea: false,
    };
  }

  // 7. APAC Location check (non-India)
  if (APAC_REGEX.test(loc)) {
    return {
      market: "APAC",
      regions: ["APAC"],
      evidence: `Location matches APAC: "${loc}"`,
      isEmea: false,
    };
  }

  // 8. If location is generic like "Remote", inspect description for regional boundaries
  if (/\bremote\b/i.test(loc)) {
    const descRegions = detectSupportedRegions(description);
    if (descRegions.length >= 2) {
      return {
        market: "MULTI_REGION_REMOTE",
        regions: descRegions,
        evidence: `Description indicates multi-region remote hiring: [${descRegions.join(", ")}]`,
        isEmea: false,
      };
    }

    // Check for EMEA restrictions in description
    for (const item of EMEA_COUNTRY_PATTERNS) {
      if (
        new RegExp(
          `\\b(?:must be located in|remote (?:within|in)|based in)\\s+.*${item.label}`,
          "i"
        ).test(description)
      ) {
        return {
          market: "EMEA",
          regions: ["EMEA"],
          emeaCountry: item.country,
          evidence: `Remote role restricted to EMEA (${item.label}) in description`,
          isEmea: true,
        };
      }
    }

    if (/\b(?:must reside in|remote in|remote within)\s+.*(?:india)\b/i.test(description)) {
      return {
        market: "INDIA",
        regions: ["INDIA"],
        evidence: "Remote role specified within India in description",
        isEmea: false,
      };
    }

    if (GLOBAL_REMOTE_REGEX.test(description)) {
      return {
        market: "GLOBAL_REMOTE",
        regions: ["NORTH_AMERICA", "LATAM", "EMEA", "APAC"],
        evidence: "Remote job specifies worldwide / global remote in description",
        isEmea: false,
      };
    }
  }

  return {
    market: "UNKNOWN",
    evidence: `Location could not be definitively classified: "${loc}"`,
    isEmea: false,
  };
}

export function formatEmeaCountry(country: EmeaCountry): string {
  switch (country) {
    case "UK":
      return "United Kingdom";
    case "IRELAND":
      return "Ireland";
    case "GERMANY":
      return "Germany";
    case "NETHERLANDS":
      return "Netherlands";
    case "FRANCE":
      return "France";
    case "SPAIN":
      return "Spain";
    case "SWITZERLAND":
      return "Switzerland";
    case "SWEDEN":
      return "Sweden";
    case "NORWAY":
      return "Norway";
    case "DENMARK":
      return "Denmark";
    case "FINLAND":
      return "Finland";
    case "UAE":
      return "UAE";
    case "SAUDI_ARABIA":
      return "Saudi Arabia";
    case "QATAR":
      return "Qatar";
    case "ISRAEL":
      return "Israel";
    case "SOUTH_AFRICA":
      return "South Africa";
    case "OTHER_EMEA":
      return "Other EMEA";
  }
}
