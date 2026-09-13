import { z } from "zod";

export const sendMessageSchema = z.object({
  body: z.object({
    chat_id: z.number(),
    sender_id: z.number(),
    sender_type: z.string(),
    text: z.any(),
    content: z.object(),
  }),
});

export const chatIdShema = z.object({
  body: z.object({
    chat_id: z.number(),
  }),
});
