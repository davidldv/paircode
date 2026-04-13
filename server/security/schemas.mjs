import { z } from "zod";

const roomSlug = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]?$/i);

export const eventSchemas = {
  chat: z.object({
    type: z.literal("chat"),
    text: z.string().min(1).max(4000),
  }),
  typing: z.object({
    type: z.literal("typing"),
    isTyping: z.boolean(),
  }),
  "context:update": z.object({
    type: z.literal("context:update"),
    context: z.object({
      selectedFiles: z.string().max(20_000).default(""),
      pinnedRequirements: z.string().max(4000).default(""),
    }),
  }),
  "ai:ask": z.object({
    type: z.literal("ai:ask"),
    mode: z.enum(["answer", "summarize", "next-steps"]),
    question: z.string().max(4000).default(""),
  }),
  "invite:create": z.object({
    type: z.literal("invite:create"),
  }),
  "membership:remove": z.object({
    type: z.literal("membership:remove"),
    memberUserId: z.string().min(1).max(64),
  }),
  "membership:update": z.object({
    type: z.literal("membership:update"),
    memberUserId: z.string().min(1).max(64),
    role: z.enum(["collaborator", "viewer"]),
  }),
  ping: z.object({ type: z.literal("ping") }),
};

export const joinSchema = z.object({
  type: z.literal("join"),
  roomId: roomSlug,
  userName: z.string().trim().min(1).max(64).optional(),
  inviteToken: z.string().min(1).max(1024).optional(),
});
