import { Router } from 'express';
import { prisma } from '../db';
import { hashPassword, signToken, verifyPassword } from '../lib/auth';
import { badRequest, conflict, notFound, unauthorized } from '../lib/errors';
import { serializeUser } from '../lib/serialize';
import { requireAuth } from '../middleware/auth';

export const authRouter = Router();

const userInclude = { region: true, district: true, school: true } as const;

authRouter.post('/signup', async (req, res, next) => {
  try {
    const { fullName, username, password, grade, regionId, districtId, schoolId } = req.body ?? {};

    if (typeof fullName !== 'string' || fullName.trim().split(/\s+/).length < 2) {
      throw badRequest("Ism va familiyangizni to'liq kiriting", 'INVALID_FULL_NAME');
    }
    if (typeof username !== 'string' || username.trim().length < 3) {
      throw badRequest("Foydalanuvchi nomi kamida 3 ta belgidan iborat bo'lsin", 'INVALID_USERNAME');
    }
    if (typeof password !== 'string' || password.length < 6) {
      throw badRequest("Parol kamida 6 ta belgidan iborat bo'lsin", 'INVALID_PASSWORD');
    }
    if (grade !== '5' && grade !== '6') {
      throw badRequest('Sinfni tanlang', 'INVALID_GRADE');
    }
    const regionIdNum = Number(regionId);
    const districtIdNum = Number(districtId);
    const schoolIdNum = Number(schoolId);
    if (!regionIdNum || !districtIdNum || !schoolIdNum) {
      throw badRequest('Hudud va maktabni tanlang', 'INVALID_LOCATION');
    }

    const [region, district, school] = await Promise.all([
      prisma.region.findUnique({ where: { id: regionIdNum } }),
      prisma.district.findUnique({ where: { id: districtIdNum } }),
      prisma.school.findUnique({ where: { id: schoolIdNum } }),
    ]);
    if (!region || !district || !school) {
      throw badRequest("Hudud yoki maktab ma'lumotlari noto'g'ri", 'INVALID_LOCATION');
    }
    if (district.regionId !== region.id) {
      throw badRequest('Tanlangan tuman ushbu viloyatga tegishli emas', 'INVALID_LOCATION');
    }
    if (school.districtId !== district.id) {
      throw badRequest('Tanlangan maktab ushbu tumanga tegishli emas', 'INVALID_LOCATION');
    }

    const existing = await prisma.user.findUnique({ where: { username: username.trim() } });
    if (existing) {
      throw conflict('Bu foydalanuvchi nomi band');
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        passwordHash,
        fullName: fullName.trim(),
        grade,
        regionId: regionIdNum,
        districtId: districtIdNum,
        schoolId: schoolIdNum,
        lastLoginAt: new Date(),
      },
      include: userInclude,
    });

    const token = signToken({ userId: user.id });
    res.status(201).json({ token, user: serializeUser(user) });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body ?? {};
    if (typeof username !== 'string' || typeof password !== 'string') {
      throw badRequest("Foydalanuvchi nomi va parolni kiriting", 'INVALID_CREDENTIALS');
    }

    const user = await prisma.user.findUnique({ where: { username: username.trim() }, include: userInclude });
    if (!user) {
      throw unauthorized("Foydalanuvchi nomi yoki parol noto'g'ri");
    }
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw unauthorized("Foydalanuvchi nomi yoki parol noto'g'ri");
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
      include: userInclude,
    });

    const token = signToken({ userId: updated.id });
    res.json({ token, user: serializeUser(updated) });
  } catch (err) {
    next(err);
  }
});

authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId }, include: userInclude });
    if (!user) throw notFound('Foydalanuvchi topilmadi');
    res.json({ user: serializeUser(user) });
  } catch (err) {
    next(err);
  }
});
