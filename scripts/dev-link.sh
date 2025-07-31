#!/bin/bash
# Script to symlink the AI Agent extension into VS Code's local environment

set -e

echo "🔗 AI Agent Extension Development Linker"
echo "======================================="

# Check if we're in the right directory
if [ ! -d "extensions/ai-agent" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Determine VS Code extensions directory
VSCODE_EXTENSIONS_DIR=""

# Check for different VS Code installations
if [ -d "$HOME/.vscode/extensions" ]; then
    VSCODE_EXTENSIONS_DIR="$HOME/.vscode/extensions"
elif [ -d "$HOME/.vscode-insiders/extensions" ]; then
    VSCODE_EXTENSIONS_DIR="$HOME/.vscode-insiders/extensions"
elif [ -d "$HOME/Library/Application Support/Code/User/extensions" ]; then
    VSCODE_EXTENSIONS_DIR="$HOME/Library/Application Support/Code/User/extensions"
elif [ -d "$HOME/Library/Application Support/Code - Insiders/User/extensions" ]; then
    VSCODE_EXTENSIONS_DIR="$HOME/Library/Application Support/Code - Insiders/User/extensions"
else
    echo "❌ Error: Could not find VS Code extensions directory"
    echo "Please create one of these directories:"
    echo "  • $HOME/.vscode/extensions"
    echo "  • $HOME/.vscode-insiders/extensions"
    exit 1
fi

echo "📁 Using extensions directory: $VSCODE_EXTENSIONS_DIR"

# Build the extension first
echo "🔨 Building extension..."
cd extensions/ai-agent
npm install
npm run compile
cd ../..

# Create symlink
LINK_PATH="$VSCODE_EXTENSIONS_DIR/ai-agent"
EXTENSION_PATH="$(pwd)/extensions/ai-agent"

# Remove existing link if it exists
if [ -L "$LINK_PATH" ]; then
    echo "🔗 Removing existing symlink..."
    rm "$LINK_PATH"
elif [ -d "$LINK_PATH" ]; then
    echo "⚠️  Warning: Directory $LINK_PATH already exists"
    echo "Please remove it manually or use a different extension name"
    exit 1
fi

# Create symlink
echo "🔗 Creating symlink..."
ln -sf "$EXTENSION_PATH" "$LINK_PATH"

echo ""
echo "✅ Extension linked successfully!"
echo ""
echo "📋 Next steps:"
echo "  1. Restart VS Code"
echo "  2. Run 'make dev' to start the development environment"
echo "  3. Open VS Code and look for the AI Assistant in the sidebar"
echo ""
echo "🔧 To unlink the extension, run:"
echo "   make unlink"
echo ""

# Check if VS Code is running
if pgrep -f "Visual Studio Code" > /dev/null 2>&1; then
    echo "⚠️  VS Code is currently running. Please restart it to load the extension."
fi
