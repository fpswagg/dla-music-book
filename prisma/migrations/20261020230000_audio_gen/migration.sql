-- AlterEnum
ALTER TYPE "RecordingSource" ADD VALUE 'RENDER';

-- AlterTable
ALTER TABLE "Recording" ADD COLUMN     "scoreId" TEXT;

-- CreateTable
CREATE TABLE "WorkerHeartbeat" (
    "id" TEXT NOT NULL,
    "flags" JSONB NOT NULL DEFAULT '{}',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkerHeartbeat_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Recording" ADD CONSTRAINT "Recording_scoreId_fkey" FOREIGN KEY ("scoreId") REFERENCES "ScoreFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

