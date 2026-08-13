import { useEffect, useRef, useState } from "react";
import { http } from "../lib/http/client";

export function useBackendHealth() {
  const [online, setOnline] = useState(true);
  const [checking, setChecking] = useState(true);
  const failStreak = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function probe(): Promise<boolean> {
      try {
        await http.get("/unknown", { timeout: 8000 });
        return true;
      } catch (err: any) {
        // Any HTTP response at all (4xx, 5xx, …) = server is reachable
        return Boolean(err?.response);
      }
    }

    async function initialCheck() {
      // Try up to 3 times with a 2s gap before giving up.
      // Surfaces the offline state in ≤ 6s instead of ≥ 45s.
      for (let attempt = 0; attempt < 3; attempt++) {
        if (cancelled) return;

        const ok = await probe();
        if (ok) {
          if (!cancelled) {
            failStreak.current = 0;
            setOnline(true);
            setChecking(false);
          }
          return;
        }

        if (attempt < 2 && !cancelled) {
          await new Promise<void>((r) => setTimeout(r, 2000));
        }
      }

      if (!cancelled) {
        failStreak.current = 3;
        setOnline(false);
        setChecking(false);
      }
    }

    function periodicCheck() {
      if (cancelled) return;
      probe().then((ok) => {
        if (cancelled) return;
        if (ok) {
          failStreak.current = 0;
          setOnline(true);
        } else {
          failStreak.current += 1;
          if (failStreak.current >= 3) {
            setOnline(false);
          }
        }
      });
    }

    initialCheck().then(() => {
      if (!cancelled) {
        intervalRef.current = setInterval(periodicCheck, 15_000);
      }
    });

    return () => {
      cancelled = true;
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return { online, checking };
}
