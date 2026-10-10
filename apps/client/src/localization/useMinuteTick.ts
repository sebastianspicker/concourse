/** Campus-time ticker shared by screens that show times relative to now. */
import { useEffect, useState } from "react";

/**
 * Re-renders at every minute boundary. Each tick re-arms against the wall clock, so the minute
 * stays aligned after the device sleeps or the tab is backgrounded.
 */
export function useMinuteTick(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const arm = () => {
      timer = setTimeout(() => {
        setNow(new Date());
        arm();
      }, 60_000 - (Date.now() % 60_000) + 50);
    };
    arm();
    return () => clearTimeout(timer);
  }, []);
  return now;
}
