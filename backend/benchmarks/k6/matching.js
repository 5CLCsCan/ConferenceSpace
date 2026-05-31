import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, baseOptions } from './lib/config.js';
import { getToken, authHeaders } from './lib/auth.js';
import { writeSummaries } from './lib/summary.js';
import { pickConferenceID } from './lib/seed.js';

export const options = baseOptions();

export function setup() {
  return { token: getToken() };
}

export default function (data) {
  const h = authHeaders(data.token);
  const confID = pickConferenceID();
  const res = http.get(
    `${BASE_URL}/api/v1/conferences/${confID}/reviewer-suggestions`,
    h,
  );
  check(res, { 'suggestions 200': (r) => r.status === 200 });
}

export function handleSummary(data) {
  return writeSummaries(data, 'matching', { scenario: 'matching' });
}
