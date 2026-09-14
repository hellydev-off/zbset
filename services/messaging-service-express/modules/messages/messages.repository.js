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

export async function getChatMessagesByCount(chat_id, count) {
  return await prisma.messages.findMany({
    where: {
      chat_id: chat_id,
    },
    orderBy: {
      id: "desc",
    },
    take: count,
  });
}

export async function findMessage(id) {
  return await prisma.messages.findUnique({
    where: {
      id: id,
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

export async function deleteMessage(id) {
  return await prisma.messages.delete({
    where: {
      id: id,
    },
  });
}

export async function updateRaction(id, reaction) {
  return await prisma.messages.update({
    where: { id: id },
    data: {
      reaction: reaction,
    },
  });
}

export async function changeManyViewed(chat_id, sender_id) {
  return await prisma.messages.updateMany({
    where: { chat_id: chat_id, is_viewed: false, sender_id: sender_id },
    data: {
      is_viewed: true,
    },
  });
}

export async function changeViewed(messageId) {
  return await prisma.messages.update({
    where: { id: messageId },
    data: {
      is_viewed: true,
    },
  });
}

export async function updatePinMessage(id, station) {
  return prisma.messages.update({
    where: { id: id },
    data: {
      is_pin: station,
    },
  });
}

export async function addAnswerMessage(
  messageId,
  messageAnswerId,
  sender_id,
  text,
  content,
) {
  return await prisma.messages.update({
    where: { id: messageId },
    data: {
      answer_to: {
        id: messageAnswerId,
        sender_id: sender_id,
        text: text,
        content: content,
      },
    },
  });
}

export async function deleteMessages(chatId) {
  return await prisma.messages.deleteMany({
    where: {
      chat_id: chatId,
    },
  });
}
