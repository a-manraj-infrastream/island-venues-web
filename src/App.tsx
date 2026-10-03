import { useCallback, useEffect, useRef, useState } from 'react';
import { MyBookingsPage } from '@/components/bookings/MyBookingsPage';
import { TopBar } from '@/components/scaffold/TopBar';
import { VenueDetailPage } from '@/components/venues/VenueDetailPage';
import { VenuesPage } from '@/components/venues/VenuesPage';
import { strings } from '@/strings';
import type { View } from '@/view';
import styles from './App.module.css';

export function App() {
  const [view, setView] = useState<View>({ name: 'venues' });
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  // Move focus to the new screen on navigation so keyboard and screen reader
  // users land on the content, as they would after a full page load.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    mainRef.current?.focus();
  }, [view]);

  const showVenues = useCallback(() => setView({ name: 'venues' }), []);
  const showBookings = useCallback(() => setView({ name: 'bookings' }), []);
  const showVenue = useCallback((id: string) => setView({ name: 'venue', id }), []);

  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#main">
        {strings.skipToContent}
      </a>
      <TopBar current={view.name} onNavigate={setView} />
      <main id="main" ref={mainRef} tabIndex={-1} className={styles.main}>
        {view.name === 'venues' && <VenuesPage onSelect={showVenue} />}
        {view.name === 'venue' && (
          <VenueDetailPage key={view.id} id={view.id} onBack={showVenues} onViewBookings={showBookings} />
        )}
        {view.name === 'bookings' && <MyBookingsPage />}
      </main>
      <footer className={styles.footer}>{strings.footer}</footer>
    </div>
  );
}
