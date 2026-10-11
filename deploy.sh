#!/bin/bash
set -e

# Load user environment & Node paths
export PATH=$PATH:/usr/bin:/usr/local/bin

echo "=========================================="
echo "🚀 BPKCH Gunaso CI/CD Auto-Deployment"
echo "=========================================="

cd /home/tivrasoft/gunaso

echo "📥 1. Pulling latest code from GitHub..."
git fetch origin main
git reset --hard origin/main

echo "📦 2. Installing dependencies..."
npm install --legacy-peer-deps

echo "🗄️ 3. Updating Prisma Client & Database Schema..."
export DATABASE_URL="file:./dev.db"
./node_modules/.bin/prisma generate
./node_modules/.bin/prisma db push

echo "🏗️ 4. Building Next.js Application..."
npm run build

echo "🔄 5. Reloading PM2 Service..."
pm2 restart bkmch-gunaso || pm2 start npm --name "bkmch-gunaso" -- start -- -p 3060
pm2 save

echo "=========================================="
echo "✅ Deployment completed successfully!"
echo "🌐 URL: https://gunaso.4-193-121-134.sslip.io"
echo "=========================================="
