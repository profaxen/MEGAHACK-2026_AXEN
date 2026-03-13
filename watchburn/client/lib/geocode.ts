const cache = new Map<string, string>();

export async function getLocationName(lat: number, lon: number): Promise<string | null> {
  const key = `${lat.toFixed(3)},${lon.toFixed(3)}`;
  if (cache.has(key)) return cache.get(key)!;

  try {
    const res = await fetch(
      `/api/geocode?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { label?: string };
    const label = (data.label || "").trim();
    if (!label) return null;

    cache.set(key, label);
    return label;
  } catch {
    return null;
  }
}

