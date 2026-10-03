import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from '@/App';
import { booking, venues } from '@/test/fixtures';
import { jsonResponse, mockFetch, routes } from '@/test/fetchMock';

describe('App', () => {
  it('browses venues, opens one and requests a booking', async () => {
    const user = userEvent.setup();
    const fetchSpy = mockFetch(
      routes({
        'GET /api/catalog/venues': () => jsonResponse(venues),
        'GET /api/catalog/venues/v-le-morne': () => jsonResponse(venues[0]),
        'POST /api/bookings': () => jsonResponse(booking(), 201),
      }),
    );
    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'View and book Le Morne Beach Pavilion' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Le Morne Beach Pavilion' })).toBeInTheDocument();

    await user.type(screen.getByLabelText('Date'), '2099-12-31');
    await user.type(screen.getByLabelText('Guests'), '80');
    await user.type(screen.getByLabelText('Contact email'), 'guest@example.com');
    await user.click(screen.getByRole('button', { name: 'Request booking' }));

    expect(await screen.findByRole('heading', { name: 'Booking requested' })).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledWith('/api/bookings', expect.objectContaining({ method: 'POST' }));
  });

  it('shows "Sign in required" on My bookings when the API answers 401', async () => {
    const user = userEvent.setup();
    mockFetch(
      routes({
        'GET /api/catalog/venues': () => jsonResponse(venues),
        'GET /api/bookings': () => jsonResponse({ error: 'unauthenticated' }, 401),
      }),
    );
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'My bookings' }));

    expect(await screen.findByRole('heading', { name: 'Sign in required' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'My bookings' })).toHaveAttribute('aria-current', 'page');
  });

  it('lists my bookings and cancels a pending one', async () => {
    const user = userEvent.setup();
    const fetchSpy = mockFetch(
      routes({
        'GET /api/catalog/venues': () => jsonResponse(venues),
        'GET /api/bookings': () =>
          jsonResponse([
            booking(),
            booking({ id: 'b-2', venueName: 'Curepipe Colonial House', date: '2099-11-01', status: 'REJECTED' }),
          ]),
        'DELETE /api/bookings/b-1': () => jsonResponse(booking({ status: 'CANCELLED' })),
      }),
    );
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'My bookings' }));

    const table = await screen.findByRole('table');
    const rows = within(table).getAllByRole('row');
    expect(rows).toHaveLength(3); // header + 2, sorted by date
    expect(rows[1]).toHaveTextContent('Curepipe Colonial House');
    expect(rows[1]).toHaveTextContent('Rejected');
    expect(within(rows[1]!).queryByRole('button')).not.toBeInTheDocument();

    await user.click(within(rows[2]!).getByRole('button', { name: /Cancel booking for Le Morne Beach Pavilion/ }));

    await waitFor(() => expect(rows[2]).toHaveTextContent('Cancelled'));
    expect(within(rows[2]!).queryByRole('button')).not.toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledWith('/api/bookings/b-1', expect.objectContaining({ method: 'DELETE' }));
  });

  it('marks a booking cancelled when the API confirms with 204 No Content', async () => {
    const user = userEvent.setup();
    mockFetch(
      routes({
        'GET /api/catalog/venues': () => jsonResponse(venues),
        'GET /api/bookings': () => jsonResponse([booking({ status: 'APPROVED' })]),
        'DELETE /api/bookings/b-1': () => new Response(null, { status: 204 }),
      }),
    );
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'My bookings' }));

    await user.click(await screen.findByRole('button', { name: /Cancel booking for Le Morne Beach Pavilion/ }));

    const row = screen.getAllByRole('row')[1]!;
    await waitFor(() => expect(row).toHaveTextContent('Cancelled'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
