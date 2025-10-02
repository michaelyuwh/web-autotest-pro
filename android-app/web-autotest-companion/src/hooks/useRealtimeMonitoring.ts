import { useEffect, useState, useRef } from 'react';
import SyncService from '../services/SyncService';
import { TestExecution } from '../types';

interface UseRealtimeMonitoringOptions {
  testCaseId?: string;
  executionId?: string;
  onExecutionUpdate?: (execution: TestExecution) => void;
  onExecutionComplete?: (execution: TestExecution) => void;
  onExecutionError?: (execution: TestExecution, error: string) => void;
}

export const useRealtimeMonitoring = (options: UseRealtimeMonitoringOptions = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [activeExecutions, setActiveExecutions] = useState<TestExecution[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    try {
      const ws = SyncService.connectWebSocket();
      if (!ws) {
        throw new Error('Failed to create WebSocket connection');
      }

      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected for real-time monitoring');
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttempts.current = 0;

        // Subscribe to specific test case or execution updates
        if (options.testCaseId) {
          ws.send(JSON.stringify({
            type: 'subscribe_test_case',
            testCaseId: options.testCaseId
          }));
        }

        if (options.executionId) {
          ws.send(JSON.stringify({
            type: 'subscribe_execution',
            executionId: options.executionId
          }));
        }

        // Subscribe to all active executions
        ws.send(JSON.stringify({
          type: 'subscribe_active_executions'
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;

        // Attempt to reconnect if not manually closed
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`Attempting to reconnect in ${delay}ms...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('Connection error occurred');
      };

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setConnectionError('Failed to establish connection');
    }
  };

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'execution_started':
        const startedExecution: TestExecution = data.execution;
        setActiveExecutions(prev => {
          const exists = prev.find(e => e.id === startedExecution.id);
          if (exists) {
            return prev.map(e => e.id === startedExecution.id ? startedExecution : e);
          }
          return [...prev, startedExecution];
        });
        options.onExecutionUpdate?.(startedExecution);
        break;

      case 'execution_progress':
        const progressExecution: TestExecution = data.execution;
        setActiveExecutions(prev => 
          prev.map(e => e.id === progressExecution.id ? progressExecution : e)
        );
        options.onExecutionUpdate?.(progressExecution);
        break;

      case 'execution_completed':
        const completedExecution: TestExecution = data.execution;
        setActiveExecutions(prev => 
          prev.filter(e => e.id !== completedExecution.id)
        );
        options.onExecutionComplete?.(completedExecution);
        break;

      case 'execution_failed':
        const failedExecution: TestExecution = data.execution;
        const error = data.error || 'Unknown error';
        setActiveExecutions(prev => 
          prev.filter(e => e.id !== failedExecution.id)
        );
        options.onExecutionError?.(failedExecution, error);
        break;

      case 'active_executions':
        setActiveExecutions(data.executions || []);
        break;

      case 'step_completed':
        const stepUpdate = data;
        setActiveExecutions(prev => 
          prev.map(execution => {
            if (execution.id === stepUpdate.executionId) {
              return {
                ...execution,
                steps: execution.steps.map(step => 
                  step.id === stepUpdate.stepId 
                    ? { ...step, ...stepUpdate.step }
                    : step
                )
              };
            }
            return execution;
          })
        );
        break;

      case 'screenshot_captured':
        const screenshotData = data;
        setActiveExecutions(prev => 
          prev.map(execution => {
            if (execution.id === screenshotData.executionId) {
              return {
                ...execution,
                screenshots: [...execution.screenshots, screenshotData.screenshot]
              };
            }
            return execution;
          })
        );
        break;

      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }

    setIsConnected(false);
    setActiveExecutions([]);
  };

  const sendMessage = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  };

  const subscribeToExecution = (executionId: string) => {
    sendMessage({
      type: 'subscribe_execution',
      executionId
    });
  };

  const unsubscribeFromExecution = (executionId: string) => {
    sendMessage({
      type: 'unsubscribe_execution',
      executionId
    });
  };

  // Auto-connect on mount and clean up on unmount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected,
    connectionError,
    activeExecutions,
    connect,
    disconnect,
    sendMessage,
    subscribeToExecution,
    unsubscribeFromExecution
  };
};