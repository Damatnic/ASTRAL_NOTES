/**
 * Editorial Workflow Service
 * Manages editorial stages, track changes, version branching, and approval workflows
 */

import { 
  EditorialWorkflow, 
  EditorialStage, 
  ChangeTracking, 
  TrackedChange, 
  DocumentVersion, 
  DocumentBranch,
  MergeRecord,
  WorkflowSettings,
  QualityGate,
  EscalationRule
} from '@/types/collaboration';

export interface CreateWorkflowData {
  projectId: string;
  name: string;
  description?: string;
  templateType?: 'standard' | 'academic' | 'professional' | 'agile' | 'custom';
  stages: Omit<EditorialStage, 'id' | 'status' | 'startedAt' | 'completedAt' | 'approvals' | 'feedback'>[];
}

export interface SubmitForReviewData {
  stageId: string;
  workflowId: string;
  submittedBy: string;
  deliverables: string[];
  notes?: string;
}

export interface ApprovalData {
  stageId: string;
  workflowId: string;
  approverId: string;
  approved: boolean;
  comments?: string;
  conditions?: string[];
}

export interface ChangeTrackingSettings {
  enabled: boolean;
  autoAcceptFromOwners: boolean;
  requireApprovalForMajorChanges: boolean;
  showChangeHistory: boolean;
  enableSuggestionMode: boolean;
}

class EditorialWorkflowService {
  private static instance: EditorialWorkflowService;
  private workflows: Map<string, EditorialWorkflow> = new Map();
  private changeTracking: Map<string, ChangeTracking> = new Map(); // documentId -> tracking
  private versions: Map<string, DocumentVersion[]> = new Map(); // documentId -> versions
  private branches: Map<string, DocumentBranch[]> = new Map(); // documentId -> branches

  private constructor() {
    this.initializeWithMockData();
  }

  public static getInstance(): EditorialWorkflowService {
    if (!EditorialWorkflowService.instance) {
      EditorialWorkflowService.instance = new EditorialWorkflowService();
    }
    return EditorialWorkflowService.instance;
  }

  /**
   * Create a new editorial workflow
   */
  public async createWorkflow(data: CreateWorkflowData): Promise<EditorialWorkflow> {
    const workflowId = this.generateId();
    const now = new Date();

    // Generate stages with proper IDs and initial status
    const stages: EditorialStage[] = data.stages.map((stage, index) => ({
      ...stage,
      id: this.generateId(),
      order: index,
      status: index === 0 ? 'pending' : 'pending',
      approvals: stage.requiredRoles.map(role => ({
        id: this.generateId(),
        requiredFrom: '',
        approverRole: role,
        status: 'pending'
      })),
      feedback: [],
      settings: {
        allowParallelEditing: false,
        autoAdvanceOnApproval: true,
        notifyOnStatusChange: true,
        requireAllApprovals: true,
        allowRollback: true,
        trackChanges: true,
        versionControl: true
      }
    }));

    const workflow: EditorialWorkflow = {
      id: workflowId,
      projectId: data.projectId,
      name: data.name,
      description: data.description || '',
      stages,
      currentStage: 0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      settings: this.getDefaultWorkflowSettings(),
      analytics: {
        totalDuration: 0,
        averageStageTime: 0,
        bottleneckStages: [],
        approvalTimes: {},
        reworkCycles: 0,
        qualityScores: {},
        participantContributions: {},
        deadlineAdherence: 100
      }
    };

    this.workflows.set(workflowId, workflow);
    return workflow;
  }

  /**
   * Get workflow by ID
   */
  public async getWorkflow(workflowId: string): Promise<EditorialWorkflow | null> {
    return this.workflows.get(workflowId) || null;
  }

  /**
   * Get workflows for a project
   */
  public async getProjectWorkflows(projectId: string): Promise<EditorialWorkflow[]> {
    return Array.from(this.workflows.values())
      .filter(workflow => workflow.projectId === projectId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Start a workflow stage
   */
  public async startStage(workflowId: string, stageId: string, startedBy: string): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const stage = workflow.stages.find(s => s.id === stageId);
    if (!stage) {
      throw new Error('Stage not found');
    }

    if (stage.status !== 'pending') {
      throw new Error('Stage has already been started');
    }

    // Check if previous stages are completed (if not parallel)
    const stageIndex = workflow.stages.indexOf(stage);
    if (stageIndex > 0 && !stage.isParallel) {
      const previousStage = workflow.stages[stageIndex - 1];
      if (previousStage.status !== 'completed') {
        throw new Error('Previous stage must be completed first');
      }
    }

    stage.status = 'in-progress';
    stage.startedAt = new Date();
    workflow.currentStage = stageIndex;
    workflow.updatedAt = new Date();

    // Auto-assign if configured
    if (workflow.settings.autoAssignment) {
      this.autoAssignStage(stage);
    }

    // Send notifications
    this.sendStageNotifications(workflow, stage, 'stage-start');
  }

  /**
   * Submit stage for review
   */
  public async submitForReview(data: SubmitForReviewData): Promise<void> {
    const workflow = this.workflows.get(data.workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const stage = workflow.stages.find(s => s.id === data.stageId);
    if (!stage) {
      throw new Error('Stage not found');
    }

    if (stage.status !== 'in-progress') {
      throw new Error('Stage must be in progress to submit for review');
    }

    // Update deliverables
    stage.deliverables.forEach(deliverable => {
      if (data.deliverables.includes(deliverable.id)) {
        deliverable.status = 'submitted';
        deliverable.submittedBy = data.submittedBy;
        deliverable.submittedAt = new Date();
        deliverable.notes = data.notes;
      }
    });

    // Check if all required deliverables are submitted
    const requiredDeliverables = stage.deliverables.filter(d => d.isRequired);
    const submittedRequired = requiredDeliverables.filter(d => d.status === 'submitted');

    if (submittedRequired.length === requiredDeliverables.length) {
      stage.status = 'review';
      workflow.updatedAt = new Date();

      // Send notifications to approvers
      this.sendStageNotifications(workflow, stage, 'approval-required');
    }
  }

  /**
   * Approve or reject a stage
   */
  public async processApproval(data: ApprovalData): Promise<void> {
    const workflow = this.workflows.get(data.workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const stage = workflow.stages.find(s => s.id === data.stageId);
    if (!stage) {
      throw new Error('Stage not found');
    }

    // Find the approval for this user
    const approval = stage.approvals.find(a => 
      a.requiredFrom === data.approverId || 
      a.approverRole && this.userHasRole(data.approverId, a.approverRole)
    );

    if (!approval) {
      throw new Error('Not authorized to approve this stage');
    }

    approval.status = data.approved ? 'approved' : 'rejected';
    approval.approvedBy = data.approverId;
    approval.approvedAt = new Date();
    approval.comments = data.comments;
    approval.conditions = data.conditions;

    // Check if stage should advance
    if (data.approved) {
      const allApprovals = stage.approvals.filter(a => a.status !== 'not-required');
      const approvedCount = allApprovals.filter(a => a.status === 'approved').length;

      if (stage.settings.requireAllApprovals) {
        // All approvals required
        if (approvedCount === allApprovals.length) {
          await this.completeStage(data.workflowId, data.stageId);
        }
      } else {
        // At least one approval required
        if (approvedCount > 0) {
          await this.completeStage(data.workflowId, data.stageId);
        }
      }
    } else {
      // Rejection - send back to in-progress
      stage.status = 'in-progress';
      this.sendStageNotifications(workflow, stage, 'stage-rejected');
    }

    workflow.updatedAt = new Date();
  }

  /**
   * Complete a stage
   */
  private async completeStage(workflowId: string, stageId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return;

    const stage = workflow.stages.find(s => s.id === stageId);
    if (!stage) return;

    stage.status = 'completed';
    stage.completedAt = new Date();

    // Mark all deliverables as approved
    stage.deliverables.forEach(deliverable => {
      if (deliverable.status === 'submitted') {
        deliverable.status = 'approved';
      }
    });

    // Check if workflow is complete
    const completedStages = workflow.stages.filter(s => s.status === 'completed');
    if (completedStages.length === workflow.stages.length) {
      workflow.isActive = false;
      workflow.completedAt = new Date();
      this.sendStageNotifications(workflow, stage, 'workflow-complete');
    } else {
      // Start next stage if auto-advance is enabled
      if (stage.settings.autoAdvanceOnApproval) {
        const nextStage = this.getNextStage(workflow, stage);
        if (nextStage) {
          await this.startStage(workflowId, nextStage.id, 'system');
        }
      }
    }

    this.sendStageNotifications(workflow, stage, 'stage-complete');
    this.updateWorkflowAnalytics(workflow);
  }

  /**
   * Create change tracking for a document
   */
  public async enableChangeTracking(
    documentId: string, 
    documentType: string,
    settings: ChangeTrackingSettings
  ): Promise<ChangeTracking> {
    const tracking: ChangeTracking = {
      id: this.generateId(),
      documentId,
      documentType,
      isEnabled: settings.enabled,
      changes: [],
      versions: [],
      branches: [{
        id: 'main',
        name: 'main',
        description: 'Main branch',
        createdBy: 'system',
        createdAt: new Date(),
        isActive: true,
        isMerged: false,
        versions: [],
        collaborators: [],
        purpose: 'feature'
      }],
      mergeHistory: [],
      settings: {
        autoAcceptFromOwners: settings.autoAcceptFromOwners,
        requireApprovalForMajorChanges: settings.requireApprovalForMajorChanges,
        maxChangesPerDocument: 1000,
        enableSuggestionMode: settings.enableSuggestionMode,
        showChangeHistory: settings.showChangeHistory,
        notifyOnChanges: true,
        retentionDays: 90
      }
    };

    this.changeTracking.set(documentId, tracking);
    return tracking;
  }

  /**
   * Track a change to a document
   */
  public async trackChange(change: Omit<TrackedChange, 'id' | 'timestamp' | 'status' | 'comments'>): Promise<string> {
    const tracking = this.changeTracking.get(change.position.selectedText);
    if (!tracking || !tracking.isEnabled) {
      throw new Error('Change tracking not enabled for this document');
    }

    const changeId = this.generateId();
    const trackedChange: TrackedChange = {
      ...change,
      id: changeId,
      timestamp: new Date(),
      status: 'pending',
      comments: [],
      tags: []
    };

    tracking.changes.push(trackedChange);

    // Auto-accept from owners if configured
    if (tracking.settings.autoAcceptFromOwners) {
      trackedChange.status = 'accepted';
      trackedChange.reviewedAt = new Date();
    }

    return changeId;
  }

  /**
   * Accept or reject a change
   */
  public async processChange(
    documentId: string, 
    changeId: string, 
    action: 'accept' | 'reject',
    reviewerId: string
  ): Promise<void> {
    const tracking = this.changeTracking.get(documentId);
    if (!tracking) {
      throw new Error('Change tracking not found');
    }

    const change = tracking.changes.find(c => c.id === changeId);
    if (!change) {
      throw new Error('Change not found');
    }

    change.status = action === 'accept' ? 'accepted' : 'rejected';
    change.reviewedBy = reviewerId;
    change.reviewedAt = new Date();
  }

  /**
   * Create a new document version
   */
  public async createVersion(
    documentId: string,
    content: string,
    description: string,
    createdBy: string,
    isMajor: boolean = false
  ): Promise<DocumentVersion> {
    const existingVersions = this.versions.get(documentId) || [];
    const versionNumber = this.generateVersionNumber(existingVersions, isMajor);

    const version: DocumentVersion = {
      id: this.generateId(),
      versionNumber,
      description,
      createdBy,
      createdAt: new Date(),
      isMajor,
      parentVersion: existingVersions.length > 0 ? existingVersions[existingVersions.length - 1].id : undefined,
      wordCount: content.split(/\s+/).length,
      changeCount: 0,
      collaborators: [createdBy],
      tags: [],
      content,
      metadata: {
        author: createdBy,
        lastModified: new Date(),
        status: 'draft',
        comments: 0,
        suggestions: 0,
        approvals: 0
      }
    };

    existingVersions.push(version);
    this.versions.set(documentId, existingVersions);

    return version;
  }

  /**
   * Create a new branch
   */
  public async createBranch(
    documentId: string,
    name: string,
    description: string,
    parentBranch: string,
    createdBy: string,
    purpose: 'feature' | 'experiment' | 'backup' | 'alternative' = 'feature'
  ): Promise<DocumentBranch> {
    const existingBranches = this.branches.get(documentId) || [];

    const branch: DocumentBranch = {
      id: this.generateId(),
      name,
      description,
      parentBranch,
      createdBy,
      createdAt: new Date(),
      isActive: true,
      isMerged: false,
      versions: [],
      collaborators: [createdBy],
      purpose
    };

    existingBranches.push(branch);
    this.branches.set(documentId, existingBranches);

    return branch;
  }

  /**
   * Merge branches
   */
  public async mergeBranch(
    documentId: string,
    sourceBranch: string,
    targetBranch: string,
    strategy: 'auto' | 'manual' | 'theirs' | 'ours',
    mergedBy: string
  ): Promise<MergeRecord> {
    const mergeId = this.generateId();
    const now = new Date();

    // Simulate merge process (in real implementation, this would be more complex)
    const merge: MergeRecord = {
      id: mergeId,
      sourceBranch,
      targetBranch,
      mergedBy,
      mergedAt: now,
      strategy,
      conflicts: [], // Would be populated by actual merge logic
      resolution: 'Automatic merge completed successfully',
      success: true
    };

    // Update branch status
    const branches = this.branches.get(documentId) || [];
    const sourceBranchObj = branches.find(b => b.id === sourceBranch);
    if (sourceBranchObj) {
      sourceBranchObj.isMerged = true;
      sourceBranchObj.mergedAt = now;
    }

    return merge;
  }

  /**
   * Get document versions
   */
  public async getDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
    return this.versions.get(documentId) || [];
  }

  /**
   * Get document branches
   */
  public async getDocumentBranches(documentId: string): Promise<DocumentBranch[]> {
    return this.branches.get(documentId) || [];
  }

  /**
   * Get change tracking for document
   */
  public async getChangeTracking(documentId: string): Promise<ChangeTracking | null> {
    return this.changeTracking.get(documentId) || null;
  }

  /**
   * Get workflow templates
   */
  public getWorkflowTemplates(): Array<{
    id: string;
    name: string;
    description: string;
    stages: Omit<EditorialStage, 'id' | 'status' | 'startedAt' | 'completedAt' | 'approvals' | 'feedback'>[];
  }> {
    return [
      {
        id: 'standard',
        name: 'Standard Editorial Workflow',
        description: 'Basic workflow for most writing projects',
        stages: [
          {
            name: 'Draft',
            description: 'Initial writing phase',
            type: 'draft',
            order: 0,
            assignedTo: [],
            requiredRoles: ['member'],
            estimatedDuration: 720, // 30 days
            requirements: [
              {
                id: 'req-1',
                description: 'Complete first draft',
                type: 'wordcount',
                isRequired: true,
                status: 'pending'
              }
            ],
            deliverables: [
              {
                id: 'del-1',
                name: 'First Draft',
                description: 'Complete first draft of the manuscript',
                type: 'document',
                isRequired: true,
                status: 'pending',
                files: []
              }
            ],
            parentStage: undefined,
            childStages: [],
            isParallel: false,
            settings: {
              allowParallelEditing: true,
              autoAdvanceOnApproval: false,
              notifyOnStatusChange: true,
              requireAllApprovals: false,
              allowRollback: true,
              trackChanges: true,
              versionControl: true
            }
          },
          {
            name: 'Review',
            description: 'Content and structure review',
            type: 'review',
            order: 1,
            assignedTo: [],
            requiredRoles: ['editor', 'moderator'],
            estimatedDuration: 168, // 7 days
            requirements: [
              {
                id: 'req-2',
                description: 'Complete content review',
                type: 'approval',
                isRequired: true,
                status: 'pending'
              }
            ],
            deliverables: [
              {
                id: 'del-2',
                name: 'Review Report',
                description: 'Detailed review with feedback and recommendations',
                type: 'report',
                isRequired: true,
                status: 'pending',
                files: []
              }
            ],
            parentStage: undefined,
            childStages: [],
            isParallel: false,
            settings: {
              allowParallelEditing: false,
              autoAdvanceOnApproval: true,
              notifyOnStatusChange: true,
              requireAllApprovals: true,
              allowRollback: true,
              trackChanges: true,
              versionControl: true
            }
          },
          {
            name: 'Edit',
            description: 'Line editing and improvements',
            type: 'edit',
            order: 2,
            assignedTo: [],
            requiredRoles: ['editor', 'member'],
            estimatedDuration: 240, // 10 days
            requirements: [
              {
                id: 'req-3',
                description: 'Implement review feedback',
                type: 'completion',
                isRequired: true,
                status: 'pending'
              }
            ],
            deliverables: [
              {
                id: 'del-3',
                name: 'Edited Draft',
                description: 'Revised manuscript with edits applied',
                type: 'document',
                isRequired: true,
                status: 'pending',
                files: []
              }
            ],
            parentStage: undefined,
            childStages: [],
            isParallel: false,
            settings: {
              allowParallelEditing: false,
              autoAdvanceOnApproval: false,
              notifyOnStatusChange: true,
              requireAllApprovals: false,
              allowRollback: true,
              trackChanges: true,
              versionControl: true
            }
          },
          {
            name: 'Proofread',
            description: 'Final proofreading and polish',
            type: 'proofread',
            order: 3,
            assignedTo: [],
            requiredRoles: ['editor'],
            estimatedDuration: 72, // 3 days
            requirements: [
              {
                id: 'req-4',
                description: 'Complete proofreading',
                type: 'quality',
                isRequired: true,
                status: 'pending'
              }
            ],
            deliverables: [
              {
                id: 'del-4',
                name: 'Final Manuscript',
                description: 'Proofread and polished final version',
                type: 'document',
                isRequired: true,
                status: 'pending',
                files: []
              }
            ],
            parentStage: undefined,
            childStages: [],
            isParallel: false,
            settings: {
              allowParallelEditing: false,
              autoAdvanceOnApproval: true,
              notifyOnStatusChange: true,
              requireAllApprovals: true,
              allowRollback: false,
              trackChanges: true,
              versionControl: true
            }
          }
        ]
      },
      {
        id: 'agile',
        name: 'Agile Writing Workflow',
        description: 'Iterative workflow with sprints and regular reviews',
        stages: [
          {
            name: 'Sprint Planning',
            description: 'Plan writing sprint goals',
            type: 'draft',
            order: 0,
            assignedTo: [],
            requiredRoles: ['member'],
            estimatedDuration: 8, // 8 hours
            requirements: [],
            deliverables: [],
            parentStage: undefined,
            childStages: [],
            isParallel: false,
            settings: {
              allowParallelEditing: true,
              autoAdvanceOnApproval: false,
              notifyOnStatusChange: true,
              requireAllApprovals: false,
              allowRollback: true,
              trackChanges: false,
              versionControl: false
            }
          },
          {
            name: 'Sprint Execution',
            description: 'Write during sprint period',
            type: 'draft',
            order: 1,
            assignedTo: [],
            requiredRoles: ['member'],
            estimatedDuration: 168, // 1 week
            requirements: [],
            deliverables: [],
            parentStage: undefined,
            childStages: [],
            isParallel: true,
            settings: {
              allowParallelEditing: true,
              autoAdvanceOnApproval: false,
              notifyOnStatusChange: true,
              requireAllApprovals: false,
              allowRollback: true,
              trackChanges: true,
              versionControl: true
            }
          },
          {
            name: 'Sprint Review',
            description: 'Review and feedback session',
            type: 'review',
            order: 2,
            assignedTo: [],
            requiredRoles: ['editor', 'member'],
            estimatedDuration: 24, // 1 day
            requirements: [],
            deliverables: [],
            parentStage: undefined,
            childStages: [],
            isParallel: false,
            settings: {
              allowParallelEditing: false,
              autoAdvanceOnApproval: true,
              notifyOnStatusChange: true,
              requireAllApprovals: false,
              allowRollback: true,
              trackChanges: true,
              versionControl: true
            }
          }
        ]
      }
    ];
  }

  /**
   * Private helper methods
   */
  private getDefaultWorkflowSettings(): WorkflowSettings {
    return {
      autoAssignment: false,
      deadlineReminders: true,
      escalationRules: [],
      qualityGates: [],
      integrations: [],
      notifications: {
        stageStart: true,
        stageComplete: true,
        approvalRequired: true,
        deadlineApproaching: true,
        workflowComplete: true,
        escalations: true,
        customRules: []
      }
    };
  }

  private autoAssignStage(stage: EditorialStage): void {
    // Implementation would assign users based on roles and availability
    // This is a simplified version
  }

  private sendStageNotifications(
    workflow: EditorialWorkflow, 
    stage: EditorialStage, 
    type: string
  ): void {
    // Implementation would send actual notifications
    console.log(`Notification: ${type} for stage ${stage.name} in workflow ${workflow.name}`);
  }

  private getNextStage(workflow: EditorialWorkflow, currentStage: EditorialStage): EditorialStage | null {
    const currentIndex = workflow.stages.indexOf(currentStage);
    return workflow.stages[currentIndex + 1] || null;
  }

  private userHasRole(userId: string, role: any): boolean {
    // Implementation would check user roles
    return true; // Simplified
  }

  private updateWorkflowAnalytics(workflow: EditorialWorkflow): void {
    // Calculate analytics
    const completedStages = workflow.stages.filter(s => s.status === 'completed');
    const totalDuration = completedStages.reduce((sum, stage) => {
      if (stage.startedAt && stage.completedAt) {
        return sum + (stage.completedAt.getTime() - stage.startedAt.getTime());
      }
      return sum;
    }, 0);

    workflow.analytics.totalDuration = totalDuration;
    workflow.analytics.averageStageTime = completedStages.length > 0 
      ? totalDuration / completedStages.length 
      : 0;
  }

  private generateVersionNumber(existingVersions: DocumentVersion[], isMajor: boolean): string {
    if (existingVersions.length === 0) {
      return '1.0.0';
    }

    const lastVersion = existingVersions[existingVersions.length - 1];
    const [major, minor, patch] = lastVersion.versionNumber.split('.').map(Number);

    if (isMajor) {
      return `${major + 1}.0.0`;
    } else {
      return `${major}.${minor}.${patch + 1}`;
    }
  }

  private initializeWithMockData(): void {
    // Sample workflow
    const now = new Date();
    const workflow: EditorialWorkflow = {
      id: 'workflow-1',
      projectId: 'project-1',
      name: 'Novel Editing Workflow',
      description: 'Standard editorial workflow for novel manuscript',
      stages: [
        {
          id: 'stage-1',
          name: 'First Draft',
          description: 'Complete the initial draft',
          type: 'draft',
          order: 0,
          assignedTo: ['author-1'],
          requiredRoles: ['member'],
          deadline: new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)),
          estimatedDuration: 720,
          status: 'completed',
          startedAt: new Date(now.getTime() - (45 * 24 * 60 * 60 * 1000)),
          completedAt: new Date(now.getTime() - (15 * 24 * 60 * 60 * 1000)),
          requirements: [
            {
              id: 'req-1',
              description: 'Complete first draft of 80,000 words',
              type: 'wordcount',
              isRequired: true,
              status: 'met',
              verifiedBy: 'author-1',
              verifiedAt: new Date(now.getTime() - (15 * 24 * 60 * 60 * 1000))
            }
          ],
          deliverables: [
            {
              id: 'del-1',
              name: 'First Draft Manuscript',
              description: 'Complete first draft',
              type: 'document',
              isRequired: true,
              submittedBy: 'author-1',
              submittedAt: new Date(now.getTime() - (15 * 24 * 60 * 60 * 1000)),
              files: ['manuscript-v1.docx'],
              status: 'approved'
            }
          ],
          approvals: [
            {
              id: 'app-1',
              requiredFrom: 'author-1',
              status: 'approved',
              approvedBy: 'author-1',
              approvedAt: new Date(now.getTime() - (15 * 24 * 60 * 60 * 1000)),
              comments: 'First draft completed on schedule'
            }
          ],
          feedback: [],
          parentStage: undefined,
          childStages: [],
          isParallel: false,
          settings: {
            allowParallelEditing: true,
            autoAdvanceOnApproval: true,
            notifyOnStatusChange: true,
            requireAllApprovals: false,
            allowRollback: true,
            trackChanges: true,
            versionControl: true
          }
        },
        {
          id: 'stage-2',
          name: 'Content Review',
          description: 'Review structure and content',
          type: 'review',
          order: 1,
          assignedTo: ['editor-1'],
          requiredRoles: ['editor'],
          deadline: new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)),
          estimatedDuration: 168,
          status: 'in-progress',
          startedAt: new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000)),
          requirements: [
            {
              id: 'req-2',
              description: 'Complete content and structure review',
              type: 'approval',
              isRequired: true,
              status: 'pending'
            }
          ],
          deliverables: [
            {
              id: 'del-2',
              name: 'Review Report',
              description: 'Detailed content review',
              type: 'report',
              isRequired: true,
              status: 'pending',
              files: []
            }
          ],
          approvals: [
            {
              id: 'app-2',
              requiredFrom: 'editor-1',
              status: 'pending'
            }
          ],
          feedback: [
            {
              id: 'feedback-1',
              providedBy: 'editor-1',
              type: 'specific',
              content: 'Chapter 3 needs stronger character motivation. Consider adding backstory.',
              attachments: [],
              isPublic: true,
              timestamp: new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)),
              addressed: false
            }
          ],
          parentStage: undefined,
          childStages: [],
          isParallel: false,
          settings: {
            allowParallelEditing: false,
            autoAdvanceOnApproval: true,
            notifyOnStatusChange: true,
            requireAllApprovals: true,
            allowRollback: true,
            trackChanges: true,
            versionControl: true
          }
        }
      ],
      currentStage: 1,
      isActive: true,
      createdAt: new Date(now.getTime() - (45 * 24 * 60 * 60 * 1000)),
      updatedAt: new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)),
      settings: this.getDefaultWorkflowSettings(),
      analytics: {
        totalDuration: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
        averageStageTime: 30 * 24 * 60 * 60 * 1000,
        bottleneckStages: [],
        approvalTimes: { 'stage-1': 2 },
        reworkCycles: 0,
        qualityScores: { 'stage-1': 85 },
        participantContributions: { 'author-1': 95, 'editor-1': 60 },
        deadlineAdherence: 100
      }
    };

    this.workflows.set(workflow.id, workflow);

    // Sample change tracking
    const changeTracking: ChangeTracking = {
      id: 'tracking-1',
      documentId: 'doc-1',
      documentType: 'manuscript',
      isEnabled: true,
      changes: [
        {
          id: 'change-1',
          type: 'insert',
          authorId: 'editor-1',
          authorName: 'Sarah Editor',
          timestamp: new Date(now.getTime() - (24 * 60 * 60 * 1000)),
          position: {
            chapter: 1,
            paragraph: 3,
            startOffset: 150,
            endOffset: 150,
            selectedText: ''
          },
          newText: 'The storm clouds gathered ominously overhead, ',
          status: 'pending',
          comments: [
            {
              id: 'comment-1',
              authorId: 'author-1',
              content: 'Great addition! Sets the mood perfectly.',
              timestamp: new Date(now.getTime() - (12 * 60 * 60 * 1000)),
              type: 'approval'
            }
          ],
          tags: ['atmosphere', 'description']
        }
      ],
      versions: [],
      branches: [
        {
          id: 'main',
          name: 'main',
          description: 'Main manuscript branch',
          createdBy: 'author-1',
          createdAt: new Date(now.getTime() - (45 * 24 * 60 * 60 * 1000)),
          isActive: true,
          isMerged: false,
          versions: ['v1.0.0', 'v1.0.1'],
          collaborators: ['author-1', 'editor-1'],
          purpose: 'feature'
        }
      ],
      mergeHistory: [],
      settings: {
        autoAcceptFromOwners: false,
        requireApprovalForMajorChanges: true,
        maxChangesPerDocument: 1000,
        enableSuggestionMode: true,
        showChangeHistory: true,
        notifyOnChanges: true,
        retentionDays: 90
      }
    };

    this.changeTracking.set('doc-1', changeTracking);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

export const editorialWorkflowService = EditorialWorkflowService.getInstance();