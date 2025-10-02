// Shared types for the Android companion app

export interface TestCase {
  id: string;
  name: string;
  description?: string;
  url?: string;
  actions: TestAction[];
  created: Date;
  modified: Date;
  tags: string[];
}

export interface TestAction {
  id: string;
  type: 'click' | 'type' | 'navigate' | 'wait' | 'screenshot' | 'assertion';
  selector?: string;
  value?: string;
  expected?: string;
  timeout?: number;
  description?: string;
}

export interface TestExecution {
  id: string;
  testCaseId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  steps: ExecutionStep[];
  screenshots: Screenshot[];
  error?: string;
  browser?: string;
  executedBy?: string;
}

export interface ExecutionStep {
  id: string;
  actionId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  error?: string;
  screenshot?: string;
  duration?: number;
}

export interface Screenshot {
  id: string;
  stepId: string;
  timestamp: Date;
  path: string;
  data?: string;
}

export interface ConnectionSettings {
  webAppUrl: string;
  apiKey?: string;
  autoConnect: boolean;
  syncInterval: number;
}

export interface DashboardStats {
  totalTestCases: number;
  recentExecutions: number;
  successRate: number;
  activeTests: number;
}

export interface SyncStatus {
  connected: boolean;
  lastSync: Date;
  pendingChanges: number;
}