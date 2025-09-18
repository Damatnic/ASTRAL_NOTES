import { EventEmitter } from 'events';

export interface MasterySkill {
  id: string;
  category: 'craft' | 'technical' | 'creative' | 'professional' | 'personal';
  subcategory: string;
  name: string;
  description: string;
  currentLevel: number;
  maxLevel: number;
  prerequisites: string[];
  progressMarkers: ProgressMarker[];
  assessmentCriteria: AssessmentCriterion[];
  relatedSkills: string[];
  learningResources: LearningResource[];
  practiceExercises: PracticeExercise[];
  masteryPath: MasteryPath;
  personalNotes: string;
  lastAssessed: Date;
  nextMilestone: string;
  estimatedTimeToNext: number; // hours
}

export interface ProgressMarker {
  level: number;
  title: string;
  description: string;
  indicators: string[];
  achieved: boolean;
  achievedDate?: Date;
  evidence: string[];
  validatedBy?: 'self' | 'peer' | 'mentor' | 'professional';
  celebrationNote?: string;
}

export interface AssessmentCriterion {
  id: string;
  category: 'knowledge' | 'application' | 'analysis' | 'synthesis' | 'evaluation' | 'creation';
  criterion: string;
  weight: number;
  evaluationMethod: 'self_assessment' | 'work_analysis' | 'peer_review' | 'expert_evaluation' | 'objective_measure';
  benchmarks: Benchmark[];
  currentScore: number;
  notes: string;
}

export interface Benchmark {
  level: number;
  description: string;
  examples: string[];
  evidenceRequired: string[];
}

export interface LearningResource {
  id: string;
  type: 'book' | 'course' | 'article' | 'video' | 'workshop' | 'mentorship' | 'practice' | 'community';
  title: string;
  description: string;
  url?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  timeInvestment: number; // hours
  relevantLevels: number[];
  personalRating?: number;
  completedDate?: Date;
  notes?: string;
  recommended: boolean;
}

export interface PracticeExercise {
  id: string;
  name: string;
  description: string;
  type: 'drill' | 'project' | 'challenge' | 'reflection' | 'analysis' | 'creation';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  timeRequired: number; // minutes
  targetLevels: number[];
  instructions: string[];
  successCriteria: string[];
  variations: string[];
  completions: ExerciseCompletion[];
  personalizedTips: string[];
}

export interface ExerciseCompletion {
  date: Date;
  timeSpent: number;
  quality: 'poor' | 'fair' | 'good' | 'excellent';
  insights: string[];
  improvements: string[];
  nextActions: string[];
  satisfaction: number;
}

export interface MasteryPath {
  id: string;
  name: string;
  description: string;
  phases: MasteryPhase[];
  totalEstimatedHours: number;
  personalizedFor: string;
  adaptations: string[];
  alternativeRoutes: AlternativeRoute[];
}

export interface MasteryPhase {
  id: string;
  phase: number;
  name: string;
  description: string;
  objectives: string[];
  requiredSkills: string[];
  recommendedResources: string[];
  practiceProjects: string[];
  assessmentMethods: string[];
  estimatedDuration: number; // hours
  prerequisites: string[];
  outcomes: string[];
}

export interface AlternativeRoute {
  id: string;
  name: string;
  description: string;
  conditions: string[];
  advantages: string[];
  tradeoffs: string[];
  timeline: string;
}

export interface MasteryAssessment {
  id: string;
  date: Date;
  type: 'comprehensive' | 'skill_specific' | 'periodic_review' | 'milestone_check' | 'peer_evaluation';
  skillsAssessed: string[];
  overallScore: number;
  skillScores: Record<string, number>;
  strengths: string[];
  improvements: string[];
  recommendations: MasteryRecommendation[];
  nextSteps: string[];
  confidenceLevel: number;
  selfReflection: string;
  evidencePortfolio: string[];
  validatedBy?: string;
  assessmentNotes: string;
}

export interface MasteryRecommendation {
  id: string;
  type: 'skill_development' | 'practice_increase' | 'resource_exploration' | 'mentorship' | 'project_application' | 'reflection';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  rationale: string;
  implementation: {
    steps: string[];
    timeframe: string;
    resources: string[];
    success_metrics: string[];
  };
  expectedOutcome: string;
  personalAlignment: number;
  effort: 'low' | 'medium' | 'high';
}

export interface SkillProgression {
  skillId: string;
  progressHistory: ProgressPoint[];
  currentTrend: 'accelerating' | 'steady' | 'slowing' | 'plateau' | 'declining';
  projectedTimeline: ProjectedTimeline;
  bottlenecks: string[];
  accelerators: string[];
  personalPattern: PersonalPattern;
}

export interface ProgressPoint {
  date: Date;
  level: number;
  confidence: number;
  notes: string;
  context: string;
  evidence: string[];
}

export interface ProjectedTimeline {
  nextLevel: {
    level: number;
    estimatedDate: Date;
    confidence: number;
  };
  mastery: {
    estimatedDate: Date;
    confidence: number;
    assumptions: string[];
  };
  milestones: {
    level: number;
    estimatedDate: Date;
    requirements: string[];
  }[];
}

export interface PersonalPattern {
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
  optimalPracticeFrequency: 'daily' | 'frequent' | 'moderate' | 'intensive_blocks';
  motivationFactors: string[];
  challengePreferences: 'gradual' | 'moderate_jumps' | 'ambitious_leaps';
  feedbackPreference: 'immediate' | 'periodic' | 'milestone_based';
  supportNeeds: string[];
}

export interface WritingMasteryProfile {
  writerId: string;
  journeyStartDate: Date;
  currentOverallLevel: number;
  maxPossibleLevel: number;
  totalSkills: number;
  masteredSkills: number;
  skillsInProgress: number;
  totalPracticeHours: number;
  totalAssessments: number;
  personalStrengths: string[];
  growthAreas: string[];
  uniqueAttributes: string[];
  writingPhilosophy: string;
  personalGoals: string[];
  preferredGenres: string[];
  writingVoice: {
    characteristics: string[];
    evolution: string[];
    distinctiveness: number;
  };
  achievements: Achievement[];
  certifications: Certification[];
  mentorships: Mentorship[];
}

export interface Achievement {
  id: string;
  type: 'skill_mastery' | 'milestone' | 'project_completion' | 'recognition' | 'breakthrough' | 'consistency';
  title: string;
  description: string;
  achievedDate: Date;
  significance: 'minor' | 'moderate' | 'major' | 'landmark';
  evidence: string[];
  celebration: string;
  impact: string;
  sharable: boolean;
}

export interface Certification {
  id: string;
  name: string;
  issuingOrganization: string;
  dateEarned: Date;
  validUntil?: Date;
  skillsValidated: string[];
  credibilityLevel: 'internal' | 'peer' | 'professional' | 'institutional';
  portfolioItem: boolean;
}

export interface Mentorship {
  id: string;
  type: 'formal' | 'informal' | 'peer' | 'reverse';
  mentorName: string;
  skillsFocused: string[];
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'completed' | 'paused';
  learnings: string[];
  projects: string[];
  impact: string;
}

export interface MasteryGoal {
  id: string;
  type: 'skill_achievement' | 'level_advancement' | 'portfolio_development' | 'recognition' | 'teaching' | 'innovation';
  title: string;
  description: string;
  targetSkills: string[];
  targetLevel: number;
  timeline: {
    startDate: Date;
    targetDate: Date;
    milestones: GoalMilestone[];
  };
  motivation: string;
  personalValue: number;
  strategies: string[];
  resources: string[];
  progressTracking: {
    method: string;
    frequency: string;
    metrics: string[];
  };
  status: 'planning' | 'active' | 'on_track' | 'behind' | 'ahead' | 'completed' | 'abandoned';
  achievements: string[];
  challenges: string[];
  adaptations: string[];
}

export interface GoalMilestone {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  completedDate?: Date;
  requirements: string[];
  verification: string[];
  celebration: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
}

class WritingMasteryService extends EventEmitter {
  private masterySkills: Map<string, MasterySkill> = new Map();
  private masteryAssessments: Map<string, MasteryAssessment> = new Map();
  private skillProgressions: Map<string, SkillProgression> = new Map();
  private masteryProfile: WritingMasteryProfile | null = null;
  private masteryGoals: Map<string, MasteryGoal> = new Map();
  private currentAssessment: MasteryAssessment | null = null;

  constructor() {
    super();
    this.loadDataFromStorage();
    this.initializeDefaultSkills();
    this.initializeMasteryProfile();
    this.schedulePeriodicAssessments();
  }

  async createMasterySkill(skillData: Omit<MasterySkill, 'id' | 'currentLevel' | 'lastAssessed' | 'estimatedTimeToNext'>): Promise<MasterySkill> {
    const skill: MasterySkill = {
      ...skillData,
      id: `skill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      currentLevel: 0,
      lastAssessed: new Date(),
      estimatedTimeToNext: this.calculateTimeToNext(0, skillData.progressMarkers)
    };

    this.masterySkills.set(skill.id, skill);
    
    // Initialize progression tracking
    const progression: SkillProgression = {
      skillId: skill.id,
      progressHistory: [{
        date: new Date(),
        level: 0,
        confidence: 0.5,
        notes: 'Initial skill registration',
        context: 'baseline',
        evidence: []
      }],
      currentTrend: 'steady',
      projectedTimeline: this.calculateProjectedTimeline(skill),
      bottlenecks: [],
      accelerators: [],
      personalPattern: this.determinePersonalPattern(skill)
    };

    this.skillProgressions.set(skill.id, progression);
    
    await this.saveMasteryDataToStorage();
    this.emit('skillCreated', skill);
    
    return skill;
  }

  async conductSkillAssessment(skillIds: string[], type: MasteryAssessment['type'] = 'skill_specific'): Promise<MasteryAssessment> {
    const assessedSkills = skillIds.map(id => this.masterySkills.get(id)).filter(Boolean) as MasterySkill[];
    
    if (assessedSkills.length === 0) {
      throw new Error('No valid skills found for assessment');
    }

    const assessment: MasteryAssessment = {
      id: `assessment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: new Date(),
      type,
      skillsAssessed: skillIds,
      overallScore: 0,
      skillScores: {},
      strengths: [],
      improvements: [],
      recommendations: [],
      nextSteps: [],
      confidenceLevel: 0,
      selfReflection: '',
      evidencePortfolio: [],
      assessmentNotes: ''
    };

    // Conduct individual skill assessments
    for (const skill of assessedSkills) {
      const skillScore = await this.assessSkill(skill);
      assessment.skillScores[skill.id] = skillScore.score;
      
      // Update skill level if improved
      if (skillScore.score > skill.currentLevel) {
        skill.currentLevel = skillScore.score;
        skill.lastAssessed = new Date();
        
        // Check for milestone achievements
        await this.checkMilestoneAchievements(skill, skillScore.score);
        
        // Update progression tracking
        await this.updateSkillProgression(skill.id, skillScore.score, skillScore.confidence, skillScore.evidence);
      }
    }

    // Calculate overall assessment metrics
    assessment.overallScore = this.calculateOverallScore(assessment.skillScores);
    assessment.strengths = this.identifyStrengths(assessedSkills);
    assessment.improvements = this.identifyImprovements(assessedSkills);
    assessment.recommendations = await this.generateMasteryRecommendations(assessedSkills, assessment);
    assessment.nextSteps = this.generateNextSteps(assessedSkills, assessment);
    assessment.confidenceLevel = this.calculateConfidenceLevel(assessedSkills);

    this.masteryAssessments.set(assessment.id, assessment);
    this.currentAssessment = assessment;

    // Update mastery profile
    await this.updateMasteryProfile(assessment);

    await this.saveMasteryDataToStorage();
    this.emit('assessmentCompleted', assessment);

    return assessment;
  }

  private async assessSkill(skill: MasterySkill): Promise<{ score: number; confidence: number; evidence: string[] }> {
    let totalScore = 0;
    let weightSum = 0;
    const evidence: string[] = [];
    let confidenceSum = 0;

    // Assess each criterion
    for (const criterion of skill.assessmentCriteria) {
      const criterionScore = await this.evaluateCriterion(skill, criterion);
      totalScore += criterionScore.score * criterion.weight;
      weightSum += criterion.weight;
      confidenceSum += criterionScore.confidence;
      evidence.push(...criterionScore.evidence);
    }

    const normalizedScore = weightSum > 0 ? totalScore / weightSum : 0;
    const averageConfidence = skill.assessmentCriteria.length > 0 ? confidenceSum / skill.assessmentCriteria.length : 0;

    return {
      score: Math.min(skill.maxLevel, Math.round(normalizedScore)),
      confidence: averageConfidence,
      evidence
    };
  }

  private async evaluateCriterion(skill: MasterySkill, criterion: AssessmentCriterion): Promise<{ score: number; confidence: number; evidence: string[] }> {
    // This would normally involve more sophisticated evaluation
    // For now, we'll simulate based on progress markers and practice history
    
    const relevantMarkers = skill.progressMarkers.filter(marker => marker.achieved);
    const practiceHistory = skill.practiceExercises.flatMap(exercise => exercise.completions);
    
    let score = 0;
    let confidence = 0.5;
    const evidence: string[] = [];

    // Evaluate based on achieved markers
    if (relevantMarkers.length > 0) {
      const highestMarker = Math.max(...relevantMarkers.map(m => m.level));
      score = Math.min(criterion.benchmarks.length, highestMarker);
      confidence += 0.2;
      evidence.push(`Achieved ${relevantMarkers.length} progress markers`);
    }

    // Evaluate based on practice history
    if (practiceHistory.length > 0) {
      const recentPractice = practiceHistory.slice(-5);
      const averageQuality = recentPractice.reduce((sum, comp) => {
        const qualityScore = { poor: 1, fair: 2, good: 3, excellent: 4 }[comp.quality];
        return sum + qualityScore;
      }, 0) / recentPractice.length;

      if (averageQuality > 3) {
        score += 1;
        confidence += 0.2;
        evidence.push(`Recent practice shows excellent quality (${averageQuality.toFixed(1)}/4)`);
      } else if (averageQuality > 2.5) {
        score += 0.5;
        confidence += 0.1;
        evidence.push(`Recent practice shows good quality (${averageQuality.toFixed(1)}/4)`);
      }
    }

    // Evaluate based on time since last assessment
    const daysSinceAssessment = (Date.now() - skill.lastAssessed.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceAssessment > 30) {
      confidence -= 0.1; // Reduce confidence for stale assessments
      evidence.push(`Assessment may need update (${Math.round(daysSinceAssessment)} days old)`);
    }

    return {
      score: Math.max(0, Math.min(skill.maxLevel, score)),
      confidence: Math.max(0, Math.min(1, confidence)),
      evidence
    };
  }

  private async checkMilestoneAchievements(skill: MasterySkill, newLevel: number): Promise<void> {
    const newlyAchievedMarkers = skill.progressMarkers.filter(marker => 
      !marker.achieved && marker.level <= newLevel
    );

    for (const marker of newlyAchievedMarkers) {
      marker.achieved = true;
      marker.achievedDate = new Date();
      
      // Create achievement record
      if (this.masteryProfile) {
        const achievement: Achievement = {
          id: `achievement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'milestone',
          title: `${skill.name}: ${marker.title}`,
          description: marker.description,
          achievedDate: new Date(),
          significance: this.determineAchievementSignificance(marker.level, skill.maxLevel),
          evidence: marker.evidence,
          celebration: marker.celebrationNote || `Reached ${marker.title} in ${skill.name}!`,
          impact: `Advanced to level ${marker.level} in ${skill.name}`,
          sharable: true
        };

        this.masteryProfile.achievements.push(achievement);
        this.emit('milestoneAchieved', { skill, marker, achievement });
      }
    }
  }

  private determineAchievementSignificance(level: number, maxLevel: number): Achievement['significance'] {
    const percentage = level / maxLevel;
    if (percentage >= 0.9) return 'landmark';
    if (percentage >= 0.7) return 'major';
    if (percentage >= 0.4) return 'moderate';
    return 'minor';
  }

  private async updateSkillProgression(skillId: string, newLevel: number, confidence: number, evidence: string[]): Promise<void> {
    const progression = this.skillProgressions.get(skillId);
    if (!progression) return;

    // Add new progress point
    const progressPoint: ProgressPoint = {
      date: new Date(),
      level: newLevel,
      confidence,
      notes: `Level advancement to ${newLevel}`,
      context: 'assessment',
      evidence
    };

    progression.progressHistory.push(progressPoint);

    // Analyze trend
    progression.currentTrend = this.analyzeTrend(progression.progressHistory);

    // Update projections
    const skill = this.masterySkills.get(skillId);
    if (skill) {
      progression.projectedTimeline = this.calculateProjectedTimeline(skill, progression.progressHistory);
    }

    // Keep history manageable
    if (progression.progressHistory.length > 50) {
      progression.progressHistory = progression.progressHistory.slice(-50);
    }
  }

  private analyzeTrend(history: ProgressPoint[]): SkillProgression['currentTrend'] {
    if (history.length < 3) return 'steady';

    const recent = history.slice(-3);
    const older = history.slice(-6, -3);

    if (older.length === 0) return 'steady';

    const recentAvg = recent.reduce((sum, point) => sum + point.level, 0) / recent.length;
    const olderAvg = older.reduce((sum, point) => sum + point.level, 0) / older.length;

    const recentTime = (recent[recent.length - 1].date.getTime() - recent[0].date.getTime()) / (1000 * 60 * 60 * 24);
    const olderTime = (older[older.length - 1].date.getTime() - older[0].date.getTime()) / (1000 * 60 * 60 * 24);

    const recentRate = recentTime > 0 ? (recentAvg - recent[0].level) / recentTime : 0;
    const olderRate = olderTime > 0 ? (olderAvg - older[0].level) / olderTime : 0;

    if (recentRate > olderRate * 1.5) return 'accelerating';
    if (recentRate < olderRate * 0.5) return 'slowing';
    if (Math.abs(recentRate) < 0.01) return 'plateau';
    if (recentRate < 0) return 'declining';
    
    return 'steady';
  }

  private calculateProjectedTimeline(skill: MasterySkill, history?: ProgressPoint[]): ProjectedTimeline {
    const currentLevel = skill.currentLevel;
    const currentHistory = history || this.skillProgressions.get(skill.id)?.progressHistory || [];
    
    // Calculate average progression rate
    let avgRate = 0.1; // Default rate
    
    if (currentHistory.length >= 2) {
      const firstPoint = currentHistory[0];
      const lastPoint = currentHistory[currentHistory.length - 1];
      const timeDiff = (lastPoint.date.getTime() - firstPoint.date.getTime()) / (1000 * 60 * 60 * 24); // days
      const levelDiff = lastPoint.level - firstPoint.level;
      
      if (timeDiff > 0) {
        avgRate = levelDiff / timeDiff; // levels per day
      }
    }

    // Project next level
    const nextLevel = currentLevel + 1;
    const daysToNext = avgRate > 0 ? 1 / avgRate : 30; // Default 30 days if no progress
    const nextLevelDate = new Date(Date.now() + daysToNext * 24 * 60 * 60 * 1000);

    // Project mastery
    const levelsToMastery = skill.maxLevel - currentLevel;
    const daysToMastery = avgRate > 0 ? levelsToMastery / avgRate : levelsToMastery * 30;
    const masteryDate = new Date(Date.now() + daysToMastery * 24 * 60 * 60 * 1000);

    // Project milestones
    const milestones = [];
    const remainingMarkers = skill.progressMarkers.filter(marker => !marker.achieved && marker.level > currentLevel);
    
    for (const marker of remainingMarkers.slice(0, 3)) { // Next 3 milestones
      const daysToMilestone = avgRate > 0 ? (marker.level - currentLevel) / avgRate : (marker.level - currentLevel) * 30;
      const milestoneDate = new Date(Date.now() + daysToMilestone * 24 * 60 * 60 * 1000);
      
      milestones.push({
        level: marker.level,
        estimatedDate: milestoneDate,
        requirements: marker.indicators
      });
    }

    return {
      nextLevel: {
        level: nextLevel,
        estimatedDate: nextLevelDate,
        confidence: Math.min(0.9, Math.max(0.3, avgRate > 0 ? 0.7 : 0.4))
      },
      mastery: {
        estimatedDate: masteryDate,
        confidence: Math.min(0.8, Math.max(0.2, avgRate > 0 ? 0.6 : 0.3)),
        assumptions: [
          'Consistent practice maintained',
          'No major obstacles encountered',
          'Learning curve remains similar'
        ]
      },
      milestones
    };
  }

  private determinePersonalPattern(skill: MasterySkill): PersonalPattern {
    // This would normally be determined through user input and behavior analysis
    // For now, we'll provide reasonable defaults
    return {
      learningStyle: 'mixed',
      optimalPracticeFrequency: 'frequent',
      motivationFactors: ['progress_visibility', 'skill_application', 'peer_recognition'],
      challengePreferences: 'moderate_jumps',
      feedbackPreference: 'periodic',
      supportNeeds: ['clear_guidance', 'practice_opportunities', 'progress_tracking']
    };
  }

  private calculateTimeToNext(currentLevel: number, markers: ProgressMarker[]): number {
    const nextMarker = markers.find(marker => marker.level > currentLevel && !marker.achieved);
    if (!nextMarker) return 0;

    // Estimate based on level difference and typical progression
    const levelDiff = nextMarker.level - currentLevel;
    return levelDiff * 10; // Rough estimate: 10 hours per level
  }

  private calculateOverallScore(skillScores: Record<string, number>): number {
    const scores = Object.values(skillScores);
    return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
  }

  private identifyStrengths(skills: MasterySkill[]): string[] {
    const strengths: string[] = [];
    
    // Identify top-performing skills
    const topSkills = skills
      .filter(skill => skill.currentLevel >= skill.maxLevel * 0.7)
      .sort((a, b) => b.currentLevel - a.currentLevel)
      .slice(0, 3);

    topSkills.forEach(skill => {
      strengths.push(`Strong proficiency in ${skill.name} (Level ${skill.currentLevel}/${skill.maxLevel})`);
    });

    // Identify skill categories with consistent performance
    const categoryPerformance: Record<string, number[]> = {};
    skills.forEach(skill => {
      if (!categoryPerformance[skill.category]) {
        categoryPerformance[skill.category] = [];
      }
      categoryPerformance[skill.category].push(skill.currentLevel / skill.maxLevel);
    });

    Object.entries(categoryPerformance).forEach(([category, scores]) => {
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      if (avgScore > 0.6) {
        strengths.push(`Consistent strength in ${category} skills (${Math.round(avgScore * 100)}% average)`);
      }
    });

    return strengths;
  }

  private identifyImprovements(skills: MasterySkill[]): string[] {
    const improvements: string[] = [];
    
    // Identify lagging skills
    const laggingSkills = skills
      .filter(skill => skill.currentLevel < skill.maxLevel * 0.3)
      .sort((a, b) => a.currentLevel - b.currentLevel)
      .slice(0, 3);

    laggingSkills.forEach(skill => {
      improvements.push(`Focus needed on ${skill.name} (Level ${skill.currentLevel}/${skill.maxLevel})`);
    });

    // Identify stagnant skills
    const stagnantSkills = skills.filter(skill => {
      const daysSinceAssessment = (Date.now() - skill.lastAssessed.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceAssessment > 60 && skill.currentLevel < skill.maxLevel * 0.8;
    });

    stagnantSkills.forEach(skill => {
      improvements.push(`Refresh assessment for ${skill.name} (not evaluated recently)`);
    });

    return improvements;
  }

  private async generateMasteryRecommendations(skills: MasterySkill[], assessment: MasteryAssessment): Promise<MasteryRecommendation[]> {
    const recommendations: MasteryRecommendation[] = [];

    // Skill development recommendations
    const skillsNeedingWork = skills.filter(skill => skill.currentLevel < skill.maxLevel * 0.5);
    skillsNeedingWork.forEach(skill => {
      recommendations.push({
        id: `rec_${Date.now()}_${skill.id}`,
        type: 'skill_development',
        priority: skill.currentLevel < skill.maxLevel * 0.2 ? 'high' : 'medium',
        title: `Advance ${skill.name} Skills`,
        description: `Focus on developing ${skill.name} to reach the next milestone`,
        rationale: `Current level (${skill.currentLevel}/${skill.maxLevel}) indicates significant room for improvement`,
        implementation: {
          steps: [
            'Review current skill gaps',
            'Select targeted practice exercises',
            'Set daily practice routine',
            'Seek feedback regularly'
          ],
          timeframe: '2-4 weeks',
          resources: skill.learningResources.filter(resource => 
            resource.relevantLevels.includes(skill.currentLevel + 1)
          ).map(resource => resource.title),
          success_metrics: [`Reach level ${skill.currentLevel + 1}`, 'Complete milestone requirements']
        },
        expectedOutcome: `Improved proficiency in ${skill.name}`,
        personalAlignment: 0.8,
        effort: 'medium'
      });
    });

    // Practice increase recommendations
    const skillsWithLowPractice = skills.filter(skill => {
      const recentPractice = skill.practiceExercises.flatMap(ex => ex.completions)
        .filter(comp => comp.date > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
      return recentPractice.length < 5;
    });

    if (skillsWithLowPractice.length > 0) {
      recommendations.push({
        id: `rec_practice_${Date.now()}`,
        type: 'practice_increase',
        priority: 'medium',
        title: 'Increase Practice Frequency',
        description: 'Several skills show insufficient recent practice activity',
        rationale: `${skillsWithLowPractice.length} skills have less than 5 practice sessions in the past month`,
        implementation: {
          steps: [
            'Schedule daily practice blocks',
            'Choose varied exercise types',
            'Track practice consistency',
            'Review and adjust difficulty'
          ],
          timeframe: 'Ongoing',
          resources: ['Practice schedule template', 'Exercise variety guide'],
          success_metrics: ['15+ practice sessions per month per skill', 'Improved exercise quality scores']
        },
        expectedOutcome: 'Accelerated skill development through consistent practice',
        personalAlignment: 0.9,
        effort: 'high'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private generateNextSteps(skills: MasterySkill[], assessment: MasteryAssessment): string[] {
    const nextSteps: string[] = [];

    // Immediate actions
    const urgentSkills = skills.filter(skill => skill.currentLevel === 0);
    if (urgentSkills.length > 0) {
      nextSteps.push(`Begin foundational learning for: ${urgentSkills.map(s => s.name).join(', ')}`);
    }

    // Near-term goals
    const nearMilestones = skills.flatMap(skill => 
      skill.progressMarkers.filter(marker => 
        !marker.achieved && marker.level <= skill.currentLevel + 2
      )
    );

    if (nearMilestones.length > 0) {
      nextSteps.push(`Work towards ${nearMilestones.length} upcoming milestones in the next month`);
    }

    // Resource recommendations
    const recommendedResources = skills.flatMap(skill => 
      skill.learningResources.filter(resource => 
        resource.recommended && resource.relevantLevels.includes(skill.currentLevel + 1)
      )
    );

    if (recommendedResources.length > 0) {
      nextSteps.push(`Explore these recommended resources: ${recommendedResources.slice(0, 3).map(r => r.title).join(', ')}`);
    }

    // Assessment schedule
    const staleSkills = skills.filter(skill => {
      const daysSinceAssessment = (Date.now() - skill.lastAssessed.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceAssessment > 30;
    });

    if (staleSkills.length > 0) {
      nextSteps.push(`Schedule reassessment for ${staleSkills.length} skills with outdated evaluations`);
    }

    return nextSteps;
  }

  private calculateConfidenceLevel(skills: MasterySkill[]): number {
    // Calculate confidence based on assessment recency and evidence quality
    let totalConfidence = 0;
    let skillCount = 0;

    skills.forEach(skill => {
      const daysSinceAssessment = (Date.now() - skill.lastAssessed.getTime()) / (1000 * 60 * 60 * 24);
      const recencyFactor = Math.max(0.1, 1 - (daysSinceAssessment / 90)); // Decreases over 90 days
      
      const evidenceQuality = skill.progressMarkers.filter(m => m.achieved).length / skill.progressMarkers.length;
      
      const skillConfidence = (recencyFactor + evidenceQuality) / 2;
      totalConfidence += skillConfidence;
      skillCount++;
    });

    return skillCount > 0 ? totalConfidence / skillCount : 0.5;
  }

  private async updateMasteryProfile(assessment: MasteryAssessment): Promise<void> {
    if (!this.masteryProfile) return;

    // Update overall level
    this.masteryProfile.currentOverallLevel = assessment.overallScore;
    
    // Update skill counts
    const allSkills = Array.from(this.masterySkills.values());
    this.masteryProfile.totalSkills = allSkills.length;
    this.masteryProfile.masteredSkills = allSkills.filter(skill => skill.currentLevel >= skill.maxLevel * 0.8).length;
    this.masteryProfile.skillsInProgress = allSkills.filter(skill => skill.currentLevel > 0 && skill.currentLevel < skill.maxLevel * 0.8).length;

    // Update assessment count
    this.masteryProfile.totalAssessments = this.masteryAssessments.size;

    // Update strengths and growth areas
    this.masteryProfile.personalStrengths = assessment.strengths;
    this.masteryProfile.growthAreas = assessment.improvements;

    // Calculate total practice hours
    const totalHours = allSkills.reduce((sum, skill) => {
      return sum + skill.practiceExercises.reduce((exerciseSum, exercise) => {
        return exerciseSum + exercise.completions.reduce((compSum, comp) => compSum + comp.timeSpent, 0);
      }, 0);
    }, 0);
    
    this.masteryProfile.totalPracticeHours = Math.round(totalHours / 60); // Convert minutes to hours
  }

  private initializeDefaultSkills(): void {
    // Initialize with core writing skills if none exist
    if (this.masterySkills.size === 0) {
      const coreSkills = [
        {
          category: 'craft' as const,
          subcategory: 'character',
          name: 'Character Development',
          description: 'Creating compelling, multi-dimensional characters with clear motivations and growth arcs',
          maxLevel: 10,
          prerequisites: [],
          progressMarkers: [
            {
              level: 2,
              title: 'Basic Character Profiles',
              description: 'Can create simple character backgrounds and basic personality traits',
              indicators: ['Clear physical descriptions', 'Basic personality traits', 'Simple backstory'],
              achieved: false,
              evidence: []
            },
            {
              level: 5,
              title: 'Character Arcs',
              description: 'Develops characters that change and grow throughout the story',
              indicators: ['Clear character goals', 'Internal conflicts', 'Character growth', 'Believable motivations'],
              achieved: false,
              evidence: []
            },
            {
              level: 8,
              title: 'Complex Characterization',
              description: 'Creates multi-layered characters with psychological depth',
              indicators: ['Contradictory traits', 'Subtext in dialogue', 'Psychological realism', 'Cultural authenticity'],
              achieved: false,
              evidence: []
            }
          ],
          assessmentCriteria: [
            {
              id: 'char_consistency',
              category: 'application',
              criterion: 'Character consistency throughout story',
              weight: 0.3,
              evaluationMethod: 'work_analysis',
              benchmarks: [
                { level: 1, description: 'Characters occasionally inconsistent', examples: [], evidenceRequired: [] },
                { level: 5, description: 'Characters mostly consistent', examples: [], evidenceRequired: [] },
                { level: 10, description: 'Characters perfectly consistent', examples: [], evidenceRequired: [] }
              ],
              currentScore: 0,
              notes: ''
            }
          ],
          relatedSkills: ['dialogue', 'plot_structure'],
          learningResources: [
            {
              id: 'char_book_1',
              type: 'book',
              title: 'The Anatomy of Story by John Truby',
              description: 'Comprehensive guide to character development and story structure',
              difficulty: 'intermediate',
              timeInvestment: 20,
              relevantLevels: [3, 4, 5, 6],
              recommended: true
            }
          ],
          practiceExercises: [
            {
              id: 'char_ex_1',
              name: 'Character Interview',
              description: 'Conduct an in-depth interview with your character',
              type: 'reflection',
              difficulty: 'beginner',
              timeRequired: 30,
              targetLevels: [1, 2, 3],
              instructions: [
                'Choose a main character from your current work',
                'Prepare 20 personal questions',
                'Answer as if you are the character',
                'Note surprises or new insights'
              ],
              successCriteria: [
                'Answered all questions in character voice',
                'Discovered new character details',
                'Maintained character consistency'
              ],
              variations: [
                'Interview character in different moods',
                'Interview at different story points',
                'Have characters interview each other'
              ],
              completions: [],
              personalizedTips: []
            }
          ],
          masteryPath: {
            id: 'char_path_1',
            name: 'Character Mastery Path',
            description: 'Progressive development of character creation and development skills',
            phases: [
              {
                id: 'char_phase_1',
                phase: 1,
                name: 'Foundation',
                description: 'Basic character creation skills',
                objectives: ['Create believable characters', 'Understand character motivation'],
                requiredSkills: [],
                recommendedResources: ['Character development basics'],
                practiceProjects: ['Create 5 distinct characters'],
                assessmentMethods: ['Self-assessment', 'Peer feedback'],
                estimatedDuration: 40,
                prerequisites: [],
                outcomes: ['Solid character creation foundation']
              }
            ],
            totalEstimatedHours: 120,
            personalizedFor: 'General writing development',
            adaptations: [],
            alternativeRoutes: []
          },
          personalNotes: '',
          nextMilestone: 'Basic Character Profiles'
        }
      ];

      coreSkills.forEach(async (skillData) => {
        await this.createMasterySkill(skillData);
      });
    }
  }

  private initializeMasteryProfile(): void {
    if (!this.masteryProfile) {
      this.masteryProfile = {
        writerId: 'personal_writer',
        journeyStartDate: new Date(),
        currentOverallLevel: 0,
        maxPossibleLevel: 10,
        totalSkills: 0,
        masteredSkills: 0,
        skillsInProgress: 0,
        totalPracticeHours: 0,
        totalAssessments: 0,
        personalStrengths: [],
        growthAreas: [],
        uniqueAttributes: [],
        writingPhilosophy: 'Writing is a journey of continuous learning and self-expression',
        personalGoals: [],
        preferredGenres: [],
        writingVoice: {
          characteristics: [],
          evolution: [],
          distinctiveness: 0
        },
        achievements: [],
        certifications: [],
        mentorships: []
      };
    }
  }

  private schedulePeriodicAssessments(): void {
    // Schedule monthly skill reviews
    setInterval(() => {
      this.performAutomaticReview();
    }, 30 * 24 * 60 * 60 * 1000); // Every 30 days
  }

  private async performAutomaticReview(): Promise<void> {
    const allSkills = Array.from(this.masterySkills.values());
    const staleSkills = allSkills.filter(skill => {
      const daysSinceAssessment = (Date.now() - skill.lastAssessed.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceAssessment > 30;
    });

    if (staleSkills.length > 0) {
      this.emit('assessmentReminder', {
        message: `${staleSkills.length} skills need reassessment`,
        skills: staleSkills.map(skill => skill.name)
      });
    }
  }

  // Storage methods
  private async loadDataFromStorage(): Promise<void> {
    try {
      const storedSkills = localStorage.getItem('mastery_skills');
      if (storedSkills) {
        const skillsArray = JSON.parse(storedSkills);
        skillsArray.forEach((skill: any) => {
          skill.lastAssessed = new Date(skill.lastAssessed);
          skill.progressMarkers.forEach((marker: any) => {
            if (marker.achievedDate) marker.achievedDate = new Date(marker.achievedDate);
          });
          skill.practiceExercises.forEach((exercise: any) => {
            exercise.completions.forEach((comp: any) => {
              comp.date = new Date(comp.date);
            });
          });
          this.masterySkills.set(skill.id, skill);
        });
      }

      const storedAssessments = localStorage.getItem('mastery_assessments');
      if (storedAssessments) {
        const assessmentsArray = JSON.parse(storedAssessments);
        assessmentsArray.forEach((assessment: any) => {
          assessment.date = new Date(assessment.date);
          this.masteryAssessments.set(assessment.id, assessment);
        });
      }

      const storedProgressions = localStorage.getItem('skill_progressions');
      if (storedProgressions) {
        const progressionsData = JSON.parse(storedProgressions);
        Object.entries(progressionsData).forEach(([skillId, progression]: [string, any]) => {
          progression.progressHistory.forEach((point: any) => {
            point.date = new Date(point.date);
          });
          progression.projectedTimeline.nextLevel.estimatedDate = new Date(progression.projectedTimeline.nextLevel.estimatedDate);
          progression.projectedTimeline.mastery.estimatedDate = new Date(progression.projectedTimeline.mastery.estimatedDate);
          progression.projectedTimeline.milestones.forEach((milestone: any) => {
            milestone.estimatedDate = new Date(milestone.estimatedDate);
          });
          this.skillProgressions.set(skillId, progression);
        });
      }

      const storedProfile = localStorage.getItem('mastery_profile');
      if (storedProfile) {
        this.masteryProfile = JSON.parse(storedProfile);
        if (this.masteryProfile) {
          this.masteryProfile.journeyStartDate = new Date(this.masteryProfile.journeyStartDate);
          this.masteryProfile.achievements.forEach(achievement => {
            achievement.achievedDate = new Date(achievement.achievedDate);
          });
          this.masteryProfile.certifications.forEach(cert => {
            cert.dateEarned = new Date(cert.dateEarned);
            if (cert.validUntil) cert.validUntil = new Date(cert.validUntil);
          });
          this.masteryProfile.mentorships.forEach(mentorship => {
            mentorship.startDate = new Date(mentorship.startDate);
            if (mentorship.endDate) mentorship.endDate = new Date(mentorship.endDate);
          });
        }
      }
    } catch (error) {
      console.error('Error loading mastery data from storage:', error);
    }
  }

  private async saveMasteryDataToStorage(): Promise<void> {
    try {
      // Save skills
      const skillsArray = Array.from(this.masterySkills.values());
      localStorage.setItem('mastery_skills', JSON.stringify(skillsArray));

      // Save assessments
      const assessmentsArray = Array.from(this.masteryAssessments.values());
      localStorage.setItem('mastery_assessments', JSON.stringify(assessmentsArray));

      // Save progressions
      const progressionsData: Record<string, SkillProgression> = {};
      this.skillProgressions.forEach((progression, skillId) => {
        progressionsData[skillId] = progression;
      });
      localStorage.setItem('skill_progressions', JSON.stringify(progressionsData));

      // Save profile
      localStorage.setItem('mastery_profile', JSON.stringify(this.masteryProfile));
    } catch (error) {
      console.error('Error saving mastery data to storage:', error);
    }
  }

  // Public getter methods
  getMasterySkills(category?: string): MasterySkill[] {
    let skills = Array.from(this.masterySkills.values());
    
    if (category) {
      skills = skills.filter(skill => skill.category === category);
    }
    
    return skills.sort((a, b) => b.currentLevel - a.currentLevel);
  }

  getMasterySkill(skillId: string): MasterySkill | undefined {
    return this.masterySkills.get(skillId);
  }

  getSkillProgression(skillId: string): SkillProgression | undefined {
    return this.skillProgressions.get(skillId);
  }

  getMasteryAssessments(): MasteryAssessment[] {
    return Array.from(this.masteryAssessments.values())
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  getLatestAssessment(): MasteryAssessment | null {
    const assessments = this.getMasteryAssessments();
    return assessments.length > 0 ? assessments[0] : null;
  }

  getMasteryProfile(): WritingMasteryProfile | null {
    return this.masteryProfile;
  }

  async completeExercise(skillId: string, exerciseId: string, completion: Omit<ExerciseCompletion, 'date'>): Promise<void> {
    const skill = this.masterySkills.get(skillId);
    if (!skill) throw new Error('Skill not found');

    const exercise = skill.practiceExercises.find(ex => ex.id === exerciseId);
    if (!exercise) throw new Error('Exercise not found');

    const exerciseCompletion: ExerciseCompletion = {
      ...completion,
      date: new Date()
    };

    exercise.completions.push(exerciseCompletion);

    // Update practice hours in profile
    if (this.masteryProfile) {
      this.masteryProfile.totalPracticeHours += Math.round(completion.timeSpent / 60);
    }

    await this.saveMasteryDataToStorage();
    this.emit('exerciseCompleted', { skill, exercise, completion: exerciseCompletion });
  }

  async addLearningResource(skillId: string, resource: Omit<LearningResource, 'id'>): Promise<void> {
    const skill = this.masterySkills.get(skillId);
    if (!skill) throw new Error('Skill not found');

    const newResource: LearningResource = {
      ...resource,
      id: `resource_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    skill.learningResources.push(newResource);
    await this.saveMasteryDataToStorage();
    
    this.emit('resourceAdded', { skill, resource: newResource });
  }

  async updateSkillNotes(skillId: string, notes: string): Promise<void> {
    const skill = this.masterySkills.get(skillId);
    if (!skill) throw new Error('Skill not found');

    skill.personalNotes = notes;
    await this.saveMasteryDataToStorage();
    
    this.emit('skillNotesUpdated', skill);
  }
}

export const writingMasteryService = new WritingMasteryService();
export default writingMasteryService;