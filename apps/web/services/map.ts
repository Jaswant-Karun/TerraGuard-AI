import { MapLayersData } from "@/types/map";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

export async function fetchMapLayers(params?: {
  lat?: number;
  lng?: number;
  radiusKm?: number;
}): Promise<MapLayersData> {
  const query = new URLSearchParams();
  if (params?.lat !== undefined) query.set("lat", params.lat.toString());
  if (params?.lng !== undefined) query.set("lng", params.lng.toString());
  if (params?.radiusKm !== undefined)
    query.set("radius_km", params.radiusKm.toString());

  const url = `${API_BASE_URL}/geospatial/map-layers${
    query.toString() ? `?${query.toString()}` : ""
  }`;

  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch map layers (HTTP ${res.status})`);
  }

  return res.json();
}

export interface GeocodingResult {
  name: string;
  category: string;
  coordinates: [number, number]; // [lng, lat]
}

const PRESET_URBAN_LOCATIONS: GeocodingResult[] = [
  {
    name: "Bengaluru Metropolitan Command Hub",
    category: "MUNICIPAL_HQ",
    coordinates: [77.5946, 12.9716],
  },
  {
    name: "Central Silk Board Inundation Sector",
    category: "RISK_HOTSPOT",
    coordinates: [77.6245, 12.9180],
  },
  {
    name: "Bellandur Lake Catchment Basin",
    category: "FLOOD_ZONE",
    coordinates: [77.6711, 12.9348],
  },
  {
    name: "Koramangala Stormwater Pumping Station",
    category: "PUMP_STATION",
    coordinates: [77.6245, 12.9352],
  },
  {
    name: "Peenya Industrial Air Quality Hub",
    category: "AIR_HOTSPOT",
    coordinates: [77.5255, 13.0305],
  },
  {
    name: "Hebbal Lake Siphon Station",
    category: "SENSOR_STATION",
    coordinates: [77.5925, 13.0382],
  },
  {
    name: "Victoria Hospital Emergency Trauma Center",
    category: "HOSPITAL",
    coordinates: [77.5738, 12.9642],
  },
  {
    name: "Indiranagar 100ft Road Corridor",
    category: "CIVIC_CORRIDOR",
    coordinates: [77.6408, 12.9719],
  },
  {
    name: "Whitefield Industrial Sub-Sector",
    category: "MONITORING_ZONE",
    coordinates: [77.7499, 12.9698],
  },
];

export async function searchLocations(query: string): Promise<GeocodingResult[]> {
  const cleanQ = query.trim().toLowerCase();
  if (!cleanQ) return [];

  // 1. Search local high-confidence presets
  const localMatches = PRESET_URBAN_LOCATIONS.filter((l) =>
    l.name.toLowerCase().includes(cleanQ) || l.category.toLowerCase().includes(cleanQ)
  );

  if (localMatches.length > 0) {
    return localMatches;
  }

  // 2. Fallback to OpenStreetMap Nominatim for freeform global search
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query
      )}&format=json&limit=5&addressdetails=1`,
      {
        headers: {
          "Accept-Language": "en",
        },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((item: any) => ({
      name: item.display_name,
      category: item.type || "LANDMARK",
      coordinates: [parseFloat(item.lon), parseFloat(item.lat)],
    }));
  } catch {
    return [];
  }
}
