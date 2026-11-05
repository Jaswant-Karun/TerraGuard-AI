/**
 * TerraGuard AI — MapLibre Basemap & Tile Configuration
 * Standard OpenStreetMap raster tile endpoints (100% free, no API key required, crisp global coverage)
 */

export const OSM_TILE_URLS = [
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
  "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
  "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
];

export const OSM_ATTRIBUTION = "© OpenStreetMap contributors";

export const DEFAULT_MAP_STYLE: any = {
  version: 8,
  sources: {
    "osm-tiles": {
      type: "raster",
      tiles: OSM_TILE_URLS,
      tileSize: 256,
      attribution: OSM_ATTRIBUTION,
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: "osm-layer",
      type: "raster",
      source: "osm-tiles",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

