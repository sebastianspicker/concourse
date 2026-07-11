function isValidPort(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 65535;
}

export function parsePort(raw: string | undefined): number {
  if (!raw) return 4000;
  const value = Number(raw);
  if (!isValidPort(value)) throw new Error(`Invalid BFF_PORT: ${raw}`);
  return value;
}
