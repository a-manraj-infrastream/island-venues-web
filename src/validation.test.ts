import { describe, expect, it } from 'vitest';
import { strings } from '@/strings';
import { validateBooking } from '@/validation';

const e = strings.booking.errors;
const TODAY = '2026-10-03';
const valid = { date: '2026-12-12', guests: '50', contactEmail: 'guest@example.com' };

describe('validateBooking', () => {
  it('accepts a valid booking, including today and full capacity', () => {
    expect(validateBooking(valid, 120, TODAY)).toEqual({});
    expect(validateBooking({ ...valid, date: TODAY, guests: '120' }, 120, TODAY)).toEqual({});
  });

  it.each([
    ['', e.dateRequired],
    ['12/12/2026', e.dateInvalid],
    ['2027-02-30', e.dateInvalid], // future, so the past-date rule cannot mask it
    ['2027-13-01', e.dateInvalid],
    ['2026-10-02', e.datePast],
  ])('date %j → %s', (date, message) => {
    expect(validateBooking({ ...valid, date }, 120, TODAY).date).toBe(message);
  });

  it.each([
    ['', e.guestsRequired],
    ['2.5', e.guestsInvalid],
    ['-3', e.guestsInvalid],
    ['0', e.guestsRange(120)],
    ['121', e.guestsRange(120)],
  ])('guests %j → %s', (guests, message) => {
    expect(validateBooking({ ...valid, guests }, 120, TODAY).guests).toBe(message);
  });

  it.each([
    ['', e.emailRequired],
    ['guest', e.emailInvalid],
    ['guest@example', e.emailInvalid],
    ['gu est@example.com', e.emailInvalid],
  ])('email %j → %s', (contactEmail, message) => {
    expect(validateBooking({ ...valid, contactEmail }, 120, TODAY).contactEmail).toBe(message);
  });
});
