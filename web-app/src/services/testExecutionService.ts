import { PlaywrightExecutor, ExecutionOptions } from './playwrightExecutorMock';
import { TestCase, TestExecution, ExecutionStatus } from '@web-autotest-pro/shared';
import { useAppStore } from '../stores/app-store';

export interface TestExecutionService {
  executeTestCase: (testCase: TestCase, options?: Partial<ExecutionOptions>) => Promise<TestExecution>;
  executeMultipleTestCases: (testCases: TestCase[], options?: Partial<ExecutionOptions>) => Promise<TestExecution[]>;
  cancelExecution: (executionId: string) => Promise<void>;
  getExecutionStatus: (executionId: string) => ExecutionStatus | null;
  cleanup: () => Promise<void>;
}

class TestExecutionServiceImpl implements TestExecutionService {
  private executors: Map<string, PlaywrightExecutor> = new Map();
  private executions: Map<string, TestExecution> = new Map();
  private readonly defaultOptions: ExecutionOptions = {
    browser: 'chromium',
    headless: false,
    viewport: { width: 1280, height: 720 },
    timeout: 30000,
    screenshots: true,
    video: false,
    slowMotion: 200,
    trace: false
  };

  async executeTestCase(testCase: TestCase, options: Partial<ExecutionOptions> = {}): Promise<TestExecution> {
    const finalOptions = { ...this.defaultOptions, ...options };
    const executor = new PlaywrightExecutor(finalOptions);
    
    try {
      // Initialize browser
      await executor.initialize();
      
      // Store executor for potential cancellation
      this.executors.set(testCase.id, executor);
      
      // Execute test case
      const execution = await executor.executeTestCase(testCase);
      
      // Store execution result
      this.executions.set(execution.id, execution);
      
      // Update store with execution result
      const { addExecution } = useAppStore.getState();
      addExecution(execution);
      
      console.log(`Test execution completed: ${execution.status}`);
      return execution;
      
    } catch (error) {
      console.error('Test execution failed:', error);
      
      const failedExecution: TestExecution = {
        id: `exec_${Date.now()}`,
        testCaseId: testCase.id,
        status: ExecutionStatus.ERROR,
        startTime: Date.now(),
        endTime: Date.now(),
        browser: finalOptions.browser,
        results: [],
        screenshots: [],
        logs: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      this.executions.set(failedExecution.id, failedExecution);
      const { addExecution } = useAppStore.getState();
      addExecution(failedExecution);
      
      throw error;
    } finally {
      // Cleanup executor
      await executor.cleanup();
      this.executors.delete(testCase.id);
    }
  }

  async executeMultipleTestCases(
    testCases: TestCase[], 
    options: Partial<ExecutionOptions> = {}
  ): Promise<TestExecution[]> {
    const executions: TestExecution[] = [];
    
    for (const testCase of testCases) {
      try {
        console.log(`Executing test case: ${testCase.name}`);
        const execution = await this.executeTestCase(testCase, options);
        executions.push(execution);
        
        // Short delay between test cases
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Failed to execute test case ${testCase.name}:`, error);
        // Continue with next test case even if current one fails
      }
    }
    
    return executions;
  }

  async cancelExecution(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }
    
    // Find and cleanup the associated executor
    const executor = this.executors.get(execution.testCaseId);
    if (executor) {
      await executor.cleanup();
      this.executors.delete(execution.testCaseId);
    }
    
    // Update execution status
    execution.status = ExecutionStatus.CANCELLED;
    execution.endTime = Date.now();
    execution.duration = execution.endTime - execution.startTime;
    
    // Update store
    const { updateExecution } = useAppStore.getState();
    updateExecution(execution.id, execution);
    
    console.log(`Execution ${executionId} cancelled`);
  }

  getExecutionStatus(executionId: string): ExecutionStatus | null {
    const execution = this.executions.get(executionId);
    return execution?.status || null;
  }

  async cleanup(): Promise<void> {
    console.log('Cleaning up test execution service...');
    
    // Cleanup all active executors
    const cleanupPromises = Array.from(this.executors.values()).map(executor => 
      executor.cleanup().catch(error => console.error('Error cleaning up executor:', error))
    );
    
    await Promise.all(cleanupPromises);
    
    // Clear maps
    this.executors.clear();
    this.executions.clear();
    
    console.log('Test execution service cleanup completed');
  }
}

// Singleton instance
let testExecutionService: TestExecutionService | null = null;

export const getTestExecutionService = (): TestExecutionService => {
  if (!testExecutionService) {
    testExecutionService = new TestExecutionServiceImpl();
  }
  return testExecutionService;
};

// Cleanup function for app shutdown
export const cleanupTestExecutionService = async (): Promise<void> => {
  if (testExecutionService) {
    await testExecutionService.cleanup();
    testExecutionService = null;
  }
};

// Hook for React components
export const useTestExecution = () => {
  const service = getTestExecutionService();
  const { executions, addExecution, updateExecution } = useAppStore();
  
  const executeTest = async (testCase: TestCase, options?: Partial<ExecutionOptions>) => {
    try {
      return await service.executeTestCase(testCase, options);
    } catch (error) {
      console.error('Test execution failed:', error);
      throw error;
    }
  };
  
  const executeMultipleTests = async (testCases: TestCase[], options?: Partial<ExecutionOptions>) => {
    try {
      return await service.executeMultipleTestCases(testCases, options);
    } catch (error) {
      console.error('Multiple test execution failed:', error);
      throw error;
    }
  };
  
  const cancelTest = async (executionId: string) => {
    try {
      await service.cancelExecution(executionId);
    } catch (error) {
      console.error('Test cancellation failed:', error);
      throw error;
    }
  };
  
  return {
    executions,
    executeTest,
    executeMultipleTests,
    cancelTest,
    getExecutionStatus: service.getExecutionStatus.bind(service)
  };
};