#!/bin/bash
# Update a task's status/notes via the glorb.wtf API
# Usage: ./update-task.sh <task_id> <json_body>
# Examples:
#   ./update-task.sh 697e0716758e9dc4f69a40bd '{"status":"active"}'
#   ./update-task.sh 697e0716758e9dc4f69a40bd '{"status":"completed","notes":"done"}'

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: $0 <task_id> '<json_body>'"
    exit 1
fi

# Merge id into the JSON body and send to /api/tasks
BODY=$(echo "$2" | sed "s/^{/{\"id\":\"$1\",/")
curl -s -X PATCH "http://localhost:3000/api/tasks" \
    -H 'Content-Type: application/json' \
    -d "$BODY"
