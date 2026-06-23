import { getToken } from './api';
import type { BattleServerMessage } from '../types/api';

export function connectBattleSocket(onMessage: (msg: BattleServerMessage) => void): WebSocket | null {
  const token = getToken();
  if (!token) return null;

  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${protocol}://${window.location.host}/ws/battle?token=${encodeURIComponent(token)}`);

  ws.onmessage = (event) => {
    try {
      onMessage(JSON.parse(event.data));
    } catch {
      // ignore malformed frames
    }
  };

  return ws;
}

function sendWhenOpen(ws: WebSocket, payload: unknown) {
  const data = JSON.stringify(payload);
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(data);
  } else {
    ws.addEventListener('open', () => ws.send(data), { once: true });
  }
}

export function sendQueueJoin(ws: WebSocket) {
  sendWhenOpen(ws, { type: 'queue:join' });
}

export function sendAnswer(ws: WebSocket, qIndex: number, choice: number) {
  sendWhenOpen(ws, { type: 'answer:submit', qIndex, choice });
}
