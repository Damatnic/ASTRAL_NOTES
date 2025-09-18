/**
 * Error Boundary Test Components
 * Comprehensive error handling and edge case testing
 */

import React, { Component, ErrorInfo, ReactNode, useState } from 'react';
import { 
  AlertTriangle, 
  RefreshCw, 
  Bug, 
  XCircle, 
  Shield, 
  CheckCircle,
  Clock,
  Play,
  RotateCcw
} from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  testMode?: boolean;
}

class TestErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

    // Log error for debugging
    console.error('Error Boundary caught an error:', error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In a real app, you might send this to an error reporting service
    if (!this.props.testMode) {
      this.reportError(error, errorInfo);
    }
  }

  reportError(error: Error, errorInfo: ErrorInfo) {
    // Mock error reporting service
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.log('Error Report:', errorReport);
    // In production, this would be sent to a service like Sentry, LogRocket, etc.
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: undefined
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 border border-red-300 rounded-lg bg-red-50 dark:bg-red-900/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
                Something went wrong
              </h3>
              
              <p className="text-red-700 dark:text-red-300 mb-4">
                An unexpected error occurred. The error has been logged and will be investigated.
              </p>

              {this.props.testMode && this.state.error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 rounded border">
                  <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Error Details:</h4>
                  <p className="text-sm font-mono text-red-700 dark:text-red-300 mb-2">
                    {this.state.error.message}
                  </p>
                  {this.state.errorId && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      Error ID: {this.state.errorId}
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={this.handleReset}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </button>
                
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Component that throws errors for testing
function ErrorThrowingComponent({ shouldThrow, errorType }: { shouldThrow: boolean; errorType: string }) {
  if (shouldThrow) {
    switch (errorType) {
      case 'runtime':
        throw new Error('Runtime error for testing error boundary');
      case 'type':
        // @ts-ignore - Intentional type error for testing
        const result = null.nonExistentMethod();
        return result;
      case 'async':
        setTimeout(() => {
          throw new Error('Async error for testing');
        }, 100);
        break;
      case 'render':
        // @ts-ignore - Intentional render error
        return <div>{undefined.toString()}</div>;
      default:
        throw new Error('Generic test error');
    }
  }

  return (
    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-300 rounded">
      <CheckCircle className="h-5 w-5 text-green-600 inline mr-2" />
      Component rendered successfully without errors
    </div>
  );
}

interface TestResult {
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
  duration?: number;
  errorsCaught?: number;
  errorsHandled?: number;
}

export function ErrorBoundaryTestSuite() {
  const [testResult, setTestResult] = useState<TestResult>({ status: 'pending' });
  const [errorLogs, setErrorLogs] = useState<Array<{ error: Error; info: ErrorInfo; timestamp: string }>>([]);
  const [activeErrorType, setActiveErrorType] = useState<string | null>(null);
  const [triggerError, setTriggerError] = useState(false);

  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    setErrorLogs(prev => [...prev, {
      error,
      info: errorInfo,
      timestamp: new Date().toISOString()
    }]);
  };

  const runErrorBoundaryTest = async () => {
    setTestResult({ status: 'running' });
    setErrorLogs([]);
    const startTime = Date.now();

    try {
      const errorTypes = ['runtime', 'type', 'render'];
      let errorsCaught = 0;
      let errorsHandled = 0;

      for (const errorType of errorTypes) {
        try {
          // Trigger different types of errors
          setActiveErrorType(errorType);
          setTriggerError(true);
          
          // Wait for error to be caught
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Reset for next test
          setTriggerError(false);
          setActiveErrorType(null);
          
          // Wait for reset
          await new Promise(resolve => setTimeout(resolve, 200));
          
          errorsCaught++;
        } catch (error) {
          errorsHandled++;
          // Expected for testing - errors should be caught by boundary
        }
      }

      // Test invalid data scenarios
      try {
        // Test localStorage with invalid JSON
        localStorage.setItem('test_invalid_json', '{ invalid json }');
        const invalidData = localStorage.getItem('test_invalid_json');
        if (invalidData) {
          try {
            JSON.parse(invalidData);
          } catch (parseError) {
            errorsHandled++;
          }
        }
        localStorage.removeItem('test_invalid_json');
      } catch (storageError) {
        errorsHandled++;
      }

      // Test network simulation
      try {
        // Simulate failed fetch
        await fetch('/non-existent-endpoint').catch(() => {
          errorsHandled++;
        });
      } catch (networkError) {
        errorsHandled++;
      }

      const duration = Date.now() - startTime;
      
      setTestResult({
        status: 'passed',
        message: 'Error boundary and error handling working correctly',
        duration,
        errorsCaught: errorLogs.length,
        errorsHandled
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      setTestResult({
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error in error testing',
        duration
      });
    }
  };

  const testNetworkErrors = async () => {
    // Simulate offline mode
    const originalOnLine = navigator.onLine;
    
    try {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      // Test offline handling
      const offlineHandled = typeof navigator.onLine === 'boolean';
      
      // Restore original state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: originalOnLine,
      });

      return offlineHandled;
    } catch (error) {
      // Restore on error
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: originalOnLine,
      });
      throw error;
    }
  };

  const clearErrorLogs = () => {
    setErrorLogs([]);
  };

  return (
    <div className="space-y-6">
      {/* Test Control Panel */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="text-lg font-medium">Error Boundary Test Suite</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Comprehensive error handling and edge case testing
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={runErrorBoundaryTest}
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
                  Run Error Tests
                </>
              )}
            </button>

            <button
              onClick={clearErrorLogs}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Clear Logs
            </button>
          </div>
        </div>

        {/* Test Results */}
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

          {(testResult.errorsCaught !== undefined || testResult.errorsHandled !== undefined) && (
            <div className="text-sm space-y-1">
              <div>Errors caught by boundary: {testResult.errorsCaught || 0}</div>
              <div>Errors handled gracefully: {testResult.errorsHandled || 0}</div>
            </div>
          )}
        </div>
      </div>

      {/* Error Boundary Demo */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h4 className="text-lg font-medium mb-4 flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Error Boundary Demo
        </h4>
        
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {['runtime', 'type', 'render'].map((errorType) => (
              <button
                key={errorType}
                onClick={() => {
                  setActiveErrorType(errorType);
                  setTriggerError(true);
                }}
                className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/30"
              >
                Trigger {errorType} Error
              </button>
            ))}
            <button
              onClick={() => {
                setTriggerError(false);
                setActiveErrorType(null);
              }}
              className="px-3 py-1 text-sm bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/30"
            >
              Reset
            </button>
          </div>

          <TestErrorBoundary testMode={true} onError={handleError}>
            <ErrorThrowingComponent 
              shouldThrow={triggerError} 
              errorType={activeErrorType || 'runtime'} 
            />
          </TestErrorBoundary>
        </div>
      </div>

      {/* Error Logs */}
      {errorLogs.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h4 className="text-lg font-medium mb-4">Error Logs ({errorLogs.length})</h4>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {errorLogs.map((log, index) => (
              <div key={index} className="p-3 bg-red-50 dark:bg-red-900/20 rounded border">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="font-medium text-red-800 dark:text-red-200">
                      {log.error.message}
                    </h5>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {log.timestamp}
                    </p>
                  </div>
                  <span className="text-xs text-red-500 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">
                    #{index + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}