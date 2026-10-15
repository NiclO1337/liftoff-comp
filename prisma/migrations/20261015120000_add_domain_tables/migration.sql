-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "LiftType" AS ENUM ('SNATCH', 'CLEAN_JERK');

-- CreateEnum
CREATE TYPE "Flag" AS ENUM ('WHITE', 'RED');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "lifterId" TEXT;

-- CreateTable
CREATE TABLE "Lifter" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sex" "Sex" NOT NULL,
    "birthYear" INTEGER NOT NULL,
    "affiliation" TEXT,

    CONSTRAINT "Lifter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competition" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "location" TEXT,

    CONSTRAINT "Competition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "snatchStart" TEXT NOT NULL,
    "cleanJerkStart" TEXT NOT NULL,
    "allowedSex" "Sex",
    "paceMinSeconds" INTEGER NOT NULL DEFAULT 75,
    "paceMaxSeconds" INTEGER NOT NULL DEFAULT 90,
    "selfMinSeconds" INTEGER NOT NULL DEFAULT 100,
    "selfMaxSeconds" INTEGER NOT NULL DEFAULT 120,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entry" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "lifterId" TEXT NOT NULL,
    "lotNumber" INTEGER NOT NULL,
    "bodyweightKg" DOUBLE PRECISION,

    CONSTRAINT "Entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attempt" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "lift" "LiftType" NOT NULL,
    "number" INTEGER NOT NULL,
    "weightKg" INTEGER NOT NULL,
    "isEstimated" BOOLEAN NOT NULL DEFAULT false,
    "cancelled" BOOLEAN NOT NULL DEFAULT false,
    "leftFlag" "Flag",
    "centerFlag" "Flag",
    "rightFlag" "Flag",
    "resultAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tracking" (
    "userId" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tracking_pkey" PRIMARY KEY ("userId","entryId")
);

-- CreateIndex
CREATE INDEX "Lifter_clubId_name_idx" ON "Lifter"("clubId", "name");

-- CreateIndex
CREATE INDEX "Competition_clubId_startDate_idx" ON "Competition"("clubId", "startDate");

-- CreateIndex
CREATE INDEX "Group_competitionId_date_idx" ON "Group"("competitionId", "date");

-- CreateIndex
CREATE INDEX "Entry_lifterId_idx" ON "Entry"("lifterId");

-- CreateIndex
CREATE UNIQUE INDEX "Entry_groupId_lifterId_key" ON "Entry"("groupId", "lifterId");

-- CreateIndex
CREATE UNIQUE INDEX "Entry_groupId_lotNumber_key" ON "Entry"("groupId", "lotNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Attempt_entryId_lift_number_key" ON "Attempt"("entryId", "lift", "number");

-- CreateIndex
CREATE INDEX "Tracking_entryId_idx" ON "Tracking"("entryId");

-- CreateIndex
CREATE UNIQUE INDEX "user_lifterId_key" ON "user"("lifterId");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_lifterId_fkey" FOREIGN KEY ("lifterId") REFERENCES "Lifter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lifter" ADD CONSTRAINT "Lifter_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competition" ADD CONSTRAINT "Competition_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_lifterId_fkey" FOREIGN KEY ("lifterId") REFERENCES "Lifter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tracking" ADD CONSTRAINT "Tracking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tracking" ADD CONSTRAINT "Tracking_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
