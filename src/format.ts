// "MUR 85,000" rather than the local "Rs 85,000": many visitors booking from
// abroad would read "Rs" as Indian or Pakistani rupees.
const murFormatter = new Intl.NumberFormat('en-MU', {
  style: 'currency',
  currency: 'MUR',
  currencyDisplay: 'code',
  maximumFractionDigits: 0,
});

export function formatMur(amount: number): string {
  return murFormatter.format(amount);
}

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/** Formats a YYYY-MM-DD calendar date; returns the input unchanged if it is not one. */
export function formatDate(isoDate: string): string {
  const parsed = parseIsoDate(isoDate);
  return parsed ? dateFormatter.format(parsed) : isoDate;
}

/**
 * Parses a strict YYYY-MM-DD calendar date as UTC midnight. Rejects impossible
 * dates such as 2026-02-30, which `new Date()` would silently roll over.
 */
export function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, m, d] = match.map(Number) as [number, number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    return null;
  }
  return date;
}

/** Today's date in the visitor's local time zone, as YYYY-MM-DD. */
export function localToday(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
