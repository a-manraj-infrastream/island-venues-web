import { useCallback, useMemo, useState } from 'react';
import { cancelBooking, listMyBookings, type Booking, type BookingStatus } from '@/api';
import { Button } from '@/components/common/Button';
import { ErrorState } from '@/components/common/ErrorState';
import { Loading } from '@/components/common/Loading';
import { StatusBadge } from '@/components/bookings/StatusBadge';
import { formatDate } from '@/format';
import { useAsync } from '@/hooks/useAsync';
import { strings } from '@/strings';
import styles from './MyBookingsPage.module.css';

// A booking that is already closed cannot be cancelled; a PAID one needs a
// refund, which is a staff action.
const CANCELLABLE: ReadonlySet<BookingStatus> = new Set(['PENDING', 'APPROVED']);

export function MyBookingsPage() {
  const { state, reload, setData } = useAsync(listMyBookings);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<unknown>(null);
  const s = strings.myBookings;

  const handleCancel = useCallback(
    async (id: string) => {
      setCancellingId(id);
      setCancelError(null);
      try {
        const updated = await cancelBooking(id);
        setData((bookings) =>
          bookings.map((b) => {
            if (b.id !== id) return b;
            // An empty 204 still means the cancellation succeeded.
            return updated ?? { ...b, status: 'CANCELLED' };
          }),
        );
      } catch (err: unknown) {
        setCancelError(err);
      } finally {
        setCancellingId(null);
      }
    },
    [setData],
  );

  const sorted = useMemo<Booking[]>(
    () =>
      state.status === 'success'
        ? [...state.data].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt))
        : [],
    [state],
  );

  return (
    <section className={styles.page} aria-labelledby="bookings-heading">
      <h1 id="bookings-heading" className={styles.heading}>
        {s.heading}
      </h1>

      {state.status === 'loading' && <Loading label={s.loading} />}
      {state.status === 'error' && <ErrorState error={state.error} onRetry={reload} />}
      {cancelError !== null && <ErrorState error={cancelError} />}

      {state.status === 'success' && sorted.length === 0 && <p className={styles.empty}>{s.empty}</p>}

      {state.status === 'success' && sorted.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className="visually-hidden">{s.heading}</caption>
            <thead>
              <tr>
                <th scope="col">{s.venue}</th>
                <th scope="col">{s.date}</th>
                <th scope="col" className={styles.numeric}>
                  {s.guests}
                </th>
                <th scope="col">{s.status}</th>
                <th scope="col">
                  <span className="visually-hidden">{s.actions}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((booking) => {
                const date = formatDate(booking.date);
                const busy = cancellingId === booking.id;
                return (
                  <tr key={booking.id}>
                    <th scope="row">{booking.venueName}</th>
                    <td>{date}</td>
                    <td className={styles.numeric}>{booking.guests}</td>
                    <td>
                      <StatusBadge status={booking.status} />
                    </td>
                    <td className={styles.actionCell}>
                      {CANCELLABLE.has(booking.status) && (
                        <Button
                          variant="danger"
                          disabled={cancellingId !== null}
                          aria-label={s.cancelLabel(booking.venueName, date)}
                          onClick={() => void handleCancel(booking.id)}
                        >
                          {busy ? s.cancelling : s.cancel}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
