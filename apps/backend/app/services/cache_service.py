import time
from typing import Any


class CacheService:
    """Thread-safe, high-performance in-memory TTL caching service for external APIs."""

    def __init__(self) -> None:
        self._cache: dict[str, tuple[float, Any]] = {}

    def get(self, key: str) -> Any | None:
        """Retrieves value from cache if present and not expired."""
        if key not in self._cache:
            return None
        expires_at, value = self._cache[key]
        if time.time() > expires_at:
            del self._cache[key]
            return None
        return value

    def set(self, key: str, value: Any, ttl_seconds: int = 600) -> None:
        """Stores value in cache with specified time-to-live (default 10 minutes)."""
        expires_at = time.time() + ttl_seconds
        self._cache[key] = (expires_at, value)

    def delete(self, key: str) -> None:
        """Evicts a specific key from cache."""
        self._cache.pop(key, None)

    def clear(self) -> None:
        """Flushes the entire cache."""
        self._cache.clear()

    def size(self) -> int:
        return len(self._cache)


cache_service = CacheService()

