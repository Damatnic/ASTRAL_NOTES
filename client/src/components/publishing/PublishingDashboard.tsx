/**
 * Professional Publishing Dashboard
 * Main dashboard for Phase 2D professional publishing features
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Book,
  TrendingUp,
  DollarSign,
  Send,
  Award,
  FileText,
  Calendar,
  Target,
  Users,
  Globe,
  BarChart3,
  Settings,
  Plus,
  Eye,
  Download,
  Share2,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

interface PublishingProject {
  id: string;
  title: string;
  status: 'draft' | 'formatted' | 'submitted' | 'published';
  wordCount: number;
  genre: string[];
  publishingPath: 'self' | 'traditional' | 'hybrid';
  submissions: any[];
  contracts: any[];
  salesData: any[];
  directPublications: any[];
  manuscripts: any[];
}

interface DashboardStats {
  totalProjects: number;
  activeSubmissions: number;
  totalEarnings: number;
  publishedBooks: number;
  submissionResponseRate: number;
  averageRating: number;
}

export const PublishingDashboard: React.FC = () => {
  const [projects, setProjects] = useState<PublishingProject[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'submissions' | 'marketing' | 'analytics'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load publishing projects
      const projectsResponse = await fetch('/api/publishing/projects', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const projectsData = await projectsResponse.json();
      setProjects(projectsData);

      // Calculate dashboard stats
      const totalProjects = projectsData.length;
      const activeSubmissions = projectsData.reduce((sum: number, project: PublishingProject) => 
        sum + project.submissions.filter(s => s.status === 'submitted').length, 0);
      const totalEarnings = projectsData.reduce((sum: number, project: PublishingProject) => 
        sum + project.salesData.reduce((salesSum: number, sale: any) => salesSum + sale.royaltiesEarned, 0), 0);
      const publishedBooks = projectsData.filter(p => p.status === 'published').length;
      
      const allSubmissions = projectsData.flatMap(p => p.submissions);
      const responseRate = allSubmissions.length > 0 
        ? (allSubmissions.filter(s => s.responseDate).length / allSubmissions.length) * 100
        : 0;

      setStats({
        totalProjects,
        activeSubmissions,
        totalEarnings,
        publishedBooks,
        submissionResponseRate: responseRate,
        averageRating: 4.2 // This would come from aggregated review data
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText className="w-4 h-4" />;
      case 'formatted': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'submitted': return <Send className="w-4 h-4 text-yellow-500" />;
      case 'published': return <Book className="w-4 h-4 text-green-500" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getPublishingPathBadge = (path: string) => {
    const colors = {
      self: 'bg-blue-100 text-blue-800',
      traditional: 'bg-purple-100 text-purple-800',
      hybrid: 'bg-orange-100 text-orange-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[path as keyof typeof colors]}`}>
        {path.charAt(0).toUpperCase() + path.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Professional Publishing</h1>
              <p className="text-sm text-gray-600">Manage your publishing journey from manuscript to market</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>New Project</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'projects', label: 'Projects', icon: Book },
              { id: 'submissions', label: 'Submissions', icon: Send },
              { id: 'marketing', label: 'Marketing', icon: Target },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp }
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
                >
                  <div className="flex items-center">
                    <Book className="w-8 h-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Projects</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalProjects}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
                >
                  <div className="flex items-center">
                    <Send className="w-8 h-8 text-yellow-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Active Submissions</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.activeSubmissions}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
                >
                  <div className="flex items-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Published</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.publishedBooks}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
                >
                  <div className="flex items-center">
                    <DollarSign className="w-8 h-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                      <p className="text-2xl font-bold text-gray-900">${stats.totalEarnings.toLocaleString()}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
                >
                  <div className="flex items-center">
                    <TrendingUp className="w-8 h-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Response Rate</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.submissionResponseRate.toFixed(1)}%</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
                >
                  <div className="flex items-center">
                    <Award className="w-8 h-8 text-yellow-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Projects */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200"
              >
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Recent Projects</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {projects.slice(0, 5).map((project) => (
                      <div key={project.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(project.status)}
                          <div>
                            <p className="text-sm font-medium text-gray-900">{project.title}</p>
                            <p className="text-xs text-gray-500">
                              {project.wordCount.toLocaleString()} words • {project.genre.join(', ')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getPublishingPathBadge(project.publishingPath)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200"
              >
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center">
                      <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-700">Format Manuscript</p>
                    </button>
                    <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center">
                      <Send className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-700">Submit to Agents</p>
                    </button>
                    <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center">
                      <Target className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-700">Launch Campaign</p>
                    </button>
                    <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center">
                      <Globe className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-700">Publish Direct</p>
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Projects Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Publishing Projects</h2>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>New Project</span>
              </button>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(project.status)}
                        <h3 className="text-lg font-medium text-gray-900 truncate">{project.title}</h3>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <Settings className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-medium capitalize">{project.status}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Word Count:</span>
                        <span className="font-medium">{project.wordCount.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Genre:</span>
                        <span className="font-medium">{project.genre.slice(0, 2).join(', ')}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Path:</span>
                        {getPublishingPathBadge(project.publishingPath)}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-lg font-bold text-blue-600">{project.submissions.length}</p>
                          <p className="text-xs text-gray-600">Submissions</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-green-600">{project.contracts.length}</p>
                          <p className="text-xs text-gray-600">Contracts</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-purple-600">
                            ${project.salesData.reduce((sum, sale) => sum + sale.royaltiesEarned, 0).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-600">Earnings</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex space-x-2">
                      <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors">
                        Manage
                      </button>
                      <button className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors">
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Additional tabs would be implemented similarly */}
        {activeTab === 'submissions' && (
          <div className="text-center py-12">
            <Send className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Submission Tracking</h3>
            <p className="text-gray-600">Track your submissions to agents and publishers</p>
          </div>
        )}

        {activeTab === 'marketing' && (
          <div className="text-center py-12">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Marketing Automation</h3>
            <p className="text-gray-600">Manage your book marketing campaigns</p>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Publishing Analytics</h3>
            <p className="text-gray-600">Analyze your publishing performance</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublishingDashboard;