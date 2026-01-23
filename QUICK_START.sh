#!/bin/bash

echo "🚀 Polaris Notes - Quick Setup Script"
echo "======================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    echo "Then run this script again."
    exit 1
fi

echo "✅ Node.js is installed: $(node --version)"
echo ""

# Get the project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# Step 1: Install backend dependencies
echo "📦 Installing backend dependencies..."
cd "$BACKEND_DIR"
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install backend dependencies"
        exit 1
    fi
else
    echo "✅ Backend dependencies already installed"
fi
echo ""

# Step 2: Check for .env file
echo "🔐 Checking for .env file..."
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo "⚠️  .env file not found!"
    echo "Creating .env file template..."
    cat > "$BACKEND_DIR/.env" << EOF
PORT=3001
OPENAI_API_KEY=your-openai-api-key-here
EOF
    echo "✅ Created .env file"
    echo ""
    echo "⚠️  IMPORTANT: Please edit backend/.env and add your OpenAI API key!"
    echo "   Get your API key from: https://platform.openai.com/api-keys"
    echo ""
    read -p "Press Enter after you've added your API key..."
else
    echo "✅ .env file exists"
fi
echo ""

# Step 3: Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install frontend dependencies"
        exit 1
    fi
else
    echo "✅ Frontend dependencies already installed"
fi
echo ""

echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Make sure your OpenAI API key is in backend/.env"
echo "   2. Open TWO Terminal windows"
echo "   3. In Terminal 1, run: cd backend && npm start"
echo "   4. In Terminal 2, run: cd frontend && npm run dev"
echo "   5. Open http://localhost:3000 in your browser"
echo ""
