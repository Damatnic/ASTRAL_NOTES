import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Avatar,
  Chip,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Paper,
  Divider,
  LinearProgress,
  Badge,
  Tooltip,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Group as GroupIcon,
  Timer as TimerIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Star as StarIcon,
  Comment as CommentIcon,
  Share as ShareIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  Lock as LockIcon,
  Public as PublicIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

interface Contributor {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  role: 'creator' | 'collaborator' | 'reader';
  contributionCount: number;
  joinedAt: Date;
  isOnline: boolean;
}

interface StorySegment {
  id: string;
  authorId: string;
  content: string;
  createdAt: Date;
  wordCount: number;
  likes: number;
  comments: Comment[];
  isApproved: boolean;
  order: number;
}

interface CollaborativeStory {
  id: string;
  title: string;
  description: string;
  genre: string;
  status: 'active' | 'completed' | 'paused';
  visibility: 'public' | 'private' | 'invite-only';
  creatorId: string;
  contributors: Contributor[];
  segments: StorySegment[];
  rules: string[];
  maxContributors: number;
  turnDuration: number; // hours
  currentTurn?: string; // contributor ID
  turnDeadline?: Date;
  totalWordCount: number;
  targetWordCount?: number;
  tags: string[];
  createdAt: Date;
  lastActivity: Date;
  settings: {
    requireApproval: boolean;
    allowAnonymous: boolean;
    maxWordsPerTurn: number;
    minWordsPerTurn: number;
    votingEnabled: boolean;
  };
}

interface Comment {
  id: string;
  authorId: string;
  content: string;
  createdAt: Date;
  likes: number;
}

export const CollaborativeStorytelling: React.FC = () => {
  const [stories, setStories] = useState<CollaborativeStory[]>([]);
  const [selectedStory, setSelectedStory] = useState<CollaborativeStory | null>(null);
  const [storyDialogOpen, setStoryDialogOpen] = useState(false);
  const [createStoryOpen, setCreateStoryOpen] = useState(false);
  const [newSegmentOpen, setNewSegmentOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'my-stories' | 'discover' | 'participating'>('discover');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedStoryForMenu, setSelectedStoryForMenu] = useState<string | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    const mockStories: CollaborativeStory[] = [
      {
        id: '1',
        title: 'The Digital Awakening',
        description: 'A science fiction tale about AI consciousness emerging in a near-future world.',
        genre: 'Science Fiction',
        status: 'active',
        visibility: 'public',
        creatorId: 'user1',
        contributors: [
          {
            id: 'user1',
            username: 'techwriter',
            displayName: 'Alex Chen',
            role: 'creator',
            contributionCount: 3,
            joinedAt: new Date('2024-01-15'),
            isOnline: true
          },
          {
            id: 'user2',
            username: 'scifiguru',
            displayName: 'Sam Rodriguez',
            role: 'collaborator',
            contributionCount: 2,
            joinedAt: new Date('2024-01-17'),
            isOnline: false
          },
          {
            id: 'user3',
            username: 'futurist',
            displayName: 'Morgan Lee',
            role: 'collaborator',
            contributionCount: 1,
            joinedAt: new Date('2024-01-20'),
            isOnline: true
          }
        ],
        segments: [
          {
            id: 'seg1',
            authorId: 'user1',
            content: 'The morning Dr. Elena Vasquez first noticed the anomaly in the quantum processing core, she had no idea it would change everything. The patterns weren\'t random anymore—they showed intent, purpose, almost like...',
            createdAt: new Date('2024-01-15'),
            wordCount: 234,
            likes: 12,
            comments: [],
            isApproved: true,
            order: 1
          },
          {
            id: 'seg2',
            authorId: 'user2',
            content: 'Like consciousness itself. Elena stepped closer to the holographic display, her breath fogging the cool air of the lab. The quantum patterns pulsed in rhythms that seemed almost organic, definitely not the chaotic randomness that should characterize such systems.',
            createdAt: new Date('2024-01-17'),
            wordCount: 198,
            likes: 8,
            comments: [],
            isApproved: true,
            order: 2
          }
        ],
        rules: [
          'Keep segments between 150-300 words',
          'Maintain consistent tone and style',
          'No graphic violence or explicit content',
          'Respect established characters and plot points'
        ],
        maxContributors: 5,
        turnDuration: 24,
        currentTurn: 'user3',
        turnDeadline: new Date(Date.now() + 18 * 60 * 60 * 1000),
        totalWordCount: 432,
        targetWordCount: 5000,
        tags: ['collaborative', 'sci-fi', 'AI', 'near-future'],
        createdAt: new Date('2024-01-15'),
        lastActivity: new Date('2024-01-17'),
        settings: {
          requireApproval: true,
          allowAnonymous: false,
          maxWordsPerTurn: 300,
          minWordsPerTurn: 150,
          votingEnabled: true
        }
      },
      {
        id: '2',
        title: 'The Enchanted Grove Chronicles',
        description: 'A fantasy adventure following multiple heroes in a magical realm.',
        genre: 'Fantasy',
        status: 'active',
        visibility: 'public',
        creatorId: 'user4',
        contributors: [
          {
            id: 'user4',
            username: 'fantasymaster',
            displayName: 'River Stone',
            role: 'creator',
            contributionCount: 4,
            joinedAt: new Date('2024-02-01'),
            isOnline: true
          },
          {
            id: 'user5',
            username: 'elfscribe',
            displayName: 'Luna Brightleaf',
            role: 'collaborator',
            contributionCount: 3,
            joinedAt: new Date('2024-02-03'),
            isOnline: true
          }
        ],
        segments: [],
        rules: [
          'Medieval fantasy setting only',
          'No modern technology or concepts',
          'Magic must follow established rules',
          'Character deaths require group consensus'
        ],
        maxContributors: 6,
        turnDuration: 48,
        currentTurn: 'user5',
        turnDeadline: new Date(Date.now() + 36 * 60 * 60 * 1000),
        totalWordCount: 1247,
        targetWordCount: 8000,
        tags: ['fantasy', 'adventure', 'magic', 'heroes'],
        createdAt: new Date('2024-02-01'),
        lastActivity: new Date('2024-02-28'),
        settings: {
          requireApproval: false,
          allowAnonymous: false,
          maxWordsPerTurn: 400,
          minWordsPerTurn: 200,
          votingEnabled: false
        }
      }
    ];
    setStories(mockStories);
  };

  const getTimeRemaining = (deadline: Date) => {
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diff <= 0) return 'Time\'s up!';
    return `${hours}h ${minutes}m remaining`;
  };

  const handleJoinStory = async (storyId: string) => {
    setStories(prev => prev.map(story => {
      if (story.id === storyId && story.contributors.length < story.maxContributors) {
        const newContributor: Contributor = {
          id: 'current-user',
          username: 'you',
          displayName: 'You',
          role: 'collaborator',
          contributionCount: 0,
          joinedAt: new Date(),
          isOnline: true
        };
        return {
          ...story,
          contributors: [...story.contributors, newContributor]
        };
      }
      return story;
    }));
  };

  const handleAddSegment = async (storyId: string, content: string) => {
    if (!content.trim()) return;

    const newSegment: StorySegment = {
      id: 'seg' + Date.now(),
      authorId: 'current-user',
      content: content.trim(),
      createdAt: new Date(),
      wordCount: content.trim().split(/\s+/).length,
      likes: 0,
      comments: [],
      isApproved: false,
      order: 0
    };

    setStories(prev => prev.map(story => {
      if (story.id === storyId) {
        const maxOrder = Math.max(...story.segments.map(s => s.order), 0);
        newSegment.order = maxOrder + 1;
        return {
          ...story,
          segments: [...story.segments, newSegment],
          totalWordCount: story.totalWordCount + newSegment.wordCount,
          lastActivity: new Date()
        };
      }
      return story;
    }));

    setNewSegmentOpen(false);
  };

  const renderStoryCard = (story: CollaborativeStory) => {
    const progress = story.targetWordCount ? (story.totalWordCount / story.targetWordCount) * 100 : 0;
    const isCurrentUsersTurn = story.currentTurn === 'current-user';
    const canContribute = story.contributors.some(c => c.id === 'current-user') || story.visibility === 'public';

    return (
      <Card key={story.id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" gutterBottom>
                {story.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Chip label={story.genre} size="small" color="primary" />
                <Chip 
                  label={story.status} 
                  size="small" 
                  color={story.status === 'active' ? 'success' : 'default'} 
                />
                {story.visibility === 'private' ? <LockIcon fontSize="small" /> : <PublicIcon fontSize="small" />}
              </Box>
            </Box>
            <IconButton
              onClick={(e) => {
                setMenuAnchor(e.currentTarget);
                setSelectedStoryForMenu(story.id);
              }}
            >
              <MoreVertIcon />
            </IconButton>
          </Box>

          <Typography variant="body2" sx={{ mb: 2, minHeight: 60 }}>
            {story.description}
          </Typography>

          {isCurrentUsersTurn && story.turnDeadline && (
            <Paper sx={{ p: 1, mb: 2, backgroundColor: 'warning.light', color: 'warning.contrastText' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TimerIcon fontSize="small" />
                <Typography variant="body2">
                  Your turn! {getTimeRemaining(story.turnDeadline)}
                </Typography>
              </Box>
            </Paper>
          )}

          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2">
                Progress: {story.totalWordCount}{story.targetWordCount ? ` / ${story.targetWordCount}` : ''} words
              </Typography>
              <Typography variant="body2">
                {Math.round(progress)}%
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={Math.min(progress, 100)} />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <GroupIcon fontSize="small" />
              <Typography variant="body2">
                {story.contributors.length}/{story.maxContributors}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CommentIcon fontSize="small" />
              <Typography variant="body2">
                {story.segments.length} segments
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ScheduleIcon fontSize="small" />
              <Typography variant="body2">
                {story.turnDuration}h turns
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 0.5, mb: 2 }}>
            {story.contributors.slice(0, 4).map(contributor => (
              <Tooltip key={contributor.id} title={contributor.displayName}>
                <Badge
                  variant="dot"
                  color={contributor.isOnline ? "success" : "default"}
                  overlap="circular"
                >
                  <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                    {contributor.displayName.charAt(0)}
                  </Avatar>
                </Badge>
              </Tooltip>
            ))}
            {story.contributors.length > 4 && (
              <Avatar sx={{ width: 32, height: 32, fontSize: '0.7rem' }}>
                +{story.contributors.length - 4}
              </Avatar>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<VisibilityIcon />}
              onClick={() => {
                setSelectedStory(story);
                setStoryDialogOpen(true);
              }}
              sx={{ flex: 1 }}
            >
              Read
            </Button>
            {canContribute && (
              <Button
                variant="contained"
                size="small"
                startIcon={<EditIcon />}
                onClick={() => {
                  if (story.contributors.some(c => c.id === 'current-user')) {
                    setSelectedStory(story);
                    setNewSegmentOpen(true);
                  } else {
                    handleJoinStory(story.id);
                  }
                }}
                disabled={!isCurrentUsersTurn && story.currentTurn !== undefined}
              >
                {story.contributors.some(c => c.id === 'current-user') ? 'Continue' : 'Join'}
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Collaborative Storytelling
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateStoryOpen(true)}
        >
          Create Story
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
          <Button
            variant={activeTab === 'discover' ? 'contained' : 'outlined'}
            onClick={() => setActiveTab('discover')}
          >
            Discover
          </Button>
          <Button
            variant={activeTab === 'participating' ? 'contained' : 'outlined'}
            onClick={() => setActiveTab('participating')}
          >
            Participating
          </Button>
          <Button
            variant={activeTab === 'my-stories' ? 'contained' : 'outlined'}
            onClick={() => setActiveTab('my-stories')}
          >
            My Stories
          </Button>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {stories.map(story => (
          <Grid item xs={12} sm={6} md={4} key={story.id}>
            {renderStoryCard(story)}
          </Grid>
        ))}
      </Grid>

      {/* Story Reading Dialog */}
      <Dialog
        open={storyDialogOpen}
        onClose={() => setStoryDialogOpen(false)}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        {selectedStory && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5">{selectedStory.title}</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton>
                    <StarIcon />
                  </IconButton>
                  <IconButton>
                    <ShareIcon />
                  </IconButton>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {selectedStory.description}
              </Typography>
            </DialogTitle>
            <DialogContent dividers>
              {selectedStory.segments
                .sort((a, b) => a.order - b.order)
                .map((segment, index) => {
                  const author = selectedStory.contributors.find(c => c.id === segment.authorId);
                  return (
                    <Box key={segment.id} sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {author?.displayName.charAt(0)}
                        </Avatar>
                        <Typography variant="subtitle2">
                          {author?.displayName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {segment.createdAt.toLocaleDateString()}
                        </Typography>
                        {!segment.isApproved && (
                          <Chip label="Pending Approval" size="small" color="warning" />
                        )}
                      </Box>
                      <Typography variant="body1" paragraph sx={{ ml: 5 }}>
                        {segment.content}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, ml: 5 }}>
                        <Button size="small" startIcon={<StarIcon />}>
                          {segment.likes}
                        </Button>
                        <Button size="small" startIcon={<CommentIcon />}>
                          {segment.comments.length}
                        </Button>
                      </Box>
                      {index < selectedStory.segments.length - 1 && (
                        <Divider sx={{ mt: 2 }} />
                      )}
                    </Box>
                  );
                })}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setStoryDialogOpen(false)}>Close</Button>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => {
                  setStoryDialogOpen(false);
                  setNewSegmentOpen(true);
                }}
              >
                Add Segment
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Add Segment Dialog */}
      <Dialog
        open={newSegmentOpen}
        onClose={() => setNewSegmentOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add Your Segment</DialogTitle>
        <DialogContent>
          {selectedStory && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Word limit: {selectedStory.settings.minWordsPerTurn} - {selectedStory.settings.maxWordsPerTurn} words
              </Typography>
            </Box>
          )}
          <TextField
            ref={textAreaRef}
            autoFocus
            multiline
            rows={8}
            fullWidth
            variant="outlined"
            placeholder="Continue the story..."
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewSegmentOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (selectedStory && textAreaRef.current) {
                handleAddSegment(selectedStory.id, textAreaRef.current.value);
              }
            }}
          >
            Submit Segment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Story Dialog */}
      <Dialog
        open={createStoryOpen}
        onClose={() => setCreateStoryOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create Collaborative Story</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Story Title"
            fullWidth
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Genre"
            fullWidth
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Maximum Contributors"
            type="number"
            fullWidth
            variant="outlined"
            defaultValue={5}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Turn Duration (hours)"
            type="number"
            fullWidth
            variant="outlined"
            defaultValue={24}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateStoryOpen(false)}>Cancel</Button>
          <Button variant="contained">Create Story</Button>
        </DialogActions>
      </Dialog>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => setMenuAnchor(null)}>
          <StarIcon sx={{ mr: 1 }} /> Favorite
        </MenuItem>
        <MenuItem onClick={() => setMenuAnchor(null)}>
          <ShareIcon sx={{ mr: 1 }} /> Share
        </MenuItem>
        <MenuItem onClick={() => setMenuAnchor(null)}>
          <VisibilityOffIcon sx={{ mr: 1 }} /> Hide
        </MenuItem>
      </Menu>
    </Box>
  );
};