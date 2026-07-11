export function formatCacheAge(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d old`;
  if (hours > 0) return `${hours}h old`;
  if (minutes > 0) return `${minutes}m old`;
  return "just now";
}
