-- AlterTable
ALTER TABLE "Chats" ADD COLUMN     "last_message" JSONB DEFAULT '{}',
ADD COLUMN     "pin_message" JSONB DEFAULT '{}';

-- AlterTable
ALTER TABLE "Messages" ADD COLUMN     "reaction" TEXT;
