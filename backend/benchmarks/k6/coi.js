import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, baseOptions } from './lib/config.js';
import { getToken, authHeaders } from './lib/auth.js';
import { writeSummaries } from './lib/summary.js';
import { pickCOITarget } from './lib/seed.js';

export const options = baseOptions();

export function setup() {
  return { token: getToken() };
}

export default function (data) {
  const h = authHeaders(data.token);
  const t = pickCOITarget();
  const path = `/api/v1/coi/check/reviewer/${t.reviewerID}/author/${encodeURIComponent(t.authorEmail)}?conference_id=${t.confID}`;
  const res = http.get(`${BASE_URL}${path}`, h);
  check(res, { 'coi check 200': (r) => r.status === 200 });
}

export function handleSummary(data) {
  return writeSummaries(data, 'coi', { scenario: 'coi' });
}
