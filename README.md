# AI Agent Extension for VS Code

A lightweight AI coding assistant extension built on top of the VS Code fork, providing intelligent code completions and an interactive chat interface.

## Features

### **AI-Powered Code Completions**
- Intelligent code suggestions as you type
- Context-aware completions based on file content and cursor position
- Support for multiple programming languages (Python, JavaScript, TypeScript, JSON, etc.)
- Non-intrusive integration that works alongside existing IntelliSense

### **Interactive AI Chat Sidebar**
- Collapsible sidebar with AI assistant interface
- Ask questions about your code, get explanations, and request help
- File context awareness - the AI knows what you're working on
- Code insertion and editing capabilities directly from chat responses

### **Lightweight & Modular**
- Fully isolated VS Code extension with no core editor modifications
- External AI agent backend for heavy lifting
- Easy to maintain and rebase-compatible with upstream VS Code
- Configurable API endpoints and completion settings

### **Future-Ready Architecture**
- **Designed for integration with Loro cloud platform** - upcoming features will allow AI agents to provision, modify, and query cloud infrastructure directly from your editor
- WebSocket support for real-time communication
- Extensible plugin architecture for custom prompts and actions

## Architecture

```
extensions/ai-agent/          # VS Code extension
├── src/
│   ├── extension.ts         # Main extension entry point
│   ├── completionProvider.ts # AI completion provider
│   ├── webview.ts           # Chat interface
│   └── utils/agentClient.ts # Backend communication
├── webview-ui/              # Chat interface frontend
└── package.json             # Extension manifest

agent/                       # AI backend server
├── app.py                   # FastAPI server
└── requirements.txt         # Python dependencies

scripts/                     # Development tools
├── dev.sh                   # Development environment setup
└── dev-link.sh             # Extension linking utility
```

## Quick Start

### Prerequisites
- Node.js (v16 or later)
- Python (v3.8 or later)
- VS Code (v1.74 or later)

### Installation & Setup

1. **Install dependencies:**
   ```bash
   make install
   ```

2. **Start development environment:**
   ```bash
   make dev
   ```

3. **Link extension to VS Code:**
   ```bash
   make link
   ```

4. **Restart VS Code** to load the extension

### Alternative Quick Setup
```bash
# One-liner setup
make install && make dev

# In another terminal, link the extension
make link
```

## Usage

### Code Completions

1. **Enable completions** (enabled by default):
   - Open VS Code settings (`Cmd/Ctrl + ,`)
   - Search for "AI Agent"
   - Ensure "Enable Completions" is checked

2. **Trigger completions** by typing:
   - `.` (dot notation)
   - `(` (function calls)
   - `=` (assignments)
   - Or just start typing - completions appear automatically

3. **Customize completion behavior**:
   - `aiAgent.completionDelay`: Delay before showing suggestions (default: 500ms)
   - `aiAgent.maxCompletions`: Max number of suggestions (default: 5)

### AI Chat Interface

1. **Open the AI Assistant sidebar**:
   - Click the robot icon in the activity bar
   - Or use the command palette: `AI Agent: Open Chat`

2. **Start chatting**:
   - Type questions about your code
   - Ask for explanations or help with debugging
   - Request code examples or snippets

3. **Use file context**:
   - Open a file and select code
   - The AI will be aware of your current file and selection
   - Ask questions like "What does this function do?" or "How can I improve this code?"

### Commands

- `AI Agent: Open Chat` - Open the chat interface
- `AI Agent: Clear Chat History` - Clear conversation history
- `AI Agent: Toggle AI Completions` - Enable/disable completions

## Testing Completions

### Manual Testing
1. Start the development environment with `make dev`
2. Open a Python file in VS Code
3. Type `print.` and wait for AI suggestions to appear
4. Try typing `def my_function():` and press Enter to see context-aware completions

### API Testing
```bash
# Test completions endpoint
make test-completions

# Test chat endpoint
make test-chat

# Check backend health
make health
```

## Development

### Available Make Targets

```bash
make help          # Show all available commands
make dev           # Start development environment (agent + extension watch)
make build         # Build extension for production
make agent         # Start AI agent backend only
make install       # Install all dependencies
make clean         # Clean build artifacts
make test          # Run tests
make lint          # Run linting checks
make link          # Symlink extension to VS Code
make unlink        # Remove extension symlink
```

### Development Workflow

1. **Start development servers:**
   ```bash
   make dev
   ```
   This starts:
   - AI agent backend on `http://localhost:8000`
   - TypeScript compiler in watch mode

2. **Link extension for testing:**
   ```bash
   make link
   ```

3. **Make changes and test:**
   - Extension changes: TypeScript recompiles automatically
   - Backend changes: Restart with `Ctrl+C` and `make agent`
   - VS Code: Reload window (`Cmd/Ctrl + R`)

4. **Debug:**
   - Extension: Use VS Code's built-in debugger (F5)
   - Backend: Check logs in terminal or visit `http://localhost:8000/health`

### Configuration

Extension settings in VS Code:
```json
{
  "aiAgent.apiEndpoint": "http://localhost:8000",
  "aiAgent.enableCompletions": true,
  "aiAgent.completionDelay": 500,
  "aiAgent.maxCompletions": 5
}
```

Backend configuration via environment variables:
```bash
PORT=8000                    # Server port
LOG_LEVEL=info              # Logging level
```

## Extending Prompts and Actions

### Custom Chat Actions

To add new actions that appear in chat responses, modify the backend `process_chat_message` method in `agent/app.py`:

```python
actions.append({
    "type": "custom_action",
    "label": "Run Tests",
    "data": {"command": "npm test"}
})
```

Then handle the action in the frontend `webview-ui/main.js` and extension `src/webview.ts`.

### Custom Completion Providers

Add language-specific completions by modifying the `AgentBackend` class in `agent/app.py`:

```python
def _get_custom_language_completions(self, request: CompletionRequest):
    # Add your custom completion logic
    return [CompletionSuggestion(...)]
```

## Future Integration: Loro Cloud Platform

This AI agent is architected for seamless integration with the **Loro cloud platform**, enabling:

### **Infrastructure as Code from Your Editor**
- Provision AWS, Azure, or GCP resources directly from VS Code
- AI-guided infrastructure setup and configuration
- Real-time cloud resource monitoring and management

### **Deployment Pipeline Integration**
- Deploy applications with AI-optimized configurations
- Automated scaling recommendations based on code analysis
- Integration with CI/CD pipelines

### **Intelligent Cloud Insights**
- Cost optimization suggestions
- Performance monitoring and alerts
- Security scanning and compliance checks

### **Developer Experience Enhancement**
- Natural language cloud operations ("deploy this to staging")
- Context-aware infrastructure suggestions
- Automated documentation generation for cloud resources

## Troubleshooting

### Extension Not Loading
1. Check that the extension is properly linked: `ls -la ~/.vscode/extensions/ai-agent`
2. Restart VS Code completely
3. Check the developer console: `Help > Toggle Developer Tools`

### AI Agent Backend Issues
1. Verify the backend is running: `curl http://localhost:8000/health`
2. Check Python dependencies: `cd agent && source venv/bin/activate && pip list`
3. Review backend logs in the terminal

### Completions Not Working
1. Check extension settings: `aiAgent.enableCompletions`
2. Verify API endpoint: `aiAgent.apiEndpoint`
3. Test the completions endpoint: `make test-completions`

### Chat Interface Not Responding
1. Check WebSocket connection in browser dev tools
2. Verify backend is accepting connections
3. Clear chat history and try again

## Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Development Guidelines

- Keep the extension **modular** and **non-intrusive**
- Ensure **rebase compatibility** with upstream VS Code
- Add **tests** for new features
- Follow **TypeScript** and **Python** best practices
- Update **documentation** for new features

## License

This project is part of the VS Code fork and follows the same licensing terms.

## Acknowledgments

- Built on the foundation of **Visual Studio Code**
- Inspired by modern AI coding assistants
- Designed for the future of cloud-native development

---

To get started with the AI Agent extension, run `make install && make dev` and begin coding with AI assistance.
