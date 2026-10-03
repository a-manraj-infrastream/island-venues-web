import { parseIsoDate } from '@/format';
import { strings } from '@/strings';

export interface BookingFormValues {
  date: string;
  guests: string;
  contactEmail: string;
}

export type BookingFormErrors = Partial<Record<keyof BookingFormValues, string>>;

// Deliberately simple: the API is the authority. This only catches typos
// before a round trip (something@something.tld, no spaces).
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Client-side mirror of the API's booking rules (date not in the past, guests
 * 1..capacity, a plausible email). `today` is injected so the rule is testable
 * and follows the visitor's calendar day.
 */
export function validateBooking(
  values: BookingFormValues,
  capacity: number,
  today: string,
): BookingFormErrors {
  const errors: BookingFormErrors = {};
  const e = strings.booking.errors;

  const date = values.date.trim();
  if (date === '') {
    errors.date = e.dateRequired;
  } else if (!parseIsoDate(date)) {
    errors.date = e.dateInvalid;
  } else if (date < today) {
    // Strict YYYY-MM-DD strings compare correctly as text.
    errors.date = e.datePast;
  }

  const guests = values.guests.trim();
  if (guests === '') {
    errors.guests = e.guestsRequired;
  } else if (!/^\d+$/.test(guests)) {
    errors.guests = e.guestsInvalid;
  } else {
    const n = Number(guests);
    if (n < 1 || n > capacity) errors.guests = e.guestsRange(capacity);
  }

  const email = values.contactEmail.trim();
  if (email === '') {
    errors.contactEmail = e.emailRequired;
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.contactEmail = e.emailInvalid;
  }

  return errors;
}

export function hasErrors(errors: BookingFormErrors): boolean {
  return Object.keys(errors).length > 0;
}
