/** Applies shared text, date-range, and pagination filters to route data. */

/**
 * Shared filter, search, and pagination helpers for BFF route handlers.
 */

/**
 * Case-insensitive partial-match search filter.
 */
export function applySearch<T>(
  items: T[],
  search: string | undefined,
  getText: (item: T) => string
): T[] {
  if (!search) return items;
  const searchLower = search.toLowerCase();
  return items.filter((item) => getText(item).toLowerCase().includes(searchLower));
}

/** Retains malformed dates while applying one inclusive range bound. */
function applyDateBound<T>(
  items: T[],
  bound: Date,
  getDate: (item: T) => string,
  includes: (date: Date, bound: Date) => boolean
): T[] {
  return items.filter((item) => {
    const date = new Date(getDate(item));
    return Number.isNaN(date.getTime()) || includes(date, bound);
  });
}

/**
 * Date range filter. Keeps items whose date is >= fromDate and <= toDate.
 */
export function applyDateRange<T>(
  items: T[],
  fromDate: Date | undefined,
  toDate: Date | undefined,
  getDate: (item: T) => string
): T[] {
  let result = items;
  if (fromDate) result = applyDateBound(result, fromDate, getDate, (date, bound) => date >= bound);
  if (toDate) result = applyDateBound(result, toDate, getDate, (date, bound) => date <= bound);
  return result;
}

/**
 * Offset/limit pagination.
 */
export function applyPagination<T>(
  items: T[],
  offset: number,
  limit: number | undefined
): T[] {
  if (limit !== undefined) return items.slice(offset, offset + limit);
  if (offset > 0) return items.slice(offset);
  return items;
}
