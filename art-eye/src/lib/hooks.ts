import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

/**
 * Load data whenever the screen gains focus, so lists reflect actions taken
 * on pushed screens (marking seen, saving, approving) when the user returns.
 */
export function useFocusLoad<T>(load: () => Promise<T>, deps: unknown[] = []) {
  const [result, setResult] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);

  const run = useCallback(() => {
    const id = ++seq.current;
    setError(null);
    load()
      .then((r) => {
        if (seq.current === id) setResult(r);
      })
      .catch((e: Error) => {
        if (seq.current === id) setError(e.message);
      })
      .finally(() => {
        if (seq.current === id) setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useFocusEffect(
    useCallback(() => {
      run();
    }, [run])
  );

  return { data: result, loading, error, reload: run };
}
