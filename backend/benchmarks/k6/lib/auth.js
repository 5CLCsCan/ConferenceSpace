import http from 'k6/http';
import { BASE_URL } from './config.js';

export function getToken() {
  if (__ENV.AUTH_TOKEN) {
    return __ENV.AUTH_TOKEN;
  }
  const payload = JSON.stringify({
    email: 'bench-chair@example.com',
    first_name: 'Bench',
    last_name: 'User',
  });
  const res = http.post(`${BASE_URL}/api/v1/auth/test-login`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (res.status !== 200) {
    throw new Error(`test-login failed (${res.status}): ${res.body}`);
  }
  return JSON.parse(res.body).data.token;
}

export function authHeaders(token) {
  return { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } };
}
