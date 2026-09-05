#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const MACHINE_ID = 'S_REVUE_STARLIGHT_CX_TEST_V66';
const rates = {
  SET_1: 1 / 265.9,
  SET_2: 1 / 254.7,
  SET_4: 1 / 207.6,
  SET_5: 1 / 190.3,
  SET_6: 1 / 179.5,
};
const dispersions = [50, 20, 10, 5];
const scenarios = [
  [1500, 2], [1500, 8], [1500, 12],
  [3000, 6], [3000, 16], [3000, 22],
  [7000, 18], [7000, 39], [7000, 50],
];

function logGamma(z) {
  const c = [
    676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012,
    9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (z < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
  z -= 1;
  let x = 0.99999999999980993;
  for (let i = 0; i < c.length; i += 1) x += c[i] / (z + i + 1);
  const t = z + c.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function logPoisson(k, mu) {
  return k * Math.log(mu) - mu - logGamma(k + 1);
}

function logNegativeBinomial(k, mu, dispersion) {
  const r = dispersion;
  const p = r / (r + mu);
  return logGamma(k + r) - logGamma(r) - logGamma(k + 1)
    + r * Math.log(p) + k * Math.log(1 - p);
}

function posterior(games, czCount, dispersion = null) {
  const logs = Object.fromEntries(Object.entries(rates).map(([setting, rate]) => {
    const mu = games * rate;
    const logL = dispersion === null
      ? logPoisson(czCount, mu)
      : logNegativeBinomial(czCount, mu, dispersion);
    return [setting, logL];
  }));
  const maxLog = Math.max(...Object.values(logs));
  const rel = Object.fromEntries(Object.entries(logs).map(([setting, value]) => [setting, Math.exp(value - maxLog)]));
  const z = Object.values(rel).reduce((a, b) => a + b, 0);
  return Object.fromEntries(Object.entries(rel).map(([setting, value]) => [setting, Number((value / z).toFixed(6))]));
}

const report = {
  schemaVersion: 'overdispersion-sensitivity-v1',
  machineId: MACHINE_ID,
  generatedAt: new Date().toISOString(),
  status: 'RESEARCH_ONLY_NO_INFERENCE_CHANGE',
  purpose: 'Compare current Poisson CZ likelihood with Negative Binomial alternatives while preserving published setting-specific CZ means.',
  publishedCzRatesPerGame: Object.fromEntries(Object.entries(rates).map(([k, v]) => [k, Number(v.toFixed(12))])),
  models: {
    poisson: { variance: 'mu', role: 'current baseline' },
    negativeBinomial: dispersions.map((k) => ({ k, variance: 'mu + mu^2/k', role: 'sensitivity only' })),
  },
  assumptions: [
    'Published CZ rates are treated as marginal rates including AT-end high-table effects.',
    'AT-after CZs are not subtracted from the published mean.',
    'Negative Binomial k values are sensitivity parameters, not estimated machine facts.',
    'Equal setting priors are used in this report to isolate likelihood-shape effects.',
  ],
  scenarios: scenarios.map(([games, czCount]) => ({
    games,
    czCount,
    posterior: {
      poisson: posterior(games, czCount),
      ...Object.fromEntries(dispersions.map((k) => [`nb_k_${k}`, posterior(games, czCount, k)])),
    },
  })),
  decision: {
    result: 'DO_NOT_REPLACE_POISSON_YET',
    reason: 'Sensitivity analysis confirms that plausible overdispersion materially softens extreme CZ evidence, but k cannot be identified from currently verified public information.',
    nextEvidenceNeeded: [
      'setting-confirmed play logs with total normal games, CZ count, and AT count',
      'preferably event order or AT-end markers to estimate within-session clustering / feedback',
      'enough sessions to estimate variance beyond Poisson after accounting for setting-specific mean',
    ],
    testPackageAction: 'Keep inference package unchanged; retain diagnostic CZ-success/failure and AT counts for data collection.',
  },
};

const outPath = process.argv[2] ?? path.join('research', MACHINE_ID, 'overdispersion-sensitivity-v66.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`WROTE ${outPath}`);
