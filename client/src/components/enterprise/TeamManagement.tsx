import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  FormControlLabel,
  Autocomplete,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  Group as GroupIcon,
  Assignment as AssignmentIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Visibility as VisibilityIcon,
  Business as BusinessIcon,
  Shield as ShieldIcon,
  Key as KeyIcon,
  Timeline as TimelineIcon,
  FileDownload as FileDownloadIcon
} from '@mui/icons-material';

interface TeamMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: 'admin' | 'manager' | 'editor' | 'writer' | 'viewer';
  department: string;
  status: 'active' | 'inactive' | 'pending';
  lastActive: Date;
  joinedAt: Date;
  permissions: Permission[];
  projects: string[];
  usage: {
    wordsWritten: number;
    documentsCreated: number;
    collaborations: number;
    lastLogin: Date;
  };
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'content' | 'collaboration' | 'administration' | 'export';
  enabled: boolean;
}

interface Team {
  id: string;
  name: string;
  description: string;
  members: TeamMember[];
  projects: string[];
  settings: TeamSettings;
  createdAt: Date;
  subscription: {
    plan: 'starter' | 'professional' | 'enterprise';
    seats: number;
    usedSeats: number;
    features: string[];
    billingCycle: 'monthly' | 'annual';
    nextBilling: Date;
  };
}

interface TeamSettings {
  allowGuestAccess: boolean;
  requireTwoFactor: boolean;
  dataRetentionDays: number;
  allowExternalSharing: boolean;
  enforcePasswordPolicy: boolean;
  auditLogging: boolean;
  ssoEnabled: boolean;
  customBranding: boolean;
}

interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  metadata?: any;
}

export const TeamManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editMemberOpen, setEditMemberOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const roles = [
    {
      value: 'admin',
      label: 'Administrator',
      description: 'Full access to all team settings and content',
      color: 'error'
    },
    {
      value: 'manager',
      label: 'Manager',
      description: 'Manage team members and projects',
      color: 'warning'
    },
    {
      value: 'editor',
      label: 'Editor',
      description: 'Edit all content and collaborate',
      color: 'primary'
    },
    {
      value: 'writer',
      label: 'Writer',
      description: 'Create and edit own content',
      color: 'info'
    },
    {
      value: 'viewer',
      label: 'Viewer',
      description: 'Read-only access to shared content',
      color: 'default'
    }
  ];

  const defaultPermissions: Permission[] = [
    {
      id: 'create_documents',
      name: 'Create Documents',
      description: 'Create new documents and projects',
      category: 'content',
      enabled: true
    },
    {
      id: 'edit_all_documents',
      name: 'Edit All Documents',
      description: 'Edit documents created by others',
      category: 'content',
      enabled: false
    },
    {
      id: 'delete_documents',
      name: 'Delete Documents',
      description: 'Delete documents and projects',
      category: 'content',
      enabled: false
    },
    {
      id: 'invite_members',
      name: 'Invite Members',
      description: 'Invite new team members',
      category: 'administration',
      enabled: false
    },
    {
      id: 'manage_permissions',
      name: 'Manage Permissions',
      description: 'Change user roles and permissions',
      category: 'administration',
      enabled: false
    },
    {
      id: 'export_data',
      name: 'Export Data',
      description: 'Export documents and team data',
      category: 'export',
      enabled: true
    },
    {
      id: 'real_time_collaboration',
      name: 'Real-time Collaboration',
      description: 'Participate in real-time editing sessions',
      category: 'collaboration',
      enabled: true
    },
    {
      id: 'comment_and_suggest',
      name: 'Comment & Suggest',
      description: 'Add comments and suggestions to documents',
      category: 'collaboration',
      enabled: true
    }
  ];

  useEffect(() => {
    loadTeamData();
    loadActivityLogs();
  }, []);

  const loadTeamData = async () => {
    const mockTeam: Team = {
      id: 'team1',
      name: 'Astral Publishing House',
      description: 'A modern publishing company focused on digital-first content creation',
      members: [],
      projects: ['project1', 'project2', 'project3'],
      settings: {
        allowGuestAccess: false,
        requireTwoFactor: true,
        dataRetentionDays: 365,
        allowExternalSharing: true,
        enforcePasswordPolicy: true,
        auditLogging: true,
        ssoEnabled: true,
        customBranding: true
      },
      createdAt: new Date('2023-01-15'),
      subscription: {
        plan: 'enterprise',
        seats: 50,
        usedSeats: 23,
        features: [
          'Unlimited documents',
          'Advanced collaboration',
          'Custom branding',
          'SSO integration',
          'Priority support',
          'Advanced analytics'
        ],
        billingCycle: 'annual',
        nextBilling: new Date('2024-12-15')
      }
    };

    const mockMembers: TeamMember[] = [
      {
        id: 'user1',
        email: 'sarah.chen@astralpub.com',
        firstName: 'Sarah',
        lastName: 'Chen',
        role: 'admin',
        department: 'Editorial',
        status: 'active',
        lastActive: new Date('2024-03-10'),
        joinedAt: new Date('2023-01-15'),
        permissions: defaultPermissions.map(p => ({ ...p, enabled: true })),
        projects: ['project1', 'project2'],
        usage: {
          wordsWritten: 45789,
          documentsCreated: 23,
          collaborations: 67,
          lastLogin: new Date('2024-03-10')
        }
      },
      {
        id: 'user2',
        email: 'mike.rodriguez@astralpub.com',
        firstName: 'Mike',
        lastName: 'Rodriguez',
        role: 'manager',
        department: 'Content',
        status: 'active',
        lastActive: new Date('2024-03-09'),
        joinedAt: new Date('2023-02-01'),
        permissions: defaultPermissions.map(p => ({ 
          ...p, 
          enabled: p.category !== 'administration' || p.id === 'invite_members'
        })),
        projects: ['project2', 'project3'],
        usage: {
          wordsWritten: 32456,
          documentsCreated: 18,
          collaborations: 45,
          lastLogin: new Date('2024-03-09')
        }
      },
      {
        id: 'user3',
        email: 'emma.thompson@astralpub.com',
        firstName: 'Emma',
        lastName: 'Thompson',
        role: 'editor',
        department: 'Editorial',
        status: 'active',
        lastActive: new Date('2024-03-08'),
        joinedAt: new Date('2023-03-15'),
        permissions: defaultPermissions.map(p => ({ 
          ...p, 
          enabled: p.category === 'content' || p.category === 'collaboration'
        })),
        projects: ['project1'],
        usage: {
          wordsWritten: 28934,
          documentsCreated: 15,
          collaborations: 38,
          lastLogin: new Date('2024-03-08')
        }
      },
      {
        id: 'user4',
        email: 'john.doe@freelancer.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'writer',
        department: 'Freelance',
        status: 'pending',
        lastActive: new Date('2024-03-05'),
        joinedAt: new Date('2024-03-01'),
        permissions: defaultPermissions.map(p => ({ 
          ...p, 
          enabled: p.category === 'content' && p.id === 'create_documents' || p.category === 'collaboration'
        })),
        projects: ['project3'],
        usage: {
          wordsWritten: 12567,
          documentsCreated: 8,
          collaborations: 12,
          lastLogin: new Date('2024-03-05')
        }
      }
    ];

    setTeam(mockTeam);
    setMembers(mockMembers);
  };

  const loadActivityLogs = async () => {
    const mockLogs: ActivityLog[] = [
      {
        id: 'log1',
        userId: 'user1',
        action: 'User logged in',
        resource: 'Authentication',
        timestamp: new Date('2024-03-10T09:15:00'),
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      {
        id: 'log2',
        userId: 'user2',
        action: 'Document created',
        resource: 'project2/quarterly-report.md',
        timestamp: new Date('2024-03-09T14:30:00'),
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      {
        id: 'log3',
        userId: 'user3',
        action: 'Permission changed',
        resource: 'user4',
        timestamp: new Date('2024-03-08T11:45:00'),
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        metadata: { oldRole: 'viewer', newRole: 'writer' }
      }
    ];
    setActivityLogs(mockLogs);
  };

  const handleInviteMember = async (email: string, role: string, department: string) => {
    const newMember: TeamMember = {
      id: 'user' + Date.now(),
      email,
      firstName: email.split('@')[0].split('.')[0],
      lastName: email.split('@')[0].split('.')[1] || '',
      role: role as any,
      department,
      status: 'pending',
      lastActive: new Date(),
      joinedAt: new Date(),
      permissions: defaultPermissions.map(p => ({
        ...p,
        enabled: role === 'admin' ? true : p.category === 'content' || p.category === 'collaboration'
      })),
      projects: [],
      usage: {
        wordsWritten: 0,
        documentsCreated: 0,
        collaborations: 0,
        lastLogin: new Date()
      }
    };

    setMembers(prev => [...prev, newMember]);
    setInviteDialogOpen(false);
  };

  const handleUpdateMember = async (memberId: string, updates: Partial<TeamMember>) => {
    setMembers(prev => prev.map(member =>
      member.id === memberId ? { ...member, ...updates } : member
    ));
    setEditMemberOpen(false);
  };

  const handleRemoveMember = async (memberId: string) => {
    setMembers(prev => prev.filter(member => member.id !== memberId));
  };

  const getRoleColor = (role: string) => {
    const roleConfig = roles.find(r => r.value === role);
    return roleConfig?.color || 'default';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const exportTeamData = () => {
    const data = {
      team,
      members: members.map(m => ({
        ...m,
        permissions: undefined // Don't export sensitive permission data
      })),
      activityLogs: activityLogs.slice(0, 100) // Last 100 entries
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `team-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Team Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={exportTeamData}
          >
            Export Data
          </Button>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => setInviteDialogOpen(true)}
          >
            Invite Member
          </Button>
        </Box>
      </Box>

      {team && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <GroupIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Team Size</Typography>
                </Box>
                <Typography variant="h4">{members.length}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {team.subscription.usedSeats} / {team.subscription.seats} seats used
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(team.subscription.usedSeats / team.subscription.seats) * 100}
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <BusinessIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="h6">Plan</Typography>
                </Box>
                <Typography variant="h4" sx={{ textTransform: 'capitalize' }}>
                  {team.subscription.plan}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Next billing: {team.subscription.nextBilling.toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TimelineIcon color="info" sx={{ mr: 1 }} />
                  <Typography variant="h6">Active Users</Typography>
                </Box>
                <Typography variant="h4">
                  {members.filter(m => m.status === 'active').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {members.filter(m => m.status === 'pending').length} pending invites
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ShieldIcon color="warning" sx={{ mr: 1 }} />
                  <Typography variant="h6">Security</Typography>
                </Box>
                <Typography variant="h4">
                  {team.settings.requireTwoFactor && team.settings.ssoEnabled ? 'High' : 'Medium'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {team.settings.auditLogging ? 'Audit enabled' : 'Audit disabled'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Members" />
          <Tab label="Permissions" />
          <Tab label="Activity Logs" />
          <Tab label="Settings" />
        </Tabs>
      </Paper>

      {activeTab === 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Member</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Usage</TableCell>
                <TableCell>Last Active</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {members.map(member => (
                <TableRow key={member.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar src={member.avatar}>
                        {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">
                          {member.firstName} {member.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {member.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={roles.find(r => r.value === member.role)?.label}
                      color={getRoleColor(member.role) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{member.department}</TableCell>
                  <TableCell>
                    <Chip
                      label={member.status}
                      color={getStatusColor(member.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {member.usage.documentsCreated} docs
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {member.usage.wordsWritten.toLocaleString()} words
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {member.lastActive.toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedMember(member);
                        setEditMemberOpen(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          {roles.map(role => (
            <Grid item xs={12} md={6} lg={4} key={role.value}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {role.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {role.description}
                  </Typography>
                  <List dense>
                    {defaultPermissions.map(permission => {
                      const hasPermission = role.value === 'admin' ? true :
                        role.value === 'manager' ? permission.category !== 'administration' || permission.id === 'invite_members' :
                        role.value === 'editor' ? permission.category === 'content' || permission.category === 'collaboration' :
                        role.value === 'writer' ? permission.category === 'collaboration' || permission.id === 'create_documents' :
                        permission.category === 'collaboration' && permission.id !== 'real_time_collaboration';
                      
                      return (
                        <ListItem key={permission.id}>
                          <ListItemText
                            primary={permission.name}
                            secondary={permission.description}
                          />
                          <ListItemSecondaryAction>
                            <Chip
                              label={hasPermission ? 'Allowed' : 'Denied'}
                              color={hasPermission ? 'success' : 'error'}
                              size="small"
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                      );
                    })}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 2 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Resource</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>IP Address</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activityLogs.map(log => {
                const user = members.find(m => m.id === log.userId);
                return (
                  <TableRow key={log.id}>
                    <TableCell>
                      {user ? `${user.firstName} ${user.lastName}` : 'Unknown User'}
                    </TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell>{log.resource}</TableCell>
                    <TableCell>{log.timestamp.toLocaleString()}</TableCell>
                    <TableCell>{log.ipAddress}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {activeTab === 3 && team && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Security Settings
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Require Two-Factor Authentication"
                      secondary="All team members must use 2FA"
                    />
                    <ListItemSecondaryAction>
                      <Switch checked={team.settings.requireTwoFactor} />
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Single Sign-On (SSO)"
                      secondary="Enable SSO integration"
                    />
                    <ListItemSecondaryAction>
                      <Switch checked={team.settings.ssoEnabled} />
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Enforce Password Policy"
                      secondary="Strong password requirements"
                    />
                    <ListItemSecondaryAction>
                      <Switch checked={team.settings.enforcePasswordPolicy} />
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Audit Logging"
                      secondary="Log all user activities"
                    />
                    <ListItemSecondaryAction>
                      <Switch checked={team.settings.auditLogging} />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Collaboration Settings
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Allow Guest Access"
                      secondary="Non-members can view shared documents"
                    />
                    <ListItemSecondaryAction>
                      <Switch checked={team.settings.allowGuestAccess} />
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="External Sharing"
                      secondary="Share documents outside the team"
                    />
                    <ListItemSecondaryAction>
                      <Switch checked={team.settings.allowExternalSharing} />
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Custom Branding"
                      secondary="Use team logo and colors"
                    />
                    <ListItemSecondaryAction>
                      <Switch checked={team.settings.customBranding} />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Invite Member Dialog */}
      <Dialog open={inviteDialogOpen} onClose={() => setInviteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Invite Team Member</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Email Address"
            type="email"
            fullWidth
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel>Role</InputLabel>
            <Select defaultValue="writer" label="Role">
              {roles.map(role => (
                <MenuItem key={role.value} value={role.value}>
                  {role.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Department"
            fullWidth
            variant="outlined"
            defaultValue="Content"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained">Send Invitation</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={editMemberOpen} onClose={() => setEditMemberOpen(false)} maxWidth="md" fullWidth>
        {selectedMember && (
          <>
            <DialogTitle>Edit Member: {selectedMember.firstName} {selectedMember.lastName}</DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    margin="dense"
                    label="First Name"
                    fullWidth
                    variant="outlined"
                    defaultValue={selectedMember.firstName}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    margin="dense"
                    label="Last Name"
                    fullWidth
                    variant="outlined"
                    defaultValue={selectedMember.lastName}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="dense">
                    <InputLabel>Role</InputLabel>
                    <Select defaultValue={selectedMember.role} label="Role">
                      {roles.map(role => (
                        <MenuItem key={role.value} value={role.value}>
                          {role.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    margin="dense"
                    label="Department"
                    fullWidth
                    variant="outlined"
                    defaultValue={selectedMember.department}
                  />
                </Grid>
              </Grid>
              
              <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                Permissions
              </Typography>
              <List>
                {selectedMember.permissions.map(permission => (
                  <ListItem key={permission.id}>
                    <ListItemText
                      primary={permission.name}
                      secondary={permission.description}
                    />
                    <ListItemSecondaryAction>
                      <Switch checked={permission.enabled} />
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditMemberOpen(false)}>Cancel</Button>
              <Button variant="contained">Save Changes</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};