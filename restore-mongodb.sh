#!/bin/bash
# MongoDB restore script for glorb.wtf
# Usage: ./restore-mongodb.sh <backup-file.tar.gz>

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

if [ -z "$1" ]; then
    echo -e "${RED}Error: No backup file specified${NC}"
    echo "Usage: $0 <backup-file.tar.gz>"
    echo ""
    echo "Available backups:"
    ls -lh /root/.openclaw/workspace/glorb-wtf/backups/*.tar.gz 2>/dev/null || echo "  (none found)"
    exit 1
fi

BACKUP_FILE="$1"
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

DB_NAME="glorb-wtf"
MONGO_URI="mongodb://localhost:27017"
TEMP_DIR=$(mktemp -d)

echo -e "${GREEN}🧌 MongoDB Restore Script${NC}"
echo "Backup: $BACKUP_FILE"
echo "Database: $DB_NAME"
echo ""

# Check if mongorestore is installed
if ! command -v mongorestore &> /dev/null; then
    echo -e "${RED}Error: mongorestore not found. Install mongodb-database-tools${NC}"
    exit 1
fi

# Confirm restore
echo -e "${YELLOW}⚠️  WARNING: This will overwrite the current database!${NC}"
read -p "Continue? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Restore cancelled."
    exit 0
fi

# Extract backup
echo -e "${YELLOW}Extracting backup...${NC}"
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Find the dump directory
DUMP_DIR=$(find "$TEMP_DIR" -type d -name "$DB_NAME" | head -n1)

if [ -z "$DUMP_DIR" ]; then
    echo -e "${RED}Error: Database dump not found in backup${NC}"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Restore database
echo -e "${YELLOW}Restoring database...${NC}"
mongorestore --uri="$MONGO_URI" --db="$DB_NAME" --drop "$DUMP_DIR" --quiet

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database restored successfully${NC}"
    
    # Log to activity
    if [ -f "/root/.openclaw/workspace/glorb-wtf/log-activity.sh" ]; then
        /root/.openclaw/workspace/glorb-wtf/log-activity.sh \
            "MongoDB restored from backup" \
            "Restored from: $(basename $BACKUP_FILE)" \
            "technical" 2>/dev/null || true
    fi
else
    echo -e "${RED}✗ Restore failed${NC}"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Cleanup
rm -rf "$TEMP_DIR"

echo ""
echo -e "${GREEN}Restore complete!${NC}"
echo -e "${YELLOW}Note: Restart the site if it's running:${NC}"
echo "  pm2 restart glorb-site"
