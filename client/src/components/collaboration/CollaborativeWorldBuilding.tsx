/**
 * Collaborative World-Building Component
 * Interface for shared universe creation, canon management, and timeline synchronization
 */

import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Users, 
  Clock, 
  GitBranch, 
  Star, 
  Plus, 
  Search, 
  Filter, 
  Map,
  BookOpen,
  Eye,
  Settings,
  Crown,
  Shield,
  AlertTriangle,
  CheckCircle,
  Zap,
  Calendar,
  MessageSquare,
  Vote,
  Target,
  TreePine,
  Scroll,
  Sparkles,
  Layers
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Progress } from '@/components/ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

import { worldBuildingService } from '@/services/worldBuildingService';
import { 
  SharedUniverse, 
  UniverseCollaborator, 
  WorldLocation, 
  SharedCharacter, 
  UniverseTimeline,
  TimelineEvent,
  CanonConflict,
  WorldBible
} from '@/types/collaboration';

interface CollaborativeWorldBuildingProps {
  currentUserId: string;
}

export const CollaborativeWorldBuilding: React.FC<CollaborativeWorldBuildingProps> = ({ 
  currentUserId 
}) => {
  const [universes, setUniverses] = useState<SharedUniverse[]>([]);
  const [myUniverses, setMyUniverses] = useState<SharedUniverse[]>([]);
  const [selectedUniverse, setSelectedUniverse] = useState<SharedUniverse | null>(null);
  const [timeline, setTimeline] = useState<UniverseTimeline | null>(null);
  const [conflicts, setConflicts] = useState<CanonConflict[]>([]);
  const [worldBible, setWorldBible] = useState<WorldBible | null>(null);
  const [activeTab, setActiveTab] = useState('explore');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentUserId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // In a real implementation, these would be actual service calls
      // For now, using the existing worldBuildingService as a base
      const mockUniverses = [
        {
          id: 'universe-1',
          name: 'Aethermoor Realms',
          description: 'A vast fantasy realm where magic and technology coexist in delicate balance.',
          genre: ['fantasy', 'steampunk', 'adventure'],
          tags: ['magic', 'floating-cities', 'ancient-civilizations', 'technology', 'collaborative'],
          coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800',
          createdBy: 'creator-1',
          createdAt: new Date(Date.now() - (60 * 24 * 60 * 60 * 1000)),
          updatedAt: new Date(Date.now() - (1 * 24 * 60 * 60 * 1000)),
          collaborators: [
            {
              userId: 'creator-1',
              username: 'WorldBuilder',
              role: 'creator' as const,
              permissions: {
                canEditCanon: true,
                canCreateLocations: true,
                canCreateCharacters: true,
                canEditTimeline: true,
                canApprovePending: true,
                canResolveConflicts: true,
                canInviteUsers: true,
                canManageSettings: true
              },
              specializations: ['world-building', 'magic-systems', 'cultures'],
              contributions: [],
              joinedAt: new Date(Date.now() - (60 * 24 * 60 * 60 * 1000)),
              lastActive: new Date(Date.now() - (1 * 60 * 60 * 1000))
            }
          ],
          projects: ['project-1', 'project-2'],
          settings: {
            canMembersInvite: true,
            canMembersCreateElements: true,
            requireApprovalForCanon: true,
            allowPublicViewing: true,
            enableVersionControl: true,
            autoSyncProjects: true,
            conflictResolutionPolicy: 'vote' as const,
            maxCollaborators: 25,
            allowForking: true,
            enableDiscussions: true
          },
          analytics: {
            id: 'analytics-1',
            universeId: 'universe-1',
            overview: {
              totalElements: 8,
              canonElements: 6,
              disputedElements: 0,
              activeProjects: 2,
              totalCollaborators: 1,
              activeCollaborators: 1,
              lastActivity: new Date(Date.now() - (1 * 24 * 60 * 60 * 1000)),
              healthScore: 95
            }
          }
        } as SharedUniverse
      ];

      setUniverses(mockUniverses);
      setMyUniverses(mockUniverses); // User is part of this universe
      
      if (mockUniverses.length > 0) {
        setSelectedUniverse(mockUniverses[0]);
      }
    } catch (error) {
      console.error('Error loading world-building data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinUniverse = async (universeId: string) => {
    try {
      // In real implementation, call worldBuildingService.joinUniverse
      console.log('Joining universe:', universeId);
      await loadData();
    } catch (error) {
      console.error('Error joining universe:', error);
    }
  };

  const getCollaboratorRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      'creator': 'bg-purple-100 text-purple-800',
      'co-creator': 'bg-blue-100 text-blue-800',
      'contributor': 'bg-green-100 text-green-800',
      'approved-user': 'bg-yellow-100 text-yellow-800',
      'reader': 'bg-gray-100 text-gray-800'
    };
    return colors[role] || colors.reader;
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredUniverses = universes.filter(universe => {
    const matchesSearch = !searchQuery || 
      universe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      universe.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      universe.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesGenre = selectedGenre === 'all' || universe.genre.includes(selectedGenre);
    
    return matchesSearch && matchesGenre;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading collaborative worlds...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Collaborative World-Building</h1>
          <p className="text-gray-600 mt-1">
            Create shared universes, manage canon, and build worlds together
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <GitBranch className="w-4 h-4 mr-2" />
            Fork Universe
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Universe
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">My Universes</p>
                <p className="text-2xl font-bold text-blue-600">{myUniverses.length}</p>
              </div>
              <Globe className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Projects</p>
                <p className="text-2xl font-bold text-green-600">
                  {myUniverses.reduce((sum, u) => sum + u.projects.length, 0)}
                </p>
              </div>
              <BookOpen className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Collaborators</p>
                <p className="text-2xl font-bold text-purple-600">
                  {myUniverses.reduce((sum, u) => sum + u.collaborators.length, 0)}
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Canon Elements</p>
                <p className="text-2xl font-bold text-orange-600">
                  {myUniverses.reduce((sum, u) => sum + u.analytics.overview.canonElements, 0)}
                </p>
              </div>
              <Star className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="explore">Explore</TabsTrigger>
          <TabsTrigger value="my-universes">My Universes</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="canon">Canon Management</TabsTrigger>
          <TabsTrigger value="world-bible">World Bible</TabsTrigger>
        </TabsList>

        {/* Explore Tab */}
        <TabsContent value="explore" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search universes by name, description, or tags..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Genre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Genres</SelectItem>
                      <SelectItem value="fantasy">Fantasy</SelectItem>
                      <SelectItem value="sci-fi">Sci-Fi</SelectItem>
                      <SelectItem value="steampunk">Steampunk</SelectItem>
                      <SelectItem value="cyberpunk">Cyberpunk</SelectItem>
                      <SelectItem value="modern">Modern</SelectItem>
                      <SelectItem value="historical">Historical</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Universe Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUniverses.map((universe) => (
              <UniverseCard
                key={universe.id}
                universe={universe}
                currentUserId={currentUserId}
                onJoin={() => handleJoinUniverse(universe.id)}
                onViewDetails={() => setSelectedUniverse(universe)}
                isJoined={universe.collaborators.some(c => c.userId === currentUserId)}
              />
            ))}
          </div>
        </TabsContent>

        {/* My Universes Tab */}
        <TabsContent value="my-universes" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myUniverses.map((universe) => (
              <MyUniverseCard
                key={universe.id}
                universe={universe}
                currentUserId={currentUserId}
                onViewDetails={() => setSelectedUniverse(universe)}
              />
            ))}
          </div>

          {myUniverses.length === 0 && (
            <div className="text-center py-12">
              <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No universes yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first collaborative universe or join an existing one.
              </p>
              <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={() => setActiveTab('explore')}>
                  <Search className="w-4 h-4 mr-2" />
                  Explore Universes
                </Button>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Universe
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-6">
          {selectedUniverse ? (
            <TimelineView universe={selectedUniverse} currentUserId={currentUserId} />
          ) : (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Universe</h3>
              <p className="text-gray-600">
                Choose a universe to view and edit its timeline.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Canon Management Tab */}
        <TabsContent value="canon" className="space-y-6">
          {selectedUniverse ? (
            <CanonManagementView universe={selectedUniverse} currentUserId={currentUserId} />
          ) : (
            <div className="text-center py-12">
              <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Universe</h3>
              <p className="text-gray-600">
                Choose a universe to manage its canonical elements.
              </p>
            </div>
          )}
        </TabsContent>

        {/* World Bible Tab */}
        <TabsContent value="world-bible" className="space-y-6">
          {selectedUniverse ? (
            <WorldBibleView universe={selectedUniverse} currentUserId={currentUserId} />
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Universe</h3>
              <p className="text-gray-600">
                Choose a universe to view and edit its world bible.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Universe Modal */}
      {showCreateModal && (
        <CreateUniverseModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreate={async (data) => {
            try {
              // In real implementation, call worldBuildingService.createUniverse
              console.log('Creating universe:', data);
              setShowCreateModal(false);
              await loadData();
            } catch (error) {
              console.error('Error creating universe:', error);
            }
          }}
        />
      )}
    </div>
  );
};

// Universe Card Component
interface UniverseCardProps {
  universe: SharedUniverse;
  currentUserId: string;
  onJoin: () => void;
  onViewDetails: () => void;
  isJoined: boolean;
}

const UniverseCard: React.FC<UniverseCardProps> = ({ 
  universe, 
  currentUserId, 
  onJoin, 
  onViewDetails, 
  isJoined 
}) => {
  const getHealthScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onViewDetails}>
      <CardContent className="p-0">
        {/* Cover Image */}
        <div className="relative h-40 bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-lg">
          {universe.coverImage ? (
            <img
              src={universe.coverImage}
              alt={universe.name}
              className="w-full h-full object-cover rounded-t-lg"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Globe className="w-12 h-12 text-white" />
            </div>
          )}
          
          {/* Health Score */}
          <div className="absolute top-3 right-3">
            <Badge className="bg-white/20 backdrop-blur-sm text-white">
              <Sparkles className="w-3 h-3 mr-1" />
              {universe.analytics.overview.healthScore}%
            </Badge>
          </div>
          
          {/* Public/Private Indicator */}
          <div className="absolute top-3 left-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
              {universe.settings.allowPublicViewing ? (
                <Eye className="w-4 h-4 text-white" />
              ) : (
                <Shield className="w-4 h-4 text-white" />
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
              {universe.name}
            </h3>
            <div className="flex items-center gap-1">
              {universe.collaborators.slice(0, 3).map((collaborator) => (
                <Avatar
                  key={collaborator.userId}
                  src={collaborator.avatar}
                  alt={collaborator.username}
                  size="sm"
                />
              ))}
              {universe.collaborators.length > 3 && (
                <span className="text-xs text-gray-500 ml-1">
                  +{universe.collaborators.length - 3}
                </span>
              )}
            </div>
          </div>

          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {universe.description}
          </p>

          {/* Genres */}
          <div className="flex flex-wrap gap-1 mb-4">
            {universe.genre.slice(0, 3).map((genre) => (
              <Badge key={genre} variant="secondary" className="text-xs">
                {genre}
              </Badge>
            ))}
            {universe.genre.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{universe.genre.length - 3}
              </Badge>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {universe.collaborators.length}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {universe.projects.length}
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              {universe.analytics.overview.canonElements}
            </span>
            <span className={`flex items-center gap-1 font-medium ${getHealthScoreColor(universe.analytics.overview.healthScore)}`}>
              <Target className="w-3 h-3" />
              {universe.analytics.overview.healthScore}%
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={onViewDetails}>
              <Eye className="w-3 h-3 mr-1" />
              View
            </Button>
            {!isJoined && universe.settings.allowPublicViewing && (
              <Button size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); onJoin(); }}>
                <Users className="w-3 h-3 mr-1" />
                Join
              </Button>
            )}
            {isJoined && (
              <Badge className="flex-1 bg-green-100 text-green-800 text-center justify-center">
                <CheckCircle className="w-3 h-3 mr-1" />
                Member
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// My Universe Card Component
interface MyUniverseCardProps {
  universe: SharedUniverse;
  currentUserId: string;
  onViewDetails: () => void;
}

const MyUniverseCard: React.FC<MyUniverseCardProps> = ({ 
  universe, 
  currentUserId, 
  onViewDetails 
}) => {
  const userRole = universe.collaborators.find(c => c.userId === currentUserId)?.role || 'reader';
  
  const getCollaboratorRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      'creator': 'bg-purple-100 text-purple-800',
      'co-creator': 'bg-blue-100 text-blue-800',
      'contributor': 'bg-green-100 text-green-800',
      'approved-user': 'bg-yellow-100 text-yellow-800',
      'reader': 'bg-gray-100 text-gray-800'
    };
    return colors[role] || colors.reader;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onViewDetails}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900 mb-1">
              {universe.name}
            </h3>
            <Badge className={getCollaboratorRoleColor(userRole)}>
              {userRole}
            </Badge>
          </div>
          
          <div className="text-right text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Updated {universe.updatedAt.toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {universe.description}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <div className="text-gray-600">Total Elements</div>
            <div className="font-medium">{universe.analytics.overview.totalElements}</div>
          </div>
          <div>
            <div className="text-gray-600">Canon Elements</div>
            <div className="font-medium">{universe.analytics.overview.canonElements}</div>
          </div>
          <div>
            <div className="text-gray-600">Active Projects</div>
            <div className="font-medium">{universe.projects.length}</div>
          </div>
          <div>
            <div className="text-gray-600">Collaborators</div>
            <div className="font-medium">{universe.collaborators.length}</div>
          </div>
        </div>

        {/* Health Score */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Health Score</span>
            <span>{universe.analytics.overview.healthScore}%</span>
          </div>
          <Progress value={universe.analytics.overview.healthScore} className="h-2" />
        </div>

        <div className="flex justify-end">
          <Button variant="outline" size="sm">
            <Settings className="w-3 h-3 mr-1" />
            Manage
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Timeline View Component (simplified)
interface TimelineViewProps {
  universe: SharedUniverse;
  currentUserId: string;
}

const TimelineView: React.FC<TimelineViewProps> = ({ universe, currentUserId }) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {universe.name} Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Timeline Management</h3>
            <p className="text-gray-600">
              Timeline synchronization and event management interface will be implemented here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Canon Management View Component (simplified)
interface CanonManagementViewProps {
  universe: SharedUniverse;
  currentUserId: string;
}

const CanonManagementView: React.FC<CanonManagementViewProps> = ({ universe, currentUserId }) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Canon Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Vote className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Canon Control</h3>
            <p className="text-gray-600">
              Canon voting, conflict resolution, and approval workflows will be implemented here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// World Bible View Component (simplified)
interface WorldBibleViewProps {
  universe: SharedUniverse;
  currentUserId: string;
}

const WorldBibleView: React.FC<WorldBibleViewProps> = ({ universe, currentUserId }) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            World Bible
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Scroll className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Collaborative Documentation</h3>
            <p className="text-gray-600">
              Shared world bible editing and version control interface will be implemented here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Create Universe Modal (simplified)
interface CreateUniverseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: any) => Promise<void>;
}

const CreateUniverseModal: React.FC<CreateUniverseModalProps> = ({ 
  isOpen, 
  onClose, 
  onCreate 
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Collaborative Universe</DialogTitle>
        </DialogHeader>
        
        <div className="text-center py-8">
          <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Universe Creation</h3>
          <p className="text-gray-600 mb-4">
            Full universe creation interface with genres, settings, and collaboration options will be implemented here.
          </p>
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};