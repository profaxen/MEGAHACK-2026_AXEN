import { useEffect, useState } from "react";
import type { SystemStats } from "../lib/types";
import { getStats } from "../lib/firebase";
import { getMockStats } from "../lib/mock-data";

export interface UseStatsResult {
  stats: SystemStats | null;
  loading: boolean;
}

export function useStats(): UseStatsResult {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async (): Promise<void> => {
      setLoading(true);
      try {
        const data = await getStats();
        if (active) setStats(data);
      } catch {
        if (active) setStats(getMockStats());
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  return { stats, loading };
}

export default useStats;

