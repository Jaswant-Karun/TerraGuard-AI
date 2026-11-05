export type HazardCategory =
  | "WATERLOGGING"
  | "ROAD_FLOODING"
  | "DAMAGED_ROAD"
  | "FALLEN_TREE"
  | "WASTE_ACCUMULATION"
  | "OTHER";

export type ReportStatus =
  | "REPORTED"
  | "AI_ANALYZED"
  | "VERIFIED"
  | "DISPATCHED"
  | "RESOLVED"
  | "REJECTED";

export interface VisionAnalysisDTO {
  predicted_category: HazardCategory | string;
  short_description: string;
  visible_evidence: string[];
  confidence_estimate: number;
  suggested_verification_status: string;
  safety_precautions: string[];
  model_name: string;
  is_live_gemini: boolean;
  confidence_calibration_notice: string;
}

export interface ReportItem {
  id: string;
  title: string;
  description: string;
  category: HazardCategory | string;
  severity: number;
  status: ReportStatus;
  location: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  address?: string | null;
  media_urls: string[];
  image_hash?: string | null;
  reported_by_user_id?: string | null;
  ai_analysis?: VisionAnalysisDTO | Record<string, unknown>;
  is_potential_duplicate: boolean;
  duplicate_of_report_id?: string | null;
  duplicate_metadata?: {
    matched_report_id?: string;
    similarity_score?: number;
    reason?: string;
    distance_meters?: number;
  };
  verification_notes?: string | null;
  verified_by_user_id?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface ReportListResponse {
  items: ReportItem[];
  total: number;
  page: number;
  page_size: number;
}

