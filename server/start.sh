#!/usr/bin/env bash
set -e
python manage.py migrate --noinput
exec gunicorn core.wsgi --bind 0.0.0.0:${PORT:-10000}
