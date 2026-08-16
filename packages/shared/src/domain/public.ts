/** Defines and validates the public campus-data contract shared by server and client. */
import { z } from "zod";

/** URL is available in every supported runtime; this package deliberately omits DOM typings. */
declare const URL: new (input: string) => { protocol: string };

/** Uses the platform timezone database so invalid institution configuration fails early. */
function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

export const InstitutionDesignPresetSchema = z.enum(["wayfinding", "atelier", "precision"]);

export type InstitutionDesignPreset = z.infer<typeof InstitutionDesignPresetSchema>;

/** Neutral canvases against which institution accents must remain identifiable. */
export const INSTITUTION_DESIGN_CANVASES = {
  wayfinding: { light: "#EEF3F2", dark: "#111614" },
  atelier: { light: "#F5F3F6", dark: "#141216" },
  precision: { light: "#F2F5F6", dark: "#0D1215" },
} as const satisfies Record<InstitutionDesignPreset, { light: string; dark: string }>;

const STANDARD_CANVASES = Object.values(INSTITUTION_DESIGN_CANVASES)
  .flatMap(({ light, dark }) => [light, dark]);

/** Converts an sRGB hex color into WCAG relative luminance. */
function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => {
    const value = Number.parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/** Calculates the WCAG contrast ratio between two six-digit hex colors. */
export function getContrastRatio(first: string, second: string): number {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Requires the accent to remain visible against every supported preset canvas. */
function hasCanvasContrast(accent: string): boolean {
  return STANDARD_CANVASES.every((canvas) => getContrastRatio(accent, canvas) >= 3);
}

/** Ensures either black or white can serve as accessible foreground content. */
function hasForegroundContrast(accent: string): boolean {
  const blackContrast = getContrastRatio(accent, "#000000");
  const whiteContrast = getContrastRatio(accent, "#FFFFFF");
  return Math.max(blackContrast, whiteContrast) >= 4.5;
}

/** Allows only web URLs that are safe to render as public links. */
export function isPublicHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** Public event record normalized by connectors before it reaches the client. */
export const PublicEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string().datetime({ offset: true }),
  sourceUrl: z.string().url().refine(isPublicHttpUrl, "Public event source URLs must use HTTP or HTTPS")
});

export type PublicEvent = z.infer<typeof PublicEventSchema>;

/** Public room record referenced by room lists and Today responses. */
export const RoomSchema = z.object({
  id: z.string(),
  name: z.string(),
  campusId: z.string()
});

export type Room = z.infer<typeof RoomSchema>;

const SOURCE_STATUS_METADATA = {
  _degraded: z.boolean().optional(),
  _sourcesConfigured: z.boolean().optional(),
};

const PAGINATED_SOURCE_METADATA = {
  _total: z.number().int().optional(),
  ...SOURCE_STATUS_METADATA,
};

const ROOMS_SOURCE_METADATA = {
  _total: PAGINATED_SOURCE_METADATA._total,
  _sourcesConfigured: SOURCE_STATUS_METADATA._sourcesConfigured,
};

type SingleCollectionResponseShape<CollectionName extends string, ItemSchema extends z.ZodTypeAny, Metadata extends z.ZodRawShape> = {
  [Key in CollectionName]: z.ZodArray<ItemSchema>;
} & Metadata;

function createSingleCollectionResponseSchema<
  CollectionName extends string,
  ItemSchema extends z.ZodTypeAny,
  Metadata extends z.ZodRawShape,
>(collectionName: CollectionName, itemSchema: ItemSchema, metadata: Metadata): z.ZodObject<SingleCollectionResponseShape<CollectionName, ItemSchema, Metadata>> {
  return z.object({
    [collectionName]: z.array(itemSchema),
    ...metadata,
  } as SingleCollectionResponseShape<CollectionName, ItemSchema, Metadata>);
}

/** Paginated event response, including optional degraded-source metadata. */
export const EventsResponseSchema = createSingleCollectionResponseSchema("events", PublicEventSchema, PAGINATED_SOURCE_METADATA);

export type EventsResponse = z.infer<typeof EventsResponseSchema>;

/** Paginated room response backed by the selected institution pack. */
export const RoomsResponseSchema = createSingleCollectionResponseSchema("rooms", RoomSchema, ROOMS_SOURCE_METADATA);

export type RoomsResponse = z.infer<typeof RoomsResponseSchema>;

/** Aggregated home-screen payload for the campus-local day. */
export const TodayResponseSchema = z.object({
  events: z.array(PublicEventSchema),
  rooms: z.array(RoomSchema),
  ...SOURCE_STATUS_METADATA,
});

export type TodayResponse = z.infer<typeof TodayResponseSchema>;

/** Normalized public calendar occurrence with optional location metadata. */
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

/** Paginated schedule response, including partial-source state when applicable. */
export const ScheduleResponseSchema = createSingleCollectionResponseSchema("schedule", ScheduleItemSchema, PAGINATED_SOURCE_METADATA);

export type ScheduleResponse = z.infer<typeof ScheduleResponseSchema>;

/** Validates all public institution identity, source, room, timezone, and design data. */
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
      designPreset: InstitutionDesignPresetSchema.optional(),
      accent: z
        .string()
        .regex(/^#[0-9a-f]{6}$/i, "Accent must be a six-digit hex color")
        .refine(isAccessibleInstitutionAccent, "Accent does not meet contrast requirements")
        .optional()
    })
    .optional()
});

export type InstitutionPack = z.infer<typeof InstitutionPackSchema>;

/** Accepts only hex accents that remain visible and support readable foreground content. */
export function isAccessibleInstitutionAccent(accent: string): boolean {
  if (!/^#[0-9a-f]{6}$/i.test(accent)) return false;
  return hasCanvasContrast(accent) && hasForegroundContrast(accent);
}
