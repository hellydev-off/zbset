-- AlterTable
ALTER TABLE "Messages" ADD COLUMN     "answer_to" JSONB,
ADD COLUMN     "is_pin" BOOLEAN NOT NULL DEFAULT false;
