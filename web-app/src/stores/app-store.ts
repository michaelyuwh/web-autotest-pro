import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { UIState, TestCase, TestExecution, RecordingState } from '@shared/types';
import sampleTestCases from '../data/sampleTestCases';

interface AppState extends UIState {
  // Test management
  testCases: TestCase[];
  executions: TestExecution[];
  activeTestCase: TestCase | null;
  activeExecution: TestExecution | null;
  
  // Recording state
  recording: RecordingState;
  
  // AI state
  aiEnabled: boolean;
  aiLoading: boolean;
  
  // UI actions
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  toggleSidebar: () => void;
  setActiveTab: (tab: string) => void;
  setActivePanel: (panel: string) => void;
  
  // Test management actions
  addTestCase: (testCase: TestCase) => void;
  updateTestCase: (id: string, updates: Partial<TestCase>) => void;
  deleteTestCase: (id: string) => void;
  setActiveTestCase: (testCase: TestCase | null) => void;
  
  // Execution actions
  addExecution: (execution: TestExecution) => void;
  updateExecution: (id: string, updates: Partial<TestExecution>) => void;
  setActiveExecution: (execution: TestExecution | null) => void;
  
  // Recording actions
  startRecording: (url: string) => void;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  
  // AI actions
  toggleAI: () => void;
  setAILoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial UI state
        theme: 'auto',
        liquidGlass: {
          transparency: 0.1,
          blur: 10,
          animations: true,
        },
        layout: {
          sidebarCollapsed: false,
          activeTabs: ['dashboard'],
          activePanel: 'dashboard',
        },
        accessibility: {
          highContrast: false,
          reducedMotion: false,
          keyboardNavigation: true,
        },
        
        // Initial data state
        testCases: sampleTestCases,
        executions: [],
        activeTestCase: null,
        activeExecution: null,
        
        // Initial recording state
        recording: {
          isRecording: false,
          isPaused: false,
          currentUrl: '',
          actions: [],
          startTime: 0,
          pipWindows: [],
        },
        
        // Initial AI state
        aiEnabled: false,
        aiLoading: false,
        
        // UI actions
        setTheme: (theme) => set({ theme }),
        toggleSidebar: () => set((state) => ({ 
          layout: { 
            ...state.layout, 
            sidebarCollapsed: !state.layout.sidebarCollapsed 
          } 
        })),
        setActiveTab: (tab) => set((state) => ({ 
          layout: { 
            ...state.layout, 
            activeTabs: [...state.layout.activeTabs.filter(t => t !== tab), tab] 
          } 
        })),
        setActivePanel: (panel) => set((state) => ({ 
          layout: { 
            ...state.layout, 
            activePanel: panel 
          } 
        })),
        
        // Test management actions
        addTestCase: (testCase) => set((state) => ({
          testCases: [...state.testCases, testCase]
        })),
        updateTestCase: (id, updates) => set((state) => ({
          testCases: state.testCases.map(tc => 
            tc.id === id ? { ...tc, ...updates, updatedAt: Date.now(), version: tc.version + 1 } : tc
          )
        })),
        deleteTestCase: (id) => set((state) => ({
          testCases: state.testCases.filter(tc => tc.id !== id),
          activeTestCase: state.activeTestCase?.id === id ? null : state.activeTestCase
        })),
        setActiveTestCase: (testCase) => set({ activeTestCase: testCase }),
        
        // Execution actions
        addExecution: (execution) => set((state) => ({
          executions: [...state.executions, execution]
        })),
        updateExecution: (id, updates) => set((state) => ({
          executions: state.executions.map(ex => 
            ex.id === id ? { ...ex, ...updates } : ex
          )
        })),
        setActiveExecution: (execution) => set({ activeExecution: execution }),
        
        // Recording actions
        startRecording: (url) => set((state) => ({
          recording: {
            ...state.recording,
            isRecording: true,
            isPaused: false,
            currentUrl: url,
            actions: [],
            startTime: Date.now(),
          }
        })),
        stopRecording: () => set((state) => ({
          recording: {
            ...state.recording,
            isRecording: false,
            isPaused: false,
          }
        })),
        pauseRecording: () => set((state) => ({
          recording: {
            ...state.recording,
            isPaused: true,
          }
        })),
        resumeRecording: () => set((state) => ({
          recording: {
            ...state.recording,
            isPaused: false,
          }
        })),
        
        // AI actions
        toggleAI: () => set((state) => ({ 
          aiEnabled: !state.aiEnabled 
        })),
        setAILoading: (loading) => set({ aiLoading: loading }),
      }),
      {
        name: 'autotest-app-store',
        partialize: (state) => ({
          theme: state.theme,
          liquidGlass: state.liquidGlass,
          layout: state.layout,
          accessibility: state.accessibility,
          testCases: state.testCases,
          executions: state.executions.slice(-100), // Keep only last 100 executions
          aiEnabled: state.aiEnabled,
        }),
      }
    ),
    {
      name: 'AutoTest Pro Store',
    }
  )
);