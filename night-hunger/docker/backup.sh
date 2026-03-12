#!/bin/bash

# Backup script for PostgreSQL database
# Usage: ./backup.sh [retention_days]

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/night_hunger}"
DB_NAME="${DB_NAME:-night_hunger}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
RETENTION_DAYS="${1:-7}"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Generate backup filename with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"

echo "🔄 Starting backup of database '$DB_NAME'..."
echo "📁 Backup file: $BACKUP_FILE"

# Create backup
PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_FILE"

# Verify backup
if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✅ Backup completed successfully! Size: $BACKUP_SIZE"
else
    echo "❌ Backup failed!"
    exit 1
fi

# Cleanup old backups
echo "🧹 Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

# List remaining backups
echo "📋 Current backups:"
ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "No backups found"

# Upload to S3 (optional)
if [ -n "$S3_BUCKET" ]; then
    echo "☁️  Uploading to S3 bucket: $S3_BUCKET"
    aws s3 cp "$BACKUP_FILE" "s3://$S3_BUCKET/backups/"
    
    # Cleanup old S3 backups
    aws s3 ls "s3://$S3_BUCKET/backups/" | while read -r line; do
        file_date=$(echo "$line" | awk '{print $1, $2}')
        file_name=$(echo "$line" | awk '{print $4}')
        if [ -n "$file_date" ]; then
            file_timestamp=$(date -d "$file_date" +%s 2>/dev/null || echo 0)
            now_timestamp=$(date +%s)
            age_days=$(( (now_timestamp - file_timestamp) / 86400 ))
            if [ $age_days -gt $RETENTION_DAYS ]; then
                aws s3 rm "s3://$S3_BUCKET/backups/$file_name"
            fi
        fi
    done
fi

echo "✨ Backup process completed!"
