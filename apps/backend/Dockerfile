# ==============================================================================
# TerraGuard AI — Production FastAPI Backend Container
# Multi-stage lightweight container with non-root security context
# ==============================================================================

FROM python:3.11-slim as builder

WORKDIR /build

# Install system dependencies for compiling wheels (C/C++ extensions, XGBoost)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements-prod.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir --prefix=/install -r requirements-prod.txt

# --- Final Runner Stage ---
FROM python:3.11-slim as runner

WORKDIR /app

# Install runtime dependencies (OpenMP for XGBoost, curl for healthchecks)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder stage
COPY --from=builder /install /usr/local

# Create non-root application user
RUN groupadd -r terraguard && useradd -r -g terraguard -m -d /home/terraguard terraguard

# Create isolated uploads directory and assign ownership
RUN mkdir -p /app/storage/uploads/hazard_media && \
    chown -R terraguard:terraguard /app

# Copy application source
COPY --chown=terraguard:terraguard app ./app
COPY --chown=terraguard:terraguard main.py ./

# Environment defaults
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000 \
    HOST=0.0.0.0 \
    ENVIRONMENT=production

USER terraguard

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]

