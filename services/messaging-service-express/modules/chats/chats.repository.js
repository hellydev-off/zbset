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

export function createChat(data) {
  return prisma.chats.create({
    data: {
      ...data,
    },
  });
}
