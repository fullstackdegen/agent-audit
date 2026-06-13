import { describe, expect, it } from "vitest";

import {
  createDistribution,
  getVariabilityWarnings,
  selectRepresentativeRun,
} from "../src/aggregate.js";
import { makeLighthouseResult } from "./fixtures/lighthouse-results.js";

describe("aggregation", () => {
  it("calculates odd and even medians without discarding samples", () => {
    expect(createDistribution([10, 30, 20], "ms")).toEqual({
      median: 20,
      min: 10,
      max: 30,
      samples: [10, 20, 30],
      unit: "ms",
    });
    expect(createDistribution([10, 20, 30, 40], "ms").median).toBe(25);
    expect(createDistribution([], "ms").median).toBeNull();
  });

  it("selects the run closest to median performance", () => {
    const runs = [
      makeLighthouseResult({ performance: 0.6 }),
      makeLighthouseResult({ performance: 0.9 }),
      makeLighthouseResult({ performance: 0.8 }),
    ];

    expect(selectRepresentativeRun(runs)).toBe(runs[2]);
  });

  it("reports material score and metric variability", () => {
    const warnings = getVariabilityWarnings({
      performance: createDistribution([60, 80], "score"),
      lcp: createDistribution([1000, 2501], "ms"),
      tbt: createDistribution([0, 250], "ms"),
      cls: createDistribution([0, 0.2], "unitless"),
    });

    expect(warnings).toHaveLength(4);
  });
});
