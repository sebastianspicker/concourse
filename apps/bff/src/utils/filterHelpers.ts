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
  if (fromDate) {
    result = result.filter((item) => {
      const d = new Date(getDate(item));
      if (isNaN(d.getTime())) return true;
      return d >= fromDate;
    });
  }
  if (toDate) {
    result = result.filter((item) => {
      const d = new Date(getDate(item));
      if (isNaN(d.getTime())) return true;
      return d <= toDate;
    });
  }
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
