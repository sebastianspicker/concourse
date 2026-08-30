export type DateRangePaginationQuery = {
  search?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
};

export type EventsQuery = DateRangePaginationQuery;

export type ScheduleQuery = DateRangePaginationQuery & { campusId?: string };

export type RoomsQuery = Pick<DateRangePaginationQuery, "search" | "limit" | "offset"> & { campus?: string };
