// Lightweight summary formatter (avoids external jslib CDN dependency).

function durationMetrics(m) {
  if (!m.http_req_duration) return {};
  const v = m.http_req_duration.values;
  return {
    min_ms: v.min,
    med_ms: v.med,
    max_ms: v.max,
    p90_ms: v['p(90)'],
    p95_ms: v['p(95)'],
    p99_ms: v['p(99)'],
    avg_ms: v.avg,
  };
}

export function metricSummary(data, extra = {}) {
  const m = data.metrics;
  return {
    generated_at: new Date().toISOString(),
    http_reqs: {
      count: m.http_reqs ? m.http_reqs.values.count : 0,
      rate_per_sec: m.http_reqs ? m.http_reqs.values.rate : 0,
    },
    http_req_failed_rate: m.http_req_failed ? m.http_req_failed.values.rate : 0,
    http_req_duration: durationMetrics(m),
    checks: m.checks
      ? { passes: m.checks.values.passes, fails: m.checks.values.fails }
      : undefined,
    ...extra,
  };
}

export function summaryJSON(data, extra = {}) {
  return JSON.stringify(metricSummary(data, extra), null, 2);
}

export function fullJSON(data) {
  return JSON.stringify(data, null, 2);
}

export function textSummary(data) {
  const s = metricSummary(data);
  const d = s.http_req_duration || {};
  return [
    'k6 summary',
    `  http_reqs: ${s.http_reqs.count} (${s.http_reqs.rate_per_sec.toFixed(2)}/s)`,
    `  http_req_failed: ${(s.http_req_failed_rate * 100).toFixed(2)}%`,
    `  http_req_duration: med=${d.med_ms || 0}ms p(90)=${d.p90_ms || 0}ms p(95)=${d.p95_ms || 0}ms`,
  ].join('\n');
}

export function writeSummaries(data, prefix, extra = {}) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const base = `benchmarks/results/${prefix}-${ts}`;
  return {
    [`${base}.summary.json`]: summaryJSON(data, extra),
    [`${base}.full.json`]: fullJSON(data),
    stdout: textSummary(data),
  };
}
