import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'node:http';
import type { ErrorRequestHandler } from 'express';
import { authRouter } from './routes/auth';
import { locationsRouter } from './routes/locations';
import { unitsRouter } from './routes/units';
import { quizRouter } from './routes/quiz';
import { listenRouter } from './routes/listen';
import { learnRouter } from './routes/learn';
import { speakRouter } from './routes/speak';
import { profileRouter } from './routes/profile';
import { leaderboardRouter } from './routes/leaderboard';
import { badgesRouter } from './routes/badges';
import { setupBattleWebSocket } from './ws/battle';
import { AppError } from './lib/errors';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRouter);
app.use('/api/locations', locationsRouter);
app.use('/api/units', unitsRouter);
app.use('/api/quiz', quizRouter);
app.use('/api/listen', listenRouter);
app.use('/api/learn', learnRouter);
app.use('/api/speak', speakRouter);
app.use('/api', profileRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/badges', badgesRouter);

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }
  console.error(err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Serverda xatolik yuz berdi' } });
};
app.use(errorHandler);

const port = Number(process.env.PORT) || 4000;
const server = http.createServer(app);
setupBattleWebSocket(server);

server.listen(port, () => {
  console.log(`Bilimdon API listening on http://localhost:${port}`);
});
