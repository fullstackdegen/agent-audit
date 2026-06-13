import type { NumericDistribution } from "./report-schema.js";

export interface VariabilityInput {
  performance: NumericDistribution;
  lcp: NumericDistribution;
  tbt: NumericDistribution;
  cls: NumericDistribution;
}

export function createDistribution(
  values: Array<number | null | undefined>,
  unit: NumericDistribution["unit"],
): NumericDistribution {
  const samples = values
    .filter((value): value is number => Number.isFinite(value))
    .sort((left, right) => left - right);

  if (samples.length === 0) {
    return { median: null, min: null, max: null, samples, unit };
  }

  const middle = Math.floor(samples.length / 2);
  const median =
    samples.length % 2 === 0
      ? ((samples[middle - 1] ?? 0) + (samples[middle] ?? 0)) / 2
      : (samples[middle] ?? null);

  return {
    median,
    min: samples[0] ?? null,
    max: samples.at(-1) ?? null,
    samples,
    unit,
  };
}

export function selectRepresentativeRun<
  T extends {
    categories: { performance?: { score: number | null } };
  },
>(runs: T[]): T | undefined {
  const performance = createDistribution(
    runs.map((run) =>
      run.categories.performance?.score == null
        ? null
        : run.categories.performance.score * 100,
    ),
    "score",
  );

  if (performance.median == null) {
    return runs[0];
  }

  return [...runs].sort((left, right) => {
    const leftScore = (left.categories.performance?.score ?? -1) * 100;
    const rightScore = (right.categories.performance?.score ?? -1) * 100;
    return (
      Math.abs(leftScore - performance.median!) -
      Math.abs(rightScore - performance.median!)
    );
  })[0];
}

export function getVariabilityWarnings(input: VariabilityInput): string[] {
  const warnings: string[] = [];

  if (range(input.performance) > 10) {
    warnings.push("Performance score varied by more than 10 points.");
  }
  if (range(input.lcp) > 1000) {
    warnings.push("Largest Contentful Paint varied by more than 1,000 ms.");
  }
  if (range(input.tbt) > 200) {
    warnings.push("Total Blocking Time varied by more than 200 ms.");
  }
  if (range(input.cls) > 0.1) {
    warnings.push("Cumulative Layout Shift varied by more than 0.1.");
  }

  return warnings;
}

function range(distribution: NumericDistribution): number {
  if (distribution.min == null || distribution.max == null) {
    return 0;
  }
  return distribution.max - distribution.min;
}
