import React from 'react';
import { OnboardingStep } from '../../services/onboardingService';
import { Button } from '../ui/Button';

interface OnboardingTourStepProps {
  step: OnboardingStep;
  isActive: boolean;
  totalSteps: number;
  currentStepIndex: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onComplete: () => void;
  onExit: () => void;
}

export function OnboardingTourStep({
  step,
  isActive,
  totalSteps,
  currentStepIndex,
  onNext,
  onPrevious,
  onSkip,
  onComplete,
  onExit,
}: OnboardingTourStepProps) {
  if (!isActive) return null;

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;
  const progressPercentage = ((currentStepIndex + 1) / totalSteps) * 100;

  return (
    <div className="onboarding-tour-overlay">
      <div className="onboarding-backdrop" onClick={onExit} />
      
      <div 
        className={`onboarding-step-modal ${step.position || 'center'}`}
        style={getModalPosition(step)}
      >
        {/* Header */}
        <div className="onboarding-step-header">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
            <button
              onClick={onExit}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              aria-label="Close tour"
            >
              ×
            </button>
          </div>
          
          {/* Progress indicator */}
          <div className="flex items-center space-x-3 mt-3">
            <span className="text-sm text-gray-600">
              {currentStepIndex + 1} of {totalSteps}
            </span>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-violet-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="onboarding-step-content">
          <p className="text-gray-700 leading-relaxed">{step.description}</p>
          
          {/* Render step-specific component */}
          {step.component && (
            <div className="mt-4">
              <StepComponent componentName={step.component} metadata={step.metadata} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="onboarding-step-footer">
          <div className="flex justify-between items-center">
            <Button
              onClick={onPrevious}
              disabled={isFirstStep}
              variant="outline"
              className="text-sm"
            >
              Previous
            </Button>

            <div className="flex space-x-2">
              {step.skippable && (
                <Button
                  onClick={onSkip}
                  variant="ghost"
                  className="text-sm text-gray-600"
                >
                  Skip
                </Button>
              )}
              
              <Button
                onClick={isLastStep ? onComplete : onNext}
                className="text-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
              >
                {isLastStep ? 'Complete Tour' : 'Next'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Step-specific styles */}
      <style jsx>{`
        .onboarding-tour-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 10000;
          pointer-events: auto;
        }

        .onboarding-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(2px);
        }

        .onboarding-step-modal {
          position: absolute;
          background: white;
          border-radius: 12px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          max-width: 400px;
          width: 90vw;
          max-height: 80vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .onboarding-step-modal.center {
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        .onboarding-step-modal.top {
          top: 2rem;
          left: 50%;
          transform: translateX(-50%);
        }

        .onboarding-step-modal.bottom {
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
        }

        .onboarding-step-modal.left {
          top: 50%;
          left: 2rem;
          transform: translateY(-50%);
        }

        .onboarding-step-modal.right {
          top: 50%;
          right: 2rem;
          transform: translateY(-50%);
        }

        .onboarding-step-header {
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .onboarding-step-content {
          padding: 1.5rem;
          flex: 1;
          overflow-y: auto;
        }

        .onboarding-step-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid #e5e7eb;
          background: #f9fafb;
        }
      `}</style>
    </div>
  );
}

function getModalPosition(step: OnboardingStep): React.CSSProperties {
  if (!step.targetElement) return {};

  const target = document.querySelector(step.targetElement);
  if (!target) return {};

  const rect = target.getBoundingClientRect();
  const modalWidth = 400;
  const modalHeight = 300; // Approximate
  const margin = 20;

  switch (step.position) {
    case 'top':
      return {
        top: Math.max(margin, rect.top - modalHeight - margin),
        left: Math.max(margin, rect.left + rect.width / 2 - modalWidth / 2),
        transform: 'none',
      };
    case 'bottom':
      return {
        top: Math.min(window.innerHeight - modalHeight - margin, rect.bottom + margin),
        left: Math.max(margin, rect.left + rect.width / 2 - modalWidth / 2),
        transform: 'none',
      };
    case 'left':
      return {
        top: Math.max(margin, rect.top + rect.height / 2 - modalHeight / 2),
        left: Math.max(margin, rect.left - modalWidth - margin),
        transform: 'none',
      };
    case 'right':
      return {
        top: Math.max(margin, rect.top + rect.height / 2 - modalHeight / 2),
        left: Math.min(window.innerWidth - modalWidth - margin, rect.right + margin),
        transform: 'none',
      };
    default:
      return {};
  }
}

interface StepComponentProps {
  componentName: string;
  metadata?: Record<string, any>;
}

function StepComponent({ componentName, metadata }: StepComponentProps) {
  switch (componentName) {
    case 'WelcomeStep':
      return (
        <div className="text-center space-y-4">
          <div className="text-6xl">🚀</div>
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Welcome to ASTRAL_NOTES!</h4>
            <p className="text-sm text-gray-600">
              Your journey to better writing starts here. Let's explore the features that will
              transform your creative process.
            </p>
          </div>
        </div>
      );

    case 'DashboardTour':
      return (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">📊</span>
            <h4 className="font-medium">Your Writing Dashboard</h4>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• View all your projects at a glance</p>
            <p>• Track your writing progress and goals</p>
            <p>• Access recent documents quickly</p>
            <p>• Get personalized writing insights</p>
          </div>
        </div>
      );

    case 'ProjectCreation':
      return (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">📝</span>
            <h4 className="font-medium">Create Your First Project</h4>
          </div>
          <div className="text-sm text-gray-600">
            <p>
              Projects help organize your writing by type (novel, short story, etc.) and
              provide specialized tools for each format. Click the highlighted button to start!
            </p>
          </div>
        </div>
      );

    case 'EditorTour':
      return (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">✍️</span>
            <h4 className="font-medium">The Writing Editor</h4>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Distraction-free writing environment</p>
            <p>• Auto-save keeps your work safe</p>
            <p>• Rich formatting options</p>
            <p>• Integrated AI assistance</p>
            <p>• Real-time word count and goals</p>
          </div>
        </div>
      );

    case 'SaveFeatures':
      return (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">💾</span>
            <h4 className="font-medium">Never Lose Your Work</h4>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Auto-save runs every few seconds</p>
            <p>• Version history tracks all changes</p>
            <p>• Offline mode keeps you writing anywhere</p>
            <p>• Cloud sync across all devices</p>
          </div>
          <div className="bg-green-50 p-2 rounded text-xs text-green-800">
            💡 Look for the auto-save indicator to see when your work is being saved
          </div>
        </div>
      );

    case 'AIOverview':
      return (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🤖</span>
            <h4 className="font-medium">AI Writing Companion</h4>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Get intelligent writing suggestions</p>
            <p>• Overcome writer's block with prompts</p>
            <p>• Analyze your writing style and pace</p>
            <p>• Set and track writing goals</p>
            <p>• Improve consistency and flow</p>
          </div>
        </div>
      );

    case 'SuggestionsTour':
      return (
        <div className="space-y-3">
          <div className="text-sm text-gray-600">
            <p>
              Select any text in your editor to receive contextual AI suggestions for
              improvement, expansion, or alternative phrasings.
            </p>
          </div>
          <div className="bg-blue-50 p-2 rounded text-xs text-blue-800">
            💡 Try selecting a sentence and see what the AI suggests!
          </div>
        </div>
      );

    default:
      return (
        <div className="text-sm text-gray-600">
          Continue with this step to learn more about this feature.
        </div>
      );
  }
}

export default OnboardingTourStep;