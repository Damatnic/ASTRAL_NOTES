import { EventEmitter } from 'events';

export interface WellnessMetric {
  id: string;
  type: 'mental' | 'physical' | 'emotional' | 'creative' | 'motivational';
  name: string;
  description: string;
  value: number;
  scale: { min: number; max: number; unit: string };
  timestamp: Date;
  context: WellnessContext;
  trend: 'improving' | 'stable' | 'declining';
  factors: string[];
  personalNotes?: string;
}

export interface WellnessContext {
  writingSession?: {
    duration: number;
    wordCount: number;
    quality: 'poor' | 'fair' | 'good' | 'excellent';
    type: 'creative' | 'editing' | 'planning' | 'research';
  };
  environment: {
    location: string;
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    distractions: string[];
    comfort: number;
  };
  personal: {
    sleepHours?: number;
    stressLevel: number;
    energyLevel: number;
    mood: string;
    lifeEvents: string[];
  };
  external: {
    deadlines: string[];
    socialSupport: number;
    workload: number;
    seasonalFactors: string[];
  };
}

export interface WellnessAssessment {
  id: string;
  date: Date;
  type: 'daily_checkin' | 'weekly_review' | 'monthly_deep_dive' | 'crisis_check' | 'celebration';
  metrics: WellnessMetric[];
  overallScore: number;
  insights: WellnessInsight[];
  recommendations: WellnessRecommendation[];
  goalAlignment: number;
  burnoutRisk: 'low' | 'moderate' | 'high' | 'critical';
  motivationLevel: number;
  nextAssessmentDate: Date;
  personalReflection?: string;
}

export interface WellnessInsight {
  id: string;
  category: 'pattern' | 'correlation' | 'trend' | 'opportunity' | 'warning' | 'achievement';
  insight: string;
  evidence: string[];
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  relatedMetrics: string[];
  dateDiscovered: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface WellnessRecommendation {
  id: string;
  type: 'immediate' | 'short_term' | 'long_term' | 'preventive' | 'emergency';
  category: 'rest' | 'exercise' | 'nutrition' | 'social' | 'creative' | 'professional' | 'therapeutic';
  title: string;
  description: string;
  rationale: string;
  implementation: {
    steps: string[];
    timeframe: string;
    difficulty: 'easy' | 'medium' | 'hard';
    resources: string[];
    accountability: string[];
  };
  expectedBenefit: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  personalizedAspects: string[];
  successMetrics: string[];
  followUpDate?: Date;
}

export interface MotivationProfile {
  id: string;
  personalityType: string;
  coreMotivators: MotivationFactor[];
  demotivators: string[];
  optimalConditions: OptimalCondition[];
  rewardPreferences: RewardPreference[];
  supportNeeds: string[];
  energyPatterns: EnergyPattern[];
  goalAlignment: GoalAlignmentFactor[];
  personalValues: string[];
  lastUpdated: Date;
}

export interface MotivationFactor {
  type: 'intrinsic' | 'extrinsic' | 'social' | 'achievement' | 'growth' | 'purpose';
  factor: string;
  strength: number;
  examples: string[];
  triggers: string[];
  sustainability: number;
}

export interface OptimalCondition {
  category: 'environment' | 'timing' | 'social' | 'physical' | 'mental';
  condition: string;
  importance: number;
  frequency: 'always' | 'often' | 'sometimes' | 'rarely';
  flexibility: number;
}

export interface RewardPreference {
  type: 'immediate' | 'delayed' | 'social' | 'material' | 'experiential' | 'recognition';
  preference: string;
  motivationPower: number;
  frequency: string;
  personalizedElements: string[];
}

export interface EnergyPattern {
  timeOfDay: string;
  dayOfWeek: string;
  energyLevel: number;
  creativityLevel: number;
  focusLevel: number;
  sustainabilityMinutes: number;
  factors: string[];
}

export interface GoalAlignmentFactor {
  goalType: string;
  alignmentScore: number;
  motivationFactors: string[];
  successPredictors: string[];
  challengeAreas: string[];
}

export interface StressIndicator {
  id: string;
  type: 'physiological' | 'behavioral' | 'cognitive' | 'emotional' | 'creative';
  indicator: string;
  severity: 'mild' | 'moderate' | 'severe';
  frequency: 'rare' | 'occasional' | 'frequent' | 'constant';
  triggers: string[];
  patterns: string[];
  interventions: string[];
  personalHistory: StressEvent[];
}

export interface StressEvent {
  date: Date;
  severity: number;
  duration: number;
  triggers: string[];
  resolution: string[];
  lessons: string[];
  preventionStrategy?: string;
}

export interface WellnessGoal {
  id: string;
  category: 'stress_reduction' | 'motivation_boost' | 'energy_optimization' | 'balance_improvement' | 'burnout_prevention';
  title: string;
  description: string;
  targetMetrics: { metricId: string; targetValue: number; timeframe: number }[];
  strategies: WellnessStrategy[];
  progress: WellnessGoalProgress[];
  status: 'active' | 'completed' | 'paused' | 'abandoned';
  priority: 'low' | 'medium' | 'high' | 'critical';
  startDate: Date;
  targetDate: Date;
  personalMotivation: string;
}

export interface WellnessStrategy {
  id: string;
  name: string;
  type: 'preventive' | 'reactive' | 'maintenance' | 'growth';
  description: string;
  implementation: string[];
  effectiveness: number;
  adherence: number;
  personalAdaptations: string[];
  barriers: string[];
  successFactors: string[];
}

export interface WellnessGoalProgress {
  date: Date;
  metricValues: { metricId: string; value: number }[];
  strategyAdherence: { strategyId: string; adherence: number }[];
  qualitativeNotes: string;
  barriers: string[];
  breakthroughs: string[];
  adjustments: string[];
}

export interface MotivationIntervention {
  id: string;
  trigger: 'low_motivation' | 'creative_block' | 'burnout_risk' | 'goal_drift' | 'routine_stagnation';
  intervention: string;
  type: 'immediate' | 'short_term' | 'long_term';
  effectiveness: number;
  personalizedElements: string[];
  timeToEffect: number;
  sustainabilityScore: number;
  prerequisites: string[];
  contraindications: string[];
}

export interface WellnessAlert {
  id: string;
  type: 'warning' | 'critical' | 'opportunity' | 'celebration';
  category: 'burnout' | 'motivation' | 'stress' | 'energy' | 'balance' | 'achievement';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  triggerConditions: string[];
  dismissible: boolean;
  timestamp: Date;
  acknowledged: boolean;
  actionTaken?: string;
}

class WritingWellnessService extends EventEmitter {
  private wellnessMetrics: Map<string, WellnessMetric[]> = new Map();
  private assessments: Map<string, WellnessAssessment> = new Map();
  private motivationProfile: MotivationProfile | null = null;
  private stressIndicators: Map<string, StressIndicator> = new Map();
  private wellnessGoals: Map<string, WellnessGoal> = new Map();
  private interventions: Map<string, MotivationIntervention> = new Map();
  private alerts: WellnessAlert[] = [];
  private currentWellnessState: any = {};

  constructor() {
    super();
    this.loadDataFromStorage();
    this.initializeDefaultMetrics();
    this.initializeMotivationProfile();
    this.scheduleRegularAssessments();
    this.setupAlertMonitoring();
  }

  async recordWellnessMetric(metricData: Omit<WellnessMetric, 'id' | 'timestamp' | 'trend'>): Promise<WellnessMetric> {
    const metric: WellnessMetric = {
      ...metricData,
      id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      trend: 'stable' // Will be calculated after storing
    };

    const metricHistory = this.wellnessMetrics.get(metric.name) || [];
    metricHistory.push(metric);
    
    // Calculate trend
    metric.trend = this.calculateMetricTrend(metricHistory, metric.name);
    
    this.wellnessMetrics.set(metric.name, metricHistory);
    await this.saveMetricsToStorage();

    // Update current wellness state
    this.updateCurrentWellnessState(metric);

    // Check for alerts
    await this.checkForWellnessAlerts(metric);

    this.emit('metricRecorded', metric);
    return metric;
  }

  private calculateMetricTrend(history: WellnessMetric[], metricName: string): 'improving' | 'stable' | 'declining' {
    if (history.length < 3) return 'stable';

    const recent = history.slice(-3);
    const older = history.slice(-6, -3);

    if (older.length === 0) return 'stable';

    const recentAvg = recent.reduce((sum, m) => sum + m.value, 0) / recent.length;
    const olderAvg = older.reduce((sum, m) => sum + m.value, 0) / older.length;

    const changeThreshold = 0.1; // 10% change threshold
    const relativeChange = (recentAvg - olderAvg) / olderAvg;

    if (relativeChange > changeThreshold) return 'improving';
    if (relativeChange < -changeThreshold) return 'declining';
    return 'stable';
  }

  private updateCurrentWellnessState(metric: WellnessMetric): void {
    this.currentWellnessState[metric.name] = {
      value: metric.value,
      trend: metric.trend,
      timestamp: metric.timestamp,
      context: metric.context
    };
  }

  async performWellnessAssessment(type: WellnessAssessment['type'] = 'daily_checkin'): Promise<WellnessAssessment> {
    const allMetrics = this.getCurrentMetrics();
    const insights = await this.generateWellnessInsights(allMetrics);
    const recommendations = await this.generateWellnessRecommendations(allMetrics, insights);
    
    const overallScore = this.calculateOverallWellnessScore(allMetrics);
    const burnoutRisk = this.assessBurnoutRisk(allMetrics);
    const motivationLevel = this.assessMotivationLevel(allMetrics);
    const goalAlignment = this.assessGoalAlignment();

    const assessment: WellnessAssessment = {
      id: `assessment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: new Date(),
      type,
      metrics: allMetrics,
      overallScore,
      insights,
      recommendations,
      goalAlignment,
      burnoutRisk,
      motivationLevel,
      nextAssessmentDate: this.calculateNextAssessmentDate(type)
    };

    this.assessments.set(assessment.id, assessment);
    await this.saveAssessmentsToStorage();

    // Generate alerts if needed
    if (burnoutRisk === 'high' || burnoutRisk === 'critical') {
      await this.createWellnessAlert('critical', 'burnout', 'High burnout risk detected. Immediate intervention recommended.');
    }

    if (motivationLevel < 0.3) {
      await this.createWellnessAlert('warning', 'motivation', 'Low motivation levels detected. Consider motivation interventions.');
    }

    this.emit('assessmentCompleted', assessment);
    return assessment;
  }

  private getCurrentMetrics(): WellnessMetric[] {
    const currentMetrics: WellnessMetric[] = [];
    
    this.wellnessMetrics.forEach((history, metricName) => {
      if (history.length > 0) {
        currentMetrics.push(history[history.length - 1]);
      }
    });

    return currentMetrics;
  }

  private async generateWellnessInsights(metrics: WellnessMetric[]): Promise<WellnessInsight[]> {
    const insights: WellnessInsight[] = [];

    // Analyze patterns
    const patterns = this.analyzeWellnessPatterns(metrics);
    patterns.forEach(pattern => {
      insights.push({
        id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        category: 'pattern',
        insight: pattern.description,
        evidence: pattern.evidence,
        confidence: pattern.confidence,
        impact: pattern.impact,
        actionable: pattern.actionable,
        relatedMetrics: pattern.relatedMetrics,
        dateDiscovered: new Date(),
        priority: pattern.priority
      });
    });

    // Analyze correlations
    const correlations = this.analyzeMetricCorrelations(metrics);
    correlations.forEach(correlation => {
      if (correlation.strength > 0.6) {
        insights.push({
          id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          category: 'correlation',
          insight: `Strong correlation detected: ${correlation.description}`,
          evidence: [`Correlation strength: ${correlation.strength}`, ...correlation.evidence],
          confidence: correlation.strength,
          impact: correlation.strength > 0.8 ? 'high' : 'medium',
          actionable: true,
          relatedMetrics: correlation.metrics,
          dateDiscovered: new Date(),
          priority: correlation.strength > 0.8 ? 'high' : 'medium'
        });
      }
    });

    // Analyze trends
    const trends = this.analyzeTrends(metrics);
    trends.forEach(trend => {
      insights.push({
        id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        category: 'trend',
        insight: trend.description,
        evidence: trend.evidence,
        confidence: trend.confidence,
        impact: trend.impact,
        actionable: true,
        relatedMetrics: [trend.metric],
        dateDiscovered: new Date(),
        priority: trend.impact === 'high' ? 'high' : 'medium'
      });
    });

    return insights;
  }

  private analyzeWellnessPatterns(metrics: WellnessMetric[]): any[] {
    const patterns: any[] = [];

    // Energy patterns
    const energyMetrics = metrics.filter(m => m.name === 'energy_level');
    if (energyMetrics.length > 0) {
      const timeOfDayAnalysis = this.analyzeTimeOfDayPatterns(energyMetrics);
      if (timeOfDayAnalysis.significance > 0.7) {
        patterns.push({
          description: `Energy levels are consistently ${timeOfDayAnalysis.trend} during ${timeOfDayAnalysis.optimalTime}`,
          evidence: timeOfDayAnalysis.evidence,
          confidence: timeOfDayAnalysis.significance,
          impact: 'medium',
          actionable: true,
          relatedMetrics: ['energy_level'],
          priority: 'medium'
        });
      }
    }

    // Stress patterns
    const stressMetrics = metrics.filter(m => m.name === 'stress_level');
    if (stressMetrics.length > 0) {
      const stressPatterns = this.analyzeStressPatterns(stressMetrics);
      stressPatterns.forEach(pattern => patterns.push(pattern));
    }

    return patterns;
  }

  private analyzeTimeOfDayPatterns(metrics: WellnessMetric[]): any {
    const timeGroups = {
      morning: [] as number[],
      afternoon: [] as number[],
      evening: [] as number[],
      night: [] as number[]
    };

    metrics.forEach(metric => {
      const timeOfDay = metric.context.environment.timeOfDay;
      timeGroups[timeOfDay].push(metric.value);
    });

    const averages = Object.entries(timeGroups).map(([time, values]) => ({
      time,
      average: values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0,
      count: values.length
    }));

    const maxAverage = Math.max(...averages.map(a => a.average));
    const optimalTime = averages.find(a => a.average === maxAverage)?.time || 'morning';
    const variance = this.calculateVariance(averages.map(a => a.average));

    return {
      optimalTime,
      trend: maxAverage > 7 ? 'highest' : 'better',
      significance: variance > 1 ? 0.8 : 0.5,
      evidence: [`${optimalTime} average: ${maxAverage.toFixed(1)}`, `Sample size: ${averages.find(a => a.time === optimalTime)?.count}`]
    };
  }

  private analyzeStressPatterns(stressMetrics: WellnessMetric[]): any[] {
    const patterns: any[] = [];

    // Identify stress triggers
    const triggerAnalysis: Record<string, { count: number; averageStress: number }> = {};
    
    stressMetrics.forEach(metric => {
      metric.factors.forEach(factor => {
        if (!triggerAnalysis[factor]) {
          triggerAnalysis[factor] = { count: 0, averageStress: 0 };
        }
        triggerAnalysis[factor].count++;
        triggerAnalysis[factor].averageStress += metric.value;
      });
    });

    Object.entries(triggerAnalysis).forEach(([trigger, data]) => {
      data.averageStress = data.averageStress / data.count;
      
      if (data.count >= 3 && data.averageStress > 6) {
        patterns.push({
          description: `"${trigger}" is a significant stress trigger (appears ${data.count} times, avg stress: ${data.averageStress.toFixed(1)})`,
          evidence: [`Frequency: ${data.count} occurrences`, `Average stress level: ${data.averageStress.toFixed(1)}/10`],
          confidence: Math.min(0.9, data.count / 5),
          impact: data.averageStress > 8 ? 'high' : 'medium',
          actionable: true,
          relatedMetrics: ['stress_level'],
          priority: data.averageStress > 8 ? 'high' : 'medium'
        });
      }
    });

    return patterns;
  }

  private analyzeMetricCorrelations(metrics: WellnessMetric[]): any[] {
    const correlations: any[] = [];
    const metricsByName: Record<string, WellnessMetric[]> = {};

    // Group metrics by name
    metrics.forEach(metric => {
      if (!metricsByName[metric.name]) {
        metricsByName[metric.name] = [];
      }
      metricsByName[metric.name].push(metric);
    });

    const metricNames = Object.keys(metricsByName);
    
    // Calculate correlations between different metrics
    for (let i = 0; i < metricNames.length; i++) {
      for (let j = i + 1; j < metricNames.length; j++) {
        const metric1 = metricNames[i];
        const metric2 = metricNames[j];
        
        const correlation = this.calculateCorrelation(metricsByName[metric1], metricsByName[metric2]);
        
        if (Math.abs(correlation.coefficient) > 0.6) {
          correlations.push({
            description: `${metric1} and ${metric2} are ${correlation.coefficient > 0 ? 'positively' : 'negatively'} correlated`,
            strength: Math.abs(correlation.coefficient),
            metrics: [metric1, metric2],
            evidence: [`Correlation coefficient: ${correlation.coefficient.toFixed(3)}`, `Based on ${correlation.sampleSize} data points`]
          });
        }
      }
    }

    return correlations;
  }

  private calculateCorrelation(metrics1: WellnessMetric[], metrics2: WellnessMetric[]): { coefficient: number; sampleSize: number } {
    // Find overlapping time periods
    const overlapping: Array<{ val1: number; val2: number }> = [];
    
    metrics1.forEach(m1 => {
      const corresponding = metrics2.find(m2 => 
        Math.abs(m2.timestamp.getTime() - m1.timestamp.getTime()) < 24 * 60 * 60 * 1000 // Within 24 hours
      );
      
      if (corresponding) {
        overlapping.push({ val1: m1.value, val2: corresponding.value });
      }
    });

    if (overlapping.length < 3) {
      return { coefficient: 0, sampleSize: overlapping.length };
    }

    // Calculate Pearson correlation coefficient
    const n = overlapping.length;
    const sum1 = overlapping.reduce((sum, pair) => sum + pair.val1, 0);
    const sum2 = overlapping.reduce((sum, pair) => sum + pair.val2, 0);
    const sum1Sq = overlapping.reduce((sum, pair) => sum + pair.val1 * pair.val1, 0);
    const sum2Sq = overlapping.reduce((sum, pair) => sum + pair.val2 * pair.val2, 0);
    const sumProducts = overlapping.reduce((sum, pair) => sum + pair.val1 * pair.val2, 0);

    const numerator = n * sumProducts - sum1 * sum2;
    const denominator = Math.sqrt((n * sum1Sq - sum1 * sum1) * (n * sum2Sq - sum2 * sum2));

    const coefficient = denominator === 0 ? 0 : numerator / denominator;
    
    return { coefficient, sampleSize: n };
  }

  private analyzeTrends(metrics: WellnessMetric[]): any[] {
    const trends: any[] = [];
    const metricsByName: Record<string, WellnessMetric[]> = {};

    metrics.forEach(metric => {
      if (!metricsByName[metric.name]) {
        metricsByName[metric.name] = [];
      }
      metricsByName[metric.name].push(metric);
    });

    Object.entries(metricsByName).forEach(([metricName, metricHistory]) => {
      if (metricHistory.length >= 5) {
        const trend = this.calculateTrendDirection(metricHistory);
        
        if (Math.abs(trend.slope) > 0.1) {
          trends.push({
            metric: metricName,
            description: `${metricName} is ${trend.slope > 0 ? 'improving' : 'declining'} over time (slope: ${trend.slope.toFixed(3)})`,
            evidence: [`Trend slope: ${trend.slope.toFixed(3)}`, `R-squared: ${trend.rSquared.toFixed(3)}`, `Data points: ${metricHistory.length}`],
            confidence: trend.rSquared,
            impact: Math.abs(trend.slope) > 0.2 ? 'high' : 'medium'
          });
        }
      }
    });

    return trends;
  }

  private calculateTrendDirection(metrics: WellnessMetric[]): { slope: number; rSquared: number } {
    const n = metrics.length;
    const xValues = metrics.map((_, index) => index);
    const yValues = metrics.map(m => m.value);

    const sumX = xValues.reduce((sum, x) => sum + x, 0);
    const sumY = yValues.reduce((sum, y) => sum + y, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
    const sumYY = yValues.reduce((sum, y) => sum + y * y, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const yMean = sumY / n;
    const ssTotal = yValues.reduce((sum, y) => sum + (y - yMean) ** 2, 0);
    const ssRes = yValues.reduce((sum, y, i) => {
      const predicted = slope * xValues[i] + intercept;
      return sum + (y - predicted) ** 2;
    }, 0);

    const rSquared = 1 - (ssRes / ssTotal);

    return { slope, rSquared };
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => (val - mean) ** 2);
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  private async generateWellnessRecommendations(metrics: WellnessMetric[], insights: WellnessInsight[]): Promise<WellnessRecommendation[]> {
    const recommendations: WellnessRecommendation[] = [];

    // Generate recommendations based on insights
    insights.forEach(insight => {
      if (insight.actionable && insight.priority !== 'low') {
        const recommendation = this.generateRecommendationFromInsight(insight);
        recommendations.push(recommendation);
      }
    });

    // Generate recommendations based on current metric levels
    const criticalMetrics = metrics.filter(m => this.isMetricCritical(m));
    criticalMetrics.forEach(metric => {
      const recommendation = this.generateCriticalMetricRecommendation(metric);
      recommendations.push(recommendation);
    });

    // Generate proactive recommendations
    const proactiveRecs = this.generateProactiveRecommendations(metrics);
    recommendations.push(...proactiveRecs);

    return recommendations.sort((a, b) => {
      const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
    });
  }

  private generateRecommendationFromInsight(insight: WellnessInsight): WellnessRecommendation {
    return {
      id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: insight.priority === 'urgent' ? 'immediate' : 'short_term',
      category: this.categorizInsight(insight),
      title: `Address: ${insight.insight}`,
      description: `Based on detected pattern: ${insight.insight}`,
      rationale: `Evidence: ${insight.evidence.join(', ')}. Confidence: ${Math.round(insight.confidence * 100)}%`,
      implementation: {
        steps: this.generateImplementationSteps(insight),
        timeframe: insight.priority === 'urgent' ? 'Immediate' : '1-2 weeks',
        difficulty: insight.impact === 'high' ? 'medium' : 'easy',
        resources: ['Personal reflection', 'Wellness tracking', 'Professional guidance if needed'],
        accountability: ['Daily check-ins', 'Weekly progress review']
      },
      expectedBenefit: `Improved wellness in ${insight.relatedMetrics.join(', ')} areas`,
      urgency: insight.priority === 'urgent' ? 'critical' : insight.priority === 'high' ? 'high' : 'medium',
      personalizedAspects: ['Tailored to your specific patterns', 'Based on your personal data'],
      successMetrics: insight.relatedMetrics
    };
  }

  private categorizInsight(insight: WellnessInsight): WellnessRecommendation['category'] {
    if (insight.relatedMetrics.includes('stress_level')) return 'rest';
    if (insight.relatedMetrics.includes('energy_level')) return 'exercise';
    if (insight.relatedMetrics.includes('motivation_level')) return 'creative';
    if (insight.relatedMetrics.includes('social_support')) return 'social';
    return 'professional';
  }

  private generateImplementationSteps(insight: WellnessInsight): string[] {
    const baseSteps = [
      'Acknowledge the identified pattern',
      'Monitor the specific factors mentioned',
      'Implement targeted interventions'
    ];

    if (insight.category === 'pattern' && insight.relatedMetrics.includes('stress_level')) {
      baseSteps.push('Practice stress reduction techniques during identified trigger times');
      baseSteps.push('Prepare coping strategies in advance');
    }

    if (insight.category === 'correlation') {
      baseSteps.push('Leverage positive correlations for better outcomes');
      baseSteps.push('Address negative correlations with targeted strategies');
    }

    return baseSteps;
  }

  private isMetricCritical(metric: WellnessMetric): boolean {
    const criticalThresholds = {
      stress_level: 8,
      burnout_risk: 7,
      energy_level: 3, // Low energy is critical
      motivation_level: 3,
      sleep_quality: 3
    };

    const threshold = criticalThresholds[metric.name as keyof typeof criticalThresholds];
    if (!threshold) return false;

    if (metric.name === 'energy_level' || metric.name === 'motivation_level' || metric.name === 'sleep_quality') {
      return metric.value <= threshold;
    } else {
      return metric.value >= threshold;
    }
  }

  private generateCriticalMetricRecommendation(metric: WellnessMetric): WellnessRecommendation {
    const criticalRecommendations = {
      stress_level: {
        title: 'Immediate Stress Management',
        description: 'Your stress levels are critically high and require immediate attention',
        steps: ['Take immediate break from current activities', 'Practice deep breathing or meditation', 'Consider professional support if stress persists', 'Identify and remove immediate stressors'],
        category: 'rest' as const
      },
      energy_level: {
        title: 'Energy Recovery Protocol',
        description: 'Your energy levels are critically low, affecting your writing ability',
        steps: ['Ensure adequate sleep (7-9 hours)', 'Review nutrition and hydration', 'Take regular breaks during writing', 'Consider light exercise or movement'],
        category: 'exercise' as const
      },
      motivation_level: {
        title: 'Motivation Revival Strategy',
        description: 'Your motivation is critically low, threatening your writing goals',
        steps: ['Reconnect with your writing purpose', 'Review and celebrate past achievements', 'Set smaller, achievable goals', 'Seek inspiration from preferred sources'],
        category: 'creative' as const
      }
    };

    const template = criticalRecommendations[metric.name as keyof typeof criticalRecommendations];
    
    return {
      id: `critical_rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'immediate',
      category: template?.category || 'professional',
      title: template?.title || `Address Critical ${metric.name}`,
      description: template?.description || `Your ${metric.name} requires immediate attention`,
      rationale: `Current level: ${metric.value}/${metric.scale.max}. This is below healthy thresholds.`,
      implementation: {
        steps: template?.steps || [`Address ${metric.name} immediately`, 'Monitor closely', 'Seek support if needed'],
        timeframe: 'Immediate',
        difficulty: 'easy',
        resources: ['Immediate environment changes', 'Self-care toolkit', 'Support network'],
        accountability: ['Hourly check-ins', 'Daily monitoring']
      },
      expectedBenefit: `Restoration of healthy ${metric.name} levels`,
      urgency: 'critical',
      personalizedAspects: [`Based on your current ${metric.name} reading`, 'Tailored to your specific situation'],
      successMetrics: [metric.name]
    };
  }

  private generateProactiveRecommendations(metrics: WellnessMetric[]): WellnessRecommendation[] {
    const recommendations: WellnessRecommendation[] = [];

    // Preventive burnout recommendation
    const stressLevel = metrics.find(m => m.name === 'stress_level')?.value || 0;
    const energyLevel = metrics.find(m => m.name === 'energy_level')?.value || 10;
    
    if (stressLevel > 6 || energyLevel < 5) {
      recommendations.push({
        id: `proactive_burnout_${Date.now()}`,
        type: 'preventive',
        category: 'rest',
        title: 'Burnout Prevention Strategy',
        description: 'Implement preventive measures to avoid burnout',
        rationale: 'Current stress and energy levels indicate increased burnout risk',
        implementation: {
          steps: [
            'Schedule regular breaks throughout writing sessions',
            'Implement stress management techniques',
            'Maintain work-life boundaries',
            'Monitor wellness metrics daily'
          ],
          timeframe: 'Ongoing',
          difficulty: 'medium',
          resources: ['Stress management toolkit', 'Schedule management', 'Wellness tracking'],
          accountability: ['Weekly wellness review', 'Monthly goal adjustment']
        },
        expectedBenefit: 'Sustained writing productivity and personal well-being',
        urgency: 'medium',
        personalizedAspects: ['Based on your stress patterns', 'Adapted to your writing schedule'],
        successMetrics: ['stress_level', 'energy_level', 'motivation_level']
      });
    }

    return recommendations;
  }

  private calculateOverallWellnessScore(metrics: WellnessMetric[]): number {
    if (metrics.length === 0) return 5; // Neutral score

    const weightedScores = metrics.map(metric => {
      const weight = this.getMetricWeight(metric.name);
      const normalizedScore = this.normalizeMetricScore(metric);
      return normalizedScore * weight;
    });

    const totalWeight = metrics.reduce((sum, metric) => sum + this.getMetricWeight(metric.name), 0);
    return weightedScores.reduce((sum, score) => sum + score, 0) / totalWeight;
  }

  private getMetricWeight(metricName: string): number {
    const weights = {
      stress_level: 1.2,
      energy_level: 1.1,
      motivation_level: 1.1,
      burnout_risk: 1.3,
      sleep_quality: 1.0,
      social_support: 0.9,
      creative_satisfaction: 1.0,
      goal_progress: 0.8
    };

    return weights[metricName as keyof typeof weights] || 1.0;
  }

  private normalizeMetricScore(metric: WellnessMetric): number {
    // Normalize to 0-10 scale where higher is better
    const { min, max } = metric.scale;
    const range = max - min;
    
    // For metrics where lower is better (like stress), invert the score
    const invertedMetrics = ['stress_level', 'burnout_risk'];
    let normalizedValue = (metric.value - min) / range * 10;
    
    if (invertedMetrics.includes(metric.name)) {
      normalizedValue = 10 - normalizedValue;
    }

    return Math.max(0, Math.min(10, normalizedValue));
  }

  private assessBurnoutRisk(metrics: WellnessMetric[]): 'low' | 'moderate' | 'high' | 'critical' {
    const stressLevel = metrics.find(m => m.name === 'stress_level')?.value || 0;
    const energyLevel = metrics.find(m => m.name === 'energy_level')?.value || 10;
    const motivationLevel = metrics.find(m => m.name === 'motivation_level')?.value || 10;

    // Calculate burnout risk score
    const riskScore = (stressLevel * 0.4) + ((10 - energyLevel) * 0.3) + ((10 - motivationLevel) * 0.3);

    if (riskScore >= 8) return 'critical';
    if (riskScore >= 6) return 'high';
    if (riskScore >= 4) return 'moderate';
    return 'low';
  }

  private assessMotivationLevel(metrics: WellnessMetric[]): number {
    const motivationMetric = metrics.find(m => m.name === 'motivation_level');
    const creativeMetric = metrics.find(m => m.name === 'creative_satisfaction');
    const goalMetric = metrics.find(m => m.name === 'goal_progress');

    const values = [motivationMetric?.value, creativeMetric?.value, goalMetric?.value].filter(v => v !== undefined);
    
    if (values.length === 0) return 0.5;
    
    const average = values.reduce((sum, val) => sum + (val || 0), 0) / values.length;
    return average / 10; // Normalize to 0-1
  }

  private assessGoalAlignment(): number {
    // This would integrate with the goal setting service
    // For now, return a placeholder calculation
    return 0.7;
  }

  private calculateNextAssessmentDate(type: WellnessAssessment['type']): Date {
    const now = new Date();
    const intervals = {
      daily_checkin: 1,
      weekly_review: 7,
      monthly_deep_dive: 30,
      crisis_check: 1,
      celebration: 7
    };

    const days = intervals[type];
    return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  }

  async createWellnessAlert(type: WellnessAlert['type'], category: WellnessAlert['category'], message: string, recommendations: string[] = []): Promise<WellnessAlert> {
    const alert: WellnessAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      category,
      message,
      severity: type === 'critical' ? 'critical' : type === 'warning' ? 'high' : 'medium',
      recommendations,
      triggerConditions: [], // Would be populated based on the triggering conditions
      dismissible: type !== 'critical',
      timestamp: new Date(),
      acknowledged: false
    };

    this.alerts.unshift(alert);
    
    // Keep only recent alerts
    this.alerts = this.alerts.slice(0, 50);
    
    await this.saveAlertsToStorage();
    this.emit('wellnessAlert', alert);
    
    return alert;
  }

  private async checkForWellnessAlerts(metric: WellnessMetric): Promise<void> {
    // Check for immediate alerts based on metric values
    if (this.isMetricCritical(metric)) {
      await this.createWellnessAlert(
        'critical',
        'stress',
        `Critical ${metric.name} level detected: ${metric.value}/${metric.scale.max}`,
        [`Immediate attention required for ${metric.name}`, 'Consider professional support if needed']
      );
    }

    // Check for trend-based alerts
    const history = this.wellnessMetrics.get(metric.name) || [];
    if (history.length >= 3) {
      const recentTrend = this.calculateMetricTrend(history, metric.name);
      if (recentTrend === 'declining' && metric.name !== 'stress_level') {
        await this.createWellnessAlert(
          'warning',
          'trend',
          `Declining trend detected in ${metric.name}`,
          [`Monitor ${metric.name} closely`, 'Consider intervention strategies']
        );
      }
    }
  }

  private setupAlertMonitoring(): void {
    // Monitor for patterns that require alerts
    setInterval(() => {
      this.performAutomaticWellnessMonitoring();
    }, 60 * 60 * 1000); // Every hour
  }

  private async performAutomaticWellnessMonitoring(): Promise<void> {
    const currentMetrics = this.getCurrentMetrics();
    
    // Check for sustained high stress
    const recentStressMetrics = this.wellnessMetrics.get('stress_level')?.slice(-24) || []; // Last 24 entries
    if (recentStressMetrics.length >= 5) {
      const averageStress = recentStressMetrics.reduce((sum, m) => sum + m.value, 0) / recentStressMetrics.length;
      if (averageStress > 7) {
        await this.createWellnessAlert(
          'warning',
          'stress',
          `Sustained high stress levels over recent period (average: ${averageStress.toFixed(1)})`,
          ['Implement stress reduction strategies', 'Consider taking a break', 'Review workload and expectations']
        );
      }
    }

    // Check for lack of progress
    const motivationMetrics = this.wellnessMetrics.get('motivation_level')?.slice(-7) || [];
    if (motivationMetrics.length >= 3) {
      const averageMotivation = motivationMetrics.reduce((sum, m) => sum + m.value, 0) / motivationMetrics.length;
      if (averageMotivation < 4) {
        await this.createWellnessAlert(
          'opportunity',
          'motivation',
          'Low motivation levels detected. Consider motivation boosting activities.',
          ['Review your writing goals', 'Celebrate recent achievements', 'Try new creative exercises', 'Connect with your writing community']
        );
      }
    }
  }

  private scheduleRegularAssessments(): void {
    // Schedule daily check-ins
    setInterval(() => {
      if (this.shouldPerformDailyCheckin()) {
        this.performWellnessAssessment('daily_checkin');
      }
    }, 60 * 60 * 1000); // Check every hour

    // Schedule weekly reviews
    setInterval(() => {
      if (this.shouldPerformWeeklyReview()) {
        this.performWellnessAssessment('weekly_review');
      }
    }, 24 * 60 * 60 * 1000); // Check daily
  }

  private shouldPerformDailyCheckin(): boolean {
    const today = new Date().toDateString();
    const todayAssessments = Array.from(this.assessments.values())
      .filter(a => a.date.toDateString() === today && a.type === 'daily_checkin');
    
    return todayAssessments.length === 0;
  }

  private shouldPerformWeeklyReview(): boolean {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentWeeklyReviews = Array.from(this.assessments.values())
      .filter(a => a.date > oneWeekAgo && a.type === 'weekly_review');
    
    return recentWeeklyReviews.length === 0;
  }

  private initializeDefaultMetrics(): void {
    // Initialize with baseline metrics if none exist
    if (this.wellnessMetrics.size === 0) {
      const baselineMetrics = [
        'stress_level',
        'energy_level',
        'motivation_level',
        'sleep_quality',
        'creative_satisfaction',
        'social_support',
        'goal_progress'
      ];

      baselineMetrics.forEach(metricName => {
        this.wellnessMetrics.set(metricName, []);
      });
    }
  }

  private initializeMotivationProfile(): void {
    if (!this.motivationProfile) {
      this.motivationProfile = {
        id: `profile_${Date.now()}`,
        personalityType: 'adaptive', // Would be determined through assessment
        coreMotivators: [
          {
            type: 'intrinsic',
            factor: 'personal_growth',
            strength: 0.8,
            examples: ['Learning new techniques', 'Improving writing quality'],
            triggers: ['Skill challenges', 'Creative exploration'],
            sustainability: 0.9
          }
        ],
        demotivators: ['Excessive criticism', 'Unrealistic deadlines', 'Isolation'],
        optimalConditions: [
          {
            category: 'environment',
            condition: 'Quiet, organized space',
            importance: 0.8,
            frequency: 'always',
            flexibility: 0.3
          }
        ],
        rewardPreferences: [
          {
            type: 'immediate',
            preference: 'Progress acknowledgment',
            motivationPower: 0.7,
            frequency: 'Daily',
            personalizedElements: ['Personal milestone celebration']
          }
        ],
        supportNeeds: ['Constructive feedback', 'Writing community', 'Mentorship'],
        energyPatterns: [
          {
            timeOfDay: 'morning',
            dayOfWeek: 'weekday',
            energyLevel: 8,
            creativityLevel: 9,
            focusLevel: 8,
            sustainabilityMinutes: 120,
            factors: ['Well-rested', 'Fresh mind', 'Minimal distractions']
          }
        ],
        goalAlignment: [
          {
            goalType: 'daily_writing',
            alignmentScore: 0.9,
            motivationFactors: ['Consistency', 'Progress tracking'],
            successPredictors: ['Clear schedule', 'Defined goals'],
            challengeAreas: ['Perfectionism', 'Time management']
          }
        ],
        personalValues: ['Authenticity', 'Growth', 'Impact', 'Balance'],
        lastUpdated: new Date()
      };
    }
  }

  // Storage methods
  private async loadDataFromStorage(): Promise<void> {
    await Promise.all([
      this.loadMetricsFromStorage(),
      this.loadAssessmentsFromStorage(),
      this.loadMotivationProfileFromStorage(),
      this.loadStressIndicatorsFromStorage(),
      this.loadWellnessGoalsFromStorage(),
      this.loadInterventionsFromStorage(),
      this.loadAlertsFromStorage()
    ]);
  }

  private async loadMetricsFromStorage(): Promise<void> {
    try {
      const stored = localStorage.getItem('wellness_metrics');
      if (stored) {
        const metricsData = JSON.parse(stored);
        Object.entries(metricsData).forEach(([metricName, history]: [string, any]) => {
          const processedHistory = history.map((metric: any) => ({
            ...metric,
            timestamp: new Date(metric.timestamp)
          }));
          this.wellnessMetrics.set(metricName, processedHistory);
        });
      }
    } catch (error) {
      console.error('Error loading wellness metrics from storage:', error);
    }
  }

  private async saveMetricsToStorage(): Promise<void> {
    try {
      const metricsData: Record<string, WellnessMetric[]> = {};
      this.wellnessMetrics.forEach((history, metricName) => {
        metricsData[metricName] = history;
      });
      localStorage.setItem('wellness_metrics', JSON.stringify(metricsData));
    } catch (error) {
      console.error('Error saving wellness metrics to storage:', error);
    }
  }

  private async loadAssessmentsFromStorage(): Promise<void> {
    try {
      const stored = localStorage.getItem('wellness_assessments');
      if (stored) {
        const assessmentsArray = JSON.parse(stored);
        assessmentsArray.forEach((assessment: any) => {
          assessment.date = new Date(assessment.date);
          assessment.nextAssessmentDate = new Date(assessment.nextAssessmentDate);
          assessment.metrics.forEach((metric: any) => {
            metric.timestamp = new Date(metric.timestamp);
          });
          assessment.insights.forEach((insight: any) => {
            insight.dateDiscovered = new Date(insight.dateDiscovered);
          });
          this.assessments.set(assessment.id, assessment);
        });
      }
    } catch (error) {
      console.error('Error loading wellness assessments from storage:', error);
    }
  }

  private async saveAssessmentsToStorage(): Promise<void> {
    try {
      const assessmentsArray = Array.from(this.assessments.values());
      localStorage.setItem('wellness_assessments', JSON.stringify(assessmentsArray));
    } catch (error) {
      console.error('Error saving wellness assessments to storage:', error);
    }
  }

  private async loadMotivationProfileFromStorage(): Promise<void> {
    try {
      const stored = localStorage.getItem('motivation_profile');
      if (stored) {
        this.motivationProfile = JSON.parse(stored);
        if (this.motivationProfile) {
          this.motivationProfile.lastUpdated = new Date(this.motivationProfile.lastUpdated);
        }
      }
    } catch (error) {
      console.error('Error loading motivation profile from storage:', error);
    }
  }

  private async saveMotivationProfileToStorage(): Promise<void> {
    try {
      localStorage.setItem('motivation_profile', JSON.stringify(this.motivationProfile));
    } catch (error) {
      console.error('Error saving motivation profile to storage:', error);
    }
  }

  private async loadStressIndicatorsFromStorage(): Promise<void> {
    try {
      const stored = localStorage.getItem('stress_indicators');
      if (stored) {
        const indicatorsArray = JSON.parse(stored);
        indicatorsArray.forEach((indicator: any) => {
          indicator.personalHistory.forEach((event: any) => {
            event.date = new Date(event.date);
          });
          this.stressIndicators.set(indicator.id, indicator);
        });
      }
    } catch (error) {
      console.error('Error loading stress indicators from storage:', error);
    }
  }

  private async saveStressIndicatorsToStorage(): Promise<void> {
    try {
      const indicatorsArray = Array.from(this.stressIndicators.values());
      localStorage.setItem('stress_indicators', JSON.stringify(indicatorsArray));
    } catch (error) {
      console.error('Error saving stress indicators to storage:', error);
    }
  }

  private async loadWellnessGoalsFromStorage(): Promise<void> {
    try {
      const stored = localStorage.getItem('wellness_goals');
      if (stored) {
        const goalsArray = JSON.parse(stored);
        goalsArray.forEach((goal: any) => {
          goal.startDate = new Date(goal.startDate);
          goal.targetDate = new Date(goal.targetDate);
          goal.progress.forEach((progress: any) => {
            progress.date = new Date(progress.date);
          });
          this.wellnessGoals.set(goal.id, goal);
        });
      }
    } catch (error) {
      console.error('Error loading wellness goals from storage:', error);
    }
  }

  private async saveWellnessGoalsToStorage(): Promise<void> {
    try {
      const goalsArray = Array.from(this.wellnessGoals.values());
      localStorage.setItem('wellness_goals', JSON.stringify(goalsArray));
    } catch (error) {
      console.error('Error saving wellness goals to storage:', error);
    }
  }

  private async loadInterventionsFromStorage(): Promise<void> {
    try {
      const stored = localStorage.getItem('motivation_interventions');
      if (stored) {
        const interventionsArray = JSON.parse(stored);
        interventionsArray.forEach((intervention: any) => {
          this.interventions.set(intervention.id, intervention);
        });
      }
    } catch (error) {
      console.error('Error loading motivation interventions from storage:', error);
    }
  }

  private async saveInterventionsToStorage(): Promise<void> {
    try {
      const interventionsArray = Array.from(this.interventions.values());
      localStorage.setItem('motivation_interventions', JSON.stringify(interventionsArray));
    } catch (error) {
      console.error('Error saving motivation interventions to storage:', error);
    }
  }

  private async loadAlertsFromStorage(): Promise<void> {
    try {
      const stored = localStorage.getItem('wellness_alerts');
      if (stored) {
        this.alerts = JSON.parse(stored).map((alert: any) => ({
          ...alert,
          timestamp: new Date(alert.timestamp)
        }));
      }
    } catch (error) {
      console.error('Error loading wellness alerts from storage:', error);
    }
  }

  private async saveAlertsToStorage(): Promise<void> {
    try {
      localStorage.setItem('wellness_alerts', JSON.stringify(this.alerts));
    } catch (error) {
      console.error('Error saving wellness alerts to storage:', error);
    }
  }

  // Public getter methods
  getWellnessMetrics(metricName?: string): WellnessMetric[] {
    if (metricName) {
      return this.wellnessMetrics.get(metricName) || [];
    }
    
    const allMetrics: WellnessMetric[] = [];
    this.wellnessMetrics.forEach(history => {
      allMetrics.push(...history);
    });
    
    return allMetrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getLatestAssessment(): WellnessAssessment | null {
    const assessments = Array.from(this.assessments.values());
    if (assessments.length === 0) return null;
    
    return assessments.sort((a, b) => b.date.getTime() - a.date.getTime())[0];
  }

  getAssessments(type?: WellnessAssessment['type']): WellnessAssessment[] {
    let assessments = Array.from(this.assessments.values());
    
    if (type) {
      assessments = assessments.filter(a => a.type === type);
    }
    
    return assessments.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  getMotivationProfile(): MotivationProfile | null {
    return this.motivationProfile;
  }

  getWellnessAlerts(acknowledged?: boolean): WellnessAlert[] {
    let alerts = [...this.alerts];
    
    if (acknowledged !== undefined) {
      alerts = alerts.filter(alert => alert.acknowledged === acknowledged);
    }
    
    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async acknowledgeAlert(alertId: string, actionTaken?: string): Promise<void> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      if (actionTaken) {
        alert.actionTaken = actionTaken;
      }
      await this.saveAlertsToStorage();
      this.emit('alertAcknowledged', alert);
    }
  }

  getCurrentWellnessState(): any {
    return { ...this.currentWellnessState };
  }

  async updateMotivationProfile(updates: Partial<MotivationProfile>): Promise<void> {
    if (this.motivationProfile) {
      this.motivationProfile = { ...this.motivationProfile, ...updates, lastUpdated: new Date() };
      await this.saveMotivationProfileToStorage();
      this.emit('motivationProfileUpdated', this.motivationProfile);
    }
  }
}

export const writingWellnessService = new WritingWellnessService();
export default writingWellnessService;