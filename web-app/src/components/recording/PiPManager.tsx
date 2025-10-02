import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { X, Move, Minimize2, Maximize2 } from 'lucide-react';
import { useAppStore } from '../../stores/app-store';

interface PiPWindowProps {
  id: string;
  title: string;
  children: React.ReactNode;
  defaultPosition: { x: number; y: number };
  defaultSize: { width: number; height: number };
  onClose: () => void;
}

const PiPWindow = ({ id, title, children, defaultPosition, defaultSize, onClose }: PiPWindowProps) => {
  const [position, setPosition] = useState(defaultPosition);
  const [size, setSize] = useState(defaultSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as Element).closest('.pip-header')) {
      setIsDragging(true);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - size.width / 2,
          y: e.clientY - 32, // Account for header height
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, size.width]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        x: position.x,
        y: position.y,
        width: size.width,
        height: isMinimized ? 40 : size.height
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={`pip-window ${isDragging ? 'cursor-move' : ''}`}
      style={{
        left: 0,
        top: 0,
      }}
    >
      {/* Header */}
      <div 
        className="pip-header"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <Move className="w-4 h-4 text-gray-400" />
          <span className="text-white font-medium text-sm">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            {isMinimized ? (
              <Maximize2 className="w-3 h-3 text-gray-400" />
            ) : (
              <Minimize2 className="w-3 h-3 text-gray-400" />
            )}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-1 hover:bg-red-500/20 rounded transition-colors"
          >
            <X className="w-3 h-3 text-red-400" />
          </motion.button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="pip-content">
          {children}
        </div>
      )}
    </motion.div>
  );
};

export const PiPManager = () => {
  const { recording } = useAppStore();
  const [pipWindows, setPipWindows] = useState<Array<{
    id: string;
    type: string;
    title: string;
    component: React.ReactNode;
  }>>([]);

  useEffect(() => {
    if (recording.isRecording) {
      // Add recording controls PiP window
      setPipWindows([
        {
          id: 'recording-controls',
          type: 'controls',
          title: 'Recording Controls',
          component: (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-white text-sm font-medium">Recording Active</span>
              </div>
              <div className="text-xs text-gray-400">
                <div>Actions: {recording.actions.length}</div>
                <div>URL: {recording.currentUrl}</div>
                <div>Duration: {Math.floor((Date.now() - recording.startTime) / 1000)}s</div>
              </div>
            </div>
          )
        },
        {
          id: 'mouse-tracker',
          type: 'mouse_tracker',
          title: 'Mouse Tracker',
          component: (
            <div className="space-y-2">
              <div className="text-white text-sm font-medium">Mouse Position</div>
              <div className="text-xs text-gray-400">
                <div>X: 0</div>
                <div>Y: 0</div>
              </div>
              <div className="w-full h-20 bg-gray-800/50 rounded relative">
                <div className="absolute w-1 h-1 bg-red-500 rounded-full" />
              </div>
            </div>
          )
        }
      ]);
    } else {
      setPipWindows([]);
    }
  }, [recording.isRecording, recording.actions.length, recording.currentUrl, recording.startTime]);

  const closePipWindow = (id: string) => {
    setPipWindows(prev => prev.filter(window => window.id !== id));
  };

  return (
    <AnimatePresence>
      {pipWindows.map((window, index) => (
        <PiPWindow
          key={window.id}
          id={window.id}
          title={window.title}
          defaultPosition={{ 
            x: (typeof globalThis !== 'undefined' && globalThis.innerWidth ? globalThis.innerWidth : 1200) - 350 - (index * 20), 
            y: 100 + (index * 20) 
          }}
          defaultSize={{ width: 320, height: 240 }}
          onClose={() => closePipWindow(window.id)}
        >
          {window.component}
        </PiPWindow>
      ))}
    </AnimatePresence>
  );
};