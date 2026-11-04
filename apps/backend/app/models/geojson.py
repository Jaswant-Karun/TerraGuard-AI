from typing import Literal
from pydantic import BaseModel, Field, field_validator


class GeoJSONPoint(BaseModel):
    """
    Standard GeoJSON Point according to RFC 7946.
    Coordinates must be [longitude, latitude].
    """
    type: Literal["Point"] = "Point"
    coordinates: list[float] = Field(
        ...,
        description="Geographic coordinates in [longitude, latitude] order",
        min_length=2,
        max_length=2,
    )

    @field_validator("coordinates")
    @classmethod
    def validate_coordinates(cls, v: list[float]) -> list[float]:
        if len(v) != 2:
            raise ValueError("Point coordinates must contain exactly [longitude, latitude].")
        lng, lat = v[0], v[1]
        if not (-180.0 <= lng <= 180.0):
            raise ValueError(f"Longitude must be between -180 and 180 degrees. Got {lng}.")
        if not (-90.0 <= lat <= 90.0):
            raise ValueError(f"Latitude must be between -90 and 90 degrees. Got {lat}.")
        return v


class GeoJSONPolygon(BaseModel):
    """
    Standard GeoJSON Polygon according to RFC 7946.
    Coordinates is a list of linear rings, each ring being a list of [longitude, latitude] pairs.
    """
    type: Literal["Polygon"] = "Polygon"
    coordinates: list[list[list[float]]] = Field(
        ...,
        description="List of closed linear rings, each consisting of at least 4 coordinate pairs.",
    )

    @field_validator("coordinates")
    @classmethod
    def validate_polygon(cls, v: list[list[list[float]]]) -> list[list[list[float]]]:
        if not v or not v[0]:
            raise ValueError("Polygon must contain at least one linear ring.")
        for ring in v:
            if len(ring) < 4:
                raise ValueError("A linear ring must have at least 4 coordinate pairs.")
            # Check closed ring
            if ring[0] != ring[-1]:
                raise ValueError(
                    f"First and last coordinate of linear ring must be equal. Got start={ring[0]}, end={ring[-1]}."
                )
            for pt in ring:
                if len(pt) != 2:
                    raise ValueError(f"Each coordinate in ring must be [longitude, latitude]. Got {pt}.")
                if not (-180.0 <= pt[0] <= 180.0) or not (-90.0 <= pt[1] <= 90.0):
                    raise ValueError(f"Coordinate pair {pt} out of geographical bounds.")
        return v


class GeoJSONLineString(BaseModel):
    """
    Standard GeoJSON LineString according to RFC 7946.
    Used for safe evacuation corridors and transit routes.
    """
    type: Literal["LineString"] = "LineString"
    coordinates: list[list[float]] = Field(
        ...,
        description="List of two or more coordinate positions.",
        min_length=2,
    )

    @field_validator("coordinates")
    @classmethod
    def validate_linestring(cls, v: list[list[float]]) -> list[list[float]]:
        if len(v) < 2:
            raise ValueError("LineString must contain at least 2 coordinate positions.")
        for pt in v:
            if len(pt) != 2:
                raise ValueError(f"Each point must be [longitude, latitude]. Got {pt}.")
            if not (-180.0 <= pt[0] <= 180.0) or not (-90.0 <= pt[1] <= 90.0):
                raise ValueError(f"Coordinate pair {pt} out of bounds.")
        return v
