/**
 * Import Wizard Component
 * Advanced multi-step import process with structure mapping and preview
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Upload,
  FileText,
  Eye,
  Settings,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Download,
  Loader2,
  User,
  MapPin,
  Package,
  BookOpen,
  Clock,
  BarChart3,
  RefreshCw,
  X,
  Check,
  Plus,
  Trash2,
  Edit3
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { Select } from '@/components/ui/Select';
import { Tabs, TabItem } from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/utils/cn';
import { 
  importExportService, 
  ImportResult, 
  StructureAnalysis,
  ImportSuggestion,
  ImportStatistics 
} from '@/services/importExportService';
import { 
  documentParserService, 
  DocumentStructure, 
  ImportOptions 
} from '@/services/documentParserService';
import { 
  entityExtractionService, 
  EntityExtractionOptions, 
  CodexEntry 
} from '@/services/entityExtractionService';

interface ImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (result: ImportResult) => void;
  projectId?: string;
  className?: string;
}

interface ImportStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ComponentType<any>;
}

interface FileUploadState {
  file: File | null;
  format: string | null;
  confidence: number;
  processing: boolean;
  error?: string;
}

interface DocumentPreview {
  structure: DocumentStructure | null;
  entities: CodexEntry[];
  analysis: StructureAnalysis | null;
  suggestions: ImportSuggestion[];
  statistics: ImportStatistics | null;
}

interface MappingConfig {
  preserveFormatting: boolean;
  extractEntities: boolean;
  detectStructure: boolean;
  includeComments: boolean;
  includeRevisions: boolean;
  mergeTextNodes: boolean;
  entityTypes: string[];
  confidenceThreshold: number;
  contextWindow: number;
  customRules: StructureRule[];
}

interface StructureRule {
  id: string;
  pattern: string;
  type: 'act' | 'chapter' | 'scene' | 'section';
  level: number;
  enabled: boolean;
}

const defaultMappingConfig: MappingConfig = {
  preserveFormatting: true,
  extractEntities: true,
  detectStructure: true,
  includeComments: true,
  includeRevisions: false,
  mergeTextNodes: true,
  entityTypes: ['character', 'location', 'organization', 'item', 'concept', 'event'],
  confidenceThreshold: 0.6,
  contextWindow: 100,
  customRules: [
    {
      id: '1',
      pattern: '^CHAPTER\\s+([IVX]+|\\d+)',
      type: 'chapter',
      level: 1,
      enabled: true
    },
    {
      id: '2',
      pattern: '^SCENE\\s+([IVX]+|\\d+)',
      type: 'scene',
      level: 2,
      enabled: true
    }
  ]
};

export function ImportWizard({
  isOpen,
  onClose,
  onImportComplete,
  projectId,
  className
}: ImportWizardProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [fileState, setFileState] = useState<FileUploadState>({
    file: null,
    format: null,
    confidence: 0,
    processing: false
  });
  const [preview, setPreview] = useState<DocumentPreview>({
    structure: null,
    entities: [],
    analysis: null,
    suggestions: [],
    statistics: null
  });
  const [mappingConfig, setMappingConfig] = useState<MappingConfig>(defaultMappingConfig);
  const [finalResult, setFinalResult] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const steps: ImportStep[] = [
    {
      id: 'upload',
      title: 'File Upload',
      description: 'Select and upload your document',
      icon: <Upload className="h-5 w-5" />,
      component: FileUploadStep
    },
    {
      id: 'preview',
      title: 'Document Preview',
      description: 'Review the detected structure and content',
      icon: <Eye className="h-5 w-5" />,
      component: DocumentPreviewStep
    },
    {
      id: 'mapping',
      title: 'Structure Mapping',
      description: 'Configure import settings and structure rules',
      icon: <Settings className="h-5 w-5" />,
      component: StructureMappingStep
    },
    {
      id: 'complete',
      title: 'Import Complete',
      description: 'Review results and finish import',
      icon: <CheckCircle className="h-5 w-5" />,
      component: ImportCompleteStep
    }
  ];

  // Reset wizard state when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setFileState({
        file: null,
        format: null,
        confidence: 0,
        processing: false
      });
      setPreview({
        structure: null,
        entities: [],
        analysis: null,
        suggestions: [],
        statistics: null
      });
      setMappingConfig(defaultMappingConfig);
      setFinalResult(null);
      setIsImporting(false);
    }
  }, [isOpen]);

  const handleFileUpload = useCallback(async (file: File) => {
    setFileState(prev => ({ ...prev, file, processing: true, error: undefined }));

    try {
      // Detect format
      const formatResult = await documentParserService.detectFormat(file);
      setFileState(prev => ({ 
        ...prev, 
        format: formatResult.format, 
        confidence: formatResult.confidence,
        processing: false 
      }));

      // Auto-advance if format detection is confident
      if (formatResult.confidence > 0.8) {
        setTimeout(() => processDocument(file), 500);
      }
    } catch (error) {
      setFileState(prev => ({ 
        ...prev, 
        processing: false, 
        error: error.message 
      }));
      toast.error('Failed to analyze file');
    }
  }, []);

  const processDocument = useCallback(async (file: File) => {
    if (!file) return;

    setFileState(prev => ({ ...prev, processing: true }));

    try {
      // Parse document structure
      const importOptions: ImportOptions = {
        preserveFormatting: mappingConfig.preserveFormatting,
        extractEntities: mappingConfig.extractEntities,
        detectStructure: mappingConfig.detectStructure,
        includeComments: mappingConfig.includeComments,
        includeRevisions: mappingConfig.includeRevisions,
        mergeTextNodes: mappingConfig.mergeTextNodes
      };

      const documentStructure = await documentParserService.parseDocument(file, importOptions);

      // Extract entities
      let entities: CodexEntry[] = [];
      if (mappingConfig.extractEntities) {
        const entityOptions: EntityExtractionOptions = {
          enabledTypes: mappingConfig.entityTypes as any[],
          confidenceThreshold: mappingConfig.confidenceThreshold,
          contextWindow: mappingConfig.contextWindow,
          useAdvancedNLP: false,
          excludeCommonWords: true,
          groupSimilarEntities: true,
          extractRelationships: true
        };

        const entityResult = await entityExtractionService.extractEntities(
          documentStructure.content,
          entityOptions
        );
        entities = entityResult.entities;
      }

      // Analyze structure
      const analysis = analyzeDocumentStructure(documentStructure);
      const suggestions = generateImportSuggestions(documentStructure, entities);

      const statistics: ImportStatistics = {
        processingTime: 0, // Will be calculated during actual import
        entitiesExtracted: entities.length,
        structureElementsFound: documentStructure.content.length,
        formattingPreserved: documentStructure.formatting ? 1 : 0,
        confidence: fileState.confidence
      };

      setPreview({
        structure: documentStructure,
        entities,
        analysis,
        suggestions,
        statistics
      });

      setFileState(prev => ({ ...prev, processing: false }));
      
      // Auto-advance to preview step
      setCurrentStep(1);
      
    } catch (error) {
      setFileState(prev => ({ 
        ...prev, 
        processing: false, 
        error: error.message 
      }));
      toast.error('Failed to process document');
    }
  }, [mappingConfig, fileState.confidence]);

  const performImport = useCallback(async () => {
    if (!fileState.file) return;

    setIsImporting(true);

    try {
      const importOptions: Partial<ImportOptions> = {
        preserveFormatting: mappingConfig.preserveFormatting,
        extractEntities: mappingConfig.extractEntities,
        detectStructure: mappingConfig.detectStructure,
        includeComments: mappingConfig.includeComments,
        includeRevisions: mappingConfig.includeRevisions,
        mergeTextNodes: mappingConfig.mergeTextNodes
      };

      const entityOptions: Partial<EntityExtractionOptions> = {
        enabledTypes: mappingConfig.entityTypes as any[],
        confidenceThreshold: mappingConfig.confidenceThreshold,
        contextWindow: mappingConfig.contextWindow,
        excludeCommonWords: true,
        groupSimilarEntities: true,
        extractRelationships: true
      };

      const result = await importExportService.importProject(
        fileState.file,
        fileState.format || undefined,
        importOptions,
        entityOptions
      );

      setFinalResult(result);
      setIsImporting(false);

      if (result.success) {
        setCurrentStep(3);
        toast.success('Document imported successfully!');
      } else {
        toast.error('Import failed: ' + (result.errors?.[0] || 'Unknown error'));
      }
    } catch (error) {
      setIsImporting(false);
      toast.error('Import failed: ' + error.message);
    }
  }, [fileState.file, fileState.format, mappingConfig]);

  const canGoNext = () => {
    switch (currentStep) {
      case 0:
        return fileState.file && fileState.format && !fileState.processing;
      case 1:
        return preview.structure !== null;
      case 2:
        return true;
      case 3:
        return finalResult?.success;
      default:
        return false;
    }
  };

  const canGoPrevious = () => {
    return currentStep > 0 && !isImporting;
  };

  const handleNext = () => {
    if (!canGoNext()) return;

    if (currentStep === 2) {
      // Perform import
      performImport();
    } else {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrevious = () => {
    if (!canGoPrevious()) return;
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleComplete = () => {
    if (finalResult?.success) {
      onImportComplete(finalResult);
      onClose();
    }
  };

  // Helper functions
  const analyzeDocumentStructure = (structure: DocumentStructure): StructureAnalysis => {
    const content = structure.content;
    const totalWords = content.reduce((sum, node) => sum + (node.content.split(/\s+/).length || 0), 0);
    const totalCharacters = content.reduce((sum, node) => sum + node.content.length, 0);
    
    const chapters = content.filter(node => 
      node.type === 'chapter' || 
      (node.type === 'heading' && node.level && node.level <= 2)
    ).length;
    
    const scenes = content.filter(node => 
      node.type === 'scene' || 
      (node.type === 'heading' && node.level && node.level <= 4)
    ).length;
    
    const readingTime = Math.ceil(totalWords / 250);
    
    let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
    if (chapters > 10 || scenes > 50 || totalWords > 100000) {
      complexity = 'complex';
    } else if (chapters > 3 || scenes > 15 || totalWords > 25000) {
      complexity = 'moderate';
    }
    
    const suggestions = [];
    if (chapters === 0) {
      suggestions.push('Consider adding chapter breaks to improve structure');
    }
    if (totalWords < 1000) {
      suggestions.push('Document appears to be quite short');
    }
    
    return {
      totalWords,
      totalCharacters,
      chapters,
      scenes,
      readingTime,
      complexity,
      suggestions
    };
  };

  const generateImportSuggestions = (
    structure: DocumentStructure,
    entities: CodexEntry[]
  ): ImportSuggestion[] => {
    const suggestions: ImportSuggestion[] = [];
    
    if (structure.structure.chapters && structure.structure.chapters.length === 0) {
      suggestions.push({
        type: 'structure',
        priority: 'medium',
        description: 'No clear chapter structure detected',
        action: 'Consider manually organizing content into chapters'
      });
    }
    
    const characterCount = entities.filter(e => e.type === 'character').length;
    if (characterCount === 0) {
      suggestions.push({
        type: 'entity',
        priority: 'low',
        description: 'No characters detected',
        action: 'Review document for character names that may have been missed'
      });
    }
    
    return suggestions;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={cn(
        "bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden",
        className
      )}>
        {/* Header */}
        <div className="border-b p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Import Document</h2>
              <p className="text-gray-600 mt-1">
                Import your document with advanced structure detection and entity extraction
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center mt-6 space-x-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                  index <= currentStep
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "border-gray-300 text-gray-500"
                )}>
                  {index < currentStep ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    step.icon
                  )}
                </div>
                <div className="ml-3">
                  <p className={cn(
                    "text-sm font-medium",
                    index <= currentStep ? "text-gray-900" : "text-gray-500"
                  )}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={cn(
                    "ml-4 w-12 h-0.5 transition-colors",
                    index < currentStep ? "bg-blue-600" : "bg-gray-300"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 min-h-96 max-h-96 overflow-y-auto">
          {React.createElement(steps[currentStep].component, {
            fileState,
            preview,
            mappingConfig,
            finalResult,
            isImporting,
            onFileUpload: handleFileUpload,
            onProcessDocument: processDocument,
            onConfigChange: setMappingConfig,
            fileInputRef
          })}
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={!canGoPrevious()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-3">
              {currentStep === steps.length - 1 ? (
                <Button
                  onClick={handleComplete}
                  disabled={!finalResult?.success}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Complete Import
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={!canGoNext() || isImporting}
                  className="flex items-center gap-2"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      {currentStep === 2 ? 'Start Import' : 'Next'}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step Components
function FileUploadStep({ 
  fileState, 
  onFileUpload, 
  fileInputRef 
}: {
  fileState: FileUploadState;
  onFileUpload: (file: File) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}) {
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  return (
    <div className="space-y-6">
      {/* File Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          fileState.file
            ? "border-green-300 bg-green-50"
            : "border-gray-300 hover:border-gray-400"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx,.pdf,.epub,.html,.md,.txt,.fdx,.fountain,.scriv,.rtf,.odt"
          onChange={handleFileSelect}
          className="hidden"
        />

        {fileState.processing ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
            <p className="text-lg font-medium text-gray-900">Analyzing file...</p>
            <p className="text-sm text-gray-500">Detecting format and structure</p>
          </div>
        ) : fileState.file ? (
          <div className="flex flex-col items-center">
            <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
            <p className="text-lg font-medium text-gray-900">{fileState.file.name}</p>
            <p className="text-sm text-gray-500">
              Format: {fileState.format} ({Math.round(fileState.confidence * 100)}% confidence)
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose Different File
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Choose a file or drag it here
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Supports: Word, PDF, EPUB, HTML, Markdown, Text, Final Draft, Fountain, Scrivener, RTF, ODT
            </p>
            <Button onClick={() => fileInputRef.current?.click()}>
              Browse Files
            </Button>
          </div>
        )}

        {fileState.error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-sm text-red-800">{fileState.error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Supported Formats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { name: 'Word', ext: '.docx', icon: FileText },
          { name: 'PDF', ext: '.pdf', icon: FileText },
          { name: 'EPUB', ext: '.epub', icon: BookOpen },
          { name: 'HTML', ext: '.html', icon: FileText },
          { name: 'Markdown', ext: '.md', icon: FileText },
          { name: 'Final Draft', ext: '.fdx', icon: FileText },
          { name: 'Fountain', ext: '.fountain', icon: FileText },
          { name: 'Scrivener', ext: '.scriv', icon: FileText }
        ].map(format => {
          const Icon = format.icon;
          return (
            <div key={format.ext} className="flex items-center p-3 border rounded-lg">
              <Icon className="h-5 w-5 text-gray-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-gray-900">{format.name}</p>
                <p className="text-xs text-gray-500">{format.ext}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DocumentPreviewStep({
  preview
}: {
  preview: DocumentPreview;
}) {
  if (!preview.structure) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No document structure available</p>
        </div>
      </div>
    );
  }

  const tabs: TabItem[] = [
    {
      id: 'structure',
      label: 'Structure',
      icon: <BookOpen className="h-4 w-4" />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold">{preview.analysis?.totalWords || 0}</p>
                    <p className="text-sm text-gray-500">Words</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <BookOpen className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold">{preview.analysis?.chapters || 0}</p>
                    <p className="text-sm text-gray-500">Chapters</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold">{preview.analysis?.readingTime || 0}</p>
                    <p className="text-sm text-gray-500">Min Read</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
            <h4 className="font-medium mb-3">Document Outline</h4>
            {preview.structure.content.slice(0, 20).map((node, index) => (
              <div key={index} className="flex items-center py-2 border-b last:border-b-0">
                <div className={cn(
                  "w-2 h-2 rounded-full mr-3",
                  node.type === 'heading' ? 'bg-blue-600' :
                  node.type === 'paragraph' ? 'bg-gray-400' :
                  'bg-green-600'
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {node.content.substring(0, 60)}...
                  </p>
                  <p className="text-xs text-gray-500">
                    {node.type} {node.level && `(Level ${node.level})`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'entities',
      label: 'Entities',
      icon: <User className="h-4 w-4" />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {['character', 'location', 'organization', 'item', 'concept', 'event'].map(type => {
              const count = preview.entities.filter(e => e.type === type).length;
              const icon = {
                character: User,
                location: MapPin,
                organization: Package,
                item: Package,
                concept: BookOpen,
                event: Clock
              }[type];
              const Icon = icon || Package;

              return (
                <Card key={type}>
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <Icon className="h-6 w-6 text-blue-600 mr-2" />
                      <div>
                        <p className="text-lg font-bold">{count}</p>
                        <p className="text-sm text-gray-500 capitalize">{type}s</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
            <h4 className="font-medium mb-3">Extracted Entities</h4>
            {preview.entities.slice(0, 20).map((entity, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div className="flex items-center">
                  <span className={cn(
                    "inline-block w-2 h-2 rounded-full mr-3",
                    entity.type === 'character' ? 'bg-blue-600' :
                    entity.type === 'location' ? 'bg-green-600' :
                    entity.type === 'organization' ? 'bg-purple-600' :
                    'bg-gray-600'
                  )} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{entity.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{entity.type}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-xs text-gray-500">
                    {Math.round(entity.confidence * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'suggestions',
      label: 'Suggestions',
      icon: <BarChart3 className="h-4 w-4" />,
      content: (
        <div className="space-y-4">
          {preview.suggestions.length > 0 ? (
            preview.suggestions.map((suggestion, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-start">
                    <div className={cn(
                      "w-2 h-2 rounded-full mt-2 mr-3",
                      suggestion.priority === 'high' ? 'bg-red-600' :
                      suggestion.priority === 'medium' ? 'bg-yellow-600' :
                      'bg-blue-600'
                    )} />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{suggestion.description}</p>
                      <p className="text-sm text-gray-600 mt-1">{suggestion.action}</p>
                      <span className={cn(
                        "inline-block px-2 py-1 text-xs rounded-full mt-2",
                        suggestion.priority === 'high' ? 'bg-red-100 text-red-800' :
                        suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      )}>
                        {suggestion.priority} priority
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <p className="text-gray-900 font-medium">No issues detected</p>
              <p className="text-gray-500">Your document looks ready for import</p>
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Document Analysis</h3>
        <span className={cn(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
          preview.analysis?.complexity === 'complex' ? 'bg-red-100 text-red-800' :
          preview.analysis?.complexity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        )}>
          {preview.analysis?.complexity} structure
        </span>
      </div>

      <Tabs tabs={tabs} variant="underline" />
    </div>
  );
}

function StructureMappingStep({
  mappingConfig,
  onConfigChange
}: {
  mappingConfig: MappingConfig;
  onConfigChange: (config: MappingConfig) => void;
}) {
  const updateConfig = (updates: Partial<MappingConfig>) => {
    onConfigChange({ ...mappingConfig, ...updates });
  };

  const addCustomRule = () => {
    const newRule: StructureRule = {
      id: Date.now().toString(),
      pattern: '',
      type: 'chapter',
      level: 1,
      enabled: true
    };
    updateConfig({
      customRules: [...mappingConfig.customRules, newRule]
    });
  };

  const updateRule = (id: string, updates: Partial<StructureRule>) => {
    updateConfig({
      customRules: mappingConfig.customRules.map(rule =>
        rule.id === id ? { ...rule, ...updates } : rule
      )
    });
  };

  const removeRule = (id: string) => {
    updateConfig({
      customRules: mappingConfig.customRules.filter(rule => rule.id !== id)
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Import Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">General Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Preserve Formatting
                </label>
                <Switch
                  checked={mappingConfig.preserveFormatting}
                  onCheckedChange={(checked) => updateConfig({ preserveFormatting: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Extract Entities
                </label>
                <Switch
                  checked={mappingConfig.extractEntities}
                  onCheckedChange={(checked) => updateConfig({ extractEntities: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Detect Structure
                </label>
                <Switch
                  checked={mappingConfig.detectStructure}
                  onCheckedChange={(checked) => updateConfig({ detectStructure: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Include Comments
                </label>
                <Switch
                  checked={mappingConfig.includeComments}
                  onCheckedChange={(checked) => updateConfig({ includeComments: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Entity Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Entity Extraction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Confidence Threshold
                </label>
                <Input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={mappingConfig.confidenceThreshold}
                  onChange={(e) => updateConfig({ confidenceThreshold: parseFloat(e.target.value) })}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Context Window
                </label>
                <Input
                  type="number"
                  min="50"
                  max="500"
                  value={mappingConfig.contextWindow}
                  onChange={(e) => updateConfig({ contextWindow: parseInt(e.target.value) })}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Entity Types
                </label>
                <div className="space-y-2">
                  {['character', 'location', 'organization', 'item', 'concept', 'event'].map(type => (
                    <div key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        id={type}
                        checked={mappingConfig.entityTypes.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateConfig({ entityTypes: [...mappingConfig.entityTypes, type] });
                          } else {
                            updateConfig({ entityTypes: mappingConfig.entityTypes.filter(t => t !== type) });
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 mr-2"
                      />
                      <label htmlFor={type} className="text-sm text-gray-700 capitalize">
                        {type}s
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Custom Structure Rules */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-base font-medium text-gray-900">Structure Rules</h4>
          <Button size="sm" onClick={addCustomRule}>
            <Plus className="h-4 w-4 mr-1" />
            Add Rule
          </Button>
        </div>

        <div className="space-y-3">
          {mappingConfig.customRules.map((rule) => (
            <Card key={rule.id}>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  <div className="flex items-center">
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(checked) => updateRule(rule.id, { enabled: checked })}
                    />
                  </div>
                  
                  <Input
                    placeholder="Pattern (regex)"
                    value={rule.pattern}
                    onChange={(e) => updateRule(rule.id, { pattern: e.target.value })}
                  />
                  
                  <Select
                    value={rule.type}
                    onValueChange={(value) => updateRule(rule.id, { type: value as any })}
                  >
                    <option value="act">Act</option>
                    <option value="chapter">Chapter</option>
                    <option value="scene">Scene</option>
                    <option value="section">Section</option>
                  </Select>
                  
                  <Input
                    type="number"
                    min="1"
                    max="6"
                    value={rule.level}
                    onChange={(e) => updateRule(rule.id, { level: parseInt(e.target.value) })}
                  />
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRule(rule.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function ImportCompleteStep({
  finalResult
}: {
  finalResult: ImportResult | null;
}) {
  if (!finalResult) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!finalResult.success) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Import Failed</h3>
        <div className="space-y-2">
          {finalResult.errors?.map((error, index) => (
            <p key={index} className="text-sm text-red-600">{error}</p>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Import Successful!</h3>
        <p className="text-gray-600">Your document has been imported and processed</p>
      </div>

      {/* Import Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{finalResult.statistics?.structureElementsFound || 0}</p>
            <p className="text-sm text-gray-500">Elements</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <User className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{finalResult.statistics?.entitiesExtracted || 0}</p>
            <p className="text-sm text-gray-500">Entities</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{finalResult.statistics?.processingTime || 0}ms</p>
            <p className="text-sm text-gray-500">Processing Time</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{Math.round((finalResult.statistics?.confidence || 0) * 100)}%</p>
            <p className="text-sm text-gray-500">Confidence</p>
          </CardContent>
        </Card>
      </div>

      {/* Warnings */}
      {finalResult.warnings && finalResult.warnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
              Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {finalResult.warnings.map((warning, index) => (
                <p key={index} className="text-sm text-yellow-800 bg-yellow-50 p-2 rounded">
                  {warning}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Extracted Entities Summary */}
      {finalResult.extractedEntities && finalResult.extractedEntities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Extracted Entities</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              {finalResult.extractedEntities.length} entities were automatically detected and added to your codex
            </p>
            <div className="flex flex-wrap gap-2">
              {finalResult.extractedEntities.slice(0, 10).map((entity, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {entity.name}
                </span>
              ))}
              {finalResult.extractedEntities.length > 10 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  +{finalResult.extractedEntities.length - 10} more
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ImportWizard;