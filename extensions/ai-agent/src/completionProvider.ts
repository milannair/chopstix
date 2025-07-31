import * as vscode from 'vscode';
import { AgentClient } from './utils/agentClient';

export class AICompletionProvider implements vscode.CompletionItemProvider {
	private agentClient: AgentClient;
	private debounceTimer: NodeJS.Timeout | undefined;

	constructor(agentClient: AgentClient) {
		this.agentClient = agentClient;
	}

	async provideCompletionItems(
		document: vscode.TextDocument,
		position: vscode.Position,
		token: vscode.CancellationToken,
		context: vscode.CompletionContext
	): Promise<vscode.CompletionItem[]> {
		// Check if completions are enabled
		const config = vscode.workspace.getConfiguration('aiAgent');
		if (!config.get<boolean>('enableCompletions', true)) {
			return [];
		}

		// Clear any existing debounce timer
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}

		// Return a promise that resolves after debounce delay
		return new Promise((resolve, reject) => {
			const delay = config.get<number>('completionDelay', 500);

			this.debounceTimer = setTimeout(async () => {
				try {
					if (token.isCancellationRequested) {
						resolve([]);
						return;
					}

					const completions = await this.getAICompletions(document, position, context);
					resolve(completions);
				} catch (error) {
					console.error('AI completion error:', error);
					resolve([]); // Return empty array on error
				}
			}, delay);

			// Handle cancellation
			token.onCancellationRequested(() => {
				if (this.debounceTimer) {
					clearTimeout(this.debounceTimer);
				}
				resolve([]);
			});
		});
	}

	private async getAICompletions(
		document: vscode.TextDocument,
		position: vscode.Position,
		context: vscode.CompletionContext
	): Promise<vscode.CompletionItem[]> {
		try {
			// Get file context
			const fileContext = this.getFileContext(document, position);

			// Prepare completion request
			const completionRequest = {
				fileName: document.fileName,
				language: document.languageId,
				content: document.getText(),
				position: {
					line: position.line,
					character: position.character
				},
				context: fileContext,
				triggerKind: context.triggerKind,
				triggerCharacter: context.triggerCharacter
			};

			// Request completions from agent
			const suggestions = await this.agentClient.getCompletions(completionRequest);

			// Convert to VS Code completion items
			return this.convertToCompletionItems(suggestions);
		} catch (error) {
			console.error('Failed to get AI completions:', error);
			return [];
		}
	}

	private getFileContext(document: vscode.TextDocument, position: vscode.Position): string {
		// Get surrounding context (few lines before and after)
		const startLine = Math.max(0, position.line - 10);
		const endLine = Math.min(document.lineCount - 1, position.line + 5);

		let context = '';
		for (let i = startLine; i <= endLine; i++) {
			const line = document.lineAt(i);
			context += line.text + '\\n';
		}

		return context;
	}

	private convertToCompletionItems(suggestions: any[]): vscode.CompletionItem[] {
		const config = vscode.workspace.getConfiguration('aiAgent');
		const maxCompletions = config.get<number>('maxCompletions', 5);

		return suggestions.slice(0, maxCompletions).map((suggestion, index) => {
			const item = new vscode.CompletionItem(
				suggestion.text || suggestion.label,
				this.getCompletionKind(suggestion.kind)
			);

			item.detail = suggestion.detail || 'AI Suggestion';
			item.documentation = new vscode.MarkdownString(
				suggestion.documentation || 'AI-generated code completion'
			);

			if (suggestion.insertText) {
				item.insertText = new vscode.SnippetString(suggestion.insertText);
			}

			// Set sort order to prioritize AI suggestions
			item.sortText = `00${index}`;

			// Add AI icon
			item.label = {
				label: suggestion.text || suggestion.label,
				description: '🤖 AI'
			};

			return item;
		});
	}

	private getCompletionKind(kind?: string): vscode.CompletionItemKind {
		switch (kind) {
			case 'function': return vscode.CompletionItemKind.Function;
			case 'method': return vscode.CompletionItemKind.Method;
			case 'variable': return vscode.CompletionItemKind.Variable;
			case 'class': return vscode.CompletionItemKind.Class;
			case 'interface': return vscode.CompletionItemKind.Interface;
			case 'module': return vscode.CompletionItemKind.Module;
			case 'property': return vscode.CompletionItemKind.Property;
			case 'keyword': return vscode.CompletionItemKind.Keyword;
			case 'snippet': return vscode.CompletionItemKind.Snippet;
			default: return vscode.CompletionItemKind.Text;
		}
	}
}
