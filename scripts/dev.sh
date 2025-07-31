#!/bin/bash
# Development startup script for AI Agent extension

set -e

echo "🚀 AI Agent Development Environment"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "Makefile" ] || [ ! -d "extensions/ai-agent" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check dependencies
echo "📋 Checking dependencies..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed"
    exit 1
fi

# Check Python
if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
    echo "❌ Python is required but not installed"
    exit 1
fi

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is required but not installed"
    exit 1
fi

echo "✅ Dependencies check passed"

# Install dependencies if needed
if [ ! -d "extensions/ai-agent/node_modules" ]; then
    echo "📦 Installing extension dependencies..."
    cd extensions/ai-agent && npm install && cd ../..
fi

if [ ! -d "agent/venv" ]; then
    echo "🐍 Setting up Python virtual environment..."
    cd agent && python -m venv venv && cd ..
fi

# Activate Python venv and install dependencies
echo "📦 Installing Python dependencies..."
cd agent && source venv/bin/activate && pip install -r requirements.txt && cd ..

echo ""
echo "🎯 Starting development servers..."
echo ""
echo "This will start:"
echo "  • AI Agent backend on http://localhost:8000"
echo "  • Extension TypeScript compiler in watch mode"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Start development environment
make dev
