import * as vscode from 'vscode';
import { AgentClient } from './utils/agentClient';

export class AIWebviewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'aiAgentChat';

	private _view?: vscode.WebviewView;
	private _agentClient: AgentClient;
	private _chatHistory: Array<{ role: 'user' | 'assistant', content: string }> = [];

	constructor(
		private readonly _extensionUri: vscode.Uri,
		agentClient: AgentClient
	) {
		this._agentClient = agentClient;
	}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [
				this._extensionUri
			]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		// Handle messages from the webview
		webviewView.webview.onDidReceiveMessage(async (message) => {
			switch (message.type) {
				case 'sendMessage':
					await this._handleUserMessage(message.content);
					break;
				case 'clearHistory':
					this.clearHistory();
					break;
				case 'insertCode':
					this._insertCodeIntoEditor(message.code);
					break;
				case 'applyCodeEdit':
					this._applyCodeEdit(message.edit);
					break;
			}
		});
	}

	public clearHistory() {
		this._chatHistory = [];
		if (this._view) {
			this._view.webview.postMessage({
				type: 'clearHistory'
			});
		}
	}

	private async _handleUserMessage(content: string) {
		if (!this._view) return;

		// Add user message to history
		this._chatHistory.push({ role: 'user', content });

		// Send user message to webview
		this._view.webview.postMessage({
			type: 'userMessage',
			content
		});

		// Show typing indicator
		this._view.webview.postMessage({
			type: 'typing',
			isTyping: true
		});

		try {
			// Get current file context if available
			const activeEditor = vscode.window.activeTextEditor;
			const fileContext = activeEditor ? {
				fileName: activeEditor.document.fileName,
				language: activeEditor.document.languageId,
				content: activeEditor.document.getText(),
				selection: activeEditor.selection ? {
					start: {
						line: activeEditor.selection.start.line,
						character: activeEditor.selection.start.character
					},
					end: {
						line: activeEditor.selection.end.line,
						character: activeEditor.selection.end.character
					}
				} : null
			} : null;

			// Send chat request to agent
			const response = await this._agentClient.sendChatMessage({
				message: content,
				history: this._chatHistory,
				fileContext
			});

			// Add assistant response to history
			this._chatHistory.push({ role: 'assistant', content: response.content });

			// Send response to webview
			this._view.webview.postMessage({
				type: 'assistantMessage',
				content: response.content,
				actions: response.actions || []
			});

		} catch (error) {
			console.error('Chat error:', error);
			this._view.webview.postMessage({
				type: 'error',
				content: 'Sorry, I encountered an error. Please try again.'
			});
		} finally {
			// Hide typing indicator
			this._view.webview.postMessage({
				type: 'typing',
				isTyping: false
			});
		}
	}

	private _insertCodeIntoEditor(code: string) {
		const activeEditor = vscode.window.activeTextEditor;
		if (activeEditor) {
			activeEditor.edit(editBuilder => {
				editBuilder.insert(activeEditor.selection.active, code);
			});
		}
	}

	private _applyCodeEdit(edit: any) {
		// TODO: Implement code edit application
		vscode.window.showInformationMessage('Code edit feature coming soon!');
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'webview-ui', 'reset.css'));
		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'webview-ui', 'vscode.css'));
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'webview-ui', 'main.css'));
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'webview-ui', 'main.js'));

		const nonce = this._getNonce();

		return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${styleResetUri}" rel="stylesheet">
                <link href="${styleVSCodeUri}" rel="stylesheet">
                <link href="${styleMainUri}" rel="stylesheet">
                <title>AI Assistant</title>
            </head>
            <body>
                <div class="chat-container">
                    <div class="chat-header">
                        <h3>AI Assistant</h3>
                        <button id="clearBtn" class="clear-btn" title="Clear history">🗑️</button>
                    </div>
                    <div id="chatMessages" class="chat-messages"></div>
                    <div id="typingIndicator" class="typing-indicator" style="display: none;">
                        <span>AI is thinking...</span>
                    </div>
                    <div class="chat-input-container">
                        <textarea id="messageInput" class="chat-input" placeholder="Ask me anything about your code..." rows="3"></textarea>
                        <button id="sendBtn" class="send-btn">Send</button>
                    </div>
                </div>
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
	}

	private _getNonce() {
		let text = '';
		const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		for (let i = 0; i < 32; i++) {
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		}
		return text;
	}
}
