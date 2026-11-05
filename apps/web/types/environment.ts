export interface CurrentEnvironment {
  source: string;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  temperature_c: number | null;
  rainfall_mm: number | null;
  precipitation_probability_pct: number | null;
  humidity_pct: number | null;
  wind_speed_kmh: number | null;
  wind_direction_deg: number | null;
  weather_condition: string;
  weather_code: number | null;
  elevation_m: number | null;
  aqi: number | null;
  pm25: number | null;
  pm10: number | null;
  units: Record<string, string>;
  observed_at: string;
  retrieved_at: string;
  is_cached: boolean;
  data_quality: {
    weather_provider: string;
    air_quality_provider: string;
    openaq_ground_coverage: string;
    is_anomaly: boolean;
  };
  attribution: string;
}

export interface HourlyForecastItem {
  time: string;
  temperature_c: number | null;
  precipitation_mm: number | null;
  precipitation_probability_pct: number | null;
  wind_speed_kmh: number | null;
}

export interface DailyForecastItem {
  date: string;
  weather_condition: string;
  temp_max_c: number | null;
  temp_min_c: number | null;
  precipitation_sum_mm: number | null;
  precipitation_probability_max_pct: number | null;
}

export interface ForecastEnvironment {
  source: string;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  forecast_days: number;
  daily: DailyForecastItem[];
  hourly: HourlyForecastItem[];
  retrieved_at: string;
  attribution: string;
}

export interface AirQualityDetails {
  source: string;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  us_aqi: number | null;
  european_aqi: number | null;
  pm25: number | null;
  pm10: number | null;
  carbon_monoxide_ugm3: number | null;
  nitrogen_dioxide_ugm3: number | null;
  sulphur_dioxide_ugm3: number | null;
  ozone_ugm3: number | null;
  category: string;
  openaq_coverage: string;
  observed_at: string;
  retrieved_at: string;
  attribution: string;
}

