import { z } from "zod";

export const RoomSchema = z.object({
  id: z.string(),
  name: z.string(),
  campusId: z.string()
});

export type Room = z.infer<typeof RoomSchema>;

export const RoomsResponseSchema = z.object({
  rooms: z.array(RoomSchema),
  _total: z.number().int().optional(),
  _sourcesConfigured: z.boolean().optional(),
});

export type RoomsResponse = z.infer<typeof RoomsResponseSchema>;
