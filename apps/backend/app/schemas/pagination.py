from typing import Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1, description="Page number starting at 1")
    page_size: int = Field(default=20, ge=1, le=100, description="Items per page (max 100)")

    @property
    def skip(self) -> int:
        return (self.page - 1) * self.page_size


class PaginatedResponse(BaseModel, Generic[T]):  # noqa: UP046
    items: list[T]
    total: int = Field(description="Total count of matching records")
    page: int = Field(description="Current page number")
    page_size: int = Field(description="Items per page")
    total_pages: int = Field(description="Total calculated pages")
    has_next: bool = Field(description="Whether a next page exists")
    has_prev: bool = Field(description="Whether a previous page exists")


class GeospatialQueryParams(BaseModel):
    lat: float = Field(..., ge=-90.0, le=90.0, description="Center latitude in degrees")
    lng: float = Field(..., ge=-180.0, le=180.0, description="Center longitude in degrees")
    radius_km: float = Field(default=10.0, gt=0.0, le=500.0, description="Search radius in kilometers")

    @property
    def radius_meters(self) -> float:
        return self.radius_km * 1000.0
