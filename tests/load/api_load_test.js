import http from 'k6/http';
import { check, sleep } from 'k6';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

export let options = {
  stages: [
    { duration: '30s', target: 50 },  
    { duration: '2m', target: 100 },   
    { duration: '30s', target: 150 }, 
    { duration: '1m', target: 150 },
    { duration: '30s', target: 0 },   
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  
    http_req_failed: ['rate<0.01'],   
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:5000';
const JWT_TOKEN = __ENV.JWT_TOKEN || 'test_token';

export default function () {
  const payload = JSON.stringify({
    recipient_id: `user_${__VU}`,
    ciphertext: 'aGVsbG8gd29ybGQ=',  
    iv: '0123456789ab',
    chain_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    previous_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${JWT_TOKEN}`,
    },
  };

  let res = http.post(`${BASE_URL}/relay/send`, payload, params);
  check(res, {
    'send status 201': (r) => r.status === 201,
  });

  if (res.status === 201) {
    const message_id = res.json('message_id');
    if (message_id) {
      let getRes = http.get(`${BASE_URL}/relay/receive/${message_id}`, params);
      check(getRes, {
        'retrieve status 200': (r) => r.status === 200,
      });
    }
  }
  
  sleep(0.5);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'load_test_report.html': htmlReport(data),
  };
}