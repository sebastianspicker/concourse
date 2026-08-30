export const PublicQueryKey = {
  campus: "campus",
  date: "date",
  from: "from",
  limit: "limit",
  offset: "offset",
  search: "search",
  to: "to",
} as const;

export type PublicDateRangeQuery = {
  search?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
};

export type PublicEventsQuery = PublicDateRangeQuery;
export type PublicRoomsQuery = Pick<PublicDateRangeQuery, "search" | "limit" | "offset"> & { campus?: string };
export type PublicScheduleQuery = PublicDateRangeQuery & { campus?: string };
export type PublicTodayQuery = { date?: string };
