import { z } from "zod";

function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

const STANDARD_CANVASES = ["#F5F7F8", "#101417"] as const;

function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => {
    const value = Number.parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function getContrastRatio(first: string, second: string): number {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function hasCanvasContrast(accent: string): boolean {
  return STANDARD_CANVASES.every((canvas) => getContrastRatio(accent, canvas) >= 3);
}

function hasForegroundContrast(accent: string): boolean {
  const blackContrast = getContrastRatio(accent, "#000000");
  const whiteContrast = getContrastRatio(accent, "#FFFFFF");
  return Math.max(blackContrast, whiteContrast) >= 4.5;
}

export const PublicEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string().datetime({ offset: true }),
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
  _total: z.number().int().optional(),
  _degraded: z.boolean().optional(),
  _sourcesConfigured: z.boolean().optional()
});

export type EventsResponse = z.infer<typeof EventsResponseSchema>;

export const RoomsResponseSchema = z.object({
  rooms: z.array(RoomSchema),
  _total: z.number().int().optional(),
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
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }).optional(),
  location: z.string().optional(),
  campusId: z.string().optional(),
  description: z.string().optional()
});

export type ScheduleItem = z.infer<typeof ScheduleItemSchema>;

export const ScheduleResponseSchema = z.object({
  schedule: z.array(ScheduleItemSchema),
  _total: z.number().int().optional(),
  _degraded: z.boolean().optional(),
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
  publicRooms: z.array(RoomSchema).optional(),
  timezone: z.string().refine(isValidTimeZone, "Invalid IANA timezone").optional(),
  app: z
    .object({
      displayName: z.string().trim().min(1).optional(),
      defaultLocale: z.enum(["en", "de"]).optional(),
      accent: z
        .string()
        .regex(/^#[0-9a-f]{6}$/i, "Accent must be a six-digit hex color")
        .refine(isAccessibleInstitutionAccent, "Accent does not meet contrast requirements")
        .optional()
    })
    .optional()
});

export type InstitutionPack = z.infer<typeof InstitutionPackSchema>;

export function isAccessibleInstitutionAccent(accent: string): boolean {
  if (!/^#[0-9a-f]{6}$/i.test(accent)) return false;
  return hasCanvasContrast(accent) && hasForegroundContrast(accent);
}
