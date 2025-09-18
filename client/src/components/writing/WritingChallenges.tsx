/**
 * Writing Challenges Component
 * Interactive UI for goals, challenges, and writing gamification
 */

import React, { useState, useEffect } from 'react';
import { Target, Trophy, Flame, Calendar, Clock, TrendingUp, Award, ChevronRight, Plus, Star, Zap } from 'lucide-react';
import { writingChallengesService, WritingGoal, WritingChallenge, WritingStreak, WritingStats, Badge } from '../../services/writingChallengesService';
import { BrowserEventEmitter } from '../../utils/BrowserEventEmitter';

export function WritingChallenges() {
  const [activeTab, setActiveTab] = useState<'goals' | 'challenges' | 'achievements'>('goals');
  const [goals, setGoals] = useState<WritingGoal[]>([]);
  const [challenges, setChallenges] = useState<WritingChallenge[]>([]);
  const [streak, setStreak] = useState<WritingStreak>(writingChallengesService.getStreak());
  const [stats, setStats] = useState<WritingStats>(writingChallengesService.getStats());
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<WritingChallenge | null>(null);

  useEffect(() => {
    loadData();
    const eventEmitter = BrowserEventEmitter.getInstance();

    // Subscribe to events
    const unsubscribers = [
      eventEmitter.on('goal:created', loadData),
      eventEmitter.on('goal:completed', loadData),
      eventEmitter.on('goal:progress', loadData),
      eventEmitter.on('challenge:started', loadData),
      eventEmitter.on('challenge:completed', loadData),
      eventEmitter.on('challenge:progress', loadData),
      eventEmitter.on('badge:unlocked', (badge: Badge) => {
        loadData();
        showBadgeNotification(badge);
      }),
      eventEmitter.on('level:up', ({ newLevel }) => {
        loadData();
        showLevelUpNotification(newLevel);
      })
    ];

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  const loadData = () => {
    setGoals(writingChallengesService.getGoals());
    setChallenges(writingChallengesService.getChallenges());
    setStreak(writingChallengesService.getStreak());
    setStats(writingChallengesService.getStats());
  };

  const showBadgeNotification = (badge: Badge) => {
    // Show toast notification for badge unlock
    console.log('Badge unlocked:', badge.name);
  };

  const showLevelUpNotification = (level: number) => {
    // Show toast notification for level up
    console.log('Level up! Now level:', level);
  };

  const renderGoalsTab = () => (
    <div className="space-y-6">
      {/* Daily Goals Overview */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Today's Progress</h3>
          <button
            onClick={() => setShowNewGoalModal(true)}
            className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> New Goal
          </button>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-3xl font-bold">{stats.totalWords.toLocaleString()}</div>
            <div className="text-white/80 text-sm">Words Today</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{streak.currentStreak}</div>
            <div className="text-white/80 text-sm">Day Streak</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{goals.filter(g => g.status === 'active').length}</div>
            <div className="text-white/80 text-sm">Active Goals</div>
          </div>
        </div>
      </div>

      {/* Active Goals */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold dark:text-white">Active Goals</h3>
        {goals.filter(g => g.status === 'active').map(goal => (
          <div key={goal.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="font-medium dark:text-white">{goal.title}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{goal.description}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium dark:text-white">
                  {goal.currentValue} / {goal.targetValue} {goal.targetType}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Due: {new Date(goal.deadline).toLocaleDateString()}
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${(goal.currentValue / goal.targetValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Completed Goals */}
      {goals.filter(g => g.status === 'completed').length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold dark:text-white">Completed Goals</h3>
          {goals.filter(g => g.status === 'completed').slice(0, 3).map(goal => (
            <div key={goal.id} className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="font-medium dark:text-white">{goal.title}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Completed: {goal.completedAt && new Date(goal.completedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                {goal.reward && (
                  <div className="text-green-500 text-sm font-medium">
                    +{goal.reward.name}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderChallengesTab = () => (
    <div className="space-y-6">
      {/* Active Challenges */}
      {challenges.filter(c => c.status === 'active').length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold dark:text-white">Active Challenges</h3>
          {challenges.filter(c => c.status === 'active').map(challenge => (
            <div key={challenge.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-medium dark:text-white">{challenge.name}</div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      challenge.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                      challenge.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      challenge.difficulty === 'hard' ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {challenge.difficulty}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {challenge.description}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-500">{Math.round(challenge.progress)}%</div>
                  {challenge.endDate && (
                    <div className="text-xs text-gray-500">
                      {Math.ceil((new Date(challenge.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left
                    </div>
                  )}
                </div>
              </div>

              {/* Requirements */}
              <div className="space-y-2">
                {challenge.requirements.map((req, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      req.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'
                    }`}>
                      {req.completed && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span className={`text-sm ${req.completed ? 'text-gray-500 line-through' : 'dark:text-gray-300'}`}>
                      {req.description}
                    </span>
                  </div>
                ))}
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all"
                    style={{ width: `${challenge.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Available Challenges */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold dark:text-white">Available Challenges</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {challenges.filter(c => c.status === 'available').map(challenge => (
            <div
              key={challenge.id}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedChallenge(challenge)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="font-medium dark:text-white">{challenge.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {challenge.description}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 mt-1" />
              </div>

              <div className="flex items-center gap-4 mt-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  challenge.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                  challenge.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  challenge.difficulty === 'hard' ? 'bg-orange-100 text-orange-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {challenge.difficulty}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {challenge.requirements.length} requirements
                </span>
              </div>

              {/* Rewards Preview */}
              <div className="flex items-center gap-2 mt-3">
                {challenge.rewards.slice(0, 3).map((reward, idx) => (
                  <div key={idx} className="flex items-center gap-1">
                    {reward.type === 'badge' && <Award className="w-4 h-4 text-yellow-500" />}
                    {reward.type === 'points' && <Zap className="w-4 h-4 text-blue-500" />}
                    <span className="text-xs dark:text-gray-400">{reward.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAchievementsTab = () => (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg p-6 text-white">
        <h3 className="text-xl font-semibold mb-4">Writing Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-2xl font-bold">{stats.totalWords.toLocaleString()}</div>
            <div className="text-white/80 text-sm">Total Words</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{Math.floor(stats.totalTime / 60)}h</div>
            <div className="text-white/80 text-sm">Writing Time</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.averageWPM}</div>
            <div className="text-white/80 text-sm">Avg WPM</div>
          </div>
          <div>
            <div className="text-2xl font-bold">Lvl {stats.currentLevel}</div>
            <div className="text-white/80 text-sm">Current Level</div>
          </div>
        </div>

        {/* XP Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span>Experience Points</span>
            <span>{stats.experiencePoints} / {stats.nextLevelXP} XP</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all"
              style={{ width: `${(stats.experiencePoints / stats.nextLevelXP) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Writing Streak */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-6 h-6 text-orange-500" />
            <h3 className="text-lg font-semibold dark:text-white">Writing Streak</h3>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-orange-500">{streak.currentStreak}</div>
            <div className="text-xs text-gray-500">days</div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Best:</span>
            <span className="ml-1 font-medium dark:text-white">{streak.bestStreak} days</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Last write:</span>
            <span className="ml-1 font-medium dark:text-white">
              {new Date(streak.lastWritingDate).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Streak Milestones */}
        <div className="mt-4 space-y-2">
          {streak.milestones.map((milestone, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  milestone.achieved ? 'bg-green-500' : 'bg-gray-300'
                }`}>
                  {milestone.achieved ? (
                    <Star className="w-4 h-4 text-white" />
                  ) : (
                    <span className="text-white text-xs">{milestone.days}</span>
                  )}
                </div>
                <span className={`text-sm ${milestone.achieved ? 'font-medium dark:text-white' : 'text-gray-500'}`}>
                  {milestone.title}
                </span>
              </div>
              {milestone.achievedDate && (
                <span className="text-xs text-gray-500">
                  {new Date(milestone.achievedDate).toLocaleDateString()}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold dark:text-white">Earned Badges</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.badges.map(badge => (
            <div
              key={badge.id}
              className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm text-center ${
                badge.rarity === 'legendary' ? 'border-2 border-yellow-400' :
                badge.rarity === 'epic' ? 'border-2 border-purple-400' :
                badge.rarity === 'rare' ? 'border-2 border-blue-400' :
                ''
              }`}
            >
              <div className="text-3xl mb-2">{badge.icon}</div>
              <div className="font-medium text-sm dark:text-white">{badge.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {badge.description}
              </div>
              <div className={`text-xs mt-2 font-medium ${
                badge.rarity === 'legendary' ? 'text-yellow-600' :
                badge.rarity === 'epic' ? 'text-purple-600' :
                badge.rarity === 'rare' ? 'text-blue-600' :
                'text-gray-600'
              }`}>
                {badge.rarity.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold dark:text-white">Writing Challenges & Goals</h2>
        <div className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 px-4 py-2 rounded-lg">
          <Trophy className="w-5 h-5 text-yellow-600" />
          <span className="font-medium text-yellow-700 dark:text-yellow-400">
            Level {stats.currentLevel}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg mb-6">
        {['goals', 'challenges', 'achievements'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'goals' && renderGoalsTab()}
      {activeTab === 'challenges' && renderChallengesTab()}
      {activeTab === 'achievements' && renderAchievementsTab()}

      {/* Challenge Details Modal */}
      {selectedChallenge && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold dark:text-white mb-2">{selectedChallenge.name}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{selectedChallenge.description}</p>

            <div className="space-y-3 mb-4">
              <h4 className="font-medium dark:text-white">Requirements:</h4>
              {selectedChallenge.requirements.map((req, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 mt-0.5" />
                  <span className="text-sm dark:text-gray-300">{req.description}</span>
                </div>
              ))}
            </div>

            <div className="space-y-3 mb-6">
              <h4 className="font-medium dark:text-white">Rewards:</h4>
              {selectedChallenge.rewards.map((reward, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  {reward.type === 'badge' && <Award className="w-5 h-5 text-yellow-500" />}
                  {reward.type === 'points' && <Zap className="w-5 h-5 text-blue-500" />}
                  <span className="text-sm dark:text-gray-300">
                    {reward.value} {reward.type === 'points' && 'XP'}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  writingChallengesService.startChallenge(selectedChallenge.id);
                  setSelectedChallenge(null);
                  loadData();
                }}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
              >
                Start Challenge
              </button>
              <button
                onClick={() => setSelectedChallenge(null)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}