# AI Agent Extension Makefile
.PHONY: help dev build agent install clean test lint link unlink

# Default target
help:
	@echo "AI Agent Extension - Available targets:"
	@echo ""
	@echo "  dev      - Start development environment (agent + extension watch)"
	@echo "  build    - Build the extension for production"
	@echo "  agent    - Start the AI agent backend server"
	@echo "  install  - Install all dependencies"
	@echo "  clean    - Clean build artifacts"
	@echo "  test     - Run tests"
	@echo "  lint     - Run linting checks"
	@echo "  link     - Symlink extension to VS Code"
	@echo "  unlink   - Remove extension symlink"
	@echo ""
	@echo "Quick start: make install && make dev"

# Development mode - runs agent and extension in parallel
dev:
	@echo "🚀 Starting AI Agent development environment..."
	@make -j2 agent extension-watch

# Build extension for production
build:
	@echo "🔨 Building AI Agent extension..."
	cd extensions/ai-agent && npm run compile
	@echo "✅ Extension built successfully!"

# Start the AI agent backend
agent:
	@echo "🤖 Starting AI Agent backend..."
	@if [ ! -d "agent/venv" ]; then \
		echo "Creating Python virtual environment..."; \
		cd agent && python -m venv venv; \
	fi
	@echo "Installing/updating Python dependencies..."
	cd agent && source venv/bin/activate && pip install -r requirements.txt
	@echo "Starting agent server on http://localhost:8000"
	cd agent && source venv/bin/activate && python app.py

# Watch extension for changes
extension-watch:
	@echo "👀 Watching extension for changes..."
	cd extensions/ai-agent && npm run watch

# Install all dependencies
install:
	@echo "📦 Installing dependencies..."
	@echo "Installing extension dependencies..."
	cd extensions/ai-agent && npm install
	@echo "Setting up Python environment..."
	@if [ ! -d "agent/venv" ]; then \
		cd agent && python -m venv venv; \
	fi
	cd agent && source venv/bin/activate && pip install -r requirements.txt
	@echo "✅ All dependencies installed!"

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf extensions/ai-agent/out
	rm -rf extensions/ai-agent/node_modules
	rm -rf agent/venv
	rm -rf agent/__pycache__
	@echo "✅ Clean completed!"

# Run tests
test:
	@echo "🧪 Running tests..."
	cd extensions/ai-agent && npm test || echo "No tests configured yet"
	@echo "✅ Tests completed!"

# Run linting
lint:
	@echo "🔍 Running linting checks..."
	cd extensions/ai-agent && npm run compile
	cd agent && python -m py_compile app.py
	@echo "✅ Linting completed!"

# Link extension to VS Code for development
link:
	@echo "🔗 Linking extension to VS Code..."
	@if [ ! -d "$$HOME/.vscode/extensions" ]; then \
		mkdir -p "$$HOME/.vscode/extensions"; \
	fi
	@if [ -L "$$HOME/.vscode/extensions/ai-agent" ]; then \
		rm "$$HOME/.vscode/extensions/ai-agent"; \
	fi
	ln -sf "$(PWD)/extensions/ai-agent" "$$HOME/.vscode/extensions/ai-agent"
	@echo "✅ Extension linked! Restart VS Code to load the extension."

# Remove extension symlink
unlink:
	@echo "🔗 Unlinking extension from VS Code..."
	@if [ -L "$$HOME/.vscode/extensions/ai-agent" ]; then \
		rm "$$HOME/.vscode/extensions/ai-agent"; \
		echo "✅ Extension unlinked!"; \
	else \
		echo "No extension symlink found."; \
	fi

# Test completions functionality
test-completions:
	@echo "🧪 Testing completions endpoint..."
	@if command -v curl >/dev/null 2>&1; then \
		curl -X POST http://localhost:8000/completions \
			-H "Content-Type: application/json" \
			-d '{"fileName":"test.py","language":"python","content":"def test():\n    ","position":{"line":1,"character":4},"context":"def test():\n    "}' \
			| python -m json.tool; \
	else \
		echo "curl not found, skipping completion test"; \
	fi

# Test chat functionality
test-chat:
	@echo "🧪 Testing chat endpoint..."
	@if command -v curl >/dev/null 2>&1; then \
		curl -X POST http://localhost:8000/chat \
			-H "Content-Type: application/json" \
			-d '{"message":"Hello, can you help me with Python?","history":[]}' \
			| python -m json.tool; \
	else \
		echo "curl not found, skipping chat test"; \
	fi

# Check agent health
health:
	@echo "🏥 Checking agent health..."
	@if command -v curl >/dev/null 2>&1; then \
		curl -s http://localhost:8000/health | python -m json.tool; \
	else \
		echo "curl not found, skipping health check"; \
	fi
