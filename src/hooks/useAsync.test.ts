import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useAsync } from '@/hooks/useAsync';

function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe('useAsync', () => {
  it('goes loading → success, and back to loading on reload', async () => {
    let n = 0;
    const load = () => Promise.resolve(++n);
    const { result } = renderHook(() => useAsync(load));

    expect(result.current.state).toEqual({ status: 'loading' });
    await waitFor(() => expect(result.current.state).toEqual({ status: 'success', data: 1 }));

    act(() => result.current.reload());
    expect(result.current.state).toEqual({ status: 'loading' });
    await waitFor(() => expect(result.current.state).toEqual({ status: 'success', data: 2 }));
  });

  it('drops a slow result from a superseded loader', async () => {
    const slow = deferred<string>();
    const fast = deferred<string>();
    const loadA = () => slow.promise;
    const loadB = () => fast.promise;
    const { result, rerender } = renderHook(({ load }) => useAsync(load), { initialProps: { load: loadA } });

    rerender({ load: loadB });
    await act(async () => fast.resolve('B'));
    await act(async () => slow.resolve('A'));

    expect(result.current.state).toEqual({ status: 'success', data: 'B' });
  });

  it('exposes rejections as an error state', async () => {
    const boom = new Error('boom');
    const load = () => Promise.reject(boom);
    const { result } = renderHook(() => useAsync(load));
    await waitFor(() => expect(result.current.state).toEqual({ status: 'error', error: boom }));
  });
});
