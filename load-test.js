import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const rbacDuration = new Trend('rbac_duration', true);
const fullApiDuration = new Trend('full_api_duration', true);
const errorRate = new Rate('error_rate');

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '1m', target: 200 },
    { duration: '2m', target: 500 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    full_api_duration: ['p(95)<200'],
    rbac_duration: ['p(95)<5'],
    error_rate: ['rate<0.01'],
  },
};

const BASE_URL = 'http://localhost:3000';

export function setup() {
  const res = http.post(
    BASE_URL + '/api/auth/login',
    JSON.stringify({ email: 'varshad@campuscore.com', password: 'test1234' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  return { token: res.json('data.token') };
}

export default function (data) {
  const headers = {
    Authorization: 'Bearer ' + data.token,
    'Content-Type': 'application/json',
  };

  const rbacStart = Date.now();
  const rbacRes = http.get(BASE_URL + '/api/profile/rbac-bench', { headers });
  rbacDuration.add(Date.now() - rbacStart);

  check(rbacRes, { 'rbac 200': (r) => r.status === 200 });
  errorRate.add(rbacRes.status !== 200);

  const apiStart = Date.now();
  const profileRes = http.get(BASE_URL + '/api/profile/me', { headers });
  fullApiDuration.add(Date.now() - apiStart);

  check(profileRes, { 'profile 200': (r) => r.status === 200 });

  sleep(0.1);
}
