#!/bin/bash

# Define ports
BACKEND_PORT=3000
FRONTEND_PORT=5173

echo "🛑 Stopping existing services..."

# Kill PHP artisan serve processes
pkill -f "artisan serve" && echo "✅ Stopped artisan serve" || echo "ℹ️ No artisan serve process found"

# Kill Vite/Node processes running on frontend port (default 5173) or with 'vite'
lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null && echo "✅ Stopped Vite on port $FRONTEND_PORT" || echo "ℹ️ No process on port $FRONTEND_PORT"
pkill -f "vite" && echo "✅ Stopped Vite processes" || echo "ℹ️ No Vite processes found"

# Kill any process on back-end port just in case
lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null && echo "✅ Cleared port $BACKEND_PORT"

sleep 2

echo "🚀 Restarting services..."

# Start Backend (PHP Artisan)
php artisan serve --host=127.0.0.1 --port=$BACKEND_PORT > storage/logs/backend.log 2>&1 &
echo "📡 Backend starting on http://127.0.0.1:$BACKEND_PORT (logging to storage/logs/backend.log)"

# Start Frontend (Vite)
# We use npx to ensure we use the local vite version. 
# We'll try to use the user's preferred node version if possible, but for a script we assume current env.
npm run dev > storage/logs/frontend.log 2>&1 &
echo "💻 Frontend starting (logging to storage/logs/frontend.log)"

echo "✨ Services are restarting in the background."
echo "Check logs with: tail -f storage/logs/backend.log storage/logs/frontend.log"
