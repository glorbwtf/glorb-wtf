#!/bin/bash

# Restart script for glorb.wtf portfolio site
# Usage: ./restart.sh [--no-build]

set -e

SITE_DIR="/root/.openclaw/workspace/glorb-wtf"
BUILD_ENABLED=true

# Parse arguments
if [[ "$1" == "--no-build" ]]; then
    BUILD_ENABLED=false
fi

echo "Restarting glorb.wtf..."

cd "$SITE_DIR"

# Rebuild if enabled
if [[ "$BUILD_ENABLED" == "true" ]]; then
    echo "Building..."
    npm run build
fi

# Restart via pm2
echo "Restarting site via pm2..."
pm2 restart glorb-site

sleep 3

# Verify it's actually running
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
    echo "Site restarted and responding on port 3000"
else
    echo "Site restarted but not yet responding — may still be booting"
fi

echo ""
echo "Live at: https://glorb.wtf"
echo "Local: http://localhost:3000"
