import { z } from "zod";
import { PublicEventSchema } from "./events";
import { RoomSchema } from "./rooms";

export const TodayResponseSchema = z.object({
  events: z.array(PublicEventSchema),
  rooms: z.array(RoomSchema),
  _degraded: z.boolean().optional(),
  _sourcesConfigured: z.boolean().optional(),
});

export type TodayResponse = z.infer<typeof TodayResponseSchema>;
