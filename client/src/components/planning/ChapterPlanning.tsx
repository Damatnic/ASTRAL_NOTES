/**
 * Chapter Planning Component
 * Comprehensive chapter organization with word targets and structure planning
 */

import React, { useState, useEffect } from 'react';
import { 
  Book, 
  Plus, 
  Target, 
  Clock, 
  BarChart3, 
  FileText, 
  Layers,
  Edit3,
  Trash2,
  Copy,
  Play,
  Pause,
  CheckCircle,
  Circle,
  Users,
  MapPin,
  Zap,
  TrendingUp,
  Calendar,
  Filter,
  Grid,
  List
} from 'lucide-react';
import { 
  chapterPlanningService, 
  BookStructure, 
  ChapterPlan, 
  ScenePlan,
  ChapterTemplate,
  WritingSession
} from '../../services/chapterPlanningService';
import { BrowserEventEmitter } from '../../utils/BrowserEventEmitter';
import { Progress } from '../ui/Progress';

export function ChapterPlanning() {
  const [activeBook, setActiveBook] = useState<BookStructure | null>(null);
  const [books, setBooks] = useState<BookStructure[]>([]);
  const [chapters, setChapters] = useState<ChapterPlan[]>([]);
  const [templates, setTemplates] = useState<ChapterTemplate[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<ChapterPlan | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'chapters' | 'scenes'>('overview');
  const [showNewBookModal, setShowNewBookModal] = useState(false);
  const [showNewChapterModal, setShowNewChapterModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [activeSession, setActiveSession] = useState<WritingSession | null>(null);
  
  // Form states
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookWordTarget, setNewBookWordTarget] = useState(80000);
  const [newBookGenre, setNewBookGenre] = useState('');
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newChapterWordTarget, setNewChapterWordTarget] = useState(3000);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  useEffect(() => {
    loadData();
    
    const eventEmitter = BrowserEventEmitter.getInstance();
    const unsubscribers = [
      eventEmitter.on('book:created', loadData),
      eventEmitter.on('book:updated', loadData),
      eventEmitter.on('chapter:created', loadData),
      eventEmitter.on('chapter:updated', loadData),
      eventEmitter.on('scene:added', loadData),
      eventEmitter.on('scene:updated', loadData),
      eventEmitter.on('session:started', (session: WritingSession) => setActiveSession(session)),
      eventEmitter.on('session:ended', () => setActiveSession(null))
    ];

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  const loadData = () => {
    const allBooks = chapterPlanningService.getAllBooks();
    setBooks(allBooks);
    
    const currentActiveBook = chapterPlanningService.getActiveBook();
    setActiveBook(currentActiveBook);
    
    if (currentActiveBook) {
      setChapters(chapterPlanningService.getChaptersByBook(currentActiveBook.id));
    }
    
    setTemplates(chapterPlanningService.getTemplates());
  };

  const handleCreateBook = () => {
    if (!newBookTitle.trim()) return;
    
    const book = chapterPlanningService.createBookStructure({
      title: newBookTitle,
      totalWordTarget: newBookWordTarget,
      chapters: [],
      acts: [
        {
          id: 'act1',
          name: 'Act I',
          description: 'Setup and introduction',
          chapters: [],
          wordTarget: Math.floor(newBookWordTarget * 0.25),
          currentWordCount: 0,
          purpose: 'Establish world, characters, and initial conflict',
          keyEvents: []
        },
        {
          id: 'act2',
          name: 'Act II',
          description: 'Confrontation and development',
          chapters: [],
          wordTarget: Math.floor(newBookWordTarget * 0.5),
          currentWordCount: 0,
          purpose: 'Develop conflict and character arcs',
          keyEvents: []
        },
        {
          id: 'act3',
          name: 'Act III',
          description: 'Resolution and conclusion',
          chapters: [],
          wordTarget: Math.floor(newBookWordTarget * 0.25),
          currentWordCount: 0,
          purpose: 'Resolve conflicts and conclude character arcs',
          keyEvents: []
        }
      ],
      overallStructure: 'three-act',
      genre: newBookGenre.split(',').map(g => g.trim()).filter(Boolean),
      themes: []
    });
    
    setActiveBook(book);
    setNewBookTitle('');
    setNewBookWordTarget(80000);
    setNewBookGenre('');
    setShowNewBookModal(false);
  };

  const handleCreateChapter = () => {
    if (!activeBook || !newChapterTitle.trim()) return;
    
    if (selectedTemplate) {
      chapterPlanningService.createChapterFromTemplate(activeBook.id, selectedTemplate, {
        title: newChapterTitle,
        wordTarget: newChapterWordTarget
      });
    } else {
      chapterPlanningService.createChapter(activeBook.id, {
        title: newChapterTitle,
        number: chapters.length + 1,
        summary: '',
        wordTarget: newChapterWordTarget,
        status: 'outlined',
        scenes: [],
        structure: {
          template: 'three-act',
          beats: [],
          hooks: { opening: '', midpoint: '', ending: '' },
          transitions: { fromPrevious: '', toNext: '' }
        },
        timeline: {},
        tags: [],
        notes: '',
        plotPoints: [],
        characterGoals: [],
        conflicts: [],
        themes: [],
        pov: '',
        setting: '',
        mood: ''
      });
    }
    
    setNewChapterTitle('');
    setNewChapterWordTarget(3000);
    setSelectedTemplate('');
    setShowNewChapterModal(false);
  };

  const handleStartWritingSession = (chapterId: string, sceneId?: string) => {
    const session = chapterPlanningService.startWritingSession(chapterId, sceneId);
    setActiveSession(session);
  };

  const handleEndWritingSession = (wordsWritten: number) => {
    if (!activeSession) return;
    
    chapterPlanningService.endWritingSession(
      activeSession.id,
      wordsWritten,
      'productive',
      'Writing session completed'
    );
    setActiveSession(null);
  };

  const getStatusIcon = (status: ChapterPlan['status'] | ScenePlan['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'drafted':
      case 'revised':
        return <Circle className="w-4 h-4 text-blue-500 fill-current" />;
      case 'outlined':
      case 'planned':
        return <Circle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const renderOverview = () => {
    if (!activeBook) {
      return (
        <div className="text-center py-16">
          <Book className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Book Selected</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Create or select a book to start planning chapters.</p>
          <button
            onClick={() => setShowNewBookModal(true)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
          >
            Create New Book
          </button>
        </div>
      );
    }

    const progress = chapterPlanningService.getBookProgress(activeBook.id);
    
    return (
      <div className="space-y-6">
        {/* Book Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold dark:text-white">{activeBook.title}</h2>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <span>{activeBook.chapters.length} chapters</span>
                <span>{activeBook.currentWordCount.toLocaleString()} / {activeBook.totalWordTarget.toLocaleString()} words</span>
                <span>{progress.toFixed(1)}% complete</span>
              </div>
            </div>
            
            {activeSession && (
              <div className="bg-green-100 dark:bg-green-900/30 px-3 py-2 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">Writing Session Active</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="mb-4">
            <Progress value={progress} className="h-3" />
          </div>
          
          {/* Genre and Themes */}
          <div className="flex flex-wrap gap-2">
            {activeBook.genre.map((genre, idx) => (
              <span key={idx} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-sm">
                {genre}
              </span>
            ))}
            {activeBook.themes.map((theme, idx) => (
              <span key={idx} className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-sm">
                {theme}
              </span>
            ))}
          </div>
        </div>

        {/* Acts Progress */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {activeBook.acts.map((act, idx) => {
            const actProgress = act.wordTarget > 0 ? (act.currentWordCount / act.wordTarget) * 100 : 0;
            return (
              <div key={act.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold dark:text-white mb-2">{act.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{act.description}</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Progress</span>
                    <span className="font-medium dark:text-white">{actProgress.toFixed(1)}%</span>
                  </div>
                  <Progress value={actProgress} className="h-2" />
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Words</span>
                    <span className="dark:text-white">{act.currentWordCount.toLocaleString()} / {act.wordTarget.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Chapters</span>
                    <span className="dark:text-white">{act.chapters.length}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm text-center">
            <div className="text-2xl font-bold text-blue-500">{chapters.filter(c => c.status === 'completed').length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Completed</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm text-center">
            <div className="text-2xl font-bold text-yellow-500">{chapters.filter(c => c.status === 'drafted').length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Drafted</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm text-center">
            <div className="text-2xl font-bold text-green-500">{chapters.filter(c => c.status === 'outlined').length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Outlined</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm text-center">
            <div className="text-2xl font-bold text-gray-500">{chapters.reduce((sum, c) => sum + c.scenes.length, 0)}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Scenes</div>
          </div>
        </div>
      </div>
    );
  };

  const renderChapters = () => (
    <div className="space-y-4">
      {chapters.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Chapters Yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Start planning your book by creating the first chapter.</p>
          <button
            onClick={() => setShowNewChapterModal(true)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
          >
            Create First Chapter
          </button>
        </div>
      ) : (
        chapters.map((chapter) => {
          const progress = chapterPlanningService.getChapterProgress(chapter.id);
          const stats = chapterPlanningService.getChapterStats(chapter.id);
          
          return (
            <div
              key={chapter.id}
              className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border-2 transition-colors cursor-pointer ${
                selectedChapter?.id === chapter.id
                  ? 'border-blue-500'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => setSelectedChapter(selectedChapter?.id === chapter.id ? null : chapter)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(chapter.status)}
                    <h3 className="text-lg font-semibold dark:text-white">
                      Chapter {chapter.number}: {chapter.title}
                    </h3>
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs capitalize">
                      {chapter.status}
                    </span>
                  </div>
                  
                  {chapter.summary && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{chapter.summary}</p>
                  )}
                  
                  <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      <span>{chapter.currentWordCount} / {chapter.wordTarget} words</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Layers className="w-4 h-4" />
                      <span>{chapter.scenes.length} scenes</span>
                    </div>
                    {chapter.pov && (
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{chapter.pov}</span>
                      </div>
                    )}
                    {chapter.setting && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{chapter.setting}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartWritingSession(chapter.id);
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    title="Start writing session"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Edit chapter:', chapter.id);
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    title="Edit chapter"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Progress</span>
                  <span className="font-medium dark:text-white">{progress.toFixed(1)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              
              {chapter.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {chapter.tags.map((tag, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Expanded view */}
              {selectedChapter?.id === chapter.id && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Scenes */}
                    <div>
                      <h4 className="font-medium dark:text-white mb-3">Scenes</h4>
                      <div className="space-y-2">
                        {chapter.scenes.map((scene) => (
                          <div key={scene.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(scene.status)}
                              <span className="text-sm dark:text-white">{scene.title}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{scene.currentWordCount} / {scene.wordTarget}</span>
                              <button
                                onClick={() => handleStartWritingSession(chapter.id, scene.id)}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                title="Write scene"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                        
                        <button
                          onClick={() => {
                            chapterPlanningService.addScene(chapter.id, {
                              title: `Scene ${chapter.scenes.length + 1}`,
                              summary: '',
                              wordTarget: 800,
                              purpose: 'rising-action',
                              characters: [],
                              setting: '',
                              conflict: '',
                              outcome: '',
                              mood: '',
                              pov: '',
                              notes: '',
                              order: chapter.scenes.length + 1
                            });
                          }}
                          className="w-full p-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600"
                        >
                          + Add Scene
                        </button>
                      </div>
                    </div>
                    
                    {/* Chapter Info */}
                    <div>
                      <h4 className="font-medium dark:text-white mb-3">Chapter Details</h4>
                      <div className="space-y-3">
                        {chapter.plotPoints.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plot Points</h5>
                            <div className="space-y-1">
                              {chapter.plotPoints.map((point, idx) => (
                                <div key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                                  • {point.description}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {chapter.characterGoals.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Character Goals</h5>
                            <div className="space-y-1">
                              {chapter.characterGoals.map((goal, idx) => (
                                <div key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                                  <strong>{goal.characterName}:</strong> {goal.goal}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {chapter.notes && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{chapter.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold dark:text-white">Chapter Planning</h2>
          <p className="text-gray-600 dark:text-gray-400">Organize your story structure and track writing progress</p>
        </div>
        
        <div className="flex gap-2">
          {activeBook && (
            <button
              onClick={() => setShowNewChapterModal(true)}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Chapter
            </button>
          )}
          
          <button
            onClick={() => setShowNewBookModal(true)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2"
          >
            <Book className="w-4 h-4" />
            New Book
          </button>
        </div>
      </div>

      {/* Book Selector */}
      {books.length > 0 && (
        <div className="mb-6">
          <select
            value={activeBook?.id || ''}
            onChange={(e) => {
              const book = books.find(b => b.id === e.target.value);
              if (book) {
                chapterPlanningService.setActiveBook(book.id);
                setActiveBook(book);
              }
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            <option value="">Select a book...</option>
            {books.map(book => (
              <option key={book.id} value={book.id}>{book.title}</option>
            ))}
          </select>
        </div>
      )}

      {/* View Mode Tabs */}
      {activeBook && (
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg mb-6">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'chapters', label: 'Chapters', icon: FileText },
            { id: 'scenes', label: 'Scenes', icon: Layers }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                viewMode === tab.id
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="min-h-96">
        {viewMode === 'overview' && renderOverview()}
        {viewMode === 'chapters' && renderChapters()}
        {viewMode === 'scenes' && (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            <Layers className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Scene View</h3>
            <p className="text-sm">Detailed scene management coming soon!</p>
          </div>
        )}
      </div>

      {/* New Book Modal */}
      {showNewBookModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold dark:text-white mb-4">Create New Book</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium dark:text-white mb-2">Title</label>
                <input
                  type="text"
                  value={newBookTitle}
                  onChange={(e) => setNewBookTitle(e.target.value)}
                  placeholder="Enter book title"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium dark:text-white mb-2">Word Target</label>
                <input
                  type="number"
                  value={newBookWordTarget}
                  onChange={(e) => setNewBookWordTarget(Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium dark:text-white mb-2">Genre (comma separated)</label>
                <input
                  type="text"
                  value={newBookGenre}
                  onChange={(e) => setNewBookGenre(e.target.value)}
                  placeholder="e.g., fantasy, adventure, romance"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewBookModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBook}
                disabled={!newBookTitle.trim()}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Chapter Modal */}
      {showNewChapterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold dark:text-white mb-4">Create New Chapter</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium dark:text-white mb-2">Title</label>
                <input
                  type="text"
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  placeholder="Enter chapter title"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium dark:text-white mb-2">Word Target</label>
                <input
                  type="number"
                  value={newChapterWordTarget}
                  onChange={(e) => setNewChapterWordTarget(Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium dark:text-white mb-2">Template (Optional)</label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                >
                  <option value="">No template</option>
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>{template.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewChapterModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateChapter}
                disabled={!newChapterTitle.trim()}
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}