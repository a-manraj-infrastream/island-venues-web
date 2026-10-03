import { useCallback } from 'react';
import { strings } from '@/strings';
import type { View } from '@/view';
import styles from './TopBar.module.css';

interface Props {
  current: View['name'];
  onNavigate: (view: View) => void;
}

export function TopBar({ current, onNavigate }: Props) {
  const goVenues = useCallback(() => onNavigate({ name: 'venues' }), [onNavigate]);
  const goBookings = useCallback(() => onNavigate({ name: 'bookings' }), [onNavigate]);
  const venuesActive = current === 'venues' || current === 'venue';

  return (
    <header className={styles.topBar}>
      <div className={styles.inner}>
        <button type="button" className={styles.brand} onClick={goVenues}>
          <span className={styles.brandName}>{strings.appName}</span>
          <span className={styles.tagline}>{strings.tagline}</span>
        </button>
        <nav aria-label={strings.nav.label}>
          <ul className={styles.links}>
            <li>
              <button
                type="button"
                className={styles.link}
                aria-current={venuesActive ? 'page' : undefined}
                onClick={goVenues}
              >
                {strings.nav.venues}
              </button>
            </li>
            <li>
              <button
                type="button"
                className={styles.link}
                aria-current={current === 'bookings' ? 'page' : undefined}
                onClick={goBookings}
              >
                {strings.nav.myBookings}
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
