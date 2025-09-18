/**
 * Reference Images Component
 * Visual inspiration library with mood boards and AI-powered analysis
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  Search, 
  Filter, 
  Grid, 
  List, 
  Plus, 
  Eye, 
  Trash2, 
  Copy,
  Download,
  Palette,
  Tag,
  Lightbulb,
  Image as ImageIcon,
  Folder,
  Star,
  Heart
} from 'lucide-react';
import { 
  referenceImagesService, 
  ReferenceImage, 
  MoodBoard, 
  ImageCollection,
  InspirationPrompt
} from '../../services/referenceImagesService';
import { BrowserEventEmitter } from '../../utils/BrowserEventEmitter';

export function ReferenceImages() {
  const [activeTab, setActiveTab] = useState<'images' | 'moodboards' | 'collections' | 'inspiration'>('images');
  const [images, setImages] = useState<ReferenceImage[]>([]);
  const [moodBoards, setMoodBoards] = useState<MoodBoard[]>([]);
  const [collections, setCollections] = useState<ImageCollection[]>([]);
  const [inspirationPrompts, setInspirationPrompts] = useState<InspirationPrompt[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<ReferenceImage['category'] | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showMoodBoardModal, setShowMoodBoardModal] = useState(false);
  const [selectedMoodBoard, setSelectedMoodBoard] = useState<MoodBoard | null>(null);
  const [newMoodBoardTitle, setNewMoodBoardTitle] = useState('');
  const [newMoodBoardTheme, setNewMoodBoardTheme] = useState('');
  const [selectedImage, setSelectedImage] = useState<ReferenceImage | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Restore persisted UI state
    try {
      const persisted = localStorage.getItem('referenceImages:ui');
      if (persisted) {
        const { searchQuery: q, filterCategory: c, viewMode: v } = JSON.parse(persisted);
        if (typeof q === 'string') setSearchQuery(q);
        if (c) setFilterCategory(c);
        if (v === 'grid' || v === 'list') setViewMode(v);
      }
    } catch {}

    loadData();
    
    const eventEmitter = BrowserEventEmitter.getInstance();
    const unsubscribers = [
      eventEmitter.on('image:added', loadData),
      eventEmitter.on('image:updated', loadData),
      eventEmitter.on('image:removed', loadData),
      eventEmitter.on('moodboard:created', loadData),
      eventEmitter.on('moodboard:updated', loadData),
      eventEmitter.on('collection:created', loadData),
      eventEmitter.on('prompts:generated', loadData)
    ];

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  // Persist UI state
  useEffect(() => {
    try {
      localStorage.setItem('referenceImages:ui', JSON.stringify({ searchQuery, filterCategory, viewMode }));
    } catch {}
  }, [searchQuery, filterCategory, viewMode]);

  const loadData = () => {
    setIsLoading(true);
    try {
      setImages(referenceImagesService.getAllImages());
      setMoodBoards(referenceImagesService.getAllMoodBoards());
      setCollections(referenceImagesService.getAllCollections());
      setInspirationPrompts(referenceImagesService.getUnusedPrompts());
    } finally {
      // Small timeout to allow image layout to stabilize before removing skeletons
      setTimeout(() => setIsLoading(false), 100);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        try {
          await referenceImagesService.addImage(file, {
            category: filterCategory !== 'all' ? filterCategory : 'other'
          });
        } catch (error) {
          console.error('Failed to upload image:', error);
        }
      }
    }
    setShowUploadModal(false);
  };

  const handleUrlUpload = async () => {
    const url = urlInputRef.current?.value;
    if (!url) return;
    
    try {
      await referenceImagesService.addImageFromUrl(url, {
        category: filterCategory !== 'all' ? filterCategory : 'other'
      });
      if (urlInputRef.current) {
        urlInputRef.current.value = '';
      }
      setShowUploadModal(false);
    } catch (error) {
      console.error('Failed to add image from URL:', error);
    }
  };

  const handleImageSelect = (imageId: string) => {
    const newSelection = new Set(selectedImages);
    if (newSelection.has(imageId)) {
      newSelection.delete(imageId);
    } else {
      newSelection.add(imageId);
    }
    setSelectedImages(newSelection);
  };

  const handleCreateMoodBoard = () => {
    if (!newMoodBoardTitle.trim()) return;
    
    const selectedImageObjects = Array.from(selectedImages)
      .map(id => referenceImagesService.getImage(id))
      .filter(Boolean) as ReferenceImage[];
    
    referenceImagesService.createMoodBoard({
      title: newMoodBoardTitle,
      theme: newMoodBoardTheme || 'General',
      color: '#3b82f6',
      images: selectedImageObjects,
      layout: 'grid',
      isPublic: false
    });
    
    setNewMoodBoardTitle('');
    setNewMoodBoardTheme('');
    setSelectedImages(new Set());
    setShowMoodBoardModal(false);
    setActiveTab('moodboards');
  };

  const handleGeneratePrompts = (imageId: string) => {
    referenceImagesService.generateInspirationPrompts(imageId, 3);
    setActiveTab('inspiration');
  };

  const handleDeleteImage = (imageId: string) => {
    if (confirm('Are you sure you want to delete this image?')) {
      referenceImagesService.removeImage(imageId);
    }
  };

  const getFilteredImages = () => {
    let filtered = images;
    
    if (searchQuery) {
      filtered = referenceImagesService.searchImages(searchQuery);
    }
    
    if (filterCategory !== 'all') {
      filtered = filtered.filter(img => img.category === filterCategory);
    }
    
    return filtered;
  };

  const renderImageGrid = () => {
    const filteredImages = getFilteredImages();
    
    if (filteredImages.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
          <ImageIcon className="w-16 h-16 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Images Found</h3>
          <p className="text-sm text-center max-w-md">
            {searchQuery ? 'Try adjusting your search criteria.' : 'Upload your first reference image to get started.'}
          </p>
        </div>
      );
    }

    return (
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4' : 'space-y-4'}>
        {filteredImages.map((image) => (
          <div
            key={image.id}
            className={`group relative rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
              selectedImages.has(image.id)
                ? 'border-blue-500 shadow-lg'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            onClick={() => handleImageSelect(image.id)}
          >
            <div className={viewMode === 'grid' ? 'aspect-square' : 'aspect-video'}>
              <img
                src={image.url}
                alt={image.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between">
                {/* Top Actions */}
                <div className="flex justify-between">
                  <div className="flex gap-1">
                    {selectedImages.has(image.id) && (
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage(image);
                      }}
                      className="p-1 bg-black/20 hover:bg-black/40 rounded text-white"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGeneratePrompts(image.id);
                      }}
                      className="p-1 bg-black/20 hover:bg-black/40 rounded text-white"
                      title="Generate prompts"
                    >
                      <Lightbulb className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteImage(image.id);
                      }}
                      className="p-1 bg-black/20 hover:bg-black/40 rounded text-white"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Bottom Info */}
                <div className="text-white">
                  <h4 className="font-medium text-sm truncate">{image.title}</h4>
                  {image.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {image.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="px-1 py-0.5 bg-black/30 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                      {image.tags.length > 3 && (
                        <span className="px-1 py-0.5 bg-black/30 rounded text-xs">
                          +{image.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderMoodBoards = () => (
    <div className="space-y-6">
      {moodBoards.map((board) => (
        <div key={board.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold dark:text-white">{board.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{board.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                  {board.theme}
                </span>
                <span className="text-xs text-gray-500">
                  {board.images.length} images
                </span>
                <span className="text-xs text-gray-500">
                  Updated {new Date(board.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedMoodBoard(board)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="View mood board"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => referenceImagesService.duplicateMoodBoard(board.id)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="Duplicate"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Preview Grid */}
          <div className="grid grid-cols-6 gap-2">
            {board.images.slice(0, 6).map((image, idx) => (
              <div key={idx} className="aspect-square rounded overflow-hidden">
                <img
                  src={image.url}
                  alt={image.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {board.images.length > 6 && (
              <div className="aspect-square rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  +{board.images.length - 6}
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderInspirationPrompts = () => (
    <div className="space-y-4">
      {inspirationPrompts.length === 0 ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          <Lightbulb className="w-16 h-16 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Inspiration Prompts</h3>
          <p className="text-sm">Select an image and generate prompts to get creative ideas.</p>
        </div>
      ) : (
        inspirationPrompts.map((prompt) => {
          const image = referenceImagesService.getImage(prompt.imageId);
          return (
            <div key={prompt.id} className="flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              {image && (
                <div className="w-20 h-20 rounded overflow-hidden flex-shrink-0">
                  <img
                    src={image.url}
                    alt={image.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs font-medium capitalize">
                    {prompt.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(prompt.generatedAt).toLocaleString()}
                  </span>
                </div>
                
                <p className="text-gray-900 dark:text-white mb-3">{prompt.text}</p>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => referenceImagesService.markPromptAsUsed(prompt.id)}
                    className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
                  >
                    Use This Prompt
                  </button>
                  <button
                    onClick={() => handleGeneratePrompts(prompt.imageId)}
                    className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm"
                  >
                    Generate More
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {isLoading && (
        <div className="animate-pulse space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-6 w-48 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-64 bg-gray-100 rounded" />
            </div>
            <div className="h-10 w-40 bg-gray-200 rounded" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold dark:text-white">Reference Images</h2>
          <p className="text-gray-600 dark:text-gray-400">Visual inspiration and mood boards</p>
        </div>
        
        <div className="flex gap-2">
          {selectedImages.size > 0 && (
            <button
              onClick={() => setShowMoodBoardModal(true)}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Mood Board ({selectedImages.size})
            </button>
          )}
          
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Add Images
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg mb-6">
        {[
          { id: 'images', label: 'Images', icon: ImageIcon },
          { id: 'moodboards', label: 'Mood Boards', icon: Palette },
          { id: 'collections', label: 'Collections', icon: Folder },
          { id: 'inspiration', label: 'Inspiration', icon: Lightbulb }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Images Tab Controls */}
      {activeTab === 'images' && (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search images..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Categories</option>
            <option value="character">Character</option>
            <option value="location">Location</option>
            <option value="object">Object</option>
            <option value="mood">Mood</option>
            <option value="style">Style</option>
            <option value="inspiration">Inspiration</option>
            <option value="other">Other</option>
          </select>
          
          {/* View Mode */}
          <div className="flex gap-1 border border-gray-300 dark:border-gray-600 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === 'images' && renderImageGrid()}
        {activeTab === 'moodboards' && renderMoodBoards()}
        {activeTab === 'collections' && (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            <Folder className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Collections</h3>
            <p className="text-sm">Organize your images into collections. Coming soon!</p>
          </div>
        )}
        {activeTab === 'inspiration' && renderInspirationPrompts()}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold dark:text-white mb-4">Add Images</h3>
            
            <div className="space-y-4">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium dark:text-white mb-2">Upload Files</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                />
              </div>
              
              {/* URL Input */}
              <div>
                <label className="block text-sm font-medium dark:text-white mb-2">Add from URL</label>
                <div className="flex gap-2">
                  <input
                    ref={urlInputRef}
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    onClick={handleUrlUpload}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mood Board Creation Modal */}
      {showMoodBoardModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold dark:text-white mb-4">Create Mood Board</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium dark:text-white mb-2">Title</label>
                <input
                  type="text"
                  value={newMoodBoardTitle}
                  onChange={(e) => setNewMoodBoardTitle(e.target.value)}
                  placeholder="Enter mood board title"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium dark:text-white mb-2">Theme</label>
                <input
                  type="text"
                  value={newMoodBoardTheme}
                  onChange={(e) => setNewMoodBoardTheme(e.target.value)}
                  placeholder="e.g., Dark Fantasy, Modern City, etc."
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {selectedImages.size} images will be added to this mood board.
              </p>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowMoodBoardModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateMoodBoard}
                disabled={!newMoodBoardTitle.trim()}
                className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white rounded"
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
