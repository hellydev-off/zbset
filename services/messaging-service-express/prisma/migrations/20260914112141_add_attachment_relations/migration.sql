-- AlterTable
ALTER TABLE "Messages" ADD COLUMN     "attachment_id" INTEGER;

-- CreateTable
CREATE TABLE "Attachment" (
    "id" SERIAL NOT NULL,
    "chat_id" INTEGER NOT NULL,
    "uploader_id" INTEGER NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storage_key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Messages" ADD CONSTRAINT "Messages_attachment_id_fkey" FOREIGN KEY ("attachment_id") REFERENCES "Attachment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "Chats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
