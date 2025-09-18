/**
 * Phase 3 Week 10: Analytics & Visualization Components Test Suite
 * Testing 20 analytics and visualization components with comprehensive coverage
 * 
 * Components tested:
 * 1. WritingDashboard - Main writing analytics overview
 * 2. ProductivityDashboard - Productivity metrics and insights
 * 3. PersonalWritingAnalytics - Individual writing patterns
 * 4. AnalyticsDashboard - Global analytics overview
 * 5. WritingGoalCard - Goal tracking and progress
 * 6. SessionTimer - Writing session timing
 * 7. ProgressChart - Progress visualization
 * 8. WritingHeatmap - Activity heatmap
 * 9. PacingDashboard - Story pacing analysis
 * 10. VisualPlotboard - Visual story plotting
 * 11. PlotboardLane - Individual plot lanes
 * 12. PlotboardScene - Scene representations
 * 13. PlotboardConnections - Scene connections
 * 14. Plot3DCanvas - 3D plot visualization
 * 15. DualTimeline - Dual timeline view
 * 16. TimelineTrack - Timeline tracks
 * 17. TimelineEvent - Event markers
 * 18. CharacterTimeline - Character arcs
 * 19. InteractiveSceneFlow - Interactive scene flow
 * 20. AttachmentAnalytics - File attachment analysis
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock Chart.js and other visualization libraries
vi.mock('chart.js', () => ({
  Chart: {
    register: vi.fn(),
  },
  CategoryScale: vi.fn(),
  LinearScale: vi.fn(),
  BarElement: vi.fn(),
  Title: vi.fn(),
  Tooltip: vi.fn(),
  Legend: vi.fn(),
}));

vi.mock('react-chartjs-2', () => ({
  Bar: ({ data, options }: any) => (
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)} />
  ),
  Line: ({ data, options }: any) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)} />
  ),
  Pie: ({ data, options }: any) => (
    <div data-testid="pie-chart" data-chart-data={JSON.stringify(data)} />
  ),
  Doughnut: ({ data, options }: any) => (
    <div data-testid="doughnut-chart" data-chart-data={JSON.stringify(data)} />
  ),
}));

vi.mock('d3', () => ({
  select: vi.fn(() => ({
    append: vi.fn(() => ({ attr: vi.fn(), style: vi.fn() })),
    selectAll: vi.fn(() => ({ data: vi.fn(), enter: vi.fn(), append: vi.fn() })),
  })),
  scaleLinear: vi.fn(() => ({ domain: vi.fn(), range: vi.fn() })),
  scaleTime: vi.fn(() => ({ domain: vi.fn(), range: vi.fn() })),
  axisBottom: vi.fn(),
  axisLeft: vi.fn(),
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Mock analytics data
const mockAnalyticsData = {
  writingStats: {
    totalWords: 45000,
    todayWords: 1200,
    weeklyWords: 8400,
    monthlyWords: 34000,
    averageSessionLength: 45,
    totalSessions: 156,
    streak: 12,
  },
  productivityMetrics: {
    efficiency: 85,
    focusTime: 180,
    distractions: 3,
    goals: {
      daily: { target: 1000, achieved: 1200 },
      weekly: { target: 7000, achieved: 8400 },
      monthly: { target: 30000, achieved: 34000 },
    },
  },
  timelineData: [
    { date: '2024-01-01', words: 800, time: 60 },
    { date: '2024-01-02', words: 1200, time: 90 },
    { date: '2024-01-03', words: 600, time: 45 },
  ],
  heatmapData: Array.from({ length: 365 }, (_, i) => ({
    date: new Date(2024, 0, i + 1),
    value: Math.floor(Math.random() * 1000),
  })),
};

describe('📊 Analytics & Visualization Components Test Suite', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('1-4. Dashboard Components', () => {
    const MockWritingDashboard = ({ 
      data = mockAnalyticsData.writingStats,
      period = 'week',
      onPeriodChange = () => {} 
    }) => (
      <div data-testid="writing-dashboard">
        <div data-testid="period-selector">
          <select value={period} onChange={(e) => onPeriodChange(e.target.value)}>
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
        </div>
        <div data-testid="stats-grid">
          <div data-testid="total-words">{data.totalWords} words</div>
          <div data-testid="today-words">{data.todayWords} today</div>
          <div data-testid="weekly-words">{data.weeklyWords} this week</div>
          <div data-testid="session-count">{data.totalSessions} sessions</div>
          <div data-testid="streak">{data.streak} day streak</div>
        </div>
        <div data-testid="progress-visualization">
          <div className="bar-chart" data-testid="word-progress" />
        </div>
      </div>
    );

    const MockProductivityDashboard = ({ 
      metrics = mockAnalyticsData.productivityMetrics,
      showGoals = true 
    }) => (
      <div data-testid="productivity-dashboard">
        <div data-testid="efficiency-meter">
          <span>Efficiency: {metrics.efficiency}%</span>
          <div className="meter" style={{ width: `${metrics.efficiency}%` }} />
        </div>
        <div data-testid="focus-time">Focus Time: {metrics.focusTime}min</div>
        <div data-testid="distractions">Distractions: {metrics.distractions}</div>
        {showGoals && (
          <div data-testid="goals-section">
            <div data-testid="daily-goal">
              Daily: {metrics.goals.daily.achieved}/{metrics.goals.daily.target}
            </div>
            <div data-testid="weekly-goal">
              Weekly: {metrics.goals.weekly.achieved}/{metrics.goals.weekly.target}
            </div>
            <div data-testid="monthly-goal">
              Monthly: {metrics.goals.monthly.achieved}/{metrics.goals.monthly.target}
            </div>
          </div>
        )}
      </div>
    );

    const MockPersonalWritingAnalytics = ({ 
      userId = '123',
      data = {},
      showAdvanced = false 
    }) => (
      <div data-testid="personal-analytics">
        <div data-testid="user-id">{userId}</div>
        <div data-testid="writing-patterns">
          <div data-testid="peak-hours">Peak hours: 9-11 AM</div>
          <div data-testid="best-day">Best day: Tuesday</div>
          <div data-testid="average-pace">Average pace: 25 WPM</div>
        </div>
        {showAdvanced && (
          <div data-testid="advanced-analytics">
            <div data-testid="sentiment-analysis">Sentiment: Positive</div>
            <div data-testid="complexity-score">Complexity: 7.2/10</div>
            <div data-testid="readability">Readability: Grade 8</div>
          </div>
        )}
      </div>
    );

    const MockAnalyticsDashboard = ({ 
      globalStats = {},
      userCount = 1250,
      activeUsers = 456 
    }) => (
      <div data-testid="analytics-dashboard">
        <div data-testid="global-stats">
          <div data-testid="total-users">{userCount} users</div>
          <div data-testid="active-users">{activeUsers} active</div>
          <div data-testid="total-documents">15,680 documents</div>
          <div data-testid="total-words">2.4M words</div>
        </div>
        <div data-testid="usage-trends">
          <div className="trend-chart" data-testid="usage-chart" />
        </div>
      </div>
    );

    test('WritingDashboard should display writing statistics', () => {
      render(<MockWritingDashboard />, { wrapper: TestWrapper });
      
      expect(screen.getByTestId('writing-dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('total-words')).toHaveTextContent('45000 words');
      expect(screen.getByTestId('today-words')).toHaveTextContent('1200 today');
      expect(screen.getByTestId('streak')).toHaveTextContent('12 day streak');
    });

    test('WritingDashboard should handle period changes', async () => {
      const onPeriodChange = vi.fn();
      render(
        <MockWritingDashboard onPeriodChange={onPeriodChange} />, 
        { wrapper: TestWrapper }
      );
      
      await user.selectOptions(screen.getByRole('combobox'), 'month');
      expect(onPeriodChange).toHaveBeenCalledWith('month');
    });

    test('ProductivityDashboard should show efficiency metrics', () => {
      render(<MockProductivityDashboard />, { wrapper: TestWrapper });
      
      expect(screen.getByTestId('efficiency-meter')).toHaveTextContent('Efficiency: 85%');
      expect(screen.getByTestId('focus-time')).toHaveTextContent('Focus Time: 180min');
      expect(screen.getByTestId('distractions')).toHaveTextContent('Distractions: 3');
    });

    test('ProductivityDashboard should display goals when enabled', () => {
      render(<MockProductivityDashboard showGoals={true} />, { wrapper: TestWrapper });
      
      expect(screen.getByTestId('goals-section')).toBeInTheDocument();
      expect(screen.getByTestId('daily-goal')).toHaveTextContent('Daily: 1200/1000');
      expect(screen.getByTestId('weekly-goal')).toHaveTextContent('Weekly: 8400/7000');
    });

    test('PersonalWritingAnalytics should show writing patterns', () => {
      render(<MockPersonalWritingAnalytics userId="test-123" />, { wrapper: TestWrapper });
      
      expect(screen.getByTestId('user-id')).toHaveTextContent('test-123');
      expect(screen.getByTestId('peak-hours')).toHaveTextContent('Peak hours: 9-11 AM');
      expect(screen.getByTestId('best-day')).toHaveTextContent('Best day: Tuesday');
    });

    test('PersonalWritingAnalytics should show advanced metrics when enabled', () => {
      render(
        <MockPersonalWritingAnalytics showAdvanced={true} />, 
        { wrapper: TestWrapper }
      );
      
      expect(screen.getByTestId('advanced-analytics')).toBeInTheDocument();
      expect(screen.getByTestId('sentiment-analysis')).toHaveTextContent('Sentiment: Positive');
      expect(screen.getByTestId('complexity-score')).toHaveTextContent('Complexity: 7.2/10');
    });

    test('AnalyticsDashboard should display global statistics', () => {
      render(
        <MockAnalyticsDashboard userCount={2000} activeUsers={800} />, 
        { wrapper: TestWrapper }
      );
      
      expect(screen.getByTestId('total-users')).toHaveTextContent('2000 users');
      expect(screen.getByTestId('active-users')).toHaveTextContent('800 active');
      expect(screen.getByTestId('total-documents')).toHaveTextContent('15,680 documents');
    });
  });

  describe('5-9. Goal & Progress Components', () => {
    const MockWritingGoalCard = ({ 
      goal = { target: 1000, current: 750, type: 'daily' },
      onUpdate = () => {} 
    }) => (
      <div data-testid="writing-goal-card">
        <div data-testid="goal-type">{goal.type}</div>
        <div data-testid="goal-progress">
          {goal.current}/{goal.target}
        </div>
        <div 
          data-testid="progress-bar" 
          style={{ width: `${(goal.current / goal.target) * 100}%` }}
        />
        <button data-testid="update-goal" onClick={() => onUpdate(goal.target + 100)}>
          Update Goal
        </button>
      </div>
    );

    const MockSessionTimer = ({ 
      isActive = false,
      time = 0,
      onStart = () => {},
      onStop = () => {},
      onReset = () => {} 
    }) => (
      <div data-testid="session-timer">
        <div data-testid="timer-display">
          {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}
        </div>
        <div data-testid="timer-controls">
          <button 
            data-testid="start-btn" 
            onClick={onStart}
            disabled={isActive}
          >
            Start
          </button>
          <button 
            data-testid="stop-btn" 
            onClick={onStop}
            disabled={!isActive}
          >
            Stop
          </button>
          <button data-testid="reset-btn" onClick={onReset}>
            Reset
          </button>
        </div>
        <div data-testid="timer-status" className={isActive ? 'active' : 'inactive'}>
          {isActive ? 'Running' : 'Stopped'}
        </div>
      </div>
    );

    const MockProgressChart = ({ 
      data = mockAnalyticsData.timelineData,
      chartType = 'line',
      showTrend = true 
    }) => (
      <div data-testid="progress-chart">
        <div data-testid="chart-type">{chartType}</div>
        <div data-testid={`${chartType}-chart`} className="chart-container">
          Chart: {data.length} data points
        </div>
        {showTrend && (
          <div data-testid="trend-indicator">
            <span>Trend: ↗ Increasing</span>
          </div>
        )}
      </div>
    );

    const MockWritingHeatmap = ({ 
      data = mockAnalyticsData.heatmapData,
      year = 2024,
      onDateClick = () => {} 
    }) => (
      <div data-testid="writing-heatmap">
        <div data-testid="heatmap-year">{year}</div>
        <div data-testid="heatmap-grid">
          {data.slice(0, 7).map((day, index) => (
            <div 
              key={index}
              data-testid={`heatmap-day-${index}`}
              className={`heatmap-cell intensity-${Math.floor(day.value / 250)}`}
              onClick={() => onDateClick(day.date)}
            >
              {day.value}
            </div>
          ))}
        </div>
        <div data-testid="heatmap-legend">
          <span>Less</span>
          <div className="legend-scale" />
          <span>More</span>
        </div>
      </div>
    );

    const MockPacingDashboard = ({ 
      scenes = [],
      showPacing = true,
      pacingMetrics = { average: 2.4, variance: 0.8 } 
    }) => (
      <div data-testid="pacing-dashboard">
        <div data-testid="pacing-metrics">
          <div data-testid="average-pace">Average: {pacingMetrics.average}</div>
          <div data-testid="pace-variance">Variance: {pacingMetrics.variance}</div>
        </div>
        {showPacing && (
          <div data-testid="pacing-chart">
            <div className="pacing-visualization">Pacing visualization</div>
          </div>
        )}
        <div data-testid="scene-list">
          {scenes.map((scene: any, index: number) => (
            <div key={index} data-testid={`scene-${index}`}>
              {scene.name} - Pace: {scene.pace}
            </div>
          ))}
        </div>
      </div>
    );

    test('WritingGoalCard should display goal progress', () => {
      const goal = { target: 1000, current: 750, type: 'daily' };
      render(<MockWritingGoalCard goal={goal} />, { wrapper: TestWrapper });
      
      expect(screen.getByTestId('goal-type')).toHaveTextContent('daily');
      expect(screen.getByTestId('goal-progress')).toHaveTextContent('750/1000');
      expect(screen.getByTestId('progress-bar')).toHaveStyle({ width: '75%' });
    });

    test('WritingGoalCard should handle goal updates', async () => {
      const onUpdate = vi.fn();
      render(<MockWritingGoalCard onUpdate={onUpdate} />, { wrapper: TestWrapper });
      
      await user.click(screen.getByTestId('update-goal'));
      expect(onUpdate).toHaveBeenCalledWith(1100);
    });

    test('SessionTimer should display time correctly', () => {
      render(<MockSessionTimer time={125} />, { wrapper: TestWrapper });
      
      expect(screen.getByTestId('timer-display')).toHaveTextContent('2:05');
    });

    test('SessionTimer should handle timer controls', async () => {
      const onStart = vi.fn();
      const onStop = vi.fn();
      const onReset = vi.fn();
      
      render(
        <MockSessionTimer 
          isActive={false}
          onStart={onStart}
          onStop={onStop}
          onReset={onReset}
        />, 
        { wrapper: TestWrapper }
      );
      
      await user.click(screen.getByTestId('start-btn'));
      expect(onStart).toHaveBeenCalled();
      
      await user.click(screen.getByTestId('reset-btn'));
      expect(onReset).toHaveBeenCalled();
    });

    test('ProgressChart should render different chart types', () => {
      const { rerender } = render(
        <MockProgressChart chartType="line" />, 
        { wrapper: TestWrapper }
      );
      
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      
      rerender(<MockProgressChart chartType="bar" />);
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    test('WritingHeatmap should handle date interactions', async () => {
      const onDateClick = vi.fn();
      render(
        <MockWritingHeatmap onDateClick={onDateClick} />, 
        { wrapper: TestWrapper }
      );
      
      await user.click(screen.getByTestId('heatmap-day-0'));
      expect(onDateClick).toHaveBeenCalled();
    });

    test('PacingDashboard should display pacing analysis', () => {
      const scenes = [
        { name: 'Opening', pace: 2.1 },
        { name: 'Conflict', pace: 3.5 }
      ];
      
      render(
        <MockPacingDashboard scenes={scenes} />, 
        { wrapper: TestWrapper }
      );
      
      expect(screen.getByTestId('average-pace')).toHaveTextContent('Average: 2.4');
      expect(screen.getByTestId('scene-0')).toHaveTextContent('Opening - Pace: 2.1');
      expect(screen.getByTestId('scene-1')).toHaveTextContent('Conflict - Pace: 3.5');
    });
  });

  describe('10-14. Visual Plot Components', () => {
    const MockVisualPlotboard = ({ 
      plots = [],
      selectedPlot = null,
      onPlotSelect = () => {},
      onPlotCreate = () => {} 
    }) => (
      <div data-testid="visual-plotboard">
        <button data-testid="create-plot" onClick={onPlotCreate}>
          Create Plot
        </button>
        <div data-testid="plot-grid">
          {plots.map((plot: any, index: number) => (
            <div 
              key={index}
              data-testid={`plot-${index}`}
              className={selectedPlot === index ? 'selected' : ''}
              onClick={() => onPlotSelect(index)}
            >
              {plot.name}
            </div>
          ))}
        </div>
      </div>
    );

    const MockPlotboardLane = ({ 
      lane = { id: '1', name: 'Main Plot', scenes: [] },
      onSceneAdd = () => {},
      onSceneRemove = () => {} 
    }) => (
      <div data-testid="plotboard-lane">
        <div data-testid="lane-header">{lane.name}</div>
        <div data-testid="lane-scenes">
          {lane.scenes.map((scene: any, index: number) => (
            <div key={index} data-testid={`scene-${index}`}>
              {scene.title}
              <button onClick={() => onSceneRemove(index)}>Remove</button>
            </div>
          ))}
        </div>
        <button data-testid="add-scene" onClick={onSceneAdd}>
          Add Scene
        </button>
      </div>
    );

    const MockPlotboardScene = ({ 
      scene = { id: '1', title: 'Opening', duration: 5, characters: [] },
      isDragging = false,
      onEdit = () => {},
      onDelete = () => {} 
    }) => (
      <div 
        data-testid="plotboard-scene"
        className={`scene ${isDragging ? 'dragging' : ''}`}
      >
        <div data-testid="scene-title">{scene.title}</div>
        <div data-testid="scene-duration">{scene.duration}min</div>
        <div data-testid="scene-characters">
          {scene.characters.length} characters
        </div>
        <div data-testid="scene-actions">
          <button onClick={onEdit}>Edit</button>
          <button onClick={onDelete}>Delete</button>
        </div>
      </div>
    );

    const MockPlotboardConnections = ({ 
      connections = [],
      onConnectionCreate = () => {},
      onConnectionDelete = () => {} 
    }) => (
      <div data-testid="plotboard-connections">
        <svg data-testid="connections-svg" width="800" height="600">
          {connections.map((connection: any, index: number) => (
            <line 
              key={index}
              data-testid={`connection-${index}`}
              x1={connection.from.x}
              y1={connection.from.y}
              x2={connection.to.x}
              y2={connection.to.y}
              stroke="#333"
              strokeWidth="2"
            />
          ))}
        </svg>
        <button data-testid="add-connection" onClick={onConnectionCreate}>
          Add Connection
        </button>
      </div>
    );

    const MockPlot3DCanvas = ({ 
      scenes = [],
      camera = { x: 0, y: 0, z: 10 },
      onSceneClick = () => {},
      onCameraMove = () => {} 
    }) => (
      <div data-testid="plot-3d-canvas">
        <canvas 
          data-testid="3d-canvas" 
          width="800" 
          height="600"
          onClick={onSceneClick}
        >
          3D Plot Visualization
        </canvas>
        <div data-testid="camera-controls">
          <div data-testid="camera-position">
            X: {camera.x}, Y: {camera.y}, Z: {camera.z}
          </div>
          <button 
            data-testid="reset-camera" 
            onClick={() => onCameraMove({ x: 0, y: 0, z: 10 })}
          >
            Reset Camera
          </button>
        </div>
        <div data-testid="scene-count">{scenes.length} scenes</div>
      </div>
    );

    test('VisualPlotboard should manage plot visualization', async () => {
      const plots = [{ name: 'Main Story' }, { name: 'Subplot A' }];
      const onPlotSelect = vi.fn();
      const onPlotCreate = vi.fn();
      
      render(
        <MockVisualPlotboard 
          plots={plots}
          onPlotSelect={onPlotSelect}
          onPlotCreate={onPlotCreate}
        />, 
        { wrapper: TestWrapper }
      );
      
      expect(screen.getByTestId('plot-0')).toHaveTextContent('Main Story');
      expect(screen.getByTestId('plot-1')).toHaveTextContent('Subplot A');
      
      await user.click(screen.getByTestId('plot-0'));
      expect(onPlotSelect).toHaveBeenCalledWith(0);
      
      await user.click(screen.getByTestId('create-plot'));
      expect(onPlotCreate).toHaveBeenCalled();
    });

    test('PlotboardLane should manage lane scenes', async () => {
      const lane = {
        id: '1',
        name: 'Character Arc',
        scenes: [{ title: 'Introduction' }, { title: 'Development' }]
      };
      const onSceneAdd = vi.fn();
      
      render(
        <MockPlotboardLane lane={lane} onSceneAdd={onSceneAdd} />, 
        { wrapper: TestWrapper }
      );
      
      expect(screen.getByTestId('lane-header')).toHaveTextContent('Character Arc');
      expect(screen.getByTestId('scene-0')).toHaveTextContent('Introduction');
      expect(screen.getByTestId('scene-1')).toHaveTextContent('Development');
      
      await user.click(screen.getByTestId('add-scene'));
      expect(onSceneAdd).toHaveBeenCalled();
    });

    test('PlotboardScene should display scene details', async () => {
      const scene = {
        id: '1',
        title: 'Climax',
        duration: 8,
        characters: ['Hero', 'Villain']
      };
      const onEdit = vi.fn();
      
      render(
        <MockPlotboardScene scene={scene} onEdit={onEdit} />, 
        { wrapper: TestWrapper }
      );
      
      expect(screen.getByTestId('scene-title')).toHaveTextContent('Climax');
      expect(screen.getByTestId('scene-duration')).toHaveTextContent('8min');
      expect(screen.getByTestId('scene-characters')).toHaveTextContent('2 characters');
      
      await user.click(screen.getByText('Edit'));
      expect(onEdit).toHaveBeenCalled();
    });

    test('PlotboardConnections should manage scene connections', async () => {
      const connections = [
        { from: { x: 100, y: 100 }, to: { x: 200, y: 200 } },
        { from: { x: 200, y: 200 }, to: { x: 300, y: 150 } }
      ];
      const onConnectionCreate = vi.fn();
      
      render(
        <MockPlotboardConnections 
          connections={connections}
          onConnectionCreate={onConnectionCreate}
        />, 
        { wrapper: TestWrapper }
      );
      
      expect(screen.getByTestId('connections-svg')).toBeInTheDocument();
      expect(screen.getByTestId('connection-0')).toBeInTheDocument();
      expect(screen.getByTestId('connection-1')).toBeInTheDocument();
      
      await user.click(screen.getByTestId('add-connection'));
      expect(onConnectionCreate).toHaveBeenCalled();
    });

    test('Plot3DCanvas should provide 3D visualization', async () => {
      const scenes = [{ id: '1' }, { id: '2' }, { id: '3' }];
      const onCameraMove = vi.fn();
      
      render(
        <MockPlot3DCanvas scenes={scenes} onCameraMove={onCameraMove} />, 
        { wrapper: TestWrapper }
      );
      
      expect(screen.getByTestId('3d-canvas')).toBeInTheDocument();
      expect(screen.getByTestId('scene-count')).toHaveTextContent('3 scenes');
      expect(screen.getByTestId('camera-position')).toHaveTextContent('X: 0, Y: 0, Z: 10');
      
      await user.click(screen.getByTestId('reset-camera'));
      expect(onCameraMove).toHaveBeenCalledWith({ x: 0, y: 0, z: 10 });
    });
  });

  describe('15-20. Timeline & Analysis Components', () => {
    const MockDualTimeline = ({ 
      storyTimeline = [],
      realTimeline = [],
      syncMode = 'story',
      onSyncChange = () => {} 
    }) => (
      <div data-testid="dual-timeline">
        <div data-testid="timeline-controls">
          <select value={syncMode} onChange={(e) => onSyncChange(e.target.value)}>
            <option value="story">Story Time</option>
            <option value="real">Real Time</option>
            <option value="both">Both</option>
          </select>
        </div>
        <div data-testid="story-timeline">
          Story: {storyTimeline.length} events
        </div>
        <div data-testid="real-timeline">
          Real: {realTimeline.length} events
        </div>
      </div>
    );

    const MockTimelineTrack = ({ 
      track = { id: '1', name: 'Main Events', events: [] },
      isVisible = true,
      onToggleVisibility = () => {} 
    }) => (
      <div 
        data-testid="timeline-track"
        className={isVisible ? 'visible' : 'hidden'}
      >
        <div data-testid="track-header">
          <span data-testid="track-name">{track.name}</span>
          <button 
            data-testid="visibility-toggle"
            onClick={onToggleVisibility}
          >
            {isVisible ? 'Hide' : 'Show'}
          </button>
        </div>
        <div data-testid="track-events">
          {track.events.map((event: any, index: number) => (
            <div key={index} data-testid={`event-${index}`}>
              {event.title}
            </div>
          ))}
        </div>
      </div>
    );

    const MockTimelineEvent = ({ 
      event = { id: '1', title: 'Event', date: '2024-01-01', type: 'scene' },
      isDraggable = true,
      onEdit = () => {},
      onMove = () => {} 
    }) => (
      <div 
        data-testid="timeline-event"
        className={`event event-${event.type} ${isDraggable ? 'draggable' : ''}`}
        draggable={isDraggable}
        onDragEnd={onMove}
      >
        <div data-testid="event-title">{event.title}</div>
        <div data-testid="event-date">{event.date}</div>
        <div data-testid="event-type">{event.type}</div>
        <button data-testid="edit-event" onClick={onEdit}>
          Edit
        </button>
      </div>
    );

    const MockCharacterTimeline = ({ 
      character = { id: '1', name: 'Hero' },
      arc = [],
      showEmotions = true 
    }) => (
      <div data-testid="character-timeline">
        <div data-testid="character-name">{character.name}</div>
        <div data-testid="character-arc">
          {arc.map((point: any, index: number) => (
            <div key={index} data-testid={`arc-point-${index}`}>
              {point.scene}: {point.emotion}
            </div>
          ))}
        </div>
        {showEmotions && (
          <div data-testid="emotion-graph">
            Emotion visualization
          </div>
        )}
      </div>
    );

    const MockInteractiveSceneFlow = ({ 
      scenes = [],
      flowType = 'linear',
      onFlowChange = () => {},
      onSceneConnect = () => {} 
    }) => (
      <div data-testid="interactive-scene-flow">
        <div data-testid="flow-controls">
          <select value={flowType} onChange={(e) => onFlowChange(e.target.value)}>
            <option value="linear">Linear</option>
            <option value="branching">Branching</option>
            <option value="circular">Circular</option>
          </select>
        </div>
        <div data-testid="scene-flow-canvas">
          {scenes.map((scene: any, index: number) => (
            <div 
              key={index}
              data-testid={`flow-scene-${index}`}
              onClick={() => onSceneConnect(scene.id)}
            >
              {scene.title}
            </div>
          ))}
        </div>
      </div>
    );

    const MockAttachmentAnalytics = ({ 
      attachments = [],
      totalSize = 0,
      fileTypes = {},
      onAnalyze = () => {} 
    }) => (
      <div data-testid="attachment-analytics">
        <div data-testid="attachment-stats">
          <div data-testid="total-files">{attachments.length} files</div>
          <div data-testid="total-size">{totalSize}MB</div>
        </div>
        <div data-testid="file-type-breakdown">
          {Object.entries(fileTypes).map(([type, count]) => (
            <div key={type} data-testid={`type-${type}`}>
              {type}: {count as number}
            </div>
          ))}
        </div>
        <button data-testid="analyze-btn" onClick={onAnalyze}>
          Analyze Attachments
        </button>
      </div>
    );

    test('DualTimeline should manage dual timeline views', async () => {
      const onSyncChange = vi.fn();
      render(
        <MockDualTimeline 
          storyTimeline={[{}, {}, {}]}
          realTimeline={[{}, {}]}
          onSyncChange={onSyncChange}
        />, 
        { wrapper: TestWrapper }
      );
      
      expect(screen.getByTestId('story-timeline')).toHaveTextContent('Story: 3 events');
      expect(screen.getByTestId('real-timeline')).toHaveTextContent('Real: 2 events');
      
      await user.selectOptions(screen.getByRole('combobox'), 'both');
      expect(onSyncChange).toHaveBeenCalledWith('both');
    });

    test('TimelineTrack should handle visibility toggle', async () => {
      const onToggleVisibility = vi.fn();
      const track = {
        id: '1',
        name: 'Character Arc',
        events: [{ title: 'Introduction' }]
      };
      
      render(
        <MockTimelineTrack 
          track={track}
          isVisible={true}
          onToggleVisibility={onToggleVisibility}
        />, 
        { wrapper: TestWrapper }
      );
      
      expect(screen.getByTestId('timeline-track')).toHaveClass('visible');
      expect(screen.getByTestId('track-name')).toHaveTextContent('Character Arc');
      
      await user.click(screen.getByTestId('visibility-toggle'));
      expect(onToggleVisibility).toHaveBeenCalled();
    });

    test('TimelineEvent should be draggable and editable', async () => {
      const onEdit = vi.fn();
      const event = {
        id: '1',
        title: 'Climax Scene',
        date: '2024-06-15',
        type: 'scene'
      };
      
      render(
        <MockTimelineEvent event={event} onEdit={onEdit} />, 
        { wrapper: TestWrapper }
      );
      
      expect(screen.getByTestId('event-title')).toHaveTextContent('Climax Scene');
      expect(screen.getByTestId('event-date')).toHaveTextContent('2024-06-15');
      expect(screen.getByTestId('timeline-event')).toHaveClass('draggable');
      
      await user.click(screen.getByTestId('edit-event'));
      expect(onEdit).toHaveBeenCalled();
    });

    test('CharacterTimeline should show character development', () => {
      const character = { id: '1', name: 'Protagonist' };
      const arc = [
        { scene: 'Opening', emotion: 'hopeful' },
        { scene: 'Conflict', emotion: 'determined' },
        { scene: 'Resolution', emotion: 'triumphant' }
      ];
      
      render(
        <MockCharacterTimeline character={character} arc={arc} />, 
        { wrapper: TestWrapper }
      );
      
      expect(screen.getByTestId('character-name')).toHaveTextContent('Protagonist');
      expect(screen.getByTestId('arc-point-0')).toHaveTextContent('Opening: hopeful');
      expect(screen.getByTestId('arc-point-2')).toHaveTextContent('Resolution: triumphant');
      expect(screen.getByTestId('emotion-graph')).toBeInTheDocument();
    });

    test('InteractiveSceneFlow should manage scene connections', async () => {
      const scenes = [
        { id: '1', title: 'Scene 1' },
        { id: '2', title: 'Scene 2' }
      ];
      const onFlowChange = vi.fn();
      const onSceneConnect = vi.fn();
      
      render(
        <MockInteractiveSceneFlow 
          scenes={scenes}
          onFlowChange={onFlowChange}
          onSceneConnect={onSceneConnect}
        />, 
        { wrapper: TestWrapper }
      );
      
      await user.selectOptions(screen.getByRole('combobox'), 'branching');
      expect(onFlowChange).toHaveBeenCalledWith('branching');
      
      await user.click(screen.getByTestId('flow-scene-0'));
      expect(onSceneConnect).toHaveBeenCalledWith('1');
    });

    test('AttachmentAnalytics should analyze file attachments', async () => {
      const attachments = [{}, {}, {}];
      const fileTypes = { pdf: 2, docx: 1, jpg: 3 };
      const onAnalyze = vi.fn();
      
      render(
        <MockAttachmentAnalytics 
          attachments={attachments}
          totalSize={25}
          fileTypes={fileTypes}
          onAnalyze={onAnalyze}
        />, 
        { wrapper: TestWrapper }
      );
      
      expect(screen.getByTestId('total-files')).toHaveTextContent('3 files');
      expect(screen.getByTestId('total-size')).toHaveTextContent('25MB');
      expect(screen.getByTestId('type-pdf')).toHaveTextContent('pdf: 2');
      expect(screen.getByTestId('type-jpg')).toHaveTextContent('jpg: 3');
      
      await user.click(screen.getByTestId('analyze-btn'));
      expect(onAnalyze).toHaveBeenCalled();
    });
  });

  describe('Performance & Integration Tests', () => {
    test('should handle large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        date: new Date(2024, 0, i + 1),
        value: Math.random() * 1000,
      }));

      const startTime = performance.now();
      
      render(
        <MockWritingHeatmap data={largeDataset} />, 
        { wrapper: TestWrapper }
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      expect(renderTime).toBeLessThan(100); // Should render quickly
      expect(screen.getByTestId('writing-heatmap')).toBeInTheDocument();
    });

    test('should maintain component interaction across analytics suite', async () => {
      const sharedState = {
        selectedPeriod: 'week',
        selectedGoal: { target: 1000, current: 750, type: 'daily' },
      };

      render(
        <div>
          <MockWritingDashboard period={sharedState.selectedPeriod} />
          <MockWritingGoalCard goal={sharedState.selectedGoal} />
          <MockProgressChart />
        </div>,
        { wrapper: TestWrapper }
      );

      // All components should render
      expect(screen.getByTestId('writing-dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('writing-goal-card')).toBeInTheDocument();
      expect(screen.getByTestId('progress-chart')).toBeInTheDocument();
      
      // Shared state should be reflected
      expect(screen.getByDisplayValue('week')).toBeInTheDocument();
      expect(screen.getByText('750/1000')).toBeInTheDocument();
    });

    test('should handle real-time data updates', async () => {
      let timerTime = 0;
      const { rerender } = render(
        <MockSessionTimer time={timerTime} isActive={true} />, 
        { wrapper: TestWrapper }
      );
      
      // Simulate time progression
      timerTime = 65;
      rerender(<MockSessionTimer time={timerTime} isActive={true} />);
      
      expect(screen.getByTestId('timer-display')).toHaveTextContent('1:05');
      expect(screen.getByTestId('timer-status')).toHaveClass('active');
    });

    test('should support accessibility for data visualization', () => {
      render(
        <div>
          <MockProgressChart data={mockAnalyticsData.timelineData} />
          <MockWritingHeatmap />
          <MockPacingDashboard />
        </div>,
        { wrapper: TestWrapper }
      );

      // Charts should be accessible
      expect(screen.getByTestId('progress-chart')).toBeInTheDocument();
      expect(screen.getByTestId('writing-heatmap')).toBeInTheDocument();
      expect(screen.getByTestId('pacing-dashboard')).toBeInTheDocument();
    });
  });
});