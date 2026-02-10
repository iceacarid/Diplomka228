#!/usr/bin/env bash
set -e
python manage.py migrate --noinput
python manage.py create_default_superuser
exec gunicorn core.wsgi --bind 0.0.0.0:${PORT:-10000}
