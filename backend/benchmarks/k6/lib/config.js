export const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
export const VUS = parseInt(__ENV.VUS || '20', 10);
export const DURATION = __ENV.DURATION || '30s';

export function baseOptions() {
  return {
    vus: VUS,
    duration: DURATION,
    thresholds: {
      http_req_failed: [{ threshold: 'rate<0.05', abortOnFail: false }],
      http_req_duration: [{ threshold: 'p(95)<2000', abortOnFail: false }],
    },
  };
}
