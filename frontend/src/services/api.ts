import type {
  AnalysisRequest,
  AnalysisResponse,
  APIResponse,
  ProcessingUpdate,
} from '@/types/api';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:3000';

// API Client Class
class APIClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: `HTTP_${response.status}`,
            message: data.message || 'An error occurred',
            details: data,
          },
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error occurred',
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Start analysis job
  async startAnalysis(request: AnalysisRequest): Promise<APIResponse<AnalysisResponse>> {
    const formData = new FormData();
    formData.append('githubUrl', request.githubUrl);
    
    if (request.pdfFile) {
      formData.append('pdfFile', request.pdfFile);
    }
    
    if (request.options) {
      formData.append('options', JSON.stringify(request.options));
    }

    try {
      const response = await fetch(`${this.baseURL}/analyze`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: `HTTP_${response.status}`,
            message: data.message || 'Failed to start analysis',
            details: data,
          },
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Failed to start analysis',
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Get analysis status
  async getAnalysisStatus(jobId: string): Promise<APIResponse<AnalysisResponse>> {
    return this.request<AnalysisResponse>(`/analyze/${jobId}`);
  }

  // Get Mermaid diagram
  async getMermaidDiagram(jobId: string): Promise<APIResponse<{ mermaidCode: string }>> {
    return this.request<{ mermaidCode: string }>(`/analyze/${jobId}/diagram`);
  }

  // Cancel analysis
  async cancelAnalysis(jobId: string): Promise<APIResponse<{ cancelled: boolean }>> {
    return this.request<{ cancelled: boolean }>(`/analyze/${jobId}/cancel`, {
      method: 'POST',
    });
  }
}

// WebSocket Manager for Real-time Updates
export class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<(update: ProcessingUpdate) => void>> = new Map();

  connect(jobId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(`${WS_BASE_URL}/ws/${jobId}`);

        this.ws.onopen = () => {
          console.log('WebSocket connected for job:', jobId);
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket closed');
          this.attemptReconnect(jobId);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleMessage(message: any) {
    if (message.type === 'update' && message.data) {
      const update = message.data as ProcessingUpdate;
      const listeners = this.listeners.get(message.jobId);
      
      if (listeners) {
        listeners.forEach((callback) => callback(update));
      }
    }
  }

  private attemptReconnect(jobId: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect(jobId).catch((error) => {
          console.error('Reconnection failed:', error);
        });
      }, delay);
    }
  }

  subscribe(jobId: string, callback: (update: ProcessingUpdate) => void) {
    if (!this.listeners.has(jobId)) {
      this.listeners.set(jobId, new Set());
    }
    this.listeners.get(jobId)!.add(callback);
  }

  unsubscribe(jobId: string, callback: (update: ProcessingUpdate) => void) {
    const listeners = this.listeners.get(jobId);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.listeners.delete(jobId);
      }
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Server-Sent Events (SSE) Manager - Alternative to WebSocket
export class SSEManager {
  private eventSource: EventSource | null = null;
  private listeners: Map<string, Set<(update: ProcessingUpdate) => void>> = new Map();

  connect(jobId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.eventSource = new EventSource(`${API_BASE_URL}/analyze/${jobId}/stream`);

        this.eventSource.onopen = () => {
          console.log('SSE connected for job:', jobId);
          resolve();
        };

        this.eventSource.onmessage = (event) => {
          try {
            const update = JSON.parse(event.data) as ProcessingUpdate;
            const listeners = this.listeners.get(jobId);
            
            if (listeners) {
              listeners.forEach((callback) => callback(update));
            }
          } catch (error) {
            console.error('Failed to parse SSE message:', error);
          }
        };

        this.eventSource.onerror = (error) => {
          console.error('SSE error:', error);
          this.disconnect();
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  subscribe(jobId: string, callback: (update: ProcessingUpdate) => void) {
    if (!this.listeners.has(jobId)) {
      this.listeners.set(jobId, new Set());
    }
    this.listeners.get(jobId)!.add(callback);
  }

  unsubscribe(jobId: string, callback: (update: ProcessingUpdate) => void) {
    const listeners = this.listeners.get(jobId);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.listeners.delete(jobId);
      }
    }
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.listeners.clear();
  }

  isConnected(): boolean {
    return this.eventSource !== null && this.eventSource.readyState === EventSource.OPEN;
  }
}

// Export singleton instances
export const apiClient = new APIClient(API_BASE_URL);
export const wsManager = new WebSocketManager();
export const sseManager = new SSEManager();
