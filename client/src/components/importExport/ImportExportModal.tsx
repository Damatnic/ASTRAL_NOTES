/**
 * Import/Export Modal Component
 * UI for importing and exporting projects in various formats
 */

import React, { useState, useRef } from 'react';
import { cn } from '@/utils/cn';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { importExportService, type ExportOptions } from '@/services/importExportService';
import type { Project, Story, Scene } from '@/types/story';
import { 
  Download,
  Upload,
  FileText,
  FileCode,
  FileArchive,
  FileJson,
  FilePlus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Settings,
  ChevronRight,
  Book,
  Code,
  Globe,
  Archive,
  Info
} from 'lucide-react';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  stories: Story[];
  scenes: Scene[];
  onImport?: (project: Project) => void;
}

interface FormatInfo {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  extensions: string[];
  features: string[];
  importSupported: boolean;
  exportSupported: boolean;
}

const formats: FormatInfo[] = [
  {
    id: 'markdown',
    name: 'Markdown',
    description: 'Plain text with formatting syntax',
    icon: FileText,
    color: 'blue',
    extensions: ['.md', '.markdown'],
    features: ['Preserves formatting', 'Git-friendly', 'Universal'],
    importSupported: true,
    exportSupported: true
  },
  {
    id: 'docx',
    name: 'Microsoft Word',
    description: 'Standard word processor format',
    icon: FileText,
    color: 'indigo',
    extensions: ['.docx'],
    features: ['Rich formatting', 'Track changes', 'Comments'],
    importSupported: true,
    exportSupported: true
  },
  {
    id: 'epub',
    name: 'ePub',
    description: 'E-book publication format',
    icon: Book,
    color: 'purple',
    extensions: ['.epub'],
    features: ['E-reader compatible', 'Reflowable text', 'Chapter navigation'],
    importSupported: false,
    exportSupported: true
  },
  {
    id: 'pdf',
    name: 'PDF',
    description: 'Portable document format',
    icon: FileText,
    color: 'red',
    extensions: ['.pdf'],
    features: ['Print-ready', 'Fixed layout', 'Universal viewing'],
    importSupported: false,
    exportSupported: true
  },
  {
    id: 'scrivener',
    name: 'Scrivener',
    description: 'Professional writing software format',
    icon: Archive,
    color: 'green',
    extensions: ['.scriv'],
    features: ['Project structure', 'Metadata', 'Research notes'],
    importSupported: true,
    exportSupported: true
  },
  {
    id: 'json',
    name: 'JSON',
    description: 'Complete data backup',
    icon: FileJson,
    color: 'orange',
    extensions: ['.json'],
    features: ['Complete backup', 'All metadata', 'Re-importable'],
    importSupported: true,
    exportSupported: true
  },
  {
    id: 'html',
    name: 'HTML',
    description: 'Web-ready format',
    icon: Globe,
    color: 'teal',
    extensions: ['.html'],
    features: ['Web publishing', 'Styled output', 'Interactive'],
    importSupported: false,
    exportSupported: true
  }
];

export function ImportExportModal({
  isOpen,
  onClose,
  project,
  stories,
  scenes,
  onImport
}: ImportExportModalProps) {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [selectedFormat, setSelectedFormat] = useState<string>('markdown');
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'markdown' as any,
    includeMetadata: true,
    includeNotes: true,
    includeCharacters: true,
    includeLocations: true,
    includeOutline: true,
    separateChapters: false,
    fontSize: 12,
    fontFamily: 'Georgia, serif',
    pageSize: 'A4',
    margins: { top: 25, bottom: 25, left: 20, right: 20 }
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<{
    success?: boolean;
    message?: string;
    warnings?: string[];
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setIsProcessing(true);
    try {
      await importExportService.exportProject(
        project,
        stories,
        scenes,
        { ...exportOptions, format: selectedFormat as any }
      );
      setImportResult({
        success: true,
        message: 'Export completed successfully!'
      });
    } catch (error) {
      setImportResult({
        success: false,
        message: `Export failed: ${error.message}`
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsProcessing(true);
    setImportResult(null);
    
    try {
      const result = await importExportService.importProject(file);
      
      if (result.success && result.project) {
        onImport?.(result.project);
        setImportResult({
          success: true,
          message: 'Import completed successfully!',
          warnings: result.warnings
        });
      } else {
        setImportResult({
          success: false,
          message: result.errors?.join(', ') || 'Import failed'
        });
      }
    } catch (error) {
      setImportResult({
        success: false,
        message: `Import failed: ${error.message}`
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const selectedFormatInfo = formats.find(f => f.id === selectedFormat);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import/Export Project"
      className="max-w-4xl"
    >
      <div className="space-y-4">
        {/* Tab Selector */}
        <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
          <Button
            size="sm"
            variant={activeTab === 'export' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('export')}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'import' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('import')}
            className="flex-1"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </div>

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div className="space-y-4">
            {/* Format Selection */}
            <div>
              <h3 className="font-semibold mb-3">Select Export Format</h3>
              <div className="grid grid-cols-2 gap-3">
                {formats.filter(f => f.exportSupported).map(format => (
                  <Card
                    key={format.id}
                    className={cn(
                      "cursor-pointer transition-all",
                      selectedFormat === format.id && "ring-2 ring-cosmic-500"
                    )}
                    onClick={() => setSelectedFormat(format.id)}
                  >
                    <div className="p-3">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          `bg-${format.color}-100 dark:bg-${format.color}-900`
                        )}>
                          <format.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{format.name}</h4>
                            {selectedFormat === format.id && (
                              <CheckCircle className="h-4 w-4 text-cosmic-500" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format.description}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {format.features.map(feature => (
                              <Badge key={feature} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Export Options */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Export Options
              </h3>
              
              <div className="space-y-3">
                {/* Content Options */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Include Content</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={exportOptions.includeMetadata}
                        onChange={(e) => setExportOptions(prev => ({
                          ...prev,
                          includeMetadata: e.target.checked
                        }))}
                      />
                      Scene metadata
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={exportOptions.includeNotes}
                        onChange={(e) => setExportOptions(prev => ({
                          ...prev,
                          includeNotes: e.target.checked
                        }))}
                      />
                      Scene notes
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={exportOptions.includeCharacters}
                        onChange={(e) => setExportOptions(prev => ({
                          ...prev,
                          includeCharacters: e.target.checked
                        }))}
                      />
                      Character sheets
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={exportOptions.includeLocations}
                        onChange={(e) => setExportOptions(prev => ({
                          ...prev,
                          includeLocations: e.target.checked
                        }))}
                      />
                      Location descriptions
                    </label>
                  </div>
                </div>

                {/* Format-specific Options */}
                {(selectedFormat === 'docx' || selectedFormat === 'pdf') && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Document Settings</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground">Page Size</label>
                        <select
                          value={exportOptions.pageSize}
                          onChange={(e) => setExportOptions(prev => ({
                            ...prev,
                            pageSize: e.target.value as any
                          }))}
                          className="w-full px-2 py-1 border rounded text-sm bg-background"
                        >
                          <option value="A4">A4</option>
                          <option value="Letter">Letter</option>
                          <option value="A5">A5</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Font Size</label>
                        <input
                          type="number"
                          value={exportOptions.fontSize}
                          onChange={(e) => setExportOptions(prev => ({
                            ...prev,
                            fontSize: parseInt(e.target.value) || 12
                          }))}
                          min="8"
                          max="24"
                          className="w-full px-2 py-1 border rounded text-sm bg-background"
                        />
                      </div>
                    </div>
                    
                    <label className="flex items-center gap-2 text-sm mt-2">
                      <input
                        type="checkbox"
                        checked={exportOptions.separateChapters}
                        onChange={(e) => setExportOptions(prev => ({
                          ...prev,
                          separateChapters: e.target.checked
                        }))}
                      />
                      Start chapters on new pages
                    </label>
                  </div>
                )}
              </div>
            </Card>

            {/* Project Info */}
            <Card className="p-4 bg-muted/50">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Export Summary</p>
                  <div className="text-muted-foreground space-y-0.5">
                    <p>Project: {project.title}</p>
                    <p>Stories: {stories.length}</p>
                    <p>Total Scenes: {scenes.length}</p>
                    <p>Word Count: {project.metadata?.currentWordCount?.toLocaleString() || 0}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Export Button */}
            <div className="flex items-center justify-between">
              <div>
                {importResult && (
                  <div className={cn(
                    "flex items-center gap-2 text-sm",
                    importResult.success ? "text-green-600" : "text-red-600"
                  )}>
                    {importResult.success ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    {importResult.message}
                  </div>
                )}
              </div>
              
              <Button
                onClick={handleExport}
                disabled={isProcessing}
                className="min-w-[120px]"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export {selectedFormatInfo?.name}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Import Tab */}
        {activeTab === 'import' && (
          <div className="space-y-4">
            {/* Format Selection */}
            <div>
              <h3 className="font-semibold mb-3">Supported Import Formats</h3>
              <div className="grid grid-cols-2 gap-3">
                {formats.filter(f => f.importSupported).map(format => (
                  <Card key={format.id} className="p-3">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        `bg-${format.color}-100 dark:bg-${format.color}-900`
                      )}>
                        <format.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{format.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format.extensions.join(', ')}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Import Instructions */}
            <Card className="p-4 bg-muted/50">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Import Instructions
              </h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Select a file in one of the supported formats</li>
                <li>• Markdown files should follow standard heading structure</li>
                <li>• JSON files must be from a previous ASTRAL NOTES export</li>
                <li>• Imported content will create a new project</li>
                <li>• Existing projects will not be affected</li>
              </ul>
            </Card>

            {/* File Upload */}
            <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.markdown,.docx,.scriv,.json"
                onChange={handleImport}
                className="hidden"
              />
              
              <FilePlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File to Import
                  </>
                )}
              </Button>
              
              <p className="text-sm text-muted-foreground mt-2">
                or drag and drop a file here
              </p>
            </div>

            {/* Import Result */}
            {importResult && (
              <Card className={cn(
                "p-4",
                importResult.success ? "bg-green-50 dark:bg-green-950" : "bg-red-50 dark:bg-red-950"
              )}>
                <div className="flex items-start gap-3">
                  {importResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={cn(
                      "font-medium",
                      importResult.success ? "text-green-700" : "text-red-700"
                    )}>
                      {importResult.message}
                    </p>
                    {importResult.warnings && importResult.warnings.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-yellow-600 font-medium">Warnings:</p>
                        <ul className="text-sm text-yellow-600 mt-1">
                          {importResult.warnings.map((warning, i) => (
                            <li key={i}>• {warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

export default ImportExportModal;