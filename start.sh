#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "==> Building frontend..."
cd frontend
npm run build
cd ..

echo "==> Copying dist to backend/public..."
rm -rf backend/public
cp -r frontend/dist backend/public

echo "==> Starting backend (Ctrl+C to stop)..."
cd backend
npm run dev
