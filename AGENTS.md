# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

**ФураЕдет** — a logistics SaaS application for cargo transportation management. Django REST API backend with HTML/JS frontend via Django templates. Integrates Yandex Maps for routing and multiple AI providers for load optimization.

## Development Commands

All commands run from `server/` directory:

```bash
# Install dependencies
pip install -r requirements.txt

# Apply migrations
python manage.py migrate

# Run development server (http://127.0.0.1:8000)
python manage.py runserver

# Run Django unit tests
python manage.py test

# Run API endpoint tests (requires running server)
python test_api_endpoints.py

# Collect static files
python manage.py collectstatic --noinput

# Create default superuser (uses CREATE_ADMIN_EMAIL / CREATE_ADMIN_PASSWORD env vars)
python manage.py create_default_superuser
```

## Environment Setup

Copy `server/env.example` to `server/.env.local` and fill in:
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` — PostgreSQL credentials
- `SECRET_KEY` — Django secret key
- `YANDEX_MAPS_API_KEY` — for geocoding and routing
- `GEMINI_API_KEY` — primary AI provider (Google Gemini 2.0 Flash)
- Optional fallback AI keys: `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `GIGACHAT_API_KEY`

For production (Render), `DATABASE_URL` overrides individual DB settings via `dj-database-url`.

## Architecture

### App Structure

The entire backend lives in one Django app: `server/logistics/`. The `server/core/` directory contains only project-level settings and URL routing.

```
server/
├── core/            # Django project config (settings, urls, wsgi)
├── logistics/       # The single Django app (models, views, serializers, services)
├── templates/       # Django HTML templates (index, login, register, dashboard)
├── static/          # CSS, JS, images
├── media/           # User uploads (avatars)
└── manage.py
```

### Custom User Model

`logistics.User` replaces Django's default User. Uses email (not username) as the login field. Roles: `client`, `manager`, `admin`.

### Permission System

Custom DRF permission classes in `logistics/permissions.py`: `IsClient`, `IsManager`, `IsAdmin`, `IsManagerOrAdmin`, `IsOwnerOrManagerOrAdmin`. Applied per-view via `@permission_classes`.

### Service Layer (`logistics/services.py`)

- **`AIService`**: Multi-provider AI with automatic fallback chain — Gemini → Groq → DeepSeek → GigaChat. Used for load optimization recommendations.
- **`YandexMapsService`**: Geocoding (address → coordinates), route calculation, distance matrix.

### Order Lifecycle

`draft` → `pending` → `in_progress` → `shipped` → `delivered` / `rejected`

Orders have auto-generated tracking IDs (`FE-XXXXXX`). Public tracking endpoint at `/api/orders/track/<tracking_id>/` requires no authentication.

### Price Calculation

Based on Tariff model: `price_per_km × distance + weight_coef × weight`. Distance fetched from Yandex Maps or local distance table (`logistics/distances.py`).

### URL Structure

- `/` — frontend pages (index, login, register, dashboard)
- `/admin/` — Django admin
- `/api/` — REST API (auth, orders, users, drivers, trucks, addresses, tariffs, AI endpoints)
- `/media/` — user uploads (served by Django in dev, WhiteNoise/Gunicorn in prod)

### Frontend

Django templates with vanilla JS making fetch() calls to the REST API. CORS is configured to allow `localhost:5173` for potential Vue/React development. JWT tokens stored client-side; `Authorization: Bearer <token>` header used for API calls.

### JWT Configuration

- Access tokens: 1 hour
- Refresh tokens: 7 days
- Token rotation enabled; tokens blacklisted on logout

## Production Deployment (Render)

Build command:
```bash
pip install -r server/requirements.txt && cd server && python manage.py migrate --noinput && python manage.py collectstatic --noinput
```

Start command:
```bash
cd server && gunicorn core.wsgi --bind 0.0.0.0:$PORT
```

Static files served by WhiteNoise middleware. Media files served via `start.sh` wrapper.
