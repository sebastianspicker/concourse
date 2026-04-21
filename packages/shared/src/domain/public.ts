import { z } from "zod";

export const PublicEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string(),
  sourceUrl: z.string().url()
});

export type PublicEvent = z.infer<typeof PublicEventSchema>;

export const RoomSchema = z.object({
  id: z.string(),
  name: z.string(),
  campusId: z.string()
});

export type Room = z.infer<typeof RoomSchema>;

export const EventsResponseSchema = z.object({
  events: z.array(PublicEventSchema),
  _degraded: z.boolean().optional(),
  _sourcesConfigured: z.boolean().optional()
});

export type EventsResponse = z.infer<typeof EventsResponseSchema>;

export const RoomsResponseSchema = z.object({
  rooms: z.array(RoomSchema),
  _sourcesConfigured: z.boolean().optional()
});

export type RoomsResponse = z.infer<typeof RoomsResponseSchema>;

export const TodayResponseSchema = z.object({
  events: z.array(PublicEventSchema),
  rooms: z.array(RoomSchema),
  _degraded: z.boolean().optional(),
  _sourcesConfigured: z.boolean().optional()
});

export type TodayResponse = z.infer<typeof TodayResponseSchema>;

export const ScheduleItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  startsAt: z.string(),
  endsAt: z.string().optional(),
  location: z.string().optional(),
  campusId: z.string().optional()
});

export type ScheduleItem = z.infer<typeof ScheduleItemSchema>;

export const ScheduleResponseSchema = z.object({
  schedule: z.array(ScheduleItemSchema),
  _sourcesConfigured: z.boolean().optional()
});

export type ScheduleResponse = z.infer<typeof ScheduleResponseSchema>;

export const InstitutionPackSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  campuses: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      city: z.string(),
      address: z.string(),
      labels: z.array(z.string())
    })
  ),
  publicSources: z
    .object({
      events: z
        .array(
          z.object({
            label: z.string(),
            url: z.string().url()
          })
        )
        .optional(),
      schedules: z
        .array(
          z.object({
            label: z.string(),
            url: z.string().url()
          })
        )
        .optional()
    })
    .optional(),
  publicRooms: z.array(RoomSchema).optional()
});

export type InstitutionPack = z.infer<typeof InstitutionPackSchema>;
