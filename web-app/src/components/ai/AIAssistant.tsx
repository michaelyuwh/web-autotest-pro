import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Zap, Bug, Lightbulb, Loader2, AlertCircle } from 'lucide-react';
import { useAI } from '../../hooks/useAI';

interface AIAssistantProps {
  testCase?: any;
  elements?: any[];
  error?: string;
  onSuggestionApply?: (suggestion: string) => void;
}

export function AIAssistant({ testCase, elements, error, onSuggestionApply }: AIAssistantProps) {
  const { isInitialized, isLoading, error: aiError, initialize, optimizeTest, generateAssertions, debugTest } = useAI();
  const [suggestion, setSuggestion] = useState<string>('');
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [activeTab, setActiveTab] = useState<'optimize' | 'assertions' | 'debug'>('optimize');

  const handleInitialize = async () => {
    await initialize();
  };

  const handleOptimize = async () => {
    if (!testCase) return;
    
    setLoadingSuggestion(true);
    try {
      const result = await optimizeTest(testCase);
      setSuggestion(result);
    } catch (err) {
      setSuggestion(`Error generating optimization: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoadingSuggestion(false);
    }
  };

  const handleGenerateAssertions = async () => {
    if (!elements?.length) return;
    
    setLoadingSuggestion(true);
    try {
      const assertions = await generateAssertions(elements);
      setSuggestion(assertions.join('\n'));
    } catch (err) {
      setSuggestion(`Error generating assertions: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoadingSuggestion(false);
    }
  };

  const handleDebug = async () => {
    if (!testCase || !error) return;
    
    setLoadingSuggestion(true);
    try {
      const result = await debugTest(testCase, error);
      setSuggestion(result);
    } catch (err) {
      setSuggestion(`Error debugging test: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoadingSuggestion(false);
    }
  };

  if (!isInitialized && !isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="text-center">
          <Brain className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">AI Assistant</h3>
          <p className="text-gray-300 mb-4">
            Initialize the AI assistant to get intelligent test optimization, assertion generation, and debugging help.
          </p>
          <button
            onClick={handleInitialize}
            className="glass-button px-6 py-2 text-white hover:bg-white/20"
          >
            <Brain className="w-4 h-4 mr-2" />
            Initialize AI
          </button>
        </div>
      </motion.div>
    );
  }

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-400 mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-semibold text-white mb-2">Initializing AI...</h3>
          <p className="text-gray-300">Loading Web AutoTest Pro AI model...</p>
          <div className="w-full bg-gray-700 rounded-full h-2 mt-4">
            <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: '0%' }} />
          </div>
        </div>
      </motion.div>
    );
  }

  if (aiError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">AI Initialization Failed</h3>
          <p className="text-gray-300 mb-4">{aiError}</p>
          <button
            onClick={handleInitialize}
            className="glass-button px-4 py-2 text-white hover:bg-white/20"
          >
            Retry
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card"
    >
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">AI Assistant</h3>
          <div className="w-2 h-2 bg-green-400 rounded-full ml-auto" />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('optimize')}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              activeTab === 'optimize' 
                ? 'bg-blue-500/20 text-blue-300' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4 inline mr-1" />
            Optimize
          </button>
          <button
            onClick={() => setActiveTab('assertions')}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              activeTab === 'assertions' 
                ? 'bg-green-500/20 text-green-300' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Lightbulb className="w-4 h-4 inline mr-1" />
            Assertions
          </button>
          <button
            onClick={() => setActiveTab('debug')}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              activeTab === 'debug' 
                ? 'bg-red-500/20 text-red-300' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Bug className="w-4 h-4 inline mr-1" />
            Debug
          </button>
        </div>
      </div>
      
      <div className="p-4">
        <AnimatePresence mode="wait">
          {activeTab === 'optimize' && (
            <motion.div
              key="optimize"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <p className="text-gray-300 text-sm mb-3">
                Get AI-powered suggestions to improve test reliability and performance.
              </p>
              <button
                onClick={handleOptimize}
                disabled={!testCase || loadingSuggestion}
                className="glass-button px-4 py-2 text-white hover:bg-white/20 disabled:opacity-50"
              >
                {loadingSuggestion ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                Optimize Test
              </button>
            </motion.div>
          )}
          
          {activeTab === 'assertions' && (
            <motion.div
              key="assertions"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <p className="text-gray-300 text-sm mb-3">
                Generate meaningful test assertions based on UI elements.
              </p>
              <button
                onClick={handleGenerateAssertions}
                disabled={!elements?.length || loadingSuggestion}
                className="glass-button px-4 py-2 text-white hover:bg-white/20 disabled:opacity-50"
              >
                {loadingSuggestion ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Lightbulb className="w-4 h-4 mr-2" />
                )}
                Generate Assertions
              </button>
            </motion.div>
          )}
          
          {activeTab === 'debug' && (
            <motion.div
              key="debug"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <p className="text-gray-300 text-sm mb-3">
                Get help debugging test failures with AI analysis.
              </p>
              <button
                onClick={handleDebug}
                disabled={!testCase || !error || loadingSuggestion}
                className="glass-button px-4 py-2 text-white hover:bg-white/20 disabled:opacity-50"
              >
                {loadingSuggestion ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Bug className="w-4 h-4 mr-2" />
                )}
                Debug Test
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {suggestion && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-black/20 rounded-lg border border-white/10"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-white">AI Suggestion</h4>
              {onSuggestionApply && (
                <button
                  onClick={() => onSuggestionApply(suggestion)}
                  className="text-xs glass-button px-2 py-1 text-blue-300 hover:bg-blue-500/20"
                >
                  Apply
                </button>
              )}
            </div>
            <pre className="text-xs text-gray-300 whitespace-pre-wrap">{suggestion}</pre>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}