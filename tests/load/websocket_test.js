import WebSocket from 'ws';
import { Counter } from 'k6/metrics';
import { check } from 'k6';

const messagesSent = new Counter('websocket_messages_sent');
const messagesReceived = new Counter('websocket_messages_received');
const errors = new Counter('websocket_errors');

export default function () {
  const url = __ENV.WS_URL || 'ws://localhost:5000/ws';
  const ws = new WebSocket(url);
  const testTimeout = 10000; 
  const startTime = Date.now();
  
  ws.on('open', function open() {

    ws.send(JSON.stringify({
      type: 'auth',
      token: __ENV.JWT_TOKEN || 'test_token'
    }));
    
    for (let i = 0; i < 10; i++) {
      const message = JSON.stringify({
        type: 'test',
        index: i,
        timestamp: Date.now()
      });
      ws.send(message);
      messagesSent.add(1);
      console.log(`Sent message ${i}`);
    }
  });

  ws.on('message', function message(data) {
    messagesReceived.add(1);
    try {
      const msg = JSON.parse(data);
      check(msg, {
        'valid response structure': (m) => 
          m.hasOwnProperty('type') && m.hasOwnProperty('timestamp')
      });
    } catch (e) {
      errors.add(1);
    }
  });
  
  ws.on('error', function error(err) {
    errors.add(1);
    console.error('WebSocket error:', err);
  });
  
  while (Date.now() - startTime < testTimeout) {
  }
  
  ws.close();
}

export function teardown() {
  console.log(`WebSocket test summary:
    Messages sent: ${messagesSent._values[0].values.count}
    Messages received: ${messagesReceived._values[0].values.count}
    Errors: ${errors._values[0].values.count}`);
}