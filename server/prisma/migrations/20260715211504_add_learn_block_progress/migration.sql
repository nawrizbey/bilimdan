-- AlterTable
ALTER TABLE "LearnSession" ADD COLUMN     "block" TEXT;

-- CreateTable
CREATE TABLE "LearnBlockProgress" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "unitId" INTEGER NOT NULL,
    "lessonIndex" INTEGER NOT NULL,
    "block" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearnBlockProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LearnBlockProgress_userId_unitId_lessonIndex_idx" ON "LearnBlockProgress"("userId", "unitId", "lessonIndex");

-- CreateIndex
CREATE UNIQUE INDEX "LearnBlockProgress_userId_unitId_lessonIndex_block_key" ON "LearnBlockProgress"("userId", "unitId", "lessonIndex", "block");

-- AddForeignKey
ALTER TABLE "LearnBlockProgress" ADD CONSTRAINT "LearnBlockProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
