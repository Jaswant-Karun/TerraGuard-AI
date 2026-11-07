/**
 * TerraGuard AI — Unified Map Client Service (Prompt 5)
 * Consumes /api/v1/maps/* endpoints with bounding box validation, pagination,
 * date filters, and offline resilience.
 */

import { API_BASE_URL } from '@/services/config';

export interface MapLayerItem {
  id: string;
  name: string;
  category: string;
  layer_type: string;
  description: string;
  endpoint: string;
  source: string;
  update_frequency: string;
  is_active_by_default: boolean;
  default_opacity: number;
}

export interface MapLayersResponse {
  layers: MapLayerItem[];
  total: number;
  categories: string[];
  metadata: Record<string, unknown>;
}

export interface MapGeoJSONResponse {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    id: string;
    properties: Record<string, unknown>;
    geometry: {
      type: string;
      coordinates: unknown;
    };
  }>;
  bbox?: number[];
  metadata: Record<string, unknown>;
  pagination?: {
    page: number;
    page_size: number;
    total_features: number;
    total_pages: number;
    has_more: boolean;
  };
}

export interface MapLegendResponse {
  layers: Array<{
    layer_id: string;
    layer_name: string;
    symbols: Array<{
      label: string;
      color: string;
      shape: string;
      description?: string;
      value_range?: string;
    }>;
  }>;
  metadata: Record<string, unknown>;
}

export interface MapMetadataResponse {
  service_name: string;
  version: string;
  timestamp: string;
  coordinate_reference_system: string;
  default_center: [number, number];
  default_bounding_box: number[];
  available_endpoints: string[];
  mongodb_status: Record<string, unknown>;
  scientific_standards: string;
}

export async function fetchUnifiedMapLayers(): Promise<MapLayersResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/maps/layers`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[UnifiedMapsService] Failed to fetch layers:', err);
    return null;
  }
}

export async function fetchUnifiedMapGeoJSON(
  layerType: 'flood' | 'heat' | 'air-quality' | 'reports' | 'verified-incidents' | 'infrastructure' | 'water-bodies' | 'rainfall',
  params?: {
    bbox?: string;
    page?: number;
    page_size?: number;
    hazard_type?: string;
    category?: string;
    status?: string;
    min_severity?: number;
    min_risk_level?: string;
    start_date?: string;
    end_date?: string;
  }
): Promise<MapGeoJSONResponse | null> {
  try {
    const url = new URL(`${API_BASE_URL}/maps/geojson/${layerType}`);
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          url.searchParams.set(key, String(val));
        }
      });
    }
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[UnifiedMapsService] Failed to fetch geojson/${layerType}:`, err);
    return null;
  }
}

export async function fetchUnifiedMapLegend(): Promise<MapLegendResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/maps/legend`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[UnifiedMapsService] Failed to fetch legend:', err);
    return null;
  }
}

export async function fetchUnifiedMapMetadata(): Promise<MapMetadataResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/maps/metadata`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[UnifiedMapsService] Failed to fetch metadata:', err);
    return null;
  }
}
