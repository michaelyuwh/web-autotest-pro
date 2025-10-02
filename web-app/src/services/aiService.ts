import { CreateMLCEngine, MLCEngineInterface } from '@mlc-ai/web-llm';

export interface AIService {
  initialize(): Promise<void>;
  isReady(): boolean;
  generateTestOptimization(testCase: any): Promise<string>;
  generateAssertions(elements: any[]): Promise<string[]>;
  debugTest(testCase: any, error: string): Promise<string>;
}

class WebLLMAIService implements AIService {
  private engine: MLCEngineInterface | null = null;
  private ready = false;
  private modelName = 'Phi-3-mini-4k-instruct-q4f16_1-MLC';

  async initialize(): Promise<void> {
    try {
      console.log('Initializing Web AutoTest Pro AI...');
      
      this.engine = await CreateMLCEngine(this.modelName, {
        initProgressCallback: (progress) => {
          console.log(`AI Model Loading: ${Math.round(progress.progress * 100)}%`);
        }
      });

      this.ready = true;
      console.log('Web AutoTest Pro AI initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AI:', error);
      throw new Error('AI initialization failed');
    }
  }

  isReady(): boolean {
    return this.ready && this.engine !== null;
  }

  async generateTestOptimization(testCase: any): Promise<string> {
    if (!this.isReady()) {
      throw new Error('AI service not initialized');
    }

    const prompt = this.buildOptimizationPrompt(testCase);
    const response = await this.engine!.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert test automation engineer. Analyze test cases and provide optimization suggestions to improve reliability, maintainability, and performance.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    return response.choices[0]?.message?.content || 'No optimization suggestions available';
  }

  async generateAssertions(elements: any[]): Promise<string[]> {
    if (!this.isReady()) {
      throw new Error('AI service not initialized');
    }

    const prompt = this.buildAssertionPrompt(elements);
    const response = await this.engine!.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert test automation engineer. Generate meaningful test assertions based on UI elements and their context.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.5
    });

    const content = response.choices[0]?.message?.content || '';
    return this.parseAssertions(content);
  }

  async debugTest(testCase: any, error: string): Promise<string> {
    if (!this.isReady()) {
      throw new Error('AI service not initialized');
    }

    const prompt = this.buildDebugPrompt(testCase, error);
    const response = await this.engine!.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert test automation debugger. Analyze test failures and provide specific, actionable solutions.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 400,
      temperature: 0.3
    });

    return response.choices[0]?.message?.content || 'No debugging suggestions available';
  }

  private buildOptimizationPrompt(testCase: any): string {
    return `
Analyze this test case and suggest optimizations:

Test Name: ${testCase.name}
Actions: ${JSON.stringify(testCase.actions, null, 2)}
Current Status: ${testCase.status}

Please provide specific suggestions for:
1. Selector reliability improvements
2. Wait strategy optimizations  
3. Test structure improvements
4. Performance optimizations

Format your response as actionable bullet points.
    `.trim();
  }

  private buildAssertionPrompt(elements: any[]): string {
    const elementDescriptions = elements.map(el => ({
      tag: el.tagName,
      text: el.textContent?.slice(0, 100),
      role: el.getAttribute('role'),
      type: el.type,
      visible: el.offsetWidth > 0 && el.offsetHeight > 0
    }));

    return `
Based on these UI elements, suggest appropriate test assertions:

Elements: ${JSON.stringify(elementDescriptions, null, 2)}

Generate 3-5 meaningful assertions that verify:
1. Element presence and visibility
2. Content validation
3. State verification
4. User interaction results

Format each assertion as: "expect([selector]).to[assertion]"
    `.trim();
  }

  private buildDebugPrompt(testCase: any, error: string): string {
    return `
A test case is failing. Help debug and fix it:

Test Case: ${testCase.name}
Error: ${error}
Actions: ${JSON.stringify(testCase.actions?.slice(-3), null, 2)} (last 3 actions)

Analyze the error and provide:
1. Root cause analysis
2. Specific fix recommendations
3. Prevention strategies
4. Alternative approaches

Be specific about selector improvements, timing issues, or logic problems.
    `.trim();
  }

  private parseAssertions(content: string): string[] {
    const lines = content.split('\n');
    const assertions: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.includes('expect(') || trimmed.includes('assert') || trimmed.includes('should')) {
        assertions.push(trimmed);
      }
    }

    return assertions.length > 0 ? assertions : ['expect(element).toBeVisible()'];
  }
}

// Export singleton instance
export const aiService = new WebLLMAIService();