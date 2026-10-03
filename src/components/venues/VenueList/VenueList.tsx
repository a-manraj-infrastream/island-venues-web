import type { Venue } from '@/api';
import { VenueCard } from '@/components/venues/VenueCard';
import { strings } from '@/strings';
import styles from './VenueList.module.css';

interface Props {
  venues: Venue[];
  onSelect: (id: string) => void;
}

export function VenueList({ venues, onSelect }: Props) {
  if (venues.length === 0) {
    return <p className={styles.empty}>{strings.venues.empty}</p>;
  }
  return (
    <ul className={styles.grid}>
      {venues.map((venue) => (
        <li key={venue.id}>
          <VenueCard venue={venue} onSelect={onSelect} />
        </li>
      ))}
    </ul>
  );
}
