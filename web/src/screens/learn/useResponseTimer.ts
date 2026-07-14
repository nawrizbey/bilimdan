import { useEffect, useRef } from 'react';

/** Tracks ms since mount (i.e. since this exercise became visible), reset
 * whenever `resetKey` changes (e.g. moving to the next queue item — though in
 * practice the session screen already remounts exercises via a `key` on every
 * item, so this mostly guards the very first render). */
export function useResponseTimer(resetKey: unknown) {
  const startRef = useRef(0);
  useEffect(() => {
    startRef.current = Date.now();
  }, [resetKey]);
  return () => Date.now() - startRef.current;
}
