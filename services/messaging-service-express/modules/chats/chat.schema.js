import { z } from "zod";

export const createChatSchema = z.object({
  body: z.object({
    type: z.string(),
    participant_ids: z.array(z.number()).min(2, "Нужен хотя бы один тег"),
  }),
});
