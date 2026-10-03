import { listVenues } from '@/api';
import { ErrorState } from '@/components/common/ErrorState';
import { Loading } from '@/components/common/Loading';
import { VenueList } from '@/components/venues/VenueList';
import { useAsync } from '@/hooks/useAsync';
import { strings } from '@/strings';
import styles from './VenuesPage.module.css';

interface Props {
  onSelect: (id: string) => void;
}

export function VenuesPage({ onSelect }: Props) {
  // listVenues is a stable module function, so it is safe as the loader.
  const { state, reload } = useAsync(listVenues);

  return (
    <section className={styles.page} aria-labelledby="venues-heading">
      <header className={styles.header}>
        <h1 id="venues-heading" className={styles.heading}>
          {strings.venues.heading}
        </h1>
        <p className={styles.intro}>{strings.venues.intro}</p>
      </header>
      {state.status === 'loading' && <Loading label={strings.venues.loading} />}
      {state.status === 'error' && <ErrorState error={state.error} onRetry={reload} />}
      {state.status === 'success' && <VenueList venues={state.data} onSelect={onSelect} />}
    </section>
  );
}
