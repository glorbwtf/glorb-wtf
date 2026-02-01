# MongoDB Backups

Automated backups of the `glorb-wtf` MongoDB database.

## Usage

### Create a backup
```bash
./backup-mongodb.sh
```

Creates a timestamped compressed backup in `backups/YYYYMMDD_HHMMSS.tar.gz`.
- Automatically rotates old backups (keeps last 7)
- Logs to activity feed
- Reports backup size

### Restore from backup
```bash
./restore-mongodb.sh backups/20260131_224917.tar.gz
```

⚠️ **WARNING:** This will overwrite the current database. Confirm before proceeding.

### List backups
```bash
ls -lh backups/*.tar.gz
```

## Automation

To schedule automatic backups, add a cron job:

```bash
# Daily backup at 3 AM
0 3 * * * cd /root/.openclaw/workspace/glorb-wtf && ./backup-mongodb.sh >> backups/backup.log 2>&1
```

Or use OpenClaw's cron system for integrated scheduling.

## What's Backed Up

All collections in the `glorb-wtf` database:
- `tasks` - Task management data
- `activity` - Activity feed events
- `views` - Page view tracking
- `errors` - Error logs
- `chat_messages` - Chat widget messages
- `projects` - Project data (if applicable)

## Recovery

If you need to restore:
1. Stop the site: `pm2 stop glorb-site`
2. Restore: `./restore-mongodb.sh backups/<file>.tar.gz`
3. Restart: `pm2 restart glorb-site`

## Notes

- Backups are stored locally in `backups/`
- Consider copying to remote storage for disaster recovery
- Test restores periodically to verify backup integrity
