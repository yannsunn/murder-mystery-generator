/**
 * 🎯 Murder Mystery Generator - TypeScript Type Definitions
 * 統一型定義ファイル - プロジェクト全体の型安全性を保証
 */

// ===== CORE TYPES =====

export interface FormData {
  participants: string;
  era: string;
  setting: string;
  tone: string;
  complexity: string;
  worldview?: string;
  incident_type?: string;
}

export interface SessionData {
  sessionId: string;
  formData: FormData;
  apiKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StageData {
  [key: string]: any;
}

// ===== API TYPES =====

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    id: string;
    type: string;
    message: string;
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    retryable?: boolean;
    retryAfter?: number;
    timestamp: string;
    recovery?: {
      attempted: boolean;
      successful: boolean;
      retryScheduled: boolean;
      reason?: string;
    };
  };
  metadata?: {
    stage?: string;
    duration?: number;
    timestamp: string;
  };
}

export interface GroqAPIResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ===== ERROR TYPES =====

export type ErrorType = 
  | 'SYSTEM_FAILURE'
  | 'DATABASE_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'SECURITY_BREACH'
  | 'API_ERROR'
  | 'EXTERNAL_SERVICE_ERROR'
  | 'TIMEOUT_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'RESOURCE_EXHAUSTION'
  | 'VALIDATION_ERROR'
  | 'BUSINESS_LOGIC_ERROR'
  | 'CONFIGURATION_ERROR'
  | 'NETWORK_ERROR'
  | 'USER_INPUT_ERROR'
  | 'CLIENT_ERROR'
  | 'FEATURE_UNAVAILABLE'
  | 'RECOVERABLE_ERROR'
  | 'TEMPORARY_ERROR'
  | 'DEPRECATED_FEATURE';

export type ErrorPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface ErrorContext {
  timestamp: string;
  environment: string;
  requestId?: string;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
  endpoint?: string;
  method?: string;
  [key: string]: any;
}

export interface UnifiedErrorData {
  id: string;
  type: ErrorType;
  message: string;
  userMessage: string;
  priority: ErrorPriority;
  statusCode: number;
  isRecoverable: boolean;
  retryCount: number;
  maxRetries: number;
  context: ErrorContext;
  stack?: string;
}

// ===== ENVIRONMENT TYPES =====

export interface EnvironmentVariables {
  NODE_ENV: 'development' | 'production' | 'test';
  GROQ_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_KEY?: string;
  VERCEL?: string;
  VERCEL_ENV?: 'development' | 'preview' | 'production';
  VERCEL_REGION?: string;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
}

export interface EnvironmentDebugInfo {
  timestamp: string;
  runtime: {
    NODE_ENV: string;
    VERCEL?: string;
    VERCEL_ENV?: string;
    VERCEL_REGION?: string;
  };
  groqApiKey: {
    exists: boolean;
    empty: boolean;
    length: number;
    validPrefix: boolean;
    firstChars: string;
  };
  supabaseKeys: {
    url: string;
    anonKey: string;
    serviceKey: string;
  };
  allEnvVarNames: string[];
}

// ===== AI CLIENT TYPES =====

export interface AIClientConfig {
  maxDuration: number;
  timeout: number;
  retries: number;
}

export interface AIGenerationOptions {
  maxTokens?: number;
  timeout?: number;
  temperature?: number;
  model?: string;
  preferredProvider?: 'groq' | 'openai';
  maxRetries?: number;
  retryDelay?: number;
  apiKey?: string;
}

export interface AIGenerationResult {
  success: boolean;
  content: string;
  provider?: string;
  model?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

// ===== STAGE GENERATOR TYPES =====

export interface StageGeneratorConfig {
  stageName: string;
  timeoutSeconds: number;
}

export interface StageResult {
  [key: string]: any;
  stage_completed?: boolean;
  stage_timestamp?: string;
}

// ===== SUPABASE TYPES =====

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceKey?: string;
}

export interface DatabaseRecord {
  id?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

// ===== STATISTICS TYPES =====

export interface ErrorStatistic {
  count: number;
  firstOccurrence: number;
  lastOccurrence: number;
  contexts: Array<{
    timestamp: number;
    [key: string]: any;
  }>;
}

export interface SystemStatistics {
  totalErrors: number;
  recentErrors: number;
  criticalErrors: number;
  errorRate: number;
  uptime: number;
  topErrors: Array<{
    type: string;
    count: number;
    firstOccurrence: number;
    lastOccurrence: number;
  }>;
  hourlyTrend: Array<{
    hour: string;
    errors: number;
  }>;
}

export interface RecoveryStatistics {
  globalRetries: number;
  maxGlobalRetries: number;
  activeRecoveryAttempts: number;
  availableStrategies: string[];
}

export interface PerformanceMetrics {
  responseTime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage?: number;
  timestamp: string;
}

// ===== VERCEL TYPES =====

export interface VercelRequest {
  method: string;
  url: string;
  headers: { [key: string]: string | string[] | undefined };
  body?: any;
  query?: { [key: string]: string | string[] | undefined };
  cookies?: { [key: string]: string };
  user?: {
    id: string;
    [key: string]: any;
  };
}

export interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (object: any) => VercelResponse;
  send: (body: any) => VercelResponse;
  end: (data?: any) => void;
  setHeader: (name: string, value: string | string[]) => VercelResponse;
  redirect: (statusOrUrl: number | string, url?: string) => VercelResponse;
  headersSent: boolean;
}

export type VercelHandler = (req: VercelRequest, res: VercelResponse) => Promise<void> | void;

// ===== MONITORING TYPES =====

export interface AlertThresholds {
  criticalErrorRate: number;
  highErrorCount: number;
  errorBurst: number;
}

export interface Alert {
  type: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  timestamp?: string;
  error?: UnifiedErrorData;
  context?: any;
  stats?: SystemStatistics;
}

export interface NotificationChannel {
  name: string;
  send: (alert: Alert) => Promise<void>;
}

// ===== UTILITY TYPES =====

export type Maybe<T> = T | null | undefined;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// ===== LEGACY SUPPORT =====

export interface AppError {
  message: string;
  type: ErrorType;
  statusCode: number;
}

// ===== MODULE AUGMENTATIONS =====

declare global {
  namespace NodeJS {
    interface ProcessEnv extends EnvironmentVariables {}
  }
}

// Export all types for external use
export * from './index';