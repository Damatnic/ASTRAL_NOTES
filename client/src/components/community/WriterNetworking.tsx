import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Avatar,
  Typography,
  Button,
  Chip,
  Grid,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Tab,
  Tabs,
  Badge,
  Paper,
  Divider
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Message as MessageIcon,
  Group as GroupIcon,
  Star as StarIcon,
  Verified as VerifiedIcon,
  Edit as EditIcon,
  BookmarkBorder as BookmarkIcon,
  Share as ShareIcon,
  TrendingUp as TrendingUpIcon,
  Search as SearchIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';

interface WriterProfile {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio: string;
  genres: string[];
  writingExperience: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  worksPublished: number;
  followers: number;
  following: number;
  isVerified: boolean;
  isFollowing?: boolean;
  recentWorks: {
    title: string;
    genre: string;
    publishedAt: Date;
    likes: number;
  }[];
  achievements: string[];
  joinedAt: Date;
  location?: string;
  website?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    goodreads?: string;
  };
}

interface WritingCircle {
  id: string;
  name: string;
  description: string;
  genre: string;
  memberCount: number;
  isPrivate: boolean;
  adminId: string;
  createdAt: Date;
  lastActivity: Date;
  tags: string[];
  rules: string[];
  isMember?: boolean;
  isPending?: boolean;
}

export const WriterNetworking: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [writers, setWriters] = useState<WriterProfile[]>([]);
  const [circles, setCircles] = useState<WritingCircle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedWriter, setSelectedWriter] = useState<WriterProfile | null>(null);
  const [createCircleOpen, setCreateCircleOpen] = useState(false);

  const genres = [
    'Fiction', 'Non-Fiction', 'Fantasy', 'Science Fiction', 'Romance',
    'Mystery', 'Thriller', 'Horror', 'Young Adult', 'Children\'s',
    'Poetry', 'Biography', 'Self-Help', 'Business', 'Technical'
  ];

  const experienceLevels = {
    beginner: { label: 'Beginner', color: '#4CAF50' },
    intermediate: { label: 'Intermediate', color: '#FF9800' },
    advanced: { label: 'Advanced', color: '#2196F3' },
    professional: { label: 'Professional', color: '#9C27B0' }
  };

  useEffect(() => {
    loadWriters();
    loadCircles();
  }, []);

  const loadWriters = async () => {
    const mockWriters: WriterProfile[] = [
      {
        id: '1',
        username: 'sarah_novelist',
        displayName: 'Sarah Chen',
        bio: 'Fantasy author with 3 published novels. Love creating magical worlds and complex characters.',
        genres: ['Fantasy', 'Young Adult'],
        writingExperience: 'professional',
        worksPublished: 3,
        followers: 1250,
        following: 432,
        isVerified: true,
        recentWorks: [
          { title: 'The Crystal Throne', genre: 'Fantasy', publishedAt: new Date('2024-01-15'), likes: 89 },
          { title: 'Whispers of Magic', genre: 'Fantasy', publishedAt: new Date('2023-11-20'), likes: 156 }
        ],
        achievements: ['Bestselling Author', 'Award Winner', 'Community Mentor'],
        joinedAt: new Date('2022-03-10'),
        location: 'San Francisco, CA'
      },
      {
        id: '2',
        username: 'mystery_mike',
        displayName: 'Michael Rodriguez',
        bio: 'Detective fiction enthusiast. Currently working on my first mystery novel series.',
        genres: ['Mystery', 'Thriller'],
        writingExperience: 'intermediate',
        worksPublished: 0,
        followers: 89,
        following: 234,
        isVerified: false,
        recentWorks: [],
        achievements: ['Active Contributor', 'Feedback Champion'],
        joinedAt: new Date('2023-08-15'),
        location: 'Chicago, IL'
      },
      {
        id: '3',
        username: 'poetry_soul',
        displayName: 'Emma Thompson',
        bio: 'Spoken word poet and creative writing teacher. Exploring the intersection of art and emotion.',
        genres: ['Poetry', 'Non-Fiction'],
        writingExperience: 'advanced',
        worksPublished: 2,
        followers: 567,
        following: 345,
        isVerified: false,
        recentWorks: [
          { title: 'Midnight Reflections', genre: 'Poetry', publishedAt: new Date('2024-02-28'), likes: 78 }
        ],
        achievements: ['Featured Poet', 'Workshop Leader'],
        joinedAt: new Date('2021-12-05'),
        location: 'Portland, OR'
      }
    ];
    setWriters(mockWriters);
  };

  const loadCircles = async () => {
    const mockCircles: WritingCircle[] = [
      {
        id: '1',
        name: 'Fantasy Writers Guild',
        description: 'A community for fantasy authors to share ideas, get feedback, and collaborate on world-building.',
        genre: 'Fantasy',
        memberCount: 1247,
        isPrivate: false,
        adminId: '1',
        createdAt: new Date('2023-01-15'),
        lastActivity: new Date('2024-03-10'),
        tags: ['world-building', 'character-development', 'magic-systems'],
        rules: [
          'Be respectful and constructive in all feedback',
          'No plagiarism or copyright infringement',
          'Stay on topic - fantasy writing only'
        ]
      },
      {
        id: '2',
        name: 'Daily Writing Challenge',
        description: 'Write something every day! Share prompts, celebrate achievements, and stay motivated.',
        genre: 'All',
        memberCount: 892,
        isPrivate: false,
        adminId: '2',
        createdAt: new Date('2023-06-20'),
        lastActivity: new Date('2024-03-11'),
        tags: ['daily-writing', 'prompts', 'motivation'],
        rules: [
          'Post your daily word count',
          'Share writing prompts',
          'Encourage fellow writers'
        ]
      },
      {
        id: '3',
        name: 'Poetry & Prose Collective',
        description: 'An intimate group for sharing and critiquing poetry and short prose pieces.',
        genre: 'Poetry',
        memberCount: 156,
        isPrivate: true,
        adminId: '3',
        createdAt: new Date('2022-11-30'),
        lastActivity: new Date('2024-03-09'),
        tags: ['poetry', 'prose', 'critique'],
        rules: [
          'Provide feedback before posting your own work',
          'Respect diverse writing styles',
          'No harsh criticism without constructive advice'
        ]
      }
    ];
    setCircles(mockCircles);
  };

  const handleFollow = async (writerId: string) => {
    setWriters(prev => prev.map(writer => 
      writer.id === writerId 
        ? { ...writer, isFollowing: !writer.isFollowing, followers: writer.followers + (writer.isFollowing ? -1 : 1) }
        : writer
    ));
  };

  const handleJoinCircle = async (circleId: string) => {
    setCircles(prev => prev.map(circle =>
      circle.id === circleId
        ? { ...circle, isMember: !circle.isMember, memberCount: circle.memberCount + (circle.isMember ? -1 : 1) }
        : circle
    ));
  };

  const filteredWriters = writers.filter(writer => {
    const matchesSearch = !searchQuery || 
      writer.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      writer.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
      writer.genres.some(genre => genre.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesGenres = selectedGenres.length === 0 ||
      selectedGenres.some(genre => writer.genres.includes(genre));
    
    return matchesSearch && matchesGenres;
  });

  const filteredCircles = circles.filter(circle => {
    const matchesSearch = !searchQuery ||
      circle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      circle.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesGenres = selectedGenres.length === 0 ||
      selectedGenres.includes(circle.genre) ||
      circle.genre === 'All';
    
    return matchesSearch && matchesGenres;
  });

  const renderWriterCard = (writer: WriterProfile) => (
    <Card key={writer.id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar src={writer.avatar} sx={{ width: 56, height: 56, mr: 2 }}>
            {writer.displayName.charAt(0)}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6">{writer.displayName}</Typography>
              {writer.isVerified && <VerifiedIcon color="primary" fontSize="small" />}
            </Box>
            <Typography variant="body2" color="text.secondary">
              @{writer.username}
            </Typography>
            <Chip
              label={experienceLevels[writer.writingExperience].label}
              size="small"
              sx={{ 
                mt: 0.5,
                backgroundColor: experienceLevels[writer.writingExperience].color,
                color: 'white'
              }}
            />
          </Box>
        </Box>

        <Typography variant="body2" sx={{ mb: 2, minHeight: 60 }}>
          {writer.bio}
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
          {writer.genres.map(genre => (
            <Chip key={genre} label={genre} size="small" variant="outlined" />
          ))}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6">{writer.worksPublished}</Typography>
            <Typography variant="caption">Published</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6">{writer.followers}</Typography>
            <Typography variant="caption">Followers</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6">{writer.following}</Typography>
            <Typography variant="caption">Following</Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
          <Button
            variant={writer.isFollowing ? "outlined" : "contained"}
            size="small"
            startIcon={<PersonAddIcon />}
            onClick={() => handleFollow(writer.id)}
            sx={{ flex: 1 }}
          >
            {writer.isFollowing ? 'Following' : 'Follow'}
          </Button>
          <IconButton
            size="small"
            onClick={() => {
              setSelectedWriter(writer);
              setProfileDialogOpen(true);
            }}
          >
            <MessageIcon />
          </IconButton>
          <IconButton size="small">
            <BookmarkIcon />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );

  const renderCircleCard = (circle: WritingCircle) => (
    <Card key={circle.id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">{circle.name}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GroupIcon color="action" fontSize="small" />
            <Typography variant="body2">{circle.memberCount}</Typography>
          </Box>
        </Box>

        <Typography variant="body2" sx={{ mb: 2, minHeight: 60 }}>
          {circle.description}
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
          <Chip label={circle.genre} size="small" color="primary" />
          {circle.isPrivate && <Chip label="Private" size="small" variant="outlined" />}
          {circle.tags.slice(0, 2).map(tag => (
            <Chip key={tag} label={tag} size="small" variant="outlined" />
          ))}
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          Last activity: {circle.lastActivity.toLocaleDateString()}
        </Typography>

        <Button
          variant={circle.isMember ? "outlined" : "contained"}
          fullWidth
          onClick={() => handleJoinCircle(circle.id)}
        >
          {circle.isMember ? 'Leave Circle' : circle.isPrivate ? 'Request to Join' : 'Join Circle'}
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Writer Community
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Discover Writers" />
          <Tab label="Writing Circles" />
          <Tab label="Trending" />
        </Tabs>
      </Paper>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search writers or circles..."
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
          }}
          sx={{ minWidth: 300 }}
        />
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {genres.slice(0, 5).map(genre => (
            <Chip
              key={genre}
              label={genre}
              clickable
              variant={selectedGenres.includes(genre) ? "filled" : "outlined"}
              onClick={() => {
                setSelectedGenres(prev =>
                  prev.includes(genre)
                    ? prev.filter(g => g !== genre)
                    : [...prev, genre]
                );
              }}
            />
          ))}
        </Box>
      </Box>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          {filteredWriters.map(writer => (
            <Grid item xs={12} sm={6} md={4} key={writer.id}>
              {renderWriterCard(writer)}
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5">Writing Circles</Typography>
            <Button
              variant="contained"
              startIcon={<GroupIcon />}
              onClick={() => setCreateCircleOpen(true)}
            >
              Create Circle
            </Button>
          </Box>
          
          <Grid container spacing={3}>
            {filteredCircles.map(circle => (
              <Grid item xs={12} sm={6} md={4} key={circle.id}>
                {renderCircleCard(circle)}
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {activeTab === 2 && (
        <Box>
          <Typography variant="h5" gutterBottom>
            Trending in the Community
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Popular This Week
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="World-building Workshop"
                        secondary="Fantasy Writers Guild • 234 participants"
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText
                        primary="Daily Writing Streak Challenge"
                        secondary="189 writers completed 30 days"
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText
                        primary="Character Development Masterclass"
                        secondary="Advanced Writers Circle • 156 attendees"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <StarIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Featured Writers
                  </Typography>
                  <List>
                    {writers.slice(0, 3).map(writer => (
                      <React.Fragment key={writer.id}>
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar src={writer.avatar}>
                              {writer.displayName.charAt(0)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={writer.displayName}
                            secondary={`${writer.followers} followers • ${writer.genres.join(', ')}`}
                          />
                          <ListItemSecondaryAction>
                            <Button size="small" variant="outlined">
                              Follow
                            </Button>
                          </ListItemSecondaryAction>
                        </ListItem>
                        <Divider />
                      </React.Fragment>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Writer Profile Dialog */}
      <Dialog
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedWriter && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar src={selectedWriter.avatar} sx={{ width: 64, height: 64 }}>
                  {selectedWriter.displayName.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h5">{selectedWriter.displayName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    @{selectedWriter.username}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" paragraph>
                {selectedWriter.bio}
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom>Recent Works</Typography>
                {selectedWriter.recentWorks.map((work, index) => (
                  <Card key={index} variant="outlined" sx={{ mb: 1 }}>
                    <CardContent sx={{ py: 1 }}>
                      <Typography variant="subtitle1">{work.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {work.genre} • {work.publishedAt.toLocaleDateString()} • {work.likes} likes
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
              
              <Box>
                <Typography variant="h6" gutterBottom>Achievements</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedWriter.achievements.map(achievement => (
                    <Chip key={achievement} label={achievement} variant="outlined" />
                  ))}
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setProfileDialogOpen(false)}>Close</Button>
              <Button variant="contained" startIcon={<MessageIcon />}>
                Send Message
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Create Circle Dialog */}
      <Dialog
        open={createCircleOpen}
        onClose={() => setCreateCircleOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create Writing Circle</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Circle Name"
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
            label="Primary Genre"
            fullWidth
            variant="outlined"
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateCircleOpen(false)}>Cancel</Button>
          <Button variant="contained">Create Circle</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};