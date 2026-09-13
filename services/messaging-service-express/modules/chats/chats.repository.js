import { prisma } from "../../lib/prisma.js";

export function checkChat(participant_ids) {
  return prisma.chats.findMany({
    where: {
      OR: [
        {
          participant_ids: { equals: [participant_ids[0], participant_ids[1]] },
          participant_ids: { equals: [participant_ids[1], participant_ids[0]] },
        },
      ],
    },
  });
}

export function getChats(participant_id) {
  console.log("participant_id", participant_id);
  return prisma.chats.findMany({
    where: {
      participant_ids: {
        hasSome: [Number(participant_id)],
      },
    },
  });
}

export function createChat(data) {
  return prisma.chats.create({
    data: {
      ...data,
    },
  });
}

export async function getChatParticipantIds(chatId) {
  const chat = await prisma.chats.findUnique({
    where: { id: chatId },
    select: { participant_ids: true },
  });
  return chat?.participant_ids ?? [];
}
