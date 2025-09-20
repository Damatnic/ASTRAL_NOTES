/**
 * Creator Dashboard Component
 * Comprehensive dashboard for template creators to manage their marketplace presence
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { useToast } from '@/components/ui/Toast';
import { 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  Star,
  Eye,
  Users,
  Crown,
  Verified,
  Award,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Settings,
  Edit,
  Plus,
  MoreHorizontal,
  Filter,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  FileText,
  Image,
  Upload,
  ExternalLink,
  Gift,
  Sparkles,
  Trophy,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Info
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { marketplaceApi } from '@/services/marketplaceApi';

interface CreatorStats {
  totalTemplates: number;
  totalDownloads: number;
  totalRevenue: number;
  averageRating: number;
  followerCount: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  isVerified: boolean;
  isFeatured: boolean;
}

interface TemplatePerformance {
  id: string;
  title: string;
  category: string;
  downloads: number;
  revenue: number;
  rating: number;
  reviews: number;
  likes: number;
  views: number;
  publishedAt: string;
  status: 'published' | 'reviewing' | 'draft' | 'rejected';
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
}

interface CreatorDashboardProps {
  className?: string;
}

const TIER_COLORS = {
  bronze: 'bg-orange-100 text-orange-800 border-orange-200',
  silver: 'bg-gray-100 text-gray-800 border-gray-200',
  gold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  platinum: 'bg-purple-100 text-purple-800 border-purple-200',
};

const TIER_ICONS = {
  bronze: <Award className="h-4 w-4" />,
  silver: <Trophy className="h-4 w-4" />,
  gold: <Crown className="h-4 w-4" />,
  platinum: <Sparkles className="h-4 w-4" />,
};

const STATUS_COLORS = {
  published: 'bg-green-100 text-green-800',
  reviewing: 'bg-yellow-100 text-yellow-800',
  draft: 'bg-gray-100 text-gray-800',
  rejected: 'bg-red-100 text-red-800',
};

const STATUS_ICONS = {
  published: <CheckCircle className="h-3 w-3" />,
  reviewing: <Clock className="h-3 w-3" />,
  draft: <Edit className="h-3 w-3" />,
  rejected: <XCircle className="h-3 w-3" />,
};

export function CreatorDashboard({ className }: CreatorDashboardProps) {
  const toast = useToast();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'templates' | 'analytics' | 'revenue' | 'profile'>('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [templates, setTemplates] = useState<TemplatePerformance[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [sortBy, setSortBy] = useState('recent');

  // Load creator data
  useEffect(() => {
    loadCreatorData();
  }, []);

  const loadCreatorData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashboardData, templatesData] = await Promise.all([
        marketplaceApi.getCreatorDashboard(),
        marketplaceApi.getCreatorTemplates('me', { page: 1, limit: 50, sortBy }),
      ]);

      setStats(dashboardData.stats);
      setTemplates(templatesData.templates);
    } catch (error) {
      console.error('Error loading creator data:', error);
      toast.error('Failed to load creator data');
    } finally {
      setLoading(false);
    }
  }, [sortBy, toast]);

  const formatNumber = useCallback((num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  }, []);

  const formatCurrency = useCallback((amount: number) => {
    return `$${amount.toFixed(2)}`;
  }, []);

  const renderStatCard = (
    title: string,
    value: string | number,
    icon: React.ReactNode,
    trend?: { value: number; direction: 'up' | 'down' },
    color: 'blue' | 'green' | 'purple' | 'yellow' = 'blue'
  ) => {
    const colorClasses = {
      blue: 'bg-blue-50 border-blue-200',
      green: 'bg-green-50 border-green-200',
      purple: 'bg-purple-50 border-purple-200',
      yellow: 'bg-yellow-50 border-yellow-200',
    };

    return (
      <Card className={cn("border-2", colorClasses[color])}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold">{value}</p>
              {trend && (
                <div className={cn(
                  "flex items-center gap-1 text-xs mt-1",
                  trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
                )}>
                  {trend.direction === 'up' ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {trend.value}% vs last month
                </div>
              )}
            </div>
            <div className={cn(
              "p-3 rounded-full",
              color === 'blue' && "bg-blue-100 text-blue-600",
              color === 'green' && "bg-green-100 text-green-600",
              color === 'purple' && "bg-purple-100 text-purple-600",
              color === 'yellow' && "bg-yellow-100 text-yellow-600"
            )}>
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {renderStatCard(
          'Total Revenue',
          formatCurrency(stats?.totalRevenue || 0),
          <DollarSign className="h-6 w-6" />,
          { value: 12.5, direction: 'up' },
          'green'
        )}
        {renderStatCard(
          'Total Downloads',
          formatNumber(stats?.totalDownloads || 0),
          <Download className="h-6 w-6" />,
          { value: 8.3, direction: 'up' },
          'blue'
        )}
        {renderStatCard(
          'Average Rating',
          stats?.averageRating?.toFixed(1) || '0.0',
          <Star className="h-6 w-6" />,
          { value: 2.1, direction: 'up' },
          'yellow'
        )}
        {renderStatCard(
          'Followers',
          formatNumber(stats?.followerCount || 0),
          <Users className="h-6 w-6" />,
          { value: 15.7, direction: 'up' },
          'purple'
        )}
      </div>

      {/* Creator Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Creator Status
            {stats?.isVerified && <Verified className="h-5 w-5 text-blue-500" />}
            {stats?.isFeatured && <Crown className="h-5 w-5 text-yellow-500" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge className={TIER_COLORS[stats?.tier || 'bronze']}>
                {TIER_ICONS[stats?.tier || 'bronze']}
                <span className="ml-1 capitalize">{stats?.tier || 'bronze'} Creator</span>
              </Badge>
              {stats?.isVerified && (
                <Badge variant="outline" className="text-blue-600 border-blue-200">
                  <Verified className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
              {stats?.isFeatured && (
                <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                  <Crown className="h-3 w-3 mr-1" />
                  Featured
                </Badge>
              )}
            </div>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Profile Settings
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-cosmic-600">{stats?.totalTemplates || 0}</p>
              <p className="text-sm text-muted-foreground">Published Templates</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-cosmic-600">97.2%</p>
              <p className="text-sm text-muted-foreground">Approval Rate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-cosmic-600">4.6</p>
              <p className="text-sm text-muted-foreground">Avg. Review Score</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Chart placeholder */}
              <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Revenue & Downloads Chart</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { action: 'New review on "Epic Fantasy Template"', time: '2 hours ago', type: 'review' },
                { action: 'Template "Romance Novel Guide" approved', time: '1 day ago', type: 'approval' },
                { action: '15 new downloads this week', time: '3 days ago', type: 'download' },
                { action: 'Reached 500 followers!', time: '1 week ago', type: 'milestone' },
              ].map((activity, index) => (
                <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-b-0">
                  <div className={cn(
                    "w-2 h-2 rounded-full mt-2",
                    activity.type === 'review' && "bg-blue-500",
                    activity.type === 'approval' && "bg-green-500",
                    activity.type === 'download' && "bg-purple-500",
                    activity.type === 'milestone' && "bg-yellow-500"
                  )} />
                  <div className="flex-1">
                    <p className="text-sm">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderTemplatesTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">My Templates</h3>
          <p className="text-muted-foreground">Manage your published templates</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Submit New Template
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your templates..."
                className="pl-9"
              />
            </div>
            <Dropdown
              options={[
                { value: 'recent', label: 'Recently Updated' },
                { value: 'popular', label: 'Most Popular' },
                { value: 'revenue', label: 'Highest Revenue' },
                { value: 'rating', label: 'Highest Rated' },
              ]}
              value={sortBy}
              onChange={setSortBy}
              placeholder="Sort by"
              className="w-48"
            />
            <Button variant="outline" onClick={loadCreatorData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Templates List */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }, (_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : templates.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-semibold mb-2">No templates yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by submitting your first template to the marketplace
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Submit Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          templates
            .filter(template => 
              template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              template.category.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map(template => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Template Thumbnail */}
                    <div className="w-16 h-16 bg-cosmic-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-8 w-8 text-cosmic-600" />
                    </div>

                    {/* Template Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold truncate">{template.title}</h4>
                        <Badge className={STATUS_COLORS[template.status]}>
                          {STATUS_ICONS[template.status]}
                          <span className="ml-1 capitalize">{template.status}</span>
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2 capitalize">
                        {template.category} • Published {new Date(template.publishedAt).toLocaleDateString()}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          {formatNumber(template.downloads)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          {template.rating.toFixed(1)} ({template.reviews})
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {formatNumber(template.likes)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {formatNumber(template.views)}
                        </div>
                      </div>
                    </div>

                    {/* Performance */}
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        {formatCurrency(template.revenue)}
                      </p>
                      <div className={cn(
                        "flex items-center gap-1 text-xs",
                        template.trend === 'up' ? 'text-green-600' : 
                        template.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                      )}>
                        {template.trend === 'up' ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : template.trend === 'down' ? (
                          <TrendingDown className="h-3 w-3" />
                        ) : (
                          <Target className="h-3 w-3" />
                        )}
                        {template.trendPercent}%
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </div>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Analytics</h3>
          <p className="text-muted-foreground">Track your template performance</p>
        </div>
        <Dropdown
          options={[
            { value: '7d', label: 'Last 7 days' },
            { value: '30d', label: 'Last 30 days' },
            { value: '90d', label: 'Last 3 months' },
            { value: '1y', label: 'Last year' },
          ]}
          value={selectedTimeRange}
          onChange={setSelectedTimeRange}
          placeholder="Time range"
          className="w-40"
        />
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Revenue Chart</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Download Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Activity className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Downloads Chart</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Template Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <PieChart className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Category Distribution</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Engagement Metrics</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderRevenueTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Revenue</h3>
          <p className="text-muted-foreground">Track your earnings and payouts</p>
        </div>
        <Button variant="outline">
          <ExternalLink className="h-4 w-4 mr-2" />
          Payment Settings
        </Button>
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold text-green-600">$2,847.50</p>
                <p className="text-xs text-muted-foreground mt-1">+12.5% vs last month</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Payout</p>
                <p className="text-2xl font-bold text-yellow-600">$142.30</p>
                <p className="text-xs text-muted-foreground mt-1">Next payout: Dec 1</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-blue-600">$385.20</p>
                <p className="text-xs text-muted-foreground mt-1">47 sales</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Revenue Trends Chart</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { template: 'Epic Fantasy Template', amount: 12.99, date: '2 hours ago', buyer: 'Anonymous' },
              { template: 'Romance Novel Guide', amount: 9.99, date: '1 day ago', buyer: 'John D.' },
              { template: 'Mystery Plot Framework', amount: 15.99, date: '2 days ago', buyer: 'Sarah M.' },
              { template: 'Character Development Kit', amount: 7.99, date: '3 days ago', buyer: 'Mike R.' },
            ].map((transaction, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b last:border-b-0">
                <div>
                  <p className="font-medium">{transaction.template}</p>
                  <p className="text-sm text-muted-foreground">
                    Sold to {transaction.buyer} • {transaction.date}
                  </p>
                </div>
                <p className="font-semibold text-green-600">
                  +${transaction.amount}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            Creator Dashboard
            {stats?.isVerified && <Verified className="h-8 w-8 text-blue-500" />}
          </h1>
          <p className="text-muted-foreground">
            Manage your template marketplace presence
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'templates', label: 'Templates', icon: FileText },
            { id: 'analytics', label: 'Analytics', icon: Activity },
            { id: 'revenue', label: 'Revenue', icon: DollarSign },
            { id: 'profile', label: 'Profile', icon: Settings },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors",
                activeTab === tab.id
                  ? "border-cosmic-500 text-cosmic-600"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'templates' && renderTemplatesTab()}
          {activeTab === 'analytics' && renderAnalyticsTab()}
          {activeTab === 'revenue' && renderRevenueTab()}
          {activeTab === 'profile' && (
            <div className="text-center py-12">
              <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Profile settings coming soon</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}