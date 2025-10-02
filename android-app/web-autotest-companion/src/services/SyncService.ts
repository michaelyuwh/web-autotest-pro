import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TestCase, TestExecution, ConnectionSettings } from '../types';

class SyncService {
  private api: AxiosInstance;
  private baseUrl: string = 'http://localhost:3000';
  private apiKey?: string;
  private isConnected: boolean = false;

  constructor() {
    this.api = axios.create({
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.loadSettings();
  }

  private async loadSettings() {
    try {
      const settingsStr = await AsyncStorage.getItem('connectionSettings');
      if (settingsStr) {
        const settings: ConnectionSettings = JSON.parse(settingsStr);
        this.baseUrl = settings.webAppUrl;
        this.apiKey = settings.apiKey;
        this.api.defaults.baseURL = this.baseUrl;
        
        if (settings.apiKey) {
          this.api.defaults.headers.common['Authorization'] = `Bearer ${settings.apiKey}`;
        }
      }
    } catch (error) {
      console.error('Failed to load connection settings:', error);
    }
  }

  async updateSettings(settings: ConnectionSettings) {
    try {
      await AsyncStorage.setItem('connectionSettings', JSON.stringify(settings));
      this.baseUrl = settings.webAppUrl;
      this.apiKey = settings.apiKey;
      this.api.defaults.baseURL = this.baseUrl;
      
      if (settings.apiKey) {
        this.api.defaults.headers.common['Authorization'] = `Bearer ${settings.apiKey}`;
      } else {
        delete this.api.defaults.headers.common['Authorization'];
      }
    } catch (error) {
      console.error('Failed to save connection settings:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.api.get('/api/health');
      this.isConnected = response.status === 200;
      return this.isConnected;
    } catch (error) {
      console.error('Connection test failed:', error);
      this.isConnected = false;
      return false;
    }
  }

  async syncTestCases(): Promise<TestCase[]> {
    try {
      const response = await this.api.get('/api/test-cases');
      const testCases = response.data;
      
      // Cache test cases locally
      await AsyncStorage.setItem('cachedTestCases', JSON.stringify(testCases));
      
      return testCases;
    } catch (error) {
      console.error('Failed to sync test cases:', error);
      
      // Return cached test cases if available
      try {
        const cachedStr = await AsyncStorage.getItem('cachedTestCases');
        return cachedStr ? JSON.parse(cachedStr) : [];
      } catch (cacheError) {
        console.error('Failed to load cached test cases:', cacheError);
        return [];
      }
    }
  }

  async syncExecutions(): Promise<TestExecution[]> {
    try {
      const response = await this.api.get('/api/executions');
      const executions = response.data;
      
      // Cache executions locally
      await AsyncStorage.setItem('cachedExecutions', JSON.stringify(executions));
      
      return executions;
    } catch (error) {
      console.error('Failed to sync executions:', error);
      
      // Return cached executions if available
      try {
        const cachedStr = await AsyncStorage.getItem('cachedExecutions');
        return cachedStr ? JSON.parse(cachedStr) : [];
      } catch (cacheError) {
        console.error('Failed to load cached executions:', cacheError);
        return [];
      }
    }
  }

  async runTestCase(testCaseId: string, options?: any): Promise<TestExecution> {
    try {
      const response = await this.api.post('/api/executions', {
        testCaseId,
        options,
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to run test case:', error);
      throw error;
    }
  }

  async getExecution(executionId: string): Promise<TestExecution> {
    try {
      const response = await this.api.get(`/api/executions/${executionId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get execution:', error);
      throw error;
    }
  }

  async getTestCase(testCaseId: string): Promise<TestCase> {
    try {
      const response = await this.api.get(`/api/test-cases/${testCaseId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get test case:', error);
      throw error;
    }
  }

  async createTestCase(testCase: Partial<TestCase>): Promise<TestCase> {
    try {
      const response = await this.api.post('/api/test-cases', testCase);
      return response.data;
    } catch (error) {
      console.error('Failed to create test case:', error);
      throw error;
    }
  }

  async updateTestCase(testCaseId: string, updates: Partial<TestCase>): Promise<TestCase> {
    try {
      const response = await this.api.patch(`/api/test-cases/${testCaseId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Failed to update test case:', error);
      throw error;
    }
  }

  async deleteTestCase(testCaseId: string): Promise<void> {
    try {
      await this.api.delete(`/api/test-cases/${testCaseId}`);
    } catch (error) {
      console.error('Failed to delete test case:', error);
      throw error;
    }
  }

  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        'cachedTestCases',
        'cachedExecutions',
        'connectionSettings',
      ]);
    } catch (error) {
      console.error('Failed to clear cache:', error);
      throw error;
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // WebSocket connection for real-time updates
  connectWebSocket(): WebSocket | null {
    try {
      const wsUrl = this.baseUrl.replace('http', 'ws') + '/ws';
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnected = true;
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnected = false;
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnected = false;
      };
      
      return ws;
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      return null;
    }
  }
}

export default new SyncService();