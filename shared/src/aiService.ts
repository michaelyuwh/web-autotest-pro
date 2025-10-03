// Enhanced AI Service with Phi-3 Mini Integration and WebGPU Acceleration
// Provides local AI-powered test debugging, optimization, and generation

// Note: @mlc-ai/web-llm is imported dynamically to avoid build-time dependency
// in shared package since it's browser-only
import { TestCase, TestAction, TestExecution, ExecutionStep } from './types';

export interface AIModelConfig {
  modelId: string;
  modelUrl: string;
  modelLibUrl: string;
  vramRequiredMB: number;
  lowResourceMode: boolean;
  useWebGPU: boolean;
  maxContextLength: number;
}

export interface AIDebugRequest {
  testCase: TestCase;
  execution: TestExecution;
  failedStep?: ExecutionStep;
  errorContext?: string;
  domSnapshot?: string;
  screenshot?: string;
}

export interface AIDebugResponse {
  success: boolean;
  suggestions: AISuggestion[];
  optimizations: AIOptimization[];
  rootCause?: string;
  confidence: number;
  processingTime: number;
  error?: string;
}

export interface AISuggestion {
  id: string;
  type: 'selector_fix' | 'timing_fix' | 'assertion_fix' | 'flow_fix' | 'data_fix';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  suggestedAction: TestAction;
  confidence: number;
  reasoning: string;
}

export interface AIOptimization {
  id: string;
  type: 'performance' | 'reliability' | 'maintainability' | 'coverage';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  implementationComplexity: 'easy' | 'medium' | 'hard';
  suggestedChanges: TestAction[];
  estimatedImprovement: string;
}

export interface AIGenerationRequest {
  description: string;
  url: string;
  requirements: string[];
  domSnapshot?: string;
  userFlow?: string[];
  examples?: TestCase[];
}

export interface AIGenerationResponse {
  success: boolean;
  testCase: TestCase;
  confidence: number;
  alternatives: TestCase[];
  warnings: string[];
  processingTime: number;
  error?: string;
}

export interface AIModelStatus {
  loaded: boolean;
  loading: boolean;
  modelId: string;
  memoryUsage: number;
  inferenceTime: number;
  lastUsed: number;
  capabilities: {
    webgpu: boolean;
    wasm: boolean;
    debugging: boolean;
    generation: boolean;
    optimization: boolean;
  };
  error?: string;
}

export class EnhancedAIService {
  private engine: any | null = null;
  private modelConfig: AIModelConfig;
  private isInitialized = false;
  private isLoading = false;
  private lastInferenceTime = 0;
  private totalInferences = 0;
  private memoryUsage = 0;

  constructor(config?: Partial<AIModelConfig>) {
    this.modelConfig = {
      modelId: 'Phi-3-mini-4k-instruct-q4f16_1-MLC',
      modelUrl: 'https://huggingface.co/mlc-ai/Phi-3-mini-4k-instruct-q4f16_1-MLC',
      modelLibUrl: 'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/phi-3-mini/phi-3-mini-4k-instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm',
      vramRequiredMB: 2048,
      lowResourceMode: false,
      useWebGPU: true,
      maxContextLength: 4096,
      ...config
    };
  }

  /**
   * Initialize the AI model
   */
  async initialize(): Promise<{ success: boolean; error?: string }> {
    if (this.isInitialized) {
      return { success: true };
    }

    if (this.isLoading) {
      // Wait for existing initialization
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!this.isLoading) {
            clearInterval(checkInterval);
            resolve({ success: this.isInitialized });
          }
        }, 100);
      });
    }

    this.isLoading = true;

    try {
      console.log('Initializing Phi-3 mini model...');

      // Check WebGPU support
      const webgpuSupported = await this.checkWebGPUSupport();
      if (!webgpuSupported && this.modelConfig.useWebGPU) {
        console.warn('WebGPU not supported, falling back to WASM');
        this.modelConfig.useWebGPU = false;
      }

      // Initialize the engine
      // Dynamic import of web-llm (implemented in web-app package)
      // this.engine = new webllm.MLCEngine();
      throw new Error('AI engine initialization must be implemented in consuming package');

      // Configure the model
      const initConfig: any = {
        initProgressCallback: (report: any) => {
          const progress = report.progress || 0;
          console.log(`Loading model: ${Math.round(progress * 100)}%`);
        },
        // Use local model cache
        appConfig: {
          model_list: [
            {
              model: this.modelConfig.modelId,
              model_id: this.modelConfig.modelId,
              model_lib: this.modelConfig.modelLibUrl,
              vram_required_MB: this.modelConfig.vramRequiredMB,
              low_resource_required: this.modelConfig.lowResourceMode
            }
          ]
        }
      };

      await this.engine.reload(this.modelConfig.modelId);

      this.isInitialized = true;
      this.isLoading = false;

      console.log('Phi-3 mini model loaded successfully');
      return { success: true };

    } catch (error) {
      this.isLoading = false;
      this.isInitialized = false;
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to initialize AI model:', errorMessage);
      
      return { 
        success: false, 
        error: `Failed to load Phi-3 mini: ${errorMessage}` 
      };
    }
  }

  /**
   * Debug test failures with AI assistance
   */
  async debugTest(request: AIDebugRequest): Promise<AIDebugResponse> {
    const startTime = Date.now();

    if (!this.isInitialized || !this.engine) {
      return {
        success: false,
        suggestions: [],
        optimizations: [],
        confidence: 0,
        processingTime: 0,
        error: 'AI model not initialized'
      };
    }

    try {
      const prompt = this.buildDebugPrompt(request);
      const response = await this.engine.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt('debug')
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1024,
        top_p: 0.9
      });

      const aiResponse = response.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('No response from AI model');
      }

      const debugResult = await this.parseDebugResponse(aiResponse, request);
      const processingTime = Date.now() - startTime;

      this.lastInferenceTime = processingTime;
      this.totalInferences++;

      return {
        ...debugResult,
        processingTime
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('AI debug failed:', error);
      
      return {
        success: false,
        suggestions: [],
        optimizations: [],
        confidence: 0,
        processingTime,
        error: error instanceof Error ? error.message : 'AI debugging failed'
      };
    }
  }

  /**
   * Generate test cases with AI assistance
   */
  async generateTest(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    const startTime = Date.now();

    if (!this.isInitialized || !this.engine) {
      return {
        success: false,
        testCase: this.createEmptyTestCase(),
        confidence: 0,
        alternatives: [],
        warnings: [],
        processingTime: 0,
        error: 'AI model not initialized'
      };
    }

    try {
      const prompt = this.buildGenerationPrompt(request);
      const response = await this.engine.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt('generation')
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1536,
        top_p: 0.95
      });

      const aiResponse = response.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('No response from AI model');
      }

      const generationResult = await this.parseGenerationResponse(aiResponse, request);
      const processingTime = Date.now() - startTime;

      this.lastInferenceTime = processingTime;
      this.totalInferences++;

      return {
        ...generationResult,
        processingTime
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('AI generation failed:', error);
      
      return {
        success: false,
        testCase: this.createEmptyTestCase(),
        confidence: 0,
        alternatives: [],
        warnings: [],
        processingTime,
        error: error instanceof Error ? error.message : 'AI generation failed'
      };
    }
  }

  /**
   * Optimize existing test cases
   */
  async optimizeTest(testCase: TestCase, context?: string): Promise<AIDebugResponse> {
    const request: AIDebugRequest = {
      testCase,
      execution: {
        id: 'optimization_request',
        testCaseId: testCase.id,
        browser: 'chrome',
        status: 'completed' as any,
        startTime: Date.now(),
        endTime: Date.now(),
        duration: 0,
        results: [],
        screenshots: [],
        logs: []
      },
      errorContext: context
    };

    return this.debugTest(request);
  }

  /**
   * Get AI model status
   */
  getStatus(): AIModelStatus {
    return {
      loaded: this.isInitialized,
      loading: this.isLoading,
      modelId: this.modelConfig.modelId,
      memoryUsage: this.memoryUsage,
      inferenceTime: this.lastInferenceTime,
      lastUsed: this.totalInferences > 0 ? Date.now() : 0,
      capabilities: {
        webgpu: this.modelConfig.useWebGPU,
        wasm: !this.modelConfig.useWebGPU,
        debugging: this.isInitialized,
        generation: this.isInitialized,
        optimization: this.isInitialized
      },
      error: this.isInitialized ? undefined : 'Model not loaded'
    };
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (this.engine) {
      try {
        await this.engine.unload();
      } catch (error) {
        console.error('Error unloading AI model:', error);
      }
      this.engine = null;
    }
    
    this.isInitialized = false;
    this.isLoading = false;
  }

  // Private methods
  private async checkWebGPUSupport(): Promise<boolean> {
    try {
      const gpu = (navigator as any).gpu;
      if (!gpu) {
        return false;
      }

      const adapter = await gpu.requestAdapter();
      if (!adapter) {
        return false;
      }

      const device = await adapter.requestDevice();
      return !!device;
    } catch (error) {
      console.warn('WebGPU check failed:', error);
      return false;
    }
  }

  private getSystemPrompt(mode: 'debug' | 'generation' | 'optimization'): string {
    const basePrompt = `You are an expert web test automation assistant specializing in browser testing. 
You understand HTML, CSS, JavaScript, and common web testing patterns.
You provide practical, actionable suggestions for test debugging and optimization.
Always respond with valid JSON in the specified format.`;

    switch (mode) {
      case 'debug':
        return `${basePrompt}

When debugging test failures, analyze:
1. Selector reliability and specificity
2. Timing issues and race conditions
3. Element state and visibility
4. Page load and dynamic content
5. Cross-browser compatibility
6. Network and performance issues

Provide specific, implementable solutions with high confidence ratings.`;

      case 'generation':
        return `${basePrompt}

When generating test cases:
1. Create comprehensive, maintainable tests
2. Use reliable selectors (data-testid > id > class > xpath)
3. Include proper assertions and validations
4. Handle common edge cases
5. Follow testing best practices
6. Ensure cross-browser compatibility

Generate realistic, production-ready test scenarios.`;

      case 'optimization':
        return `${basePrompt}

When optimizing tests:
1. Improve reliability and reduce flakiness
2. Enhance performance and execution speed
3. Increase maintainability and readability
4. Add better error handling
5. Optimize selector strategies
6. Reduce test dependencies

Focus on practical improvements with measurable benefits.`;

      default:
        return basePrompt;
    }
  }

  private buildDebugPrompt(request: AIDebugRequest): string {
    let prompt = `Debug this failing web test:

Test Case: ${request.testCase.name}
Description: ${request.testCase.description || 'N/A'}
URL: ${request.testCase.url || 'N/A'}

Execution Status: ${request.execution.status}
Total Steps: ${request.testCase.actions.length}
`;

    if (request.failedStep) {
      prompt += `
Failed Step: ${request.failedStep.action?.type || 'unknown'}
Selector: ${request.failedStep.action?.selector || 'N/A'}
Error: ${request.failedStep.error || 'N/A'}
`;
    }

    if (request.errorContext) {
      prompt += `
Error Context: ${request.errorContext}
`;
    }

    if (request.domSnapshot) {
      prompt += `
DOM Snapshot: ${request.domSnapshot.substring(0, 1000)}...
`;
    }

    prompt += `
Test Actions:
${request.testCase.actions.map((action, index) => 
  `${index + 1}. ${action.type} - ${action.selector || action.url || 'N/A'} ${action.value ? `(${action.value})` : ''}`
).join('\n')}

Please analyze the failure and provide:
1. Root cause analysis
2. Specific fixing suggestions with improved selectors/actions
3. Performance optimizations
4. Prevention strategies for similar issues

Respond in JSON format with suggestions and optimizations arrays.`;

    return prompt;
  }

  private buildGenerationPrompt(request: AIGenerationRequest): string {
    let prompt = `Generate a comprehensive web test case:

Description: ${request.description}
Target URL: ${request.url}

Requirements:
${request.requirements.map((req, index) => `${index + 1}. ${req}`).join('\n')}
`;

    if (request.userFlow) {
      prompt += `
User Flow:
${request.userFlow.map((step, index) => `${index + 1}. ${step}`).join('\n')}
`;
    }

    if (request.domSnapshot) {
      prompt += `
Page Structure: ${request.domSnapshot.substring(0, 1000)}...
`;
    }

    if (request.examples && request.examples.length > 0) {
      prompt += `
Example Test Cases:
${request.examples.map((example, index) => 
  `${index + 1}. ${example.name}: ${example.actions.length} actions`
).join('\n')}
`;
    }

    prompt += `

Generate a complete test case with:
1. Descriptive name and clear description
2. Step-by-step actions with reliable selectors
3. Proper assertions and validations
4. Error handling and edge cases
5. Best practices for maintainability

Respond in JSON format with the complete test case structure.`;

    return prompt;
  }

  private async parseDebugResponse(aiResponse: string, request: AIDebugRequest): Promise<Omit<AIDebugResponse, 'processingTime'>> {
    try {
      // Extract JSON from AI response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        success: true,
        suggestions: parsed.suggestions || [],
        optimizations: parsed.optimizations || [],
        rootCause: parsed.rootCause,
        confidence: parsed.confidence || 0.7
      };

    } catch (error) {
      console.error('Failed to parse AI debug response:', error);
      
      // Fallback: create basic suggestions based on common patterns
      return {
        success: true,
        suggestions: this.generateFallbackSuggestions(request),
        optimizations: [],
        confidence: 0.3
      };
    }
  }

  private async parseGenerationResponse(aiResponse: string, request: AIGenerationRequest): Promise<Omit<AIGenerationResponse, 'processingTime'>> {
    try {
      // Extract JSON from AI response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        success: true,
        testCase: parsed.testCase || this.createEmptyTestCase(),
        confidence: parsed.confidence || 0.7,
        alternatives: parsed.alternatives || [],
        warnings: parsed.warnings || []
      };

    } catch (error) {
      console.error('Failed to parse AI generation response:', error);
      
      return {
        success: true,
        testCase: this.createBasicTestCase(request),
        confidence: 0.3,
        alternatives: [],
        warnings: ['AI parsing failed, generated basic test case']
      };
    }
  }

  private generateFallbackSuggestions(request: AIDebugRequest): AISuggestion[] {
    const suggestions: AISuggestion[] = [];

    if (request.failedStep?.action?.selector) {
      suggestions.push({
        id: `fallback_${Date.now()}`,
        type: 'selector_fix',
        severity: 'medium',
        title: 'Try more reliable selector',
        description: 'Consider using data-testid or more specific selectors',
        suggestedAction: {
          ...request.failedStep.action,
          selector: `[data-testid="${request.failedStep.action.selector.replace(/[#.]/g, '')}"]`
        },
        confidence: 0.6,
        reasoning: 'Data attributes are generally more reliable than class or ID selectors'
      });
    }

    suggestions.push({
      id: `fallback_timing_${Date.now()}`,
      type: 'timing_fix',
      severity: 'medium',
      title: 'Add explicit wait',
      description: 'Add wait for element to be visible before interaction',
      suggestedAction: {
        id: `wait_${Date.now()}`,
        type: 'WAIT' as any,
        selector: request.failedStep?.action?.selector || '',
        timestamp: Date.now(),
        description: 'Wait for element to be visible'
      },
      confidence: 0.7,
      reasoning: 'Timing issues are common causes of test failures'
    });

    return suggestions;
  }

  private createEmptyTestCase(): TestCase {
    return {
      id: `test_${Date.now()}`,
      name: 'Generated Test Case',
      description: 'AI-generated test case',
      url: '',
      actions: [],
      tags: ['ai-generated'],
      steps: [],
      successCriteria: [],
      metadata: {
        author: 'AI System',
        browser: 'chrome',
        deviceType: 'desktop',
        viewport: { width: 1920, height: 1080 },
        userAgent: 'AI Generated'
      },
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  private createBasicTestCase(request: AIGenerationRequest): TestCase {
    return {
      id: `test_${Date.now()}`,
      name: request.description || 'Generated Test Case',
      description: request.description,
      url: request.url,
      actions: [
        {
          id: `action_${Date.now()}`,
          type: 'NAVIGATE' as any,
          url: request.url,
          timestamp: Date.now(),
          description: `Navigate to ${request.url}`
        }
      ],
      steps: [],  
      successCriteria: [{
        id: 'criteria-1',
        type: 'status_code',
        expectedValue: 'success',
        description: 'Test execution completes successfully'
      }],
      tags: ['ai-generated', 'basic'],
      metadata: {
        author: 'AI System',
        browser: 'chrome',
        deviceType: 'desktop',
        viewport: { width: 1920, height: 1080 },
        userAgent: 'AI Generated'
      },
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }
}

// Export default instance
export const aiService = new EnhancedAIService();