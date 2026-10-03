import { describe, expect, it } from 'vitest';
import {
  ApiError,
  cancelBooking,
  createBooking,
  getVenue,
  kindForStatus,
  listMyBookings,
  listVenues,
  type ApiErrorKind,
} from '@/api';
import { errorMessage } from '@/errorMessage';
import { strings } from '@/strings';
import { booking, venues } from '@/test/fixtures';
import { jsonResponse, mockFetch } from '@/test/fetchMock';

async function rejection(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (err) {
    expect(err).toBeInstanceOf(ApiError);
    return err as ApiError; // asserted on the line above
  }
  throw new Error('expected the call to reject');
}

describe('api client: success paths', () => {
  it('lists venues from the public catalog with JSON and IAP-friendly headers', async () => {
    const fetchSpy = mockFetch(() => jsonResponse(venues));

    await expect(listVenues()).resolves.toEqual(venues);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('/api/catalog/venues');
    expect(init?.method).toBe('GET');
    expect(init?.redirect).toBe('manual');
    expect(init?.credentials).toBe('same-origin');
    expect(init?.headers).toMatchObject({
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    });
  });

  it('encodes the venue id into the path', async () => {
    const fetchSpy = mockFetch(() => jsonResponse(venues[0]));
    await getVenue('a/b?c');
    expect(fetchSpy.mock.calls[0]![0]).toBe('/api/catalog/venues/a%2Fb%3Fc');
  });

  it('POSTs a new booking as JSON and returns the created booking', async () => {
    const created = booking();
    const fetchSpy = mockFetch(() => jsonResponse(created, 201));
    const payload = { venueId: 'v-le-morne', date: '2099-12-31', guests: 80, contactEmail: 'guest@example.com' };

    await expect(createBooking(payload)).resolves.toEqual(created);

    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('/api/bookings');
    expect(init?.method).toBe('POST');
    expect(init?.headers).toMatchObject({ 'Content-Type': 'application/json' });
    expect(JSON.parse(String(init?.body))).toEqual(payload);
  });

  it('lists the caller’s bookings and cancels one with DELETE', async () => {
    const fetchSpy = mockFetch((_url, init) =>
      init.method === 'DELETE' ? jsonResponse(booking({ status: 'CANCELLED' })) : jsonResponse([booking()]),
    );

    await expect(listMyBookings()).resolves.toEqual([booking()]);
    await expect(cancelBooking('b-1')).resolves.toMatchObject({ status: 'CANCELLED' });
    expect(fetchSpy.mock.calls[1]![0]).toBe('/api/bookings/b-1');
    expect(fetchSpy.mock.calls[1]![1]?.method).toBe('DELETE');
  });
});

describe('api client: Go encoding tolerance', () => {
  it('reads a null list (Go nil slice) as empty', async () => {
    mockFetch(() => jsonResponse(null));
    await expect(listMyBookings()).resolves.toEqual([]);
  });

  it('reads null venue tags as no tags', async () => {
    mockFetch(() => jsonResponse([{ ...venues[0], tags: null }]));
    await expect(listVenues()).resolves.toEqual([{ ...venues[0], tags: [] }]);
  });

  it('drops unknown fields instead of passing them through', async () => {
    mockFetch(() => jsonResponse({ ...booking(), internalNote: 'x' }, 201));
    const created = await createBooking({ venueId: 'v', date: '2099-12-31', guests: 2, contactEmail: 'a@b.co' });
    expect(created).toEqual(booking());
  });

  it('resolves a cancel answered with 204 No Content as null', async () => {
    mockFetch(() => new Response(null, { status: 204 }));
    await expect(cancelBooking('b-1')).resolves.toBeNull();
  });

  it('rejects an empty body where one is required', async () => {
    mockFetch(() => new Response(null, { status: 204 }));
    expect((await rejection(createBooking({ venueId: 'v', date: '2099-12-31', guests: 2, contactEmail: 'a@b.co' }))).kind).toBe(
      'bad_response',
    );
  });
});

describe('api client: error mapping', () => {
  it('maps 401 to unauthorized, which the UI shows as "Sign in required"', async () => {
    mockFetch(() => jsonResponse({ error: 'missing identity' }, 401));

    const err = await rejection(listMyBookings());

    expect(err.kind).toBe('unauthorized');
    expect(err.status).toBe(401);
    expect(errorMessage(err)).toBe('Sign in required');
  });

  it('treats a redirect from the edge (sign-in page) as unauthorized', async () => {
    // fetch with redirect: 'manual' yields an opaque response that cannot be
    // constructed with `new Response`, so fake only the fields the client reads.
    const opaque = { type: 'opaqueredirect', status: 0, ok: false } as unknown as Response;
    mockFetch(() => opaque);

    expect((await rejection(listMyBookings())).kind).toBe('unauthorized');
  });

  it.each<[number, ApiErrorKind]>([
    [400, 'invalid'],
    [403, 'forbidden'],
    [404, 'not_found'],
    [409, 'conflict'],
    [422, 'invalid'],
    [500, 'server'],
    [503, 'server'],
  ])('maps HTTP %i to %s', async (status, kind) => {
    expect(kindForStatus(status)).toBe(kind);
    mockFetch(() => jsonResponse({ error: 'nope' }, status));
    const err = await rejection(getVenue('v-1'));
    expect(err.kind).toBe(kind);
    expect(err.status).toBe(status);
  });

  it('surfaces the API message for a conflict so the visitor knows what to fix', async () => {
    mockFetch(() => jsonResponse({ error: 'venue already booked on 2099-12-31' }, 409));

    const err = await rejection(createBooking({ venueId: 'v', date: '2099-12-31', guests: 2, contactEmail: 'a@b.co' }));

    expect(err.serverMessage).toBe('venue already booked on 2099-12-31');
    expect(errorMessage(err)).toBe('venue already booked on 2099-12-31');
  });

  it('hides the API message for server errors', async () => {
    mockFetch(() => jsonResponse({ error: 'pq: connection refused at 10.0.0.3' }, 500));
    const err = await rejection(listVenues());
    expect(errorMessage(err)).toBe(strings.errors.server);
  });

  it('tolerates a non-JSON error body', async () => {
    mockFetch(() => new Response('<html>Bad gateway</html>', { status: 502 }));
    const err = await rejection(listVenues());
    expect(err.kind).toBe('server');
    expect(err.serverMessage).toBeUndefined();
  });

  it('maps a fetch failure to network', async () => {
    mockFetch(() => {
      throw new TypeError('Failed to fetch');
    });
    const err = await rejection(listVenues());
    expect(err.kind).toBe('network');
    expect(err.status).toBe(0);
    expect(errorMessage(err)).toBe(strings.errors.network);
  });

  it('rejects a 200 whose body is not valid JSON', async () => {
    mockFetch(() => new Response('not json', { status: 200 }));
    expect((await rejection(listVenues())).kind).toBe('bad_response');
  });

  it('rejects a 200 whose body has the wrong shape', async () => {
    mockFetch(() => jsonResponse([{ id: 'v-1', name: 'No other fields' }]));
    expect((await rejection(listVenues())).kind).toBe('bad_response');
  });

  it('rejects a booking with an unknown status', async () => {
    mockFetch(() => jsonResponse([{ ...booking(), status: 'ON_HOLD' }]));
    expect((await rejection(listMyBookings())).kind).toBe('bad_response');
  });
});
