import * as vscode from 'vscode';
import axios, { AxiosInstance } from 'axios';

export interface CompletionRequest {
	fileName: string;
	language: string;
	content: string;
	position: {
		line: number;
		character: number;
	};
	context: string;
	triggerKind?: vscode.CompletionTriggerKind;
	triggerCharacter?: string;
}

export interface ChatRequest {
	message: string;
	history: Array<{ role: 'user' | 'assistant', content: string }>;
	fileContext?: {
		fileName: string;
		language: string;
		content: string;
		selection?: {
			start: { line: number; character: number };
			end: { line: number; character: number };
		};
	} | null;
}

export interface ChatResponse {
	content: string;
	actions?: Array<{
		type: 'code' | 'edit' | 'command';
		data: any;
	}>;
}

export class AgentClient {
	private httpClient: AxiosInstance;
	private wsConnection: WebSocket | null = null;

	constructor() {
		this.httpClient = this.createHttpClient();
	}

	private createHttpClient(): AxiosInstance {
		const config = vscode.workspace.getConfiguration('aiAgent');
		const endpoint = config.get<string>('apiEndpoint', 'http://localhost:8000');

		return axios.create({
			baseURL: endpoint,
			timeout: 30000,
			headers: {
				'Content-Type': 'application/json',
			}
		});
	}

	public updateEndpoint() {
		this.httpClient = this.createHttpClient();
		// Reconnect WebSocket if needed
		if (this.wsConnection) {
			this.wsConnection.close();
			this.wsConnection = null;
		}
	}

	public async getCompletions(request: CompletionRequest): Promise<any[]> {
		try {
			const response = await this.httpClient.post('/completions', request);
			return response.data.suggestions || [];
		} catch (error) {
			console.error('Completion request failed:', error);

			// Check if agent is running
			if (axios.isAxiosError(error) && error.code === 'ECONNREFUSED') {
				this.showAgentNotRunningError();
			}

			return [];
		}
	}

	public async sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
		try {
			const response = await this.httpClient.post('/chat', request);
			return response.data;
		} catch (error) {
			console.error('Chat request failed:', error);

			// Check if agent is running
			if (axios.isAxiosError(error) && error.code === 'ECONNREFUSED') {
				this.showAgentNotRunningError();
			}

			throw new Error('Failed to send chat message');
		}
	}

	public async healthCheck(): Promise<boolean> {
		try {
			const response = await this.httpClient.get('/health');
			return response.status === 200;
		} catch (error) {
			return false;
		}
	}

	private showAgentNotRunningError() {
		vscode.window.showErrorMessage(
			'AI Agent backend is not running. Please start it with `make dev` or check your configuration.',
			'Open Settings'
		).then(selection => {
			if (selection === 'Open Settings') {
				vscode.commands.executeCommand('workbench.action.openSettings', 'aiAgent');
			}
		});
	}

	public connectWebSocket(): Promise<WebSocket> {
		return new Promise((resolve, reject) => {
			const config = vscode.workspace.getConfiguration('aiAgent');
			const endpoint = config.get<string>('apiEndpoint', 'http://localhost:8000');
			const wsUrl = endpoint.replace(/^http/, 'ws') + '/ws';

			this.wsConnection = new WebSocket(wsUrl);

			this.wsConnection.onopen = () => {
				console.log('WebSocket connected');
				resolve(this.wsConnection!);
			};

			this.wsConnection.onerror = (error) => {
				console.error('WebSocket error:', error);
				reject(error);
			};

			this.wsConnection.onclose = () => {
				console.log('WebSocket disconnected');
				this.wsConnection = null;
			};
		});
	}

	public sendWebSocketMessage(message: any) {
		if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
			this.wsConnection.send(JSON.stringify(message));
		}
	}

	public dispose() {
		if (this.wsConnection) {
			this.wsConnection.close();
			this.wsConnection = null;
		}
	}
}
