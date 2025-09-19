/**
 * Export Dashboard - Phase 1D Export Management
 * 
 * Comprehensive dashboard for managing export jobs, templates, and analytics
 * Provides real-time tracking, batch operations, and performance insights
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Download,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  RefreshCw,
  Trash2,
  Eye,
  BarChart3,
  Filter,
  Search,
  Calendar,
  Zap,
  TrendingUp,
  Award,
  Users,
  Settings,
  Plus,
  MoreVertical,
  ExternalLink,
  Share2,
  Archive
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Tabs, TabItem } from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/utils/cn';
import { formatDistanceToNow, format } from 'date-fns';

interface ExportJob {
  id: string;
  projectId: string;
  projectName: string;
  format: string;
  formatName: string;
  template?: string;
  templateName?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  stage: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedTime: number;
  processingTime?: number;
  outputSize?: number;
  qualityScore?: number;
  errorMessage?: string;
  outputUrl?: string;
  metadata: {
    title: string;
    author: string;
    wordCount: number;
    pageCount?: number;
  };
}

interface ExportStatistics {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  averageProcessingTime: number;
  averageQualityScore: number;
  popularFormats: Array<{ format: string; count: number; percentage: number }>;
  dailyExports: Array<{ date: string; count: number }>;
  performanceMetrics: {
    averageJobsPerMinute: number;
    peakProcessingTime: number;
    resourceUtilization: number;
  };
}

interface QueueStatus {
  pending: number;
  processing: number;
  estimated_wait_time: number;
}

export function ExportDashboard() {
  const toast = useToast();
  
  // State management
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [statistics, setStatistics] = useState<ExportStatistics | null>(null);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [selectedJob, setSelectedJob] = useState<ExportJob | null>(null);
  const [isJobDetailsOpen, setIsJobDetailsOpen] = useState(false);
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formatFilter, setFormatFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
    
    // Set up auto-refresh for real-time updates
    const interval = setInterval(() => {
      refreshData();
    }, 5000); // Refresh every 5 seconds
    
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // In a real implementation, these would be API calls
      await Promise.all([
        loadJobs(),
        loadStatistics(),
        loadQueueStatus()
      ]);
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load export dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      setIsRefreshing(true);
      await Promise.all([
        loadJobs(),
        loadQueueStatus()
      ]);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadJobs = async () => {
    // Mock data - in real implementation, this would be an API call
    const mockJobs: ExportJob[] = [
      {
        id: 'job_1',
        projectId: 'proj_1',
        projectName: 'The Stellar Chronicles',
        format: 'manuscript_pdf',
        formatName: 'Professional Manuscript (PDF)',
        template: 'novel_manuscript',
        templateName: 'Novel Manuscript (Industry Standard)',
        status: 'completed',
        progress: 100,
        stage: 'Completed',
        priority: 'normal',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5000),
        completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 45000),
        estimatedTime: 30000,
        processingTime: 42000,
        outputSize: 2048576, // 2MB
        qualityScore: 94,
        outputUrl: '/downloads/job_1.pdf',
        metadata: {
          title: 'The Stellar Chronicles',
          author: 'Jane Doe',
          wordCount: 75000,
          pageCount: 300
        }
      },
      {
        id: 'job_2',
        projectId: 'proj_2',
        projectName: 'Quantum Mysteries',
        format: 'kdp_interior',
        formatName: 'Kindle Direct Publishing Interior',
        template: 'kdp_paperback',
        templateName: 'KDP Paperback Interior',
        status: 'processing',
        progress: 67,
        stage: 'Converting format',
        priority: 'high',
        createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        startedAt: new Date(Date.now() - 10 * 60 * 1000),
        estimatedTime: 25000,
        metadata: {
          title: 'Quantum Mysteries',
          author: 'John Smith',
          wordCount: 82000,
          pageCount: 285
        }
      },
      {
        id: 'job_3',
        projectId: 'proj_3',
        projectName: 'Research Paper Draft',
        format: 'chicago_docx',
        formatName: 'Chicago Manual Style (DOCX)',
        template: 'academic_paper',
        templateName: 'Academic Paper (APA Style)',
        status: 'pending',
        progress: 0,
        stage: 'Waiting in queue',
        priority: 'low',
        createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        estimatedTime: 15000,
        metadata: {
          title: 'Research Paper Draft',
          author: 'Dr. Alice Cooper',
          wordCount: 12000,
          pageCount: 45
        }
      },
      {
        id: 'job_4',
        projectId: 'proj_4',
        projectName: 'Screenplay v2',
        format: 'final_draft',
        formatName: 'Final Draft (FDX)',
        status: 'failed',
        progress: 34,
        stage: 'Failed',
        priority: 'normal',
        createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        startedAt: new Date(Date.now() - 25 * 60 * 1000),
        estimatedTime: 20000,
        errorMessage: 'Invalid character encoding in scene 23',
        metadata: {
          title: 'The Last Stand',
          author: 'Mike Director',
          wordCount: 25000,
          pageCount: 120
        }
      }
    ];
    
    setJobs(mockJobs);
  };

  const loadStatistics = async () => {
    // Mock statistics data
    const mockStats: ExportStatistics = {
      totalJobs: 127,
      completedJobs: 98,
      failedJobs: 8,
      averageProcessingTime: 32500,
      averageQualityScore: 91.2,
      popularFormats: [
        { format: 'manuscript_pdf', count: 45, percentage: 35.4 },
        { format: 'kdp_interior', count: 32, percentage: 25.2 },
        { format: 'epub3', count: 28, percentage: 22.0 },
        { format: 'final_draft', count: 15, percentage: 11.8 },
        { format: 'docx', count: 7, percentage: 5.5 }
      ],
      dailyExports: [
        { date: '2024-01-15', count: 12 },
        { date: '2024-01-16', count: 18 },
        { date: '2024-01-17', count: 15 },
        { date: '2024-01-18', count: 22 },
        { date: '2024-01-19', count: 19 },
        { date: '2024-01-20', count: 24 },
        { date: '2024-01-21', count: 17 }
      ],
      performanceMetrics: {
        averageJobsPerMinute: 2.4,
        peakProcessingTime: 120000,
        resourceUtilization: 78.5
      }
    };
    
    setStatistics(mockStats);
  };

  const loadQueueStatus = async () => {
    // Mock queue status
    const mockQueueStatus: QueueStatus = {
      pending: 3,
      processing: 2,
      estimated_wait_time: 45000 // 45 seconds
    };
    
    setQueueStatus(mockQueueStatus);
  };

  const handleJobAction = async (jobId: string, action: string) => {
    try {
      switch (action) {
        case 'cancel':
          // API call to cancel job
          setJobs(jobs.map(job => 
            job.id === jobId 
              ? { ...job, status: 'cancelled' as const, progress: 0 }
              : job
          ));
          toast.success('Export job cancelled');
          break;
          
        case 'retry':
          // API call to retry job
          setJobs(jobs.map(job => 
            job.id === jobId 
              ? { ...job, status: 'pending' as const, progress: 0, errorMessage: undefined }
              : job
          ));
          toast.success('Export job queued for retry');
          break;
          
        case 'delete':
          // API call to delete job
          setJobs(jobs.filter(job => job.id !== jobId));
          toast.success('Export job deleted');
          break;
          
        case 'download':
          // Trigger download
          if (jobs.find(job => job.id === jobId)?.outputUrl) {
            // In real implementation, this would trigger a download
            toast.success('Download started');
          }
          break;
      }
    } catch (error) {
      console.error('Failed to perform job action:', error);
      toast.error(`Failed to ${action} job`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'cancelled':
        return <Pause className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter and sort jobs
  const filteredJobs = jobs
    .filter(job => {
      const matchesSearch = job.metadata.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           job.projectName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
      const matchesFormat = formatFilter === 'all' || job.format === formatFilter;
      
      return matchesSearch && matchesStatus && matchesFormat;
    })
    .sort((a, b) => {
      const aValue = a[sortBy as keyof ExportJob];
      const bValue = b[sortBy as keyof ExportJob];
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  // Pagination
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const paginatedJobs = filteredJobs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const tabs: TabItem[] = [
    {
      id: 'jobs',
      label: 'Export Jobs',
      icon: <FileText className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          {/* Filters and Search */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={formatFilter} onValueChange={setFormatFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Formats</SelectItem>
                <SelectItem value="manuscript_pdf">Manuscript PDF</SelectItem>
                <SelectItem value="kdp_interior">KDP Interior</SelectItem>
                <SelectItem value="epub3">EPUB 3.0</SelectItem>
                <SelectItem value="final_draft">Final Draft</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              onClick={refreshData}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Jobs List */}
          <div className="space-y-4">
            {paginatedJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(job.status)}
                        <h3 className="font-medium">{job.metadata.title}</h3>
                        <Badge className={getStatusColor(job.status)}>
                          {job.status}
                        </Badge>
                        <Badge className={getPriorityColor(job.priority)} variant="outline">
                          {job.priority}
                        </Badge>
                        {job.qualityScore && (
                          <Badge className="bg-green-100 text-green-800">
                            <Award className="h-3 w-3 mr-1" />
                            {job.qualityScore}%
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm text-muted-foreground mb-3">
                        <span>{job.formatName}</span>
                        <span>•</span>
                        <span>{job.metadata.wordCount.toLocaleString()} words</span>
                        <span>•</span>
                        <span>Created {formatDistanceToNow(job.createdAt)} ago</span>
                        {job.processingTime && (
                          <>
                            <span>•</span>
                            <span>Processed in {Math.round(job.processingTime / 1000)}s</span>
                          </>
                        )}
                      </div>
                      
                      {job.status === 'processing' && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{job.stage}</span>
                            <span>{Math.round(job.progress)}%</span>
                          </div>
                          <Progress value={job.progress} />
                        </div>
                      )}
                      
                      {job.status === 'failed' && job.errorMessage && (
                        <div className="text-sm text-red-600 bg-red-50 p-2 rounded mt-2">
                          Error: {job.errorMessage}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedJob(job);
                          setIsJobDetailsOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {job.status === 'completed' && job.outputUrl && (
                            <DropdownMenuItem
                              onClick={() => handleJobAction(job.id, 'download')}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                          )}
                          
                          {job.status === 'processing' && (
                            <DropdownMenuItem
                              onClick={() => handleJobAction(job.id, 'cancel')}
                            >
                              <Pause className="h-4 w-4 mr-2" />
                              Cancel
                            </DropdownMenuItem>
                          )}
                          
                          {job.status === 'failed' && (
                            <DropdownMenuItem
                              onClick={() => handleJobAction(job.id, 'retry')}
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Retry
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuItem
                            onClick={() => handleJobAction(job.id, 'delete')}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              <span className="flex items-center px-4 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          {statistics && (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium">Total Jobs</span>
                    </div>
                    <div className="text-2xl font-bold">{statistics.totalJobs}</div>
                    <div className="text-xs text-muted-foreground">
                      {statistics.completedJobs} completed
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium">Avg. Processing</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {Math.round(statistics.averageProcessingTime / 1000)}s
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Under 30-second target
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="h-5 w-5 text-purple-600" />
                      <span className="text-sm font-medium">Quality Score</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {statistics.averageQualityScore.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Industry excellence
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-5 w-5 text-orange-600" />
                      <span className="text-sm font-medium">Success Rate</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {((statistics.completedJobs / statistics.totalJobs) * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      High reliability
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Popular Formats */}
              <Card>
                <CardHeader>
                  <CardTitle>Popular Export Formats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {statistics.popularFormats.map((format) => (
                      <div key={format.format} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{format.format}</span>
                          <span>{format.count} exports ({format.percentage}%)</span>
                        </div>
                        <Progress value={format.percentage} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {statistics.performanceMetrics.averageJobsPerMinute}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Jobs per minute
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round(statistics.performanceMetrics.peakProcessingTime / 1000)}s
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Peak processing time
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {statistics.performanceMetrics.resourceUtilization}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Resource utilization
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      ),
    },
    {
      id: 'queue',
      label: 'Queue Status',
      icon: <Clock className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          {queueStatus && (
            <>
              {/* Queue Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {queueStatus.pending}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Pending Jobs
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {queueStatus.processing}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Processing Now
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(queueStatus.estimated_wait_time / 1000)}s
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Estimated Wait
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Processing Queue */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Processing Queue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {jobs
                      .filter(job => job.status === 'processing' || job.status === 'pending')
                      .sort((a, b) => {
                        if (a.status === 'processing' && b.status === 'pending') return -1;
                        if (a.status === 'pending' && b.status === 'processing') return 1;
                        return a.createdAt.getTime() - b.createdAt.getTime();
                      })
                      .map((job, index) => (
                        <div key={job.id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {getStatusIcon(job.status)}
                              <span className="font-medium">{job.metadata.title}</span>
                              <Badge className={getPriorityColor(job.priority)} variant="outline">
                                {job.priority}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {job.formatName} • {job.metadata.wordCount.toLocaleString()} words
                            </div>
                            
                            {job.status === 'processing' && (
                              <div className="mt-2">
                                <div className="flex justify-between text-xs mb-1">
                                  <span>{job.stage}</span>
                                  <span>{Math.round(job.progress)}%</span>
                                </div>
                                <Progress value={job.progress} className="h-2" />
                              </div>
                            )}
                          </div>
                          
                          <div className="text-sm text-muted-foreground">
                            Est. {Math.round(job.estimatedTime / 1000)}s
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Export Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your professional export jobs and track performance
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Export
          </Button>
        </div>
      </div>

      {/* Queue Status Bar */}
      {queueStatus && (
        <Card className="bg-gradient-to-r from-blue-50 to-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Export System Status</span>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  Online
                </Badge>
              </div>
              
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <span>{queueStatus.pending} pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  <span>{queueStatus.processing} processing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>~{Math.round(queueStatus.estimated_wait_time / 1000)}s wait</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs tabs={tabs} variant="underline" />

      {/* Job Details Modal */}
      {selectedJob && (
        <Dialog open={isJobDetailsOpen} onOpenChange={setIsJobDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getStatusIcon(selectedJob.status)}
                Export Job Details
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Project:</span> {selectedJob.projectName}
                </div>
                <div>
                  <span className="font-medium">Format:</span> {selectedJob.formatName}
                </div>
                <div>
                  <span className="font-medium">Template:</span> {selectedJob.templateName || 'None'}
                </div>
                <div>
                  <span className="font-medium">Priority:</span> 
                  <Badge className={`ml-2 ${getPriorityColor(selectedJob.priority)}`}>
                    {selectedJob.priority}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Created:</span> {format(selectedJob.createdAt, 'PPp')}
                </div>
                {selectedJob.completedAt && (
                  <div>
                    <span className="font-medium">Completed:</span> {format(selectedJob.completedAt, 'PPp')}
                  </div>
                )}
                <div>
                  <span className="font-medium">Word Count:</span> {selectedJob.metadata.wordCount.toLocaleString()}
                </div>
                {selectedJob.outputSize && (
                  <div>
                    <span className="font-medium">File Size:</span> {(selectedJob.outputSize / 1024 / 1024).toFixed(2)} MB
                  </div>
                )}
              </div>

              {selectedJob.status === 'processing' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{selectedJob.stage}</span>
                    <span>{Math.round(selectedJob.progress)}%</span>
                  </div>
                  <Progress value={selectedJob.progress} />
                </div>
              )}

              {selectedJob.qualityScore && (
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Quality Score:</span>
                  <Badge className="bg-green-100 text-green-800">
                    {selectedJob.qualityScore}%
                  </Badge>
                </div>
              )}

              {selectedJob.errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="font-medium text-red-800 mb-1">Error Details:</div>
                  <div className="text-sm text-red-700">{selectedJob.errorMessage}</div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                {selectedJob.status === 'completed' && selectedJob.outputUrl && (
                  <Button
                    onClick={() => handleJobAction(selectedJob.id, 'download')}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Export
                  </Button>
                )}
                
                {selectedJob.status === 'failed' && (
                  <Button
                    onClick={() => handleJobAction(selectedJob.id, 'retry')}
                    variant="outline"
                    className="flex-1"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Retry Export
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default ExportDashboard;