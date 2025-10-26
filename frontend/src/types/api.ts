// API Types and Interfaces

export type ProcessingStage = 
  | 'cloning'
  | 'parsing'
  | 'analyzing'
  | 'generating'
  | 'complete'
  | 'error';

export interface AnalysisRequest {
  githubUrl: string;
  pdfFile?: File;
  options?: {
    includeTests?: boolean;
    maxDepth?: number;
    excludePatterns?: string[];
  };
}

export interface ProcessingUpdate {
  stage: ProcessingStage;
  progress: number; // 0-100
  message: string;
  timestamp: string;
  details?: {
    filesProcessed?: number;
    totalFiles?: number;
    currentFile?: string;
    errors?: string[];
  };
}

export interface AnalysisResponse {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  mermaidCode?: string;
  error?: string;
  metadata?: {
    repositoryName: string;
    totalFiles: number;
    processingTime: number;
    language: string;
  };
}

export interface WebSocketMessage {
  type: 'update' | 'complete' | 'error';
  jobId: string;
  data: ProcessingUpdate | AnalysisResponse;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// API Response wrapper
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
  timestamp: string;
}
