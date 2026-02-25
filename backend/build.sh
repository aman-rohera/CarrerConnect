#!/usr/bin/env bash
# Build script for Render deployment

set -o errexit

# Navigate to backend directory if not already there
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Install requirements - handle both rootDir and full repo scenarios
if [ -f "../requirements.txt" ]; then
    pip install -r ../requirements.txt
elif [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
fi

# Run Django management commands
python manage.py collectstatic --no-input
python manage.py migrate
