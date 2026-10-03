// Typed client for island-venues-api. All calls are same-origin (`/api/...`);
// the load balancer routes them and the edge (IAP, later Identity Platform)
// authenticates the caller, so this client never handles tokens itself.

export const BOOKING_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'PAID'] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export interface Venue {
  id: string;
  name: string;
  town: string;
  capacity: number;
  pricePerDayMur: number;
  description: string;
  tags: string[];
}

export interface Booking {
  id: string;
  venueId: string;
  venueName: string;
  date: string;
  guests: number;
  owner: string;
  contactEmail: string;
  status: BookingStatus;
  createdAt: string;
}

export interface NewBooking {
  venueId: string;
  /** YYYY-MM-DD */
  date: string;
  guests: number;
  contactEmail: string;
}

/**
 * What went wrong, independent of the raw status code, so views can branch on
 * meaning: `unauthorized` renders the "Sign in required" state, the rest an
 * error notice.
 */
export type ApiErrorKind =
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'invalid'
  | 'server'
  | 'network'
  | 'bad_response';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  /** HTTP status, or 0 when no HTTP response was received. */
  readonly status: number;
  /** The API's `{"error": "..."}` message, when it sent one. */
  readonly serverMessage: string | undefined;

  constructor(kind: ApiErrorKind, status: number, serverMessage?: string) {
    super(serverMessage ? `${kind}: ${serverMessage}` : kind);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.serverMessage = serverMessage;
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}

/** Maps an HTTP status to an error kind. Exported for tests. */
export function kindForStatus(status: number): ApiErrorKind {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 409) return 'conflict';
  if (status === 400 || status === 422) return 'invalid';
  return 'server';
}

// --- Runtime parsing -------------------------------------------------------
// response.json() is `any`; these parsers turn it into the declared types and
// reject anything else (returning undefined), so a broken response fails
// loudly at the boundary instead of rendering `undefined` deep inside a
// component. They also absorb one Go encoding quirk: a nil slice marshals to
// `null`, so `null` is read as an empty list wherever a list is expected.

type Json = Record<string, unknown>;

function isObject(v: unknown): v is Json {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isString(v: unknown): v is string {
  return typeof v === 'string';
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function isBookingStatus(v: unknown): v is BookingStatus {
  return isString(v) && (BOOKING_STATUSES as readonly string[]).includes(v);
}

function parseStrings(v: unknown): string[] | undefined {
  if (v === null || v === undefined) return [];
  return Array.isArray(v) && v.every(isString) ? v : undefined;
}

export function parseVenue(v: unknown): Venue | undefined {
  if (!isObject(v)) return undefined;
  const tags = parseStrings(v.tags);
  if (
    !isString(v.id) ||
    !isString(v.name) ||
    !isString(v.town) ||
    !isFiniteNumber(v.capacity) ||
    !isFiniteNumber(v.pricePerDayMur) ||
    !tags
  ) {
    return undefined;
  }
  return {
    id: v.id,
    name: v.name,
    town: v.town,
    capacity: v.capacity,
    pricePerDayMur: v.pricePerDayMur,
    description: isString(v.description) ? v.description : '',
    tags,
  };
}

export function parseBooking(v: unknown): Booking | undefined {
  if (
    !isObject(v) ||
    !isString(v.id) ||
    !isString(v.venueId) ||
    !isString(v.venueName) ||
    !isString(v.date) ||
    !isFiniteNumber(v.guests) ||
    !isString(v.owner) ||
    !isString(v.contactEmail) ||
    !isBookingStatus(v.status) ||
    !isString(v.createdAt)
  ) {
    return undefined;
  }
  return {
    id: v.id,
    venueId: v.venueId,
    venueName: v.venueName,
    date: v.date,
    guests: v.guests,
    owner: v.owner,
    contactEmail: v.contactEmail,
    status: v.status,
    createdAt: v.createdAt,
  };
}

function listOf<T>(parse: (v: unknown) => T | undefined) {
  return (v: unknown): T[] | undefined => {
    if (v === null) return [];
    if (!Array.isArray(v)) return undefined;
    const out: T[] = [];
    for (const item of v) {
      const parsed = parse(item);
      if (parsed === undefined) return undefined;
      out.push(parsed);
    }
    return out;
  };
}

// --- Transport -------------------------------------------------------------

async function readServerMessage(res: Response): Promise<string | undefined> {
  try {
    const body: unknown = await res.json();
    if (isObject(body) && isString(body.error) && body.error.trim() !== '') {
      return body.error;
    }
  } catch {
    // Non-JSON error body (for example an HTML page from the edge): ignore.
  }
  return undefined;
}

/** Marker for a 2xx response without a body (204, or an empty 200). */
const NO_CONTENT = Symbol('no content');

async function request<T>(
  path: string,
  parse: (v: unknown) => T | undefined,
  init: { method?: string; body?: unknown; allowNoContent?: boolean } = {},
): Promise<T | typeof NO_CONTENT> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    // IAP answers 401 instead of a 302 to the Google sign-in page when it sees
    // this header, which is what lets us show "Sign in required" rather than
    // failing on a cross-origin redirect.
    'X-Requested-With': 'XMLHttpRequest',
  };
  if (init.body !== undefined) headers['Content-Type'] = 'application/json';

  let res: Response;
  try {
    res = await fetch(path, {
      method: init.method ?? 'GET',
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      credentials: 'same-origin',
      // The API never redirects. A redirect means the edge is sending an
      // unauthenticated caller to a sign-in page; treat it as 401.
      redirect: 'manual',
    });
  } catch {
    throw new ApiError('network', 0);
  }

  if (res.type === 'opaqueredirect' || (res.status >= 300 && res.status < 400)) {
    throw new ApiError('unauthorized', res.status);
  }

  if (!res.ok) {
    throw new ApiError(kindForStatus(res.status), res.status, await readServerMessage(res));
  }

  const text = await res.text().catch(() => '');
  if (text.trim() === '') {
    if (init.allowNoContent) return NO_CONTENT;
    throw new ApiError('bad_response', res.status);
  }

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    throw new ApiError('bad_response', res.status);
  }
  const parsed = parse(body);
  if (parsed === undefined) {
    throw new ApiError('bad_response', res.status);
  }
  return parsed;
}

/** For endpoints that always return a body. */
async function requestBody<T>(
  path: string,
  parse: (v: unknown) => T | undefined,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const result = await request(path, parse, init);
  // Unreachable without allowNoContent; narrows the type.
  if (result === NO_CONTENT) throw new ApiError('bad_response', 204);
  return result;
}

const enc = encodeURIComponent;

export function listVenues(): Promise<Venue[]> {
  return requestBody('/api/catalog/venues', listOf(parseVenue));
}

export function getVenue(id: string): Promise<Venue> {
  return requestBody(`/api/catalog/venues/${enc(id)}`, parseVenue);
}

export function createBooking(booking: NewBooking): Promise<Booking> {
  return requestBody('/api/bookings', parseBooking, { method: 'POST', body: booking });
}

export function listMyBookings(): Promise<Booking[]> {
  return requestBody('/api/bookings', listOf(parseBooking));
}

/**
 * Cancels one of the caller's bookings. Resolves with the updated booking, or
 * with null when the API confirms with an empty response (204): the booking is
 * then CANCELLED but the server did not echo it.
 */
export async function cancelBooking(id: string): Promise<Booking | null> {
  const result = await request(`/api/bookings/${enc(id)}`, parseBooking, {
    method: 'DELETE',
    allowNoContent: true,
  });
  return result === NO_CONTENT ? null : result;
}
