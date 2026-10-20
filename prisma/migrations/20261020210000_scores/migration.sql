-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ScoreFormat" AS ENUM ('MUSICXML', 'ABC', 'MEI');

-- CreateEnum
CREATE TYPE "ScoreKind" AS ENUM ('SATB', 'MELODY', 'PIANO', 'OTHER');

-- CreateEnum
CREATE TYPE "ConversionStatus" AS ENUM ('READY', 'PENDING', 'FAILED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'RUNNING', 'DONE', 'FAILED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'CONTRIBUTOR';

-- AlterTable
ALTER TABLE "Song" ADD COLUMN     "tuneId" TEXT;

-- CreateTable
CREATE TABLE "Tune" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT,
    "timeSignature" TEXT,
    "metre" TEXT,
    "composer" TEXT,
    "source" TEXT,
    "license" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tune_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoreFile" (
    "id" TEXT NOT NULL,
    "tuneId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "kind" "ScoreKind" NOT NULL DEFAULT 'SATB',
    "format" "ScoreFormat",
    "fileKey" TEXT,
    "fileUrl" TEXT,
    "originalKey" TEXT,
    "originalUrl" TEXT,
    "originalName" TEXT,
    "originalFormat" TEXT,
    "conversion" "ConversionStatus" NOT NULL DEFAULT 'READY',
    "conversionError" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "license" TEXT,
    "createdById" TEXT,
    "reviewedById" TEXT,
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScoreFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "payload" JSONB NOT NULL DEFAULT '{}',
    "result" JSONB,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "runAfter" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Tune_name_idx" ON "Tune"("name");

-- CreateIndex
CREATE INDEX "ScoreFile_tuneId_idx" ON "ScoreFile"("tuneId");

-- CreateIndex
CREATE INDEX "ScoreFile_status_idx" ON "ScoreFile"("status");

-- CreateIndex
CREATE INDEX "Job_status_runAfter_idx" ON "Job"("status", "runAfter");

-- CreateIndex
CREATE INDEX "Job_type_idx" ON "Job"("type");

-- CreateIndex
CREATE INDEX "Song_tuneId_idx" ON "Song"("tuneId");

-- AddForeignKey
ALTER TABLE "Song" ADD CONSTRAINT "Song_tuneId_fkey" FOREIGN KEY ("tuneId") REFERENCES "Tune"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tune" ADD CONSTRAINT "Tune_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreFile" ADD CONSTRAINT "ScoreFile_tuneId_fkey" FOREIGN KEY ("tuneId") REFERENCES "Tune"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreFile" ADD CONSTRAINT "ScoreFile_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreFile" ADD CONSTRAINT "ScoreFile_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

