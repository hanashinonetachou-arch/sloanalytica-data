const logsum = values => {
  const m = Math.max(...values);
  return m + Math.log(values.reduce((sum, value) => sum + Math.exp(value - m), 0));
};

const normalizeDistribution = distribution => {
  const total = Object.values(distribution).reduce((sum, value) => sum + value, 0);
  if (!(total > 0)) throw new Error("multinomial distribution total must be positive");
  return Object.fromEntries(Object.entries(distribution).map(([key, value]) => [key, value / total]));
};

const logBinomialLikelihood = (count, trials, probability) =>
  count * Math.log(probability) + (trials - count) * Math.log1p(-probability);

const logMultinomialLikelihood = (counts, distribution) => {
  const normalized = normalizeDistribution(distribution);
  return Object.entries(counts).reduce((sum, [category, count]) => {
    const p = normalized[category];
    if (!(p > 0)) throw new Error(`missing/zero multinomial probability for ${category}`);
    return sum + count * Math.log(p);
  }, 0);
};

const seededRng = seed => {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

// Exact inverse-CDF draw. Efficient for the low-probability binomials used by machine research.
const sampleBinomial = (trials, probability, random) => {
  if (probability <= 0) return 0;
  if (probability >= 1) return trials;
  const u = random();
  const q = 1 - probability;
  let mass = q ** trials;
  let cumulative = mass;
  let count = 0;
  while (u > cumulative && count < trials) {
    count += 1;
    mass *= ((trials - count + 1) / count) * (probability / q);
    cumulative += mass;
  }
  return count;
};

const sampleMultinomial = (trials, distribution, random) => {
  const normalized = normalizeDistribution(distribution);
  const entries = Object.entries(normalized);
  const counts = {};
  let remainingTrials = trials;
  let remainingProbability = 1;
  entries.forEach(([category, probability], index) => {
    if (index === entries.length - 1) {
      counts[category] = remainingTrials;
      return;
    }
    const conditionalProbability = probability / remainingProbability;
    const count = sampleBinomial(remainingTrials, conditionalProbability, random);
    counts[category] = count;
    remainingTrials -= count;
    remainingProbability -= probability;
  });
  return counts;
};

const exposureTrials = (feature, horizon) => {
  const exposure = feature.benchmarkExposure;
  if (!exposure) throw new Error(`benchmark exposure missing: ${feature.featureId}`);
  if (exposure.type === "DIRECT_HORIZON") return Math.floor(horizon * (exposure.multiplier ?? 1));
  if (exposure.type === "FIXED_BY_HORIZON") {
    const value = exposure.trials?.[String(horizon)] ?? exposure.trials?.[horizon];
    if (!Number.isFinite(value)) throw new Error(`benchmark exposure unresolved: ${feature.featureId} @ ${horizon}`);
    return Math.floor(value);
  }
  if (exposure.type === "FLOOR_RATE_LOWER_BOUND") {
    if (!(exposure.denominator > 0)) throw new Error(`invalid lower-bound denominator: ${feature.featureId}`);
    return Math.floor(horizon / exposure.denominator);
  }
  throw new Error(`unsupported benchmark exposure type: ${exposure.type}`);
};

const validateSpec = spec => {
  if (!Array.isArray(spec.horizons) || !spec.horizons.length) throw new Error("horizons required");
  if (!spec.groups?.LOW?.settings?.length || !spec.groups?.HIGH?.settings?.length) throw new Error("LOW/HIGH settings required");
  if (!Array.isArray(spec.features) || !spec.features.length) throw new Error("features required");
  if (spec.classifier !== "CLASS_MARGINAL_LIKELIHOOD") throw new Error("classifier must be CLASS_MARGINAL_LIKELIHOOD");
  if (spec.classPrior !== "EQUAL" || spec.withinClassPrior !== "EQUAL") throw new Error("only equal priors are currently authorized");
  for (const feature of spec.features) {
    if (!["binomial", "multinomial"].includes(feature.likelihoodFamily)) throw new Error(`unsupported likelihood family: ${feature.featureId}`);
    for (const setting of [...spec.groups.LOW.settings, ...spec.groups.HIGH.settings]) {
      if (feature.likelihoodFamily === "binomial" && !(feature.parameters?.[setting]?.probability > 0 && feature.parameters[setting].probability < 1))
        throw new Error(`invalid binomial probability: ${feature.featureId} ${setting}`);
      if (feature.likelihoodFamily === "multinomial" && !feature.parameters?.[setting]?.distribution)
        throw new Error(`missing multinomial distribution: ${feature.featureId} ${setting}`);
    }
  }
};

export function calculateHighLow(spec) {
  validateSpec(spec);
  const random = seededRng(spec.simulation.seed);
  const samples = spec.simulation.samplesPerGroup;
  const results = [];
  for (const games of spec.horizons) {
    const exposures = Object.fromEntries(spec.features.map(feature => [feature.featureId, exposureTrials(feature, games)]));
    let lowCorrect = 0;
    let highCorrect = 0;
    for (const [groupName, group] of Object.entries({LOW: spec.groups.LOW, HIGH: spec.groups.HIGH})) {
      for (let sample = 0; sample < samples; sample += 1) {
        const truth = group.settings[Math.floor(random() * group.settings.length)];
        const observations = spec.features.map(feature => {
          const trials = exposures[feature.featureId];
          const parameter = feature.parameters[truth];
          const observed = feature.likelihoodFamily === "binomial"
            ? sampleBinomial(trials, parameter.probability, random)
            : sampleMultinomial(trials, parameter.distribution, random);
          return {feature, trials, observed};
        });
        const classScore = settings => logsum(settings.map(setting =>
          observations.reduce((score, {feature, trials, observed}) => {
            const parameter = feature.parameters[setting];
            return score + (feature.likelihoodFamily === "binomial"
              ? logBinomialLikelihood(observed, trials, parameter.probability)
              : logMultinomialLikelihood(observed, parameter.distribution));
          }, 0)
        )) - Math.log(settings.length);
        const predicted = classScore(spec.groups.HIGH.settings) > classScore(spec.groups.LOW.settings) ? "HIGH" : "LOW";
        if (groupName === "LOW" && predicted === "LOW") lowCorrect += 1;
        if (groupName === "HIGH" && predicted === "HIGH") highCorrect += 1;
      }
    }
    const lowRecall = 100 * lowCorrect / samples;
    const highRecall = 100 * highCorrect / samples;
    results.push({
      games,
      featureExposures: exposures,
      lowRecallPercent: +lowRecall.toFixed(2),
      highRecallPercent: +highRecall.toFixed(2),
      balancedAccuracyPercent: +((lowRecall + highRecall) / 2).toFixed(2)
    });
  }
  return results;
}
