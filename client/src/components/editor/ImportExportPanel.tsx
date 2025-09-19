/**
 * Import/Export Panel Component
 * Handles importing and exporting content in multiple formats
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Download, 
  Upload, 
  FileText, 
  FileImage, 
  File, 
  Code,
  Printer,
  Share2,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  Settings,
  Eye,
  Palette,
  Cloud,
  Files
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabItem } from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/utils/cn';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { TemplateEngineService, TemplateInfo, TemplateRenderContext } from '@/services/templateEngineService';
import { importExportService } from '@/services/importExportService';
import BatchProcessingDialog from '@/components/import/BatchProcessingDialog';
import CloudExportDialog from '@/components/export/CloudExportDialog';

interface ImportExportPanelProps {
  content: string;
  title: string;
  onImport: (content: string, format: 'html' | 'md' | 'txt') => void;
  onExport?: (format: string) => void;
  className?: string;
  author?: string;
  genre?: string;
  wordCount?: number;
  metadata?: Record<string, any>;
}

type ExportFormat = 'md' | 'txt' | 'html' | 'docx' | 'pdf' | 'json' | 'epub' | 'mobi' | 'latex' | 'fdx' | 'fountain' | 'rtf';
type ImportFormat = 'md' | 'txt' | 'html';

interface ExportSettings {
  format: ExportFormat;
  templateId?: string;
  customTemplate?: string;
  templateVariables?: Record<string, any>;
  showTemplateOptions: boolean;
  previewMode: boolean;
}

export function ImportExportPanel({
  content,
  title,
  onImport,
  onExport,
  className,
  author,
  genre,
  wordCount,
  metadata = {}
}: ImportExportPanelProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('md');
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [templateEngine] = useState(() => new TemplateEngineService());
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    format: 'md',
    templateId: undefined,
    customTemplate: '',
    templateVariables: {},
    showTemplateOptions: false,
    previewMode: false
  });
  const [previewContent, setPreviewContent] = useState<string>('');
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [batchMode, setBatchMode] = useState<'import' | 'export'>('import');
  const [showCloudDialog, setShowCloudDialog] = useState(false);
  const [cloudExportBlob, setCloudExportBlob] = useState<Blob | null>(null);

  // Initialize templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const availableTemplates = await templateEngine.getAvailableTemplates();
        setTemplates(availableTemplates);
      } catch (error) {
        console.error('Failed to load templates:', error);
      }
    };
    loadTemplates();
  }, [templateEngine]);

  // Template and preview functions
  const generateTemplateContext = (): TemplateRenderContext => {
    const textContent = stripHtmlTags(content);
    const paragraphs = textContent.split('\n\n').filter(p => p.trim());
    const sentences = textContent.split(/[.!?]+/).filter(s => s.trim());
    
    return {
      title: title || 'Untitled Document',
      content: textContent,
      htmlContent: content,
      author: author || 'Unknown Author',
      genre: genre || '',
      wordCount: wordCount || textContent.split(/\s+/).length,
      createdAt: new Date().toISOString(),
      exportedAt: new Date().toISOString(),
      chapters: paragraphs.map((text, index) => ({
        number: index + 1,
        title: `Chapter ${index + 1}`,
        content: text
      })),
      paragraphs: paragraphs.map((text, index) => ({
        number: index + 1,
        content: text
      })),
      metadata: {
        ...metadata,
        pageCount: Math.ceil(textContent.length / 2000), // Estimate
        characterCount: textContent.length,
        sentenceCount: sentences.length,
        paragraphCount: paragraphs.length
      }
    };
  };

  const updatePreview = async () => {
    if (!exportSettings.previewMode || !exportSettings.templateId) {
      setPreviewContent('');
      return;
    }

    try {
      const context = generateTemplateContext();
      const rendered = await templateEngine.renderTemplate(exportSettings.templateId, context);
      setPreviewContent(rendered);
    } catch (error) {
      console.error('Preview generation failed:', error);
      setPreviewContent('Preview unavailable');
    }
  };

  useEffect(() => {
    updatePreview();
  }, [exportSettings.templateId, exportSettings.previewMode, content, title]);

  const handleAdvancedExport = async (format: ExportFormat) => {
    try {
      setIsExporting(true);
      
      const context = generateTemplateContext();
      let finalContent = content;

      // Use template if selected
      if (exportSettings.templateId) {
        finalContent = await templateEngine.renderTemplate(exportSettings.templateId, context);
      }

      // Use the enhanced import/export service for new formats
      if (['epub', 'mobi', 'latex', 'fdx', 'fountain', 'rtf'].includes(format)) {
        const exportResult = await importExportService.exportContent(
          finalContent,
          format as any,
          {
            title: title || 'Document',
            author: author || 'Unknown Author',
            metadata: context.metadata
          }
        );

        if (exportResult.success && exportResult.blob) {
          const extension = format === 'fdx' ? 'fdx' : format;
          saveAs(exportResult.blob, `${title || 'document'}.${extension}`);
          toast.success(`Exported as ${format.toUpperCase()}`);
        } else {
          throw new Error(exportResult.error || 'Export failed');
        }
        return;
      }

      // Fall back to existing export methods for basic formats
      switch (format) {
        case 'md':
          exportAsMarkdown();
          break;
        case 'txt':
          exportAsText();
          break;
        case 'html':
          exportAsHtml();
          break;
        case 'docx':
          await exportAsDocx();
          return;
        case 'pdf':
          exportAsPdf();
          break;
        case 'json':
          exportAsJson();
          break;
        default:
          throw new Error('Unsupported format');
      }
      
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCloudExport = async (format: ExportFormat = 'md') => {
    try {
      setIsExporting(true);
      
      const context = generateTemplateContext();
      let finalContent = content;

      // Use template if selected
      if (exportSettings.templateId) {
        finalContent = await templateEngine.renderTemplate(exportSettings.templateId, context);
      }

      // Use the enhanced import/export service for new formats
      if (['epub', 'mobi', 'latex', 'fdx', 'fountain', 'rtf'].includes(format)) {
        const exportResult = await importExportService.exportContent(
          finalContent,
          format as any,
          {
            title: title || 'Document',
            author: author || 'Unknown Author',
            metadata: context.metadata
          }
        );

        if (exportResult.success && exportResult.blob) {
          setCloudExportBlob(exportResult.blob);
          setShowCloudDialog(true);
        } else {
          throw new Error(exportResult.error || 'Export failed');
        }
      } else {
        // Handle basic formats
        let blob: Blob;
        const extension = format === 'fdx' ? 'fdx' : format;
        const filename = `${title || 'document'}.${extension}`;

        switch (format) {
          case 'md':
            const markdown = convertHtmlToMarkdown(finalContent);
            blob = new Blob([markdown], { type: 'text/markdown' });
            break;
          case 'txt':
            const text = stripHtmlTags(finalContent);
            blob = new Blob([text], { type: 'text/plain' });
            break;
          case 'html':
            const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title || 'Document'}</title>
    <style>
        body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            color: #333;
        }
    </style>
</head>
<body>
    ${finalContent}
</body>
</html>`;
            blob = new Blob([htmlTemplate], { type: 'text/html' });
            break;
          case 'json':
            const jsonData = {
              title: title || 'Document',
              content: finalContent,
              exportedAt: new Date().toISOString(),
              format: 'astral-notes',
            };
            blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
            break;
          case 'docx':
            // Use the existing DOCX export logic but return blob
            const textContent = stripHtmlTags(finalContent);
            const paragraphs = textContent.split('\n').filter(p => p.trim()).map(text => 
              new Paragraph({
                children: [new TextRun(text)],
              })
            );

            const doc = new Document({
              sections: [{
                properties: {},
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: title || 'Document', bold: true, size: 32 })],
                    heading: HeadingLevel.TITLE,
                  }),
                  ...paragraphs,
                ],
              }],
            });

            blob = await Packer.toBlob(doc);
            break;
          default:
            throw new Error('Unsupported format for cloud export');
        }

        setCloudExportBlob(blob);
        setShowCloudDialog(true);
      }
    } catch (error) {
      console.error('Cloud export preparation failed:', error);
      toast.error(`Cloud export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Export handlers
  const exportAsMarkdown = () => {
    const markdown = convertHtmlToMarkdown(content);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    saveAs(blob, `${title || 'document'}.md`);
  };

  const exportAsText = () => {
    const text = stripHtmlTags(content);
    const blob = new Blob([text], { type: 'text/plain' });
    saveAs(blob, `${title || 'document'}.txt`);
  };

  const exportAsHtml = () => {
    const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title || 'Document'}</title>
    <style>
        body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            color: #333;
        }
        h1, h2, h3, h4, h5, h6 {
            margin-top: 2rem;
            margin-bottom: 1rem;
            font-weight: 600;
        }
        p {
            margin-bottom: 1rem;
        }
        blockquote {
            border-left: 4px solid #e2e8f0;
            padding-left: 1rem;
            margin: 1rem 0;
            font-style: italic;
        }
        code {
            background: #f8fafc;
            padding: 0.2rem 0.4rem;
            border-radius: 0.25rem;
            font-family: 'Fira Code', monospace;
        }
        pre {
            background: #1e293b;
            color: #e2e8f0;
            padding: 1rem;
            border-radius: 0.5rem;
            overflow-x: auto;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 1rem 0;
        }
        th, td {
            border: 1px solid #e2e8f0;
            padding: 0.5rem;
            text-align: left;
        }
        th {
            background: #f8fafc;
            font-weight: 600;
        }
    </style>
</head>
<body>
    ${content}
</body>
</html>`;
    
    const blob = new Blob([htmlTemplate], { type: 'text/html' });
    saveAs(blob, `${title || 'document'}.html`);
  };

  const exportAsDocx = async () => {
    try {
      setIsExporting(true);
      
      // Parse HTML content to DOCX format
      const textContent = stripHtmlTags(content);
      const paragraphs = textContent.split('\n').filter(p => p.trim()).map(text => 
        new Paragraph({
          children: [new TextRun(text)],
        })
      );

      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [new TextRun({ text: title || 'Document', bold: true, size: 32 })],
              heading: HeadingLevel.TITLE,
            }),
            ...paragraphs,
          ],
        }],
      });

      const buffer = await Packer.toBlob(doc);
      saveAs(buffer, `${title || 'document'}.docx`);
      
      toast.success('Document exported as DOCX');
    } catch (error) {
      console.error('DOCX export failed:', error);
      toast.error('Failed to export as DOCX');
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsPdf = () => {
    // For PDF export, we'll use the browser's print functionality
    // Create a new window with the content
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title || 'Document'}</title>
            <style>
                @media print {
                    body {
                        font-family: 'Times New Roman', serif;
                        font-size: 12pt;
                        line-height: 1.5;
                        margin: 1in;
                    }
                    h1, h2, h3, h4, h5, h6 {
                        page-break-after: avoid;
                        margin-top: 24pt;
                        margin-bottom: 12pt;
                    }
                    p {
                        margin-bottom: 12pt;
                    }
                    table {
                        page-break-inside: avoid;
                    }
                }
            </style>
        </head>
        <body>
            <h1>${title || 'Document'}</h1>
            ${content}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const exportAsJson = () => {
    const jsonData = {
      title: title || 'Document',
      content,
      exportedAt: new Date().toISOString(),
      format: 'astral-notes',
    };
    
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    saveAs(blob, `${title || 'document'}.json`);
  };

  const handleExport = async (format: ExportFormat) => {
    onExport?.(format);
    await handleAdvancedExport(format);
  };

  // Import handlers
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    
    try {
      // Use the enhanced import service for advanced formats
      const result = await importExportService.importProject(file);
      
      if (result.success && result.content) {
        // Convert the document structure to HTML content
        let htmlContent = '';
        if (result.document?.nodes) {
          htmlContent = result.document.nodes
            .filter(node => node.type === 'paragraph' || node.type === 'heading')
            .map(node => {
              if (node.type === 'heading') {
                return `<h${node.level || 1}>${node.content}</h${node.level || 1}>`;
              }
              return `<p>${node.content}</p>`;
            })
            .join('\n');
        } else {
          htmlContent = result.content;
        }
        
        onImport(htmlContent, 'html');
        
        if (result.entities && result.entities.length > 0) {
          toast.success(`File imported successfully! Found ${result.entities.length} entities for your codex.`);
        } else {
          toast.success('File imported successfully');
        }
      } else {
        throw new Error(result.error || 'Import failed');
      }
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Import failed:', error);
      
      // Fallback to simple text import for basic formats
      const extension = file.name?.split?.('.').pop()?.toLowerCase();
      if (['txt', 'md', 'html'].includes(extension || '')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            let format: ImportFormat = 'txt';
            if (extension === 'md' || extension === 'markdown') {
              format = 'md';
            } else if (extension === 'html' || extension === 'htm') {
              format = 'html';
            }
            
            onImport(content, format);
            toast.success('File imported successfully (basic mode)');
          } catch (fallbackError) {
            console.error('Fallback import failed:', fallbackError);
            toast.error('Failed to import file');
          } finally {
            setIsImporting(false);
          }
        };
        reader.readAsText(file);
        return;
      }
      
      toast.error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsImporting(false);
    }
  };

  const copyToClipboard = async (format: ExportFormat = 'md') => {
    try {
      let textToCopy = content;
      
      switch (format) {
        case 'md':
          textToCopy = convertHtmlToMarkdown(content);
          break;
        case 'txt':
          textToCopy = stripHtmlTags(content);
          break;
        case 'html':
          textToCopy = content;
          break;
        default:
          textToCopy = stripHtmlTags(content);
      }
      
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success('Copied to clipboard');
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  // Helper functions
  const convertHtmlToMarkdown = (html: string): string => {
    return html
      .replace(/<h([1-6])>(.*?)<\/h[1-6]>/g, (_, level, text) => '#'.repeat(parseInt(level)) + ' ' + text + '\n\n')
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
      .replace(/<em>(.*?)<\/em>/g, '*$1*')
      .replace(/<code>(.*?)<\/code>/g, '`$1`')
      .replace(/<blockquote>(.*?)<\/blockquote>/gs, (_, text) => '> ' + text.replace(/<[^>]*>/g, '') + '\n\n')
      .replace(/<ul>(.*?)<\/ul>/gs, (_, items) => {
        return items.replace(/<li>(.*?)<\/li>/g, '- $1\n') + '\n';
      })
      .replace(/<ol>(.*?)<\/ol>/gs, (_, items) => {
        let counter = 1;
        return items.replace(/<li>(.*?)<\/li>/g, () => `${counter++}. $1\n`) + '\n';
      })
      .replace(/<a href="([^"]*)">(.*?)<\/a>/g, '[$2]($1)')
      .replace(/<img src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/g, '![$2]($1)')
      .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  const stripHtmlTags = (html: string): string => {
    return html
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<\/p>/g, '\n\n')
      .replace(/<[^>]*>/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  const exportOptions = [
    { format: 'md' as ExportFormat, label: 'Markdown', icon: FileText, description: 'Portable text format', category: 'basic' },
    { format: 'txt' as ExportFormat, label: 'Plain Text', icon: File, description: 'Simple text file', category: 'basic' },
    { format: 'html' as ExportFormat, label: 'HTML', icon: Code, description: 'Web page format', category: 'basic' },
    { format: 'docx' as ExportFormat, label: 'Word Document', icon: FileImage, description: 'Microsoft Word format', category: 'document' },
    { format: 'pdf' as ExportFormat, label: 'PDF', icon: FileImage, description: 'Print to PDF', category: 'document' },
    { format: 'epub' as ExportFormat, label: 'EPUB', icon: FileText, description: 'E-book format', category: 'publishing' },
    { format: 'mobi' as ExportFormat, label: 'MOBI', icon: FileText, description: 'Kindle format', category: 'publishing' },
    { format: 'latex' as ExportFormat, label: 'LaTeX', icon: Code, description: 'Academic typesetting', category: 'academic' },
    { format: 'fdx' as ExportFormat, label: 'Final Draft', icon: FileText, description: 'Screenwriting format', category: 'screenwriting' },
    { format: 'fountain' as ExportFormat, label: 'Fountain', icon: FileText, description: 'Screenplay markup', category: 'screenwriting' },
    { format: 'rtf' as ExportFormat, label: 'RTF', icon: FileImage, description: 'Rich Text Format', category: 'document' },
    { format: 'json' as ExportFormat, label: 'JSON', icon: Code, description: 'Data format', category: 'basic' },
  ];

  const tabs: TabItem[] = [
    {
      id: 'export',
      label: 'Export',
      icon: <Download className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          {/* Template Selection */}
          {templates.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  <span className="font-medium">Template</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExportSettings(prev => ({ 
                    ...prev, 
                    showTemplateOptions: !prev.showTemplateOptions 
                  }))}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
              
              {exportSettings.showTemplateOptions && (
                <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <Button
                      variant={!exportSettings.templateId ? "default" : "outline"}
                      size="sm"
                      onClick={() => setExportSettings(prev => ({ ...prev, templateId: undefined }))}
                    >
                      No Template
                    </Button>
                    {templates.map((template) => (
                      <Button
                        key={template.id}
                        variant={exportSettings.templateId === template.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setExportSettings(prev => ({ ...prev, templateId: template.id }))}
                        title={template.description}
                      >
                        {template.name}
                      </Button>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExportSettings(prev => ({ 
                        ...prev, 
                        previewMode: !prev.previewMode 
                      }))}
                      disabled={!exportSettings.templateId}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {exportSettings.previewMode ? 'Hide Preview' : 'Show Preview'}
                    </Button>
                  </div>
                  
                  {exportSettings.previewMode && previewContent && (
                    <div className="mt-3 p-3 bg-background border rounded max-h-48 overflow-y-auto">
                      <div className="text-sm text-muted-foreground mb-2">Template Preview:</div>
                      <pre className="whitespace-pre-wrap text-xs">{previewContent.substring(0, 500)}...</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Export Formats by Category */}
          <div className="space-y-4">
            {['basic', 'document', 'publishing', 'academic', 'screenwriting'].map(category => {
              const categoryOptions = exportOptions.filter(opt => opt.category === category);
              if (categoryOptions.length === 0) return null;
              
              const categoryNames = {
                basic: 'Basic Formats',
                document: 'Document Formats', 
                publishing: 'Publishing Formats',
                academic: 'Academic Formats',
                screenwriting: 'Screenwriting Formats'
              };
              
              return (
                <div key={category} className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    {categoryNames[category as keyof typeof categoryNames]}
                  </h4>
                  <div className="space-y-2">
                    {categoryOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <div key={option.format} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 flex-shrink-0" />
                              <span className="font-medium">{option.label}</span>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground mb-3">
                            {option.description}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleExport(option.format)}
                              disabled={isExporting}
                              className="flex-1"
                              data-testid={`export-${option.format}`}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCloudExport(option.format)}
                              disabled={isExporting}
                              className="flex-1"
                            >
                              <Cloud className="h-4 w-4 mr-1" />
                              Cloud
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Quick Actions */}
          <div className="border-t pt-4 space-y-3">
            <Button
              variant="outline"
              onClick={() => {
                setBatchMode('export');
                setShowBatchDialog(true);
              }}
              className="w-full"
              disabled={isExporting}
            >
              <Files className="h-4 w-4 mr-2" />
              Batch Export Multiple Items
            </Button>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard('md')}
                disabled={!content.trim()}
                className="flex items-center gap-2"
                data-testid="copy-markdown"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Copy as Markdown
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard('txt')}
                disabled={!content.trim()}
                className="flex items-center gap-2"
                data-testid="copy-text"
              >
                <Copy className="h-4 w-4" />
                Copy as Text
              </Button>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'import',
      label: 'Import',
      icon: <Upload className="h-4 w-4" />,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.txt,.html,.htm,.docx,.epub,.pdf,.fdx,.fountain"
              onChange={handleFileImport}
              className="hidden"
              disabled={isImporting}
              data-testid="file-input"
            />
            <Button
              variant="outline"
              size="lg"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="w-full h-24 flex flex-col items-center justify-center gap-2 border-dashed"
            >
              {isImporting ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Upload className="h-6 w-6" />
              )}
              <span className="font-medium">
                {isImporting ? 'Importing...' : 'Choose File to Import'}
              </span>
              <span className="text-xs text-muted-foreground">
                Supports: .md, .txt, .html, .docx, .epub, .pdf, .fdx, .fountain
              </span>
            </Button>
          </div>
          
          <div className="border-t pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setBatchMode('import');
                setShowBatchDialog(true);
              }}
              className="w-full"
              disabled={isImporting}
            >
              <Files className="h-4 w-4 mr-2" />
              Batch Import Multiple Files
            </Button>
          </div>
          
          <div className="text-center text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4 inline mr-1" />
            Importing will replace current content
          </div>
        </div>
      ),
    },
    {
      id: 'share',
      label: 'Share',
      icon: <Share2 className="h-4 w-4" />,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <Share2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">Share Your Note</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Share options will be available in a future update
            </p>
            <Button variant="outline" disabled>
              Coming Soon
            </Button>
          </div>
        </div>
      ),
    },
  ];

  return (
    <>
      <Card className={cn("import-export-panel", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Import & Export
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs tabs={tabs} variant="underline" />
        </CardContent>
      </Card>

      <BatchProcessingDialog
        isOpen={showBatchDialog}
        onClose={() => setShowBatchDialog(false)}
        mode={batchMode}
        contentItems={[{
          content,
          title: title || 'Current Document',
          author,
          metadata
        }]}
        onImportComplete={(result) => {
          // Batch import completed successfully
          setShowBatchDialog(false);
          toast.success('Batch import completed successfully');
        }}
        onExportComplete={(result) => {
          // Batch export completed successfully
          setShowBatchDialog(false);
          toast.success('Batch export completed successfully');
        }}
      />

      {cloudExportBlob && (
        <CloudExportDialog
          isOpen={showCloudDialog}
          onClose={() => {
            setShowCloudDialog(false);
            setCloudExportBlob(null);
          }}
          content={cloudExportBlob}
          filename={`${title || 'document'}.${cloudExportBlob.type.includes('markdown') ? 'md' : 
                    cloudExportBlob.type.includes('html') ? 'html' :
                    cloudExportBlob.type.includes('json') ? 'json' :
                    cloudExportBlob.type.includes('text') ? 'txt' : 'file'}`}
          title="Export to Cloud Storage"
          onExportComplete={(result) => {
            // Cloud export completed successfully
            setShowCloudDialog(false);
            setCloudExportBlob(null);
            if (result.success) {
              toast.success('File exported to cloud storage successfully');
            }
          }}
        />
      )}
    </>
  );
}

export default ImportExportPanel;