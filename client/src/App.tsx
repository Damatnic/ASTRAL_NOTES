/**
 * Main Application Component
 */

import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ToastProvider } from '@/components/ui/Toast';
import { OfflineIndicator } from '@/components/offline/OfflineIndicator';
import { Loader2 } from 'lucide-react';

// Lazy load pages for better performance
const Dashboard = React.lazy(() => import('@/pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Projects = React.lazy(() => import('@/pages/Projects').then(m => ({ default: m.Projects })));
const ProjectDashboard = React.lazy(() => import('@/pages/ProjectDashboard').then(m => ({ default: m.ProjectDashboard })));
const NoteEditor = React.lazy(() => import('@/pages/NoteEditor').then(m => ({ default: m.NoteEditor })));
const Search = React.lazy(() => import('@/pages/Search').then(m => ({ default: m.Search })));
const Settings = React.lazy(() => import('@/pages/Settings').then(m => ({ default: m.Settings })));

// Loading component
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span>Loading...</span>
      </div>
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <div className="min-h-screen bg-background text-foreground">
            <OfflineIndicator />
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {/* Direct access routes - no authentication needed */}
                <Route path="/" element={<Layout />}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="projects" element={<Projects />} />
                  <Route path="projects/:id" element={<ProjectDashboard />} />
                  <Route path="projects/:projectId/notes/new" element={<NoteEditor />} />
                  <Route path="projects/:projectId/notes/:noteId" element={<NoteEditor />} />
                  <Route path="search" element={<Search />} />
                  <Route path="settings" element={<Settings />} />
                  
                  {/* Catch-all route for 404 */}
                  <Route
                    path="*"
                    element={
                      <div className="flex items-center justify-center min-h-96">
                        <div className="text-center">
                          <h1 className="text-4xl font-bold text-muted-foreground mb-2">404</h1>
                          <p className="text-muted-foreground">Page not found</p>
                        </div>
                      </div>
                    }
                  />
                </Route>
              </Routes>
            </Suspense>
          </div>
        </Router>
      </ToastProvider>
    </ErrorBoundary>
  );
}