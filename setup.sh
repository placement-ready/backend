#!/bin/bash
# Navigate to the backend directory
cd "$(dirname "$0")"

echo "🚀 Setting up the backend development environment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies. Please check your npm configuration."
    exit 1
fi

# Set environment variables
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
    else
         echo "⚠️ .env.example not found, skipping .env creation."
    fi
else
    echo "✅ .env file already exists, skipping copy."
fi

echo "✅ Backend environment set up successfully."
echo "🎉 You can now start the backend server using 'npm start'."
exit 0

