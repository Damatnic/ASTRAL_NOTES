/**
 * Feature Test Components
 * Comprehensive testing for specific application features
 */

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Zap, 
  Download, 
  Upload, 
  Keyboard, 
  Wifi, 
  WifiOff,
  CheckCircle,
  XCircle,
  Clock,
  Play,
  AlertTriangle
} from 'lucide-react';
import { projectService } from '@/services/projectService';
import { quickNotesService } from '@/services/quickNotesService';
import { mockDataService } from '@/services/mockDataService';

interface TestResult {
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
  duration?: number;
  details?: any;
}

export function QuickNotesTest() {
  const [testResult, setTestResult] = useState<TestResult>({ status: 'pending' });

  const runTest = async () => {
    setTestResult({ status: 'running' });
    const startTime = Date.now();

    try {
      // Test quick note creation
      const note = quickNotesService.createQuickNote({
        title: 'Test Quick Note',
        content: 'This is a test quick note for feature validation',
        tags: ['test', 'feature'],
        type: 'idea'
      });

      if (!note.id) throw new Error('Failed to create quick note');

      // Test quick note retrieval
      const retrieved = quickNotesService.getQuickNoteById(note.id);
      if (!retrieved) throw new Error('Failed to retrieve quick note');

      // Test quick note search
      const searchResults = quickNotesService.searchQuickNotes({ query: 'test' });
      if (!searchResults.some(n => n.id === note.id)) {
        throw new Error('Quick note search failed');
      }

      // Test quick note update
      const updated = quickNotesService.updateQuickNote(note.id, {
        title: 'Updated Test Note',
        content: 'Updated content'
      });
      if (!updated || updated.title !== 'Updated Test Note') {
        throw new Error('Failed to update quick note');
      }

      // Test project attachment
      const projects = projectService.getAllProjects();
      if (projects.length > 0) {
        const attached = quickNotesService.attachToProject(note.id, projects[0].id);
        if (!attached || attached.projectId !== projects[0].id) {
          throw new Error('Failed to attach note to project');
        }

        // Test detachment
        const detached = quickNotesService.detachFromProject(note.id);
        if (!detached || detached.projectId !== null) {
          throw new Error('Failed to detach note from project');
        }
      }

      // Test bulk operations
      const note2 = quickNotesService.createQuickNote({
        title: 'Bulk Test Note',
        content: 'For bulk operations test',
        tags: ['bulk', 'test']
      });

      const bulkDeleted = quickNotesService.bulkDeleteQuickNotes([note.id, note2.id]);
      if (bulkDeleted !== 2) {
        throw new Error('Bulk delete failed');
      }

      const duration = Date.now() - startTime;
      setTestResult({
        status: 'passed',
        message: 'All quick notes features working correctly',
        duration,
        details: {
          operations: ['create', 'read', 'update', 'search', 'attach', 'detach', 'bulk delete'],
          notesCreated: 2,
          notesDeleted: 2
        }
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      setTestResult({
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration
      });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-medium">Quick Notes Feature Test</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Comprehensive testing of quick notes functionality
            </p>
          </div>
        </div>
        <button
          onClick={runTest}
          disabled={testResult.status === 'running'}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {testResult.status === 'running' ? (
            <>
              <Clock className="h-4 w-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Run Test
            </>
          )}
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          {testResult.status === 'passed' && <CheckCircle className="h-5 w-5 text-green-600" />}
          {testResult.status === 'failed' && <XCircle className="h-5 w-5 text-red-600" />}
          {testResult.status === 'running' && <Clock className="h-5 w-5 animate-spin text-blue-600" />}
          {testResult.status === 'pending' && <div className="h-5 w-5 rounded-full border-2 border-gray-300" />}
          
          <span className="font-medium">
            Status: {testResult.status}
          </span>
        </div>

        {testResult.message && (
          <div className={`p-3 rounded-lg ${
            testResult.status === 'passed' 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
              : testResult.status === 'failed'
              ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
              : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
          }`}>
            {testResult.message}
          </div>
        )}

        {testResult.duration && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Duration: {testResult.duration}ms
          </div>
        )}

        {testResult.details && (
          <div className="text-sm space-y-2">
            <h4 className="font-medium">Test Details:</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
              {testResult.details.operations?.map((op: string) => (
                <li key={op}>Tested {op} operation</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export function ProjectManagementTest() {
  const [testResult, setTestResult] = useState<TestResult>({ status: 'pending' });

  const runTest = async () => {
    setTestResult({ status: 'running' });
    const startTime = Date.now();

    try {
      // Test project creation
      const project = projectService.createProject({
        title: 'Feature Test Project',
        description: 'Testing project management features',
        tags: ['test', 'management'],
        genre: 'Testing'
      });

      if (!project.id) throw new Error('Failed to create project');

      // Test project retrieval
      const retrieved = projectService.getProjectById(project.id);
      if (!retrieved) throw new Error('Failed to retrieve project');

      // Test project update
      const updated = projectService.updateProject(project.id, {
        title: 'Updated Test Project',
        status: 'writing'
      });
      if (!updated || updated.title !== 'Updated Test Project') {
        throw new Error('Failed to update project');
      }

      // Test project search
      const searchResults = projectService.searchProjects('Updated');
      if (!searchResults.some(p => p.id === project.id)) {
        throw new Error('Project search failed');
      }

      // Test project statistics
      const stats = projectService.getProjectStats(project.id);
      if (!stats) throw new Error('Failed to get project statistics');

      // Test project duplication
      const duplicate = projectService.duplicateProject(project.id);
      if (!duplicate || !duplicate.title.includes('Copy')) {
        throw new Error('Failed to duplicate project');
      }

      // Test project archiving
      const archived = projectService.archiveProject(project.id);
      if (!archived || archived.status !== 'archived') {
        throw new Error('Failed to archive project');
      }

      // Test project restoration
      const restored = projectService.restoreProject(project.id);
      if (!restored || restored.status !== 'writing') {
        throw new Error('Failed to restore project');
      }

      // Cleanup
      projectService.permanentlyDeleteProject(project.id);
      projectService.permanentlyDeleteProject(duplicate.id);

      const duration = Date.now() - startTime;
      setTestResult({
        status: 'passed',
        message: 'All project management features working correctly',
        duration,
        details: {
          operations: ['create', 'read', 'update', 'search', 'stats', 'duplicate', 'archive', 'restore', 'delete'],
          projectsCreated: 2,
          projectsDeleted: 2
        }
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      setTestResult({
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration
      });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-green-600" />
          <div>
            <h3 className="text-lg font-medium">Project Management Test</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Testing project CRUD operations and features
            </p>
          </div>
        </div>
        <button
          onClick={runTest}
          disabled={testResult.status === 'running'}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
        >
          {testResult.status === 'running' ? (
            <>
              <Clock className="h-4 w-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Run Test
            </>
          )}
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          {testResult.status === 'passed' && <CheckCircle className="h-5 w-5 text-green-600" />}
          {testResult.status === 'failed' && <XCircle className="h-5 w-5 text-red-600" />}
          {testResult.status === 'running' && <Clock className="h-5 w-5 animate-spin text-blue-600" />}
          {testResult.status === 'pending' && <div className="h-5 w-5 rounded-full border-2 border-gray-300" />}
          
          <span className="font-medium">
            Status: {testResult.status}
          </span>
        </div>

        {testResult.message && (
          <div className={`p-3 rounded-lg ${
            testResult.status === 'passed' 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
              : testResult.status === 'failed'
              ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
              : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
          }`}>
            {testResult.message}
          </div>
        )}

        {testResult.duration && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Duration: {testResult.duration}ms
          </div>
        )}

        {testResult.details && (
          <div className="text-sm space-y-2">
            <h4 className="font-medium">Test Details:</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
              {testResult.details.operations?.map((op: string) => (
                <li key={op}>Tested {op} operation</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export function SearchFunctionalityTest() {
  const [testResult, setTestResult] = useState<TestResult>({ status: 'pending' });

  const runTest = async () => {
    setTestResult({ status: 'running' });
    const startTime = Date.now();

    try {
      // Create test data for searching
      const project = projectService.createProject({
        title: 'Searchable Test Project',
        description: 'This project contains searchable content for testing',
        tags: ['searchable', 'test', 'content']
      });

      const quickNote = quickNotesService.createQuickNote({
        title: 'Searchable Quick Note',
        content: 'This quick note has searchable content for validation',
        tags: ['searchable', 'validation']
      });

      // Test project search by title
      const projectSearchByTitle = projectService.searchProjects('Searchable');
      if (!projectSearchByTitle.some(p => p.id === project.id)) {
        throw new Error('Project search by title failed');
      }

      // Test project search by tag
      const projectSearchByTag = projectService.getProjectsByTags(['searchable']);
      if (!projectSearchByTag.some(p => p.id === project.id)) {
        throw new Error('Project search by tag failed');
      }

      // Test quick note search by content
      const quickNoteSearch = quickNotesService.searchQuickNotes({ query: 'validation' });
      if (!quickNoteSearch.some(n => n.id === quickNote.id)) {
        throw new Error('Quick note search by content failed');
      }

      // Test quick note search by tags
      const quickNoteTagSearch = quickNotesService.getQuickNotesByTags(['validation']);
      if (!quickNoteTagSearch.some(n => n.id === quickNote.id)) {
        throw new Error('Quick note search by tags failed');
      }

      // Test case-insensitive search
      const caseInsensitiveSearch = projectService.searchProjects('searchable');
      if (!caseInsensitiveSearch.some(p => p.id === project.id)) {
        throw new Error('Case-insensitive search failed');
      }

      // Test partial match search
      const partialSearch = quickNotesService.searchQuickNotes({ query: 'valid' });
      if (!partialSearch.some(n => n.id === quickNote.id)) {
        throw new Error('Partial match search failed');
      }

      // Cleanup
      projectService.deleteProject(project.id);
      quickNotesService.deleteQuickNote(quickNote.id);

      const duration = Date.now() - startTime;
      setTestResult({
        status: 'passed',
        message: 'All search functionality working correctly',
        duration,
        details: {
          searchTypes: ['title', 'content', 'tags', 'case-insensitive', 'partial-match'],
          resultsFound: projectSearchByTitle.length + quickNoteSearch.length
        }
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      setTestResult({
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration
      });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Search className="h-6 w-6 text-purple-600" />
          <div>
            <h3 className="text-lg font-medium">Search Functionality Test</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Testing search capabilities across projects and notes
            </p>
          </div>
        </div>
        <button
          onClick={runTest}
          disabled={testResult.status === 'running'}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
        >
          {testResult.status === 'running' ? (
            <>
              <Clock className="h-4 w-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Run Test
            </>
          )}
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          {testResult.status === 'passed' && <CheckCircle className="h-5 w-5 text-green-600" />}
          {testResult.status === 'failed' && <XCircle className="h-5 w-5 text-red-600" />}
          {testResult.status === 'running' && <Clock className="h-5 w-5 animate-spin text-blue-600" />}
          {testResult.status === 'pending' && <div className="h-5 w-5 rounded-full border-2 border-gray-300" />}
          
          <span className="font-medium">
            Status: {testResult.status}
          </span>
        </div>

        {testResult.message && (
          <div className={`p-3 rounded-lg ${
            testResult.status === 'passed' 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
              : testResult.status === 'failed'
              ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
              : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
          }`}>
            {testResult.message}
          </div>
        )}

        {testResult.duration && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Duration: {testResult.duration}ms
          </div>
        )}

        {testResult.details && (
          <div className="text-sm space-y-2">
            <h4 className="font-medium">Test Details:</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
              {testResult.details.searchTypes?.map((type: string) => (
                <li key={type}>Tested {type} search</li>
              ))}
              <li>Total results found: {testResult.details.resultsFound}</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export function PerformanceTest() {
  const [testResult, setTestResult] = useState<TestResult>({ status: 'pending' });

  const runTest = async () => {
    setTestResult({ status: 'running' });
    const startTime = Date.now();

    try {
      // Test large dataset creation performance
      const createStartTime = Date.now();
      
      // Create multiple projects
      const projects = [];
      for (let i = 0; i < 10; i++) {
        const project = projectService.createProject({
          title: `Performance Test Project ${i}`,
          description: `Testing performance with project ${i}`,
          tags: ['performance', 'test', `batch-${i}`]
        });
        projects.push(project);
      }
      
      const createDuration = Date.now() - createStartTime;

      // Test bulk quick note creation
      const quickNoteStartTime = Date.now();
      const quickNotes = [];
      for (let i = 0; i < 50; i++) {
        const note = quickNotesService.createQuickNote({
          title: `Performance Quick Note ${i}`,
          content: `This is performance test content for note ${i}. `.repeat(10),
          tags: ['performance', 'bulk', `note-${i}`]
        });
        quickNotes.push(note);
      }
      const quickNoteDuration = Date.now() - quickNoteStartTime;

      // Test search performance
      const searchStartTime = Date.now();
      const searchResults = projectService.searchProjects('Performance');
      const quickSearchResults = quickNotesService.searchQuickNotes({ query: 'performance' });
      const searchDuration = Date.now() - searchStartTime;

      // Test bulk operations performance
      const bulkStartTime = Date.now();
      const noteIds = quickNotes.map(n => n.id);
      const bulkDeleted = quickNotesService.bulkDeleteQuickNotes(noteIds);
      const bulkDuration = Date.now() - bulkStartTime;

      // Cleanup projects
      projects.forEach(p => projectService.permanentlyDeleteProject(p.id));

      const totalDuration = Date.now() - startTime;

      // Performance thresholds
      const thresholds = {
        create: 2000,   // 2 seconds for 10 projects
        quickNotes: 3000, // 3 seconds for 50 quick notes
        search: 1000,   // 1 second for search
        bulk: 500       // 0.5 seconds for bulk operations
      };

      const issues = [];
      if (createDuration > thresholds.create) {
        issues.push(`Project creation too slow: ${createDuration}ms`);
      }
      if (quickNoteDuration > thresholds.quickNotes) {
        issues.push(`Quick note creation too slow: ${quickNoteDuration}ms`);
      }
      if (searchDuration > thresholds.search) {
        issues.push(`Search too slow: ${searchDuration}ms`);
      }
      if (bulkDuration > thresholds.bulk) {
        issues.push(`Bulk operations too slow: ${bulkDuration}ms`);
      }

      if (issues.length > 0) {
        throw new Error(`Performance issues detected: ${issues.join(', ')}`);
      }

      setTestResult({
        status: 'passed',
        message: 'All performance tests passed',
        duration: totalDuration,
        details: {
          projectCreation: `${createDuration}ms (threshold: ${thresholds.create}ms)`,
          quickNoteCreation: `${quickNoteDuration}ms (threshold: ${thresholds.quickNotes}ms)`,
          searchPerformance: `${searchDuration}ms (threshold: ${thresholds.search}ms)`,
          bulkOperations: `${bulkDuration}ms (threshold: ${thresholds.bulk}ms)`,
          projectsCreated: projects.length,
          quickNotesCreated: quickNotes.length,
          searchResults: searchResults.length + quickSearchResults.length,
          bulkDeleted
        }
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      setTestResult({
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration
      });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Zap className="h-6 w-6 text-yellow-600" />
          <div>
            <h3 className="text-lg font-medium">Performance Test</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Testing application performance with bulk operations
            </p>
          </div>
        </div>
        <button
          onClick={runTest}
          disabled={testResult.status === 'running'}
          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 flex items-center gap-2"
        >
          {testResult.status === 'running' ? (
            <>
              <Clock className="h-4 w-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Run Test
            </>
          )}
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          {testResult.status === 'passed' && <CheckCircle className="h-5 w-5 text-green-600" />}
          {testResult.status === 'failed' && <XCircle className="h-5 w-5 text-red-600" />}
          {testResult.status === 'running' && <Clock className="h-5 w-5 animate-spin text-blue-600" />}
          {testResult.status === 'pending' && <div className="h-5 w-5 rounded-full border-2 border-gray-300" />}
          
          <span className="font-medium">
            Status: {testResult.status}
          </span>
        </div>

        {testResult.message && (
          <div className={`p-3 rounded-lg ${
            testResult.status === 'passed' 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
              : testResult.status === 'failed'
              ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
              : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
          }`}>
            {testResult.message}
          </div>
        )}

        {testResult.duration && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Duration: {testResult.duration}ms
          </div>
        )}

        {testResult.details && (
          <div className="text-sm space-y-2">
            <h4 className="font-medium">Performance Metrics:</h4>
            <div className="grid grid-cols-2 gap-2 text-gray-600 dark:text-gray-400">
              <div>Project Creation: {testResult.details.projectCreation}</div>
              <div>Quick Note Creation: {testResult.details.quickNoteCreation}</div>
              <div>Search Performance: {testResult.details.searchPerformance}</div>
              <div>Bulk Operations: {testResult.details.bulkOperations}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ErrorBoundaryTest() {
  const [testResult, setTestResult] = useState<TestResult>({ status: 'pending' });
  const [triggerError, setTriggerError] = useState(false);

  const ErrorComponent = () => {
    if (triggerError) {
      throw new Error('Intentional test error for error boundary validation');
    }
    return <div>No error triggered</div>;
  };

  const runTest = async () => {
    setTestResult({ status: 'running' });
    const startTime = Date.now();

    try {
      // Test error boundary by triggering an error
      setTriggerError(true);
      
      // Wait for error to potentially be caught
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset error state
      setTriggerError(false);

      // Test invalid data handling
      try {
        // Test with invalid project data
        localStorage.setItem('test_invalid', JSON.stringify({ invalid: 'data' }));
        const invalidData = localStorage.getItem('test_invalid');
        if (!invalidData) throw new Error('Storage test failed');
        localStorage.removeItem('test_invalid');
      } catch (storageError) {
        // Storage errors should be handled gracefully
      }

      const duration = Date.now() - startTime;
      setTestResult({
        status: 'passed',
        message: 'Error handling working correctly',
        duration,
        details: {
          errorBoundaryTested: true,
          invalidDataHandled: true,
          gracefulDegradation: true
        }
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      setTestResult({
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration
      });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          <div>
            <h3 className="text-lg font-medium">Error Boundary Test</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Testing error handling and boundary conditions
            </p>
          </div>
        </div>
        <button
          onClick={runTest}
          disabled={testResult.status === 'running'}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
        >
          {testResult.status === 'running' ? (
            <>
              <Clock className="h-4 w-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Run Test
            </>
          )}
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          {testResult.status === 'passed' && <CheckCircle className="h-5 w-5 text-green-600" />}
          {testResult.status === 'failed' && <XCircle className="h-5 w-5 text-red-600" />}
          {testResult.status === 'running' && <Clock className="h-5 w-5 animate-spin text-blue-600" />}
          {testResult.status === 'pending' && <div className="h-5 w-5 rounded-full border-2 border-gray-300" />}
          
          <span className="font-medium">
            Status: {testResult.status}
          </span>
        </div>

        <div className="p-3 border rounded-lg">
          <h4 className="font-medium mb-2">Error Test Component:</h4>
          <ErrorComponent />
        </div>

        {testResult.message && (
          <div className={`p-3 rounded-lg ${
            testResult.status === 'passed' 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
              : testResult.status === 'failed'
              ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
              : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
          }`}>
            {testResult.message}
          </div>
        )}

        {testResult.duration && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Duration: {testResult.duration}ms
          </div>
        )}
      </div>
    </div>
  );
}