#!/bin/bash
# Navigate to the backend directory
cd "$(dirname "$0")"/../backend

echo "Setting up the backend development environment..."

# Install dependencies
npm install

# Set environment variables
cp .env.example .env

if [ $? -ne 0 ]; then
    echo "Failed to set up the backend environment. Please check your npm configuration."
    exit 1
fi

echo "Backend environment set up successfully."
echo "You can now start the backend server using 'npm start'."
exit 0

