#!/bin/bash
echo "================================"
echo "  VoiceDraw - AI Voice Drawing"
echo "================================"
echo ""
cd "$(dirname "$0")/server"
echo "Installing dependencies..."
npm install --silent
echo ""
echo "Starting server at http://localhost:3000"
echo ""
npm start
