// Main script for AI Agent webview
(function () {
	const vscode = acquireVsCodeApi();

	// DOM elements
	const chatMessages = document.getElementById('chatMessages');
	const messageInput = document.getElementById('messageInput');
	const sendBtn = document.getElementById('sendBtn');
	const clearBtn = document.getElementById('clearBtn');
	const typingIndicator = document.getElementById('typingIndicator');

	// Event listeners
	sendBtn.addEventListener('click', sendMessage);
	clearBtn.addEventListener('click', clearHistory);

	messageInput.addEventListener('keydown', (e) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	});

	// Handle messages from extension
	window.addEventListener('message', (event) => {
		const message = event.data;

		switch (message.type) {
			case 'userMessage':
				addMessage('user', message.content);
				break;
			case 'assistantMessage':
				addMessage('assistant', message.content, message.actions);
				break;
			case 'error':
				addMessage('error', message.content);
				break;
			case 'typing':
				showTypingIndicator(message.isTyping);
				break;
			case 'clearHistory':
				clearMessages();
				break;
		}
	});

	function sendMessage() {
		const content = messageInput.value.trim();
		if (!content) return;

		// Clear input
		messageInput.value = '';

		// Send to extension
		vscode.postMessage({
			type: 'sendMessage',
			content: content
		});

		// Disable send button temporarily
		sendBtn.disabled = true;
		setTimeout(() => {
			sendBtn.disabled = false;
		}, 1000);
	}

	function clearHistory() {
		vscode.postMessage({
			type: 'clearHistory'
		});
	}

	function addMessage(role, content, actions = []) {
		const messageDiv = document.createElement('div');
		messageDiv.className = `message ${role}`;

		const contentDiv = document.createElement('div');
		contentDiv.className = 'message-content';
		contentDiv.innerHTML = formatMessageContent(content);
		messageDiv.appendChild(contentDiv);

		// Add action buttons if present
		if (actions && actions.length > 0) {
			const actionsDiv = document.createElement('div');
			actionsDiv.className = 'message-actions';

			actions.forEach(action => {
				const actionBtn = document.createElement('button');
				actionBtn.className = 'action-btn';
				actionBtn.textContent = action.label || action.type;
				actionBtn.addEventListener('click', () => handleAction(action));
				actionsDiv.appendChild(actionBtn);
			});

			messageDiv.appendChild(actionsDiv);
		}

		chatMessages.appendChild(messageDiv);
		scrollToBottom();
	}

	function formatMessageContent(content) {
		// Basic markdown-like formatting
		let formatted = content
			// Code blocks
			.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>')
			// Inline code
			.replace(/`([^`]+)`/g, '<code>$1</code>')
			// Line breaks
			.replace(/\n/g, '<br>');

		return formatted;
	}

	function handleAction(action) {
		switch (action.type) {
			case 'code':
				vscode.postMessage({
					type: 'insertCode',
					code: action.data.code
				});
				break;
			case 'edit':
				vscode.postMessage({
					type: 'applyCodeEdit',
					edit: action.data
				});
				break;
			case 'command':
				vscode.postMessage({
					type: 'executeCommand',
					command: action.data.command,
					args: action.data.args
				});
				break;
		}
	}

	function showTypingIndicator(show) {
		typingIndicator.style.display = show ? 'block' : 'none';
		if (show) {
			scrollToBottom();
		}
	}

	function clearMessages() {
		chatMessages.innerHTML = '';
	}

	function scrollToBottom() {
		setTimeout(() => {
			chatMessages.scrollTop = chatMessages.scrollHeight;
		}, 100);
	}

	// Focus input on load
	messageInput.focus();

	// Welcome message
	setTimeout(() => {
		addMessage('assistant', 'Hello! I\'m your AI coding assistant. I can help you with:\n\n• Code completions and suggestions\n• Explaining code and concepts  \n• Writing new code snippets\n• Debugging and optimization\n• Code reviews and refactoring\n\nHow can I help you today?');
	}, 500);
})();
