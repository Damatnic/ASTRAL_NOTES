/**
 * Editorial Workflow Component
 * Manages editorial stages, track changes, version control, and approval workflows
 */

import React, { useState, useEffect } from 'react';
import { 
  Workflow, 
  Play, 
  Pause, 
  CheckCircle, 
  Clock, 
  Users, 
  FileText, 
  GitBranch,
  History,
  Settings,
  Plus,
  ArrowRight,
  AlertCircle,
  MessageSquare,
  Eye,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Send,
  Target,
  BarChart3,
  Calendar,
  Filter,
  Download,
  Upload
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Textarea';
import { Avatar } from '@/components/ui/Avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

import { editorialWorkflowService } from '@/services/editorialWorkflowService';
import { 
  EditorialWorkflow, 
  EditorialStage, 
  TrackedChange, 
  DocumentVersion,
  DocumentBranch,
  ChangeTracking
} from '@/types/collaboration';

interface EditorialWorkflowProps {
  projectId: string;
  currentUserId: string;
  userRole: string;
}

export const EditorialWorkflow: React.FC<EditorialWorkflowProps> = ({ 
  projectId, 
  currentUserId, 
  userRole 
}) => {
  const [workflows, setWorkflows] = useState<EditorialWorkflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<EditorialWorkflow | null>(null);
  const [changeTracking, setChangeTracking] = useState<ChangeTracking | null>(null);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [branches, setBranches] = useState<DocumentBranch[]>([]);
  const [activeTab, setActiveTab] = useState('workflow');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState<EditorialStage | null>(null);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [workflowsData, trackingData, versionsData, branchesData] = await Promise.all([
        editorialWorkflowService.getProjectWorkflows(projectId),
        editorialWorkflowService.getChangeTracking('doc-1'), // Mock document ID
        editorialWorkflowService.getDocumentVersions('doc-1'),
        editorialWorkflowService.getDocumentBranches('doc-1')
      ]);

      setWorkflows(workflowsData);
      if (workflowsData.length > 0) {
        setSelectedWorkflow(workflowsData[0]);
      }
      setChangeTracking(trackingData);
      setVersions(versionsData);
      setBranches(branchesData);
    } catch (error) {
      console.error('Error loading editorial workflow data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStageAction = async (stageId: string, action: 'start' | 'submit' | 'approve' | 'reject') => {
    if (!selectedWorkflow) return;

    try {
      switch (action) {
        case 'start':
          await editorialWorkflowService.startStage(selectedWorkflow.id, stageId, currentUserId);
          break;
        case 'submit':
          await editorialWorkflowService.submitForReview({
            workflowId: selectedWorkflow.id,
            stageId,
            submittedBy: currentUserId,
            deliverables: [], // Would be populated from form
            notes: 'Submitted for review'
          });
          break;
        default:
          setSelectedStage(selectedWorkflow.stages.find(s => s.id === stageId) || null);
          setShowApprovalModal(true);
      }
      
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Error handling stage action:', error);
    }
  };

  const handleApproval = async (approved: boolean, comments?: string) => {
    if (!selectedWorkflow || !selectedStage) return;

    try {
      await editorialWorkflowService.processApproval({
        workflowId: selectedWorkflow.id,
        stageId: selectedStage.id,
        approverId: currentUserId,
        approved,
        comments
      });

      setShowApprovalModal(false);
      setSelectedStage(null);
      await loadData();
    } catch (error) {
      console.error('Error processing approval:', error);
    }
  };

  const getStageStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-gray-100 text-gray-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'review': 'bg-orange-100 text-orange-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'completed': 'bg-green-100 text-green-800'
    };
    return colors[status] || colors.pending;
  };

  const getChangeStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'accepted': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'superseded': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.pending;
  };

  const getStageIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      'draft': <FileText className="w-4 h-4" />,
      'review': <Eye className="w-4 h-4" />,
      'edit': <Settings className="w-4 h-4" />,
      'proofread': <CheckCircle className="w-4 h-4" />,
      'approve': <ThumbsUp className="w-4 h-4" />,
      'publish': <Send className="w-4 h-4" />
    };
    return icons[type] || <FileText className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading editorial workflow...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Editorial Workflow</h1>
          <p className="text-gray-600 mt-1">
            Manage editorial stages, track changes, and coordinate approvals
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Workflow
          </Button>
        </div>
      </div>

      {/* Workflow Selector */}
      {workflows.length > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Active Workflow:</span>
              <Select 
                value={selectedWorkflow?.id || ''} 
                onValueChange={(value) => {
                  const workflow = workflows.find(w => w.id === value);
                  setSelectedWorkflow(workflow || null);
                }}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select workflow" />
                </SelectTrigger>
                <SelectContent>
                  {workflows.map((workflow) => (
                    <SelectItem key={workflow.id} value={workflow.id}>
                      {workflow.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="changes">Track Changes</TabsTrigger>
          <TabsTrigger value="versions">Versions</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Workflow Tab */}
        <TabsContent value="workflow" className="space-y-6">
          {selectedWorkflow ? (
            <>
              {/* Workflow Overview */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Workflow className="w-5 h-5" />
                      {selectedWorkflow.name}
                    </CardTitle>
                    <Badge className={selectedWorkflow.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {selectedWorkflow.isActive ? 'Active' : 'Completed'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{selectedWorkflow.description}</p>
                  
                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>
                        {selectedWorkflow.stages.filter(s => s.status === 'completed').length} / {selectedWorkflow.stages.length} stages completed
                      </span>
                    </div>
                    <Progress 
                      value={(selectedWorkflow.stages.filter(s => s.status === 'completed').length / selectedWorkflow.stages.length) * 100} 
                      className="h-2" 
                    />
                  </div>

                  {/* Key Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">
                        {Math.round(selectedWorkflow.analytics.totalDuration / (1000 * 60 * 60 * 24))}d
                      </div>
                      <div className="text-gray-600">Total Duration</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">
                        {selectedWorkflow.analytics.deadlineAdherence}%
                      </div>
                      <div className="text-gray-600">On Time</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-orange-600">
                        {selectedWorkflow.analytics.reworkCycles}
                      </div>
                      <div className="text-gray-600">Rework Cycles</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-purple-600">
                        {Object.keys(selectedWorkflow.analytics.participantContributions).length}
                      </div>
                      <div className="text-gray-600">Contributors</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Workflow Stages */}
              <div className="space-y-4">
                {selectedWorkflow.stages.map((stage, index) => (
                  <WorkflowStageCard
                    key={stage.id}
                    stage={stage}
                    stageNumber={index + 1}
                    isActive={selectedWorkflow.currentStage === index}
                    currentUserId={currentUserId}
                    userRole={userRole}
                    onAction={(action) => handleStageAction(stage.id, action)}
                  />
                ))}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Workflow className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Workflow</h3>
                <p className="text-gray-600 mb-4">
                  Create a workflow to manage your editorial process with stages and approvals.
                </p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Workflow
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Track Changes Tab */}
        <TabsContent value="changes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Track Changes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {changeTracking?.changes && changeTracking.changes.length > 0 ? (
                <div className="space-y-4">
                  {changeTracking.changes.map((change) => (
                    <ChangeCard
                      key={change.id}
                      change={change}
                      onAccept={(changeId) => {
                        // Handle accept change
                        console.log('Accept change:', changeId);
                      }}
                      onReject={(changeId) => {
                        // Handle reject change
                        console.log('Reject change:', changeId);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Changes to Review</h3>
                  <p className="text-gray-600">
                    Changes and suggestions will appear here when collaborators make edits.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Versions Tab */}
        <TabsContent value="versions" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Document Versions
                </CardTitle>
                <Button size="sm">
                  <Plus className="w-3 h-3 mr-1" />
                  Create Version
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {versions.length > 0 ? (
                <div className="space-y-3">
                  {versions.map((version) => (
                    <VersionCard key={version.id} version={version} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Versions Created</h3>
                  <p className="text-gray-600">
                    Create versions to track major milestones in your document.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branches Tab */}
        <TabsContent value="branches" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="w-5 h-5" />
                  Document Branches
                </CardTitle>
                <Button size="sm">
                  <Plus className="w-3 h-3 mr-1" />
                  Create Branch
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {branches.length > 0 ? (
                <div className="space-y-3">
                  {branches.map((branch) => (
                    <BranchCard key={branch.id} branch={branch} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <GitBranch className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Branches Created</h3>
                  <p className="text-gray-600">
                    Create branches to experiment with alternative versions.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Dashboard</h3>
                  <p className="text-gray-600">
                    Detailed workflow analytics will be displayed here.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Contributions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Contribution Metrics</h3>
                  <p className="text-gray-600">
                    Team member contributions and performance metrics.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Approval Modal */}
      {showApprovalModal && selectedStage && (
        <ApprovalModal
          stage={selectedStage}
          isOpen={showApprovalModal}
          onClose={() => {
            setShowApprovalModal(false);
            setSelectedStage(null);
          }}
          onApprove={(comments) => handleApproval(true, comments)}
          onReject={(comments) => handleApproval(false, comments)}
        />
      )}

      {/* Create Workflow Modal */}
      {showCreateModal && (
        <CreateWorkflowModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          projectId={projectId}
          onCreate={async (workflowData) => {
            try {
              await editorialWorkflowService.createWorkflow(workflowData);
              setShowCreateModal(false);
              await loadData();
            } catch (error) {
              console.error('Error creating workflow:', error);
            }
          }}
        />
      )}
    </div>
  );
};

// Workflow Stage Card Component
interface WorkflowStageCardProps {
  stage: EditorialStage;
  stageNumber: number;
  isActive: boolean;
  currentUserId: string;
  userRole: string;
  onAction: (action: 'start' | 'submit' | 'approve' | 'reject') => void;
}

const WorkflowStageCard: React.FC<WorkflowStageCardProps> = ({ 
  stage, 
  stageNumber, 
  isActive, 
  currentUserId, 
  userRole, 
  onAction 
}) => {
  const getStageStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-gray-100 text-gray-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'review': 'bg-orange-100 text-orange-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'completed': 'bg-green-100 text-green-800'
    };
    return colors[status] || colors.pending;
  };

  const getStageIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      'draft': <FileText className="w-4 h-4" />,
      'review': <Eye className="w-4 h-4" />,
      'edit': <Settings className="w-4 h-4" />,
      'proofread': <CheckCircle className="w-4 h-4" />,
      'approve': <ThumbsUp className="w-4 h-4" />,
      'publish': <Send className="w-4 h-4" />
    };
    return icons[type] || <FileText className="w-4 h-4" />;
  };

  const canStartStage = stage.status === 'pending' && stage.assignedTo.includes(currentUserId);
  const canSubmit = stage.status === 'in-progress' && stage.assignedTo.includes(currentUserId);
  const canApprove = stage.status === 'review' && 
    stage.approvals.some(a => 
      (a.requiredFrom === currentUserId || 
       (a.approverRole && userRole === a.approverRole)) && 
      a.status === 'pending'
    );

  return (
    <Card className={`${isActive ? 'ring-2 ring-blue-500' : ''} ${stage.status === 'completed' ? 'bg-green-50' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Stage Number & Icon */}
          <div className="flex-shrink-0">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              stage.status === 'completed' ? 'bg-green-100 text-green-600' :
              isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
            }`}>
              {stage.status === 'completed' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <span className="font-semibold">{stageNumber}</span>
              )}
            </div>
          </div>

          {/* Stage Content */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getStageIcon(stage.type)}
                <h3 className="text-lg font-semibold text-gray-900">{stage.name}</h3>
              </div>
              <Badge className={getStageStatusColor(stage.status)}>
                {stage.status}
              </Badge>
            </div>

            <p className="text-gray-600 mb-3">{stage.description}</p>

            {/* Timeline */}
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
              {stage.deadline && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Due: {stage.deadline.toLocaleDateString()}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {Math.round(stage.estimatedDuration / 24)}d estimated
              </span>
              {stage.assignedTo.length > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {stage.assignedTo.length} assigned
                </span>
              )}
            </div>

            {/* Requirements & Deliverables */}
            {(stage.requirements.length > 0 || stage.deliverables.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {stage.requirements.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Requirements:</h4>
                    <div className="space-y-1">
                      {stage.requirements.slice(0, 2).map((req) => (
                        <div key={req.id} className="flex items-center gap-2 text-sm">
                          <div className={`w-2 h-2 rounded-full ${
                            req.status === 'met' ? 'bg-green-500' : 
                            req.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-300'
                          }`} />
                          <span className="text-gray-600">{req.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {stage.deliverables.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Deliverables:</h4>
                    <div className="space-y-1">
                      {stage.deliverables.slice(0, 2).map((del) => (
                        <div key={del.id} className="flex items-center gap-2 text-sm">
                          <div className={`w-2 h-2 rounded-full ${
                            del.status === 'approved' ? 'bg-green-500' : 
                            del.status === 'submitted' ? 'bg-blue-500' :
                            del.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-300'
                          }`} />
                          <span className="text-gray-600">{del.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Feedback */}
            {stage.feedback.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-1">Latest Feedback:</h4>
                <p className="text-sm text-blue-800">{stage.feedback[stage.feedback.length - 1].content}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              {canStartStage && (
                <Button size="sm" onClick={() => onAction('start')}>
                  <Play className="w-3 h-3 mr-1" />
                  Start Stage
                </Button>
              )}
              
              {canSubmit && (
                <Button size="sm" onClick={() => onAction('submit')}>
                  <Send className="w-3 h-3 mr-1" />
                  Submit for Review
                </Button>
              )}
              
              {canApprove && (
                <>
                  <Button size="sm" onClick={() => onAction('approve')}>
                    <ThumbsUp className="w-3 h-3 mr-1" />
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onAction('reject')}>
                    <ThumbsDown className="w-3 h-3 mr-1" />
                    Reject
                  </Button>
                </>
              )}

              <Button size="sm" variant="outline">
                <Eye className="w-3 h-3 mr-1" />
                View Details
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Change Card Component
interface ChangeCardProps {
  change: TrackedChange;
  onAccept: (changeId: string) => void;
  onReject: (changeId: string) => void;
}

const ChangeCard: React.FC<ChangeCardProps> = ({ change, onAccept, onReject }) => {
  const getChangeStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'accepted': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'superseded': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.pending;
  };

  const getChangeTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      'insert': <Plus className="w-4 h-4 text-green-600" />,
      'delete': <ArrowRight className="w-4 h-4 text-red-600" />,
      'format': <Settings className="w-4 h-4 text-blue-600" />,
      'comment': <MessageSquare className="w-4 h-4 text-gray-600" />
    };
    return icons[type] || <FileText className="w-4 h-4" />;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {getChangeTypeIcon(change.type)}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{change.authorName}</span>
                <span className="text-sm text-gray-500">
                  {change.timestamp.toLocaleDateString()}
                </span>
              </div>
              <Badge className={getChangeStatusColor(change.status)}>
                {change.status}
              </Badge>
            </div>

            {/* Change Content */}
            {change.type === 'insert' && change.newText && (
              <div className="mb-2">
                <p className="text-sm text-gray-600 mb-1">Added text:</p>
                <div className="bg-green-50 border-l-4 border-green-400 p-2 rounded">
                  <span className="text-green-800">{change.newText}</span>
                </div>
              </div>
            )}

            {change.type === 'delete' && change.originalText && (
              <div className="mb-2">
                <p className="text-sm text-gray-600 mb-1">Deleted text:</p>
                <div className="bg-red-50 border-l-4 border-red-400 p-2 rounded">
                  <span className="text-red-800 line-through">{change.originalText}</span>
                </div>
              </div>
            )}

            {/* Position Info */}
            <p className="text-xs text-gray-500 mb-3">
              Chapter {change.position.chapter}, Paragraph {change.position.paragraph}
            </p>

            {/* Comments */}
            {change.comments.length > 0 && (
              <div className="mb-3 space-y-2">
                {change.comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 rounded p-2">
                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                      <span>{comment.authorId}</span>
                      <span>{comment.timestamp.toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-gray-800">{comment.content}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            {change.status === 'pending' && (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => onAccept(change.id)}>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Accept
                </Button>
                <Button size="sm" variant="outline" onClick={() => onReject(change.id)}>
                  <ArrowRight className="w-3 h-3 mr-1" />
                  Reject
                </Button>
                <Button size="sm" variant="outline">
                  <MessageSquare className="w-3 h-3 mr-1" />
                  Comment
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Version Card Component
interface VersionCardProps {
  version: DocumentVersion;
}

const VersionCard: React.FC<VersionCardProps> = ({ version }) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                version.isMajor ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}>
                <FileText className="w-4 h-4" />
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900">
                Version {version.versionNumber}
                {version.isMajor && <Badge className="ml-2 bg-blue-100 text-blue-800">Major</Badge>}
              </h4>
              <p className="text-sm text-gray-600">{version.description}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                <span>By {version.createdBy}</span>
                <span>{version.createdAt.toLocaleDateString()}</span>
                <span>{version.wordCount.toLocaleString()} words</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <Eye className="w-3 h-3 mr-1" />
              View
            </Button>
            <Button size="sm" variant="outline">
              <Download className="w-3 h-3 mr-1" />
              Download
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Branch Card Component
interface BranchCardProps {
  branch: DocumentBranch;
}

const BranchCard: React.FC<BranchCardProps> = ({ branch }) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                branch.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
              }`}>
                <GitBranch className="w-4 h-4" />
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-gray-900">{branch.name}</h4>
                {branch.isActive && <Badge className="bg-green-100 text-green-800">Active</Badge>}
                {branch.isMerged && <Badge className="bg-blue-100 text-blue-800">Merged</Badge>}
              </div>
              <p className="text-sm text-gray-600">{branch.description}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                <span>By {branch.createdBy}</span>
                <span>{branch.createdAt.toLocaleDateString()}</span>
                <span>{branch.versions.length} versions</span>
                <span>{branch.collaborators.length} collaborators</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <Eye className="w-3 h-3 mr-1" />
              Switch
            </Button>
            {!branch.isMerged && branch.name !== 'main' && (
              <Button size="sm">
                <ArrowRight className="w-3 h-3 mr-1" />
                Merge
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Approval Modal Component
interface ApprovalModalProps {
  stage: EditorialStage;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (comments?: string) => void;
  onReject: (comments?: string) => void;
}

const ApprovalModal: React.FC<ApprovalModalProps> = ({ 
  stage, 
  isOpen, 
  onClose, 
  onApprove, 
  onReject 
}) => {
  const [comments, setComments] = useState('');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review Stage: {stage.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-gray-600">{stage.description}</p>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comments (optional)
            </label>
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add any comments or feedback..."
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="outline" onClick={() => onReject(comments)}>
              <ThumbsDown className="w-4 h-4 mr-2" />
              Reject
            </Button>
            <Button onClick={() => onApprove(comments)}>
              <ThumbsUp className="w-4 h-4 mr-2" />
              Approve
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Create Workflow Modal (simplified)
interface CreateWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onCreate: (data: any) => Promise<void>;
}

const CreateWorkflowModal: React.FC<CreateWorkflowModalProps> = ({ 
  isOpen, 
  onClose, 
  projectId, 
  onCreate 
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Editorial Workflow</DialogTitle>
        </DialogHeader>
        
        <div className="text-center py-8">
          <Workflow className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Workflow Creation</h3>
          <p className="text-gray-600 mb-4">
            Full workflow creation interface will be implemented here.
          </p>
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};