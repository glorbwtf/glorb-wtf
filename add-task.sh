#!/bin/bash
# Add a new task via the glorb.wtf API
# Usage: ./add-task.sh '<json_body>'
# Example:
#   ./add-task.sh '{"name":"Fix bug","description":"...","status":"backlog","category":"technical","priority":"normal"}'

if [ -z "$1" ]; then
    echo "Usage: $0 '<json_body>'"
    exit 1
fi

curl -s -X POST http://localhost:3000/api/tasks \
    -H 'Content-Type: application/json' \
    -d "$1"
