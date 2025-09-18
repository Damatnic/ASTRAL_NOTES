/**
 * Dialogue Workshop Component
 * Interactive dialogue training and character voice development
 */

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Users, 
  Target, 
  Award, 
  Play, 
  Pause, 
  Clock,
  Star,
  TrendingUp,
  Book,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Volume2,
  Edit3,
  Plus,
  Eye,
  RefreshCw
} from 'lucide-react';
import { 
  dialogueWorkshopService, 
  CharacterVoice, 
  DialogueExercise, 
  ConversationScenario,
  DialogueFeedback,
  ExerciseResult
} from '../../services/dialogueWorkshopService';
import { BrowserEventEmitter } from '../../utils/BrowserEventEmitter';
import { Progress } from '../ui/Progress';

export function DialogueWorkshop() {
  const [activeTab, setActiveTab] = useState<'exercises' | 'voices' | 'scenarios' | 'analysis'>('exercises');
  const [characterVoices, setCharacterVoices] = useState<CharacterVoice[]>([]);
  const [exercises, setExercises] = useState<DialogueExercise[]>([]);
  const [scenarios, setScenarios] = useState<ConversationScenario[]>([]);
  const [activeExercise, setActiveExercise] = useState<DialogueExercise | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<DialogueExercise | null>(null);
  const [dialogueText, setDialogueText] = useState('');
  const [exerciseStartTime, setExerciseStartTime] = useState<Date | null>(null);
  const [feedback, setFeedback] = useState<DialogueFeedback | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<CharacterVoice | null>(null);
  const [showNewVoiceModal, setShowNewVoiceModal] = useState(false);
  
  // New voice form
  const [newVoiceName, setNewVoiceName] = useState('');
  const [newVoiceAge, setNewVoiceAge] = useState(30);
  const [newVoiceStyle, setNewVoiceStyle] = useState<'formal' | 'casual' | 'street' | 'poetic' | 'technical'>('casual');

  useEffect(() => {
    loadData();
    
    const eventEmitter = BrowserEventEmitter.getInstance();
    const unsubscribers = [
      eventEmitter.on('voice:created', loadData),
      eventEmitter.on('voice:updated', loadData),
      eventEmitter.on('exercise:started', (exercise: DialogueExercise) => {
        setActiveExercise(exercise);
        setExerciseStartTime(new Date());
      }),
      eventEmitter.on('exercise:completed', loadData),
      eventEmitter.on('scenario:completed', loadData)
    ];

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  const loadData = () => {
    setCharacterVoices(dialogueWorkshopService.getAllCharacterVoices());
    setExercises(dialogueWorkshopService.getAllExercises());
    setScenarios(dialogueWorkshopService.getAllScenarios());
    setActiveExercise(dialogueWorkshopService.getActiveExercise());
  };

  const handleStartExercise = (exerciseId: string) => {
    const exercise = dialogueWorkshopService.startExercise(exerciseId);
    setSelectedExercise(exercise);
    setDialogueText('');
    setFeedback(null);
    setShowFeedback(false);
  };

  const handleCompleteExercise = () => {
    if (!selectedExercise || !dialogueText.trim()) return;
    
    const selfRating = 3; // Default - could be user input
    const notes = 'Exercise completed';
    
    dialogueWorkshopService.completeExercise(selectedExercise.id, {
      dialogueWritten: dialogueText,
      selfRating,
      notes
    });
    
    // Generate feedback
    const generatedFeedback = dialogueWorkshopService.analyzeDialogue(dialogueText, characterVoices);
    setFeedback(generatedFeedback);
    setShowFeedback(true);
    
    setSelectedExercise(null);
    setActiveExercise(null);
  };

  const handleCreateVoice = () => {
    if (!newVoiceName.trim()) return;
    
    dialogueWorkshopService.createCharacterVoice(
      `char-${Date.now()}`,
      newVoiceName,
      {
        voiceProfile: {
          age: newVoiceAge,
          background: '',
          education: '',
          personality: [],
          speakingStyle: newVoiceStyle,
          pace: 'normal',
          volume: 'normal',
          tone: [],
          accent: '',
          languageSkills: []
        }
      }
    );
    
    setNewVoiceName('');
    setNewVoiceAge(30);
    setNewVoiceStyle('casual');
    setShowNewVoiceModal(false);
  };

  const getDifficultyColor = (difficulty: DialogueExercise['difficulty']) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'advanced': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderExercises = () => (
    <div className="space-y-6">
      {/* Active Exercise */}
      {selectedExercise && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">{selectedExercise.title}</h3>
              <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">{selectedExercise.description}</p>
            </div>
            
            {exerciseStartTime && (
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Clock className="w-4 h-4" />
                <span className="text-sm">
                  {Math.floor((Date.now() - exerciseStartTime.getTime()) / 1000 / 60)} min
                </span>
              </div>
            )}
          </div>
          
          {/* Instructions */}
          <div className="mb-4">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Instructions:</h4>
            <ul className="space-y-1">
              {selectedExercise.instructions.map((instruction, idx) => (
                <li key={idx} className="text-sm text-blue-800 dark:text-blue-200 flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  {instruction}
                </li>
              ))}
            </ul>
          </div>
          
          {/* Prompt */}
          {selectedExercise.prompts.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Prompt:</h4>
              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                <p className="text-sm dark:text-white">{selectedExercise.prompts[0].text}</p>
                {selectedExercise.prompts[0].constraints && (
                  <div className="mt-2">
                    <span className="text-xs font-medium text-gray-500">Constraints:</span>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {selectedExercise.prompts[0].constraints.map((constraint, idx) => (
                        <li key={idx}>• {constraint}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Writing Area */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              Your Dialogue:
            </label>
            <textarea
              value={dialogueText}
              onChange={(e) => setDialogueText(e.target.value)}
              placeholder="Write your dialogue here..."
              rows={10}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white resize-none"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{dialogueText.split(/\s+/).filter(w => w.length > 0).length} words</span>
              <span>Est. time: {selectedExercise.timeEstimate} min</span>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleCompleteExercise}
              disabled={!dialogueText.trim()}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg"
            >
              Complete Exercise
            </button>
            <button
              onClick={() => {
                setSelectedExercise(null);
                setActiveExercise(null);
                setDialogueText('');
              }}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedback && feedback && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold dark:text-white">Exercise Feedback</h3>
            <button
              onClick={() => setShowFeedback(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          {/* Overall Score */}
          <div className="text-center mb-6">
            <div className={`text-4xl font-bold ${getScoreColor(feedback.overallScore)}`}>
              {feedback.overallScore}
            </div>
            <div className="text-gray-500 dark:text-gray-400">Overall Score</div>
          </div>
          
          {/* Detailed Scores */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Voice Consistency</div>
              <div className="flex items-center gap-2">
                <Progress value={feedback.characterVoiceConsistency} className="flex-1 h-2" />
                <span className="text-sm font-medium">{feedback.characterVoiceConsistency}</span>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Naturalness</div>
              <div className="flex items-center gap-2">
                <Progress value={feedback.naturalness} className="flex-1 h-2" />
                <span className="text-sm font-medium">{feedback.naturalness}</span>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Purpose Clarity</div>
              <div className="flex items-center gap-2">
                <Progress value={feedback.purposeClarity} className="flex-1 h-2" />
                <span className="text-sm font-medium">{feedback.purposeClarity}</span>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Emotional Resonance</div>
              <div className="flex items-center gap-2">
                <Progress value={feedback.emotionalResonance} className="flex-1 h-2" />
                <span className="text-sm font-medium">{feedback.emotionalResonance}</span>
              </div>
            </div>
          </div>
          
          {/* Strengths and Improvements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-green-600 dark:text-green-400 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Strengths
              </h4>
              <ul className="space-y-1">
                {feedback.strengths.map((strength, idx) => (
                  <li key={idx} className="text-sm text-gray-600 dark:text-gray-400">• {strength}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-yellow-600 dark:text-yellow-400 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Areas for Improvement
              </h4>
              <ul className="space-y-1">
                {feedback.improvements.map((improvement, idx) => (
                  <li key={idx} className="text-sm text-gray-600 dark:text-gray-400">• {improvement}</li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Suggestions */}
          {feedback.suggestions.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Suggestions
              </h4>
              <div className="space-y-2">
                {feedback.suggestions.map((suggestion, idx) => (
                  <div key={idx} className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                    <div className="font-medium text-sm text-blue-900 dark:text-blue-100">{suggestion.suggestion}</div>
                    {suggestion.example && (
                      <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        Example: {suggestion.example}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Available Exercises */}
      {!selectedExercise && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {exercises.map((exercise) => (
            <div key={exercise.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold dark:text-white">{exercise.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{exercise.description}</p>
                </div>
                
                {exercise.completed && (
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                )}
              </div>
              
              {/* Exercise Details */}
              <div className="flex items-center gap-4 mb-4 text-sm">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(exercise.difficulty)}`}>
                  {exercise.difficulty}
                </span>
                
                <div className="flex items-center gap-1 text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{exercise.timeEstimate} min</span>
                </div>
                
                <div className="flex items-center gap-1 text-gray-500">
                  <Target className="w-3 h-3" />
                  <span className="capitalize">{exercise.type.replace('_', ' ')}</span>
                </div>
              </div>
              
              {/* Learning Goals */}
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Learning Goals:</h4>
                <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-0.5">
                  {exercise.learningGoals.slice(0, 2).map((goal, idx) => (
                    <li key={idx}>• {goal}</li>
                  ))}
                  {exercise.learningGoals.length > 2 && (
                    <li>• +{exercise.learningGoals.length - 2} more...</li>
                  )}
                </ul>
              </div>
              
              {/* Action Button */}
              <button
                onClick={() => handleStartExercise(exercise.id)}
                className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium"
              >
                {exercise.completed ? 'Redo Exercise' : 'Start Exercise'}
              </button>
              
              {/* Results Preview */}
              {exercise.results && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Last Score:</span>
                    <span className={`font-medium ${getScoreColor(exercise.results.feedback.overallScore)}`}>
                      {exercise.results.feedback.overallScore}/100
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderVoices = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold dark:text-white">Character Voices</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Develop unique voices for your characters</p>
        </div>
        
        <button
          onClick={() => setShowNewVoiceModal(true)}
          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Voice
        </button>
      </div>

      {/* Character Voices Grid */}
      {characterVoices.length === 0 ? (
        <div className="text-center py-16">
          <Volume2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Character Voices</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Create character voice profiles to improve dialogue consistency.</p>
          <button
            onClick={() => setShowNewVoiceModal(true)}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"
          >
            Create First Voice
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {characterVoices.map((voice) => (
            <div key={voice.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold dark:text-white">{voice.characterName}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Age {voice.voiceProfile.age} • {voice.voiceProfile.speakingStyle}
                  </p>
                </div>
                
                <button
                  onClick={() => setSelectedVoice(selectedVoice?.id === voice.id ? null : voice)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
              
              {/* Voice Profile Summary */}
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Style:</span>
                  <span className="ml-2 capitalize dark:text-white">{voice.voiceProfile.speakingStyle}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Pace:</span>
                  <span className="ml-2 capitalize dark:text-white">{voice.voiceProfile.pace}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Vocabulary:</span>
                  <span className="ml-2 capitalize dark:text-white">{voice.vocabularyLevel}</span>
                </div>
              </div>
              
              {/* Speech Patterns */}
              {voice.speechPatterns.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Speech Patterns:</div>
                  <div className="flex flex-wrap gap-1">
                    {voice.speechPatterns.slice(0, 2).map((pattern, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                        {pattern.pattern}
                      </span>
                    ))}
                    {voice.speechPatterns.length > 2 && (
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                        +{voice.speechPatterns.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Examples Count */}
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Examples:</span>
                  <span className="font-medium dark:text-white">{voice.examples.length}</span>
                </div>
              </div>
              
              {/* Expanded View */}
              {selectedVoice?.id === voice.id && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="space-y-3">
                    {voice.voiceProfile.personality.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Personality:</div>
                        <div className="flex flex-wrap gap-1">
                          {voice.voiceProfile.personality.map((trait, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                              {trait}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {voice.quirks.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Quirks:</div>
                        <ul className="text-xs space-y-0.5">
                          {voice.quirks.map((quirk, idx) => (
                            <li key={idx} className="text-gray-600 dark:text-gray-300">• {quirk}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New Voice Modal */}
      {showNewVoiceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold dark:text-white mb-4">Create Character Voice</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium dark:text-white mb-2">Character Name</label>
                <input
                  type="text"
                  value={newVoiceName}
                  onChange={(e) => setNewVoiceName(e.target.value)}
                  placeholder="Enter character name"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium dark:text-white mb-2">Age</label>
                <input
                  type="number"
                  value={newVoiceAge}
                  onChange={(e) => setNewVoiceAge(Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium dark:text-white mb-2">Speaking Style</label>
                <select
                  value={newVoiceStyle}
                  onChange={(e) => setNewVoiceStyle(e.target.value as any)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                >
                  <option value="formal">Formal</option>
                  <option value="casual">Casual</option>
                  <option value="street">Street</option>
                  <option value="poetic">Poetic</option>
                  <option value="technical">Technical</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewVoiceModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateVoice}
                disabled={!newVoiceName.trim()}
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold dark:text-white">Dialogue Workshop</h2>
          <p className="text-gray-600 dark:text-gray-400">Develop character voices and master dialogue techniques</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Progress Overview */}
          <div className="text-right">
            <div className="text-sm text-gray-500 dark:text-gray-400">Completed Exercises</div>
            <div className="text-xl font-bold dark:text-white">
              {exercises.filter(e => e.completed).length} / {exercises.length}
            </div>
          </div>
          
          <div className="w-16 h-16">
            <svg viewBox="0 0 36 36" className="w-full h-full">
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="2"
              />
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeDasharray={`${(exercises.filter(e => e.completed).length / exercises.length) * 100}, 100`}
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg mb-6">
        {[
          { id: 'exercises', label: 'Exercises', icon: Target },
          { id: 'voices', label: 'Character Voices', icon: Users },
          { id: 'scenarios', label: 'Scenarios', icon: MessageSquare },
          { id: 'analysis', label: 'Analysis', icon: BarChart3 }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-96">
        {activeTab === 'exercises' && renderExercises()}
        {activeTab === 'voices' && renderVoices()}
        {activeTab === 'scenarios' && (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            <MessageSquare className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Conversation Scenarios</h3>
            <p className="text-sm">Practice dialogue in structured scenarios. Coming soon!</p>
          </div>
        )}
        {activeTab === 'analysis' && (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            <BarChart3 className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Dialogue Analysis</h3>
            <p className="text-sm">Advanced dialogue analytics and insights. Coming soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}