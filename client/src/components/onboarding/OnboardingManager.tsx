import React, { useState, useEffect } from 'react';
import { onboardingService, OnboardingFlow, OnboardingStep, UserProgress } from '../../services/onboardingService';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Progress } from '../ui/Progress';
import { Badge } from '../ui/Badge';

interface OnboardingManagerProps {
  autoStart?: boolean;
  showLauncher?: boolean;
  className?: string;
}

export function OnboardingManager({ autoStart = true, showLauncher = true, className }: OnboardingManagerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [availableFlows, setAvailableFlows] = useState<OnboardingFlow[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [selectedFlow, setSelectedFlow] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<OnboardingStep | null>(null);

  useEffect(() => {
    const updateProgress = () => {
      setUserProgress(onboardingService.getUserProgress());
      setAvailableFlows(onboardingService.getAvailableFlows());
      setCurrentStep(onboardingService.getCurrentStep());
    };

    updateProgress();

    const handleFlowStarted = () => updateProgress();
    const handleFlowCompleted = () => updateProgress();
    const handleStepCompleted = () => updateProgress();
    const handleFlowSuggested = () => updateProgress();

    onboardingService.on('flowStarted', handleFlowStarted);
    onboardingService.on('flowCompleted', handleFlowCompleted);
    onboardingService.on('stepCompleted', handleStepCompleted);
    onboardingService.on('flowSuggested', handleFlowSuggested);

    // Auto-start for new users
    if (autoStart && userProgress && userProgress.completedFlows.length === 0) {
      setIsVisible(true);
    }

    return () => {
      onboardingService.off('flowStarted', handleFlowStarted);
      onboardingService.off('flowCompleted', handleFlowCompleted);
      onboardingService.off('stepCompleted', handleStepCompleted);
      onboardingService.off('flowSuggested', handleFlowSuggested);
    };
  }, [autoStart]);

  const startFlow = (flowId: string) => {
    if (onboardingService.startFlow(flowId)) {
      setIsVisible(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'basic': return '📚';
      case 'ai': return '🤖';
      case 'professional': return '💼';
      case 'collaboration': return '👥';
      case 'advanced': return '🚀';
      default: return '📖';
    }
  };

  if (!userProgress) return null;

  return (
    <>
      {/* Onboarding Launcher Button */}
      {showLauncher && !onboardingService.isFlowActive() && (
        <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
          <Button
            onClick={() => setIsVisible(true)}
            className="rounded-full h-14 w-14 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg"
            title="Open Learning Center"
          >
            🎓
          </Button>
        </div>
      )}

      {/* Onboarding Flow Selector Modal */}
      <Modal
        isOpen={isVisible}
        onClose={() => setIsVisible(false)}
        title="Learning Center"
        className="max-w-4xl"
      >
        <div className="space-y-6">
          {/* Progress Overview */}
          <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Learning Progress</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-violet-600">{userProgress.completedFlows.length}</div>
                <div className="text-sm text-gray-600">Flows Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">{userProgress.completedSteps.length}</div>
                <div className="text-sm text-gray-600">Steps Mastered</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(userProgress.analytics.totalTimeSpent / 60)}m
                </div>
                <div className="text-sm text-gray-600">Time Invested</div>
              </div>
            </div>
          </div>

          {/* Available Learning Flows */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Learning Flows</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableFlows.map((flow) => {
                const progress = onboardingService.getFlowProgress(flow.id);
                const isCompleted = userProgress.completedFlows.includes(flow.id);

                return (
                  <div
                    key={flow.id}
                    className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                      isCompleted ? 'border-green-200 bg-green-50' : 'border-gray-200 hover:border-violet-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{getCategoryIcon(flow.category)}</span>
                        <div>
                          <h4 className="font-medium text-gray-900">{flow.name}</h4>
                          <Badge className={getDifficultyColor(flow.difficulty)}>
                            {flow.difficulty}
                          </Badge>
                        </div>
                      </div>
                      {isCompleted && <span className="text-green-600 text-xl">✓</span>}
                    </div>

                    <p className="text-sm text-gray-600 mb-3">{flow.description}</p>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{flow.steps.length} steps</span>
                        <span>{flow.estimatedTime} minutes</span>
                      </div>
                      {progress > 0 && (
                        <Progress value={progress} className="h-2" />
                      )}
                    </div>

                    <Button
                      onClick={() => startFlow(flow.id)}
                      disabled={isCompleted}
                      variant={isCompleted ? 'outline' : 'default'}
                      className="w-full"
                    >
                      {isCompleted ? 'Completed' : progress > 0 ? 'Continue' : 'Start Learning'}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">💡 Pro Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Start with the basics before moving to advanced features</li>
              <li>• You can skip optional steps, but we recommend completing them all</li>
              <li>• Use the help button anytime you need assistance</li>
              <li>• Your progress is automatically saved</li>
            </ul>
          </div>

          {/* Settings */}
          <div className="border-t pt-4">
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 flex items-center">
                <span className="mr-2">⚙️</span>
                Onboarding Settings
                <span className="ml-auto transition-transform group-open:rotate-180">▼</span>
              </summary>
              <div className="mt-3 space-y-3 pl-6">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={userProgress.preferences.showTips}
                    onChange={(e) => onboardingService.updatePreferences({ showTips: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Show helpful tips throughout the app</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={userProgress.preferences.autoAdvance}
                    onChange={(e) => onboardingService.updatePreferences({ autoAdvance: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Auto-advance through steps</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={userProgress.preferences.skipAnimations}
                    onChange={(e) => onboardingService.updatePreferences({ skipAnimations: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Skip animations for faster navigation</span>
                </label>
              </div>
            </details>
          </div>
        </div>
      </Modal>

      {/* Onboarding Styles */}
      <style>{`
        .onboarding-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .onboarding-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(2px);
        }

        .onboarding-modal {
          position: relative;
          background: white;
          border-radius: 12px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          max-width: 500px;
          width: 90vw;
          max-height: 80vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .onboarding-modal[data-position="top"] {
          align-self: flex-start;
          margin-top: 2rem;
        }

        .onboarding-modal[data-position="bottom"] {
          align-self: flex-end;
          margin-bottom: 2rem;
        }

        .onboarding-header {
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .onboarding-header h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
        }

        .onboarding-progress {
          display: flex;
          align-items: center;
          space-x: 0.5rem;
        }

        .progress-bar {
          width: 100px;
          height: 4px;
          background: #e5e7eb;
          border-radius: 2px;
          overflow: hidden;
          margin-left: 0.5rem;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(to right, #8b5cf6, #6366f1);
          transition: width 0.3s ease;
        }

        .onboarding-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6b7280;
          padding: 0;
          width: 2rem;
          height: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.5rem;
        }

        .onboarding-close:hover {
          background: #f3f4f6;
          color: #1f2937;
        }

        .onboarding-content {
          padding: 1.5rem;
          flex: 1;
          overflow-y: auto;
        }

        .onboarding-content p {
          margin: 0 0 1rem 0;
          color: #4b5563;
          line-height: 1.6;
        }

        .onboarding-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
        }

        .onboarding-btn {
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .onboarding-btn.primary {
          background: linear-gradient(to right, #8b5cf6, #6366f1);
          color: white;
          border: none;
        }

        .onboarding-btn.primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        }

        .onboarding-btn.secondary {
          background: white;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .onboarding-btn.secondary:hover {
          background: #f9fafb;
        }

        .onboarding-btn.tertiary {
          background: transparent;
          color: #6b7280;
          border: none;
        }

        .onboarding-btn.tertiary:hover {
          color: #374151;
        }

        .onboarding-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .onboarding-highlight {
          outline: 3px solid #8b5cf6;
          outline-offset: 3px;
          border-radius: 0.375rem;
          animation: pulse-highlight 2s infinite;
        }

        @keyframes pulse-highlight {
          0%, 100% {
            outline-color: #8b5cf6;
          }
          50% {
            outline-color: #a78bfa;
          }
        }
      `}</style>
    </>
  );
}

export default OnboardingManager;