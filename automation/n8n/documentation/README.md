# TerraGuard AI — n8n Automation Engine Guide

## Overview
This directory houses the workflow automation specifications, JSON node graphs, and integrations for the **n8n Automation Engine** deployed on Render alongside TerraGuard AI.

## Database Isolation Reminder
> [!IMPORTANT]
> The n8n automation engine operates with an isolated database (persistent disk volume with SQLite or standalone PostgreSQL). It **never** connects directly to or shares collections with TerraGuard's MongoDB Atlas cluster.

## Directory Structure
- `workflows/`: Exported production workflows (`.json`).
- `documentation/`: Integration specs and webhook payload contracts.
- `examples/`: Sample webhook events and test payloads.

## Local Development
To run n8n locally via Docker:
```bash
docker run -it --rm \
  --name terraguard-n8n \
  -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  n8nio/n8n:latest
```
Open [http://localhost:5678](http://localhost:5678) to access the n8n visual editor.

