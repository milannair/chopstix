import * as vscode from 'vscode';
import { AICompletionProvider } from './completionProvider';
import { AIWebviewProvider } from './webview';
import { AgentClient } from './utils/agentClient';

let agentClient: AgentClient;
let completionProvider: AICompletionProvider;
let webviewProvider: AIWebviewProvider;

export function activate(context: vscode.ExtensionContext) {
	console.log('AI Agent extension is now active!');

	// Initialize agent client
	agentClient = new AgentClient();

	// Register webview provider for sidebar
	webviewProvider = new AIWebviewProvider(context.extensionUri, agentClient);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(AIWebviewProvider.viewType, webviewProvider)
	);

	// Register completion provider for all languages
	completionProvider = new AICompletionProvider(agentClient);
	context.subscriptions.push(
		vscode.languages.registerCompletionItemProvider(
			{ scheme: 'file' }, // All file schemes
			completionProvider,
			'.', // Trigger on dot
			' ', // Trigger on space
			'(', // Trigger on opening parenthesis
			'=', // Trigger on equals
			'<', // Trigger on less than
			'"', // Trigger on quote
			"'", // Trigger on single quote
			'/'  // Trigger on slash
		)
	);

	// Register commands
	const commands = [
		vscode.commands.registerCommand('aiAgent.openChat', () => {
			vscode.commands.executeCommand('aiAgentChat.focus');
		}),

		vscode.commands.registerCommand('aiAgent.clearHistory', () => {
			webviewProvider.clearHistory();
			vscode.window.showInformationMessage('Chat history cleared');
		}),

		vscode.commands.registerCommand('aiAgent.toggleCompletions', () => {
			const config = vscode.workspace.getConfiguration('aiAgent');
			const enabled = config.get<boolean>('enableCompletions', true);
			config.update('enableCompletions', !enabled, vscode.ConfigurationTarget.Global);
			vscode.window.showInformationMessage(
				`AI Completions ${!enabled ? 'enabled' : 'disabled'}`
			);
		})
	];

	context.subscriptions.push(...commands);

	// Register configuration change listener
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration('aiAgent.apiEndpoint')) {
				agentClient.updateEndpoint();
			}
		})
	);

	// Show welcome message
	vscode.window.showInformationMessage(
		'AI Agent is ready! Use the sidebar to chat or type for completions.',
		'Open Chat'
	).then(selection => {
		if (selection === 'Open Chat') {
			vscode.commands.executeCommand('aiAgent.openChat');
		}
	});
}

export function deactivate() {
	if (agentClient) {
		agentClient.dispose();
	}
}
