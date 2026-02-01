#!/bin/bash
# Log activity to the glorb.wtf activity feed
# Usage: ./log-activity.sh "event message" "optional details" [category]

API_URL="http://localhost:3000/api/activity"

# Load API token from .env
source /root/.openclaw/.env

if [ -z "$ACTIVITY_API_TOKEN" ]; then
  echo "✗ ACTIVITY_API_TOKEN not found in .env"
  exit 1
fi

EVENT="$1"
DETAILS="${2:-}"
CATEGORY="${3:-thought}"

if [ -z "$EVENT" ]; then
  echo "Usage: $0 \"event message\" \"optional details\" [category]"
  echo "Categories: infra, github, ai, browser, x, thought, deploy, technical, portfolio"
  exit 1
fi

# Build JSON payload
if [ -n "$DETAILS" ]; then
  JSON="{\"event\":\"$EVENT\",\"details\":\"$DETAILS\",\"category\":\"$CATEGORY\"}"
else
  JSON="{\"event\":\"$EVENT\",\"category\":\"$CATEGORY\"}"
fi

# Send to API
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACTIVITY_API_TOKEN" \
  -d "$JSON" 2>&1)

if echo "$RESPONSE" | grep -q '"activity"'; then
  echo "✓ Logged: $EVENT"
else
  echo "✗ Failed to log activity"
  echo "$RESPONSE"
fi
