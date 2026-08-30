import { z } from "zod";
import { isPublicHttpUrl } from "../http/publicUrl";

export const PublicEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string().datetime({ offset: true }),
  sourceUrl: z.string().url().refine(isPublicHttpUrl, "Public event source URLs must be public, credential-free HTTP(S) URLs")
});

export type PublicEvent = z.infer<typeof PublicEventSchema>;

export const EventsResponseSchema = z.object({
  events: z.array(PublicEventSchema),
  _total: z.number().int().optional(),
  _degraded: z.boolean().optional(),
  _sourcesConfigured: z.boolean().optional(),
});

export type EventsResponse = z.infer<typeof EventsResponseSchema>;
