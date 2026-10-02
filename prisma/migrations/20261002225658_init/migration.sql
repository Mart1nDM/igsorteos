-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('STORY', 'REEL', 'POST');

-- CreateEnum
CREATE TYPE "GiveawayStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "RuleType" AS ENUM ('QUESTION_STICKER', 'MENTIONS', 'FOLLOW', 'LIKE', 'SAVED', 'COMMENT');

-- CreateEnum
CREATE TYPE "ParticipantStatus" AS ENUM ('VALID', 'DISQUALIFIED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "image" TEXT,
    "igId" TEXT,
    "igUsername" TEXT,
    "igAccessToken" TEXT,
    "igTokenExpiresAt" TIMESTAMP(3),
    "igProfilePic" TEXT,
    "igConnectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "igId" TEXT NOT NULL,
    "kind" "MediaKind" NOT NULL,
    "permalink" TEXT,
    "thumbnailUrl" TEXT,
    "caption" TEXT,
    "takenAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "hasQuestionSticker" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Giveaway" (
    "id" TEXT NOT NULL,
    "publicSlug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "GiveawayStatus" NOT NULL DEFAULT 'DRAFT',
    "winnersCount" INTEGER NOT NULL DEFAULT 1,
    "closeAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "mediaId" TEXT,
    "drawSeed" TEXT,
    "seedCommitment" TEXT,
    "participantsSnapshot" INTEGER,
    "drawnAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Giveaway_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rule" (
    "id" TEXT NOT NULL,
    "giveawayId" TEXT NOT NULL,
    "type" "RuleType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "amount" INTEGER NOT NULL DEFAULT 1,
    "expectedAnswer" TEXT,

    CONSTRAINT "Rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "giveawayId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "igUserId" TEXT,
    "fullName" TEXT,
    "avatarUrl" TEXT,
    "status" "ParticipantStatus" NOT NULL DEFAULT 'VALID',
    "evidence" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Winner" (
    "id" TEXT NOT NULL,
    "giveawayId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "drawnAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Winner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_igId_key" ON "User"("igId");

-- CreateIndex
CREATE INDEX "MediaItem_userId_kind_idx" ON "MediaItem"("userId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "MediaItem_userId_igId_key" ON "MediaItem"("userId", "igId");

-- CreateIndex
CREATE UNIQUE INDEX "Giveaway_publicSlug_key" ON "Giveaway"("publicSlug");

-- CreateIndex
CREATE INDEX "Giveaway_userId_status_idx" ON "Giveaway"("userId", "status");

-- CreateIndex
CREATE INDEX "Rule_giveawayId_idx" ON "Rule"("giveawayId");

-- CreateIndex
CREATE INDEX "Participant_giveawayId_status_idx" ON "Participant"("giveawayId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_giveawayId_username_key" ON "Participant"("giveawayId", "username");

-- CreateIndex
CREATE UNIQUE INDEX "Winner_giveawayId_rank_key" ON "Winner"("giveawayId", "rank");

-- AddForeignKey
ALTER TABLE "MediaItem" ADD CONSTRAINT "MediaItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Giveaway" ADD CONSTRAINT "Giveaway_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Giveaway" ADD CONSTRAINT "Giveaway_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "MediaItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rule" ADD CONSTRAINT "Rule_giveawayId_fkey" FOREIGN KEY ("giveawayId") REFERENCES "Giveaway"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_giveawayId_fkey" FOREIGN KEY ("giveawayId") REFERENCES "Giveaway"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Winner" ADD CONSTRAINT "Winner_giveawayId_fkey" FOREIGN KEY ("giveawayId") REFERENCES "Giveaway"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Winner" ADD CONSTRAINT "Winner_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
