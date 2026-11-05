export type SafetyStatus =
  | "VERIFIED_SAFER_ROUTE"
  | "STANDARD_ROUTE"
  | "CAUTION_ROUTE"
  | "HAZARDOUS_ROUTE";

export interface HazardIntersection {
  hazard_id: string;
  hazard_category: string;
  severity: number;
  distance_to_route_meters: number;
  description: string;
  location: [number, number];
}

export interface RouteAlternative {
  route_id: string;
  name: string;
  safety_status: SafetyStatus;
  safety_label: string;
  distance_meters: number;
  distance_km: number;
  duration_seconds: number;
  duration_minutes: number;
  path_geojson: {
    type: "LineString";
    coordinates: [number, number][];
  };
  risk_score: number;
  risk_explanation: string;
  hazard_intersections: HazardIntersection[];
  avoided_hazards_count: number;
  data_sufficiency: "SUFFICIENT" | "INSUFFICIENT";
  disclaimer: string;
}

export type FacilityCategory =
  | "HOSPITAL"
  | "EMERGENCY_SHELTER"
  | "FIRE_STATION"
  | "PUMP_STATION"
  | "POLICE_POST"
  | "SENSOR_STATION"
  | "RELIEF_HUB";

export interface Facility {
  id: string;
  name: string;
  category: FacilityCategory;
  address: string;
  capacity?: number | null;
  is_operational: boolean;
  contact_phone?: string | null;
  coordinates: [number, number];
  distance_meters: number;
  distance_km: number;
}

export interface RouteQueryRequest {
  origin: [number, number];
  destination: [number, number];
  mode?: "driving" | "walking" | "emergency_vehicle";
  avoid_hazards?: boolean;
  max_alternatives?: number;
}

export interface RouteQueryResponse {
  origin: [number, number];
  destination: [number, number];
  provider: string;
  primary_route: RouteAlternative;
  alternatives: RouteAlternative[];
  nearby_facilities: Facility[];
  overall_hazard_data_sufficiency: boolean;
  disclaimer: string;
}

export interface NearbyFacilitiesResponse {
  facilities: Facility[];
  total: number;
  center: [number, number];
  radius_km: number;
}

