-- CreateTable
CREATE TABLE "DailyQuestProgress" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "dateKey" TEXT NOT NULL,
    "blocksCount" INTEGER NOT NULL DEFAULT 0,
    "newWordsCount" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "blocksClaimed" BOOLEAN NOT NULL DEFAULT false,
    "newWordsClaimed" BOOLEAN NOT NULL DEFAULT false,
    "correctClaimed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DailyQuestProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyQuestProgress_userId_dateKey_key" ON "DailyQuestProgress"("userId", "dateKey");

-- AddForeignKey
ALTER TABLE "DailyQuestProgress" ADD CONSTRAINT "DailyQuestProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
