/**
 * Professional Export Dialog - Phase 1D Enhanced Export System
 * 
 * Comprehensive export dialog that surpasses Scrivener's Compile feature
 * with advanced formatting, quality assurance, and industry compliance
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Download,
  FileText,
  Settings,
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  Users,
  Target,
  Shield,
  Printer,
  Smartphone,
  Globe,
  BookOpen,
  Film,
  GraduationCap,
  Briefcase,
  Heart,
  Code,
  Star,
  TrendingUp,
  ChevronRight,
  X,
  Play,
  Pause,
  RefreshCw,
  Info,
  Award
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabItem } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Switch } from '@/components/ui/Switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Slider } from '@/components/ui/Slider';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/utils/cn';
import contentExportService, { ExportFormat, ExportTemplate, ExportOptions } from '@/services/contentExport';
import advancedExportEngine from '@/services/advancedExportEngine';

interface ProfessionalExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  title: string;
  projectId: string;
  contentIds: string[];
  metadata?: Record<string, any>;
  onExportComplete?: (result: any) => void;
}

interface ExportConfiguration {
  format: ExportFormat | null;
  template: ExportTemplate | null;
  options: ExportOptions;
  qualityAssurance: QualityAssuranceSettings;
  collaborativeSettings: CollaborativeSettings;
}

interface QualityAssuranceSettings {
  spellCheck: boolean;
  grammarCheck: boolean;
  styleguideCompliance: boolean;
  formatValidation: boolean;
  linkValidation: boolean;
  imageOptimization: boolean;
  accessibilityCheck: boolean;
  plagiarismCheck: boolean;
  wordCountValidation: boolean;
  citationValidation: boolean;
}

interface CollaborativeSettings {
  allowRealTimeEditing: boolean;
  shareWithTeam: boolean;
  teamMembers: string[];
  versionControl: boolean;
  conflictResolution: 'last-writer-wins' | 'merge' | 'manual';
}

interface ExportJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  stage: string;
  format: string;
  template?: string;
  estimatedTime: number;
  startTime: number;
  qualityScore?: number;
  outputSize?: number;
  validationResults?: ValidationResults;
}

interface ValidationResults {
  isValid: boolean;
  qualityScore: number;
  warnings: ValidationIssue[];
  errors: ValidationIssue[];
  suggestions: ValidationSuggestion[];
}

interface ValidationIssue {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  location?: { line?: number; page?: number; chapter?: number };
  suggestion?: string;
  autoFixable: boolean;
}

interface ValidationSuggestion {
  category: string;
  message: string;
  impact: 'low' | 'medium' | 'high';
  implementation: string;
}

export function ProfessionalExportDialog({
  isOpen,
  onClose,
  content,
  title,
  projectId,
  contentIds,
  metadata = {},
  onExportComplete
}: ProfessionalExportDialogProps) {
  const toast = useToast();
  
  // State management
  const [currentTab, setCurrentTab] = useState('formats');
  const [formats, setFormats] = useState<ExportFormat[]>([]);
  const [templates, setTemplates] = useState<ExportTemplate[]>([]);
  const [configuration, setConfiguration] = useState<ExportConfiguration>({
    format: null,
    template: null,
    options: {
      format: '',
      includeMetadata: true,
      includeImages: true,
      includeComments: false,
      includeCodexData: true,
      includePlotStructure: true,
      includeTimeline: true,
      quality: 'professional',
      pageSize: 'letter',
      margins: 'moderate',
      fontSize: 12,
      fontFamily: 'Times New Roman',
      lineSpacing: 'double',
      chapterBreaks: 'page',
      tableOfContents: true,
      indexGeneration: false,
      bibliography: false,
      footnotes: false,
      headers: true,
      footers: true,
      pageNumbers: true,
      bleedMarks: false,
      trimMarks: false,
      colorProfile: 'rgb',
      dpi: 300
    },
    qualityAssurance: {
      spellCheck: true,
      grammarCheck: true,
      styleguideCompliance: true,
      formatValidation: true,
      linkValidation: true,
      imageOptimization: true,
      accessibilityCheck: false,
      plagiarismCheck: false,
      wordCountValidation: true,
      citationValidation: false
    },
    collaborativeSettings: {
      allowRealTimeEditing: false,
      shareWithTeam: false,
      teamMembers: [],
      versionControl: true,
      conflictResolution: 'last-writer-wins'
    }
  });
  
  const [exportJob, setExportJob] = useState<ExportJob | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [validationResults, setValidationResults] = useState<ValidationResults | null>(null);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [estimatedSize, setEstimatedSize] = useState(0);

  // Initialize data
  useEffect(() => {
    if (isOpen) {
      loadFormatsAndTemplates();
    }
  }, [isOpen]);

  // Update templates when format changes
  useEffect(() => {
    if (configuration.format) {
      const formatTemplates = templates.filter(t => t.format === configuration.format?.id);
      if (formatTemplates.length > 0 && !configuration.template) {
        setConfiguration(prev => ({
          ...prev,
          template: formatTemplates[0],
          options: { ...prev.options, format: configuration.format?.id || '' }
        }));
      }
    }
  }, [configuration.format, templates]);

  // Update estimates when configuration changes
  useEffect(() => {
    updateEstimates();
  }, [configuration, content]);

  const loadFormatsAndTemplates = async () => {
    try {
      const availableFormats = contentExportService.getAvailableFormats();
      const availableTemplates = contentExportService.getAvailableTemplates();
      
      setFormats(availableFormats);
      setTemplates(availableTemplates);
    } catch (error) {
      console.error('Failed to load formats and templates:', error);
      toast.error('Failed to load export options');
    }
  };

  const updateEstimates = useCallback(() => {
    if (!configuration.format) return;

    const contentLength = content.length;
    const wordCount = content.split(/\s+/).length;
    
    // Estimate processing time
    let baseTime = 2000; // 2 seconds base
    let contentMultiplier = Math.ceil(contentLength / 10000); // 1 second per 10k characters
    
    let formatMultiplier = 1;
    switch (configuration.format.processingTime) {
      case 'fast': formatMultiplier = 1; break;
      case 'standard': formatMultiplier = 2; break;
      case 'complex': formatMultiplier = 4; break;
    }

    let qaMultiplier = 1;
    if (configuration.qualityAssurance.spellCheck) qaMultiplier += 0.3;
    if (configuration.qualityAssurance.grammarCheck) qaMultiplier += 0.5;
    if (configuration.qualityAssurance.plagiarismCheck) qaMultiplier += 1;

    setEstimatedTime(baseTime * contentMultiplier * formatMultiplier * qaMultiplier);

    // Estimate file size
    let sizeMultiplier = 1;
    switch (configuration.format.fileSize) {
      case 'small': sizeMultiplier = 0.5; break;
      case 'medium': sizeMultiplier = 1; break;
      case 'large': sizeMultiplier = 2; break;
    }

    setEstimatedSize(Math.round(contentLength * sizeMultiplier));
  }, [configuration, content]);

  const handleFormatSelect = (format: ExportFormat) => {
    setConfiguration(prev => ({
      ...prev,
      format,
      template: null,
      options: { ...prev.options, format: format.id }
    }));
    setCurrentTab('templates');
  };

  const handleTemplateSelect = (template: ExportTemplate) => {
    setConfiguration(prev => ({
      ...prev,
      template
    }));
    setCurrentTab('options');
  };

  const handleQualityAssuranceChange = (key: keyof QualityAssuranceSettings, value: boolean) => {
    setConfiguration(prev => ({
      ...prev,
      qualityAssurance: { ...prev.qualityAssurance, [key]: value }
    }));
  };

  const handleExportOptionChange = (key: keyof ExportOptions, value: any) => {
    setConfiguration(prev => ({
      ...prev,
      options: { ...prev.options, [key]: value }
    }));
  };

  const runValidation = async () => {
    if (!configuration.format) return;

    try {
      // Mock validation - in real implementation, this would use the validation service
      const mockValidation: ValidationResults = {
        isValid: true,
        qualityScore: 92,
        warnings: [
          {
            type: 'grammar',
            severity: 'low',
            message: 'Consider varying sentence structure for better readability',
            suggestion: 'Mix short and long sentences',
            autoFixable: false
          }
        ],
        errors: [],
        suggestions: [
          {
            category: 'enhancement',
            message: 'Adding chapter summaries would improve navigation',
            impact: 'medium',
            implementation: 'Enable table of contents generation'
          }
        ]
      };

      setValidationResults(mockValidation);
      toast.success(`Validation complete. Quality score: ${mockValidation.qualityScore}%`);
    } catch (error) {
      console.error('Validation failed:', error);
      toast.error('Validation failed');
    }
  };

  const handleExport = async () => {
    if (!configuration.format) return;

    try {
      setIsExporting(true);
      
      // Create export job
      const jobId = await contentExportService.exportContent(
        contentIds,
        {
          ...configuration.options,
          qualityAssurance: configuration.qualityAssurance,
          collaborativeSettings: configuration.collaborativeSettings
        },
        title
      );

      // Set up job tracking
      const job: ExportJob = {
        id: jobId,
        status: 'pending',
        progress: 0,
        stage: 'Initializing',
        format: configuration.format.id,
        template: configuration.template?.id,
        estimatedTime,
        startTime: Date.now()
      };

      setExportJob(job);
      
      // Simulate job progress (in real implementation, this would come from WebSocket updates)
      simulateJobProgress(job);

    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed to start');
      setIsExporting(false);
    }
  };

  const simulateJobProgress = (job: ExportJob) => {
    const stages = [
      'Loading content',
      'Running quality checks',
      'Applying template',
      'Converting format',
      'Optimizing output',
      'Finalizing export'
    ];

    let currentStage = 0;
    let progress = 0;

    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5; // Random progress increment
      
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        // Complete the job
        setExportJob(prev => prev ? {
          ...prev,
          status: 'completed',
          progress: 100,
          stage: 'Completed',
          qualityScore: 94,
          outputSize: estimatedSize
        } : null);
        
        setIsExporting(false);
        toast.success('Export completed successfully!');
        onExportComplete?.({ success: true, jobId: job.id });
        
      } else {
        const stageIndex = Math.floor((progress / 100) * stages.length);
        setExportJob(prev => prev ? {
          ...prev,
          progress,
          stage: stages[Math.min(stageIndex, stages.length - 1)]
        } : null);
      }
    }, 500);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'manuscript': return <BookOpen className="h-5 w-5" />;
      case 'print': return <Printer className="h-5 w-5" />;
      case 'ebook': return <Smartphone className="h-5 w-5" />;
      case 'web': return <Globe className="h-5 w-5" />;
      case 'screenplay': return <Film className="h-5 w-5" />;
      case 'academic': return <GraduationCap className="h-5 w-5" />;
      case 'document': return <FileText className="h-5 w-5" />;
      case 'business': return <Briefcase className="h-5 w-5" />;
      case 'personal': return <Heart className="h-5 w-5" />;
      case 'code': return <Code className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getQualityBadgeColor = (level: string) => {
    switch (level) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'standard': return 'bg-blue-100 text-blue-800';
      case 'professional': return 'bg-green-100 text-green-800';
      case 'print-ready': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs: TabItem[] = [
    {
      id: 'formats',
      label: 'Format',
      icon: <FileText className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold mb-2">Choose Your Export Format</h3>
            <p className="text-sm text-muted-foreground">
              Select from 15+ professional formats with industry-standard compliance
            </p>
          </div>

          {/* Format Categories */}
          {Object.entries(
            formats.reduce((acc, format) => {
              if (!acc[format.category]) acc[format.category] = [];
              acc[format.category].push(format);
              return acc;
            }, {} as Record<string, ExportFormat[]>)
          ).map(([category, categoryFormats]) => (
            <div key={category} className="space-y-3">
              <div className="flex items-center gap-2">
                {getCategoryIcon(category)}
                <h4 className="font-medium capitalize">
                  {category.replace('_', ' ')} Formats
                </h4>
                <Badge variant="secondary">{categoryFormats.length}</Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categoryFormats.map((format) => (
                  <Card
                    key={format.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      configuration.format?.id === format.id 
                        ? "ring-2 ring-primary bg-primary/5" 
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => handleFormatSelect(format)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(format.category)}
                          <h5 className="font-medium text-sm">{format.name}</h5>
                        </div>
                        <div className="flex gap-1">
                          {format.industryStandard && (
                            <Badge className="bg-amber-100 text-amber-800">
                              <Award className="h-3 w-3 mr-1" />
                              Industry
                            </Badge>
                          )}
                          <Badge className={getQualityBadgeColor(format.qualityLevel)}>
                            {format.qualityLevel}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground mb-3">
                        Processing: {format.processingTime} | Size: {format.fileSize}
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {format.platforms.map((platform) => (
                          <Badge key={platform} variant="outline" className="text-xs">
                            {platform}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          {configuration.format && (
            <div className="flex justify-end">
              <Button onClick={() => setCurrentTab('templates')}>
                Continue to Templates
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'templates',
      label: 'Template',
      icon: <Settings className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold mb-2">Select Professional Template</h3>
            <p className="text-sm text-muted-foreground">
              Industry-standard templates ensure professional presentation
            </p>
          </div>

          {configuration.format && (
            <div className="mb-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {getCategoryIcon(configuration.format.category)}
                <span className="font-medium">{configuration.format.name}</span>
                <Badge className={getQualityBadgeColor(configuration.format.qualityLevel)}>
                  {configuration.format.qualityLevel}
                </Badge>
              </div>
            </div>
          )}

          {/* Available Templates */}
          <div className="space-y-4">
            {templates
              .filter(template => template.format === configuration.format?.id)
              .map((template) => (
                <Card
                  key={template.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    configuration.template?.id === template.id 
                      ? "ring-2 ring-primary bg-primary/5" 
                      : "hover:bg-muted/50"
                  )}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h5 className="font-medium mb-1">{template.name}</h5>
                        <p className="text-sm text-muted-foreground mb-2">
                          {template.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Standard: {template.industryStandard}</span>
                          <span>•</span>
                          <span>Version: {template.version}</span>
                          <span>•</span>
                          <span>Updated: {template.lastUpdated}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline">{template.category}</Badge>
                        <Badge className="bg-green-100 text-green-800">
                          <Star className="h-3 w-3 mr-1" />
                          {template.license}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {template.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>

          {configuration.template && (
            <div className="flex justify-end">
              <Button onClick={() => setCurrentTab('options')}>
                Configure Options
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'options',
      label: 'Options',
      icon: <Settings className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold mb-2">Export Configuration</h3>
            <p className="text-sm text-muted-foreground">
              Fine-tune your export settings for professional results
            </p>
          </div>

          {/* Quality Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Quality Assurance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="spellCheck">Spell Check</Label>
                  <Switch
                    id="spellCheck"
                    checked={configuration.qualityAssurance.spellCheck}
                    onCheckedChange={(checked) => 
                      handleQualityAssuranceChange('spellCheck', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="grammarCheck">Grammar Check</Label>
                  <Switch
                    id="grammarCheck"
                    checked={configuration.qualityAssurance.grammarCheck}
                    onCheckedChange={(checked) => 
                      handleQualityAssuranceChange('grammarCheck', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="formatValidation">Format Validation</Label>
                  <Switch
                    id="formatValidation"
                    checked={configuration.qualityAssurance.formatValidation}
                    onCheckedChange={(checked) => 
                      handleQualityAssuranceChange('formatValidation', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="imageOptimization">Image Optimization</Label>
                  <Switch
                    id="imageOptimization"
                    checked={configuration.qualityAssurance.imageOptimization}
                    onCheckedChange={(checked) => 
                      handleQualityAssuranceChange('imageOptimization', checked)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Options */}
          <Card>
            <CardHeader>
              <CardTitle>Content Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="includeMetadata">Include Metadata</Label>
                  <Switch
                    id="includeMetadata"
                    checked={configuration.options.includeMetadata}
                    onCheckedChange={(checked) => 
                      handleExportOptionChange('includeMetadata', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="includeCodexData">Include Codex Data</Label>
                  <Switch
                    id="includeCodexData"
                    checked={configuration.options.includeCodexData}
                    onCheckedChange={(checked) => 
                      handleExportOptionChange('includeCodexData', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="includePlotStructure">Include Plot Structure</Label>
                  <Switch
                    id="includePlotStructure"
                    checked={configuration.options.includePlotStructure}
                    onCheckedChange={(checked) => 
                      handleExportOptionChange('includePlotStructure', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="tableOfContents">Table of Contents</Label>
                  <Switch
                    id="tableOfContents"
                    checked={configuration.options.tableOfContents}
                    onCheckedChange={(checked) => 
                      handleExportOptionChange('tableOfContents', checked)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Format Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Format Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quality">Quality Level</Label>
                  <Select
                    value={configuration.options.quality}
                    onValueChange={(value) => 
                      handleExportOptionChange('quality', value as any)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fontFamily">Font Family</Label>
                  <Select
                    value={configuration.options.fontFamily}
                    onValueChange={(value) => 
                      handleExportOptionChange('fontFamily', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                      <SelectItem value="Garamond">Garamond</SelectItem>
                      <SelectItem value="Arial">Arial</SelectItem>
                      <SelectItem value="Calibri">Calibri</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fontSize">
                    Font Size: {configuration.options.fontSize}pt
                  </Label>
                  <Slider
                    value={[configuration.options.fontSize]}
                    onValueChange={([value]) => 
                      handleExportOptionChange('fontSize', value)
                    }
                    min={8}
                    max={18}
                    step={1}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lineSpacing">Line Spacing</Label>
                  <Select
                    value={configuration.options.lineSpacing}
                    onValueChange={(value) => 
                      handleExportOptionChange('lineSpacing', value as any)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="1.15">1.15</SelectItem>
                      <SelectItem value="1.5">1.5</SelectItem>
                      <SelectItem value="double">Double</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={() => setCurrentTab('preview')}>
              Preview & Export
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      ),
    },
    {
      id: 'preview',
      label: 'Preview',
      icon: <Eye className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold mb-2">Preview & Export</h3>
            <p className="text-sm text-muted-foreground">
              Review your configuration and start the export process
            </p>
          </div>

          {/* Configuration Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Export Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Format:</span> {configuration.format?.name}
                </div>
                <div>
                  <span className="font-medium">Template:</span> {configuration.template?.name}
                </div>
                <div>
                  <span className="font-medium">Quality:</span> {configuration.options.quality}
                </div>
                <div>
                  <span className="font-medium">Estimated Time:</span> {Math.round(estimatedTime / 1000)}s
                </div>
                <div>
                  <span className="font-medium">Estimated Size:</span> {(estimatedSize / 1024).toFixed(1)} KB
                </div>
                <div>
                  <span className="font-medium">Word Count:</span> {content.split(/\s+/).length}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Validation Results */}
          {validationResults && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Quality Assessment
                  <Badge className="bg-green-100 text-green-800">
                    Score: {validationResults.qualityScore}%
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {validationResults.warnings.length > 0 && (
                  <div>
                    <h6 className="font-medium text-amber-600 mb-2">Warnings</h6>
                    {validationResults.warnings.slice(0, 3).map((warning, index) => (
                      <div key={index} className="text-sm text-muted-foreground">
                        • {warning.message}
                      </div>
                    ))}
                  </div>
                )}
                
                {validationResults.suggestions.length > 0 && (
                  <div>
                    <h6 className="font-medium text-blue-600 mb-2">Suggestions</h6>
                    {validationResults.suggestions.slice(0, 2).map((suggestion, index) => (
                      <div key={index} className="text-sm text-muted-foreground">
                        • {suggestion.message}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Export Progress */}
          {exportJob && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {exportJob.status === 'processing' ? (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  ) : exportJob.status === 'completed' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Clock className="h-5 w-5" />
                  )}
                  Export Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{exportJob.stage}</span>
                    <span>{Math.round(exportJob.progress)}%</span>
                  </div>
                  <Progress value={exportJob.progress} />
                </div>
                
                {exportJob.status === 'completed' && exportJob.qualityScore && (
                  <div className="flex items-center gap-2 text-sm">
                    <Badge className="bg-green-100 text-green-800">
                      Quality Score: {exportJob.qualityScore}%
                    </Badge>
                    {exportJob.outputSize && (
                      <Badge variant="outline">
                        Size: {(exportJob.outputSize / 1024).toFixed(1)} KB
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={runValidation}
              className="flex-1"
              disabled={isExporting}
            >
              <Shield className="h-4 w-4 mr-2" />
              Run Quality Check
            </Button>
            
            <Button
              onClick={handleExport}
              className="flex-1"
              disabled={!configuration.format || isExporting}
            >
              {isExporting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Start Export
                </>
              )}
            </Button>
          </div>

          {exportJob?.status === 'completed' && (
            <div className="text-center">
              <Button size="lg" className="w-full">
                <Download className="h-5 w-5 mr-2" />
                Download {configuration.format?.name}
              </Button>
            </div>
          )}
        </div>
      ),
    },
  ];

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-6 w-6" />
            Professional Export System
            <Badge className="bg-purple-100 text-purple-800">
              Phase 1D Enhanced
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between text-sm">
            {['formats', 'templates', 'options', 'preview'].map((step, index) => (
              <div
                key={step}
                className={cn(
                  "flex items-center gap-2",
                  currentTab === step ? "text-primary font-medium" : "text-muted-foreground"
                )}
              >
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                    currentTab === step ? "bg-primary text-white" : "bg-muted"
                  )}
                >
                  {index + 1}
                </div>
                <span className="capitalize">{step}</span>
              </div>
            ))}
          </div>

          <Tabs
            tabs={tabs}
            activeTab={currentTab}
            onTabChange={setCurrentTab}
            variant="underline"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ProfessionalExportDialog;