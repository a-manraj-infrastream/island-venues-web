import { useCallback, useState } from 'react';
import { createBooking, getVenue, isApiError, type Booking, type NewBooking } from '@/api';
import { Button } from '@/components/common/Button';
import { ErrorState } from '@/components/common/ErrorState';
import { Loading } from '@/components/common/Loading';
import { Notice } from '@/components/common/Notice';
import { BookingForm } from '@/components/bookings/BookingForm';
import { formatDate, formatMur, localToday } from '@/format';
import { useAsync } from '@/hooks/useAsync';
import { strings } from '@/strings';
import styles from './VenueDetailPage.module.css';

interface Props {
  id: string;
  onBack: () => void;
  onViewBookings: () => void;
}

export function VenueDetailPage({ id, onBack, onViewBookings }: Props) {
  const load = useCallback(() => getVenue(id), [id]);
  const { state, reload } = useAsync(load);
  const [booked, setBooked] = useState<Booking | null>(null);
  // Fixed for the life of the page so the form's min date does not shift mid-edit.
  const [today] = useState(localToday);

  const handleSubmit = useCallback(async (booking: NewBooking) => {
    setBooked(await createBooking(booking));
  }, []);

  const s = strings.venues;

  return (
    <section className={styles.page} aria-labelledby="venue-heading">
      <div>
        <Button variant="secondary" onClick={onBack}>
          {strings.venue.back}
        </Button>
      </div>

      {state.status === 'loading' && <Loading label={strings.venue.loading} />}
      {state.status === 'error' &&
        (isApiError(state.error) && state.error.kind === 'not_found' ? (
          <Notice tone="error">
            <p>{strings.venue.notFound}</p>
          </Notice>
        ) : (
          <ErrorState error={state.error} onRetry={reload} />
        ))}

      {state.status === 'success' && (
        <div className={styles.layout}>
          <article className={styles.details}>
            <h1 id="venue-heading" className={styles.name}>
              {state.data.name}
            </h1>
            <p className={styles.town}>{state.data.town}</p>
            <dl className={styles.facts}>
              <div>
                <dt>{s.capacity}</dt>
                <dd>{s.guests(state.data.capacity)}</dd>
              </div>
              <div>
                <dt>{s.pricePerDay}</dt>
                <dd>{formatMur(state.data.pricePerDayMur)}</dd>
              </div>
            </dl>
            <p className={styles.description}>{state.data.description}</p>
            {state.data.tags.length > 0 && (
              <>
                <h2 className="visually-hidden">{strings.venue.tags}</h2>
                <ul className={styles.tags}>
                  {state.data.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
              </>
            )}
          </article>

          <div>
            {booked ? (
              <Notice
                tone="success"
                title={strings.booking.successHeading}
                action={<Button onClick={onViewBookings}>{strings.booking.viewMyBookings}</Button>}
              >
                <p>{strings.booking.success(booked.venueName, formatDate(booked.date))}</p>
              </Notice>
            ) : (
              <BookingForm venue={state.data} today={today} onSubmit={handleSubmit} />
            )}
          </div>
        </div>
      )}
    </section>
  );
}
