import { z } from "zod";

/** Maximum lengths for public schedule text fields, shared by API normalization and wire validation. */
export const SCHEDULE_ID_MAX_LENGTH = 256;
export const SCHEDULE_TITLE_MAX_LENGTH = 512;
export const SCHEDULE_LOCATION_MAX_LENGTH = 512;
export const SCHEDULE_CAMPUS_ID_MAX_LENGTH = 128;
export const SCHEDULE_DESCRIPTION_MAX_LENGTH = 4096;
export const SCHEDULE_RESPONSE_MAX_ITEMS = 1000;

export const ScheduleItemSchema = z.object({
  id: z.string().max(SCHEDULE_ID_MAX_LENGTH),
  title: z.string().max(SCHEDULE_TITLE_MAX_LENGTH),
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }).optional(),
  location: z.string().max(SCHEDULE_LOCATION_MAX_LENGTH).optional(),
  campusId: z.string().max(SCHEDULE_CAMPUS_ID_MAX_LENGTH).optional(),
  description: z.string().max(SCHEDULE_DESCRIPTION_MAX_LENGTH).optional()
});

export type ScheduleItem = z.infer<typeof ScheduleItemSchema>;

export const ScheduleResponseSchema = z.object({
  schedule: z.array(ScheduleItemSchema).max(SCHEDULE_RESPONSE_MAX_ITEMS),
  _total: z.number().int().optional(),
  _degraded: z.boolean().optional(),
  _sourcesConfigured: z.boolean().optional(),
});

export type ScheduleResponse = z.infer<typeof ScheduleResponseSchema>;
