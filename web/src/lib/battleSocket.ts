import { getToken } from './api';
import type { BattleServerMessage } from '../types/api';

// Sockets that have completed the auth handshake (received `auth:ok`) — used
// to hold `queue:join`/`answer:submit` until the server actually knows who
// this connection is, since auth now happens over the first message instead
// of a URL query param (keeps the token out of nginx/server access logs).
const authenticatedSockets = new WeakSet<WebSocket>();

export function connectBattleSocket(onMessage: (msg: BattleServerMessage) => void): WebSocket | null {
  const token = getToken();
  if (!token) return null;

  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${protocol}://${window.location.host}/ws/battle`);

  ws.addEventListener('open', () => {
    ws.send(JSON.stringify({ type: 'auth', token }));
  });

  ws.onmessage = (event) => {
    let msg: { type?: string } & Record<string, unknown>;
    try {
      msg = JSON.parse(event.data);
    } catch {
      return; // ignore malformed frames
    }
    if (msg.type === 'auth:ok') {
      authenticatedSockets.add(ws);
      return;
    }
    onMessage(msg as BattleServerMessage);
  };

  return ws;
}

function sendWhenAuthenticated(ws: WebSocket, payload: unknown) {
  const data = JSON.stringify(payload);
  if (authenticatedSockets.has(ws)) {
    if (ws.readyState === WebSocket.OPEN) ws.send(data);
    return;
  }
  // Auth hasn't completed yet (e.g. called right on `open`, before the
  // server's `auth:ok` round-trip) — wait for it, same as the old
  // "queue on open" behavior just gated one round-trip later.
  const onAuthOk = (event: MessageEvent) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === 'auth:ok') {
        ws.removeEventListener('message', onAuthOk);
        ws.send(data);
      }
    } catch {
      // ignore malformed frames
    }
  };
  ws.addEventListener('message', onAuthOk);
}

export function sendQueueJoin(ws: WebSocket) {
  sendWhenAuthenticated(ws, { type: 'queue:join' });
}

export function sendAnswer(ws: WebSocket, qIndex: number, choice: number) {
  sendWhenAuthenticated(ws, { type: 'answer:submit', qIndex, choice });
}

export function sendRoomCreate(ws: WebSocket) {
  sendWhenAuthenticated(ws, { type: 'room:create' });
}

export function sendRoomJoin(ws: WebSocket, code: string) {
  sendWhenAuthenticated(ws, { type: 'room:join', code });
}
