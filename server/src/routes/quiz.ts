import { Router } from 'express';
import { prisma } from '../db';
import { requireAuth } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';
import { awardProgress } from '../lib/progress';
import { badRequest, notFound } from '../lib/errors';

export const quizRouter = Router();

const QUESTION_MINUTES = 1;
const QUIZ_CORRECT_XP = 15;

quizRouter.get('/', requireAuth, async (_req, res, next) => {
  try {
    const questions = await prisma.quizQuestion.findMany({ orderBy: { order: 'asc' } });
    res.json({ questions });
  } catch (err) {
    next(err);
  }
});

quizRouter.post('/answer', requireAuth, rateLimit(30, 60_000), async (req, res, next) => {
  try {
    const { questionId, picked } = req.body ?? {};
    const questionIdNum = Number(questionId);
    if (!questionIdNum || typeof picked !== 'number') throw badRequest("Javob noto'g'ri");

    const question = await prisma.quizQuestion.findUnique({ where: { id: questionIdNum } });
    if (!question) throw notFound('Savol topilmadi');

    const correct = picked === question.correctIndex;
    const user = await awardProgress(req.userId!, {
      minutes: QUESTION_MINUTES,
      xpGain: correct ? QUIZ_CORRECT_XP : 0,
    });

    res.json({ correct, user });
  } catch (err) {
    next(err);
  }
});
