import { useState, useEffect, useCallback } from 'react';
import { aiService, AIService } from '../services/aiService';

export interface AIHookState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  initProgress: number;
}

export function useAI() {
  const [state, setState] = useState<AIHookState>({
    isInitialized: false,
    isLoading: false,
    error: null,
    initProgress: 0
  });

  const initialize = useCallback(async () => {
    if (state.isInitialized || state.isLoading) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await aiService.initialize();
      setState(prev => ({ 
        ...prev, 
        isInitialized: true, 
        isLoading: false,
        initProgress: 100
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'AI initialization failed'
      }));
    }
  }, [state.isInitialized, state.isLoading]);

  const optimizeTest = useCallback(async (testCase: any) => {
    if (!aiService.isReady()) {
      throw new Error('AI service not initialized');
    }
    return await aiService.generateTestOptimization(testCase);
  }, []);

  const generateAssertions = useCallback(async (elements: any[]) => {
    if (!aiService.isReady()) {
      throw new Error('AI service not initialized');
    }
    return await aiService.generateAssertions(elements);
  }, []);

  const debugTest = useCallback(async (testCase: any, error: string) => {
    if (!aiService.isReady()) {
      throw new Error('AI service not initialized');
    }
    return await aiService.debugTest(testCase, error);
  }, []);

  return {
    ...state,
    initialize,
    optimizeTest,
    generateAssertions,
    debugTest,
    isReady: aiService.isReady()
  };
}