// =============================================
//  stats.js — Statistical utility functions
// =============================================

// Standard normal PDF
function normalPDF(x) {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

// Cumulative standard normal using Hart's approximation
function normalCDF(z) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const poly = t * (0.319381530
    + t * (-0.356563782
    + t * (1.781477937
    + t * (-1.821255978
    + t * 1.330274429))));
  const cdf = 1 - normalPDF(Math.abs(z)) * poly;
  return z >= 0 ? cdf : 1 - cdf;
}

// P-value from z and tail
function calcPValue(z, tail) {
  if (tail === 'left')  return normalCDF(z);
  if (tail === 'right') return 1 - normalCDF(z);
  // two-tailed
  return 2 * (1 - normalCDF(Math.abs(z)));
}

// Critical value(s)
function criticalValues(alpha, tail) {
  if (tail === 'left')  return [zFromAlpha(alpha, 'left')];
  if (tail === 'right') return [zFromAlpha(alpha, 'right')];
  return [zFromAlpha(alpha / 2, 'left'), zFromAlpha(alpha / 2, 'right')];
}

// Inverse normal (simple bisection)
function inverseNorm(p) {
  let lo = -10, hi = 10, mid;
  for (let i = 0; i < 100; i++) {
    mid = (lo + hi) / 2;
    normalCDF(mid) < p ? lo = mid : hi = mid;
  }
  return mid;
}

function zFromAlpha(alpha, tail) {
  if (tail === 'left')  return inverseNorm(alpha);
  if (tail === 'right') return inverseNorm(1 - alpha);
  return inverseNorm(1 - alpha / 2);
}

// z-stat for means
function zStatMean(xbar, mu0, sigma, n) {
  return (xbar - mu0) / (sigma / Math.sqrt(n));
}

// z-stat for proportions
function zStatProp(phat, p0, n) {
  return (phat - p0) / Math.sqrt((p0 * (1 - p0)) / n);
}

// Summary stats for an array
function summaryStats(arr) {
  const n = arr.length;
  const mean = arr.reduce((s, v) => s + v, 0) / n;
  const variance = arr.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1);
  const sd = Math.sqrt(variance);
  const sorted = [...arr].sort((a, b) => a - b);
  const median = n % 2 === 0
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)];
  return { n, mean, sd, median, min: sorted[0], max: sorted[n - 1] };
}

// Proportion summary for a 0/1 array
function proportionStats(arr) {
  const n = arr.length;
  const successes = arr.filter(v => v === 1 || v === '1').length;
  const phat = successes / n;
  return { n, successes, phat };
}

function fmt(v, d = 4) { return Number(v).toFixed(d); }
function fmtP(p) {
  if (p < 0.0001) return '< 0.0001';
  return fmt(p, 4);
}
