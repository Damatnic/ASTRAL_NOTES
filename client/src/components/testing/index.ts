/**
 * Testing Components Index
 * Exports all testing components for easy importing
 */

export { RouteValidator } from './RouteValidator';
export { 
  QuickNotesTest,
  ProjectManagementTest,
  SearchFunctionalityTest,
  PerformanceTest,
  ErrorBoundaryTest
} from './FeatureTests';
export { ErrorBoundaryTestSuite } from './ErrorBoundaryTest';

// Re-export types for convenience
export type {
  TestResult,
  TestCase,
  TestSuite
} from '../types';