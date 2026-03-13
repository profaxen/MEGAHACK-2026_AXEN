import { useEffect, useState } from "react";
import type { WasteBurnEvent, FilterState } from "../lib/types";
import { subscribeToEvents, isDemoMode } from "../lib/firebase";
import { MOCK_EVENTS } from "../lib/mock-data";

export interface UseEventsResult {
  events: WasteBurnEvent[];
  loading: boolean;
  error: string | null;
  filters: FilterState;
  setFilters: (updater: (prev: FilterState) => FilterState) => void;
}

const defaultFilters: FilterState = {
  classification: "all",
  status: "all",
  confidence_min: 0
};

export function useEvents(): UseEventsResult {
  const [events, setEvents] = useState<WasteBurnEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] =
    useState<FilterState>(defaultFilters);

  useEffect(() => {
    setLoading(true);
    setError(null);

    if (isDemoMode) {
      setEvents(MOCK_EVENTS);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToEvents(filters, (incoming) => {
      setEvents(incoming);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [filters]);

  const setFilters = (updater: (prev: FilterState) => FilterState): void => {
    setFiltersState((prev) => updater(prev));
  };

  return {
    events,
    loading,
    error,
    filters,
    setFilters
  };
}

export default useEvents;

