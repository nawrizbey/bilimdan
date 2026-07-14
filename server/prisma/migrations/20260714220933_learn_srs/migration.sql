-- AlterTable
ALTER TABLE "UserWordProgress" ADD COLUMN     "difficulty" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "due" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "elapsedDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "lapses" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastReview" TIMESTAMP(3),
ADD COLUMN     "learningSteps" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reps" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "scheduledDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "stability" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "state" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "LearnSession" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "unitId" INTEGER,
    "lessonIndex" INTEGER,
    "items" JSONB NOT NULL,
    "answered" JSONB NOT NULL DEFAULT '[]',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "xpAwarded" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LearnSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LearnSession_userId_completedAt_idx" ON "LearnSession"("userId", "completedAt");

-- CreateIndex
CREATE INDEX "UserWordProgress_userId_due_idx" ON "UserWordProgress"("userId", "due");

-- AddForeignKey
ALTER TABLE "LearnSession" ADD CONSTRAINT "LearnSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill: words already marked `known` under the old model skip straight into
-- the review queue (due now) instead of being re-taught as brand-new words.
UPDATE "UserWordProgress"
SET
  "level" = 3,
  "state" = 2,
  "stability" = 14,
  "difficulty" = 5,
  "reps" = 1,
  "due" = CURRENT_TIMESTAMP,
  "lastReview" = CURRENT_TIMESTAMP
WHERE "known" = true;
