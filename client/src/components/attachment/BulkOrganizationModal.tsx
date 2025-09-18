/**
 * Bulk Organization Modal
 * Advanced tool for organizing multiple notes with smart suggestions and migration options
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wand2, 
  Settings, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  BarChart3,
  ArrowRight,
  FolderOpen,
  Target,
  Clock,
  Filter,
  RefreshCw,
  Download,
  Upload,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { Progress } from '@/components/ui/Progress';
import { Slider } from '@/components/ui/Slider';
import { projectAttachmentService, type AttachmentSuggestion, type MigrationConfig, type BulkAttachmentOperation } from '@/services/projectAttachmentService';
import { quickNotesService, type QuickNote } from '@/services/quickNotesService';
import { projectService } from '@/services/projectService';
import type { Project } from '@/types/global';
import { cn } from '@/utils/cn';

interface BulkOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (results: BulkAttachmentOperation) => void;
  selectedNoteIds?: string[];
  initialMode?: 'smart' | 'manual' | 'rules';
}

type OrganizationStep = 'configure' | 'preview' | 'processing' | 'results';

interface OrganizationPreview {
  noteId: string;
  currentStatus: 'unattached' | 'attached';
  suggestedProjectId?: string;
  confidence?: number;
  reasons?: string[];
  action: 'attach' | 'skip' | 'migrate';
}

export function BulkOrganizationModal({
  isOpen,
  onClose,
  onComplete,
  selectedNoteIds = [],
  initialMode = 'smart'
}: BulkOrganizationModalProps) {
  const [currentStep, setCurrentStep] = useState<OrganizationStep>('configure');
  const [config, setConfig] = useState<MigrationConfig>({
    source: selectedNoteIds.length > 0 ? 'unattached' : 'unattached',
    strategy: initialMode,
    confidenceThreshold: 0.6,
    autoApply: false,
    preserveOriginal: true,
    targetProjects: [],
    excludeProjects: [],
    tagMappings: {}
  });
  
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [suggestions, setSuggestions] = useState<AttachmentSuggestion[]>([]);
  const [preview, setPreview] = useState<OrganizationPreview[]>([]);
  const [operation, setOperation] = useState<BulkAttachmentOperation | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, selectedNoteIds]);

  // Generate preview when config changes
  useEffect(() => {
    if (currentStep === 'preview') {
      generatePreview();
    }
  }, [config, currentStep]);

  const loadData = () => {
    const allNotes = quickNotesService.getAllQuickNotes();
    const allProjects = projectService.getAllProjects().filter(p => p.status !== 'deleted');
    
    setNotes(allNotes);
    setProjects(allProjects);
    
    // Set initial target notes based on selection or config
    if (selectedNoteIds.length > 0) {
      setConfig(prev => ({ ...prev, source: 'unattached' }));
    }
  };

  const generatePreview = async () => {
    const targetNotes = getTargetNotes();
    const allSuggestions = targetNotes.flatMap(note => 
      projectAttachmentService.generateAttachmentSuggestions(note.id)
    );
    
    setSuggestions(allSuggestions);
    
    const previewData: OrganizationPreview[] = targetNotes.map(note => {
      const noteSuggestions = allSuggestions.filter(s => s.noteId === note.id);
      const bestSuggestion = noteSuggestions.sort((a, b) => b.confidence - a.confidence)[0];
      
      return {
        noteId: note.id,
        currentStatus: note.projectId ? 'attached' : 'unattached',
        suggestedProjectId: bestSuggestion?.projectId,
        confidence: bestSuggestion?.confidence,
        reasons: bestSuggestion?.reasons,
        action: bestSuggestion && bestSuggestion.confidence >= config.confidenceThreshold 
          ? 'attach' 
          : 'skip'
      };
    });
    
    setPreview(previewData);
  };

  const getTargetNotes = (): QuickNote[] => {
    if (selectedNoteIds.length > 0) {
      return selectedNoteIds
        .map(id => quickNotesService.getQuickNoteById(id))
        .filter(Boolean) as QuickNote[];
    }
    
    switch (config.source) {
      case 'unattached':
        return notes.filter(note => !note.projectId);
      case 'all':
        return notes;
      case 'project':
        return notes.filter(note => 
          note.projectId && config.targetProjects.includes(note.projectId)
        );
      default:
        return [];
    }
  };

  const getPreviewStats = () => {
    const total = preview.length;
    const toAttach = preview.filter(p => p.action === 'attach').length;
    const toSkip = preview.filter(p => p.action === 'skip').length;
    const highConfidence = preview.filter(p => p.confidence && p.confidence >= 0.8).length;
    
    return { total, toAttach, toSkip, highConfidence };
  };

  const handleConfigChange = <K extends keyof MigrationConfig>(
    key: K, 
    value: MigrationConfig[K]
  ) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handlePreviewItemToggle = (noteId: string) => {
    setPreview(prev => prev.map(item => 
      item.noteId === noteId 
        ? { ...item, action: item.action === 'attach' ? 'skip' : 'attach' }
        : item
    ));
  };

  const handleStartProcessing = async () => {
    setCurrentStep('processing');
    setIsProcessing(true);
    
    try {
      const notesToProcess = preview
        .filter(item => item.action === 'attach')
        .map(item => item.noteId);
      
      const operation = await projectAttachmentService.performBulkOperation({
        type: 'organize',
        noteIds: notesToProcess
      });
      
      setOperation(operation);
      setCurrentStep('results');
      onComplete(operation);
    } catch (error) {
      console.error('Error processing bulk operation:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setCurrentStep('configure');
    setConfig({
      source: 'unattached',
      strategy: 'smart',
      confidenceThreshold: 0.6,
      autoApply: false,
      preserveOriginal: true,
      targetProjects: [],
      excludeProjects: [],
      tagMappings: {}
    });
    setPreview([]);
    setOperation(null);
    onClose();
  };

  const renderConfigureStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Organization Strategy</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              key: 'smart',
              title: 'Smart Analysis',
              description: 'AI-powered suggestions based on content, tags, and patterns',
              icon: <Wand2 className="h-5 w-5" />
            },
            {
              key: 'manual',
              title: 'Manual Review',
              description: 'Review and approve each suggestion individually',
              icon: <Settings className="h-5 w-5" />
            },
            {
              key: 'rules',
              title: 'Rule-Based',
              description: 'Apply predefined attachment rules automatically',
              icon: <Filter className="h-5 w-5" />
            }
          ].map(strategy => (
            <Card
              key={strategy.key}
              className={cn(
                'p-4 cursor-pointer border-2 transition-all',
                config.strategy === strategy.key
                  ? 'border-primary bg-accent/50'
                  : 'border-border hover:border-accent-foreground'
              )}
              onClick={() => handleConfigChange('strategy', strategy.key as any)}
            >
              <div className="flex items-start gap-3">
                <div className="text-primary">{strategy.icon}</div>
                <div>
                  <h4 className="font-medium">{strategy.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {strategy.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Source Selection</h3>
        <div className="space-y-3">
          {[
            { key: 'unattached', label: 'Unattached Notes Only', count: notes.filter(n => !n.projectId).length },
            { key: 'all', label: 'All Notes', count: notes.length },
            { key: 'project', label: 'Specific Projects', count: 0 }
          ].map(option => (
            <label
              key={option.key}
              className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent/30"
            >
              <input
                type="radio"
                checked={config.source === option.key}
                onChange={() => handleConfigChange('source', option.key as any)}
                className="w-4 h-4"
              />
              <div className="flex-1">
                <span className="font-medium">{option.label}</span>
                <span className="text-sm text-muted-foreground ml-2">
                  ({option.count} notes)
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Confidence Threshold</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium min-w-0">
              Minimum: {Math.round(config.confidenceThreshold * 100)}%
            </span>
            <div className="flex-1">
              <Slider
                value={[config.confidenceThreshold]}
                onValueChange={([value]) => handleConfigChange('confidenceThreshold', value)}
                min={0.1}
                max={1}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Only suggestions above this confidence level will be considered for automatic attachment
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={config.autoApply}
            onChange={(e) => handleConfigChange('autoApply', e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm">Auto-apply high confidence suggestions</span>
        </label>
      </div>
    </div>
  );

  const renderPreviewStep = () => {
    const stats = getPreviewStats();
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Preview Changes</h3>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Notes</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">To Attach</p>
                  <p className="text-2xl font-bold text-green-600">{stats.toAttach}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm text-muted-foreground">To Skip</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.toSkip}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-sm text-muted-foreground">High Confidence</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.highConfidence}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Preview List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {preview.map(item => {
            const note = notes.find(n => n.id === item.noteId);
            const project = projects.find(p => p.id === item.suggestedProjectId);
            
            if (!note) return null;
            
            return (
              <Card
                key={item.noteId}
                className={cn(
                  'p-4 transition-all',
                  item.action === 'attach' ? 'border-green-200 bg-green-50/50' : 'border-gray-200'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium truncate">{note.title}</h4>
                      {item.confidence && (
                        <Badge 
                          variant={item.confidence >= 0.8 ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {Math.round(item.confidence * 100)}%
                        </Badge>
                      )}
                    </div>
                    
                    {item.suggestedProjectId && project && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <ArrowRight className="h-4 w-4" />
                        <FolderOpen className="h-4 w-4" />
                        <span>{project.title}</span>
                      </div>
                    )}
                    
                    {item.reasons && item.reasons.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {item.reasons.slice(0, 2).join(', ')}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant={item.action === 'attach' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePreviewItemToggle(item.noteId)}
                      className="gap-2"
                    >
                      {item.action === 'attach' ? (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Attach
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4" />
                          Skip
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  const renderProcessingStep = () => (
    <div className="space-y-6 text-center">
      <div>
        <RefreshCw className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
        <h3 className="text-lg font-semibold mb-2">Organizing Notes</h3>
        <p className="text-muted-foreground">
          Processing attachment suggestions and updating note relationships...
        </p>
      </div>
      
      {operation && (
        <div className="space-y-4">
          <Progress value={operation.progress} className="w-full" />
          <p className="text-sm text-muted-foreground">
            {operation.progress}% complete
          </p>
        </div>
      )}
    </div>
  );

  const renderResultsStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Organization Complete</h3>
        <p className="text-muted-foreground">
          Successfully processed note attachments
        </p>
      </div>
      
      {operation && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{operation.results.successful}</p>
            <p className="text-sm text-muted-foreground">Attached</p>
          </Card>
          <Card className="p-4 text-center">
            <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-600">{operation.results.failed}</p>
            <p className="text-sm text-muted-foreground">Failed</p>
          </Card>
          <Card className="p-4 text-center">
            <Clock className="h-8 w-8 text-gray-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-600">{operation.results.skipped}</p>
            <p className="text-sm text-muted-foreground">Skipped</p>
          </Card>
        </div>
      )}
      
      {operation && operation.errors.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-red-600">Errors:</h4>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
            {operation.errors.map((error, index) => (
              <p key={index} className="text-sm text-red-700">{error}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="large">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Bulk Organization</h2>
            <p className="text-muted-foreground">
              Organize multiple notes with smart suggestions and automated attachment
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-4">
          {[
            { key: 'configure', label: 'Configure', icon: <Settings className="h-4 w-4" /> },
            { key: 'preview', label: 'Preview', icon: <BarChart3 className="h-4 w-4" /> },
            { key: 'processing', label: 'Processing', icon: <RefreshCw className="h-4 w-4" /> },
            { key: 'results', label: 'Results', icon: <CheckCircle className="h-4 w-4" /> }
          ].map((step, index) => (
            <div key={step.key} className="flex items-center gap-2">
              <div className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
                currentStep === step.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground'
              )}>
                {step.icon}
                {step.label}
              </div>
              {index < 3 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {currentStep === 'configure' && renderConfigureStep()}
          {currentStep === 'preview' && renderPreviewStep()}
          {currentStep === 'processing' && renderProcessingStep()}
          {currentStep === 'results' && renderResultsStep()}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {currentStep === 'configure' && 'Configure your organization preferences'}
            {currentStep === 'preview' && `${getPreviewStats().toAttach} notes will be attached`}
            {currentStep === 'processing' && 'Please wait while we process your notes'}
            {currentStep === 'results' && 'Organization completed successfully'}
          </div>
          
          <div className="flex items-center gap-3">
            {currentStep === 'configure' && (
              <>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => setCurrentStep('preview')}
                  className="gap-2"
                >
                  Generate Preview
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </>
            )}
            
            {currentStep === 'preview' && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep('configure')}
                >
                  Back
                </Button>
                <Button 
                  onClick={handleStartProcessing}
                  disabled={getPreviewStats().toAttach === 0}
                  className="gap-2"
                >
                  <Wand2 className="h-4 w-4" />
                  Start Organization
                </Button>
              </>
            )}
            
            {currentStep === 'results' && (
              <Button onClick={handleClose} className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Done
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}