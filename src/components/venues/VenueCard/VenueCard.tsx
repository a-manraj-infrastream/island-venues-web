import { useCallback, useId } from 'react';
import type { Venue } from '@/api';
import { Button } from '@/components/common/Button';
import { formatMur } from '@/format';
import { strings } from '@/strings';
import styles from './VenueCard.module.css';

interface Props {
  venue: Venue;
  onSelect: (id: string) => void;
}

export function VenueCard({ venue, onSelect }: Props) {
  const handleSelect = useCallback(() => onSelect(venue.id), [onSelect, venue.id]);
  const s = strings.venues;
  // useId, not the venue id: API ids are not guaranteed to be valid DOM ids.
  const headingId = useId();

  return (
    <article className={styles.card} aria-labelledby={headingId}>
      <h2 id={headingId} className={styles.name}>
        {venue.name}
      </h2>
      <dl className={styles.facts}>
        <div>
          <dt>{s.town}</dt>
          <dd>{venue.town}</dd>
        </div>
        <div>
          <dt>{s.capacity}</dt>
          <dd>{s.guests(venue.capacity)}</dd>
        </div>
        <div>
          <dt>{s.pricePerDay}</dt>
          <dd>{formatMur(venue.pricePerDayMur)}</dd>
        </div>
      </dl>
      <Button
        variant="secondary"
        className={styles.action}
        aria-label={s.viewAndBook(venue.name)}
        onClick={handleSelect}
      >
        {s.viewAndBookShort}
      </Button>
    </article>
  );
}
