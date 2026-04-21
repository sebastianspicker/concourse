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

export async function fetchBookings(): Promise<BookingsResult> {
  log("warn", "stub_called", { connector: "asimut" });
  return { data: [], _isStub: true };
}
