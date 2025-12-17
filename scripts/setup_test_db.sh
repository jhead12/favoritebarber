#!/bin/bash
# Setup test database for MCP tests
# Run this before executing MCP unit/integration tests

set -e

# Default to test database if not specified
TEST_DB_URL=${TEST_DATABASE_URL:-"postgresql://postgres:password@localhost:5432/rateyourbarber_test"}

echo "Setting up test database: $TEST_DB_URL"

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "Error: psql command not found. Please install PostgreSQL client."
    exit 1
fi

# Extract database name from connection string
DB_NAME=$(echo $TEST_DB_URL | sed 's/.*\///' | sed 's/?.*//')
echo "Database name: $DB_NAME"

# Drop and recreate test database
echo "Dropping and recreating test database..."
psql "${TEST_DB_URL%/*}/postgres" -c "DROP DATABASE IF EXISTS $DB_NAME;" || true
psql "${TEST_DB_URL%/*}/postgres" -c "CREATE DATABASE $DB_NAME;"

# Apply all migrations
echo "Applying migrations..."
DATABASE_URL=$TEST_DB_URL node api/migrate.js

echo "✓ Test database setup complete!"
echo ""
echo "To run MCP tests:"
echo "  DATABASE_URL=$TEST_DB_URL npm run test:mcp"
