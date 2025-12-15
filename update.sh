#!/bin/bash

# Simple script to update the application on Synology NAS
# Usage: ./update.sh

echo "Starting update process..."

# 1. Pull latest code from Git
echo "Pulling changes from GitHub..."
git pull

# Check if git pull was successful
if [ $? -ne 0 ]; then
    echo "Error: Git pull failed. Please check your network or git credentials."
    exit 1
fi

# 2. Rebuild and Restart Containers
echo "Rebuilding containers..."
# Determine if using docker-compose or docker compose (newer v2)
if command -v docker-compose &> /dev/null; then
    docker-compose up -d --build
else
    # Fallback/Newer syntax
    docker compose up -d --build
fi

echo "Update Complete! Application should be restarting."
