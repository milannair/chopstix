#!/usr/bin/env python3
"""
AI Agent Backend Server

A lightweight backend that provides AI-powered code completions and chat functionality
for the VS Code AI Agent extension.

Future integration: This agent layer is designed for future integration with the Loro
cloud platform, which will allow AI agents to provision, modify, or query cloud
infrastructure directly from within the editor.
"""

import asyncio
import json
import logging
import os
import time
from typing import List, Dict, Any, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Models
class Position(BaseModel):
    line: int
    character: int

class Selection(BaseModel):
    start: Position
    end: Position

class FileContext(BaseModel):
    fileName: str
    language: str
    content: str
    selection: Optional[Selection] = None

class CompletionRequest(BaseModel):
    fileName: str
    language: str
    content: str
    position: Position
    context: str
    triggerKind: Optional[int] = None
    triggerCharacter: Optional[str] = None

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage]
    fileContext: Optional[FileContext] = None

class CompletionSuggestion(BaseModel):
    text: str
    label: str
    detail: str
    documentation: str
    kind: str = "text"
    insertText: Optional[str] = None

class ChatResponse(BaseModel):
    content: str
    actions: List[Dict[str, Any]] = []

class AgentBackend:
    """Mock AI agent backend for demonstration purposes."""

    def __init__(self):
        self.model_loaded = False

    async def initialize(self):
        """Initialize the AI model (mock implementation)."""
        logger.info("Initializing AI agent backend...")
        # Simulate model loading
        await asyncio.sleep(1)
        self.model_loaded = True
        logger.info("AI agent backend initialized successfully")

    async def generate_completions(self, request: CompletionRequest) -> List[CompletionSuggestion]:
        """Generate code completions based on context."""
        if not self.model_loaded:
            return []

        # Mock completion logic based on language and context
        suggestions = []

        if request.language == "python":
            suggestions.extend(self._get_python_completions(request))
        elif request.language == "javascript" or request.language == "typescript":
            suggestions.extend(self._get_js_completions(request))
        elif request.language == "json":
            suggestions.extend(self._get_json_completions(request))

        # Add some generic completions
        suggestions.extend(self._get_generic_completions(request))

        return suggestions[:5]  # Limit to 5 suggestions

    def _get_python_completions(self, request: CompletionRequest) -> List[CompletionSuggestion]:
        """Generate Python-specific completions."""
        completions = []

        if request.triggerCharacter == ".":
            completions = [
                CompletionSuggestion(
                    text="append()",
                    label="append",
                    detail="list.append(item)",
                    documentation="Add an item to the end of the list",
                    kind="method",
                    insertText="append($1)"
                ),
                CompletionSuggestion(
                    text="split()",
                    label="split",
                    detail="str.split(sep)",
                    documentation="Split string into a list",
                    kind="method",
                    insertText="split($1)"
                )
            ]
        elif "def " in request.context:
            completions = [
                CompletionSuggestion(
                    text="return",
                    label="return",
                    detail="return statement",
                    documentation="Return a value from function",
                    kind="keyword"
                )
            ]

        return completions

    def _get_js_completions(self, request: CompletionRequest) -> List[CompletionSuggestion]:
        """Generate JavaScript/TypeScript completions."""
        completions = []

        if request.triggerCharacter == ".":
            completions = [
                CompletionSuggestion(
                    text="map()",
                    label="map",
                    detail="array.map(callback)",
                    documentation="Create new array with results of calling function on every element",
                    kind="method",
                    insertText="map($1)"
                ),
                CompletionSuggestion(
                    text="filter()",
                    label="filter",
                    detail="array.filter(callback)",
                    documentation="Create new array with elements that pass test",
                    kind="method",
                    insertText="filter($1)"
                )
            ]

        return completions

    def _get_json_completions(self, request: CompletionRequest) -> List[CompletionSuggestion]:
        """Generate JSON completions."""
        return [
            CompletionSuggestion(
                text='"name": ""',
                label="name",
                detail="Name property",
                documentation="Common name property for JSON objects",
                kind="property",
                insertText='"name": "$1"'
            )
        ]

    def _get_generic_completions(self, request: CompletionRequest) -> List[CompletionSuggestion]:
        """Generate generic completions."""
        return [
            CompletionSuggestion(
                text="// TODO: ",
                label="todo",
                detail="TODO comment",
                documentation="Add a TODO comment",
                kind="snippet",
                insertText="// TODO: $1"
            )
        ]

    async def process_chat_message(self, request: ChatRequest) -> ChatResponse:
        """Process chat message and generate response."""
        if not self.model_loaded:
            raise HTTPException(status_code=503, detail="AI model not loaded")

        message = request.message.lower()

        # Simple rule-based responses for demo
        if "hello" in message or "hi" in message:
            content = "Hello! I'm your AI coding assistant. How can I help you with your code today?"
        elif "explain" in message and request.fileContext:
            content = f"I can see you're working with a {request.fileContext.language} file. This appears to be code that handles {self._analyze_code_purpose(request.fileContext.content)}."
        elif "complete" in message or "suggestion" in message:
            content = "I provide intelligent code completions as you type. Just start typing and I'll suggest relevant completions based on your context."
        elif "help" in message:
            content = """I can help you with:

• **Code Completions**: Intelligent suggestions as you type
• **Code Explanation**: Understanding what your code does
• **Bug Fixes**: Identifying and fixing issues
• **Refactoring**: Improving code structure
• **Best Practices**: Following coding standards

Future capabilities will include integration with the Loro cloud platform for infrastructure management directly from your editor!"""
        else:
            content = "I understand you're asking about your code. Could you be more specific about what you'd like help with? I can explain code, suggest improvements, or help with debugging."

        # Add some action buttons for relevant responses
        actions = []
        if request.fileContext:
            actions.append({
                "type": "code",
                "label": "Insert Example",
                "data": {
                    "code": f"// Example {request.fileContext.language} code\\nconsole.log('Hello from AI!');"
                }
            })

        return ChatResponse(content=content, actions=actions)

    def _analyze_code_purpose(self, content: str) -> str:
        """Simple analysis of code purpose."""
        content_lower = content.lower()

        if "function" in content_lower or "def " in content_lower:
            return "function definitions and logic"
        elif "class" in content_lower:
            return "class definitions and object-oriented programming"
        elif "import" in content_lower or "require" in content_lower:
            return "module imports and dependencies"
        else:
            return "general programming logic"

# Global agent instance
agent = AgentBackend()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await agent.initialize()
    yield
    # Shutdown
    logger.info("Shutting down AI agent backend")

# FastAPI app
app = FastAPI(
    title="AI Agent Backend",
    description="Lightweight AI backend for VS Code coding assistant",
    version="0.1.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "model_loaded": agent.model_loaded,
        "timestamp": time.time()
    }

@app.post("/completions")
async def get_completions(request: CompletionRequest):
    """Get code completion suggestions."""
    try:
        suggestions = await agent.generate_completions(request)
        return {"suggestions": suggestions}
    except Exception as e:
        logger.error(f"Completion error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat(request: ChatRequest) -> ChatResponse:
    """Process chat message."""
    try:
        response = await agent.process_chat_message(request)
        return response
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# WebSocket for real-time communication
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time communication."""
    await websocket.accept()
    logger.info("WebSocket connection established")

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            # Handle different message types
            if message.get("type") == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
            elif message.get("type") == "chat":
                # Process chat message via WebSocket
                chat_request = ChatRequest(**message.get("data", {}))
                response = await agent.process_chat_message(chat_request)
                await websocket.send_text(json.dumps({
                    "type": "chat_response",
                    "data": response.dict()
                }))

    except WebSocketDisconnect:
        logger.info("WebSocket connection closed")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )
