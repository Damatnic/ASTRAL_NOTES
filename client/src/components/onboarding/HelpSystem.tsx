import React, { useState, useEffect } from 'react';
import { toSafeInnerHtml } from '@/utils/sanitizeHtml';
import { onboardingService } from '../../services/onboardingService';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';

interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: 'getting-started' | 'features' | 'troubleshooting' | 'ai' | 'professional';
  keywords: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  relatedFlows?: string[];
}

interface HelpSystemProps {
  isOpen: boolean;
  onClose: () => void;
  context?: string;
}

export function HelpSystem({ isOpen, onClose, context }: HelpSystemProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [filteredArticles, setFilteredArticles] = useState<HelpArticle[]>([]);

  const helpArticles: HelpArticle[] = [
    {
      id: 'getting-started-overview',
      title: 'Welcome to ASTRAL_NOTES',
      content: `
        <h3>Getting Started with Your Writing Journey</h3>
        <p>ASTRAL_NOTES is a comprehensive writing platform designed to help you create, organize, and perfect your written works. Whether you're writing a novel, short story, or any creative piece, our platform provides the tools you need.</p>
        
        <h4>Key Features:</h4>
        <ul>
          <li><strong>AI Writing Assistant:</strong> Get intelligent suggestions and creative support</li>
          <li><strong>Project Organization:</strong> Keep all your writing projects organized in one place</li>
          <li><strong>Version Control:</strong> Track changes and never lose your progress</li>
          <li><strong>World Building Tools:</strong> Create consistent fictional universes</li>
          <li><strong>Timeline Management:</strong> Organize complex narratives visually</li>
        </ul>
        
        <h4>Getting Started:</h4>
        <ol>
          <li>Create your first project using the guided setup</li>
          <li>Explore the writing editor and familiarize yourself with the tools</li>
          <li>Try the AI writing assistant for suggestions and inspiration</li>
          <li>Use the onboarding flows to learn advanced features</li>
        </ol>
      `,
      category: 'getting-started',
      keywords: ['welcome', 'overview', 'introduction', 'start', 'begin'],
      difficulty: 'beginner',
      relatedFlows: ['basic-introduction']
    },
    {
      id: 'ai-assistant-guide',
      title: 'Using the AI Writing Assistant',
      content: `
        <h3>Harness the Power of AI for Better Writing</h3>
        <p>Our AI Writing Assistant is designed to be your creative partner, offering intelligent suggestions and helping you overcome writer's block.</p>
        
        <h4>AI Features:</h4>
        <ul>
          <li><strong>Writing Suggestions:</strong> Get contextual improvements for your text</li>
          <li><strong>Goal Tracking:</strong> Set writing goals and track your progress with AI insights</li>
          <li><strong>Style Analysis:</strong> Understand your writing patterns and improve consistency</li>
          <li><strong>Creative Prompts:</strong> Get inspiration when you're stuck</li>
        </ul>
        
        <h4>How to Use:</h4>
        <ol>
          <li>Access the AI Assistant from the Professional dashboard</li>
          <li>Select text in your editor to get targeted suggestions</li>
          <li>Set writing goals in the Goals section</li>
          <li>Review analytics to understand your writing patterns</li>
          <li>Use prompts for creative inspiration</li>
        </ol>
        
        <h4>Tips for Best Results:</h4>
        <ul>
          <li>Provide context about your story or project</li>
          <li>Be specific about what kind of help you need</li>
          <li>Review suggestions critically - you're the author</li>
          <li>Use analytics to identify areas for improvement</li>
        </ul>
      `,
      category: 'ai',
      keywords: ['ai', 'assistant', 'suggestions', 'writing', 'help', 'artificial intelligence'],
      difficulty: 'intermediate',
      relatedFlows: ['ai-assistant-intro']
    },
    {
      id: 'project-management',
      title: 'Managing Your Writing Projects',
      content: `
        <h3>Organize Your Creative Works</h3>
        <p>ASTRAL_NOTES provides powerful project management tools to keep your writing organized and accessible.</p>
        
        <h4>Project Types:</h4>
        <ul>
          <li><strong>Novel:</strong> Full-length books with chapter organization</li>
          <li><strong>Short Story:</strong> Shorter works with scene-based structure</li>
          <li><strong>Screenplay:</strong> Script format with specialized tools</li>
          <li><strong>Non-Fiction:</strong> Essays, articles, and educational content</li>
        </ul>
        
        <h4>Project Features:</h4>
        <ul>
          <li><strong>Project Dashboard:</strong> Overview of progress and statistics</li>
          <li><strong>File Organization:</strong> Chapters, scenes, and research notes</li>
          <li><strong>Goal Setting:</strong> Word count and deadline tracking</li>
          <li><strong>Collaboration:</strong> Share and work with others</li>
        </ul>
        
        <h4>Best Practices:</h4>
        <ul>
          <li>Use descriptive project names and categories</li>
          <li>Set realistic word count goals</li>
          <li>Regularly back up your work</li>
          <li>Use tags and metadata for easy searching</li>
        </ul>
      `,
      category: 'features',
      keywords: ['project', 'management', 'organization', 'dashboard', 'files'],
      difficulty: 'beginner',
      relatedFlows: ['basic-introduction']
    },
    {
      id: 'version-control-help',
      title: 'Version Control and Backup',
      content: `
        <h3>Never Lose Your Work Again</h3>
        <p>Our version control system automatically tracks changes to your documents and provides powerful backup and recovery options.</p>
        
        <h4>Automatic Features:</h4>
        <ul>
          <li><strong>Auto-Save:</strong> Your work is saved automatically every few seconds</li>
          <li><strong>Version History:</strong> Every significant change is tracked</li>
          <li><strong>Conflict Resolution:</strong> Handle multiple editors gracefully</li>
          <li><strong>Recovery Options:</strong> Restore previous versions easily</li>
        </ul>
        
        <h4>Manual Controls:</h4>
        <ul>
          <li><strong>Snapshots:</strong> Create named save points for important milestones</li>
          <li><strong>Branching:</strong> Explore different directions without losing original work</li>
          <li><strong>Comparison:</strong> See exactly what changed between versions</li>
          <li><strong>Export:</strong> Download versions in various formats</li>
        </ul>
        
        <h4>Recovery Process:</h4>
        <ol>
          <li>Go to the Version Control panel</li>
          <li>Browse the timeline of changes</li>
          <li>Preview the version you want to restore</li>
          <li>Restore or create a new branch from that point</li>
        </ol>
      `,
      category: 'professional',
      keywords: ['version', 'control', 'backup', 'save', 'history', 'recovery'],
      difficulty: 'intermediate',
      relatedFlows: ['professional-features']
    },
    {
      id: 'troubleshooting-common-issues',
      title: 'Common Issues and Solutions',
      content: `
        <h3>Troubleshooting Guide</h3>
        <p>Here are solutions to the most common issues users encounter:</p>
        
        <h4>Editor Issues:</h4>
        <ul>
          <li><strong>Text not saving:</strong> Check your internet connection and auto-save settings</li>
          <li><strong>Slow performance:</strong> Try refreshing the page or closing other browser tabs</li>
          <li><strong>Formatting problems:</strong> Use the format cleanup tool in the editor menu</li>
        </ul>
        
        <h4>AI Assistant Issues:</h4>
        <ul>
          <li><strong>No suggestions appearing:</strong> Ensure you have selected text and the AI is enabled</li>
          <li><strong>Poor suggestion quality:</strong> Provide more context about your project and goals</li>
          <li><strong>AI not responding:</strong> Check your subscription status and internet connection</li>
        </ul>
        
        <h4>Project Issues:</h4>
        <ul>
          <li><strong>Project not loading:</strong> Clear browser cache and try again</li>
          <li><strong>Missing files:</strong> Check the version history for recent changes</li>
          <li><strong>Sync problems:</strong> Log out and back in to refresh authentication</li>
        </ul>
        
        <h4>Getting More Help:</h4>
        <p>If these solutions don't help:</p>
        <ol>
          <li>Check the status page for known issues</li>
          <li>Contact support with specific error messages</li>
          <li>Include browser information and steps to reproduce</li>
        </ol>
      `,
      category: 'troubleshooting',
      keywords: ['troubleshooting', 'problems', 'issues', 'error', 'bug', 'fix'],
      difficulty: 'beginner'
    },
    {
      id: 'keyboard-shortcuts',
      title: 'Keyboard Shortcuts',
      content: `
        <h3>Speed Up Your Writing with Shortcuts</h3>
        <p>Master these keyboard shortcuts to write more efficiently:</p>
        
        <h4>Basic Editing:</h4>
        <table class="shortcut-table">
          <tr><td><code>Ctrl+S</code></td><td>Manual save (auto-save is always on)</td></tr>
          <tr><td><code>Ctrl+Z</code></td><td>Undo last action</td></tr>
          <tr><td><code>Ctrl+Y</code></td><td>Redo action</td></tr>
          <tr><td><code>Ctrl+F</code></td><td>Find text in document</td></tr>
          <tr><td><code>Ctrl+H</code></td><td>Find and replace</td></tr>
        </table>
        
        <h4>Formatting:</h4>
        <table class="shortcut-table">
          <tr><td><code>Ctrl+B</code></td><td>Bold text</td></tr>
          <tr><td><code>Ctrl+I</code></td><td>Italic text</td></tr>
          <tr><td><code>Ctrl+U</code></td><td>Underline text</td></tr>
          <tr><td><code>Ctrl+K</code></td><td>Insert link</td></tr>
        </table>
        
        <h4>AI Assistant:</h4>
        <table class="shortcut-table">
          <tr><td><code>Ctrl+Space</code></td><td>Get AI suggestions for selected text</td></tr>
          <tr><td><code>Ctrl+Shift+A</code></td><td>Open AI assistant panel</td></tr>
          <tr><td><code>F1</code></td><td>Open help system</td></tr>
        </table>
        
        <h4>Navigation:</h4>
        <table class="shortcut-table">
          <tr><td><code>Ctrl+1-6</code></td><td>Switch between dashboard tabs</td></tr>
          <tr><td><code>Ctrl+N</code></td><td>Create new document</td></tr>
          <tr><td><code>Ctrl+O</code></td><td>Open document browser</td></tr>
        </table>
      `,
      category: 'features',
      keywords: ['keyboard', 'shortcuts', 'hotkeys', 'efficiency', 'speed'],
      difficulty: 'intermediate'
    }
  ];

  useEffect(() => {
    filterArticles();
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    if (context) {
      setSearchQuery(context);
    }
  }, [context]);

  const filterArticles = () => {
    let filtered = helpArticles;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(query) ||
        article.content.toLowerCase().includes(query) ||
        article.keywords.some(keyword => keyword.toLowerCase().includes(query))
      );
    }

    setFilteredArticles(filtered);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'getting-started': return '🚀';
      case 'features': return '⚡';
      case 'ai': return '🤖';
      case 'professional': return '💼';
      case 'troubleshooting': return '🔧';
      default: return '📖';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const startRelatedFlow = (flowId: string) => {
    onboardingService.startFlow(flowId);
    onClose();
  };

  if (selectedArticle) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={selectedArticle.title}
        className="max-w-4xl"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <Button
              onClick={() => setSelectedArticle(null)}
              variant="outline"
              className="text-sm"
            >
              ← Back to Help
            </Button>
            <Badge className={getDifficultyColor(selectedArticle.difficulty)}>
              {selectedArticle.difficulty}
            </Badge>
          </div>

          <div 
            className="prose prose-sm max-w-none help-content"
            dangerouslySetInnerHTML={toSafeInnerHtml(selectedArticle.content)}
          />

          {selectedArticle.relatedFlows && selectedArticle.relatedFlows.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">📚 Related Learning</h4>
              <p className="text-sm text-blue-800 mb-3">
                Want to learn more? Check out these guided tutorials:
              </p>
              <div className="space-y-2">
                {selectedArticle.relatedFlows.map(flowId => (
                  <Button
                    key={flowId}
                    onClick={() => startRelatedFlow(flowId)}
                    variant="outline"
                    className="mr-2 mb-2 text-sm"
                  >
                    Start {flowId.replace('-', ' ')} Tutorial
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        <style jsx>{`
          .help-content h3 {
            color: #1f2937;
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 1rem;
          }

          .help-content h4 {
            color: #374151;
            font-size: 1.1rem;
            font-weight: 600;
            margin-top: 1.5rem;
            margin-bottom: 0.75rem;
          }

          .help-content p {
            color: #4b5563;
            line-height: 1.6;
            margin-bottom: 1rem;
          }

          .help-content ul, .help-content ol {
            color: #4b5563;
            margin-bottom: 1rem;
            padding-left: 1.5rem;
          }

          .help-content li {
            margin-bottom: 0.5rem;
            line-height: 1.6;
          }

          .help-content strong {
            color: #1f2937;
            font-weight: 600;
          }

          .help-content code {
            background: #f3f4f6;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            font-family: 'Fira Code', monospace;
            font-size: 0.875rem;
            color: #6366f1;
          }

          .shortcut-table {
            width: 100%;
            border-collapse: collapse;
            margin: 1rem 0;
          }

          .shortcut-table td {
            padding: 0.75rem;
            border-bottom: 1px solid #e5e7eb;
          }

          .shortcut-table td:first-child {
            width: 150px;
            font-weight: 600;
          }
        `}</style>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Help & Support"
      className="max-w-5xl"
    >
      <div className="space-y-6">
        {/* Search and Filters */}
        <div className="space-y-4">
          <Input
            placeholder="Search help articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setSelectedCategory('all')}
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              className="text-sm"
            >
              All Categories
            </Button>
            {['getting-started', 'features', 'ai', 'professional', 'troubleshooting'].map(category => (
              <Button
                key={category}
                onClick={() => setSelectedCategory(category)}
                variant={selectedCategory === category ? 'default' : 'outline'}
                className="text-sm"
              >
                {getCategoryIcon(category)} {category.replace('-', ' ')}
              </Button>
            ))}
          </div>
        </div>

        {/* Help Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredArticles.map(article => (
            <div
              key={article.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedArticle(article)}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl">{getCategoryIcon(article.category)}</span>
                <Badge className={getDifficultyColor(article.difficulty)}>
                  {article.difficulty}
                </Badge>
              </div>
              
              <h3 className="font-medium text-gray-900 mb-2">{article.title}</h3>
              
              <p className="text-sm text-gray-600 line-clamp-3">
                {article.content.replace(/<[^>]*>/g, '').substring(0, 120)}...
              </p>
              
              <div className="mt-3 pt-3 border-t">
                <div className="flex flex-wrap gap-1">
                  {article.keywords.slice(0, 3).map(keyword => (
                    <span
                      key={keyword}
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                    >
                      {keyword}
                    </span>
                  ))}
                  {article.keywords.length > 3 && (
                    <span className="text-xs text-gray-400">
                      +{article.keywords.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredArticles.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
            <p className="text-gray-600">
              Try adjusting your search terms or browse different categories.
            </p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              onClick={() => onboardingService.startFlow('basic-introduction')}
              variant="outline"
              className="text-sm justify-start"
            >
              🚀 Start Basic Tutorial
            </Button>
            <Button
              onClick={() => onboardingService.requestHelp('help-system')}
              variant="outline"
              className="text-sm justify-start"
            >
              💬 Contact Support
            </Button>
            <Button
              onClick={() => window.open('https://docs.astral-notes.com', '_blank')}
              variant="outline"
              className="text-sm justify-start"
            >
              📚 Full Documentation
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default HelpSystem;
