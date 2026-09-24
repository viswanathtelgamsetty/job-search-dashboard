import { extractTravelDetails } from "../lib/travelExtractor.ts";
import assert from "node:assert";
import test from "node:test";

test("TEST 1: Travel to US customer sites up to 20% => INTERNATIONAL_TRAVEL", () => {
  const result = extractTravelDetails("Travel to US customer sites up to 20%");
  assert.strictEqual(result.type, "INTERNATIONAL_TRAVEL");
  assert.strictEqual(result.percentage, 20);
  assert.ok(result.evidence.includes("Travel to US customer sites up to 20%"));
  assert.ok(result.destinations.includes("USA"));
});

test("TEST 2: Work with US-based engineering team => INTERNATIONAL_TEAM_ONLY", () => {
  const result = extractTravelDetails("Work with US-based engineering team");
  assert.strictEqual(result.type, "INTERNATIONAL_TEAM_ONLY");
  assert.ok(result.evidence.includes("Work with US-based engineering team"));
});

test("TEST 3: Global stakeholders across Europe => INTERNATIONAL_TEAM_ONLY", () => {
  const result = extractTravelDetails("Global stakeholders across Europe");
  assert.strictEqual(result.type, "INTERNATIONAL_TEAM_ONLY");
  assert.ok(result.evidence.includes("Global stakeholders across Europe"));
});

test("TEST 4: Travel required 10-20% => INTERNATIONAL_TRAVEL", () => {
  const result = extractTravelDetails("Travel required 10-20%");
  assert.strictEqual(result.type, "INTERNATIONAL_TRAVEL");
  assert.strictEqual(result.percentage, 20);
  assert.strictEqual(result.percentageRange, "10-20%");
  assert.ok(result.evidence.includes("Travel required 10-20%"));
});

test("TEST 5: No travel mentioned => NO_TRAVEL_MENTIONED", () => {
  const result = extractTravelDetails("No travel mentioned");
  assert.strictEqual(result.type, "NO_TRAVEL_MENTIONED");
  assert.strictEqual(result.evidence, "No travel mentioned");
});

test("TEST 6: Relocation to Dubai required => RELOCATION", () => {
  const result = extractTravelDetails("Relocation to Dubai required");
  assert.strictEqual(result.type, "RELOCATION");
  assert.ok(result.evidence.includes("Relocation to Dubai required"));
  assert.ok(result.destinations.includes("Middle East"));
});
