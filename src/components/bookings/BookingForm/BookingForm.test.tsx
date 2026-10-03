import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/api';
import { BookingForm } from '@/components/bookings/BookingForm';
import { strings } from '@/strings';
import { venues } from '@/test/fixtures';

const venue = venues[0]!; // capacity 120
const TODAY = '2026-10-03';
const e = strings.booking.errors;

function setup(onSubmit = vi.fn<(b: unknown) => Promise<void>>().mockResolvedValue(undefined)) {
  const user = userEvent.setup();
  render(<BookingForm venue={venue} today={TODAY} onSubmit={onSubmit} />);
  return {
    user,
    onSubmit,
    date: screen.getByLabelText('Date'),
    guests: screen.getByLabelText('Guests'),
    email: screen.getByLabelText('Contact email'),
    submit: screen.getByRole('button', { name: 'Request booking' }),
  };
}

describe('BookingForm', () => {
  it('blocks an empty submission, flags every field and focuses the first', async () => {
    const { user, onSubmit, date, guests, email, submit } = setup();

    await user.click(submit);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(e.dateRequired)).toBeInTheDocument();
    expect(screen.getByText(e.guestsRequired)).toBeInTheDocument();
    expect(screen.getByText(e.emailRequired)).toBeInTheDocument();
    for (const field of [date, guests, email]) {
      expect(field).toHaveAttribute('aria-invalid', 'true');
    }
    expect(date).toHaveAccessibleDescription(e.dateRequired);
    expect(date).toHaveFocus();
  });

  it('rejects a past date, too many guests and a malformed email', async () => {
    const { user, onSubmit, date, guests, email, submit } = setup();

    await user.type(date, '2026-10-02');
    await user.type(guests, '121');
    await user.type(email, 'guest@example');
    await user.click(submit);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(e.datePast)).toBeInTheDocument();
    expect(screen.getByText(e.guestsRange(120))).toBeInTheDocument();
    expect(screen.getByText(e.emailInvalid)).toBeInTheDocument();
  });

  it('clears a field error as soon as the field is edited', async () => {
    const { user, guests, submit } = setup();
    await user.click(submit);
    expect(guests).toHaveAttribute('aria-invalid', 'true');

    await user.type(guests, '5');

    expect(guests).not.toHaveAttribute('aria-invalid');
    expect(screen.queryByText(e.guestsRequired)).not.toBeInTheDocument();
  });

  it('submits a typed booking when every field is valid', async () => {
    const { user, onSubmit, date, guests, email, submit } = setup();

    await user.type(date, '2026-12-12');
    await user.type(guests, '120');
    await user.type(email, '  guest@example.com ');
    await user.click(submit);

    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({
      venueId: 'v-le-morne',
      date: '2026-12-12',
      guests: 120,
      contactEmail: 'guest@example.com',
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows "Sign in required" when the API answers 401', async () => {
    const onSubmit = vi.fn<(b: unknown) => Promise<void>>().mockRejectedValue(new ApiError('unauthorized', 401));
    const { user, date, guests, email, submit } = setup(onSubmit);

    await user.type(date, '2026-12-12');
    await user.type(guests, '10');
    await user.type(email, 'guest@example.com');
    await user.click(submit);

    expect(await screen.findByRole('heading', { name: 'Sign in required' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('shows the API reason when the date is already taken', async () => {
    const onSubmit = vi
      .fn<(b: unknown) => Promise<void>>()
      .mockRejectedValue(new ApiError('conflict', 409, 'venue already booked on 2026-12-12'));
    const { user, date, guests, email, submit } = setup(onSubmit);

    await user.type(date, '2026-12-12');
    await user.type(guests, '10');
    await user.type(email, 'guest@example.com');
    await user.click(submit);

    expect(await screen.findByRole('alert')).toHaveTextContent('venue already booked on 2026-12-12');
    expect(submit).toBeEnabled();
  });
});
