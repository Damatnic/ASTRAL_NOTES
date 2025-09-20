/**
 * Manuscript Formatter Component
 * Handles industry-standard formatting for manuscripts
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Settings,
  Download,
  CheckCircle,
  AlertCircle,
  Eye,
  Printer,
  Globe,
  BookOpen,
  Zap,
  RefreshCw
} from 'lucide-react';

interface FormatOption {
  id: string;
  name: string;
  description: string;
  requirements: string[];
  icon: React.ReactNode;
}

interface ManuscriptData {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  pageCount: number;
  formatType: string;
  isFinalized: boolean;
}

interface FormattingResult {
  content: string;
  wordCount: number;
  pageCount: number;
  formatMetadata: {
    formatType: string;
    guideline?: string;
    settings: any;
    compliance: {
      isCompliant: boolean;
      issues: string[];
      suggestions: string[];
    };
  };
}

export const ManuscriptFormatter: React.FC<{ manuscriptId: string }> = ({ manuscriptId }) => {
  const [manuscript, setManuscript] = useState<ManuscriptData | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string>('standard');
  const [selectedGuideline, setSelectedGuideline] = useState<string>('');
  const [customSettings, setCustomSettings] = useState<any>({});
  const [formattingResult, setFormattingResult] = useState<FormattingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState<'formatted' | 'original'>('formatted');

  const formatOptions: FormatOption[] = [
    {
      id: 'standard',
      name: 'Standard Manuscript',
      description: 'Industry-standard formatting for most submissions',
      requirements: ['12pt Times New Roman', 'Double-spaced', '1-inch margins', 'Header with page numbers'],
      icon: <FileText className="w-6 h-6" />
    },
    {
      id: 'publisher_specific',
      name: 'Publisher Guidelines',
      description: 'Format according to specific publisher requirements',
      requirements: ['Publisher-specific formatting', 'Exact guidelines compliance', 'Professional presentation'],
      icon: <BookOpen className="w-6 h-6" />
    },
    {
      id: 'academic',
      name: 'Academic Standards',
      description: 'APA, MLA, Chicago Manual of Style formatting',
      requirements: ['Citation format', 'Bibliography', 'Academic structure'],
      icon: <Globe className="w-6 h-6" />
    },
    {
      id: 'genre_specific',
      name: 'Genre Optimization',
      description: 'Formatting optimized for specific genres',
      requirements: ['Genre conventions', 'Reader expectations', 'Market standards'],
      icon: <Zap className="w-6 h-6" />
    }
  ];

  const publisherGuidelines = [
    { value: 'penguin-random-house', label: 'Penguin Random House' },
    { value: 'harpercollins', label: 'HarperCollins' },
    { value: 'macmillan', label: 'Macmillan Publishers' },
    { value: 'simon-schuster', label: 'Simon & Schuster' }
  ];

  const academicStandards = [
    { value: 'apa-7', label: 'APA 7th Edition' },
    { value: 'mla-9', label: 'MLA 9th Edition' },
    { value: 'chicago-17', label: 'Chicago Manual 17th' }
  ];

  const genreStandards = [
    { value: 'mystery', label: 'Mystery/Thriller' },
    { value: 'romance', label: 'Romance' },
    { value: 'fantasy', label: 'Fantasy' },
    { value: 'literary', label: 'Literary Fiction' }
  ];

  useEffect(() => {
    loadManuscript();
  }, [manuscriptId]);

  const loadManuscript = async () => {
    try {
      const response = await fetch(`/api/manuscripts/${manuscriptId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setManuscript(data);
    } catch (error) {
      console.error('Error loading manuscript:', error);
    }
  };

  const handleFormatManuscript = async () => {
    if (!manuscript) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/publishing/manuscripts/${manuscript.id}/format`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          formatType: selectedFormat,
          guideline: selectedGuideline,
          customSettings
        })
      });

      const result = await response.json();
      setFormattingResult(result.formatting);
      
      // Update manuscript data
      setManuscript({
        ...manuscript,
        content: result.manuscript.content,
        wordCount: result.manuscript.wordCount,
        pageCount: result.manuscript.pageCount,
        formatType: result.manuscript.formatType
      });
    } catch (error) {
      console.error('Error formatting manuscript:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'docx' | 'pdf' | 'epub' | 'mobi') => {
    if (!manuscript) return;

    try {
      const response = await fetch(`/api/publishing/manuscripts/${manuscript.id}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ format })
      });

      const result = await response.json();
      
      // Create download link
      const link = document.createElement('a');
      link.href = result.url;
      link.download = result.filename;
      link.click();
    } catch (error) {
      console.error('Error exporting manuscript:', error);
    }
  };

  const renderGuidelineSelect = () => {
    if (selectedFormat === 'publisher_specific') {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Publisher Guidelines
          </label>
          <select
            value={selectedGuideline}
            onChange={(e) => setSelectedGuideline(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select Publisher</option>
            {publisherGuidelines.map((publisher) => (
              <option key={publisher.value} value={publisher.value}>
                {publisher.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (selectedFormat === 'academic') {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Academic Standard
          </label>
          <select
            value={selectedGuideline}
            onChange={(e) => setSelectedGuideline(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select Standard</option>
            {academicStandards.map((standard) => (
              <option key={standard.value} value={standard.value}>
                {standard.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (selectedFormat === 'genre_specific') {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Genre Standard
          </label>
          <select
            value={selectedGuideline}
            onChange={(e) => setSelectedGuideline(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select Genre</option>
            {genreStandards.map((genre) => (
              <option key={genre.value} value={genre.value}>
                {genre.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    return null;
  };

  if (!manuscript) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manuscript Formatter</h1>
              <p className="text-sm text-gray-600">{manuscript.title}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {manuscript.wordCount.toLocaleString()} words • {manuscript.pageCount} pages
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleExport('docx')}
                  className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>DOCX</span>
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formatting Options */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Formatting Options</h3>
              
              {/* Format Type Selection */}
              <div className="space-y-4 mb-6">
                {formatOptions.map((option) => (
                  <motion.div
                    key={option.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedFormat === option.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedFormat(option.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${
                        selectedFormat === option.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {option.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{option.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                        <ul className="text-xs text-gray-500 mt-2 space-y-1">
                          {option.requirements.map((req, index) => (
                            <li key={index} className="flex items-center space-x-1">
                              <CheckCircle className="w-3 h-3" />
                              <span>{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Guideline Selection */}
              {renderGuidelineSelect()}

              {/* Custom Settings */}
              <div className="mt-6">
                <button
                  className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
                  onClick={() => {/* Toggle custom settings panel */}}
                >
                  <Settings className="w-4 h-4" />
                  <span>Custom Settings</span>
                </button>
              </div>

              {/* Format Button */}
              <button
                onClick={handleFormatManuscript}
                disabled={loading}
                className="w-full mt-6 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                <span>{loading ? 'Formatting...' : 'Apply Formatting'}</span>
              </button>
            </div>

            {/* Compliance Check */}
            {formattingResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <h3 className="text-lg font-medium text-gray-900 mb-4">Compliance Check</h3>
                
                <div className={`flex items-center space-x-2 mb-4 ${
                  formattingResult.formatMetadata.compliance.isCompliant 
                    ? 'text-green-600' 
                    : 'text-yellow-600'
                }`}>
                  {formattingResult.formatMetadata.compliance.isCompliant ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                  <span className="font-medium">
                    {formattingResult.formatMetadata.compliance.isCompliant 
                      ? 'Fully Compliant' 
                      : 'Issues Found'
                    }
                  </span>
                </div>

                {formattingResult.formatMetadata.compliance.issues.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-red-600 mb-2">Issues:</h4>
                    <ul className="text-sm text-red-600 space-y-1">
                      {formattingResult.formatMetadata.compliance.issues.map((issue, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {formattingResult.formatMetadata.compliance.suggestions.length > 0 && (
                  <div>
                    <h4 className="font-medium text-blue-600 mb-2">Suggestions:</h4>
                    <ul className="text-sm text-blue-600 space-y-1">
                      {formattingResult.formatMetadata.compliance.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Preview */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Preview Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Preview</h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPreviewMode('original')}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                        previewMode === 'original'
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Original
                    </button>
                    <button
                      onClick={() => setPreviewMode('formatted')}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                        previewMode === 'formatted'
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Formatted
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Preview Content */}
              <div className="p-6">
                <div className="bg-white border border-gray-200 rounded-lg min-h-96 p-8 font-mono text-sm leading-relaxed">
                  {previewMode === 'formatted' && formattingResult ? (
                    <pre className="whitespace-pre-wrap">{formattingResult.content.substring(0, 2000)}...</pre>
                  ) : (
                    <pre className="whitespace-pre-wrap">{manuscript.content.substring(0, 2000)}...</pre>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManuscriptFormatter;