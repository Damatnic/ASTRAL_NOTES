/**
 * Main Application Component
 */

import React, { Suspense, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ToastProvider } from '@/components/ui/Toast';
import { OfflineIndicator } from '@/components/offline/OfflineIndicator';
import { CreateNoteModal } from '@/components/quick-notes';
import { OnboardingManager } from '@/components/onboarding/OnboardingManager';
import { HelpSystem } from '@/components/onboarding/HelpSystem';
import { CommandPalette, useCommandPalette } from '@/components/ui/CommandPalette';
import { ShortcutsHelp, useShortcutsHelpModal } from '@/components/ui/ShortcutsHelp';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useGlobalShortcuts } from '@/hooks/useGlobalShortcuts';
import { quickNotesService } from '@/services/quickNotesService';
import { projectService } from '@/services/projectService';
import { Loader2 } from 'lucide-react';

// Lazy load pages for better performance
const Dashboard = React.lazy(() => import('@/pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Projects = React.lazy(() => import('@/pages/Projects').then(m => ({ default: m.Projects })));
const ProjectDashboard = React.lazy(() => import('@/pages/ProjectDashboard').then(m => ({ default: m.ProjectDashboard })));
const ProjectEditor = React.lazy(() => import('@/pages/ProjectEditor').then(m => ({ default: m.ProjectEditor })));
const NoteEditor = React.lazy(() => import('@/pages/NoteEditor').then(m => ({ default: m.NoteEditor })));
const StoryEditor = React.lazy(() => import('@/pages/StoryEditor').then(m => ({ default: m.StoryEditor })));
const StandaloneNoteEditor = React.lazy(() => import('@/pages/StandaloneNoteEditor').then(m => ({ default: m.StandaloneNoteEditor })));
const QuickNotes = React.lazy(() => import('@/pages/QuickNotes').then(m => ({ default: m.QuickNotes })));
const AIWriting = React.lazy(() => import('@/pages/AIWriting').then(m => ({ default: m.AIWriting })));
const Search = React.lazy(() => import('@/pages/Search').then(m => ({ default: m.Search })));
const Settings = React.lazy(() => import('@/pages/Settings').then(m => ({ default: m.Settings })));
const Professional = React.lazy(() => import('@/pages/Professional').then(m => ({ default: m.Professional })));
const CharacterProfiles = React.lazy(() => import('@/pages/CharacterProfiles').then(m => ({ default: m.CharacterProfiles })));
const WorldBuilding = React.lazy(() => import('@/pages/WorldBuilding').then(m => ({ default: m.WorldBuilding })));
const PlotBoard = React.lazy(() => import('@/pages/PlotBoard').then(m => ({ default: m.PlotBoard })));
const ResearchCenter = React.lazy(() => import('@/pages/ResearchCenter').then(m => ({ default: m.ResearchCenter })));
const WritingAnalytics = React.lazy(() => import('@/pages/WritingAnalytics').then(m => ({ default: m.WritingAnalytics })));
const Profile = React.lazy(() => import('@/pages/Profile').then(m => ({ default: m.Profile })));
const Collaboration = React.lazy(() => import('@/pages/Collaboration').then(m => ({ default: m.Collaboration })));
const Templates = React.lazy(() => import('@/pages/Templates').then(m => ({ default: m.Templates })));
const Export = React.lazy(() => import('@/pages/Export').then(m => ({ default: m.Export })));
const NotFound = React.lazy(() => import('@/pages/NotFound').then(m => ({ default: m.NotFound })));

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

export function AppContent() {
  const [showGlobalQuickNote, setShowGlobalQuickNote] = useState(false);
  const [showHelpSystem, setShowHelpSystem] = useState(false);
  const commandPalette = useCommandPalette();
  const shortcutsHelp = useShortcutsHelpModal();
  
  // Set up global keyboard shortcuts
  useKeyboardShortcuts({
    onQuickNote: () => setShowGlobalQuickNote(true),
    onHelp: () => setShowHelpSystem(true),
  });

  // Set up enhanced global shortcuts
  useGlobalShortcuts({
    onQuickNote: () => setShowGlobalQuickNote(true),
    onCommandPalette: commandPalette.open,
    onHelp: shortcutsHelp.open,
    onNewProject: () => {
      // Navigate to projects and trigger new project modal
      window.location.href = '/projects?new=true';
    },
  });

  const handleCreateGlobalNote = async (data: { title: string; content: string; tags?: string[]; projectId?: string }) => {
    try {
      await quickNotesService.createQuickNote(data);
      setShowGlobalQuickNote(false);
      // Could show a success toast here
    } catch (error) {
      console.error('Error creating quick note:', error);
    }
  };

  const availableProjects = (projectService.getAllProjects?.() || []).map((p: { id: string; title: string }) => ({ id: p.id, title: p.title }));
  const availableTags = quickNotesService.getAllTags?.() || [];

  return (
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
            <Route path="projects/:id/edit" element={<ProjectEditor />} />
            <Route path="projects/:projectId/notes/new" element={<NoteEditor />} />
            <Route path="projects/:projectId/notes/:noteId" element={<NoteEditor />} />
            <Route path="projects/:projectId/stories/:storyId/edit" element={<StoryEditor />} />
            <Route path="projects/:id/stories/:storyId" element={<StoryEditor />} />
            <Route path="projects/:id/characters" element={<CharacterProfiles />} />
            <Route path="projects/:id/characters/:characterId" element={<CharacterProfiles />} />
            <Route path="projects/:id/world" element={<WorldBuilding />} />
            <Route path="projects/:id/plotboard" element={<PlotBoard />} />
            <Route path="projects/:id/research" element={<ResearchCenter />} />
            <Route path="notes/:id/edit" element={<StandaloneNoteEditor />} />
            <Route path="quick-notes" element={<QuickNotes />} />
            <Route path="ai-writing" element={<AIWriting />} />
            <Route path="search" element={<Search />} />
            <Route path="settings" element={<Settings />} />
            <Route path="professional" element={<Professional />} />
            <Route path="analytics" element={<WritingAnalytics />} />
            <Route path="profile" element={<Profile />} />
            <Route path="collaboration" element={<Collaboration />} />
            <Route path="templates" element={<Templates />} />
            <Route path="export" element={<Export />} />
            
            {/* Catch-all route for 404 */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>

      {/* Global Quick Note Modal */}
      <CreateNoteModal
        isOpen={showGlobalQuickNote}
        onClose={() => setShowGlobalQuickNote(false)}
        onSubmit={handleCreateGlobalNote}
        availableProjects={availableProjects}
        availableTags={availableTags}
      />

      {/* Onboarding System */}
      <OnboardingManager
        autoStart={true}
        showLauncher={true}
      />

      {/* Help System */}
      <HelpSystem
        isOpen={showHelpSystem}
        onClose={() => setShowHelpSystem(false)}
      />

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPalette.isOpen}
        onClose={commandPalette.close}
      />

      {/* Shortcuts Help Modal */}
      <ShortcutsHelp
        isOpen={shortcutsHelp.isOpen}
        onClose={shortcutsHelp.close}
      />
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
          <AppContent />
        </Router>
      </ToastProvider>
    </ErrorBoundary>
  );
}
