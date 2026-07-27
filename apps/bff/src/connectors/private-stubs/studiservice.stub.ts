/** Provides temporary StudiService data contracts until private integration is implemented. */

import type { Room } from "@concourse/shared";
import { log } from "../../utils/logger";

/** Returns no rooms rather than attempting an unavailable private StudiService integration. */
export async function fetchRooms(): Promise<Room[]> {
  log("warn", "stub_called", { connector: "studiservice.rooms" });
  return [];
}

export type StudentStatus = {
  enrolled: boolean;
};

export type StudiserviceResult = {
  data: StudentStatus;
  _isStub: boolean;
};

/** Returns an explicitly marked placeholder status until private access is implemented. */
export async function fetchStatus(): Promise<StudiserviceResult> {
  log("warn", "stub_called", { connector: "studiservice" });
  return { data: { enrolled: false }, _isStub: true };
}
