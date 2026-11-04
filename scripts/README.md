# TerraGuard AI — Utility Scripts

## Purpose
This directory contains utility scripts for:
1. **Geospatial Seeding:** Populating test urban zones, sensors, and historical incidents into MongoDB Atlas.
2. **ML Model Training:** Fitting and serializing XGBoost flood inundation and air risk models.
3. **Environmental Simulator:** Mock sensor telemetry harness for testing without network connectivity.

Scripts are executed via the backend virtual environment:
```powershell
apps/backend/.venv/Scripts/python scripts/<script_name>.py
```

