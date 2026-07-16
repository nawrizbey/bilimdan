import type { Server as HttpServer } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { URL } from 'node:url';
import { prisma } from '../db';
import { verifyToken } from '../lib/auth';
import { awardProgress } from '../lib/progress';

const QUESTION_SECONDS = 10;
const MATCH_START_DELAY_MS = 3000;
const REVEAL_DELAY_MS = 1500;
const QUESTION_MINUTES = 1;
const BATTLE_WIN_XP = 40;
const BATTLE_DRAW_XP = 15;
const BATTLE_LOSS_XP = 5;
const RECONNECT_GRACE_MS = 18_000;
const HEARTBEAT_MS = 20_000;
const BOT_MATCH_DELAY_MS = 8_000;
const BOT_USER_ID = -1;
const BOT_CORRECT_PROBABILITY = 0.55;
const AUTH_TIMEOUT_MS = 5_000;
const ROOM_TTL_MS = 10 * 60 * 1000;
const ROOM_CODE_LENGTH = 4;
// Excludes 0/O and 1/I — easy to misread aloud or mistype when a kid is
// reading the code out to a friend across the room.
const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const PRIVATE_XP_FACTOR = 0.5;

interface PlayerInfo {
  userId: number;
  name: string;
  initial: string;
}

interface Connection extends PlayerInfo {
  ws: WebSocket | null;
  alive: boolean;
  isBot?: boolean;
}

const BOT_CONNECTION: Connection = { userId: BOT_USER_ID, name: 'Jasur', initial: 'J', ws: null, alive: true, isBot: true };

interface BattleQuestionRow {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
}

interface ActiveMatch {
  id: number;
  questions: BattleQuestionRow[];
  qIndex: number;
  players: [Connection, Connection];
  scores: Record<number, number>;
  answered: Record<number, number | undefined>; // questionId not needed; reset per question
  questionTimer: ReturnType<typeof setTimeout> | null;
  revealTimer: ReturnType<typeof setTimeout> | null;
  forfeitTimers: Record<number, ReturnType<typeof setTimeout> | undefined>;
  ended: boolean;
  isPrivate: boolean;
}

interface OpenRoom {
  code: string;
  creatorConn: Connection;
  createdAt: number;
  claimed: boolean;
  ttlTimer: ReturnType<typeof setTimeout>;
}

const waitingQueue: Connection[] = [];
const userConnections = new Map<number, Connection>();
const userToMatchId = new Map<number, number>();
const activeMatches = new Map<number, ActiveMatch>();
const botFallbackTimers = new Map<number, ReturnType<typeof setTimeout>>();
// Private-room codes waiting for a friend to join — see room:create/room:join.
const openRooms = new Map<string, OpenRoom>();
// userIds synchronously claimed by tryMatchmake but not yet reflected in
// userToMatchId, since startMatch sets that only after awaiting the DB. Without
// this, the second player to join a pair can race past the `userToMatchId.has`
// check in the queue:join handler and schedule a spurious bot-fallback timer
// that later hijacks them into a second, bogus match.
const pairingInProgress = new Set<number>();

function clearBotFallback(userId: number) {
  const t = botFallbackTimers.get(userId);
  if (t) {
    clearTimeout(t);
    botFallbackTimers.delete(userId);
  }
}

function send(conn: Connection, payload: unknown) {
  if (conn.isBot || !conn.ws) return;
  if (conn.ws.readyState === WebSocket.OPEN) {
    conn.ws.send(JSON.stringify(payload));
  }
}

function opponentOf(match: ActiveMatch, userId: number): Connection {
  const [a, b] = match.players;
  return a.userId === userId ? b : a;
}

function removeFromQueue(conn: Connection) {
  const idx = waitingQueue.indexOf(conn);
  if (idx !== -1) waitingQueue.splice(idx, 1);
}

function generateRoomCode(): string {
  let code: string;
  do {
    code = Array.from({ length: ROOM_CODE_LENGTH }, () => ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)]).join('');
  } while (openRooms.has(code));
  return code;
}

/** Drops any still-open (unclaimed) room this connection created — called on
 * disconnect so a player who closes the tab before a friend joins doesn't
 * leave a stale code sitting around for the rest of its TTL. */
function removeOpenRoomsCreatedBy(conn: Connection) {
  for (const [code, room] of openRooms) {
    if (room.creatorConn === conn && !room.claimed) {
      clearTimeout(room.ttlTimer);
      openRooms.delete(code);
    }
  }
}

async function loadPlayerInfo(userId: number): Promise<PlayerInfo> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const first = user.fullName.trim().split(/\s+/)[0] ?? user.username;
  return { userId, name: first, initial: first.charAt(0).toUpperCase() };
}

async function startMatch(p1: Connection, p2: Connection, isPrivate = false) {
  clearBotFallback(p1.userId);
  clearBotFallback(p2.userId);

  const questions = await prisma.battleQuestion.findMany({ orderBy: { order: 'asc' }, take: 3 });
  const dbMatch = await prisma.battleMatch.create({
    data: {
      player1Id: p1.userId,
      player2Id: p2.isBot ? null : p2.userId,
      isBot: !!p2.isBot,
      status: 'active',
      questionIds: questions.map((q) => q.id),
    },
  });

  const match: ActiveMatch = {
    id: dbMatch.id,
    questions,
    qIndex: 0,
    players: [p1, p2],
    scores: { [p1.userId]: 0, [p2.userId]: 0 },
    answered: {},
    questionTimer: null,
    revealTimer: null,
    forfeitTimers: {},
    ended: false,
    isPrivate,
  };
  activeMatches.set(match.id, match);
  if (!p1.isBot) userToMatchId.set(p1.userId, match.id);
  if (!p2.isBot) userToMatchId.set(p2.userId, match.id);
  pairingInProgress.delete(p1.userId);
  pairingInProgress.delete(p2.userId);

  send(p1, {
    type: 'match:found',
    matchId: match.id,
    opponent: { name: p2.name, initial: p2.initial },
    startsInMs: MATCH_START_DELAY_MS,
    yourScore: match.scores[p1.userId],
    oppScore: match.scores[p2.userId],
  });
  send(p2, {
    type: 'match:found',
    matchId: match.id,
    opponent: { name: p1.name, initial: p1.initial },
    startsInMs: MATCH_START_DELAY_MS,
    yourScore: match.scores[p2.userId],
    oppScore: match.scores[p1.userId],
  });

  setTimeout(() => startQuestion(match), MATCH_START_DELAY_MS);
}

function startQuestion(match: ActiveMatch) {
  if (match.ended) return;
  match.answered = {};
  const qIndexAtStart = match.qIndex;
  const q = match.questions[match.qIndex];
  const deadline = Date.now() + QUESTION_SECONDS * 1000;

  for (const p of match.players) {
    send(p, {
      type: 'question:start',
      qIndex: match.qIndex,
      question: { id: q.id, question: q.question, options: q.options },
      deadline,
    });
  }

  const bot = match.players.find((p) => p.isBot);
  if (bot) {
    const thinkMs = 1500 + Math.random() * 6000;
    setTimeout(() => {
      if (match.ended || match.qIndex !== qIndexAtStart || match.answered[bot.userId] !== undefined) return;
      const correct = Math.random() < BOT_CORRECT_PROBABILITY;
      const choice = correct ? q.correctIndex : (q.correctIndex + 1 + Math.floor(Math.random() * (q.options.length - 1))) % q.options.length;
      match.answered[bot.userId] = choice;
      const [p1, p2] = match.players;
      if (match.answered[p1.userId] !== undefined && match.answered[p2.userId] !== undefined) {
        revealQuestion(match);
      }
    }, thinkMs);
  }

  match.questionTimer = setTimeout(() => revealQuestion(match), QUESTION_SECONDS * 1000);
}

function revealQuestion(match: ActiveMatch) {
  if (match.ended) return;
  if (match.questionTimer) {
    clearTimeout(match.questionTimer);
    match.questionTimer = null;
  }

  const q = match.questions[match.qIndex];
  const [p1, p2] = match.players;
  const p1Choice = match.answered[p1.userId] ?? null;
  const p2Choice = match.answered[p2.userId] ?? null;
  if (p1Choice === q.correctIndex) match.scores[p1.userId] += 1;
  if (p2Choice === q.correctIndex) match.scores[p2.userId] += 1;

  send(p1, {
    type: 'question:reveal',
    qIndex: match.qIndex,
    correctIndex: q.correctIndex,
    yourChoice: p1Choice,
    oppChoice: p2Choice,
    yourScore: match.scores[p1.userId],
    oppScore: match.scores[p2.userId],
  });
  send(p2, {
    type: 'question:reveal',
    qIndex: match.qIndex,
    correctIndex: q.correctIndex,
    yourChoice: p2Choice,
    oppChoice: p1Choice,
    yourScore: match.scores[p2.userId],
    oppScore: match.scores[p1.userId],
  });

  match.revealTimer = setTimeout(() => {
    match.qIndex += 1;
    if (match.qIndex >= match.questions.length) {
      void endMatch(match);
    } else {
      startQuestion(match);
    }
  }, REVEAL_DELAY_MS);
}

async function endMatch(match: ActiveMatch, abandonedBy?: number) {
  if (match.ended) return;
  match.ended = true;
  if (match.questionTimer) clearTimeout(match.questionTimer);
  if (match.revealTimer) clearTimeout(match.revealTimer);
  for (const t of Object.values(match.forfeitTimers)) if (t) clearTimeout(t);

  const [p1, p2] = match.players;
  let winnerId: number | null = null;
  if (abandonedBy != null) {
    winnerId = abandonedBy === p1.userId ? p2.userId : p1.userId;
  } else if (match.scores[p1.userId] > match.scores[p2.userId]) {
    winnerId = p1.userId;
  } else if (match.scores[p2.userId] > match.scores[p1.userId]) {
    winnerId = p2.userId;
  }

  await prisma.battleMatch.update({
    where: { id: match.id },
    data: {
      status: abandonedBy != null ? 'abandoned' : 'completed',
      player1Score: match.scores[p1.userId],
      player2Score: match.scores[p2.userId],
      winnerId,
      endedAt: new Date(),
    },
  });

  for (const p of match.players) {
    if (p.isBot) continue;
    const isWinner = winnerId === p.userId;
    const isDraw = winnerId === null;
    const baseXp = isDraw ? BATTLE_DRAW_XP : isWinner ? BATTLE_WIN_XP : BATTLE_LOSS_XP;
    // Halved for private matches — otherwise two friends could farm XP by
    // repeatedly battling each other instead of the shared matchmaking pool.
    const xpAwarded = match.isPrivate ? Math.round(baseXp * PRIVATE_XP_FACTOR) : baseXp;
    const counterField = isDraw ? 'battleDraws' : isWinner ? 'battleWins' : 'battleLosses';
    const user = await awardProgress(p.userId, {
      xpGain: xpAwarded,
      extra: { [counterField]: { increment: 1 } },
    });
    send(p, {
      type: 'match:end',
      winnerId,
      finalScores: { yours: match.scores[p.userId], opponent: match.scores[opponentOf(match, p.userId).userId] },
      xpAwarded,
      user,
    });
  }

  userToMatchId.delete(p1.userId);
  userToMatchId.delete(p2.userId);
  activeMatches.delete(match.id);
}

function tryMatchmake() {
  while (waitingQueue.length >= 2) {
    const p1 = waitingQueue.shift()!;
    const p2 = waitingQueue.shift()!;
    // Claim both players synchronously, before startMatch's first await, so a
    // queue:join handler racing for the same tick sees the pairing immediately.
    pairingInProgress.add(p1.userId);
    pairingInProgress.add(p2.userId);
    void startMatch(p1, p2);
  }
}

function scheduleBotFallback(conn: Connection) {
  clearBotFallback(conn.userId);
  botFallbackTimers.set(
    conn.userId,
    setTimeout(() => {
      botFallbackTimers.delete(conn.userId);
      removeFromQueue(conn);
      void startMatch(conn, BOT_CONNECTION);
    }, BOT_MATCH_DELAY_MS),
  );
}

function handleRoomCreate(conn: Connection) {
  if (userToMatchId.has(conn.userId) || pairingInProgress.has(conn.userId)) return; // already in/entering a match
  const code = generateRoomCode();
  const room: OpenRoom = {
    code,
    creatorConn: conn,
    createdAt: Date.now(),
    claimed: false,
    ttlTimer: setTimeout(() => {
      const current = openRooms.get(code);
      if (current && !current.claimed) openRooms.delete(code);
    }, ROOM_TTL_MS),
  };
  openRooms.set(code, room);
  send(conn, { type: 'room:created', code });
}

function handleRoomJoin(conn: Connection, data: { code?: unknown }) {
  if (userToMatchId.has(conn.userId) || pairingInProgress.has(conn.userId)) return; // already in/entering a match
  const code = typeof data.code === 'string' ? data.code.toUpperCase() : '';
  const room = openRooms.get(code);
  if (!room) {
    send(conn, { type: 'room:not_found' });
    return;
  }
  if (room.claimed) {
    send(conn, { type: 'room:full' });
    return;
  }
  if (room.creatorConn.userId === conn.userId) {
    send(conn, { type: 'room:not_found' }); // can't join your own room
    return;
  }

  // Claim synchronously — before startMatch's first await — so a second
  // room:join racing for the same code (or the creator's own queue:join)
  // can't slip past the check above during the DB round trip.
  room.claimed = true;
  clearTimeout(room.ttlTimer);
  openRooms.delete(code);
  pairingInProgress.add(room.creatorConn.userId);
  pairingInProgress.add(conn.userId);
  void startMatch(room.creatorConn, conn, true);
}

function handleAnswerSubmit(conn: Connection, data: { qIndex?: number; choice?: number }) {
  const matchId = userToMatchId.get(conn.userId);
  if (matchId == null) return;
  const match = activeMatches.get(matchId);
  if (!match || match.ended) return;
  if (data.qIndex !== match.qIndex) return; // stale/late answer for a past question
  if (match.answered[conn.userId] !== undefined) return; // already answered
  const optionCount = match.questions[match.qIndex]?.options.length ?? 0;
  if (typeof data.choice !== 'number' || !Number.isInteger(data.choice) || data.choice < 0 || data.choice >= optionCount) return;

  match.answered[conn.userId] = data.choice;
  void awardProgress(conn.userId, { minutes: QUESTION_MINUTES });

  const [p1, p2] = match.players;
  if (match.answered[p1.userId] !== undefined && match.answered[p2.userId] !== undefined) {
    revealQuestion(match);
  }
}

function handleDisconnect(conn: Connection) {
  removeFromQueue(conn);
  clearBotFallback(conn.userId);
  removeOpenRoomsCreatedBy(conn);
  if (userConnections.get(conn.userId) === conn) {
    userConnections.delete(conn.userId);
  }

  const matchId = userToMatchId.get(conn.userId);
  if (matchId == null) return;
  const match = activeMatches.get(matchId);
  if (!match || match.ended) return;

  match.forfeitTimers[conn.userId] = setTimeout(() => {
    void endMatch(match, conn.userId);
  }, RECONNECT_GRACE_MS);
}

function tryResume(conn: Connection): boolean {
  const matchId = userToMatchId.get(conn.userId);
  if (matchId == null) return false;
  const match = activeMatches.get(matchId);
  if (!match || match.ended) return false;

  const forfeitTimer = match.forfeitTimers[conn.userId];
  if (forfeitTimer) {
    clearTimeout(forfeitTimer);
    match.forfeitTimers[conn.userId] = undefined;
  }

  // Swap in the new connection object for this player.
  const idx = match.players[0].userId === conn.userId ? 0 : 1;
  match.players[idx] = conn;

  const opponent = opponentOf(match, conn.userId);
  send(conn, {
    type: 'match:found',
    matchId: match.id,
    opponent: { name: opponent.name, initial: opponent.initial },
    startsInMs: 0,
    yourScore: match.scores[conn.userId],
    oppScore: match.scores[opponent.userId],
  });

  if (match.qIndex < match.questions.length) {
    const q = match.questions[match.qIndex];
    const deadline = Date.now() + QUESTION_SECONDS * 1000; // approximate remaining time on resume
    send(conn, {
      type: 'question:start',
      qIndex: match.qIndex,
      question: { id: q.id, question: q.question, options: q.options },
      deadline,
    });
  }
  return true;
}

export function setupBattleWebSocket(server: HttpServer) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url ?? '', 'http://localhost');
    if (url.pathname !== '/ws/battle') return;
    // No token check here — the connection upgrades bare and must authenticate
    // via a first-message `{ type: 'auth', token }` frame instead of a query
    // param, so the token never lands in nginx/server access logs.
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws);
    });
  });

  wss.on('connection', (ws: WebSocket) => {
    let authTimer: ReturnType<typeof setTimeout> | null = setTimeout(() => ws.close(), AUTH_TIMEOUT_MS);

    const onAuthMessage = async (raw: Buffer | ArrayBuffer | Buffer[]) => {
      let data: { type?: string; token?: string };
      try {
        data = JSON.parse(raw.toString());
      } catch {
        return;
      }
      if (data.type !== 'auth' || typeof data.token !== 'string') return; // wait for a real auth frame; ignore anything else

      if (authTimer) {
        clearTimeout(authTimer);
        authTimer = null;
      }
      ws.off('message', onAuthMessage);

      let userId: number;
      try {
        userId = verifyToken(data.token).userId;
      } catch {
        ws.close();
        return;
      }

      let info: PlayerInfo;
      try {
        info = await loadPlayerInfo(userId);
      } catch {
        ws.close();
        return;
      }

      // Replace any prior stale connection for this user (e.g. duplicate tab).
      const existing = userConnections.get(userId);
      if (existing && existing.ws && existing.ws !== ws) {
        existing.ws.close();
      }

      const conn: Connection = { ...info, ws, alive: true };
      userConnections.set(userId, conn);

      ws.on('pong', () => {
        conn.alive = true;
      });

      send(conn, { type: 'auth:ok' });
      tryResume(conn); // no-op (returns false) if there's no match to resume into

      ws.on('message', (raw2) => {
        let msg: { type?: string; [key: string]: unknown };
        try {
          msg = JSON.parse(raw2.toString());
        } catch {
          return;
        }

        if (msg.type === 'queue:join') {
          if (userToMatchId.has(userId) || pairingInProgress.has(userId)) return; // already in/entering a match
          removeFromQueue(conn);
          waitingQueue.push(conn);
          send(conn, { type: 'queue:waiting' });
          tryMatchmake();
          if (!userToMatchId.has(userId) && !pairingInProgress.has(userId)) scheduleBotFallback(conn);
        } else if (msg.type === 'answer:submit') {
          handleAnswerSubmit(conn, msg as { qIndex?: number; choice?: number });
        } else if (msg.type === 'room:create') {
          handleRoomCreate(conn);
        } else if (msg.type === 'room:join') {
          handleRoomJoin(conn, msg as { code?: unknown });
        }
      });

      ws.on('close', () => handleDisconnect(conn));
    };

    ws.on('message', onAuthMessage);
    ws.on('close', () => {
      if (authTimer) clearTimeout(authTimer);
    });
  });

  const heartbeat = setInterval(() => {
    for (const conn of userConnections.values()) {
      if (!conn.ws) continue;
      if (!conn.alive) {
        conn.ws.terminate();
        continue;
      }
      conn.alive = false;
      conn.ws.ping();
    }
  }, HEARTBEAT_MS);
  wss.on('close', () => clearInterval(heartbeat));

  return wss;
}
