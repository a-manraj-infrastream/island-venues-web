import { useCallback, useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import type { NewBooking, Venue } from '@/api';
import { Button } from '@/components/common/Button';
import { ErrorState } from '@/components/common/ErrorState';
import { strings } from '@/strings';
import {
  hasErrors,
  validateBooking,
  type BookingFormErrors,
  type BookingFormValues,
} from '@/validation';
import styles from './BookingForm.module.css';

interface Props {
  venue: Venue;
  /** Today as YYYY-MM-DD in the visitor's time zone; the earliest bookable date. */
  today: string;
  /** Sends the booking. A rejection is shown in the form (401 → sign-in state). */
  onSubmit: (booking: NewBooking) => Promise<void>;
}

type Field = keyof BookingFormValues;
const FIELD_ORDER: Field[] = ['date', 'guests', 'contactEmail'];

export function BookingForm({ venue, today, onSubmit }: Props) {
  const [values, setValues] = useState<BookingFormValues>({ date: '', guests: '', contactEmail: '' });
  const [errors, setErrors] = useState<BookingFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<unknown>(null);

  const idPrefix = useId();
  const ids = {
    date: `${idPrefix}-date`,
    guests: `${idPrefix}-guests`,
    contactEmail: `${idPrefix}-email`,
    guestsHint: `${idPrefix}-guests-hint`,
  };
  const dateRef = useRef<HTMLInputElement>(null);
  const guestsRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const field = event.target.name as Field; // names are set from Field below
    const { value } = event.target;
    setValues((prev) => ({ ...prev, [field]: value }));
    // Clear a field's error as soon as the visitor edits it.
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const found = validateBooking(values, venue.capacity, today);
    setErrors(found);
    if (hasErrors(found)) {
      // Move focus to the first invalid field so keyboard and screen reader
      // users land on the problem instead of hunting for it.
      const first = FIELD_ORDER.find((f) => found[f]);
      const inputs = { date: dateRef, guests: guestsRef, contactEmail: emailRef };
      if (first) inputs[first].current?.focus();
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit({
        venueId: venue.id,
        date: values.date.trim(),
        guests: Number(values.guests.trim()),
        contactEmail: values.contactEmail.trim(),
      });
    } catch (err: unknown) {
      setSubmitError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const s = strings.booking;
  const describedBy = (field: Field, extra?: string) =>
    [errors[field] ? `${ids[field]}-error` : undefined, extra].filter(Boolean).join(' ') || undefined;

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate aria-labelledby={`${idPrefix}-heading`}>
      <h2 id={`${idPrefix}-heading`} className={styles.heading}>
        {s.heading}
      </h2>

      <div className={styles.field}>
        <label htmlFor={ids.date}>{s.date}</label>
        <input
          ref={dateRef}
          id={ids.date}
          name="date"
          type="date"
          min={today}
          required
          value={values.date}
          onChange={handleChange}
          aria-invalid={errors.date ? true : undefined}
          aria-describedby={describedBy('date')}
        />
        {errors.date && (
          <p id={`${ids.date}-error`} className={styles.error}>
            {errors.date}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor={ids.guests}>{s.guests}</label>
        <input
          ref={guestsRef}
          id={ids.guests}
          name="guests"
          type="number"
          inputMode="numeric"
          min={1}
          max={venue.capacity}
          step={1}
          required
          value={values.guests}
          onChange={handleChange}
          aria-invalid={errors.guests ? true : undefined}
          aria-describedby={describedBy('guests', ids.guestsHint)}
        />
        <p id={ids.guestsHint} className={styles.hint}>
          {s.guestsHint(venue.capacity)}
        </p>
        {errors.guests && (
          <p id={`${ids.guests}-error`} className={styles.error}>
            {errors.guests}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor={ids.contactEmail}>{s.contactEmail}</label>
        <input
          ref={emailRef}
          id={ids.contactEmail}
          name="contactEmail"
          type="email"
          autoComplete="email"
          required
          value={values.contactEmail}
          onChange={handleChange}
          aria-invalid={errors.contactEmail ? true : undefined}
          aria-describedby={describedBy('contactEmail')}
        />
        {errors.contactEmail && (
          <p id={`${ids.contactEmail}-error`} className={styles.error}>
            {errors.contactEmail}
          </p>
        )}
      </div>

      {submitError !== null && <ErrorState error={submitError} />}

      <div>
        <Button type="submit" disabled={submitting}>
          {submitting ? s.submitting : s.submit}
        </Button>
      </div>
    </form>
  );
}
