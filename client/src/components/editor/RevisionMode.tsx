/**
 * Revision Mode Component
 * Visual interface for track changes and collaborative editing
 */

import React, { useState, useEffect, useRef } from 'react';
import { toSafeInnerHtml } from '@/utils/sanitizeHtml';
import { 
  Edit3, 
  Check, 
  X, 
  MessageSquare, 
  Users, 
  Filter, 
  Download,
  Eye,
  EyeOff,
  GitBranch,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { 
  revisionModeService, 
  RevisionSession, 
  RevisionChange, 
  ComparisonView,
  RevisionFilter,
  RevisionStats
} from '../../services/revisionModeService';
import { BrowserEventEmitter } from '../../utils/BrowserEventEmitter';

interface RevisionModeProps {
  documentId: string;
  documentTitle: string;
  content: string;
  onContentChange?: (content: string) => void;
  className?: string;
}

export function RevisionMode({ 
  documentId, 
  documentTitle, 
  content,
  onContentChange,
  className = '' 
}: RevisionModeProps) {
  const [session, setSession] = useState<RevisionSession | null>(null);
  const [changes, setChanges] = useState<RevisionChange[]>([]);
  const [filteredChanges, setFilteredChanges] = useState<RevisionChange[]>([]);
  const [stats, setStats] = useState<RevisionStats | null>(null);
  const [view, setView] = useState<ComparisonView>(revisionModeService.getComparisonView());
  const [showSidebar, setShowSidebar] = useState(true);
  const [selectedChange, setSelectedChange] = useState<RevisionChange | null>(null);
  const [commentText, setCommentText] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Start or resume session
    const currentSession = revisionModeService.getCurrentSession();
    if (currentSession && currentSession.documentId === documentId) {
      setSession(currentSession);
    } else {
      const newSession = revisionModeService.startRevisionSession(documentId, documentTitle);
      setSession(newSession);
    }

    loadChanges();

    // Subscribe to events
    const eventEmitter = BrowserEventEmitter.getInstance();
    const unsubscribers = [
      eventEmitter.on('revision:change-tracked', loadChanges),
      eventEmitter.on('revision:change-accepted', loadChanges),
      eventEmitter.on('revision:change-rejected', loadChanges),
      eventEmitter.on('revision:comment-reply', loadChanges),
      eventEmitter.on('revision:filter-changed', loadChanges),
      eventEmitter.on('revision:view-changed', (newView: ComparisonView) => {
        setView(newView);
      })
    ];

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [documentId, documentTitle]);

  const loadChanges = () => {
    const currentSession = revisionModeService.getCurrentSession();
    if (currentSession) {
      setSession(currentSession);
      setChanges(currentSession.changes);
      setFilteredChanges(revisionModeService.getFilteredChanges());
      setStats(currentSession.statistics);
    }
  };

  const handleAcceptChange = (changeId: string) => {
    revisionModeService.acceptChange(changeId);
    loadChanges();
  };

  const handleRejectChange = (changeId: string) => {
    revisionModeService.rejectChange(changeId);
    loadChanges();
  };

  const handleAcceptAll = () => {
    revisionModeService.acceptAllChanges();
    loadChanges();
    
    // Apply changes to content
    if (onContentChange) {
      const updatedContent = revisionModeService.applyChanges(content);
      onContentChange(updatedContent);
    }
  };

  const handleRejectAll = () => {
    revisionModeService.rejectAllChanges();
    loadChanges();
  };

  const handleAddComment = () => {
    if (!commentText.trim() || !contentRef.current) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const position = {
      start: range.startOffset,
      end: range.endOffset
    };
    
    revisionModeService.addComment(position, commentText);
    setCommentText('');
    loadChanges();
  };

  const handleExport = (format: 'json' | 'html' | 'pdf') => {
    const exportData = revisionModeService.exportRevisions(format);
    const blob = new Blob([exportData], { 
      type: format === 'json' ? 'application/json' : 'text/html' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentTitle}_revisions.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderContent = () => {
    if (!content) return null;
    
    // Apply visual changes inline
    let displayContent = content;
    const sortedChanges = [...filteredChanges].sort((a, b) => b.position.start - a.position.start);
    
    for (const change of sortedChanges) {
      const before = displayContent.slice(0, change.position.start);
      const after = displayContent.slice(change.position.end);
      
      let changeHTML = '';
      switch (change.type) {
        case 'deletion':
          changeHTML = `<span class="revision-deletion" data-change-id="${change.id}">${change.originalText || ''}</span>`;
          break;
        case 'addition':
          changeHTML = `<span class="revision-addition" data-change-id="${change.id}">${change.newText || ''}</span>`;
          break;
        case 'modification':
          changeHTML = `<span class="revision-modification" data-change-id="${change.id}">
            <span class="revision-old">${change.originalText || ''}</span>
            <span class="revision-new">${change.newText || ''}</span>
          </span>`;
          break;
        case 'comment':
          const commentContent = displayContent.slice(change.position.start, change.position.end);
          changeHTML = `<span class="revision-comment" data-change-id="${change.id}">${commentContent}
            <span class="comment-indicator">💬</span>
          </span>`;
          break;
      }
      
      displayContent = before + changeHTML + after;
    }
    
    return <div dangerouslySetInnerHTML={toSafeInnerHtml(displayContent)} />;
  };

  const getChangeIcon = (type: RevisionChange['type']) => {
    switch (type) {
      case 'addition': return <span className="text-green-500">+</span>;
      case 'deletion': return <span className="text-red-500">-</span>;
      case 'modification': return <span className="text-yellow-500">±</span>;
      case 'comment': return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'suggestion': return <AlertCircle className="w-4 h-4 text-purple-500" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: RevisionChange['status']) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <div className={`flex h-full ${className}`}>
      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="Toggle sidebar"
              >
                {showSidebar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
              
              <button
                onClick={handleAcceptAll}
                className="px-3 py-1 text-sm bg-green-500 hover:bg-green-600 text-white rounded-md flex items-center gap-1"
              >
                <Check className="w-4 h-4" />
                Accept All
              </button>
              
              <button
                onClick={handleRejectAll}
                className="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded-md flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Reject All
              </button>
              
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
              
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="Filter changes"
              >
                <Filter className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => handleExport('html')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="Export revisions"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
            
            {/* Statistics */}
            {stats && (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-green-500 font-medium">{stats.acceptedChanges}</span>
                  <span className="text-gray-500">accepted</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500 font-medium">{stats.pendingChanges}</span>
                  <span className="text-gray-500">pending</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-red-500 font-medium">{stats.rejectedChanges}</span>
                  <span className="text-gray-500">rejected</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-900">
          <div
            ref={contentRef}
            className="max-w-4xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm revision-content"
            style={{
              minHeight: '600px',
              fontFamily: 'Georgia, serif',
              fontSize: '16px',
              lineHeight: '1.8'
            }}
          >
            {renderContent()}
          </div>
        </div>

        {/* Comment Input */}
        {selectedChange && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                />
                <button
                  onClick={handleAddComment}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
                >
                  Comment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      {showSidebar && (
        <div className="w-80 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold dark:text-white">Revision History</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {filteredChanges.length} changes
            </p>
          </div>

          <div className="flex-1 overflow-auto">
            {filteredChanges.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No changes to display
              </div>
            ) : (
              <div className="space-y-2 p-2">
                {filteredChanges.map((change) => (
                  <div
                    key={change.id}
                    onClick={() => setSelectedChange(change)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedChange?.id === change.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {getChangeIcon(change.type)}
                        <span className="text-sm font-medium dark:text-white capitalize">
                          {change.type}
                        </span>
                      </div>
                      {getStatusBadge(change.status)}
                    </div>

                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      by {change.author.name} • {new Date(change.timestamp).toLocaleTimeString()}
                    </div>

                    {change.originalText && (
                      <div className="text-sm mb-1">
                        <span className="text-red-500 line-through">{change.originalText}</span>
                      </div>
                    )}
                    {change.newText && (
                      <div className="text-sm mb-1">
                        <span className="text-green-500">{change.newText}</span>
                      </div>
                    )}
                    {change.comment && (
                      <div className="text-sm italic text-gray-600 dark:text-gray-400">
                        "{change.comment}"
                      </div>
                    )}

                    {change.status === 'pending' && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAcceptChange(change.id);
                          }}
                          className="flex-1 px-2 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded"
                        >
                          Accept
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRejectChange(change.id);
                          }}
                          className="flex-1 px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .revision-deletion {
          background-color: #fee2e2;
          text-decoration: line-through;
          color: #991b1b;
          padding: 2px 4px;
          border-radius: 3px;
        }
        
        .revision-addition {
          background-color: #dcfce7;
          color: #166534;
          padding: 2px 4px;
          border-radius: 3px;
        }
        
        .revision-modification .revision-old {
          background-color: #fee2e2;
          text-decoration: line-through;
          color: #991b1b;
          padding: 2px 4px;
          border-radius: 3px;
          margin-right: 4px;
        }
        
        .revision-modification .revision-new {
          background-color: #dcfce7;
          color: #166534;
          padding: 2px 4px;
          border-radius: 3px;
        }
        
        .revision-comment {
          background-color: #dbeafe;
          position: relative;
          padding: 2px 4px;
          border-radius: 3px;
        }
        
        .comment-indicator {
          position: absolute;
          top: -8px;
          right: -8px;
          font-size: 12px;
        }
        
        .dark .revision-deletion {
          background-color: #7f1d1d;
          color: #fca5a5;
        }
        
        .dark .revision-addition {
          background-color: #14532d;
          color: #86efac;
        }
        
        .dark .revision-modification .revision-old {
          background-color: #7f1d1d;
          color: #fca5a5;
        }
        
        .dark .revision-modification .revision-new {
          background-color: #14532d;
          color: #86efac;
        }
        
        .dark .revision-comment {
          background-color: #1e3a8a;
        }
      `}</style>
    </div>
  );
}
