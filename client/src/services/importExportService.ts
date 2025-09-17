/**
 * Import/Export Service
 * Handles importing and exporting stories in various formats
 */

import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak } from 'docx';
import { marked } from 'marked';
import type { Project, Story, Scene, Character, Location, Note } from '@/types/story';

export interface ExportOptions {
  format: 'markdown' | 'docx' | 'epub' | 'pdf' | 'scrivener' | 'json' | 'html';
  includeMetadata?: boolean;
  includeNotes?: boolean;
  includeCharacters?: boolean;
  includeLocations?: boolean;
  includeOutline?: boolean;
  separateChapters?: boolean;
  fontSize?: number;
  fontFamily?: string;
  pageSize?: 'A4' | 'Letter' | 'A5';
  margins?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export interface ImportResult {
  success: boolean;
  project?: Project;
  errors?: string[];
  warnings?: string[];
}

class ImportExportService {
  private static instance: ImportExportService;

  private constructor() {}

  public static getInstance(): ImportExportService {
    if (!ImportExportService.instance) {
      ImportExportService.instance = new ImportExportService();
    }
    return ImportExportService.instance;
  }

  /**
   * Export a project in the specified format
   */
  public async exportProject(
    project: Project,
    stories: Story[],
    scenes: Scene[],
    options: ExportOptions
  ): Promise<void> {
    switch (options.format) {
      case 'markdown':
        return this.exportToMarkdown(project, stories, scenes, options);
      case 'docx':
        return this.exportToDocx(project, stories, scenes, options);
      case 'epub':
        return this.exportToEpub(project, stories, scenes, options);
      case 'pdf':
        return this.exportToPdf(project, stories, scenes, options);
      case 'scrivener':
        return this.exportToScrivener(project, stories, scenes, options);
      case 'json':
        return this.exportToJson(project, stories, scenes, options);
      case 'html':
        return this.exportToHtml(project, stories, scenes, options);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Import a project from a file
   */
  public async importProject(file: File, format?: string): Promise<ImportResult> {
    const detectedFormat = format || this.detectFormat(file);
    
    switch (detectedFormat) {
      case 'markdown':
        return this.importFromMarkdown(file);
      case 'docx':
        return this.importFromDocx(file);
      case 'scrivener':
        return this.importFromScrivener(file);
      case 'json':
        return this.importFromJson(file);
      default:
        return {
          success: false,
          errors: [`Unsupported import format: ${detectedFormat}`]
        };
    }
  }

  /**
   * Export to Markdown format
   */
  private async exportToMarkdown(
    project: Project,
    stories: Story[],
    scenes: Scene[],
    options: ExportOptions
  ): Promise<void> {
    let markdown = `# ${project.title}\n\n`;
    
    if (project.description) {
      markdown += `> ${project.description}\n\n`;
    }

    // Add metadata if requested
    if (options.includeMetadata) {
      markdown += `## Project Metadata\n\n`;
      markdown += `- **Created:** ${new Date(project.createdAt).toLocaleDateString()}\n`;
      markdown += `- **Last Updated:** ${new Date(project.updatedAt).toLocaleDateString()}\n`;
      markdown += `- **Genre:** ${project.metadata?.genre || 'Not specified'}\n`;
      markdown += `- **Target Word Count:** ${project.metadata?.targetWordCount || 'Not set'}\n`;
      markdown += `- **Current Word Count:** ${project.metadata?.currentWordCount || 0}\n\n`;
    }

    // Add table of contents
    markdown += `## Table of Contents\n\n`;
    stories.forEach((story, storyIndex) => {
      markdown += `${storyIndex + 1}. [${story.title}](#story-${storyIndex + 1})\n`;
      
      // Add chapters if they exist
      if (story.chapters && story.chapters.length > 0) {
        story.chapters.forEach((chapter, chapterIndex) => {
          markdown += `   ${storyIndex + 1}.${chapterIndex + 1}. [${chapter.title}](#chapter-${storyIndex + 1}-${chapterIndex + 1})\n`;
        });
      }
    });
    markdown += '\n---\n\n';

    // Add stories and scenes
    stories.forEach((story, storyIndex) => {
      markdown += `## Story ${storyIndex + 1}: ${story.title} {#story-${storyIndex + 1}}\n\n`;
      
      if (story.summary) {
        markdown += `*${story.summary}*\n\n`;
      }

      // Group scenes by chapter if chapters exist
      if (story.chapters && story.chapters.length > 0) {
        story.chapters.forEach((chapter, chapterIndex) => {
          markdown += `### Chapter ${chapterIndex + 1}: ${chapter.title} {#chapter-${storyIndex + 1}-${chapterIndex + 1}}\n\n`;
          
          if (chapter.summary) {
            markdown += `*${chapter.summary}*\n\n`;
          }

          // Add scenes in this chapter
          const chapterScenes = scenes.filter(s => 
            s.storyId === story.id && s.chapterId === chapter.id
          ).sort((a, b) => a.order - b.order);

          chapterScenes.forEach(scene => {
            markdown += this.formatSceneMarkdown(scene, options);
          });
        });
      } else {
        // Add scenes without chapters
        const storyScenes = scenes.filter(s => s.storyId === story.id)
          .sort((a, b) => a.order - b.order);
        
        storyScenes.forEach(scene => {
          markdown += this.formatSceneMarkdown(scene, options);
        });
      }
    });

    // Add character sheets if requested
    if (options.includeCharacters && project.metadata?.characters) {
      markdown += '\n---\n\n## Character Sheets\n\n';
      project.metadata.characters.forEach((character: Character) => {
        markdown += `### ${character.name}\n\n`;
        markdown += `**Role:** ${character.role}\n\n`;
        if (character.description) {
          markdown += `${character.description}\n\n`;
        }
        if (character.backstory) {
          markdown += `**Backstory:** ${character.backstory}\n\n`;
        }
      });
    }

    // Add location descriptions if requested
    if (options.includeLocations && project.metadata?.locations) {
      markdown += '\n---\n\n## Locations\n\n';
      project.metadata.locations.forEach((location: Location) => {
        markdown += `### ${location.name}\n\n`;
        if (location.description) {
          markdown += `${location.description}\n\n`;
        }
      });
    }

    // Save the file
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    saveAs(blob, `${project.title.replace(/[^a-z0-9]/gi, '_')}.md`);
  }

  /**
   * Format a scene for Markdown export
   */
  private formatSceneMarkdown(scene: Scene, options: ExportOptions): string {
    let markdown = `#### Scene ${scene.order}: ${scene.title}\n\n`;
    
    // Add scene metadata
    if (options.includeMetadata && scene.metadata) {
      if (scene.metadata.pov) markdown += `**POV:** ${scene.metadata.pov}  \n`;
      if (scene.metadata.location) markdown += `**Location:** ${scene.metadata.location}  \n`;
      if (scene.metadata.time) markdown += `**Time:** ${scene.metadata.time}  \n`;
      if (scene.metadata.mood) markdown += `**Mood:** ${scene.metadata.mood}  \n`;
      markdown += '\n';
    }

    // Add scene content
    markdown += `${scene.content}\n\n`;

    // Add scene notes if requested
    if (options.includeNotes && scene.notes) {
      markdown += `> **Notes:** ${scene.notes}\n\n`;
    }

    markdown += '---\n\n';
    return markdown;
  }

  /**
   * Export to DOCX format
   */
  private async exportToDocx(
    project: Project,
    stories: Story[],
    scenes: Scene[],
    options: ExportOptions
  ): Promise<void> {
    const doc = new Document({
      creator: 'ASTRAL NOTES',
      title: project.title,
      description: project.description,
      sections: [{
        properties: {
          page: {
            size: {
              orientation: 'portrait',
              height: options.pageSize === 'A4' ? 11906 : 12240,
              width: options.pageSize === 'A4' ? 8391 : 8640
            },
            margin: options.margins || {
              top: 1440,
              bottom: 1440,
              left: 1440,
              right: 1440
            }
          }
        },
        children: this.generateDocxContent(project, stories, scenes, options)
      }]
    });

    const buffer = await Packer.toBlob(doc);
    saveAs(buffer, `${project.title.replace(/[^a-z0-9]/gi, '_')}.docx`);
  }

  /**
   * Generate DOCX content
   */
  private generateDocxContent(
    project: Project,
    stories: Story[],
    scenes: Scene[],
    options: ExportOptions
  ): any[] {
    const children: any[] = [];

    // Title page
    children.push(
      new Paragraph({
        text: project.title,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      })
    );

    if (project.description) {
      children.push(
        new Paragraph({
          text: project.description,
          alignment: AlignmentType.CENTER,
          italics: true,
          spacing: { after: 200 }
        })
      );
    }

    // Add metadata
    if (options.includeMetadata) {
      children.push(
        new Paragraph({
          text: `Created: ${new Date(project.createdAt).toLocaleDateString()}`,
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 }
        }),
        new Paragraph({
          text: `Word Count: ${project.metadata?.currentWordCount || 0}`,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        })
      );
    }

    children.push(new PageBreak());

    // Add stories and scenes
    stories.forEach((story, storyIndex) => {
      children.push(
        new Paragraph({
          text: `${story.title}`,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        })
      );

      if (story.summary) {
        children.push(
          new Paragraph({
            text: story.summary,
            italics: true,
            spacing: { after: 200 }
          })
        );
      }

      // Add scenes
      const storyScenes = scenes.filter(s => s.storyId === story.id)
        .sort((a, b) => a.order - b.order);

      storyScenes.forEach(scene => {
        children.push(
          new Paragraph({
            text: `Scene ${scene.order}: ${scene.title}`,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 }
          })
        );

        // Add scene metadata
        if (options.includeMetadata && scene.metadata) {
          const metadataText = [];
          if (scene.metadata.pov) metadataText.push(`POV: ${scene.metadata.pov}`);
          if (scene.metadata.location) metadataText.push(`Location: ${scene.metadata.location}`);
          if (scene.metadata.time) metadataText.push(`Time: ${scene.metadata.time}`);
          
          if (metadataText.length > 0) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: metadataText.join(' | '),
                    italics: true,
                    size: 20
                  })
                ],
                spacing: { after: 100 }
              })
            );
          }
        }

        // Add scene content (convert HTML to text)
        const plainContent = this.htmlToPlainText(scene.content);
        plainContent.split('\n\n').forEach(paragraph => {
          if (paragraph.trim()) {
            children.push(
              new Paragraph({
                text: paragraph,
                spacing: { after: 100 }
              })
            );
          }
        });

        // Add scene break
        if (options.separateChapters) {
          children.push(new PageBreak());
        } else {
          children.push(
            new Paragraph({
              text: '* * *',
              alignment: AlignmentType.CENTER,
              spacing: { before: 200, after: 200 }
            })
          );
        }
      });
    });

    return children;
  }

  /**
   * Export to ePub format
   */
  private async exportToEpub(
    project: Project,
    stories: Story[],
    scenes: Scene[],
    options: ExportOptions
  ): Promise<void> {
    const zip = new JSZip();
    
    // Add mimetype
    zip.file('mimetype', 'application/epub+zip');
    
    // Create META-INF directory
    const metaInf = zip.folder('META-INF');
    metaInf?.file('container.xml', `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`);

    // Create OEBPS directory
    const oebps = zip.folder('OEBPS');
    
    // Generate unique ID
    const bookId = `astral-notes-${Date.now()}`;
    
    // Create content.opf (package document)
    const contentOpf = this.generateEpubContentOpf(project, stories, scenes, bookId);
    oebps?.file('content.opf', contentOpf);
    
    // Create toc.ncx (navigation)
    const tocNcx = this.generateEpubTocNcx(project, stories, scenes, bookId);
    oebps?.file('toc.ncx', tocNcx);
    
    // Create title page
    oebps?.file('title.xhtml', this.generateEpubTitlePage(project));
    
    // Create chapters
    stories.forEach((story, storyIndex) => {
      const storyScenes = scenes.filter(s => s.storyId === story.id)
        .sort((a, b) => a.order - b.order);
      
      if (story.chapters && story.chapters.length > 0) {
        story.chapters.forEach((chapter, chapterIndex) => {
          const chapterScenes = storyScenes.filter(s => s.chapterId === chapter.id);
          const chapterContent = this.generateEpubChapter(
            chapter.title,
            chapterScenes,
            options
          );
          oebps?.file(`chapter${storyIndex}-${chapterIndex}.xhtml`, chapterContent);
        });
      } else {
        const storyContent = this.generateEpubChapter(
          story.title,
          storyScenes,
          options
        );
        oebps?.file(`story${storyIndex}.xhtml`, storyContent);
      }
    });
    
    // Create styles
    oebps?.file('styles.css', this.generateEpubStyles(options));
    
    // Generate the ePub file
    const content = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    saveAs(content, `${project.title.replace(/[^a-z0-9]/gi, '_')}.epub`);
  }

  /**
   * Generate ePub content.opf file
   */
  private generateEpubContentOpf(
    project: Project,
    stories: Story[],
    scenes: Scene[],
    bookId: string
  ): string {
    const items: string[] = [];
    const itemrefs: string[] = [];
    
    // Add title page
    items.push('<item id="title" href="title.xhtml" media-type="application/xhtml+xml"/>');
    itemrefs.push('<itemref idref="title"/>');
    
    // Add chapters
    stories.forEach((story, storyIndex) => {
      if (story.chapters && story.chapters.length > 0) {
        story.chapters.forEach((chapter, chapterIndex) => {
          const id = `chapter${storyIndex}-${chapterIndex}`;
          items.push(`<item id="${id}" href="${id}.xhtml" media-type="application/xhtml+xml"/>`);
          itemrefs.push(`<itemref idref="${id}"/>`);
        });
      } else {
        const id = `story${storyIndex}`;
        items.push(`<item id="${id}" href="${id}.xhtml" media-type="application/xhtml+xml"/>`);
        itemrefs.push(`<itemref idref="${id}"/>`);
      }
    });
    
    // Add other items
    items.push('<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>');
    items.push('<item id="styles" href="styles.css" media-type="text/css"/>');
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<package version="2.0" xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title>${project.title}</dc:title>
    <dc:creator opf:role="aut">${project.metadata?.author || 'Unknown Author'}</dc:creator>
    <dc:identifier id="BookId">${bookId}</dc:identifier>
    <dc:language>en</dc:language>
    <dc:date>${new Date().toISOString()}</dc:date>
    <dc:description>${project.description || ''}</dc:description>
    <dc:publisher>ASTRAL NOTES</dc:publisher>
    <dc:subject>${project.metadata?.genre || 'Fiction'}</dc:subject>
  </metadata>
  <manifest>
    ${items.join('\n    ')}
  </manifest>
  <spine toc="ncx">
    ${itemrefs.join('\n    ')}
  </spine>
</package>`;
  }

  /**
   * Generate ePub TOC
   */
  private generateEpubTocNcx(
    project: Project,
    stories: Story[],
    scenes: Scene[],
    bookId: string
  ): string {
    const navPoints: string[] = [];
    let playOrder = 1;
    
    // Add title
    navPoints.push(`
    <navPoint id="navpoint-${playOrder}" playOrder="${playOrder}">
      <navLabel><text>Title Page</text></navLabel>
      <content src="title.xhtml"/>
    </navPoint>`);
    playOrder++;
    
    // Add chapters
    stories.forEach((story, storyIndex) => {
      if (story.chapters && story.chapters.length > 0) {
        story.chapters.forEach((chapter, chapterIndex) => {
          navPoints.push(`
    <navPoint id="navpoint-${playOrder}" playOrder="${playOrder}">
      <navLabel><text>${chapter.title}</text></navLabel>
      <content src="chapter${storyIndex}-${chapterIndex}.xhtml"/>
    </navPoint>`);
          playOrder++;
        });
      } else {
        navPoints.push(`
    <navPoint id="navpoint-${playOrder}" playOrder="${playOrder}">
      <navLabel><text>${story.title}</text></navLabel>
      <content src="story${storyIndex}.xhtml"/>
    </navPoint>`);
        playOrder++;
      }
    });
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN" "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd">
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${bookId}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>${project.title}</text>
  </docTitle>
  <navMap>
    ${navPoints.join('')}
  </navMap>
</ncx>`;
  }

  /**
   * Generate ePub title page
   */
  private generateEpubTitlePage(project: Project): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${project.title}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <div class="title-page">
    <h1 class="title">${project.title}</h1>
    ${project.description ? `<p class="description">${project.description}</p>` : ''}
    ${project.metadata?.author ? `<p class="author">by ${project.metadata.author}</p>` : ''}
  </div>
</body>
</html>`;
  }

  /**
   * Generate ePub chapter
   */
  private generateEpubChapter(
    title: string,
    scenes: Scene[],
    options: ExportOptions
  ): string {
    const sceneHtml = scenes.map(scene => {
      let html = `<div class="scene">`;
      html += `<h3>${scene.title}</h3>`;
      
      if (options.includeMetadata && scene.metadata) {
        html += '<div class="metadata">';
        if (scene.metadata.pov) html += `<span>POV: ${scene.metadata.pov}</span>`;
        if (scene.metadata.location) html += `<span>Location: ${scene.metadata.location}</span>`;
        html += '</div>';
      }
      
      html += scene.content;
      html += '</div>';
      return html;
    }).join('\n');
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${title}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <h2>${title}</h2>
  ${sceneHtml}
</body>
</html>`;
  }

  /**
   * Generate ePub styles
   */
  private generateEpubStyles(options: ExportOptions): string {
    return `
body {
  font-family: ${options.fontFamily || 'Georgia, serif'};
  font-size: ${options.fontSize || 16}px;
  line-height: 1.6;
  margin: 1em;
}

h1, h2, h3 {
  font-family: ${options.fontFamily || 'Georgia, serif'};
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}

h1.title {
  font-size: 2em;
  text-align: center;
  margin: 2em 0;
}

.description {
  font-style: italic;
  text-align: center;
  margin: 1em 2em;
}

.author {
  text-align: center;
  margin: 2em 0;
  font-size: 1.2em;
}

.scene {
  margin-bottom: 2em;
}

.metadata {
  font-style: italic;
  font-size: 0.9em;
  margin: 0.5em 0;
  color: #666;
}

.metadata span {
  margin-right: 1em;
}

p {
  text-indent: 1.5em;
  margin: 0.5em 0;
  text-align: justify;
}

.scene h3 + p {
  text-indent: 0;
}
    `.trim();
  }

  /**
   * Export to PDF format
   */
  private async exportToPdf(
    project: Project,
    stories: Story[],
    scenes: Scene[],
    options: ExportOptions
  ): Promise<void> {
    // For PDF export, we'll generate HTML and use browser's print functionality
    // In production, you'd use a library like jsPDF or puppeteer
    
    const html = this.generateHtmlForPdf(project, stories, scenes, options);
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      
      // Wait for content to load then trigger print
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  }

  /**
   * Generate HTML for PDF export
   */
  private generateHtmlForPdf(
    project: Project,
    stories: Story[],
    scenes: Scene[],
    options: ExportOptions
  ): string {
    const content = stories.map(story => {
      const storyScenes = scenes.filter(s => s.storyId === story.id)
        .sort((a, b) => a.order - b.order);
      
      let html = `<section class="story">`;
      html += `<h1>${story.title}</h1>`;
      if (story.summary) {
        html += `<p class="summary">${story.summary}</p>`;
      }
      
      storyScenes.forEach(scene => {
        html += `<article class="scene">`;
        html += `<h2>Scene ${scene.order}: ${scene.title}</h2>`;
        
        if (options.includeMetadata && scene.metadata) {
          html += '<div class="metadata">';
          if (scene.metadata.pov) html += `<span>POV: ${scene.metadata.pov}</span>`;
          if (scene.metadata.location) html += `<span>Location: ${scene.metadata.location}</span>`;
          if (scene.metadata.time) html += `<span>Time: ${scene.metadata.time}</span>`;
          html += '</div>';
        }
        
        html += `<div class="content">${scene.content}</div>`;
        html += `</article>`;
      });
      
      html += `</section>`;
      return html;
    }).join('\n');
    
    return `<!DOCTYPE html>
<html>
<head>
  <title>${project.title}</title>
  <meta charset="UTF-8">
  <style>
    @page {
      size: ${options.pageSize || 'A4'};
      margin: ${options.margins?.top || 25}mm ${options.margins?.right || 20}mm ${options.margins?.bottom || 25}mm ${options.margins?.left || 20}mm;
    }
    
    body {
      font-family: ${options.fontFamily || 'Georgia, serif'};
      font-size: ${options.fontSize || 12}pt;
      line-height: 1.6;
      color: #000;
    }
    
    h1 {
      font-size: 24pt;
      margin: 2em 0 1em;
      page-break-before: always;
    }
    
    h1:first-child {
      page-break-before: avoid;
    }
    
    h2 {
      font-size: 16pt;
      margin: 1.5em 0 0.5em;
    }
    
    .title-page {
      text-align: center;
      padding: 10em 0;
      page-break-after: always;
    }
    
    .title-page h1 {
      font-size: 36pt;
      margin: 0 0 1em;
    }
    
    .summary {
      font-style: italic;
      margin: 1em 0 2em;
    }
    
    .metadata {
      font-size: 10pt;
      color: #666;
      margin: 0.5em 0 1em;
    }
    
    .metadata span {
      margin-right: 1em;
    }
    
    .scene {
      margin-bottom: 2em;
    }
    
    .content p {
      text-indent: 1.5em;
      margin: 0.5em 0;
      text-align: justify;
    }
    
    .content p:first-child {
      text-indent: 0;
    }
    
    @media print {
      .scene {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="title-page">
    <h1>${project.title}</h1>
    ${project.description ? `<p>${project.description}</p>` : ''}
    ${project.metadata?.author ? `<p>by ${project.metadata.author}</p>` : ''}
  </div>
  ${content}
</body>
</html>`;
  }

  /**
   * Export to Scrivener format (.scriv)
   */
  private async exportToScrivener(
    project: Project,
    stories: Story[],
    scenes: Scene[],
    options: ExportOptions
  ): Promise<void> {
    const zip = new JSZip();
    const projectName = project.title.replace(/[^a-z0-9]/gi, '_');
    
    // Create main project folder
    const scrivFolder = zip.folder(`${projectName}.scriv`);
    
    // Create Files folder structure
    const filesFolder = scrivFolder?.folder('Files');
    const docsFolder = filesFolder?.folder('Docs');
    
    // Create project.scrivx file (main project file)
    const scrivx = this.generateScrivenerProject(project, stories, scenes);
    scrivFolder?.file(`${projectName}.scrivx`, scrivx);
    
    // Create document files
    let docId = 1;
    
    // Create binder structure
    const binder = filesFolder?.folder('Binder');
    
    // Add manuscript folder
    binder?.file('1.xml', this.generateScrivenerBinderItem('Manuscript', 'Folder', []));
    
    stories.forEach((story, storyIndex) => {
      const storyId = docId++;
      const storyScenes = scenes.filter(s => s.storyId === story.id)
        .sort((a, b) => a.order - b.order);
      
      // Create story folder
      binder?.file(`${storyId}.xml`, this.generateScrivenerBinderItem(
        story.title,
        'Folder',
        storyScenes.map(s => docId++)
      ));
      
      // Create scene documents
      storyScenes.forEach(scene => {
        const sceneId = docId - storyScenes.length + storyScenes.indexOf(scene);
        
        // Create RTF content
        const rtfContent = this.generateRtfContent(scene.content);
        docsFolder?.file(`${sceneId}.rtf`, rtfContent);
        
        // Create scene metadata
        const sceneXml = this.generateScrivenerSceneXml(scene);
        docsFolder?.file(`${sceneId}.xml`, sceneXml);
      });
    });
    
    // Add character sheets if requested
    if (options.includeCharacters && project.metadata?.characters) {
      const charactersId = docId++;
      binder?.file(`${charactersId}.xml`, this.generateScrivenerBinderItem(
        'Characters',
        'Folder',
        project.metadata.characters.map(() => docId++)
      ));
      
      project.metadata.characters.forEach((character: Character) => {
        const charId = docId - project.metadata.characters.length + 
                       project.metadata.characters.indexOf(character);
        const charContent = this.generateRtfContent(
          `${character.description}\n\nBackstory:\n${character.backstory}`
        );
        docsFolder?.file(`${charId}.rtf`, charContent);
        docsFolder?.file(`${charId}.xml`, this.generateScrivenerDocumentXml(character.name));
      });
    }
    
    // Create Settings folder
    const settingsFolder = scrivFolder?.folder('Settings');
    settingsFolder?.file('compile.xml', this.generateScrivenerCompileSettings());
    
    // Generate the .scriv package
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${projectName}.scriv.zip`);
  }

  /**
   * Generate Scrivener project file
   */
  private generateScrivenerProject(
    project: Project,
    stories: Story[],
    scenes: Scene[]
  ): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<ScrivenerProject Version="1.0">
  <Binder>
    <BinderItem ID="1" Type="Folder" Title="Manuscript">
      ${stories.map((story, index) => 
        `<BinderItem ID="${index + 2}" Type="Folder" Title="${story.title}"/>`
      ).join('\n      ')}
    </BinderItem>
  </Binder>
  <ProjectTitle>${project.title}</ProjectTitle>
  <ProjectNotes>${project.description || ''}</ProjectNotes>
  <ProjectTargets>
    <DraftTarget>${project.metadata?.targetWordCount || 50000}</DraftTarget>
  </ProjectTargets>
</ScrivenerProject>`;
  }

  /**
   * Generate Scrivener binder item
   */
  private generateScrivenerBinderItem(
    title: string,
    type: string,
    children: number[]
  ): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<BinderItem Type="${type}">
  <Title>${title}</Title>
  ${children.length > 0 ? `
  <Children>
    ${children.map(id => `<BinderItem ID="${id}"/>`).join('\n    ')}
  </Children>` : ''}
</BinderItem>`;
  }

  /**
   * Generate Scrivener scene XML
   */
  private generateScrivenerSceneXml(scene: Scene): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Document>
  <Title>${scene.title}</Title>
  <Synopsis>${scene.summary || ''}</Synopsis>
  <Notes>${scene.notes || ''}</Notes>
  <Keywords>${scene.tags?.join(', ') || ''}</Keywords>
  <CustomMetaData>
    ${scene.metadata?.pov ? `<POV>${scene.metadata.pov}</POV>` : ''}
    ${scene.metadata?.location ? `<Location>${scene.metadata.location}</Location>` : ''}
    ${scene.metadata?.time ? `<Time>${scene.metadata.time}</Time>` : ''}
  </CustomMetaData>
</Document>`;
  }

  /**
   * Generate Scrivener document XML
   */
  private generateScrivenerDocumentXml(title: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Document>
  <Title>${title}</Title>
</Document>`;
  }

  /**
   * Generate Scrivener compile settings
   */
  private generateScrivenerCompileSettings(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<CompileSettings>
  <Format>Standard Manuscript Format</Format>
  <IncludeSynopsis>false</IncludeSynopsis>
  <IncludeNotes>false</IncludeNotes>
  <IncludeKeywords>false</IncludeKeywords>
</CompileSettings>`;
  }

  /**
   * Generate RTF content
   */
  private generateRtfContent(html: string): string {
    // Convert HTML to plain text first
    const plainText = this.htmlToPlainText(html);
    
    // Basic RTF header
    let rtf = '{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}';
    rtf += '\\f0\\fs24 ';
    
    // Escape special RTF characters and add paragraphs
    const escapedText = plainText
      .replace(/\\/g, '\\\\')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
      .replace(/\n\n/g, '\\par\\par ')
      .replace(/\n/g, '\\par ');
    
    rtf += escapedText;
    rtf += '}';
    
    return rtf;
  }

  /**
   * Export to JSON format
   */
  private async exportToJson(
    project: Project,
    stories: Story[],
    scenes: Scene[],
    options: ExportOptions
  ): Promise<void> {
    const data = {
      project,
      stories,
      scenes,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
    
    if (options.includeCharacters) {
      data['characters'] = project.metadata?.characters || [];
    }
    
    if (options.includeLocations) {
      data['locations'] = project.metadata?.locations || [];
    }
    
    if (options.includeNotes) {
      data['notes'] = project.metadata?.notes || [];
    }
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    saveAs(blob, `${project.title.replace(/[^a-z0-9]/gi, '_')}.json`);
  }

  /**
   * Export to HTML format
   */
  private async exportToHtml(
    project: Project,
    stories: Story[],
    scenes: Scene[],
    options: ExportOptions
  ): Promise<void> {
    const html = this.generateHtmlExport(project, stories, scenes, options);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    saveAs(blob, `${project.title.replace(/[^a-z0-9]/gi, '_')}.html`);
  }

  /**
   * Generate HTML export
   */
  private generateHtmlExport(
    project: Project,
    stories: Story[],
    scenes: Scene[],
    options: ExportOptions
  ): string {
    const toc = stories.map((story, index) => 
      `<li><a href="#story-${index}">${story.title}</a></li>`
    ).join('\n');
    
    const content = stories.map((story, storyIndex) => {
      const storyScenes = scenes.filter(s => s.storyId === story.id)
        .sort((a, b) => a.order - b.order);
      
      return `
        <article id="story-${storyIndex}" class="story">
          <h2>${story.title}</h2>
          ${story.summary ? `<p class="summary">${story.summary}</p>` : ''}
          
          ${storyScenes.map(scene => `
            <section class="scene">
              <h3>Scene ${scene.order}: ${scene.title}</h3>
              
              ${options.includeMetadata && scene.metadata ? `
                <div class="metadata">
                  ${scene.metadata.pov ? `<span class="pov">POV: ${scene.metadata.pov}</span>` : ''}
                  ${scene.metadata.location ? `<span class="location">Location: ${scene.metadata.location}</span>` : ''}
                  ${scene.metadata.time ? `<span class="time">Time: ${scene.metadata.time}</span>` : ''}
                  ${scene.metadata.mood ? `<span class="mood">Mood: ${scene.metadata.mood}</span>` : ''}
                </div>
              ` : ''}
              
              <div class="content">
                ${scene.content}
              </div>
              
              ${options.includeNotes && scene.notes ? `
                <aside class="notes">
                  <h4>Notes</h4>
                  <p>${scene.notes}</p>
                </aside>
              ` : ''}
            </section>
          `).join('\n')}
        </article>
      `;
    }).join('\n');
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: ${options.fontFamily || 'Georgia, serif'};
      font-size: ${options.fontSize || 16}px;
      line-height: 1.8;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 2em;
      background: #fafafa;
    }
    
    header {
      text-align: center;
      margin-bottom: 4em;
      padding: 2em 0;
      border-bottom: 2px solid #ddd;
    }
    
    h1 {
      font-size: 2.5em;
      margin-bottom: 0.5em;
      color: #2c3e50;
    }
    
    .description {
      font-style: italic;
      color: #666;
      margin: 1em 0;
    }
    
    .author {
      font-size: 1.2em;
      color: #555;
    }
    
    nav {
      background: white;
      padding: 1.5em;
      margin: 2em 0;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    nav h2 {
      margin-bottom: 0.5em;
      color: #2c3e50;
    }
    
    nav ol {
      list-style-position: inside;
      line-height: 2;
    }
    
    nav a {
      color: #3498db;
      text-decoration: none;
    }
    
    nav a:hover {
      text-decoration: underline;
    }
    
    .story {
      background: white;
      padding: 2em;
      margin: 2em 0;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    h2 {
      font-size: 2em;
      margin-bottom: 0.5em;
      color: #2c3e50;
      border-bottom: 2px solid #ecf0f1;
      padding-bottom: 0.25em;
    }
    
    h3 {
      font-size: 1.5em;
      margin: 1.5em 0 0.5em;
      color: #34495e;
    }
    
    .summary {
      font-style: italic;
      color: #666;
      margin: 1em 0;
      padding: 1em;
      background: #f8f9fa;
      border-left: 3px solid #3498db;
    }
    
    .metadata {
      display: flex;
      flex-wrap: wrap;
      gap: 1em;
      margin: 0.5em 0 1em;
      padding: 0.5em;
      background: #ecf0f1;
      border-radius: 4px;
      font-size: 0.9em;
    }
    
    .metadata span {
      padding: 0.25em 0.5em;
      background: white;
      border-radius: 3px;
      color: #555;
    }
    
    .scene {
      margin: 2em 0;
      padding: 1.5em 0;
      border-bottom: 1px solid #ecf0f1;
    }
    
    .scene:last-child {
      border-bottom: none;
    }
    
    .content {
      margin: 1em 0;
    }
    
    .content p {
      margin: 1em 0;
      text-align: justify;
    }
    
    .notes {
      margin-top: 2em;
      padding: 1em;
      background: #fff9c4;
      border-radius: 4px;
      border: 1px solid #f9a825;
    }
    
    .notes h4 {
      color: #f57c00;
      margin-bottom: 0.5em;
    }
    
    footer {
      text-align: center;
      margin-top: 4em;
      padding: 2em 0;
      border-top: 2px solid #ddd;
      color: #666;
      font-size: 0.9em;
    }
    
    @media print {
      body {
        background: white;
        max-width: 100%;
      }
      
      .story, nav {
        box-shadow: none;
        border: 1px solid #ddd;
      }
      
      .scene {
        page-break-inside: avoid;
      }
    }
    
    @media (max-width: 768px) {
      body {
        padding: 1em;
      }
      
      h1 {
        font-size: 2em;
      }
      
      h2 {
        font-size: 1.5em;
      }
      
      h3 {
        font-size: 1.2em;
      }
    }
  </style>
</head>
<body>
  <header>
    <h1>${project.title}</h1>
    ${project.description ? `<p class="description">${project.description}</p>` : ''}
    ${project.metadata?.author ? `<p class="author">by ${project.metadata.author}</p>` : ''}
  </header>
  
  <nav>
    <h2>Table of Contents</h2>
    <ol>
      ${toc}
    </ol>
  </nav>
  
  <main>
    ${content}
  </main>
  
  ${options.includeCharacters && project.metadata?.characters ? `
    <section class="story">
      <h2>Character Profiles</h2>
      ${project.metadata.characters.map((char: Character) => `
        <article class="scene">
          <h3>${char.name}</h3>
          <p><strong>Role:</strong> ${char.role}</p>
          ${char.description ? `<p>${char.description}</p>` : ''}
          ${char.backstory ? `<p><strong>Backstory:</strong> ${char.backstory}</p>` : ''}
        </article>
      `).join('\n')}
    </section>
  ` : ''}
  
  ${options.includeLocations && project.metadata?.locations ? `
    <section class="story">
      <h2>Locations</h2>
      ${project.metadata.locations.map((loc: Location) => `
        <article class="scene">
          <h3>${loc.name}</h3>
          ${loc.description ? `<p>${loc.description}</p>` : ''}
        </article>
      `).join('\n')}
    </section>
  ` : ''}
  
  <footer>
    <p>Exported from ASTRAL NOTES on ${new Date().toLocaleDateString()}</p>
    <p>Total Word Count: ${project.metadata?.currentWordCount || 0}</p>
  </footer>
</body>
</html>`;
  }

  /**
   * Import from Markdown
   */
  private async importFromMarkdown(file: File): Promise<ImportResult> {
    try {
      const text = await file.text();
      const lines = text.split('\n');
      
      // Parse the markdown structure
      const project: Project = {
        id: this.generateId(),
        title: file.name.replace('.md', ''),
        description: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          currentWordCount: 0,
          characters: [],
          locations: [],
          notes: []
        }
      };
      
      const stories: Story[] = [];
      const scenes: Scene[] = [];
      
      let currentStory: Story | null = null;
      let currentScene: Scene | null = null;
      let currentContent: string[] = [];
      
      for (const line of lines) {
        // Check for title (H1)
        if (line.startsWith('# ')) {
          project.title = line.substring(2).trim();
        }
        // Check for story (H2)
        else if (line.startsWith('## ')) {
          if (currentScene && currentContent.length > 0) {
            currentScene.content = currentContent.join('\n');
            scenes.push(currentScene);
            currentContent = [];
            currentScene = null;
          }
          
          const storyTitle = line.substring(3).trim();
          if (!storyTitle.toLowerCase().includes('metadata') && 
              !storyTitle.toLowerCase().includes('character') &&
              !storyTitle.toLowerCase().includes('location')) {
            currentStory = {
              id: this.generateId(),
              projectId: project.id,
              title: storyTitle.replace(/^Story \d+:\s*/, ''),
              scenes: [],
              createdAt: new Date(),
              updatedAt: new Date()
            } as Story;
            stories.push(currentStory);
          }
        }
        // Check for scene (H4)
        else if (line.startsWith('#### ') && currentStory) {
          if (currentScene && currentContent.length > 0) {
            currentScene.content = currentContent.join('\n');
            scenes.push(currentScene);
            currentContent = [];
          }
          
          const sceneTitle = line.substring(5).trim();
          currentScene = {
            id: this.generateId(),
            storyId: currentStory.id,
            projectId: project.id,
            title: sceneTitle.replace(/^Scene \d+:\s*/, ''),
            content: '',
            order: scenes.filter(s => s.storyId === currentStory!.id).length + 1,
            createdAt: new Date(),
            updatedAt: new Date()
          };
        }
        // Collect content
        else if (currentScene && line.trim()) {
          currentContent.push(line);
        }
      }
      
      // Add last scene if exists
      if (currentScene && currentContent.length > 0) {
        currentScene.content = currentContent.join('\n');
        scenes.push(currentScene);
      }
      
      // Calculate word count
      project.metadata!.currentWordCount = scenes.reduce(
        (sum, scene) => sum + (scene.content.split(/\s+/).length || 0),
        0
      );
      
      return {
        success: true,
        project,
        warnings: []
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Failed to import markdown: ${error.message}`]
      };
    }
  }

  /**
   * Import from DOCX
   */
  private async importFromDocx(file: File): Promise<ImportResult> {
    // This would require a DOCX parsing library like mammoth.js
    // For now, return a placeholder
    return {
      success: false,
      errors: ['DOCX import requires additional library setup']
    };
  }

  /**
   * Import from Scrivener
   */
  private async importFromScrivener(file: File): Promise<ImportResult> {
    try {
      const zip = await JSZip.loadAsync(file);
      
      // Look for the .scrivx project file
      const scrivxFile = Object.keys(zip.files).find(name => name.endsWith('.scrivx'));
      if (!scrivxFile) {
        return {
          success: false,
          errors: ['Invalid Scrivener file: missing .scrivx project file']
        };
      }
      
      // Parse the project structure
      const scrivxContent = await zip.files[scrivxFile].async('string');
      
      // This would require XML parsing
      // For now, return a placeholder
      return {
        success: false,
        errors: ['Scrivener import requires XML parsing implementation']
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Failed to import Scrivener file: ${error.message}`]
      };
    }
  }

  /**
   * Import from JSON
   */
  private async importFromJson(file: File): Promise<ImportResult> {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!data.project) {
        return {
          success: false,
          errors: ['Invalid JSON format: missing project data']
        };
      }
      
      return {
        success: true,
        project: data.project,
        warnings: []
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Failed to import JSON: ${error.message}`]
      };
    }
  }

  /**
   * Detect file format
   */
  private detectFormat(file: File): string {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'md':
      case 'markdown':
        return 'markdown';
      case 'docx':
        return 'docx';
      case 'scriv':
      case 'scrivx':
        return 'scrivener';
      case 'json':
        return 'json';
      default:
        return 'unknown';
    }
  }

  /**
   * Convert HTML to plain text
   */
  private htmlToPlainText(html: string): string {
    // Create a temporary div to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Get text content
    const text = temp.textContent || temp.innerText || '';
    
    // Clean up extra whitespace
    return text.replace(/\s+/g, ' ').trim();
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

// Export singleton instance
export const importExportService = ImportExportService.getInstance();