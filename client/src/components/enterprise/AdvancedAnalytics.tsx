import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Person as PersonIcon,
  Description as DescriptionIcon,
  Group as GroupIcon,
  Timer as TimerIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  FileDownload as FileDownloadIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  Speed as SpeedIcon,
  Star as StarIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

interface AnalyticsData {
  timeRange: string;
  teamMetrics: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    userRetention: number;
  };
  contentMetrics: {
    totalDocuments: number;
    documentsCreated: number;
    wordsWritten: number;
    averageWordsPerDocument: number;
    collaborativeDocuments: number;
  };
  productivityMetrics: {
    averageSessionDuration: number;
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    peakUsageHours: string[];
  };
  collaborationMetrics: {
    realTimeCollaborations: number;
    commentsAdded: number;
    suggestionsAccepted: number;
    documentsShared: number;
  };
}

interface UserProductivity {
  userId: string;
  name: string;
  role: string;
  wordsWritten: number;
  documentsCreated: number;
  collaborations: number;
  timeSpent: number;
  productivityScore: number;
  trend: 'up' | 'down' | 'stable';
}

interface DocumentAnalytics {
  id: string;
  title: string;
  author: string;
  wordCount: number;
  collaborators: number;
  views: number;
  edits: number;
  timeToComplete: number;
  category: string;
  lastModified: Date;
}

export const AdvancedAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState(0);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [userProductivity, setUserProductivity] = useState<UserProductivity[]>([]);
  const [documentAnalytics, setDocumentAnalytics] = useState<DocumentAnalytics[]>([]);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const timeRanges = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 3 months' },
    { value: '1y', label: 'Last year' }
  ];

  const chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  useEffect(() => {
    loadAnalyticsData();
    loadUserProductivity();
    loadDocumentAnalytics();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    const mockData: AnalyticsData = {
      timeRange,
      teamMetrics: {
        totalUsers: 23,
        activeUsers: 18,
        newUsers: 3,
        userRetention: 87.5
      },
      contentMetrics: {
        totalDocuments: 145,
        documentsCreated: 12,
        wordsWritten: 45789,
        averageWordsPerDocument: 1204,
        collaborativeDocuments: 67
      },
      productivityMetrics: {
        averageSessionDuration: 45.6,
        dailyActiveUsers: 15,
        weeklyActiveUsers: 20,
        monthlyActiveUsers: 23,
        peakUsageHours: ['9:00 AM', '2:00 PM', '7:00 PM']
      },
      collaborationMetrics: {
        realTimeCollaborations: 89,
        commentsAdded: 234,
        suggestionsAccepted: 156,
        documentsShared: 78
      }
    };
    setAnalyticsData(mockData);
  };

  const loadUserProductivity = async () => {
    const mockUsers: UserProductivity[] = [
      {
        userId: 'user1',
        name: 'Sarah Chen',
        role: 'Editor',
        wordsWritten: 15678,
        documentsCreated: 8,
        collaborations: 23,
        timeSpent: 67.5,
        productivityScore: 92,
        trend: 'up'
      },
      {
        userId: 'user2',
        name: 'Mike Rodriguez',
        role: 'Writer',
        wordsWritten: 12456,
        documentsCreated: 6,
        collaborations: 18,
        timeSpent: 54.2,
        productivityScore: 88,
        trend: 'up'
      },
      {
        userId: 'user3',
        name: 'Emma Thompson',
        role: 'Manager',
        wordsWritten: 8934,
        documentsCreated: 4,
        collaborations: 35,
        timeSpent: 72.1,
        productivityScore: 85,
        trend: 'stable'
      },
      {
        userId: 'user4',
        name: 'John Doe',
        role: 'Writer',
        wordsWritten: 6789,
        documentsCreated: 3,
        collaborations: 12,
        timeSpent: 38.9,
        productivityScore: 76,
        trend: 'down'
      }
    ];
    setUserProductivity(mockUsers);
  };

  const loadDocumentAnalytics = async () => {
    const mockDocs: DocumentAnalytics[] = [
      {
        id: 'doc1',
        title: 'Q1 Marketing Strategy',
        author: 'Sarah Chen',
        wordCount: 2345,
        collaborators: 4,
        views: 78,
        edits: 23,
        timeToComplete: 8.5,
        category: 'Strategy',
        lastModified: new Date('2024-03-10')
      },
      {
        id: 'doc2',
        title: 'Product Launch Guide',
        author: 'Mike Rodriguez',
        wordCount: 1876,
        collaborators: 3,
        views: 56,
        edits: 18,
        timeToComplete: 12.3,
        category: 'Documentation',
        lastModified: new Date('2024-03-09')
      },
      {
        id: 'doc3',
        title: 'User Research Findings',
        author: 'Emma Thompson',
        wordCount: 3421,
        collaborators: 5,
        views: 92,
        edits: 31,
        timeToComplete: 15.7,
        category: 'Research',
        lastModified: new Date('2024-03-08')
      }
    ];
    setDocumentAnalytics(mockDocs);
  };

  const generateTimeSeriesData = () => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const data = [];
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toLocaleDateString(),
        wordsWritten: Math.floor(Math.random() * 2000) + 500,
        documentsCreated: Math.floor(Math.random() * 5) + 1,
        activeUsers: Math.floor(Math.random() * 10) + 10,
        collaborations: Math.floor(Math.random() * 15) + 5
      });
    }
    
    return data;
  };

  const generateCategoryData = () => {
    return [
      { name: 'Strategy', value: 25, color: chartColors[0] },
      { name: 'Documentation', value: 35, color: chartColors[1] },
      { name: 'Research', value: 20, color: chartColors[2] },
      { name: 'Creative', value: 15, color: chartColors[3] },
      { name: 'Reports', value: 5, color: chartColors[4] }
    ];
  };

  const generateProductivityRadarData = () => {
    return [
      { metric: 'Speed', value: 85 },
      { metric: 'Quality', value: 92 },
      { metric: 'Collaboration', value: 78 },
      { metric: 'Consistency', value: 88 },
      { metric: 'Innovation', value: 75 },
      { metric: 'Communication', value: 90 }
    ];
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUpIcon color="success" />;
      case 'down':
        return <TrendingDownIcon color="error" />;
      default:
        return <span style={{ color: '#666' }}>—</span>;
    }
  };

  const exportReport = () => {
    const report = {
      timeRange,
      generatedAt: new Date().toISOString(),
      analytics: analyticsData,
      userProductivity,
      documentAnalytics
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!analyticsData) return null;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Advanced Analytics
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              {timeRanges.map(range => (
                <MenuItem key={range.value} value={range.value}>
                  {range.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={exportReport}
          >
            Export Report
          </Button>
        </Box>
      </Box>

      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Active Users
                  </Typography>
                  <Typography variant="h4">
                    {analyticsData.teamMetrics.activeUsers}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    +{analyticsData.teamMetrics.newUsers} new this period
                  </Typography>
                </Box>
                <PersonIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Words Written
                  </Typography>
                  <Typography variant="h4">
                    {analyticsData.contentMetrics.wordsWritten.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="info.main">
                    {analyticsData.contentMetrics.averageWordsPerDocument} avg/doc
                  </Typography>
                </Box>
                <DescriptionIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Collaborations
                  </Typography>
                  <Typography variant="h4">
                    {analyticsData.collaborationMetrics.realTimeCollaborations}
                  </Typography>
                  <Typography variant="body2" color="warning.main">
                    {analyticsData.collaborationMetrics.commentsAdded} comments
                  </Typography>
                </Box>
                <GroupIcon sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Avg Session
                  </Typography>
                  <Typography variant="h4">
                    {analyticsData.productivityMetrics.averageSessionDuration}m
                  </Typography>
                  <Typography variant="body2" color="error.main">
                    {analyticsData.teamMetrics.userRetention}% retention
                  </Typography>
                </Box>
                <TimerIcon sx={{ fontSize: 40, color: 'error.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Overview" />
          <Tab label="User Productivity" />
          <Tab label="Document Analytics" />
          <Tab label="Team Performance" />
        </Tabs>
      </Paper>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Writing Activity Over Time
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={generateTimeSeriesData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="wordsWritten" stroke={chartColors[0]} name="Words Written" />
                    <Line type="monotone" dataKey="activeUsers" stroke={chartColors[1]} name="Active Users" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Content Categories
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={generateCategoryData()}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {generateCategoryData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Daily Activity Patterns
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={generateTimeSeriesData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="collaborations" stackId="1" stroke={chartColors[2]} fill={chartColors[2]} />
                    <Area type="monotone" dataKey="documentsCreated" stackId="1" stroke={chartColors[3]} fill={chartColors[3]} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Words Written</TableCell>
                    <TableCell>Documents</TableCell>
                    <TableCell>Collaborations</TableCell>
                    <TableCell>Time Spent</TableCell>
                    <TableCell>Score</TableCell>
                    <TableCell>Trend</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {userProductivity.map(user => (
                    <TableRow key={user.userId}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            {user.name.split(' ').map(n => n.charAt(0)).join('')}
                          </Avatar>
                          {user.name}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={user.role} size="small" />
                      </TableCell>
                      <TableCell>{user.wordsWritten.toLocaleString()}</TableCell>
                      <TableCell>{user.documentsCreated}</TableCell>
                      <TableCell>{user.collaborations}</TableCell>
                      <TableCell>{user.timeSpent}h</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">{user.productivityScore}</Typography>
                          <Box sx={{ width: 60, height: 4, backgroundColor: 'grey.300', borderRadius: 2 }}>
                            <Box
                              sx={{
                                width: `${user.productivityScore}%`,
                                height: '100%',
                                backgroundColor: user.productivityScore >= 85 ? 'success.main' : user.productivityScore >= 70 ? 'warning.main' : 'error.main',
                                borderRadius: 2
                              }}
                            />
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{getTrendIcon(user.trend)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Team Performance Radar
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={generateProductivityRadarData()}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="Team Performance" dataKey="value" stroke={chartColors[0]} fill={chartColors[0]} fillOpacity={0.6} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Document</TableCell>
                <TableCell>Author</TableCell>
                <TableCell>Word Count</TableCell>
                <TableCell>Collaborators</TableCell>
                <TableCell>Views</TableCell>
                <TableCell>Edits</TableCell>
                <TableCell>Time to Complete</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Last Modified</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {documentAnalytics.map(doc => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <Typography variant="subtitle2">{doc.title}</Typography>
                  </TableCell>
                  <TableCell>{doc.author}</TableCell>
                  <TableCell>{doc.wordCount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <GroupIcon fontSize="small" />
                      {doc.collaborators}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <VisibilityIcon fontSize="small" />
                      {doc.views}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EditIcon fontSize="small" />
                      {doc.edits}
                    </Box>
                  </TableCell>
                  <TableCell>{doc.timeToComplete}h</TableCell>
                  <TableCell>
                    <Chip label={doc.category} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{doc.lastModified.toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Top Performers
                </Typography>
                <List>
                  {userProductivity
                    .sort((a, b) => b.productivityScore - a.productivityScore)
                    .slice(0, 5)
                    .map((user, index) => (
                      <React.Fragment key={user.userId}>
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar sx={{ backgroundColor: index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? '#cd7f32' : 'grey.400' }}>
                              {index < 3 ? <StarIcon /> : index + 1}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={user.name}
                            secondary={`Score: ${user.productivityScore} | ${user.wordsWritten.toLocaleString()} words`}
                          />
                        </ListItem>
                        {index < 4 && <Divider />}
                      </React.Fragment>
                    ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Team Insights
                </Typography>
                <Box sx={{ p: 2 }}>
                  <Typography variant="body1" gutterBottom>
                    <strong>Peak Productivity Hours:</strong>
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    {analyticsData.productivityMetrics.peakUsageHours.map(hour => (
                      <Chip key={hour} label={hour} variant="outlined" />
                    ))}
                  </Box>
                  
                  <Typography variant="body1" gutterBottom>
                    <strong>Collaboration Rate:</strong> {Math.round((analyticsData.contentMetrics.collaborativeDocuments / analyticsData.contentMetrics.totalDocuments) * 100)}%
                  </Typography>
                  
                  <Typography variant="body1" gutterBottom>
                    <strong>Average Document Quality:</strong> {Math.round(userProductivity.reduce((acc, user) => acc + user.productivityScore, 0) / userProductivity.length)}%
                  </Typography>
                  
                  <Typography variant="body1">
                    <strong>Team Growth:</strong> +{analyticsData.teamMetrics.newUsers} new members this {timeRange}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Productivity Trends
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={generateTimeSeriesData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="documentsCreated" fill={chartColors[0]} name="Documents Created" />
                    <Bar dataKey="collaborations" fill={chartColors[1]} name="Collaborations" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};