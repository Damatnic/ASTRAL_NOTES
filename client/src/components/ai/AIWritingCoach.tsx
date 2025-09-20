/**
 * AI Writing Coach Component - Phase 3A
 * Main interface for the Personal AI Writing Coach system
 * 
 * Revolutionary Features:
 * - Unified coaching dashboard
 * - Multi-modal coaching interactions
 * - Real-time skill assessment and guidance
 * - Expert author mentorship integration
 * - Adaptive learning path visualization
 * - Milestone tracking and celebration
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Brain,
  Target,
  TrendingUp,
  Award,
  Users,
  Zap,
  BookOpen,
  MessageCircle,
  BarChart3,
  Lightbulb,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Trophy,
  Flame,
  Heart,
  Eye,
  PenTool,
  Compass,
  Rocket
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabItem } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Modal } from '@/components/ui/Modal';

// Import Phase 3A services
import { personalWritingCoach, type WritingSkillProfile, type CoachingSession } from '@/services/ai/personalWritingCoach';
import { writingSkillAssessment, type SkillAssessment } from '@/services/ai/writingSkillAssessment';
import { personalizedLearningPaths, type PersonalizedLearningPath } from '@/services/ai/personalizedLearningPaths';
import { adaptiveFeedbackSystem, type PersonalizedFeedback } from '@/services/ai/adaptiveFeedbackSystem';
import { milestoneAchievementSystem, type Milestone, type Achievement } from '@/services/ai/milestoneAchievementSystem';
import { expertAuthorSimulation, type AuthorPersona, type MentorshipSession } from '@/services/ai/expertAuthorSimulation';
import { predictiveWritingAssistance, type PlotDevelopmentPrediction } from '@/services/ai/predictiveWritingAssistance';
import { advancedWritingAnalysis, type ComprehensiveWritingAnalysis } from '@/services/ai/advancedWritingAnalysis';

interface AIWritingCoachProps {
  authorId: string;
  currentText?: string;
  isVisible: boolean;
  onToggle: () => void;
  onContentUpdate?: (content: string) => void;
}

interface CoachingState {
  skillProfile: WritingSkillProfile | null;
  learningPath: PersonalizedLearningPath | null;
  currentMilestones: Milestone[];
  recentAchievements: Achievement[];
  activeMentors: AuthorPersona[];
  coachingSession: CoachingSession | null;
  analysisResults: ComprehensiveWritingAnalysis | null;
  isLoading: boolean;
  error: string | null;
}

export function AIWritingCoach({
  authorId,
  currentText = '',
  isVisible,
  onToggle,
  onContentUpdate
}: AIWritingCoachProps) {
  
  const [coachingState, setCoachingState] = useState<CoachingState>({
    skillProfile: null,
    learningPath: null,
    currentMilestones: [],
    recentAchievements: [],
    activeMentors: [],
    coachingSession: null,
    analysisResults: null,
    isLoading: false,
    error: null
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<AuthorPersona | null>(null);
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Initialize coaching system
  useEffect(() => {
    if (isVisible && authorId) {
      initializeCoachingSystem();
    }
  }, [isVisible, authorId]);

  // Update analysis when text changes
  useEffect(() => {
    if (currentText && currentText.length > 100) {
      performRealTimeAnalysis();
    }
  }, [currentText]);

  const initializeCoachingSystem = useCallback(async () => {
    setCoachingState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Load or create skill profile
      let skillProfile = personalWritingCoach.getSkillProfile(authorId);
      
      if (!skillProfile) {
        // Perform initial assessment
        const initialTexts = [currentText].filter(Boolean);
        if (initialTexts.length > 0) {
          const assessment = await writingSkillAssessment.performComprehensiveAssessment(
            initialTexts,
            { authorId }
          );
          
          skillProfile = await createSkillProfile(assessment);
        }
      }
      
      // Load learning path
      const learningPath = skillProfile ? 
        await loadLearningPath(skillProfile) : null;
      
      // Load milestones and achievements
      const milestones = skillProfile ? 
        await loadCurrentMilestones(skillProfile) : [];
      
      const achievements = await loadRecentAchievements();
      
      // Load available mentors
      const mentors = expertAuthorSimulation.getAvailableAuthors();
      
      setCoachingState(prev => ({
        ...prev,
        skillProfile,
        learningPath,
        currentMilestones: milestones,
        recentAchievements: achievements,
        activeMentors: mentors.slice(0, 3), // Top 3 recommended mentors
        isLoading: false
      }));
      
    } catch (error) {
      console.error('Failed to initialize coaching system:', error);
      setCoachingState(prev => ({
        ...prev,
        error: 'Failed to initialize AI Writing Coach',
        isLoading: false
      }));
    }
  }, [authorId, currentText]);

  const performRealTimeAnalysis = useCallback(async () => {
    if (!currentText || isAnalyzing) return;
    
    setIsAnalyzing(true);
    try {
      const analysis = await advancedWritingAnalysis.performComprehensiveAnalysis(
        currentText,
        { authorId, genre: 'general' }
      );
      
      setCoachingState(prev => ({
        ...prev,
        analysisResults: analysis
      }));
      
      // Update skill profile with new data
      if (coachingState.skillProfile) {
        await updateSkillProgress(analysis);
      }
      
    } catch (error) {
      console.error('Real-time analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [currentText, isAnalyzing, coachingState.skillProfile, authorId]);

  const startMentorshipSession = useCallback(async (mentor: AuthorPersona) => {
    try {
      const session = await expertAuthorSimulation.conductMentorshipSession(
        mentor.id,
        {
          studentId: authorId,
          sessionType: 'skill-development',
          focusArea: 'general-improvement',
          duration: 30,
          difficulty: 'intermediate',
          studentProfile: {
            skillLevel: coachingState.skillProfile?.skillAssessment.overallScore || 50,
            learningStyle: 'interactive',
            goals: ['improve-writing', 'develop-voice']
          }
        }
      );
      
      setCoachingState(prev => ({
        ...prev,
        coachingSession: session
      }));
      
      setSelectedMentor(mentor);
      setShowMentorModal(true);
      
    } catch (error) {
      console.error('Failed to start mentorship session:', error);
    }
  }, [authorId, coachingState.skillProfile]);

  const sendMessageToMentor = useCallback(async () => {
    if (!userInput.trim() || !selectedMentor) return;
    
    try {
      const response = await expertAuthorSimulation.simulateAuthorConversation(
        selectedMentor.id,
        userInput,
        {
          conversationHistory,
          writingContext: currentText,
          sessionType: 'mentorship'
        }
      );
      
      setConversationHistory(prev => [
        ...prev,
        `You: ${userInput}`,
        `${selectedMentor.name}: ${response.response}`
      ]);
      
      setUserInput('');
      
      // Scroll to bottom
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
      
    } catch (error) {
      console.error('Failed to send message to mentor:', error);
    }
  }, [userInput, selectedMentor, conversationHistory, currentText]);

  const createSkillProfile = async (assessment: any): Promise<WritingSkillProfile> => {
    // Create skill profile based on assessment
    return {
      id: `profile-${authorId}`,
      authorId,
      createdAt: new Date(),
      lastUpdated: new Date(),
      skillAssessment: assessment,
      learningPath: {} as any, // Will be populated
      achievementProgress: {
        totalAchievements: 0,
        unlockedAchievements: [],
        nearbyAchievements: [],
        progressToNext: 0
      },
      milestones: [],
      coachingHistory: [],
      adaptiveFeedback: {} as any, // Will be populated
      activeMentors: [],
      mentorshipHistory: [],
      writingPsychology: {} as any, // Will be populated
      careerTrajectory: {} as any, // Will be populated
      improvementMetrics: [],
      consistencyTracking: {} as any // Will be populated
    };
  };

  const loadLearningPath = async (skillProfile: WritingSkillProfile): Promise<PersonalizedLearningPath> => {
    return personalizedLearningPaths.generatePersonalizedPath(
      skillProfile.skillAssessment,
      {
        learnerId: authorId,
        learningGoals: ['improve-fundamentals', 'develop-style'],
        timeAvailability: 5, // hours per week
        preferredPace: 'standard',
        careerFocus: false
      }
    );
  };

  const loadCurrentMilestones = async (skillProfile: WritingSkillProfile): Promise<Milestone[]> => {
    return milestoneAchievementSystem.generatePersonalizedMilestones(
      authorId,
      skillProfile.skillAssessment,
      skillProfile.learningPath
    );
  };

  const loadRecentAchievements = async (): Promise<Achievement[]> => {
    // Load recent achievements for the user
    return [];
  };

  const updateSkillProgress = async (analysis: ComprehensiveWritingAnalysis): Promise<void> => {
    // Update skill progress based on new analysis
    await milestoneAchievementSystem.updateMilestoneProgress(
      authorId,
      {
        analysis,
        timestamp: new Date(),
        context: 'real-time-analysis'
      }
    );
  };

  const tabs: TabItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Brain className="h-4 w-4" />,
      content: (
        <CoachingDashboard
          skillProfile={coachingState.skillProfile}
          learningPath={coachingState.learningPath}
          milestones={coachingState.currentMilestones}
          achievements={coachingState.recentAchievements}
          analysisResults={coachingState.analysisResults}
          isAnalyzing={isAnalyzing}
          onStartAnalysis={() => performRealTimeAnalysis()}
        />
      )
    },
    {
      id: 'mentors',
      label: 'Mentors',
      icon: <Users className="h-4 w-4" />,
      content: (
        <MentorPanel
          mentors={coachingState.activeMentors}
          onSelectMentor={startMentorshipSession}
          coachingSession={coachingState.coachingSession}
        />
      )
    },
    {
      id: 'skills',
      label: 'Skills',
      icon: <Target className="h-4 w-4" />,
      content: (
        <SkillsPanel
          skillProfile={coachingState.skillProfile}
          learningPath={coachingState.learningPath}
          onUpdateLearningPath={() => {}}
        />
      )
    },
    {
      id: 'progress',
      label: 'Progress',
      icon: <TrendingUp className="h-4 w-4" />,
      content: (
        <ProgressPanel
          milestones={coachingState.currentMilestones}
          achievements={coachingState.recentAchievements}
          skillProfile={coachingState.skillProfile}
        />
      )
    },
    {
      id: 'insights',
      label: 'Insights',
      icon: <Lightbulb className="h-4 w-4" />,
      content: (
        <InsightsPanel
          analysisResults={coachingState.analysisResults}
          skillProfile={coachingState.skillProfile}
          onShowDetailedAnalysis={() => setShowAnalysisModal(true)}
        />
      )
    }
  ];

  if (!isVisible) {
    return (
      <Button
        variant="cosmic"
        size="lg"
        className="fixed bottom-6 right-6 z-50 shadow-lg hover:shadow-xl transition-all duration-300"
        onClick={onToggle}
        leftIcon={<Brain className="h-5 w-5" />}
      >
        AI Writing Coach
        <Sparkles className="h-4 w-4 ml-2 text-yellow-400" />
      </Button>
    );
  }

  return (
    <>
      <div className="fixed right-4 top-20 bottom-4 w-96 bg-background border border-border rounded-lg shadow-xl z-40 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">AI Writing Coach</h3>
              <p className="text-xs text-muted-foreground">Your Personal Writing Mentor</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="text-muted-foreground hover:text-foreground"
          >
            ×
          </Button>
        </div>

        {/* Quick Stats */}
        {coachingState.skillProfile && (
          <div className="p-3 border-b border-border bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-lg font-bold text-green-600">
                  {coachingState.skillProfile.skillAssessment.overallScore}
                </div>
                <div className="text-xs text-muted-foreground">Overall Score</div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-600">
                  {coachingState.currentMilestones.filter(m => m.currentProgress >= 100).length}
                </div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-600">
                  {coachingState.recentAchievements.length}
                </div>
                <div className="text-xs text-muted-foreground">Achievements</div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {coachingState.isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Initializing AI Coach...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {coachingState.error && (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
              <p className="text-sm text-red-600 mb-4">{coachingState.error}</p>
              <Button variant="outline" size="sm" onClick={initializeCoachingSystem}>
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!coachingState.isLoading && !coachingState.error && (
          <div className="flex-1 overflow-hidden">
            <Tabs 
              tabs={tabs} 
              variant="cosmic" 
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>
        )}
      </div>

      {/* Mentor Chat Modal */}
      <Modal
        isOpen={showMentorModal}
        onClose={() => setShowMentorModal(false)}
        title={selectedMentor ? `Chat with ${selectedMentor.name}` : 'Mentor Chat'}
        size="lg"
      >
        {selectedMentor && (
          <div className="space-y-4">
            {/* Mentor Info */}
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold">{selectedMentor.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedMentor.expertise.join(', ')}
                </p>
              </div>
            </div>

            {/* Chat History */}
            <div 
              ref={chatContainerRef}
              className="h-64 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-900 rounded-lg space-y-2"
            >
              {conversationHistory.length === 0 ? (
                <div className="text-center text-muted-foreground">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>Start a conversation with {selectedMentor.name}</p>
                </div>
              ) : (
                conversationHistory.map((message, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded ${
                      message.startsWith('You:')
                        ? 'bg-blue-100 dark:bg-blue-900 ml-4'
                        : 'bg-white dark:bg-slate-800 mr-4'
                    }`}
                  >
                    <p className="text-sm">{message}</p>
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessageToMentor()}
                placeholder="Ask your mentor anything..."
                className="flex-1 px-3 py-2 border border-border rounded-md text-sm"
              />
              <Button onClick={sendMessageToMentor} disabled={!userInput.trim()}>
                Send
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Detailed Analysis Modal */}
      <Modal
        isOpen={showAnalysisModal}
        onClose={() => setShowAnalysisModal(false)}
        title="Detailed Writing Analysis"
        size="xl"
      >
        {coachingState.analysisResults && (
          <DetailedAnalysisView analysis={coachingState.analysisResults} />
        )}
      </Modal>
    </>
  );
}

// Component sub-components for better organization
function CoachingDashboard({ 
  skillProfile, 
  learningPath, 
  milestones, 
  achievements, 
  analysisResults,
  isAnalyzing,
  onStartAnalysis 
}: any) {
  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto">
      {/* Welcome Message */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="h-4 w-4 text-red-500" />
            <h4 className="font-medium">Welcome Back!</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            Ready to continue your writing journey? Let's make today count!
          </p>
        </CardContent>
      </Card>

      {/* Current Focus */}
      {learningPath && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              Current Focus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Learning Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {learningPath.overallProgress}%
                  </span>
                </div>
                <Progress value={learningPath.overallProgress} className="h-2" />
              </div>
              
              {learningPath.currentModule && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <h5 className="font-medium text-sm mb-1">Current Module</h5>
                  <p className="text-sm text-muted-foreground">
                    {learningPath.currentModule}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Writing Analysis
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onStartAnalysis}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analysisResults ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Overall Quality</span>
                <Badge variant="outline">
                  {analysisResults.overallQualityScore}/100
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Readability</span>
                <Badge variant="outline">
                  {analysisResults.readabilityIndex}/100
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Professional Readiness</span>
                <Badge variant="outline">
                  {analysisResults.professionalReadinessScore}/100
                </Badge>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Start writing to see real-time analysis
            </p>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="outline" className="text-xs">
              <BookOpen className="h-3 w-3 mr-1" />
              Daily Exercise
            </Button>
            <Button size="sm" variant="outline" className="text-xs">
              <Eye className="h-3 w-3 mr-1" />
              Style Check
            </Button>
            <Button size="sm" variant="outline" className="text-xs">
              <PenTool className="h-3 w-3 mr-1" />
              Writing Sprint
            </Button>
            <Button size="sm" variant="outline" className="text-xs">
              <Compass className="h-3 w-3 mr-1" />
              Goal Setting
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MentorPanel({ mentors, onSelectMentor, coachingSession }: any) {
  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto">
      <div className="text-sm text-muted-foreground mb-4">
        Choose a mentor to guide your writing journey
      </div>
      
      {mentors.map((mentor: AuthorPersona) => (
        <Card 
          key={mentor.id}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onSelectMentor(mentor)}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                <Users className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm">{mentor.name}</h4>
                <p className="text-xs text-muted-foreground mb-2">
                  {mentor.lifespan[0]} - {mentor.lifespan[1]}
                </p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {mentor.expertise.slice(0, 2).map((skill) => (
                    <Badge key={skill} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {mentor.teachingPhilosophy?.coreBeliefs?.[0] || 'Expert guidance available'}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SkillsPanel({ skillProfile, learningPath, onUpdateLearningPath }: any) {
  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto">
      {skillProfile && (
        <>
          {/* Skill Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Skill Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Fundamentals</span>
                    <span className="text-sm font-medium">
                      {skillProfile.skillAssessment.fundamentalSkills?.overallScore || 75}%
                    </span>
                  </div>
                  <Progress value={skillProfile.skillAssessment.fundamentalSkills?.overallScore || 75} className="h-2" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Creativity</span>
                    <span className="text-sm font-medium">
                      {skillProfile.skillAssessment.creativeSkills?.overallScore || 65}%
                    </span>
                  </div>
                  <Progress value={skillProfile.skillAssessment.creativeSkills?.overallScore || 65} className="h-2" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Professional</span>
                    <span className="text-sm font-medium">
                      {skillProfile.skillAssessment.professionalSkills?.overallScore || 55}%
                    </span>
                  </div>
                  <Progress value={skillProfile.skillAssessment.professionalSkills?.overallScore || 55} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Strengths & Weaknesses */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Focus Areas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h5 className="text-xs font-medium text-green-600 mb-2">Strengths</h5>
                  <div className="flex flex-wrap gap-1">
                    {skillProfile.skillAssessment.strengths?.slice(0, 3).map((strength: any, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs bg-green-50">
                        {strength.skillName || strength}
                      </Badge>
                    )) || []}
                  </div>
                </div>
                
                <div>
                  <h5 className="text-xs font-medium text-orange-600 mb-2">Areas to Improve</h5>
                  <div className="flex flex-wrap gap-1">
                    {skillProfile.skillAssessment.weaknesses?.slice(0, 3).map((weakness: any, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs bg-orange-50">
                        {weakness.skillName || weakness}
                      </Badge>
                    )) || []}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function ProgressPanel({ milestones, achievements, skillProfile }: any) {
  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto">
      {/* Recent Achievements */}
      {achievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {achievements.slice(0, 3).map((achievement: Achievement) => (
                <div key={achievement.id} className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-950 rounded">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium">{achievement.title}</p>
                    <p className="text-xs text-muted-foreground">{achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4" />
            Active Milestones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {milestones.slice(0, 4).map((milestone: Milestone) => (
              <div key={milestone.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{milestone.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {milestone.currentProgress}%
                  </span>
                </div>
                <Progress value={milestone.currentProgress} className="h-2" />
                {milestone.currentProgress >= 100 && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    <span className="text-xs">Completed!</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Writing Streak */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            Writing Streak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-500">7</div>
            <div className="text-xs text-muted-foreground">Days in a row</div>
            <p className="text-xs text-muted-foreground mt-2">
              Keep it up! Consistency is key to improvement.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InsightsPanel({ analysisResults, skillProfile, onShowDetailedAnalysis }: any) {
  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto">
      {analysisResults ? (
        <>
          {/* Key Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                Key Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analysisResults.keyInsights?.slice(0, 3).map((insight: any, index: number) => (
                  <div key={index} className="p-2 bg-blue-50 dark:bg-blue-950 rounded text-sm">
                    {insight.insight || insight}
                  </div>
                )) || (
                  <div className="space-y-2">
                    <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded text-sm">
                      Your writing shows strong fundamentals with room for creative expression
                    </div>
                    <div className="p-2 bg-green-50 dark:bg-green-950 rounded text-sm">
                      Sentence variety has improved significantly in recent work
                    </div>
                    <div className="p-2 bg-purple-50 dark:bg-purple-950 rounded text-sm">
                      Consider exploring more advanced literary devices
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Rocket className="h-4 w-4 text-blue-500" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analysisResults.improvementRecommendations?.slice(0, 3).map((rec: any, index: number) => (
                  <div key={index} className="text-sm">
                    • {rec.recommendation || rec}
                  </div>
                )) || (
                  <div className="space-y-2 text-sm">
                    <div>• Practice varying sentence length for better rhythm</div>
                    <div>• Experiment with metaphorical language</div>
                    <div>• Focus on showing rather than telling</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Analysis Button */}
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={onShowDetailedAnalysis}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            View Detailed Analysis
          </Button>
        </>
      ) : (
        <div className="text-center py-8">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-medium mb-1">No Analysis Yet</h3>
          <p className="text-sm text-muted-foreground">
            Start writing to see personalized insights
          </p>
        </div>
      )}
    </div>
  );
}

function DetailedAnalysisView({ analysis }: { analysis: ComprehensiveWritingAnalysis }) {
  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {analysis.overallQualityScore}
          </div>
          <div className="text-sm text-muted-foreground">Overall Quality</div>
        </div>
        <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {analysis.readabilityIndex}
          </div>
          <div className="text-sm text-muted-foreground">Readability</div>
        </div>
        <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {analysis.professionalReadinessScore}
          </div>
          <div className="text-sm text-muted-foreground">Pro Readiness</div>
        </div>
        <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">
            {analysis.marketViabilityScore}
          </div>
          <div className="text-sm text-muted-foreground">Market Viability</div>
        </div>
      </div>

      {/* Metric Categories */}
      <div className="space-y-4">
        {[
          { name: 'Fundamental', metrics: analysis.fundamentalMetrics, color: 'blue' },
          { name: 'Stylistic', metrics: analysis.stylisticMetrics, color: 'purple' },
          { name: 'Creative', metrics: analysis.creativeMetrics, color: 'green' },
          { name: 'Professional', metrics: analysis.professionalMetrics, color: 'orange' }
        ].map((category) => (
          <Card key={category.name}>
            <CardHeader>
              <CardTitle className="text-sm">{category.name} Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(category.metrics).map(([key, value]: [string, any]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {value?.value || value || 0}
                      </Badge>
                    </div>
                    <Progress 
                      value={value?.value || value || 0} 
                      className="h-1" 
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}