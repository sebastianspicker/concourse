export function applySearch<T>(
  items: T[],
  search: string | undefined,
  getText: (item: T) => string
): T[] {
  if (!search) return items;
  const searchLower = search.toLowerCase();
  return items.filter((item) => getText(item).toLowerCase().includes(searchLower));
}

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

export function applyPagination<T>(
  items: T[],
  offset: number,
  limit: number | undefined
): T[] {
  if (limit !== undefined) return items.slice(offset, offset + limit);
  if (offset > 0) return items.slice(offset);
  return items;
}
