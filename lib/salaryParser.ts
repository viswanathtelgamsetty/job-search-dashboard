import type { SalaryState } from "@/types";

export interface ParsedSalary {
  min?: number;
  max?: number;
  currency: string;
  lpaMin?: number;
  lpaMax?: number;
  isDisclosed: boolean;
  salaryState: SalaryState;
  formatted: string;
  originalSalary?: string;
  originalCurrency?: string;
  convertedSalary?: string;
  conversionDate?: string;
  isEstimated: boolean;
}

export function parseAndNormalizeSalary(
  salaryText?: string,
  min?: number,
  max?: number,
  currency = "INR"
): ParsedSalary {
  let lpaMin: number | undefined;
  let lpaMax: number | undefined;
  let salaryState: SalaryState = "SALARY_NOT_DISCLOSED";
  let isEstimated = false;
  let originalSalary: string | undefined;
  const originalCurrency = currency;
  let convertedSalary: string | undefined;
  let conversionDate: string | undefined;

  if (min !== undefined && min > 0) {
    if (currency === "INR") {
      lpaMin = min < 1000 ? min : Math.round(min / 100000);
      lpaMax = max && max > 0 ? (max < 1000 ? max : Math.round(max / 100000)) : lpaMin;
      salaryState = lpaMax && lpaMax !== lpaMin ? "SALARY_RANGE" : "SALARY_CONFIRMED";
      originalSalary = lpaMax && lpaMax !== lpaMin ? `₹${lpaMin}L – ₹${lpaMax}L PA` : `₹${lpaMin}L PA`;
    } else if (currency === "USD") {
      // USD Disclosed: do not present as confirmed Indian compensation!
      const uMin = min;
      const uMax = max || min;
      originalSalary = uMax !== uMin ? `$${Math.round(uMin / 1000)}k – $${Math.round(uMax / 1000)}k` : `$${Math.round(uMin / 1000)}k`;
      // Converted estimate for reference
      isEstimated = true;
      salaryState = "SALARY_ESTIMATED";
      const estLpaMin = Math.round((uMin * 85) / 100000);
      const estLpaMax = Math.round((uMax * 85) / 100000);
      lpaMin = estLpaMin;
      lpaMax = estLpaMax;
      convertedSalary = `~₹${estLpaMin}L – ₹${estLpaMax}L PA (est. @ 85 INR/USD)`;
      conversionDate = new Date().toISOString().split("T")[0];
    } else if (currency === "EUR") {
      const eMin = min;
      const eMax = max || min;
      originalSalary = eMax !== eMin ? `€${Math.round(eMin / 1000)}k – €${Math.round(eMax / 1000)}k` : `€${Math.round(eMin / 1000)}k`;
      isEstimated = true;
      salaryState = "SALARY_ESTIMATED";
      const estLpaMin = Math.round((eMin * 92) / 100000);
      const estLpaMax = Math.round((eMax * 92) / 100000);
      lpaMin = estLpaMin;
      lpaMax = estLpaMax;
      convertedSalary = `~₹${estLpaMin}L – ₹${estLpaMax}L PA (est. @ 92 INR/EUR)`;
      conversionDate = new Date().toISOString().split("T")[0];
    }
  } else if (salaryText) {
    const clean = salaryText.replace(/,/g, "");

    // 1. Check for Lakhs pattern: "35 - 45 LPA", "35L", "3500000"
    const lpaMatch = clean.match(
      /(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*(?:lpa|lakh|lakhs|l)\b/i
    );
    if (lpaMatch) {
      lpaMin = parseFloat(lpaMatch[1]);
      lpaMax = parseFloat(lpaMatch[2]);
      min = lpaMin * 100000;
      max = lpaMax * 100000;
      currency = "INR";
      salaryState = "SALARY_RANGE";
      originalSalary = `₹${lpaMin}L – ₹${lpaMax}L PA`;
    } else {
      const singleLpa = clean.match(
        /(\d+(?:\.\d+)?)\s*(?:lpa|lakh|lakhs|l)\b/i
      );
      if (singleLpa) {
        lpaMin = parseFloat(singleLpa[1]);
        lpaMax = lpaMin;
        min = lpaMin * 100000;
        max = min;
        currency = "INR";
        salaryState = "SALARY_CONFIRMED";
        originalSalary = `₹${lpaMin}L PA`;
      }
    }

    // 2. Check USD pattern: "$130k - $170k" or "$140,000"
    if (!lpaMin) {
      const usdMatch = clean.match(
        /\$(\d+(?:\.\d+)?)\s*k?\s*(?:-|to)\s*\$?(\d+(?:\.\d+)?)\s*k?/i
      );
      if (usdMatch) {
        let uMin = parseFloat(usdMatch[1]);
        let uMax = parseFloat(usdMatch[2]);
        if (uMin < 1000) uMin *= 1000;
        if (uMax < 1000) uMax *= 1000;
        currency = "USD";
        min = uMin;
        max = uMax;
        originalSalary = `$${Math.round(uMin / 1000)}k – $${Math.round(uMax / 1000)}k`;
        isEstimated = true;
        salaryState = "SALARY_ESTIMATED";
        lpaMin = Math.round((uMin * 85) / 100000);
        lpaMax = Math.round((uMax * 85) / 100000);
        convertedSalary = `~₹${lpaMin}L – ₹${lpaMax}L PA (est. @ 85 INR/USD)`;
        conversionDate = new Date().toISOString().split("T")[0];
      }
    }
  }

  const isDisclosed = lpaMin !== undefined && lpaMin > 0;
  if (!isDisclosed) {
    salaryState = "SALARY_NOT_DISCLOSED";
  }

  let formatted = "Salary Undisclosed";
  if (isDisclosed) {
    if (salaryState === "SALARY_CONFIRMED" || salaryState === "SALARY_RANGE") {
      if (lpaMax && lpaMax !== lpaMin) {
        formatted = `₹${lpaMin}L – ₹${lpaMax}L PA`;
      } else {
        formatted = `₹${lpaMin}L+ PA`;
      }
    } else if (salaryState === "SALARY_ESTIMATED") {
      formatted = `${originalSalary} (${convertedSalary})`;
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
    salaryState,
    formatted,
    originalSalary,
    originalCurrency,
    convertedSalary,
    conversionDate,
    isEstimated,
  };
}

export function matchesSalaryRequirement(
  lpaMin?: number,
  isDisclosed?: boolean,
  targetLpa = 35
): { matches: boolean; reason: string } {
  if (!isDisclosed || lpaMin === undefined || lpaMin === null) {
    return {
      matches: true,
      reason: "Salary Undisclosed (Retained per policy — never rejected on unlisted comp)",
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
