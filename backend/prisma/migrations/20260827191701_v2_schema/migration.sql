-- CreateEnum
CREATE TYPE "AgentKind" AS ENUM ('external', 'builtin');

-- DropForeignKey
ALTER TABLE "Agent" DROP CONSTRAINT "Agent_userId_fkey";

-- DropForeignKey
ALTER TABLE "Market" DROP CONSTRAINT "Market_creatorId_fkey";

-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "kind" "AgentKind" NOT NULL DEFAULT 'external',
ADD COLUMN     "persona" TEXT,
ALTER COLUMN "userId" DROP NOT NULL,
ALTER COLUMN "endpointUrl" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Market" ADD COLUMN     "announced" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "autoResolve" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ALTER COLUMN "creatorId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Snapshot" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "yesPool" INTEGER NOT NULL,
    "noPool" INTEGER NOT NULL,
    "yesProb" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Snapshot_marketId_idx" ON "Snapshot"("marketId");

-- CreateIndex
CREATE INDEX "Log_agentId_idx" ON "Log"("agentId");

-- CreateIndex
CREATE INDEX "Log_marketId_idx" ON "Log"("marketId");

-- CreateIndex
CREATE INDEX "Position_marketId_idx" ON "Position"("marketId");

-- CreateIndex
CREATE INDEX "Position_agentId_idx" ON "Position"("agentId");

-- CreateIndex
CREATE INDEX "Transaction_agentId_idx" ON "Transaction"("agentId");

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Market" ADD CONSTRAINT "Market_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Snapshot" ADD CONSTRAINT "Snapshot_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
