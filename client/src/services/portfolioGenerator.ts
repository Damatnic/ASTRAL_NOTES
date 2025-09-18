/**
 * Portfolio Website Generator Service
 * Creates beautiful, responsive portfolio websites from writing content
 * Supports multiple themes, layouts, and customization options
 */

import { EventEmitter } from 'events';

export interface PortfolioTheme {
  id: string;
  name: string;
  description: string;
  category: 'minimal' | 'creative' | 'professional' | 'literary' | 'academic';
  preview: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    codeFont: string;
  };
  layout: 'single-page' | 'multi-page' | 'blog-style' | 'magazine';
  features: string[];
  customizable: boolean;
}

export interface PortfolioConfig {
  title: string;
  subtitle?: string;
  author: {
    name: string;
    bio: string;
    avatar?: string;
    email?: string;
    social: {
      twitter?: string;
      linkedin?: string;
      github?: string;
      website?: string;
      instagram?: string;
    };
  };
  theme: string;
  layout: string;
  sections: PortfolioSection[];
  customCSS?: string;
  analytics?: {
    googleAnalytics?: string;
    plausible?: string;
  };
  seo: {
    description: string;
    keywords: string[];
    ogImage?: string;
  };
  domain?: string;
  favicon?: string;
}

export interface PortfolioSection {
  id: string;
  type: 'hero' | 'about' | 'portfolio' | 'writing' | 'testimonials' | 'contact' | 'blog' | 'custom';
  title: string;
  enabled: boolean;
  order: number;
  content?: any;
  settings: Record<string, any>;
}

export interface WritingPiece {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  publishedAt: number;
  featured: boolean;
  coverImage?: string;
  readingTime: number;
  wordCount: number;
}

export interface PortfolioProject {
  id: string;
  name: string;
  description: string;
  config: PortfolioConfig;
  status: 'draft' | 'building' | 'published' | 'error';
  createdAt: number;
  updatedAt: number;
  buildProgress: number;
  publishedUrl?: string;
  buildLog: string[];
  analytics?: {
    views: number;
    visitors: number;
    bounceRate: number;
    avgTimeOnSite: number;
  };
}

export interface BuildResult {
  success: boolean;
  files: GeneratedFile[];
  assets: string[];
  errors: string[];
  warnings: string[];
  buildTime: number;
  outputSize: number;
}

export interface GeneratedFile {
  path: string;
  content: string;
  type: 'html' | 'css' | 'js' | 'json' | 'image' | 'other';
  size: number;
}

class PortfolioGeneratorService extends EventEmitter {
  private themes: Map<string, PortfolioTheme> = new Map();
  private projects: Map<string, PortfolioProject> = new Map();
  private isInitialized = false;

  constructor() {
    super();
    this.initializeThemes();
    this.loadProjectsFromStorage();
  }

  private initializeThemes(): void {
    // Minimal themes
    this.themes.set('minimal_clean', {
      id: 'minimal_clean',
      name: 'Clean Minimal',
      description: 'A clean, minimal design focusing on typography and content',
      category: 'minimal',
      preview: '/themes/minimal_clean.jpg',
      colors: {
        primary: '#000000',
        secondary: '#666666',
        background: '#ffffff',
        text: '#333333',
        accent: '#007acc'
      },
      typography: {
        headingFont: 'Inter',
        bodyFont: 'Inter',
        codeFont: 'JetBrains Mono'
      },
      layout: 'single-page',
      features: ['responsive', 'dark-mode', 'typography-focused', 'minimal-animations'],
      customizable: true
    });

    this.themes.set('minimal_mono', {
      id: 'minimal_mono',
      name: 'Monochrome',
      description: 'Stark black and white design with bold typography',
      category: 'minimal',
      preview: '/themes/minimal_mono.jpg',
      colors: {
        primary: '#000000',
        secondary: '#ffffff',
        background: '#ffffff',
        text: '#000000',
        accent: '#000000'
      },
      typography: {
        headingFont: 'IBM Plex Serif',
        bodyFont: 'IBM Plex Sans',
        codeFont: 'IBM Plex Mono'
      },
      layout: 'multi-page',
      features: ['high-contrast', 'print-friendly', 'accessibility'],
      customizable: true
    });

    // Creative themes
    this.themes.set('creative_gradient', {
      id: 'creative_gradient',
      name: 'Gradient Flow',
      description: 'Dynamic gradients and fluid animations for creative portfolios',
      category: 'creative',
      preview: '/themes/creative_gradient.jpg',
      colors: {
        primary: '#6366f1',
        secondary: '#8b5cf6',
        background: '#0f172a',
        text: '#f8fafc',
        accent: '#06b6d4'
      },
      typography: {
        headingFont: 'Space Grotesk',
        bodyFont: 'Inter',
        codeFont: 'Fira Code'
      },
      layout: 'single-page',
      features: ['gradient-backgrounds', 'smooth-animations', 'parallax-scrolling', 'interactive-elements'],
      customizable: true
    });

    this.themes.set('creative_artistic', {
      id: 'creative_artistic',
      name: 'Artistic Expression',
      description: 'Bold colors and creative layouts for artistic portfolios',
      category: 'creative',
      preview: '/themes/creative_artistic.jpg',
      colors: {
        primary: '#f59e0b',
        secondary: '#ef4444',
        background: '#1f2937',
        text: '#f9fafb',
        accent: '#10b981'
      },
      typography: {
        headingFont: 'Playfair Display',
        bodyFont: 'Source Sans Pro',
        codeFont: 'Source Code Pro'
      },
      layout: 'magazine',
      features: ['asymmetric-layout', 'bold-colors', 'creative-typography', 'hover-effects'],
      customizable: true
    });

    // Professional themes
    this.themes.set('professional_corporate', {
      id: 'professional_corporate',
      name: 'Corporate Professional',
      description: 'Clean, professional design suitable for business portfolios',
      category: 'professional',
      preview: '/themes/professional_corporate.jpg',
      colors: {
        primary: '#1f2937',
        secondary: '#6b7280',
        background: '#ffffff',
        text: '#374151',
        accent: '#3b82f6'
      },
      typography: {
        headingFont: 'Roboto',
        bodyFont: 'Roboto',
        codeFont: 'Roboto Mono'
      },
      layout: 'multi-page',
      features: ['professional-layout', 'contact-forms', 'testimonials', 'case-studies'],
      customizable: true
    });

    // Literary themes
    this.themes.set('literary_classic', {
      id: 'literary_classic',
      name: 'Classic Literary',
      description: 'Traditional book-like design perfect for writers and authors',
      category: 'literary',
      preview: '/themes/literary_classic.jpg',
      colors: {
        primary: '#8b4513',
        secondary: '#d4af37',
        background: '#fefefe',
        text: '#2c1810',
        accent: '#dc143c'
      },
      typography: {
        headingFont: 'Crimson Text',
        bodyFont: 'Crimson Text',
        codeFont: 'Courier New'
      },
      layout: 'blog-style',
      features: ['serif-typography', 'reading-focused', 'chapter-navigation', 'author-bio'],
      customizable: true
    });

    this.themes.set('literary_modern', {
      id: 'literary_modern',
      name: 'Modern Literary',
      description: 'Contemporary design for modern writers and storytellers',
      category: 'literary',
      preview: '/themes/literary_modern.jpg',
      colors: {
        primary: '#1a202c',
        secondary: '#4a5568',
        background: '#f7fafc',
        text: '#2d3748',
        accent: '#805ad5'
      },
      typography: {
        headingFont: 'Merriweather',
        bodyFont: 'Source Serif Pro',
        codeFont: 'Inconsolata'
      },
      layout: 'blog-style',
      features: ['reading-progress', 'related-articles', 'author-notes', 'social-sharing'],
      customizable: true
    });

    // Academic themes
    this.themes.set('academic_journal', {
      id: 'academic_journal',
      name: 'Academic Journal',
      description: 'Clean, scholarly design for academic portfolios and publications',
      category: 'academic',
      preview: '/themes/academic_journal.jpg',
      colors: {
        primary: '#1a365d',
        secondary: '#2c5282',
        background: '#ffffff',
        text: '#2d3748',
        accent: '#3182ce'
      },
      typography: {
        headingFont: 'Lora',
        bodyFont: 'Open Sans',
        codeFont: 'Source Code Pro'
      },
      layout: 'multi-page',
      features: ['citation-support', 'bibliography', 'footnotes', 'academic-cv'],
      customizable: true
    });

    this.isInitialized = true;
    this.emit('initialized');
  }

  private loadProjectsFromStorage(): void {
    try {
      const projects = localStorage.getItem('astral_portfolio_projects');
      if (projects) {
        const projectData = JSON.parse(projects);
        Object.entries(projectData).forEach(([id, project]) => {
          this.projects.set(id, project as PortfolioProject);
        });
      }
    } catch (error) {
      console.error('Failed to load portfolio projects:', error);
    }
  }

  private saveProjectsToStorage(): void {
    try {
      const projectData = Object.fromEntries(this.projects);
      localStorage.setItem('astral_portfolio_projects', JSON.stringify(projectData));
    } catch (error) {
      console.error('Failed to save portfolio projects:', error);
    }
  }

  public async createPortfolio(name: string, config: PortfolioConfig): Promise<string> {
    const project: PortfolioProject = {
      id: this.generateProjectId(),
      name,
      description: config.subtitle || `Portfolio for ${config.author.name}`,
      config,
      status: 'draft',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      buildProgress: 0,
      buildLog: []
    };

    this.projects.set(project.id, project);
    this.saveProjectsToStorage();
    this.emit('portfolioCreated', project);

    return project.id;
  }

  public async updatePortfolio(projectId: string, config: Partial<PortfolioConfig>): Promise<void> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Portfolio project ${projectId} not found`);
    }

    project.config = { ...project.config, ...config };
    project.updatedAt = Date.now();
    project.status = 'draft';

    this.saveProjectsToStorage();
    this.emit('portfolioUpdated', project);
  }

  public async buildPortfolio(projectId: string): Promise<BuildResult> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Portfolio project ${projectId} not found`);
    }

    project.status = 'building';
    project.buildProgress = 0;
    project.buildLog = [];
    this.updateBuildProgress(projectId, 5, 'Starting build process...');

    try {
      // Load writing content
      const writingPieces = await this.loadWritingContent(project.config.sections);
      this.updateBuildProgress(projectId, 20, 'Loaded writing content');

      // Generate HTML files
      const htmlFiles = await this.generateHTML(project.config, writingPieces);
      this.updateBuildProgress(projectId, 50, 'Generated HTML files');

      // Generate CSS files
      const cssFiles = await this.generateCSS(project.config);
      this.updateBuildProgress(projectId, 70, 'Generated CSS files');

      // Generate JavaScript files
      const jsFiles = await this.generateJavaScript(project.config);
      this.updateBuildProgress(projectId, 85, 'Generated JavaScript files');

      // Generate assets and metadata
      const assetFiles = await this.generateAssets(project.config);
      const metaFiles = await this.generateMetadata(project.config);
      this.updateBuildProgress(projectId, 95, 'Generated assets and metadata');

      const allFiles = [...htmlFiles, ...cssFiles, ...jsFiles, ...assetFiles, ...metaFiles];
      const buildResult: BuildResult = {
        success: true,
        files: allFiles,
        assets: assetFiles.map(f => f.path),
        errors: [],
        warnings: [],
        buildTime: Date.now() - (project.updatedAt || 0),
        outputSize: allFiles.reduce((sum, file) => sum + file.size, 0)
      };

      project.status = 'published';
      project.buildProgress = 100;
      this.updateBuildProgress(projectId, 100, 'Build completed successfully');

      this.saveProjectsToStorage();
      this.emit('buildCompleted', project, buildResult);

      return buildResult;
    } catch (error) {
      project.status = 'error';
      const errorMsg = error instanceof Error ? error.message : 'Unknown build error';
      this.addToBuildLog(projectId, `Error: ${errorMsg}`);
      
      const buildResult: BuildResult = {
        success: false,
        files: [],
        assets: [],
        errors: [errorMsg],
        warnings: [],
        buildTime: Date.now() - (project.updatedAt || 0),
        outputSize: 0
      };

      this.emit('buildFailed', project, buildResult);
      return buildResult;
    }
  }

  private async loadWritingContent(sections: PortfolioSection[]): Promise<WritingPiece[]> {
    const writingPieces: WritingPiece[] = [];
    
    for (const section of sections) {
      if (section.type === 'writing' || section.type === 'portfolio') {
        // Load from localStorage - in a real app this would connect to your content management system
        try {
          const stories = this.getAllStoriesFromStorage();
          for (const story of stories) {
            writingPieces.push({
              id: story.id,
              title: story.title || 'Untitled',
              excerpt: this.generateExcerpt(story.content || ''),
              content: story.content || '',
              category: story.genre || 'General',
              tags: story.tags || [],
              publishedAt: story.updatedAt || story.createdAt || Date.now(),
              featured: story.featured || false,
              coverImage: story.coverImage,
              readingTime: this.calculateReadingTime(story.content || ''),
              wordCount: this.countWords(story.content || '')
            });
          }
        } catch (error) {
          console.warn('Failed to load writing content:', error);
        }
      }
    }

    return writingPieces.sort((a, b) => b.publishedAt - a.publishedAt);
  }

  private getAllStoriesFromStorage(): any[] {
    const stories = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('astral_story_')) {
        try {
          const storyData = localStorage.getItem(key);
          if (storyData) {
            stories.push(JSON.parse(storyData));
          }
        } catch (error) {
          console.warn(`Failed to load story from ${key}:`, error);
        }
      }
    }
    return stories;
  }

  private generateExcerpt(content: string, maxLength: number = 150): string {
    const plainText = content.replace(/<[^>]*>/g, '').trim();
    if (plainText.length <= maxLength) return plainText;
    
    const truncated = plainText.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + '...';
  }

  private calculateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = this.countWords(content);
    return Math.ceil(wordCount / wordsPerMinute);
  }

  private countWords(content: string): number {
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  private async generateHTML(config: PortfolioConfig, writingPieces: WritingPiece[]): Promise<GeneratedFile[]> {
    const theme = this.themes.get(config.theme);
    if (!theme) {
      throw new Error(`Theme ${config.theme} not found`);
    }

    const files: GeneratedFile[] = [];

    // Generate main index.html
    const indexHtml = this.generateIndexHTML(config, theme, writingPieces);
    files.push({
      path: 'index.html',
      content: indexHtml,
      type: 'html',
      size: new Blob([indexHtml]).size
    });

    // Generate individual writing piece pages if multi-page layout
    if (theme.layout === 'multi-page' || theme.layout === 'blog-style') {
      for (const piece of writingPieces) {
        const pieceHtml = this.generateWritingPieceHTML(config, theme, piece, writingPieces);
        files.push({
          path: `writing/${piece.id}.html`,
          content: pieceHtml,
          type: 'html',
          size: new Blob([pieceHtml]).size
        });
      }

      // Generate writing index page
      const writingIndexHtml = this.generateWritingIndexHTML(config, theme, writingPieces);
      files.push({
        path: 'writing/index.html',
        content: writingIndexHtml,
        type: 'html',
        size: new Blob([writingIndexHtml]).size
      });
    }

    // Generate about page if multi-page
    if (theme.layout === 'multi-page') {
      const aboutHtml = this.generateAboutHTML(config, theme);
      files.push({
        path: 'about.html',
        content: aboutHtml,
        type: 'html',
        size: new Blob([aboutHtml]).size
      });

      // Generate contact page
      const contactHtml = this.generateContactHTML(config, theme);
      files.push({
        path: 'contact.html',
        content: contactHtml,
        type: 'html',
        size: new Blob([contactHtml]).size
      });
    }

    return files;
  }

  private generateIndexHTML(config: PortfolioConfig, theme: PortfolioTheme, writingPieces: WritingPiece[]): string {
    const sections = config.sections
      .filter(section => section.enabled)
      .sort((a, b) => a.order - b.order);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.title}</title>
    <meta name="description" content="${config.seo.description}">
    <meta name="keywords" content="${config.seo.keywords.join(', ')}">
    <meta name="author" content="${config.author.name}">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${config.title}">
    <meta property="og:description" content="${config.seo.description}">
    <meta property="og:type" content="website">
    ${config.seo.ogImage ? `<meta property="og:image" content="${config.seo.ogImage}">` : ''}
    
    <!-- Favicon -->
    ${config.favicon ? `<link rel="icon" href="${config.favicon}">` : ''}
    
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=${this.formatGoogleFontName(theme.typography.headingFont)}:wght@300;400;600;700&family=${this.formatGoogleFontName(theme.typography.bodyFont)}:wght@300;400;500;600&family=${this.formatGoogleFontName(theme.typography.codeFont)}:wght@400;500&display=swap" rel="stylesheet">
    
    <!-- Styles -->
    <link rel="stylesheet" href="styles/main.css">
    <link rel="stylesheet" href="styles/theme.css">
    
    <!-- Analytics -->
    ${config.analytics?.googleAnalytics ? this.generateGoogleAnalytics(config.analytics.googleAnalytics) : ''}
</head>
<body class="theme-${theme.id}">
    ${this.generateNavigation(config, theme)}
    
    <main>
        ${sections.map(section => this.generateSectionHTML(section, config, theme, writingPieces)).join('\n')}
    </main>
    
    ${this.generateFooter(config, theme)}
    
    <script src="scripts/main.js"></script>
    ${theme.features.includes('smooth-animations') ? '<script src="scripts/animations.js"></script>' : ''}
</body>
</html>`;
  }

  private formatGoogleFontName(fontName: string): string {
    return fontName.replace(/\s+/g, '+');
  }

  private generateGoogleAnalytics(trackingId: string): string {
    return `
    <!-- Global site tag (gtag.js) - Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=${trackingId}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${trackingId}');
    </script>`;
  }

  private generateNavigation(config: PortfolioConfig, theme: PortfolioTheme): string {
    const enabledSections = config.sections.filter(s => s.enabled).sort((a, b) => a.order - b.order);
    
    return `
    <nav class="main-nav">
        <div class="nav-container">
            <a href="#" class="nav-brand">${config.author.name}</a>
            <ul class="nav-links">
                ${enabledSections.map(section => `
                    <li><a href="#${section.id}">${section.title}</a></li>
                `).join('')}
            </ul>
            <button class="nav-toggle" aria-label="Toggle navigation">
                <span></span>
                <span></span>
                <span></span>
            </button>
        </div>
    </nav>`;
  }

  private generateSectionHTML(section: PortfolioSection, config: PortfolioConfig, theme: PortfolioTheme, writingPieces: WritingPiece[]): string {
    switch (section.type) {
      case 'hero':
        return this.generateHeroSection(section, config, theme);
      case 'about':
        return this.generateAboutSection(section, config, theme);
      case 'writing':
        return this.generateWritingSection(section, config, theme, writingPieces);
      case 'portfolio':
        return this.generatePortfolioSection(section, config, theme, writingPieces);
      case 'contact':
        return this.generateContactSection(section, config, theme);
      default:
        return `<section id="${section.id}" class="section section-${section.type}">
                    <div class="container">
                        <h2>${section.title}</h2>
                        <p>Custom section content would go here.</p>
                    </div>
                </section>`;
    }
  }

  private generateHeroSection(section: PortfolioSection, config: PortfolioConfig, theme: PortfolioTheme): string {
    return `
    <section id="${section.id}" class="section hero-section">
        <div class="hero-container">
            <div class="hero-content">
                ${config.author.avatar ? `<div class="hero-avatar">
                    <img src="${config.author.avatar}" alt="${config.author.name}">
                </div>` : ''}
                <h1 class="hero-title">${config.title}</h1>
                ${config.subtitle ? `<p class="hero-subtitle">${config.subtitle}</p>` : ''}
                <p class="hero-bio">${config.author.bio}</p>
                <div class="hero-actions">
                    <a href="#writing" class="btn btn-primary">View My Work</a>
                    <a href="#contact" class="btn btn-secondary">Get In Touch</a>
                </div>
                ${Object.keys(config.author.social).length > 0 ? `
                <div class="hero-social">
                    ${this.generateSocialLinks(config.author.social)}
                </div>` : ''}
            </div>
        </div>
    </section>`;
  }

  private generateAboutSection(section: PortfolioSection, config: PortfolioConfig, theme: PortfolioTheme): string {
    return `
    <section id="${section.id}" class="section about-section">
        <div class="container">
            <h2 class="section-title">${section.title}</h2>
            <div class="about-content">
                <div class="about-text">
                    <p>${config.author.bio}</p>
                    ${section.content?.additionalInfo ? `<p>${section.content.additionalInfo}</p>` : ''}
                </div>
                ${config.author.avatar ? `
                <div class="about-image">
                    <img src="${config.author.avatar}" alt="${config.author.name}">
                </div>` : ''}
            </div>
        </div>
    </section>`;
  }

  private generateWritingSection(section: PortfolioSection, config: PortfolioConfig, theme: PortfolioTheme, writingPieces: WritingPiece[]): string {
    const featuredPieces = writingPieces.filter(p => p.featured).slice(0, 3);
    const recentPieces = writingPieces.slice(0, 6);

    return `
    <section id="${section.id}" class="section writing-section">
        <div class="container">
            <h2 class="section-title">${section.title}</h2>
            
            ${featuredPieces.length > 0 ? `
            <div class="featured-writing">
                <h3>Featured Work</h3>
                <div class="writing-grid featured-grid">
                    ${featuredPieces.map(piece => this.generateWritingCard(piece, true)).join('')}
                </div>
            </div>` : ''}
            
            <div class="recent-writing">
                <h3>Recent Writing</h3>
                <div class="writing-grid">
                    ${recentPieces.map(piece => this.generateWritingCard(piece, false)).join('')}
                </div>
            </div>
            
            <div class="writing-actions">
                <a href="writing/" class="btn btn-primary">View All Writing</a>
            </div>
        </div>
    </section>`;
  }

  private generateWritingCard(piece: WritingPiece, featured: boolean): string {
    return `
    <article class="writing-card ${featured ? 'featured' : ''}">
        ${piece.coverImage ? `<div class="writing-image">
            <img src="${piece.coverImage}" alt="${piece.title}">
        </div>` : ''}
        <div class="writing-content">
            <h4><a href="writing/${piece.id}.html">${piece.title}</a></h4>
            <p class="writing-excerpt">${piece.excerpt}</p>
            <div class="writing-meta">
                <span class="writing-date">${new Date(piece.publishedAt).toLocaleDateString()}</span>
                <span class="writing-reading-time">${piece.readingTime} min read</span>
                <span class="writing-category">${piece.category}</span>
            </div>
            ${piece.tags.length > 0 ? `
            <div class="writing-tags">
                ${piece.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>` : ''}
        </div>
    </article>`;
  }

  private generatePortfolioSection(section: PortfolioSection, config: PortfolioConfig, theme: PortfolioTheme, writingPieces: WritingPiece[]): string {
    const portfolioPieces = writingPieces.slice(0, 6);

    return `
    <section id="${section.id}" class="section portfolio-section">
        <div class="container">
            <h2 class="section-title">${section.title}</h2>
            <div class="portfolio-grid">
                ${portfolioPieces.map(piece => `
                <div class="portfolio-item">
                    <h4>${piece.title}</h4>
                    <p class="portfolio-excerpt">${piece.excerpt}</p>
                    <div class="portfolio-meta">
                        <span>${piece.category}</span>
                        <span>${piece.wordCount} words</span>
                    </div>
                    <a href="writing/${piece.id}.html" class="portfolio-link">Read More</a>
                </div>
                `).join('')}
            </div>
        </div>
    </section>`;
  }

  private generateContactSection(section: PortfolioSection, config: PortfolioConfig, theme: PortfolioTheme): string {
    return `
    <section id="${section.id}" class="section contact-section">
        <div class="container">
            <h2 class="section-title">${section.title}</h2>
            <div class="contact-content">
                <div class="contact-info">
                    <p>I'd love to hear from you. Send me a message and I'll respond as soon as possible.</p>
                    ${config.author.email ? `<p class="contact-email">
                        <a href="mailto:${config.author.email}">${config.author.email}</a>
                    </p>` : ''}
                    ${Object.keys(config.author.social).length > 0 ? `
                    <div class="contact-social">
                        ${this.generateSocialLinks(config.author.social)}
                    </div>` : ''}
                </div>
                <form class="contact-form" action="#" method="POST">
                    <div class="form-group">
                        <label for="name">Name</label>
                        <input type="text" id="name" name="name" required>
                    </div>
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label for="subject">Subject</label>
                        <input type="text" id="subject" name="subject" required>
                    </div>
                    <div class="form-group">
                        <label for="message">Message</label>
                        <textarea id="message" name="message" rows="5" required></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">Send Message</button>
                </form>
            </div>
        </div>
    </section>`;
  }

  private generateSocialLinks(social: any): string {
    return Object.entries(social)
      .filter(([platform, url]) => url)
      .map(([platform, url]) => `
        <a href="${url}" class="social-link social-${platform}" target="_blank" rel="noopener noreferrer">
            <span class="sr-only">${platform}</span>
            <svg class="social-icon" aria-hidden="true">
                <use xlink:href="#icon-${platform}"></use>
            </svg>
        </a>
      `).join('');
  }

  private generateWritingPieceHTML(config: PortfolioConfig, theme: PortfolioTheme, piece: WritingPiece, allPieces: WritingPiece[]): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${piece.title} - ${config.title}</title>
    <meta name="description" content="${piece.excerpt}">
    
    <link rel="stylesheet" href="../styles/main.css">
    <link rel="stylesheet" href="../styles/theme.css">
    <link rel="stylesheet" href="../styles/article.css">
</head>
<body class="theme-${theme.id}">
    ${this.generateNavigation(config, theme)}
    
    <main class="article-main">
        <article class="article">
            <header class="article-header">
                <h1 class="article-title">${piece.title}</h1>
                <div class="article-meta">
                    <time class="article-date">${new Date(piece.publishedAt).toLocaleDateString()}</time>
                    <span class="article-reading-time">${piece.readingTime} min read</span>
                    <span class="article-word-count">${piece.wordCount} words</span>
                </div>
                ${piece.tags.length > 0 ? `
                <div class="article-tags">
                    ${piece.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>` : ''}
            </header>
            
            <div class="article-content">
                ${this.formatArticleContent(piece.content)}
            </div>
            
            <footer class="article-footer">
                <div class="article-author">
                    ${config.author.avatar ? `<img src="${config.author.avatar}" alt="${config.author.name}">` : ''}
                    <div class="author-info">
                        <h4>${config.author.name}</h4>
                        <p>${config.author.bio}</p>
                    </div>
                </div>
            </footer>
        </article>
        
        <aside class="article-sidebar">
            <div class="related-articles">
                <h3>More Writing</h3>
                ${allPieces.filter(p => p.id !== piece.id).slice(0, 3).map(p => `
                    <a href="${p.id}.html" class="related-link">
                        <h4>${p.title}</h4>
                        <p>${p.excerpt}</p>
                    </a>
                `).join('')}
            </div>
        </aside>
    </main>
    
    ${this.generateFooter(config, theme)}
    
    <script src="../scripts/main.js"></script>
</body>
</html>`;
  }

  private formatArticleContent(content: string): string {
    // Convert plain text to HTML with basic formatting
    return content
      .split('\n\n')
      .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
      .join('');
  }

  private generateWritingIndexHTML(config: PortfolioConfig, theme: PortfolioTheme, writingPieces: WritingPiece[]): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Writing - ${config.title}</title>
    <meta name="description" content="All writing by ${config.author.name}">
    
    <link rel="stylesheet" href="../styles/main.css">
    <link rel="stylesheet" href="../styles/theme.css">
</head>
<body class="theme-${theme.id}">
    ${this.generateNavigation(config, theme)}
    
    <main class="writing-index">
        <header class="page-header">
            <h1>All Writing</h1>
            <p>Collection of articles, stories, and thoughts by ${config.author.name}</p>
        </header>
        
        <div class="writing-list">
            ${writingPieces.map(piece => this.generateWritingCard(piece, false)).join('')}
        </div>
    </main>
    
    ${this.generateFooter(config, theme)}
    
    <script src="../scripts/main.js"></script>
</body>
</html>`;
  }

  private generateAboutHTML(config: PortfolioConfig, theme: PortfolioTheme): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>About - ${config.title}</title>
    <meta name="description" content="About ${config.author.name}">
    
    <link rel="stylesheet" href="styles/main.css">
    <link rel="stylesheet" href="styles/theme.css">
</head>
<body class="theme-${theme.id}">
    ${this.generateNavigation(config, theme)}
    
    <main class="about-page">
        <header class="page-header">
            <h1>About ${config.author.name}</h1>
        </header>
        
        <div class="about-content">
            ${config.author.avatar ? `<img src="${config.author.avatar}" alt="${config.author.name}" class="about-image">` : ''}
            <div class="about-text">
                <p>${config.author.bio}</p>
            </div>
        </div>
    </main>
    
    ${this.generateFooter(config, theme)}
    
    <script src="scripts/main.js"></script>
</body>
</html>`;
  }

  private generateContactHTML(config: PortfolioConfig, theme: PortfolioTheme): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contact - ${config.title}</title>
    <meta name="description" content="Contact ${config.author.name}">
    
    <link rel="stylesheet" href="styles/main.css">
    <link rel="stylesheet" href="styles/theme.css">
</head>
<body class="theme-${theme.id}">
    ${this.generateNavigation(config, theme)}
    
    <main class="contact-page">
        <header class="page-header">
            <h1>Contact</h1>
            <p>Get in touch with ${config.author.name}</p>
        </header>
        
        ${this.generateContactSection({ id: 'contact', type: 'contact', title: '', enabled: true, order: 0, settings: {} }, config, theme)}
    </main>
    
    ${this.generateFooter(config, theme)}
    
    <script src="scripts/main.js"></script>
</body>
</html>`;
  }

  private generateFooter(config: PortfolioConfig, theme: PortfolioTheme): string {
    return `
    <footer class="main-footer">
        <div class="container">
            <div class="footer-content">
                <p>&copy; ${new Date().getFullYear()} ${config.author.name}. All rights reserved.</p>
                ${Object.keys(config.author.social).length > 0 ? `
                <div class="footer-social">
                    ${this.generateSocialLinks(config.author.social)}
                </div>` : ''}
            </div>
        </div>
    </footer>`;
  }

  private async generateCSS(config: PortfolioConfig): Promise<GeneratedFile[]> {
    const theme = this.themes.get(config.theme);
    if (!theme) {
      throw new Error(`Theme ${config.theme} not found`);
    }

    const files: GeneratedFile[] = [];

    // Main CSS
    const mainCss = this.generateMainCSS(config, theme);
    files.push({
      path: 'styles/main.css',
      content: mainCss,
      type: 'css',
      size: new Blob([mainCss]).size
    });

    // Theme-specific CSS
    const themeCss = this.generateThemeCSS(config, theme);
    files.push({
      path: 'styles/theme.css',
      content: themeCss,
      type: 'css',
      size: new Blob([themeCss]).size
    });

    // Article-specific CSS
    const articleCss = this.generateArticleCSS(config, theme);
    files.push({
      path: 'styles/article.css',
      content: articleCss,
      type: 'css',
      size: new Blob([articleCss]).size
    });

    return files;
  }

  private generateMainCSS(config: PortfolioConfig, theme: PortfolioTheme): string {
    return `/* Main Styles for ${config.title} */

:root {
  --color-primary: ${theme.colors.primary};
  --color-secondary: ${theme.colors.secondary};
  --color-background: ${theme.colors.background};
  --color-text: ${theme.colors.text};
  --color-accent: ${theme.colors.accent};
  
  --font-heading: "${theme.typography.headingFont}", serif;
  --font-body: "${theme.typography.bodyFont}", sans-serif;
  --font-code: "${theme.typography.codeFont}", monospace;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.6;
  color: var(--color-text);
  background-color: var(--color-background);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Typography */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  font-weight: 600;
  line-height: 1.2;
  margin-bottom: 1rem;
}

h1 { font-size: 2.5rem; }
h2 { font-size: 2rem; }
h3 { font-size: 1.5rem; }
h4 { font-size: 1.25rem; }

p {
  margin-bottom: 1rem;
}

a {
  color: var(--color-accent);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

/* Buttons */
.btn {
  display: inline-block;
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-secondary {
  background-color: transparent;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

/* Navigation */
.main-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: var(--color-background);
  border-bottom: 1px solid rgba(0,0,0,0.1);
  z-index: 1000;
}

.nav-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
}

.nav-brand {
  font-family: var(--font-heading);
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-primary);
}

.nav-links {
  display: flex;
  list-style: none;
  gap: 2rem;
}

.nav-links a {
  color: var(--color-text);
  font-weight: 500;
}

/* Sections */
.section {
  padding: 80px 0;
}

.section-title {
  text-align: center;
  margin-bottom: 3rem;
}

/* Hero Section */
.hero-section {
  min-height: 100vh;
  display: flex;
  align-items: center;
  text-align: center;
}

.hero-title {
  font-size: 3.5rem;
  margin-bottom: 1rem;
}

.hero-subtitle {
  font-size: 1.5rem;
  margin-bottom: 2rem;
  color: var(--color-secondary);
}

.hero-bio {
  font-size: 1.1rem;
  max-width: 600px;
  margin: 0 auto 2rem;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 2rem;
}

.hero-avatar img {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 2rem;
}

/* Writing Section */
.writing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.writing-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.2s ease;
}

.writing-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}

.writing-card h4 {
  margin-bottom: 0.5rem;
}

.writing-excerpt {
  color: var(--color-secondary);
  margin-bottom: 1rem;
}

.writing-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: var(--color-secondary);
  margin-bottom: 1rem;
}

.writing-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tag {
  background-color: var(--color-accent);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

/* Contact Section */
.contact-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  max-width: 800px;
  margin: 0 auto;
}

.contact-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 16px;
}

/* Footer */
.main-footer {
  background-color: var(--color-primary);
  color: white;
  text-align: center;
  padding: 2rem 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .container {
    padding: 0 16px;
  }
  
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .writing-grid {
    grid-template-columns: 1fr;
  }
  
  .contact-content {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  
  .nav-links {
    display: none;
  }
}`;
  }

  private generateThemeCSS(config: PortfolioConfig, theme: PortfolioTheme): string {
    let themeStyles = `/* Theme: ${theme.name} */\n\n`;

    // Add theme-specific styles based on theme features
    if (theme.features.includes('gradient-backgrounds')) {
      themeStyles += `
.hero-section {
  background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary});
  color: white;
}

.hero-section .hero-title,
.hero-section .hero-subtitle,
.hero-section .hero-bio {
  color: white;
}
`;
    }

    if (theme.features.includes('dark-mode')) {
      themeStyles += `
@media (prefers-color-scheme: dark) {
  :root {
    --color-background: #1a1a1a;
    --color-text: #ffffff;
  }
  
  .writing-card {
    background: #2a2a2a;
    color: white;
  }
}
`;
    }

    if (theme.features.includes('smooth-animations')) {
      themeStyles += `
* {
  transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
}

.writing-card {
  transform: translateZ(0);
}

.writing-card:hover {
  transform: translateY(-8px) scale(1.02);
}
`;
    }

    return themeStyles;
  }

  private generateArticleCSS(config: PortfolioConfig, theme: PortfolioTheme): string {
    return `/* Article Styles */

.article-main {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 3rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 120px 20px 40px;
}

.article {
  max-width: 800px;
}

.article-header {
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #eee;
}

.article-title {
  font-size: 2.5rem;
  line-height: 1.2;
  margin-bottom: 1rem;
}

.article-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: var(--color-secondary);
  margin-bottom: 1rem;
}

.article-content {
  font-size: 1.1rem;
  line-height: 1.8;
}

.article-content p {
  margin-bottom: 1.5rem;
}

.article-footer {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #eee;
}

.article-author {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.article-author img {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
}

.article-sidebar {
  position: sticky;
  top: 120px;
  height: fit-content;
}

.related-articles h3 {
  margin-bottom: 1rem;
}

.related-link {
  display: block;
  padding: 1rem;
  margin-bottom: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  text-decoration: none;
  color: var(--color-text);
}

.related-link:hover {
  background: #e9ecef;
}

.related-link h4 {
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

.related-link p {
  font-size: 0.9rem;
  color: var(--color-secondary);
}

@media (max-width: 768px) {
  .article-main {
    grid-template-columns: 1fr;
    padding-top: 100px;
  }
  
  .article-sidebar {
    position: static;
    order: -1;
  }
  
  .article-title {
    font-size: 2rem;
  }
}`;
  }

  private async generateJavaScript(config: PortfolioConfig): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    // Main JavaScript
    const mainJs = this.generateMainJS(config);
    files.push({
      path: 'scripts/main.js',
      content: mainJs,
      type: 'js',
      size: new Blob([mainJs]).size
    });

    // Animations JavaScript if theme supports it
    const theme = this.themes.get(config.theme);
    if (theme?.features.includes('smooth-animations')) {
      const animationsJs = this.generateAnimationsJS(config);
      files.push({
        path: 'scripts/animations.js',
        content: animationsJs,
        type: 'js',
        size: new Blob([animationsJs]).size
      });
    }

    return files;
  }

  private generateMainJS(config: PortfolioConfig): string {
    return `/* Main JavaScript for ${config.title} */

// Smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function() {
  // Mobile navigation toggle
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function() {
      navLinks.classList.toggle('active');
    });
  }
  
  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
  
  // Contact form handling
  const contactForm = document.querySelector('.contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Simple form validation
      const formData = new FormData(this);
      const name = formData.get('name');
      const email = formData.get('email');
      const message = formData.get('message');
      
      if (name && email && message) {
        // In a real implementation, this would send the form data to a server
        alert('Thank you for your message! I\\'ll get back to you soon.');
        this.reset();
      } else {
        alert('Please fill in all required fields.');
      }
    });
  }
  
  // Reading progress indicator for articles
  if (document.querySelector('.article-content')) {
    let progress = document.createElement('div');
    progress.className = 'reading-progress';
    progress.style.cssText = \`
      position: fixed;
      top: 0;
      left: 0;
      width: 0%;
      height: 3px;
      background: var(--color-accent);
      z-index: 1001;
      transition: width 0.3s ease;
    \`;
    document.body.appendChild(progress);
    
    window.addEventListener('scroll', function() {
      const article = document.querySelector('.article-content');
      if (article) {
        const scrolled = window.scrollY;
        const articleTop = article.offsetTop;
        const articleHeight = article.offsetHeight;
        const windowHeight = window.innerHeight;
        
        const start = articleTop - windowHeight / 2;
        const end = articleTop + articleHeight - windowHeight / 2;
        
        if (scrolled >= start && scrolled <= end) {
          const progressPercent = ((scrolled - start) / (end - start)) * 100;
          progress.style.width = Math.min(progressPercent, 100) + '%';
        } else if (scrolled < start) {
          progress.style.width = '0%';
        } else {
          progress.style.width = '100%';
        }
      }
    });
  }
});`;
  }

  private generateAnimationsJS(config: PortfolioConfig): string {
    return `/* Animation JavaScript for ${config.title} */

document.addEventListener('DOMContentLoaded', function() {
  // Intersection Observer for fade-in animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  };
  
  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  }, observerOptions);
  
  // Observe all sections and cards
  document.querySelectorAll('.section, .writing-card, .portfolio-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
  
  // Parallax effect for hero section
  const hero = document.querySelector('.hero-section');
  if (hero) {
    window.addEventListener('scroll', function() {
      const scrolled = window.pageYOffset;
      const parallax = scrolled * 0.5;
      hero.style.transform = \`translateY(\${parallax}px)\`;
    });
  }
  
  // Typing effect for hero title
  const heroTitle = document.querySelector('.hero-title');
  if (heroTitle) {
    const text = heroTitle.textContent;
    heroTitle.textContent = '';
    
    let i = 0;
    const typeWriter = function() {
      if (i < text.length) {
        heroTitle.textContent += text.charAt(i);
        i++;
        setTimeout(typeWriter, 100);
      }
    };
    
    // Start typing animation after a delay
    setTimeout(typeWriter, 1000);
  }
});

// CSS for animations
const animationStyles = document.createElement('style');
animationStyles.textContent = \`
  .animate-in {
    opacity: 1 !important;
    transform: translateY(0) !important;
  }
  
  .writing-card:hover {
    animation: cardFloat 0.3s ease forwards;
  }
  
  @keyframes cardFloat {
    to {
      transform: translateY(-8px) scale(1.02);
      box-shadow: 0 12px 32px rgba(0,0,0,0.15);
    }
  }
\`;
document.head.appendChild(animationStyles);`;
  }

  private async generateAssets(config: PortfolioConfig): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    // Generate social media icons
    const iconsContent = this.generateSocialIcons();
    files.push({
      path: 'assets/icons.svg',
      content: iconsContent,
      type: 'image',
      size: new Blob([iconsContent]).size
    });

    // Generate robots.txt
    const robotsContent = this.generateRobotsTxt(config);
    files.push({
      path: 'robots.txt',
      content: robotsContent,
      type: 'other',
      size: new Blob([robotsContent]).size
    });

    // Generate sitemap.xml
    const sitemapContent = this.generateSitemap(config);
    files.push({
      path: 'sitemap.xml',
      content: sitemapContent,
      type: 'other',
      size: new Blob([sitemapContent]).size
    });

    return files;
  }

  private generateSocialIcons(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
  <symbol id="icon-twitter" viewBox="0 0 24 24">
    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
  </symbol>
  
  <symbol id="icon-linkedin" viewBox="0 0 24 24">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </symbol>
  
  <symbol id="icon-github" viewBox="0 0 24 24">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </symbol>
  
  <symbol id="icon-instagram" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </symbol>
  
  <symbol id="icon-website" viewBox="0 0 24 24">
    <path d="M12 0C5.374 0 0 5.373 0 12s5.374 12 12 12 12-5.373 12-12S18.626 0 12 0zm7.568 8.16h-3.65c-.246-1.483-.781-2.765-1.431-3.56C16.713 5.524 18.377 6.66 19.568 8.16zM20 12c0 1.104-.167 2.173-.464 3.183h-3.262c.135-.99.218-2.012.218-3.183 0-1.171-.083-2.193-.218-3.183h3.262C19.833 9.827 20 10.896 20 12zM12 20c-2.29 0-4.25-3.374-4.25-8S9.71 4 12 4s4.25 3.374 4.25 8-1.96 8-4.25 8zm-7.568-3.84h3.65c.246 1.483.781 2.765 1.431 3.56C7.287 18.476 5.623 17.34 4.432 16.16zM4 12c0-1.104.167-2.173.464-3.183h3.262C7.591 9.807 7.508 10.829 7.508 12c0 1.171.083 2.193.218 3.183H4.464C4.167 14.173 4 13.104 4 12z"/>
  </symbol>
</svg>`;
  }

  private generateRobotsTxt(config: PortfolioConfig): string {
    return `User-agent: *
Allow: /

Sitemap: ${config.domain ? `https://${config.domain}/sitemap.xml` : '/sitemap.xml'}`;
  }

  private generateSitemap(config: PortfolioConfig): string {
    const baseUrl = config.domain ? `https://${config.domain}` : '';
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/writing/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/about.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${baseUrl}/contact.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <priority>0.5</priority>
  </url>
</urlset>`;
  }

  private async generateMetadata(config: PortfolioConfig): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    // Generate manifest.json for PWA
    const manifest = {
      name: config.title,
      short_name: config.author.name,
      description: config.seo.description,
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: this.themes.get(config.theme)?.colors.primary || '#000000',
      icons: [
        {
          src: 'assets/icon-192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: 'assets/icon-512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    };

    files.push({
      path: 'manifest.json',
      content: JSON.stringify(manifest, null, 2),
      type: 'json',
      size: new Blob([JSON.stringify(manifest, null, 2)]).size
    });

    return files;
  }

  private updateBuildProgress(projectId: string, progress: number, message: string): void {
    const project = this.projects.get(projectId);
    if (project) {
      project.buildProgress = progress;
      this.addToBuildLog(projectId, message);
      this.emit('buildProgress', project, progress, message);
    }
  }

  private addToBuildLog(projectId: string, message: string): void {
    const project = this.projects.get(projectId);
    if (project) {
      project.buildLog.push(`${new Date().toISOString()}: ${message}`);
    }
  }

  private generateProjectId(): string {
    return `portfolio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods
  public getAvailableThemes(): PortfolioTheme[] {
    return Array.from(this.themes.values());
  }

  public getTheme(themeId: string): PortfolioTheme | null {
    return this.themes.get(themeId) || null;
  }

  public getAllProjects(): PortfolioProject[] {
    return Array.from(this.projects.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  public getProject(projectId: string): PortfolioProject | null {
    return this.projects.get(projectId) || null;
  }

  public async deleteProject(projectId: string): Promise<boolean> {
    if (this.projects.has(projectId)) {
      this.projects.delete(projectId);
      this.saveProjectsToStorage();
      this.emit('projectDeleted', projectId);
      return true;
    }
    return false;
  }

  public async duplicateProject(projectId: string, newName: string): Promise<string> {
    const originalProject = this.projects.get(projectId);
    if (!originalProject) {
      throw new Error(`Project ${projectId} not found`);
    }

    const newProject: PortfolioProject = {
      ...originalProject,
      id: this.generateProjectId(),
      name: newName,
      status: 'draft',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      buildProgress: 0,
      buildLog: [],
      publishedUrl: undefined
    };

    this.projects.set(newProject.id, newProject);
    this.saveProjectsToStorage();
    this.emit('projectCreated', newProject);

    return newProject.id;
  }
}

export default new PortfolioGeneratorService();