/** Provides the temporary ASIMUT connector contract used before private integration is implemented. */

import { log } from "../../utils/logger";

export type Booking = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
};

export type BookingsResult = {
  data: Booking[];
  _isStub: boolean;
};

/** Returns an explicitly marked empty result until the private ASIMUT connector exists. */
export async function fetchBookings(): Promise<BookingsResult> {
  log("warn", "stub_called", { connector: "asimut" });
  return { data: [], _isStub: true };
}
