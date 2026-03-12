import { useState, useEffect, useCallback } from "react";
import { subscribeToEvents, isDemoMode } from "@/lib/firebase";
import type { FilterState } from "@/lib/types";
import { MOCK_EVENTS } from "@/lib/mock-data";
import type { WasteBurnEvent } from "@/lib/types";

const defaultFilters: FilterState = {
  classification: "all",
  status: "all",
  confidence_min: 0,
};

export function useEvents() {
  const [events, setEvents] = useState<WasteBurnEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToEvents(filters, (data) => {
      setEvents(data);
      setLoading(false);
      setError(null);
    });
    return () => {
      unsubscribe();
    };
  }, [filters.classification, filters.status, filters.confidence_min]);

  const setFiltersCallback = useCallback((updates: Partial<FilterState>) => {
    setFilters((prev: FilterState) => ({ ...prev, ...updates }));
  }, []);

  return {
    events: isDemoMode && events.length === 0 ? MOCK_EVENTS : events,
    loading,
    error,
    filters,
    setFilters: setFiltersCallback,
    isDemoMode,
  };
}
