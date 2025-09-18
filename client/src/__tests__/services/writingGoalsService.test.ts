/**
 * Writing Goals Service Tests
 * Comprehensive testing for goal tracking, analytics, and productivity features
 */

import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { writingGoalsService } from '@/services/writingGoalsService';
import type { WritingGoal, WritingSession, WritingHabit, Achievement } from '@/services/writingGoalsService';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock performance.now for consistent timing
Object.defineProperty(window, 'performance', {
  value: { now: vi.fn(() => Date.now()) },
  writable: true,
});

describe('WritingGoalsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('Goal Management', () => {
    test('should create a new goal', () => {
      const goalData = {
        title: 'Write 1000 words daily',
        description: 'Daily writing goal',
        type: 'daily' as const,
        targetType: 'words' as const,
        targetValue: 1000,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        status: 'active' as const,
        priority: 'high' as const
      };

      const eventSpy = vi.fn();
      writingGoalsService.on('goalCreated', eventSpy);

      const goal = writingGoalsService.createGoal(goalData);

      expect(goal.id).toMatch(/^goal-\d+-[a-z0-9]+$/);
      expect(goal.title).toBe(goalData.title);
      expect(goal.currentValue).toBe(0);
      expect(goal.streak).toBe(0);
      expect(goal.bestStreak).toBe(0);
      expect(goal.createdAt).toBeInstanceOf(Date);
      expect(goal.updatedAt).toBeInstanceOf(Date);
      expect(eventSpy).toHaveBeenCalledWith(goal);
    });

    test('should get all goals', () => {
      const goalData = {
        title: 'Test Goal',
        type: 'daily' as const,
        targetType: 'words' as const,
        targetValue: 500,
        startDate: new Date(),
        endDate: new Date(),
        status: 'active' as const,
        priority: 'medium' as const
      };

      writingGoalsService.createGoal(goalData);
      const goals = writingGoalsService.getAllGoals();

      expect(goals.length).toBe(1);
      expect(goals[0].title).toBe('Test Goal');
    });

    test('should get goal by ID', () => {
      const goalData = {
        title: 'Find Me',
        type: 'weekly' as const,
        targetType: 'time' as const,
        targetValue: 480, // 8 hours
        startDate: new Date(),
        endDate: new Date(),
        status: 'active' as const,
        priority: 'low' as const
      };

      const goal = writingGoalsService.createGoal(goalData);
      const foundGoal = writingGoalsService.getGoal(goal.id);

      expect(foundGoal).not.toBeNull();
      expect(foundGoal?.title).toBe('Find Me');
    });

    test('should return null for non-existent goal', () => {
      const goal = writingGoalsService.getGoal('non-existent-id');
      expect(goal).toBeNull();
    });

    test('should update goal', () => {
      const goal = writingGoalsService.createGoal({
        title: 'Original Title',
        type: 'daily' as const,
        targetType: 'words' as const,
        targetValue: 500,
        startDate: new Date(),
        endDate: new Date(),
        status: 'active' as const,
        priority: 'medium' as const
      });

      const eventSpy = vi.fn();
      writingGoalsService.on('goalUpdated', eventSpy);

      const updatedGoal = writingGoalsService.updateGoal(goal.id, {
        title: 'Updated Title',
        currentValue: 250
      });

      expect(updatedGoal).not.toBeNull();
      expect(updatedGoal?.title).toBe('Updated Title');
      expect(updatedGoal?.currentValue).toBe(250);
      expect(eventSpy).toHaveBeenCalledWith(updatedGoal);
    });

    test('should complete goal when target is reached', () => {
      const goal = writingGoalsService.createGoal({
        title: 'Complete Me',
        type: 'project' as const,
        targetType: 'words' as const,
        targetValue: 1000,
        startDate: new Date(),
        endDate: new Date(),
        status: 'active' as const,
        priority: 'high' as const
      });

      const completedSpy = vi.fn();
      writingGoalsService.on('goalCompleted', completedSpy);

      // Update to complete the goal
      writingGoalsService.updateGoal(goal.id, { currentValue: 1000 });

      expect(completedSpy).toHaveBeenCalled();
      const updatedGoal = writingGoalsService.getGoal(goal.id);
      expect(updatedGoal?.status).toBe('completed');
    });

    test('should delete goal', () => {
      const goal = writingGoalsService.createGoal({
        title: 'Delete Me',
        type: 'daily' as const,
        targetType: 'words' as const,
        targetValue: 500,
        startDate: new Date(),
        endDate: new Date(),
        status: 'active' as const,
        priority: 'medium' as const
      });

      const eventSpy = vi.fn();
      writingGoalsService.on('goalDeleted', eventSpy);

      const success = writingGoalsService.deleteGoal(goal.id);
      expect(success).toBe(true);
      expect(eventSpy).toHaveBeenCalledWith({ goalId: goal.id, goal });

      const deletedGoal = writingGoalsService.getGoal(goal.id);
      expect(deletedGoal).toBeNull();
    });

    test('should get active goals only', () => {
      writingGoalsService.createGoal({
        title: 'Active Goal',
        type: 'daily' as const,
        targetType: 'words' as const,
        targetValue: 500,
        startDate: new Date(),
        endDate: new Date(),
        status: 'active' as const,
        priority: 'medium' as const
      });

      const completedGoal = writingGoalsService.createGoal({
        title: 'Completed Goal',
        type: 'daily' as const,
        targetType: 'words' as const,
        targetValue: 500,
        startDate: new Date(),
        endDate: new Date(),
        status: 'completed' as const,
        priority: 'medium' as const
      });

      const activeGoals = writingGoalsService.getActiveGoals();
      expect(activeGoals.length).toBe(1);
      expect(activeGoals[0].title).toBe('Active Goal');
    });

    test('should get goals by project', () => {
      const projectId = 'test-project-123';

      writingGoalsService.createGoal({
        title: 'Project Goal',
        type: 'project' as const,
        targetType: 'words' as const,
        targetValue: 5000,
        startDate: new Date(),
        endDate: new Date(),
        status: 'active' as const,
        priority: 'high' as const,
        projectId
      });

      writingGoalsService.createGoal({
        title: 'General Goal',
        type: 'daily' as const,
        targetType: 'words' as const,
        targetValue: 500,
        startDate: new Date(),
        endDate: new Date(),
        status: 'active' as const,
        priority: 'medium' as const
      });

      const projectGoals = writingGoalsService.getGoalsByProject(projectId);
      expect(projectGoals.length).toBe(1);
      expect(projectGoals[0].title).toBe('Project Goal');
    });
  });

  describe('Session Management', () => {
    test('should start a new session', () => {
      const eventSpy = vi.fn();
      writingGoalsService.on('sessionStarted', eventSpy);

      const session = writingGoalsService.startSession();

      expect(session.id).toMatch(/^session-\d+-[a-z0-9]+$/);
      expect(session.startTime).toBeInstanceOf(Date);
      expect(session.duration).toBe(0);
      expect(session.wordsWritten).toBe(0);
      expect(session.mood).toBe('neutral');
      expect(session.quality).toBe(3);
      expect(eventSpy).toHaveBeenCalledWith(session);
    });

    test('should start session with goal and project', () => {
      const goalId = 'test-goal-123';
      const projectId = 'test-project-456';

      const session = writingGoalsService.startSession(goalId, projectId);

      expect(session.goalId).toBe(goalId);
      expect(session.projectId).toBe(projectId);
    });

    test('should end existing session when starting new one', () => {
      const endSpy = vi.fn();
      writingGoalsService.on('sessionEnded', endSpy);

      writingGoalsService.startSession();
      writingGoalsService.startSession(); // This should end the first session

      expect(endSpy).toHaveBeenCalledTimes(1);
    });

    test('should update current session', () => {
      writingGoalsService.startSession();

      const eventSpy = vi.fn();
      writingGoalsService.on('sessionUpdated', eventSpy);

      const updatedSession = writingGoalsService.updateSession({
        wordsWritten: 250,
        mood: 'inspired',
        quality: 4
      });

      expect(updatedSession).not.toBeNull();
      expect(updatedSession?.wordsWritten).toBe(250);
      expect(updatedSession?.mood).toBe('inspired');
      expect(updatedSession?.quality).toBe(4);
      expect(eventSpy).toHaveBeenCalledWith(updatedSession);
    });

    test('should update session duration automatically', () => {
      const startTime = new Date('2024-01-01T10:00:00Z');
      vi.setSystemTime(startTime);

      writingGoalsService.startSession();

      // Advance time by 30 minutes
      vi.setSystemTime(new Date('2024-01-01T10:30:00Z'));

      const session = writingGoalsService.updateSession({ wordsWritten: 100 });
      expect(session?.duration).toBe(30);
    });

    test('should end session', () => {
      const startTime = new Date('2024-01-01T10:00:00Z');
      vi.setSystemTime(startTime);

      writingGoalsService.startSession();
      writingGoalsService.updateSession({ wordsWritten: 500 });

      // Advance time by 45 minutes
      vi.setSystemTime(new Date('2024-01-01T10:45:00Z'));

      const eventSpy = vi.fn();
      writingGoalsService.on('sessionEnded', eventSpy);

      const endedSession = writingGoalsService.endSession();

      expect(endedSession).not.toBeNull();
      expect(endedSession?.endTime).toBeInstanceOf(Date);
      expect(endedSession?.duration).toBe(45);
      expect(endedSession?.wordsWritten).toBe(500);
      expect(eventSpy).toHaveBeenCalledWith(endedSession);

      // Current session should be null after ending
      const currentSession = writingGoalsService.getCurrentSession();
      expect(currentSession).toBeNull();
    });

    test('should get all sessions', () => {
      writingGoalsService.startSession();
      writingGoalsService.updateSession({ wordsWritten: 100 });
      writingGoalsService.endSession();

      writingGoalsService.startSession();
      writingGoalsService.updateSession({ wordsWritten: 200 });
      writingGoalsService.endSession();

      const sessions = writingGoalsService.getAllSessions();
      expect(sessions.length).toBe(2);
      expect(sessions[0].wordsWritten).toBe(100);
      expect(sessions[1].wordsWritten).toBe(200);
    });

    test('should get sessions by date range', () => {
      const day1 = new Date('2024-01-01T10:00:00Z');
      const day2 = new Date('2024-01-02T10:00:00Z');
      const day3 = new Date('2024-01-03T10:00:00Z');

      // Session on day 1
      vi.setSystemTime(day1);
      writingGoalsService.startSession();
      writingGoalsService.endSession();

      // Session on day 2
      vi.setSystemTime(day2);
      writingGoalsService.startSession();
      writingGoalsService.endSession();

      // Session on day 3
      vi.setSystemTime(day3);
      writingGoalsService.startSession();
      writingGoalsService.endSession();

      const sessionsDay1to2 = writingGoalsService.getSessionsByDateRange(
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-02T23:59:59Z')
      );

      expect(sessionsDay1to2.length).toBe(2);
    });

    test('should update goals when words are written', () => {
      const goal = writingGoalsService.createGoal({
        title: 'Word Goal',
        type: 'daily' as const,
        targetType: 'words' as const,
        targetValue: 1000,
        startDate: new Date(),
        endDate: new Date(),
        status: 'active' as const,
        priority: 'medium' as const
      });

      writingGoalsService.startSession(goal.id);
      writingGoalsService.updateSession({ wordsWritten: 500 });

      const updatedGoal = writingGoalsService.getGoal(goal.id);
      expect(updatedGoal?.currentValue).toBe(500);
    });
  });

  describe('Habit Management', () => {
    test('should create a new habit', () => {
      const habitData = {
        name: 'Daily Writing',
        description: 'Write every day',
        frequency: 'daily' as const,
        targetValue: 1,
        isActive: true
      };

      const eventSpy = vi.fn();
      writingGoalsService.on('habitCreated', eventSpy);

      const habit = writingGoalsService.createHabit(habitData);

      expect(habit.id).toMatch(/^habit-\d+-[a-z0-9]+$/);
      expect(habit.name).toBe(habitData.name);
      expect(habit.currentStreak).toBe(0);
      expect(habit.bestStreak).toBe(0);
      expect(habit.completionHistory).toEqual([]);
      expect(eventSpy).toHaveBeenCalledWith(habit);
    });

    test('should complete habit for today', () => {
      const habit = writingGoalsService.createHabit({
        name: 'Daily Writing',
        description: 'Write every day',
        frequency: 'daily' as const,
        targetValue: 1,
        isActive: true
      });

      const eventSpy = vi.fn();
      writingGoalsService.on('habitCompleted', eventSpy);

      const success = writingGoalsService.completeHabit(habit.id);
      expect(success).toBe(true);
      expect(eventSpy).toHaveBeenCalled();

      // Check that habit was updated
      const updatedHabit = writingGoalsService.getGoal(habit.id);
      expect(habit.completionHistory.length).toBe(1);
      expect(habit.currentStreak).toBe(1);
    });

    test('should not complete habit twice in same day', () => {
      const habit = writingGoalsService.createHabit({
        name: 'Daily Writing',
        description: 'Write every day',
        frequency: 'daily' as const,
        targetValue: 1,
        isActive: true
      });

      // Complete once
      const success1 = writingGoalsService.completeHabit(habit.id);
      expect(success1).toBe(true);

      // Try to complete again same day
      const success2 = writingGoalsService.completeHabit(habit.id);
      expect(success2).toBe(false);

      expect(habit.completionHistory.length).toBe(1);
    });

    test('should calculate streak correctly', () => {
      const habit = writingGoalsService.createHabit({
        name: 'Streak Test',
        description: 'Test streak calculation',
        frequency: 'daily' as const,
        targetValue: 1,
        isActive: true
      });

      // Complete habit for 3 consecutive days
      const day1 = new Date('2024-01-01T10:00:00Z');
      const day2 = new Date('2024-01-02T10:00:00Z');
      const day3 = new Date('2024-01-03T10:00:00Z');

      vi.setSystemTime(day1);
      writingGoalsService.completeHabit(habit.id);
      expect(habit.currentStreak).toBe(1);

      vi.setSystemTime(day2);
      writingGoalsService.completeHabit(habit.id);
      expect(habit.currentStreak).toBe(2);

      vi.setSystemTime(day3);
      writingGoalsService.completeHabit(habit.id);
      expect(habit.currentStreak).toBe(3);
      expect(habit.bestStreak).toBe(3);
    });
  });

  describe('Analytics & Metrics', () => {
    test('should calculate basic productivity metrics', () => {
      // Create some test sessions
      const sessions = [
        { wordsWritten: 500, duration: 30 },
        { wordsWritten: 750, duration: 45 },
        { wordsWritten: 300, duration: 20 }
      ];

      sessions.forEach(({ wordsWritten, duration }) => {
        writingGoalsService.startSession();
        writingGoalsService.updateSession({ wordsWritten });
        // Mock duration
        const currentSession = writingGoalsService.getCurrentSession();
        if (currentSession) {
          currentSession.duration = duration;
        }
        writingGoalsService.endSession();
      });

      const metrics = writingGoalsService.getProductivityMetrics();

      expect(metrics.totalWordsWritten).toBe(1550);
      expect(metrics.totalTimeSpent).toBe(95);
      expect(metrics.totalSessions).toBe(3);
      expect(metrics.averageWordsPerMinute).toBeCloseTo(16.32, 2);
      expect(metrics.averageSessionLength).toBeCloseTo(31.67, 2);
    });

    test('should calculate productivity metrics with date range', () => {
      const oldDate = new Date('2024-01-01T10:00:00Z');
      const newDate = new Date('2024-01-15T10:00:00Z');

      // Old session
      vi.setSystemTime(oldDate);
      writingGoalsService.startSession();
      writingGoalsService.updateSession({ wordsWritten: 200 });
      writingGoalsService.endSession();

      // New session
      vi.setSystemTime(newDate);
      writingGoalsService.startSession();
      writingGoalsService.updateSession({ wordsWritten: 800 });
      writingGoalsService.endSession();

      const metrics = writingGoalsService.getProductivityMetrics({
        start: new Date('2024-01-10T00:00:00Z'),
        end: new Date('2024-01-20T00:00:00Z')
      });

      expect(metrics.totalWordsWritten).toBe(800); // Only new session
      expect(metrics.totalSessions).toBe(1);
    });

    test('should calculate current streak', () => {
      const today = new Date('2024-01-03T10:00:00Z');
      const yesterday = new Date('2024-01-02T10:00:00Z');
      const dayBefore = new Date('2024-01-01T10:00:00Z');

      // Write for 3 consecutive days
      vi.setSystemTime(dayBefore);
      writingGoalsService.startSession();
      writingGoalsService.updateSession({ wordsWritten: 100 });
      writingGoalsService.endSession();

      vi.setSystemTime(yesterday);
      writingGoalsService.startSession();
      writingGoalsService.updateSession({ wordsWritten: 200 });
      writingGoalsService.endSession();

      vi.setSystemTime(today);
      writingGoalsService.startSession();
      writingGoalsService.updateSession({ wordsWritten: 150 });
      writingGoalsService.endSession();

      const metrics = writingGoalsService.getProductivityMetrics();
      expect(metrics.currentStreak).toBe(3);
    });

    test('should find best writing day', () => {
      const day1 = new Date('2024-01-01T10:00:00Z');
      const day2 = new Date('2024-01-02T10:00:00Z');

      // Day 1: 300 words
      vi.setSystemTime(day1);
      writingGoalsService.startSession();
      writingGoalsService.updateSession({ wordsWritten: 300 });
      writingGoalsService.endSession();

      // Day 2: 800 words (best day)
      vi.setSystemTime(day2);
      writingGoalsService.startSession();
      writingGoalsService.updateSession({ wordsWritten: 800 });
      writingGoalsService.endSession();

      const metrics = writingGoalsService.getProductivityMetrics();
      expect(metrics.bestDay.wordsWritten).toBe(800);
      expect(metrics.bestDay.date.toDateString()).toBe(day2.toDateString());
    });

    test('should calculate productivity score', () => {
      // Create sessions with good consistency, quality, and efficiency
      for (let i = 0; i < 7; i++) {
        const date = new Date(`2024-01-0${i + 1}T10:00:00Z`);
        vi.setSystemTime(date);
        
        writingGoalsService.startSession();
        writingGoalsService.updateSession({ 
          wordsWritten: 500,
          quality: 4,
          mood: 'focused'
        });
        const session = writingGoalsService.getCurrentSession();
        if (session) {
          session.duration = 25; // 20 WPM
        }
        writingGoalsService.endSession();
      }

      const metrics = writingGoalsService.getProductivityMetrics();
      expect(metrics.productivityScore).toBeGreaterThan(70); // Should be high
    });

    test('should generate daily trends', () => {
      const day1 = new Date('2024-01-01T10:00:00Z');
      const day2 = new Date('2024-01-02T10:00:00Z');

      vi.setSystemTime(day1);
      writingGoalsService.startSession();
      writingGoalsService.updateSession({ wordsWritten: 400 });
      writingGoalsService.endSession();

      vi.setSystemTime(day2);
      writingGoalsService.startSession();
      writingGoalsService.updateSession({ wordsWritten: 600 });
      writingGoalsService.endSession();

      const metrics = writingGoalsService.getProductivityMetrics();
      
      expect(metrics.trends.wordsPerDay).toBeInstanceOf(Array);
      expect(metrics.trends.timePerDay).toBeInstanceOf(Array);
      expect(metrics.trends.moodTrends).toBeInstanceOf(Array);
      expect(metrics.trends.wordsPerDay.length).toBe(30); // Last 30 days
    });
  });

  describe('Achievement System', () => {
    test('should initialize with default achievements', () => {
      const achievements = writingGoalsService.getAchievements();
      
      expect(achievements.length).toBeGreaterThan(0);
      expect(achievements.find(a => a.id === 'first-session')).toBeDefined();
      expect(achievements.find(a => a.id === 'daily-writer')).toBeDefined();
      expect(achievements.find(a => a.id === 'word-warrior')).toBeDefined();
      
      // All should start unlocked = false
      achievements.forEach(achievement => {
        expect(achievement.isUnlocked).toBe(false);
      });
    });

    test('should unlock first session achievement', () => {
      const eventSpy = vi.fn();
      writingGoalsService.on('achievementsUnlocked', eventSpy);

      writingGoalsService.startSession();
      writingGoalsService.updateSession({ wordsWritten: 100 });
      writingGoalsService.endSession();

      expect(eventSpy).toHaveBeenCalled();
      
      const achievements = writingGoalsService.getAchievements();
      const firstSession = achievements.find(a => a.id === 'first-session');
      expect(firstSession?.isUnlocked).toBe(true);
      expect(firstSession?.unlockedAt).toBeInstanceOf(Date);
    });

    test('should unlock word milestone achievements', () => {
      const eventSpy = vi.fn();
      writingGoalsService.on('achievementsUnlocked', eventSpy);

      // Write 10,000 words total across multiple sessions
      for (let i = 0; i < 20; i++) {
        writingGoalsService.startSession();
        writingGoalsService.updateSession({ wordsWritten: 500 });
        writingGoalsService.endSession();
      }

      const achievements = writingGoalsService.getAchievements();
      const wordWarrior = achievements.find(a => a.id === 'word-warrior');
      expect(wordWarrior?.isUnlocked).toBe(true);
    });

    test('should unlock time-based achievements', () => {
      const eventSpy = vi.fn();
      writingGoalsService.on('achievementsUnlocked', eventSpy);

      // Write late at night (after 10 PM)
      const lateNight = new Date('2024-01-01T22:30:00Z');
      vi.setSystemTime(lateNight);
      
      writingGoalsService.startSession();
      writingGoalsService.updateSession({ wordsWritten: 100 });
      writingGoalsService.endSession();

      const achievements = writingGoalsService.getAchievements();
      const nightOwl = achievements.find(a => a.id === 'night-owl');
      expect(nightOwl?.isUnlocked).toBe(true);
    });

    test('should unlock streak achievements', () => {
      const eventSpy = vi.fn();
      writingGoalsService.on('achievementsUnlocked', eventSpy);

      // Write for 7 consecutive days
      for (let i = 0; i < 7; i++) {
        const date = new Date(`2024-01-0${i + 1}T10:00:00Z`);
        vi.setSystemTime(date);
        
        writingGoalsService.startSession();
        writingGoalsService.updateSession({ wordsWritten: 100 });
        writingGoalsService.endSession();
      }

      const achievements = writingGoalsService.getAchievements();
      const dailyWriter = achievements.find(a => a.id === 'daily-writer');
      expect(dailyWriter?.isUnlocked).toBe(true);
    });

    test('should unlock long session achievement', () => {
      const eventSpy = vi.fn();
      writingGoalsService.on('achievementsUnlocked', eventSpy);

      writingGoalsService.startSession();
      const session = writingGoalsService.getCurrentSession();
      if (session) {
        session.duration = 250; // 4+ hours
      }
      writingGoalsService.updateSession({ wordsWritten: 1000 });
      writingGoalsService.endSession();

      const achievements = writingGoalsService.getAchievements();
      const marathonWriter = achievements.find(a => a.id === 'marathon-writer');
      expect(marathonWriter?.isUnlocked).toBe(true);
    });

    test('should get only unlocked achievements', () => {
      writingGoalsService.startSession();
      writingGoalsService.endSession();

      const allAchievements = writingGoalsService.getAchievements();
      const unlockedAchievements = writingGoalsService.getUnlockedAchievements();

      expect(unlockedAchievements.length).toBeGreaterThan(0);
      expect(unlockedAchievements.length).toBeLessThan(allAchievements.length);
      unlockedAchievements.forEach(achievement => {
        expect(achievement.isUnlocked).toBe(true);
      });
    });
  });

  describe('Insights & Recommendations', () => {
    test('should generate insights for new goals', () => {
      const eventSpy = vi.fn();
      writingGoalsService.on('newInsight', eventSpy);

      writingGoalsService.createGoal({
        title: 'Test Goal',
        type: 'daily' as const,
        targetType: 'words' as const,
        targetValue: 500,
        startDate: new Date(),
        endDate: new Date(),
        status: 'active' as const,
        priority: 'medium' as const
      });

      // Should generate insights after goal creation
      expect(eventSpy).toHaveBeenCalled();
    });

    test('should generate productivity insights', () => {
      const eventSpy = vi.fn();
      writingGoalsService.on('newInsight', eventSpy);

      // Create some sessions with poor productivity
      for (let i = 0; i < 5; i++) {
        writingGoalsService.startSession();
        writingGoalsService.updateSession({ 
          wordsWritten: 50, // Very low
          quality: 2,
          mood: 'frustrated'
        });
        writingGoalsService.endSession();
      }

      const insights = writingGoalsService.getInsights();
      const productivityWarning = insights.find(i => 
        i.type === 'warning' && i.title.includes('Productivity')
      );
      
      expect(productivityWarning).toBeDefined();
      expect(productivityWarning?.actionable).toBe(true);
    });

    test('should generate streak building tips', () => {
      // Create some sessions but break the streak
      const day1 = new Date('2024-01-01T10:00:00Z');
      const day3 = new Date('2024-01-03T10:00:00Z'); // Skip day 2

      vi.setSystemTime(day1);
      writingGoalsService.startSession();
      writingGoalsService.updateSession({ wordsWritten: 200 });
      writingGoalsService.endSession();

      vi.setSystemTime(day3);
      // Should generate insight about building streak
      const insights = writingGoalsService.getInsights();
      const streakTip = insights.find(i => 
        i.type === 'tip' && i.title.includes('Streak')
      );
      
      expect(streakTip).toBeDefined();
    });

    test('should generate goal completion insights', () => {
      const eventSpy = vi.fn();
      writingGoalsService.on('newInsight', eventSpy);

      const goal = writingGoalsService.createGoal({
        title: 'Achievement Goal',
        type: 'project' as const,
        targetType: 'words' as const,
        targetValue: 1000,
        startDate: new Date(),
        endDate: new Date(),
        status: 'active' as const,
        priority: 'high' as const
      });

      writingGoalsService.completeGoal(goal.id);

      const insights = writingGoalsService.getInsights();
      const completionInsight = insights.find(i => 
        i.type === 'achievement' && i.title.includes('Goal Completed')
      );
      
      expect(completionInsight).toBeDefined();
      expect(completionInsight?.actionable).toBe(true);
    });

    test('should mark insights as read', () => {
      writingGoalsService.createGoal({
        title: 'Test Goal',
        type: 'daily' as const,
        targetType: 'words' as const,
        targetValue: 500,
        startDate: new Date(),
        endDate: new Date(),
        status: 'active' as const,
        priority: 'medium' as const
      });

      const insights = writingGoalsService.getInsights();
      const firstInsight = insights[0];
      
      expect(firstInsight.isRead).toBe(false);
      
      writingGoalsService.markInsightRead(firstInsight.id);
      
      const updatedInsights = writingGoalsService.getInsights();
      const updatedInsight = updatedInsights.find(i => i.id === firstInsight.id);
      expect(updatedInsight?.isRead).toBe(true);
    });

    test('should filter unread insights', () => {
      writingGoalsService.createGoal({
        title: 'Test Goal',
        type: 'daily' as const,
        targetType: 'words' as const,
        targetValue: 500,
        startDate: new Date(),
        endDate: new Date(),
        status: 'active' as const,
        priority: 'medium' as const
      });

      const allInsights = writingGoalsService.getInsights();
      const unreadInsights = writingGoalsService.getInsights(true);
      
      expect(unreadInsights.length).toBe(allInsights.length);
      
      if (allInsights.length > 0) {
        writingGoalsService.markInsightRead(allInsights[0].id);
        const newUnreadInsights = writingGoalsService.getInsights(true);
        expect(newUnreadInsights.length).toBe(allInsights.length - 1);
      }
    });
  });

  describe('Storage & Persistence', () => {
    test('should save goals to localStorage', () => {
      const goalData = {
        title: 'Persistent Goal',
        type: 'daily' as const,
        targetType: 'words' as const,
        targetValue: 500,
        startDate: new Date(),
        endDate: new Date(),
        status: 'active' as const,
        priority: 'medium' as const
      };

      writingGoalsService.createGoal(goalData);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'astral_notes_writing_goals_goals',
        expect.stringContaining('Persistent Goal')
      );
    });

    test('should save sessions to localStorage', () => {
      writingGoalsService.startSession();
      writingGoalsService.updateSession({ wordsWritten: 200 });
      writingGoalsService.endSession();

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'astral_notes_writing_goals_sessions',
        expect.any(String)
      );
    });

    test('should save habits to localStorage', () => {
      writingGoalsService.createHabit({
        name: 'Persistent Habit',
        description: 'Test persistence',
        frequency: 'daily',
        targetValue: 1,
        isActive: true
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'astral_notes_writing_goals_habits',
        expect.stringContaining('Persistent Habit')
      );
    });

    test('should handle localStorage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });

      expect(() => {
        writingGoalsService.createGoal({
          title: 'Test Goal',
          type: 'daily' as const,
          targetType: 'words' as const,
          targetValue: 500,
          startDate: new Date(),
          endDate: new Date(),
          status: 'active' as const,
          priority: 'medium' as const
        });
      }).not.toThrow();
    });

    test('should handle corrupt localStorage data', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      // Should not throw errors and fallback to empty arrays
      expect(() => {
        const goals = writingGoalsService.getAllGoals();
        const sessions = writingGoalsService.getAllSessions();
        const achievements = writingGoalsService.getAchievements();
      }).not.toThrow();
    });
  });

  describe('Event System', () => {
    test('should emit and handle events correctly', () => {
      const goalCreatedSpy = vi.fn();
      const sessionStartedSpy = vi.fn();
      const habitCompletedSpy = vi.fn();

      writingGoalsService.on('goalCreated', goalCreatedSpy);
      writingGoalsService.on('sessionStarted', sessionStartedSpy);
      writingGoalsService.on('habitCompleted', habitCompletedSpy);

      writingGoalsService.createGoal({
        title: 'Event Test',
        type: 'daily' as const,
        targetType: 'words' as const,
        targetValue: 500,
        startDate: new Date(),
        endDate: new Date(),
        status: 'active' as const,
        priority: 'medium' as const
      });

      writingGoalsService.startSession();

      const habit = writingGoalsService.createHabit({
        name: 'Event Habit',
        description: 'Test events',
        frequency: 'daily',
        targetValue: 1,
        isActive: true
      });
      writingGoalsService.completeHabit(habit.id);

      expect(goalCreatedSpy).toHaveBeenCalledTimes(1);
      expect(sessionStartedSpy).toHaveBeenCalledTimes(1);
      expect(habitCompletedSpy).toHaveBeenCalledTimes(1);
    });

    test('should remove event listeners correctly', () => {
      const eventSpy = vi.fn();
      
      writingGoalsService.on('goalCreated', eventSpy);
      writingGoalsService.off('goalCreated', eventSpy);

      writingGoalsService.createGoal({
        title: 'No Event Test',
        type: 'daily' as const,
        targetType: 'words' as const,
        targetValue: 500,
        startDate: new Date(),
        endDate: new Date(),
        status: 'active' as const,
        priority: 'medium' as const
      });

      expect(eventSpy).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling & Edge Cases', () => {
    test('should handle invalid goal updates', () => {
      const result = writingGoalsService.updateGoal('non-existent-id', {
        title: 'Updated'
      });

      expect(result).toBeNull();
    });

    test('should handle invalid goal deletion', () => {
      const success = writingGoalsService.deleteGoal('non-existent-id');
      expect(success).toBe(false);
    });

    test('should handle session updates when no session active', () => {
      const result = writingGoalsService.updateSession({ wordsWritten: 100 });
      expect(result).toBeNull();
    });

    test('should handle ending session when none active', () => {
      const result = writingGoalsService.endSession();
      expect(result).toBeNull();
    });

    test('should handle invalid habit completion', () => {
      const success = writingGoalsService.completeHabit('non-existent-id');
      expect(success).toBe(false);
    });

    test('should handle empty date ranges in analytics', () => {
      const metrics = writingGoalsService.getProductivityMetrics({
        start: new Date('2025-01-01'),
        end: new Date('2025-01-02')
      });

      expect(metrics.totalWordsWritten).toBe(0);
      expect(metrics.totalSessions).toBe(0);
      expect(metrics.productivityScore).toBe(0);
    });

    test('should handle zero duration sessions in calculations', () => {
      writingGoalsService.startSession();
      const session = writingGoalsService.getCurrentSession();
      if (session) {
        session.duration = 0;
      }
      writingGoalsService.updateSession({ wordsWritten: 100 });
      writingGoalsService.endSession();

      const metrics = writingGoalsService.getProductivityMetrics();
      expect(metrics.averageWordsPerMinute).toBe(0);
    });
  });

  describe('Performance & Scalability', () => {
    test('should handle large number of sessions efficiently', () => {
      const startTime = performance.now();

      // Create 1000 sessions
      for (let i = 0; i < 1000; i++) {
        writingGoalsService.startSession();
        writingGoalsService.updateSession({ wordsWritten: 100 });
        writingGoalsService.endSession();
      }

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds

      const metrics = writingGoalsService.getProductivityMetrics();
      expect(metrics.totalSessions).toBe(1000);
      expect(metrics.totalWordsWritten).toBe(100000);
    });

    test('should handle large date ranges in analytics', () => {
      const startTime = performance.now();

      const metrics = writingGoalsService.getProductivityMetrics({
        start: new Date('2020-01-01'),
        end: new Date('2024-12-31')
      });

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second

      expect(metrics).toBeDefined();
    });

    test('should limit insights to prevent memory bloat', () => {
      // Generate many insights
      for (let i = 0; i < 100; i++) {
        writingGoalsService.createGoal({
          title: `Goal ${i}`,
          type: 'daily' as const,
          targetType: 'words' as const,
          targetValue: 500,
          startDate: new Date(),
          endDate: new Date(),
          status: 'active' as const,
          priority: 'medium' as const
        });
      }

      const insights = writingGoalsService.getInsights();
      expect(insights.length).toBeLessThanOrEqual(50); // Should be limited
    });
  });

  describe('Integration Tests', () => {
    test('should work with complete goal lifecycle', () => {
      // Create goal
      const goal = writingGoalsService.createGoal({
        title: 'Integration Test Goal',
        type: 'project' as const,
        targetType: 'words' as const,
        targetValue: 1000,
        startDate: new Date(),
        endDate: new Date(),
        status: 'active' as const,
        priority: 'high' as const
      });

      // Start session for goal
      const session = writingGoalsService.startSession(goal.id);
      expect(session.goalId).toBe(goal.id);

      // Write words and update goal progress
      writingGoalsService.updateSession({ wordsWritten: 600 });
      
      let updatedGoal = writingGoalsService.getGoal(goal.id);
      expect(updatedGoal?.currentValue).toBe(600);

      // Complete goal
      writingGoalsService.updateSession({ wordsWritten: 1000 });
      writingGoalsService.endSession();

      updatedGoal = writingGoalsService.getGoal(goal.id);
      expect(updatedGoal?.status).toBe('completed');

      // Check achievements were unlocked
      const achievements = writingGoalsService.getUnlockedAchievements();
      expect(achievements.length).toBeGreaterThan(0);

      // Check insights were generated
      const insights = writingGoalsService.getInsights();
      expect(insights.length).toBeGreaterThan(0);

      // Check metrics
      const metrics = writingGoalsService.getProductivityMetrics();
      expect(metrics.totalWordsWritten).toBe(1000);
      expect(metrics.goalsCompleted).toBe(1);
    });

    test('should maintain consistency across multiple operations', () => {
      // Create multiple goals, sessions, and habits
      const goals = [];
      for (let i = 0; i < 5; i++) {
        goals.push(writingGoalsService.createGoal({
          title: `Goal ${i}`,
          type: 'daily' as const,
          targetType: 'words' as const,
          targetValue: 500,
          startDate: new Date(),
          endDate: new Date(),
          status: 'active' as const,
          priority: 'medium' as const
        }));
      }

      const habits = [];
      for (let i = 0; i < 3; i++) {
        habits.push(writingGoalsService.createHabit({
          name: `Habit ${i}`,
          description: `Description ${i}`,
          frequency: 'daily' as const,
          targetValue: 1,
          isActive: true
        }));
      }

      // Complete multiple sessions
      for (let i = 0; i < 10; i++) {
        writingGoalsService.startSession(goals[i % goals.length].id);
        writingGoalsService.updateSession({ wordsWritten: 100 });
        writingGoalsService.endSession();
      }

      // Complete habits
      habits.forEach(habit => {
        writingGoalsService.completeHabit(habit.id);
      });

      // Verify data consistency
      const allGoals = writingGoalsService.getAllGoals();
      const allSessions = writingGoalsService.getAllSessions();
      const metrics = writingGoalsService.getProductivityMetrics();

      expect(allGoals.length).toBe(5);
      expect(allSessions.length).toBe(10);
      expect(metrics.totalWordsWritten).toBe(1000);
      expect(metrics.totalSessions).toBe(10);

      // Check that goal progress was updated correctly
      allGoals.forEach(goal => {
        expect(goal.currentValue).toBe(200); // 100 words * 2 sessions per goal
      });
    });
  });
});