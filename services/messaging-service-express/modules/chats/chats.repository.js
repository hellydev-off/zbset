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

export function getChat(id) {
  return prisma.chats.findUnique({
    where: {
      id: id,
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

export async function updateLastMessage(chat_id, sender_id, text, content) {
  return await prisma.chats.update({
    where: { id: chat_id },
    data: {
      last_message: {
        sender_id: sender_id,
        text: text,
        content: content,
        is_viewed: false,
      },
    },
  });
}

export async function pinMessage(chat_id, messageId, sender_id, text, content) {
  return await prisma.chats.update({
    where: { id: chat_id },
    data: {
      pin_message: {
        id: messageId,
        sender_id: sender_id,
        text: text,
        content: content,
        is_viewed: false,
      },
    },
  });
}

export async function unPinMessage(chat_id) {
  return await prisma.chats.update({
    where: { id: chat_id },
    data: {
      pin_message: {},
    },
  });
}
