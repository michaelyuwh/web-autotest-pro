import { motion } from 'framer-motion';
import { Play, Pause, Square, MousePointer, Eye, Settings } from 'lucide-react';
import { useAppStore } from '../../stores/app-store';
import { AIAssistant } from '../ai/AIAssistant';

export const Recording = () => {
  const { recording, startRecording, stopRecording, pauseRecording, resumeRecording } = useAppStore();

  const handleStartRecording = () => {
    const url = 'https://example.com'; // This would come from user input
    startRecording(url);
  };

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-morphism p-6"
      >
        <h1 className="text-3xl font-bold text-white mb-2">Recording Studio</h1>
        <p className="text-gray-300">
          Record your browser interactions with AI-powered optimization
        </p>
      </motion.div>

      {/* Recording Controls */}
      <div className="glass-morphism p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {!recording.isRecording ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStartRecording}
                className="glass-button bg-red-500/20 border-red-500/30 hover:bg-red-500/30"
              >
                <Play className="w-5 h-5 mr-2 text-red-400" />
                Start Recording
              </motion.button>
            ) : (
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={recording.isPaused ? resumeRecording : pauseRecording}
                  className="glass-button bg-yellow-500/20 border-yellow-500/30 hover:bg-yellow-500/30"
                >
                  {recording.isPaused ? (
                    <><Play className="w-5 h-5 mr-2 text-yellow-400" />Resume</>
                  ) : (
                    <><Pause className="w-5 h-5 mr-2 text-yellow-400" />Pause</>
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={stopRecording}
                  className="glass-button bg-gray-500/20 border-gray-500/30 hover:bg-gray-500/30"
                >
                  <Square className="w-5 h-5 mr-2 text-gray-400" />
                  Stop
                </motion.button>
              </div>
            )}
          </div>

          {recording.isRecording && (
            <div className="recording-indicator">
              <div className="recording-pulse" />
              <span>Recording - {recording.actions.length} actions captured</span>
            </div>
          )}
        </div>

        {/* URL Input */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Target URL
            </label>
            <input
              type="url"
              placeholder="https://example.com"
              className="glass-input w-full"
              disabled={recording.isRecording}
            />
          </div>

          {/* Recording Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <input type="checkbox" id="pip" className="rounded" defaultChecked />
              <label htmlFor="pip" className="text-sm text-gray-300">
                Enable Picture-in-Picture
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="mouse" className="rounded" defaultChecked />
              <label htmlFor="mouse" className="text-sm text-gray-300">
                Track Mouse Position
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="ai" className="rounded" />
              <label htmlFor="ai" className="text-sm text-gray-300">
                AI Optimization
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Recording Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Preview */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-morphism p-6 h-96"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Live Preview</h3>
              <div className="flex gap-2">
                <Eye className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">Preview Mode</span>
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg h-full flex items-center justify-center">
              {recording.isRecording ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                  </div>
                  <p className="text-white font-medium">Recording in progress...</p>
                  <p className="text-gray-400 text-sm">URL: {recording.currentUrl}</p>
                </div>
              ) : (
                <div className="text-center">
                  <MousePointer className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Preview will appear when recording starts</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Action Log */}
        <div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-morphism p-6 h-96"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Action Log</h3>
              <Settings className="w-4 h-4 text-gray-400" />
            </div>
            <div className="space-y-2 overflow-auto h-full">
              {recording.actions.length > 0 ? (
                recording.actions.map((action, index) => (
                  <div key={action.id} className="text-sm p-2 bg-white/5 rounded">
                    <span className="text-blue-400">#{index + 1}</span>
                    <span className="text-white ml-2">{action.description}</span>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(action.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-8">
                  Actions will appear here during recording
                </p>
              )}
            </div>
          </motion.div>
        </div>

        {/* AI Assistant */}
        <div className="space-y-4">
          <AIAssistant 
            testCase={recording.actions.length > 0 ? {
              name: 'Current Recording',
              actions: recording.actions,
              status: recording.isRecording ? 'recording' : 'completed'
            } : undefined}
            elements={[]} // This would be populated with detected UI elements
            onSuggestionApply={(suggestion) => {
              console.log('Applying AI suggestion:', suggestion);
              // Here you would implement applying the suggestion
            }}
          />
        </div>
      </div>
    </div>
  );
};