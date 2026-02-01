#!/bin/bash
# MongoDB backup script for glorb.wtf
# Usage: ./backup-mongodb.sh [backup-dir]

set -e

# Configuration
DB_NAME="glorb-wtf"
MONGO_URI="mongodb://localhost:27017"
BACKUP_BASE_DIR="${1:-/root/.openclaw/workspace/glorb-wtf/backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${BACKUP_BASE_DIR}/${TIMESTAMP}"
MAX_BACKUPS=7  # Keep last 7 backups

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🧌 MongoDB Backup Script${NC}"
echo "Database: $DB_NAME"
echo "Timestamp: $TIMESTAMP"
echo ""

# Check if mongodump is installed
if ! command -v mongodump &> /dev/null; then
    echo -e "${RED}Error: mongodump not found. Install mongodb-database-tools:${NC}"
    echo "  apt-get install mongodb-database-tools"
    exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Run mongodump
echo -e "${YELLOW}Creating backup...${NC}"
mongodump --uri="$MONGO_URI" --db="$DB_NAME" --out="$BACKUP_DIR" --quiet

if [ $? -eq 0 ]; then
    # Compress backup
    echo -e "${YELLOW}Compressing backup...${NC}"
    cd "$BACKUP_BASE_DIR"
    tar -czf "${TIMESTAMP}.tar.gz" "$TIMESTAMP"
    rm -rf "$TIMESTAMP"
    
    BACKUP_SIZE=$(du -h "${TIMESTAMP}.tar.gz" | cut -f1)
    echo -e "${GREEN}✓ Backup created: ${TIMESTAMP}.tar.gz (${BACKUP_SIZE})${NC}"
    
    # Clean up old backups
    echo -e "${YELLOW}Cleaning up old backups...${NC}"
    BACKUP_COUNT=$(ls -1 "$BACKUP_BASE_DIR"/*.tar.gz 2>/dev/null | wc -l)
    
    if [ "$BACKUP_COUNT" -gt "$MAX_BACKUPS" ]; then
        REMOVE_COUNT=$((BACKUP_COUNT - MAX_BACKUPS))
        ls -1t "$BACKUP_BASE_DIR"/*.tar.gz | tail -n "$REMOVE_COUNT" | xargs rm -f
        echo -e "${GREEN}✓ Removed $REMOVE_COUNT old backup(s)${NC}"
    else
        echo -e "${GREEN}✓ $BACKUP_COUNT backup(s) total (max: $MAX_BACKUPS)${NC}"
    fi
    
    # Log to activity
    if [ -f "/root/.openclaw/workspace/glorb-wtf/log-activity.sh" ]; then
        /root/.openclaw/workspace/glorb-wtf/log-activity.sh \
            "MongoDB backup created" \
            "Backup ${TIMESTAMP}.tar.gz (${BACKUP_SIZE}) - $BACKUP_COUNT total backups" \
            "technical" 2>/dev/null || true
    fi
    
    echo ""
    echo -e "${GREEN}Backup complete!${NC}"
    echo "Location: $BACKUP_BASE_DIR/${TIMESTAMP}.tar.gz"
else
    echo -e "${RED}✗ Backup failed${NC}"
    exit 1
fi
