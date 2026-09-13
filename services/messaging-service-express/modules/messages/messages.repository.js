import { prisma } from "../../lib/prisma.js";

export function getChats(participant_ids) {
  return prisma.chats.findMany({
    where: {
      participant_ids: {
        hasSome: [participant_ids[0], participant_ids[1]],
      },
    },
  });
}

export function createMessage(data) {
  return prisma.messages.create({
    data: {
      ...data,
    },
  });
}

export async function getChatMessages(chat_id) {
  return await prisma.messages.findMany({
    where: {
      chat_id: chat_id,
    },
  });
}

export async function updateMessage(id, newMessage) {
  return await prisma.messages.update({
    where: { id: id },
    data: {
      text: newMessage,
      updated_at: new Date(),
    },
  });
}
