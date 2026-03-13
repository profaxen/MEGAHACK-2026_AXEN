import { useState, useEffect } from "react";
import { getStats, isDemoMode } from "@/lib/firebase";
import { getMockStats } from "@/lib/mock-data";
import type { SystemStats } from "@/lib/types";

export function useStats() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getStats()
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => {
        setStats(getMockStats());
        setLoading(false);
      });
  }, []);

  return {
    stats: stats ?? (isDemoMode ? getMockStats() : null),
    loading,
  };
}
