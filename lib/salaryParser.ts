export interface ParsedSalary {
  min?: number;
  max?: number;
  currency: string;
  lpaMin?: number;
  lpaMax?: number;
  isDisclosed: boolean;
  formatted: string;
}

export function parseAndNormalizeSalary(
  salaryText?: string,
  min?: number,
  max?: number,
  currency = "INR"
): ParsedSalary {
  let lpaMin: number | undefined;
  let lpaMax: number | undefined;

  if (min !== undefined && min > 0) {
    if (currency === "INR") {
      lpaMin = min < 1000 ? min : Math.round(min / 100000);
      lpaMax = max && max > 0 ? (max < 1000 ? max : Math.round(max / 100000)) : lpaMin;
    } else if (currency === "USD") {
      // 1 USD ~ 85 INR, annual $100,000 = 85,00,000 INR = 85 LPA
      lpaMin = Math.round((min * 85) / 100000);
      lpaMax = max ? Math.round((max * 85) / 100000) : lpaMin;
    } else if (currency === "EUR") {
      // 1 EUR ~ 92 INR
      lpaMin = Math.round((min * 92) / 100000);
      lpaMax = max ? Math.round((max * 92) / 100000) : lpaMin;
    }
  } else if (salaryText) {
    const clean = salaryText.replace(/,/g, "");

    // Check for Lakhs pattern: "35 - 45 LPA", "35L", "3500000"
    const lpaMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*(?:lpa|lakh|lakhs|l)/i);
    if (lpaMatch) {
      lpaMin = parseFloat(lpaMatch[1]);
      lpaMax = parseFloat(lpaMatch[2]);
      min = lpaMin * 100000;
      max = lpaMax * 100000;
    } else {
      const singleLpa = clean.match(/(\d+(?:\.\d+)?)\s*(?:lpa|lakh|lakhs|l)/i);
      if (singleLpa) {
        lpaMin = parseFloat(singleLpa[1]);
        lpaMax = lpaMin;
        min = lpaMin * 100000;
        max = min;
      }
    }

    // Check USD pattern: "$130k - $170k" or "$140,000"
    if (!lpaMin) {
      const usdMatch = clean.match(/\$(\d+(?:\.\d+)?)\s*k?\s*(?:-|to)\s*\$?(\d+(?:\.\d+)?)\s*k?/i);
      if (usdMatch) {
        let uMin = parseFloat(usdMatch[1]);
        let uMax = parseFloat(usdMatch[2]);
        if (uMin < 1000) uMin *= 1000;
        if (uMax < 1000) uMax *= 1000;
        currency = "USD";
        min = uMin;
        max = uMax;
        lpaMin = Math.round((uMin * 85) / 100000);
        lpaMax = Math.round((uMax * 85) / 100000);
      }
    }
  }

  const isDisclosed = lpaMin !== undefined && lpaMin > 0;

  let formatted = "Salary Undisclosed";
  if (isDisclosed) {
    if (currency === "INR" || (lpaMin && !currency)) {
      if (lpaMax && lpaMax !== lpaMin) {
        formatted = `₹${lpaMin}L – ₹${lpaMax}L PA`;
      } else {
        formatted = `₹${lpaMin}L+ PA`;
      }
    } else if (currency === "USD") {
      formatted = `$${Math.round(min! / 1000)}k – $${Math.round(max! / 1000)}k (~₹${lpaMin}L+ PA)`;
    } else {
      formatted = `${currency} ${min} – ${max}`;
    }
  }

  return {
    min,
    max,
    currency,
    lpaMin,
    lpaMax,
    isDisclosed,
    formatted,
  };
}

export function matchesSalaryRequirement(
  lpaMin?: number,
  isDisclosed?: boolean,
  targetLpa = 35
): { matches: boolean; reason: string } {
  if (!isDisclosed || lpaMin === undefined || lpaMin === null) {
    // Rule: "Surface lower salary roles only if salary is not disclosed; never reject a job solely because salary is unknown"
    return {
      matches: true,
      reason: "Salary Undisclosed (Retained per search policy)",
    };
  }

  if (lpaMin >= targetLpa) {
    return {
      matches: true,
      reason: `₹${lpaMin}L+ meets target (≥ ₹${targetLpa}L)`,
    };
  }

  return {
    matches: false,
    reason: `Disclosed below target (₹${lpaMin}L < ₹${targetLpa}L)`,
  };
}
