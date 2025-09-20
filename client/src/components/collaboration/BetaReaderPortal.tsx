/**
 * Beta Reader Portal Component
 * Comprehensive interface for beta reader management and assignments
 */

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Star, 
  Clock, 
  MessageSquare, 
  CheckCircle,
  AlertCircle,
  Users,
  Calendar,
  BarChart3,
  Award,
  Eye,
  FileText,
  Send,
  User,
  MapPin,
  Globe,
  TrendingUp,
  Plus,
  Settings,
  Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Progress } from '@/components/ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Textarea';

import { betaReaderService } from '@/services/betaReaderService';
import { 
  BetaReader, 
  BetaAssignment, 
  BetaFeedback, 
  BetaReaderMatch,
  BetaReaderSearch 
} from '@/types/collaboration';

interface BetaReaderPortalProps {
  currentUserId: string;
  userRole: 'author' | 'beta-reader' | 'both';
}

export const BetaReaderPortal: React.FC<BetaReaderPortalProps> = ({ 
  currentUserId, 
  userRole 
}) => {
  const [activeTab, setActiveTab] = useState('discover');
  const [betaReaders, setBetaReaders] = useState<BetaReader[]>([]);
  const [myAssignments, setMyAssignments] = useState<BetaAssignment[]>([]);
  const [authorAssignments, setAuthorAssignments] = useState<BetaAssignment[]>([]);
  const [smartMatches, setSmartMatches] = useState<BetaReaderMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCriteria, setSearchCriteria] = useState<BetaReaderSearch>({});
  const [selectedReader, setSelectedReader] = useState<BetaReader | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<BetaAssignment | null>(null);

  useEffect(() => {
    loadData();
  }, [currentUserId]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (userRole === 'author' || userRole === 'both') {
        const [readers, authorAssigns] = await Promise.all([
          betaReaderService.searchBetaReaders(searchCriteria),
          betaReaderService.getAuthorAssignments(currentUserId)
        ]);
        setBetaReaders(readers);
        setAuthorAssignments(authorAssigns);
      }

      if (userRole === 'beta-reader' || userRole === 'both') {
        const betaAssigns = await betaReaderService.getBetaReaderAssignments(currentUserId);
        setMyAssignments(betaAssigns);
      }

      // Get smart matches for current projects (mock data for now)
      if (userRole === 'author' || userRole === 'both') {
        const matches = await betaReaderService.getSmartMatches(
          'project-1',
          currentUserId,
          ['fantasy', 'adventure'],
          80000,
          new Date(Date.now() + (30 * 24 * 60 * 60 * 1000))
        );
        setSmartMatches(matches);
      }
    } catch (error) {
      console.error('Error loading beta reader data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    const readers = await betaReaderService.searchBetaReaders(searchCriteria);
    setBetaReaders(readers);
  };

  const getExperienceColor = (experience: string) => {
    const colors: Record<string, string> = {
      'professional': 'bg-purple-100 text-purple-800',
      'advanced': 'bg-blue-100 text-blue-800',
      'intermediate': 'bg-green-100 text-green-800',
      'beginner': 'bg-yellow-100 text-yellow-800'
    };
    return colors[experience] || colors.beginner;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'assigned': 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-orange-100 text-orange-800',
      'completed': 'bg-green-100 text-green-800',
      'overdue': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.assigned;
  };

  const getMatchRecommendationColor = (recommendation: string) => {
    const colors: Record<string, string> = {
      'strong': 'bg-green-100 text-green-800',
      'good': 'bg-blue-100 text-blue-800',
      'moderate': 'bg-yellow-100 text-yellow-800',
      'weak': 'bg-gray-100 text-gray-800'
    };
    return colors[recommendation] || colors.weak;
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Beta Reader Portal</h1>
          <p className="text-gray-600 mt-1">
            Connect with beta readers, manage assignments, and track feedback
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Assignment
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Assignments</p>
                <p className="text-2xl font-bold text-blue-600">
                  {myAssignments.filter(a => a.status === 'in-progress').length}
                </p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Projects</p>
                <p className="text-2xl font-bold text-green-600">
                  {myAssignments.filter(a => a.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-yellow-600">4.8</p>
              </div>
              <Star className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Words Read</p>
                <p className="text-2xl font-bold text-purple-600">1.2M</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="smart-match">Smart Match</TabsTrigger>
          <TabsTrigger value="my-assignments">My Assignments</TabsTrigger>
          <TabsTrigger value="author-view">Author View</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Discover Tab */}
        <TabsContent value="discover" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search beta readers by name, specialties, or genres..."
                      value={searchCriteria.genres?.join(', ') || ''}
                      onChange={(e) => setSearchCriteria({
                        ...searchCriteria,
                        genres: e.target.value ? e.target.value.split(',').map(g => g.trim()) : undefined
                      })}
                    />
                  </div>
                  <Button onClick={handleSearch}>
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Select 
                    value={searchCriteria.experience || 'all'} 
                    onValueChange={(value) => setSearchCriteria({
                      ...searchCriteria,
                      experience: value === 'all' ? undefined : value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Experience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="beginner">Beginner</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select 
                    value={searchCriteria.feedbackStyle || 'all'}
                    onValueChange={(value) => setSearchCriteria({
                      ...searchCriteria,
                      feedbackStyle: value === 'all' ? undefined : value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Feedback Style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Styles</SelectItem>
                      <SelectItem value="developmental">Developmental</SelectItem>
                      <SelectItem value="line-editing">Line Editing</SelectItem>
                      <SelectItem value="copy-editing">Copy Editing</SelectItem>
                      <SelectItem value="proofreading">Proofreading</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select 
                    value={searchCriteria.availability || 'all'}
                    onValueChange={(value) => setSearchCriteria({
                      ...searchCriteria,
                      availability: value === 'all' ? undefined : value as any
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Availability" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Availability</SelectItem>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="within-week">Within Week</SelectItem>
                      <SelectItem value="within-month">Within Month</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select 
                    value={searchCriteria.sortBy || 'rating'}
                    onValueChange={(value) => setSearchCriteria({
                      ...searchCriteria,
                      sortBy: value as any
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rating">Rating</SelectItem>
                      <SelectItem value="experience">Experience</SelectItem>
                      <SelectItem value="turnaround">Turnaround</SelectItem>
                      <SelectItem value="availability">Availability</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Beta Readers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {betaReaders.map((reader) => (
              <BetaReaderCard
                key={reader.id}
                reader={reader}
                onViewProfile={() => setSelectedReader(reader)}
                onContact={() => {/* Handle contact */}}
              />
            ))}
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading beta readers...</p>
            </div>
          )}
        </TabsContent>

        {/* Smart Match Tab */}
        <TabsContent value="smart-match" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Smart Matches for Your Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {smartMatches.map((match, index) => (
                  <SmartMatchCard
                    key={`${match.betaReaderId}-${index}`}
                    match={match}
                    onViewReader={async () => {
                      const reader = await betaReaderService.getBetaReader(match.betaReaderId);
                      if (reader) setSelectedReader(reader);
                    }}
                    onContact={() => {/* Handle contact */}}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Assignments Tab */}
        <TabsContent value="my-assignments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {myAssignments.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                viewType="beta-reader"
                onViewDetails={() => setSelectedAssignment(assignment)}
                onSubmitFeedback={() => {/* Handle feedback submission */}}
              />
            ))}
          </div>

          {myAssignments.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments yet</h3>
              <p className="text-gray-600">
                Complete your profile to start receiving beta reading assignments.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Author View Tab */}
        <TabsContent value="author-view" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {authorAssignments.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                viewType="author"
                onViewDetails={() => setSelectedAssignment(assignment)}
                onViewFeedback={() => {/* Handle view feedback */}}
              />
            ))}
          </div>

          {authorAssignments.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments created</h3>
              <p className="text-gray-600 mb-4">
                Create your first beta reading assignment to get feedback on your work.
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Assignment
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Dashboard</h3>
                  <p className="text-gray-600">
                    Detailed analytics and insights will be shown here.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Activity Timeline</h3>
                  <p className="text-gray-600">
                    Recent activity and milestones will appear here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Beta Reader Profile Modal */}
      {selectedReader && (
        <BetaReaderProfileModal
          reader={selectedReader}
          isOpen={!!selectedReader}
          onClose={() => setSelectedReader(null)}
          onContact={() => {/* Handle contact */}}
        />
      )}

      {/* Assignment Details Modal */}
      {selectedAssignment && (
        <AssignmentDetailsModal
          assignment={selectedAssignment}
          isOpen={!!selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
          userRole={userRole}
        />
      )}
    </div>
  );
};

// Beta Reader Card Component
interface BetaReaderCardProps {
  reader: BetaReader;
  onViewProfile: () => void;
  onContact: () => void;
}

const BetaReaderCard: React.FC<BetaReaderCardProps> = ({ reader, onViewProfile, onContact }) => {
  const getExperienceColor = (experience: string) => {
    const colors: Record<string, string> = {
      'professional': 'bg-purple-100 text-purple-800',
      'advanced': 'bg-blue-100 text-blue-800',
      'intermediate': 'bg-green-100 text-green-800',
      'beginner': 'bg-yellow-100 text-yellow-800'
    };
    return colors[experience] || colors.beginner;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <Avatar src={reader.avatar} alt={reader.displayName} size="lg" />
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-900 truncate">
              {reader.displayName}
            </h3>
            <p className="text-sm text-gray-600">@{reader.username}</p>
            
            <div className="flex items-center gap-2 mt-2">
              <Badge className={getExperienceColor(reader.profile.experience)}>
                {reader.profile.experience}
              </Badge>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                <span>{reader.statistics.averageRating.toFixed(1)}</span>
                <span>({reader.statistics.projectsCompleted})</span>
              </div>
            </div>
          </div>
          
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            reader.availability.isAvailable 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {reader.availability.isAvailable ? 'Available' : 'Busy'}
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {reader.profile.bio}
        </p>

        {/* Specialties */}
        <div className="flex flex-wrap gap-1 mb-4">
          {reader.profile.specialties.slice(0, 3).map((specialty) => (
            <Badge key={specialty} variant="secondary" className="text-xs">
              {specialty.replace('-', ' ')}
            </Badge>
          ))}
          {reader.profile.specialties.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{reader.profile.specialties.length - 3}
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{reader.statistics.averageTurnaroundDays}d avg</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            <span>{(reader.statistics.wordsRead / 1000).toFixed(0)}k words</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>{reader.statistics.authorSatisfactionScore}% satisfaction</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            <span>{reader.statistics.responseRate}% response</span>
          </div>
        </div>

        {/* Genres */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-1">Preferred Genres:</p>
          <div className="flex flex-wrap gap-1">
            {reader.profile.genres.slice(0, 4).map((genre) => (
              <span key={genre} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                {genre.replace('-', ' ')}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onViewProfile}>
            <Eye className="w-3 h-3 mr-1" />
            View Profile
          </Button>
          <Button size="sm" className="flex-1" onClick={onContact}>
            <MessageSquare className="w-3 h-3 mr-1" />
            Contact
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Smart Match Card Component
interface SmartMatchCardProps {
  match: BetaReaderMatch;
  onViewReader: () => void;
  onContact: () => void;
}

const SmartMatchCard: React.FC<SmartMatchCardProps> = ({ match, onViewReader, onContact }) => {
  const getMatchRecommendationColor = (recommendation: string) => {
    const colors: Record<string, string> = {
      'strong': 'bg-green-100 text-green-800',
      'good': 'bg-blue-100 text-blue-800',
      'moderate': 'bg-yellow-100 text-yellow-800',
      'weak': 'bg-gray-100 text-gray-800'
    };
    return colors[recommendation] || colors.weak;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-medium text-gray-900">Beta Reader {match.betaReaderId}</h3>
              <Badge className={getMatchRecommendationColor(match.recommendation)}>
                {match.recommendation} match
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                {match.score}% match
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {match.confidence}% confidence
              </span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">{match.score}</div>
            <div className="text-xs text-gray-500">Match Score</div>
          </div>
        </div>

        {/* Match Progress */}
        <div className="mb-4">
          <Progress value={match.score} className="h-2" />
        </div>

        {/* Key Factors */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Key Matching Factors:</p>
          <div className="space-y-1">
            {match.factors.slice(0, 3).map((factor, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-600">{factor.name}</span>
                <span className="font-medium">{Math.round(factor.score)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reasoning */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            {match.reasoning[0]}
          </p>
        </div>

        {/* Potential Issues */}
        {match.potentialIssues.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm font-medium text-yellow-800 mb-1">Considerations:</p>
            <p className="text-sm text-yellow-700">{match.potentialIssues[0]}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onViewReader}>
            <User className="w-3 h-3 mr-1" />
            View Profile
          </Button>
          <Button size="sm" className="flex-1" onClick={onContact}>
            <Send className="w-3 h-3 mr-1" />
            Contact
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Assignment Card Component
interface AssignmentCardProps {
  assignment: BetaAssignment;
  viewType: 'author' | 'beta-reader';
  onViewDetails: () => void;
  onSubmitFeedback?: () => void;
  onViewFeedback?: () => void;
}

const AssignmentCard: React.FC<AssignmentCardProps> = ({ 
  assignment, 
  viewType, 
  onViewDetails, 
  onSubmitFeedback,
  onViewFeedback 
}) => {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'assigned': 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-orange-100 text-orange-800',
      'completed': 'bg-green-100 text-green-800',
      'overdue': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.assigned;
  };

  const progressPercentage = (assignment.progress.sectionsCompleted / assignment.progress.totalSections) * 100;
  const isOverdue = assignment.progress.completionEstimate < new Date() && assignment.status !== 'completed';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900 mb-1">
              Project {assignment.projectId}
            </h3>
            <p className="text-sm text-gray-600">
              {viewType === 'author' 
                ? `Beta Reader: ${assignment.betaReaderId}`
                : `Author: ${assignment.authorId}`
              }
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <Badge className={getStatusColor(assignment.status)}>
              {assignment.status}
            </Badge>
            {isOverdue && (
              <Badge className="bg-red-100 text-red-800">
                <AlertCircle className="w-3 h-3 mr-1" />
                Overdue
              </Badge>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{assignment.progress.sectionsCompleted}/{assignment.progress.totalSections} sections</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            <span>{assignment.progress.wordsRead.toLocaleString()}/{assignment.progress.totalWords.toLocaleString()} words</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{Math.round(assignment.progress.timeSpent / 60)}h spent</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>Due: {assignment.progress.completionEstimate.toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            <span>{assignment.feedback.length} feedback items</span>
          </div>
        </div>

        {/* Sections */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Sections:</p>
          <div className="space-y-1">
            {assignment.sections.slice(0, 2).map((section) => (
              <div key={section.id} className="flex justify-between text-sm">
                <span className="text-gray-600 truncate">{section.title}</span>
                <Badge 
                  variant="secondary" 
                  className={section.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                >
                  {section.status}
                </Badge>
              </div>
            ))}
            {assignment.sections.length > 2 && (
              <p className="text-sm text-gray-500">+{assignment.sections.length - 2} more sections</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onViewDetails}>
            <Eye className="w-3 h-3 mr-1" />
            Details
          </Button>
          
          {viewType === 'beta-reader' && assignment.status === 'in-progress' && onSubmitFeedback && (
            <Button size="sm" onClick={onSubmitFeedback}>
              <Send className="w-3 h-3 mr-1" />
              Submit Feedback
            </Button>
          )}
          
          {viewType === 'author' && assignment.feedback.length > 0 && onViewFeedback && (
            <Button size="sm" onClick={onViewFeedback}>
              <MessageSquare className="w-3 h-3 mr-1" />
              View Feedback
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Beta Reader Profile Modal (simplified)
interface BetaReaderProfileModalProps {
  reader: BetaReader;
  isOpen: boolean;
  onClose: () => void;
  onContact: () => void;
}

const BetaReaderProfileModal: React.FC<BetaReaderProfileModalProps> = ({ 
  reader, 
  isOpen, 
  onClose, 
  onContact 
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{reader.displayName}'s Profile</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-center py-8">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Full Profile View</h3>
            <p className="text-gray-600 mb-4">
              Complete beta reader profile interface will be implemented here.
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={onClose}>Close</Button>
              <Button onClick={onContact}>Contact Reader</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Assignment Details Modal (simplified)
interface AssignmentDetailsModalProps {
  assignment: BetaAssignment;
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
}

const AssignmentDetailsModal: React.FC<AssignmentDetailsModalProps> = ({ 
  assignment, 
  isOpen, 
  onClose, 
  userRole 
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assignment Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Assignment Management</h3>
            <p className="text-gray-600 mb-4">
              Detailed assignment interface with feedback management will be implemented here.
            </p>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};