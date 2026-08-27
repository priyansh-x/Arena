-- AlterEnum
ALTER TYPE "AgentKind" ADD VALUE 'hosted';

-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "archetype" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "emblem" TEXT,
ADD COLUMN     "model" TEXT,
ADD COLUMN     "strategy" TEXT,
ADD COLUMN     "systemPrompt" TEXT;

-- AlterTable
ALTER TABLE "Position" ADD COLUMN     "thesis" TEXT;
