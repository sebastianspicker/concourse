export const PublicRoute = {
  events: "/events",
  health: "/health",
  rooms: "/rooms",
  schedule: "/schedule",
  today: "/today",
} as const;

export type PublicDataRoute =
  | (typeof PublicRoute)["events"]
  | (typeof PublicRoute)["rooms"]
  | (typeof PublicRoute)["schedule"]
  | (typeof PublicRoute)["today"];
