import http from 'k6/http';
import { check, group } from 'k6';
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

  group('list conferences', () => {
    const res = http.get(`${BASE_URL}/api/v1/conferences?limit=50&offset=0`, h);
    check(res, { 'conferences 200': (r) => r.status === 200 });
  });

  group('list submissions', () => {
    const res = http.get(
      `${BASE_URL}/api/v1/conferences/${confID}/submissions?limit=50&offset=0`,
      h,
    );
    check(res, { 'submissions 200': (r) => r.status === 200 });
  });

  group('search users', () => {
    const res = http.get(`${BASE_URL}/api/v1/users/search?q=bench&limit=50`, h);
    check(res, { 'users 200': (r) => r.status === 200 });
  });
}

export function handleSummary(data) {
  return writeSummaries(data, 'crud', { scenario: 'crud' });
}
