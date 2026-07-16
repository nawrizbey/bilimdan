import { prisma } from '../db';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

/** Generates a unique 6-char class join code (excludes ambiguous chars like
 * 0/O, 1/I, matching the same alphabet battle.ts uses for room codes). */
export async function generateJoinCode(): Promise<string> {
  for (;;) {
    const code = Array.from({ length: CODE_LENGTH }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
    const existing = await prisma.class.findUnique({ where: { joinCode: code }, select: { id: true } });
    if (!existing) return code;
  }
}
