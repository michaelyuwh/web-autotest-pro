import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';
import { Dashboard } from './components/pages/Dashboard';
import { LoadingSpinner } from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load heavy components for better performance
const TestCases = lazy(() => import('./components/pages/TestCases').then(m => ({ default: m.TestCases })));
const Recording = lazy(() => import('./components/pages/Recording').then(m => ({ default: m.Recording })));
const Execution = lazy(() => import('./components/pages/Execution').then(m => ({ default: m.Execution })));
const Reports = lazy(() => import('./components/pages/Reports').then(m => ({ default: m.Reports })));
const Settings = lazy(() => import('./components/pages/Settings').then(m => ({ default: m.Settings })));
import { useAppStore } from './stores/app-store';
import { ToastContainer } from './components/ui/ToastContainer';
import { PiPManager } from './components/recording/PiPManager';
import PWAPrompt from './components/PWAPrompt';
import OfflineIndicator from './components/OfflineIndicator';

function App() {
  const { theme, layout } = useAppStore();
  const sidebarCollapsed = layout?.sidebarCollapsed ?? false;

  return (
    <ErrorBoundary>
      <div 
        className={`min-h-screen transition-all duration-300 ${theme === 'dark' ? 'dark' : ''}`}
        data-theme={theme}
      >
      <div className="flex h-screen bg-gradient-to-br from-blue-900 via-purple-800 to-indigo-900">
        {/* Sidebar */}
        <motion.aside
          initial={false}
          animate={{ width: sidebarCollapsed ? 80 : 280 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="glass-morphism m-4 mr-0 flex-shrink-0 overflow-hidden"
        >
          <Sidebar />
        </motion.aside>

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <header className="glass-morphism m-4 mb-0 h-16 flex-shrink-0">
            <Header />
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-auto p-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="h-full"
            >
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/test-cases" element={<TestCases />} />
                  <Route path="/recording" element={<Recording />} />
                  <Route path="/execution" element={<Execution />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </Suspense>
            </motion.div>
          </main>

          {/* Footer */}
          <footer className="glass-morphism m-4 mt-0 h-12 flex-shrink-0">
            <Footer />
          </footer>
        </div>
      </div>

      {/* Global Components */}
      <ToastContainer />
      <PiPManager />
      <PWAPrompt />
      <OfflineIndicator />
      </div>
    </ErrorBoundary>
  );
}

export default App;