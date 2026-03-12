import axios from "axios";

const cache = new Map<string, string>();

export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  const key = `${lat.toFixed(3)},${lon.toFixed(3)}`;
  if (cache.has(key)) return cache.get(key)!;

  try {
    const url = "https://nominatim.openstreetmap.org/reverse";
    const { data } = await axios.get<{
      display_name?: string;
      address?: { city?: string; town?: string; village?: string; state?: string; country?: string };
    }>(url, {
      params: {
        format: "jsonv2",
        lat,
        lon,
        zoom: 10,
        addressdetails: 1,
      },
      headers: {
        "Accept": "application/json",
        "User-Agent": "watchburn-local-dev/1.0",
      },
      timeout: 5000,
    });

    const addr = data.address;
    const parts = [
      addr?.city || addr?.town || addr?.village,
      addr?.state,
      addr?.country,
    ].filter(Boolean);

    const label = (parts.join(", ") || data.display_name || "").trim();
    if (!label) return null;

    cache.set(key, label);
    return label;
  } catch {
    return null;
  }
}

