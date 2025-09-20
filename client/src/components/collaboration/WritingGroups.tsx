/**
 * Writing Groups & Communities Component
 * Main interface for discovering, joining, and managing writing groups
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Filter, 
  Star, 
  Clock, 
  BookOpen, 
  Globe, 
  Lock, 
  Eye,
  MessageCircle,
  Calendar,
  Trophy,
  TrendingUp,
  ChevronRight,
  Settings,
  UserPlus,
  Mail
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Progress } from '@/components/ui/Progress';

import { writingGroupService } from '@/services/writingGroupService';
import { WritingGroup, GroupMember, GroupActivity, GroupRole } from '@/types/collaboration';

interface WritingGroupsProps {
  currentUserId: string;
}

export const WritingGroups: React.FC<WritingGroupsProps> = ({ currentUserId }) => {
  const [groups, setGroups] = useState<WritingGroup[]>([]);
  const [myGroups, setMyGroups] = useState<GroupMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('relevance');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('discover');
  const [selectedGroup, setSelectedGroup] = useState<WritingGroup | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentUserId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [groupsResult, memberships] = await Promise.all([
        writingGroupService.searchGroups({
          query: searchQuery,
          category: selectedCategory === 'all' ? undefined : selectedCategory,
          type: selectedType === 'all' ? undefined : selectedType,
          sortBy: sortBy as any,
          limit: 20
        }),
        writingGroupService.getUserMemberships(currentUserId)
      ]);

      setGroups(groupsResult.groups);
      setMyGroups(memberships);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadData();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedCategory, selectedType, sortBy]);

  const handleJoinGroup = async (groupId: string) => {
    try {
      await writingGroupService.joinGroup(groupId, currentUserId);
      await loadData(); // Refresh data
      setShowJoinModal(false);
    } catch (error) {
      console.error('Error joining group:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'public':
        return <Globe className="w-4 h-4" />;
      case 'private':
        return <Lock className="w-4 h-4" />;
      case 'invite-only':
        return <Mail className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      fiction: 'bg-purple-100 text-purple-800',
      'non-fiction': 'bg-blue-100 text-blue-800',
      poetry: 'bg-pink-100 text-pink-800',
      screenwriting: 'bg-orange-100 text-orange-800',
      academic: 'bg-green-100 text-green-800',
      mixed: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.mixed;
  };

  const formatActivity = (activity: GroupActivity) => {
    switch (activity.type) {
      case 'member-joined':
        return `${activity.actorName} joined the group`;
      case 'project-created':
        return `${activity.actorName} created a new project`;
      case 'project-completed':
        return `${activity.actorName} completed a project`;
      case 'event-scheduled':
        return `${activity.actorName} scheduled an event`;
      default:
        return activity.description;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Writing Groups</h1>
          <p className="text-gray-600 mt-1">
            Discover writing communities, collaborate on projects, and grow as a writer
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Group
          </Button>
          
          <Button onClick={() => setActiveTab('my-groups')}>
            <Users className="w-4 h-4 mr-2" />
            My Groups ({myGroups.length})
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="my-groups">My Groups</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
        </TabsList>

        {/* Discover Tab */}
        <TabsContent value="discover" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search groups by name, description, or tags..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="fiction">Fiction</SelectItem>
                      <SelectItem value="non-fiction">Non-Fiction</SelectItem>
                      <SelectItem value="poetry">Poetry</SelectItem>
                      <SelectItem value="screenwriting">Screenwriting</SelectItem>
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="invite-only">Invite Only</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="members">Members</SelectItem>
                      <SelectItem value="activity">Activity</SelectItem>
                      <SelectItem value="created">Created</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Groups Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                onViewDetails={() => setSelectedGroup(group)}
                onJoin={() => handleJoinGroup(group.id)}
                isJoined={myGroups.some(m => m.groupId === group.id)}
              />
            ))}
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading groups...</p>
            </div>
          )}

          {!loading && groups.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No groups found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search criteria or create a new group.
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Group
              </Button>
            </div>
          )}
        </TabsContent>

        {/* My Groups Tab */}
        <TabsContent value="my-groups" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myGroups.map((membership) => (
              <MyGroupCard
                key={membership.groupId}
                membership={membership}
                onViewDetails={async () => {
                  const group = await writingGroupService.getGroup(membership.groupId);
                  if (group) setSelectedGroup(group);
                }}
              />
            ))}
          </div>

          {myGroups.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">You haven't joined any groups yet</h3>
              <p className="text-gray-600 mb-4">
                Discover writing communities and start collaborating with other writers.
              </p>
              <Button onClick={() => setActiveTab('discover')}>
                <Search className="w-4 h-4 mr-2" />
                Discover Groups
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Invitations Tab */}
        <TabsContent value="invitations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No pending invitations</h3>
                <p className="text-gray-600">
                  Group invitations will appear here when you receive them.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trending Tab */}
        <TabsContent value="trending" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trending Groups */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Trending Groups
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {groups.slice(0, 5).map((group, index) => (
                    <div key={group.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50">
                      <div className="flex-shrink-0">
                        <Badge variant="secondary">#{index + 1}</Badge>
                      </div>
                      
                      <div className="flex-shrink-0">
                        {group.coverImage ? (
                          <img
                            src={group.coverImage}
                            alt={group.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <Users className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{group.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {group.memberCount} members
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            {group.projectCount} projects
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {group.statistics.collaborationScore}/100
                          </span>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedGroup(group)}
                      >
                        View
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Stats */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Community Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{groups.length}</div>
                    <div className="text-sm text-gray-600">Active Groups</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {groups.reduce((sum, group) => sum + group.memberCount, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Total Members</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {groups.reduce((sum, group) => sum + group.projectCount, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Active Projects</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Popular Categories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {['fiction', 'non-fiction', 'poetry', 'screenwriting'].map((category) => {
                    const count = groups.filter(g => g.category === category).length;
                    const percentage = (count / groups.length) * 100;
                    
                    return (
                      <div key={category} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{category.replace('-', ' ')}</span>
                          <span>{count} groups</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Group Details Modal */}
      {selectedGroup && (
        <GroupDetailsModal
          group={selectedGroup}
          isOpen={!!selectedGroup}
          onClose={() => setSelectedGroup(null)}
          onJoin={() => handleJoinGroup(selectedGroup.id)}
          currentUserId={currentUserId}
          isJoined={myGroups.some(m => m.groupId === selectedGroup.id)}
        />
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <CreateGroupModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreate={async (data) => {
            try {
              await writingGroupService.createGroup(data, currentUserId);
              setShowCreateModal(false);
              await loadData();
            } catch (error) {
              console.error('Error creating group:', error);
            }
          }}
        />
      )}
    </div>
  );
};

// Group Card Component
interface GroupCardProps {
  group: WritingGroup;
  onViewDetails: () => void;
  onJoin: () => void;
  isJoined: boolean;
}

const GroupCard: React.FC<GroupCardProps> = ({ group, onViewDetails, onJoin, isJoined }) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'public':
        return <Globe className="w-4 h-4" />;
      case 'private':
        return <Lock className="w-4 h-4" />;
      case 'invite-only':
        return <Mail className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      fiction: 'bg-purple-100 text-purple-800',
      'non-fiction': 'bg-blue-100 text-blue-800',
      poetry: 'bg-pink-100 text-pink-800',
      screenwriting: 'bg-orange-100 text-orange-800',
      academic: 'bg-green-100 text-green-800',
      mixed: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.mixed;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onViewDetails}>
      <CardContent className="p-0">
        {/* Cover Image */}
        <div className="relative h-40 bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-lg">
          {group.coverImage ? (
            <img
              src={group.coverImage}
              alt={group.name}
              className="w-full h-full object-cover rounded-t-lg"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Users className="w-12 h-12 text-white" />
            </div>
          )}
          
          {/* Verified Badge */}
          {group.isVerified && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-green-500 text-white">
                <Star className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            </div>
          )}
          
          {/* Type Icon */}
          <div className="absolute top-3 left-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
              {getTypeIcon(group.type)}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
              {group.name}
            </h3>
            <Badge className={getCategoryColor(group.category)}>
              {group.category}
            </Badge>
          </div>

          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {group.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-4">
            {group.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {group.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{group.tags.length - 3}
              </Badge>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {group.memberCount} members
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {group.projectCount} projects
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {group.statistics.collaborationScore}/100
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={onViewDetails}>
              <Eye className="w-3 h-3 mr-1" />
              View
            </Button>
            {!isJoined && group.type === 'public' && (
              <Button size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); onJoin(); }}>
                <UserPlus className="w-3 h-3 mr-1" />
                Join
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// My Group Card Component
interface MyGroupCardProps {
  membership: GroupMember;
  onViewDetails: () => void;
}

const MyGroupCard: React.FC<MyGroupCardProps> = ({ membership, onViewDetails }) => {
  const getRoleColor = (role: GroupRole) => {
    const colors: Record<GroupRole, string> = {
      admin: 'bg-red-100 text-red-800',
      moderator: 'bg-orange-100 text-orange-800',
      member: 'bg-blue-100 text-blue-800',
      'beta-reader': 'bg-green-100 text-green-800',
      editor: 'bg-purple-100 text-purple-800',
      guest: 'bg-gray-100 text-gray-800'
    };
    return colors[role];
  };

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onViewDetails}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900 mb-1">
              Group {membership.groupId}
            </h3>
            <Badge className={getRoleColor(membership.role)}>
              {membership.role}
            </Badge>
          </div>
          
          <div className="text-right text-sm text-gray-600">
            <div>Joined {membership.joinedAt.toLocaleDateString()}</div>
            <div>Last active {membership.lastActive.toLocaleDateString()}</div>
          </div>
        </div>

        {/* Contribution Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Words Contributed</div>
            <div className="font-medium">{membership.contributions.wordsContributed.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-gray-600">Projects</div>
            <div className="font-medium">{membership.contributions.projectsContributed}</div>
          </div>
          <div>
            <div className="text-gray-600">Feedback Given</div>
            <div className="font-medium">{membership.contributions.feedbackGiven}</div>
          </div>
          <div>
            <div className="text-gray-600">Sessions</div>
            <div className="font-medium">{membership.contributions.sessionsAttended}</div>
          </div>
        </div>

        {/* Badges */}
        {membership.badges.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1">
            {membership.badges.slice(0, 3).map((badge) => (
              <span
                key={badge.id}
                className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded"
                title={badge.description}
              >
                <span>{badge.icon}</span>
                <span>{badge.name}</span>
              </span>
            ))}
            {membership.badges.length > 3 && (
              <span className="text-xs text-gray-500">+{membership.badges.length - 3} more</span>
            )}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <Button variant="outline" size="sm">
            <ChevronRight className="w-3 h-3 ml-1" />
            View Group
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Group Details Modal (simplified for now)
interface GroupDetailsModalProps {
  group: WritingGroup;
  isOpen: boolean;
  onClose: () => void;
  onJoin: () => void;
  currentUserId: string;
  isJoined: boolean;
}

const GroupDetailsModal: React.FC<GroupDetailsModalProps> = ({ 
  group, 
  isOpen, 
  onClose, 
  onJoin, 
  currentUserId, 
  isJoined 
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{group.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <p className="text-gray-600">{group.description}</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{group.memberCount}</div>
              <div className="text-sm text-gray-600">Members</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{group.projectCount}</div>
              <div className="text-sm text-gray-600">Projects</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{group.statistics.totalWords.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Words Written</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{group.statistics.collaborationScore}</div>
              <div className="text-sm text-gray-600">Collaboration Score</div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {!isJoined && group.type === 'public' && (
              <Button onClick={onJoin}>
                <UserPlus className="w-4 h-4 mr-2" />
                Join Group
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Create Group Modal (simplified for now)
interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: any) => Promise<void>;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose, onCreate }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Writing Group</DialogTitle>
        </DialogHeader>
        
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Group Creation</h3>
          <p className="text-gray-600 mb-4">
            Full group creation interface will be implemented here.
          </p>
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};