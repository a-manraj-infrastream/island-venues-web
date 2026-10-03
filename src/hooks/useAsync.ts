import { useCallback, useEffect, useState } from 'react';

export type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: unknown };

type Outcome<T> = { status: 'success'; data: T } | { status: 'error'; error: unknown };

/** A settled result, tagged with the run that produced it. */
interface Settled<T> {
  load: () => Promise<T>;
  attempt: number;
  outcome: Outcome<T>;
}

/**
 * Runs `load` on mount and whenever `load` changes identity (wrap it in
 * useCallback). Results from a superseded run are dropped, so a slow first
 * response can never overwrite a newer one.
 *
 * "Loading" is derived rather than stored: the state is loading whenever the
 * latest settled result belongs to a different run. That avoids a synchronous
 * setState inside the effect (an extra render on every load).
 */
export function useAsync<T>(load: () => Promise<T>) {
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<Settled<T> | null>(null);

  useEffect(() => {
    let current = true;
    load().then(
      (data) => {
        if (current) setSettled({ load, attempt, outcome: { status: 'success', data } });
      },
      (error: unknown) => {
        if (current) setSettled({ load, attempt, outcome: { status: 'error', error } });
      },
    );
    return () => {
      current = false;
    };
  }, [load, attempt]);

  const state: AsyncState<T> =
    settled && settled.load === load && settled.attempt === attempt ? settled.outcome : { status: 'loading' };

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  // Lets a view patch loaded data in place (e.g. after cancelling a booking)
  // without a full reload.
  const setData = useCallback((update: (data: T) => T) => {
    setSettled((prev) =>
      prev && prev.outcome.status === 'success'
        ? { ...prev, outcome: { status: 'success', data: update(prev.outcome.data) } }
        : prev,
    );
  }, []);

  return { state, reload, setData };
}
