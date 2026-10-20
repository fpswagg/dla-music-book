-- CreateEnum
CREATE TYPE "RecordingSource" AS ENUM ('UPLOAD', 'AI');

-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('PENDING', 'RUNNING', 'DONE', 'FAILED');

-- CreateTable
CREATE TABLE "Recording" (
    "id" TEXT NOT NULL,
    "songId" TEXT,
    "title" TEXT,
    "performer" TEXT,
    "uploadId" TEXT,
    "fileName" TEXT,
    "fileKey" TEXT,
    "fileUrl" TEXT,
    "contentType" TEXT,
    "sizeBytes" INTEGER,
    "durationMs" INTEGER,
    "source" "RecordingSource" NOT NULL DEFAULT 'UPLOAD',
    "generator" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "analysis" "AnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "analysisError" TEXT,
    "analysisLog" JSONB,
    "transcript" JSONB,
    "correctedText" TEXT,
    "matches" JSONB,
    "alignment" JSONB,
    "alignmentSource" TEXT,
    "melodyKey" TEXT,
    "melodyUrl" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "reviewedById" TEXT,
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recording_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlossaryTerm" (
    "id" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GlossaryTerm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranscriptionSample" (
    "id" TEXT NOT NULL,
    "recordingId" TEXT,
    "songId" TEXT,
    "rawText" TEXT NOT NULL,
    "correctedText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TranscriptionSample_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Recording_songId_idx" ON "Recording"("songId");

-- CreateIndex
CREATE INDEX "Recording_status_idx" ON "Recording"("status");

-- CreateIndex
CREATE UNIQUE INDEX "GlossaryTerm_term_key" ON "GlossaryTerm"("term");

-- CreateIndex
CREATE INDEX "TranscriptionSample_createdAt_idx" ON "TranscriptionSample"("createdAt");

-- AddForeignKey
ALTER TABLE "Recording" ADD CONSTRAINT "Recording_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recording" ADD CONSTRAINT "Recording_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recording" ADD CONSTRAINT "Recording_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranscriptionSample" ADD CONSTRAINT "TranscriptionSample_recordingId_fkey" FOREIGN KEY ("recordingId") REFERENCES "Recording"("id") ON DELETE SET NULL ON UPDATE CASCADE;

