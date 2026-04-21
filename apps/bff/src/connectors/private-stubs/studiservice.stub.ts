import type { Room } from "@campus/shared";
import { log } from "../../utils/logger";

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

export async function fetchStatus(): Promise<StudiserviceResult> {
  log("warn", "stub_called", { connector: "studiservice" });
  return { data: { enrolled: false }, _isStub: true };
}
