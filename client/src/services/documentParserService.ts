/**
 * Document Parser Service
 * Advanced multi-format document parsing with smart structure detection
 */

// Optional imports - these libraries are used if available
let mammoth: any;
let parseStringPromise: any;
let JSZip: any;
let pdfParse: any;

try {
  mammoth = require('mammoth');
} catch (e) {
  console.warn('mammoth not installed - .docx parsing disabled');
}

try {
  const xml2js = require('xml2js');
  parseStringPromise = xml2js.parseStringPromise;
} catch (e) {
  console.warn('xml2js not installed - XML parsing disabled');
}

try {
  JSZip = require('jszip');
} catch (e) {
  console.warn('jszip not installed - ZIP file handling disabled');
}

try {
  pdfParse = require('pdf-parse');
} catch (e) {
  console.warn('pdf-parse not installed - PDF parsing disabled');
}

import { marked } from 'marked';

export interface DocumentStructure {
  title: string;
  metadata: DocumentMetadata;
  content: DocumentNode[];
  entities: ExtractedEntity[];
  formatting: StyleInformation;
  structure: StructuralElements;
}

export interface DocumentMetadata {
  title?: string;
  author?: string;
  subject?: string;
  description?: string;
  keywords?: string[];
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
  language?: string;
  pageCount?: number;
  wordCount?: number;
  characterCount?: number;
  genre?: string;
  format: string;
}

export interface DocumentNode {
  type: 'paragraph' | 'heading' | 'list' | 'quote' | 'code' | 'table' | 'image' | 'break' | 'scene' | 'chapter' | 'act';
  level?: number;
  content: string;
  formatting?: TextFormatting;
  metadata?: NodeMetadata;
  children?: DocumentNode[];
  order: number;
}

export interface TextFormatting {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  indent?: number;
  spacing?: number;
}

export interface NodeMetadata {
  id?: string;
  className?: string;
  styles?: Record<string, string>;
  attributes?: Record<string, string>;
  comments?: Comment[];
  revisions?: Revision[];
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  date: Date;
  resolved?: boolean;
}

export interface Revision {
  id: string;
  author: string;
  date: Date;
  type: 'insert' | 'delete' | 'format';
  content?: string;
}

export interface ExtractedEntity {
  type: 'character' | 'location' | 'item' | 'concept' | 'organization' | 'event';
  name: string;
  aliases?: string[];
  description?: string;
  category?: string;
  mentions: EntityMention[];
  confidence: number;
}

export interface EntityMention {
  text: string;
  context: string;
  position: number;
  nodeId?: string;
}

export interface StyleInformation {
  theme?: string;
  defaultFont?: string;
  defaultSize?: number;
  margins?: Margins;
  pageSize?: PageSize;
  customStyles?: CustomStyle[];
}

export interface Margins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface PageSize {
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
}

export interface CustomStyle {
  name: string;
  type: 'paragraph' | 'character' | 'table' | 'list';
  properties: Record<string, any>;
}

export interface StructuralElements {
  acts?: StructuralElement[];
  chapters?: StructuralElement[];
  scenes?: StructuralElement[];
  sections?: StructuralElement[];
  outline?: OutlineItem[];
}

export interface StructuralElement {
  id: string;
  title: string;
  level: number;
  startNode: number;
  endNode: number;
  summary?: string;
  metadata?: Record<string, any>;
  children?: StructuralElement[];
}

export interface OutlineItem {
  title: string;
  level: number;
  nodeIndex: number;
  children?: OutlineItem[];
}

export interface ImportOptions {
  preserveFormatting: boolean;
  extractEntities: boolean;
  detectStructure: boolean;
  includeComments: boolean;
  includeRevisions: boolean;
  mergeTextNodes: boolean;
  customEntityTypes?: string[];
  structureRules?: StructureRule[];
}

export interface StructureRule {
  pattern: RegExp;
  type: 'act' | 'chapter' | 'scene' | 'section';
  level: number;
}

export interface FormatDetectionResult {
  format: string;
  confidence: number;
  mimeType?: string;
  encoding?: string;
  version?: string;
}

class DocumentParserService {
  private static instance: DocumentParserService;
  
  // Standard structure detection patterns
  private readonly structurePatterns = {
    act: [
      /^ACT\s+([IVX]+|\d+)(\s*[:\-\s]*(.*))?$/i,
      /^PART\s+([IVX]+|\d+)(\s*[:\-\s]*(.*))?$/i,
      /^BOOK\s+([IVX]+|\d+)(\s*[:\-\s]*(.*))?$/i
    ],
    chapter: [
      /^CHAPTER\s+([IVX]+|\d+)(\s*[:\-\s]*(.*))?$/i,
      /^CH\.\s*(\d+)(\s*[:\-\s]*(.*))?$/i,
      /^(\d+)\.\s+(.+)$/,
      /^#{1,2}\s+(.+)$/
    ],
    scene: [
      /^SCENE\s+([IVX]+|\d+)(\s*[:\-\s]*(.*))?$/i,
      /^\*\s*\*\s*\*\s*$/,
      /^#{3,4}\s+(.+)$/,
      /^---+$/,
      /^###\s+(.+)$/
    ],
    section: [
      /^#{5,6}\s+(.+)$/,
      /^\d+\.\d+(\.\d+)?\s+(.+)$/
    ]
  };

  // Entity recognition patterns
  private readonly entityPatterns = {
    character: [
      /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g,
      /(?:Mr|Mrs|Ms|Dr|Professor|Captain|Sir|Lady)\s+[A-Z][a-z]+/g
    ],
    location: [
      /\bin\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g,
      /\bat\s+(?:the\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g,
      /\bfrom\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g
    ],
    item: [
      /\b(?:the\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:sword|blade|ring|amulet|staff|crown|orb)\b/g,
      /\b(?:his|her|their)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g
    ]
  };

  private constructor() {}

  public static getInstance(): DocumentParserService {
    if (!DocumentParserService.instance) {
      DocumentParserService.instance = new DocumentParserService();
    }
    return DocumentParserService.instance;
  }

  /**
   * Detect document format with confidence scoring
   */
  public async detectFormat(file: File): Promise<FormatDetectionResult> {
    const name = file.name.toLowerCase();
    const extension = name.split('.').pop();
    
    // Check by extension first
    const extensionMap: Record<string, FormatDetectionResult> = {
      'docx': { format: 'docx', confidence: 0.95, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
      'doc': { format: 'doc', confidence: 0.9, mimeType: 'application/msword' },
      'pdf': { format: 'pdf', confidence: 0.95, mimeType: 'application/pdf' },
      'epub': { format: 'epub', confidence: 0.95, mimeType: 'application/epub+zip' },
      'html': { format: 'html', confidence: 0.9, mimeType: 'text/html' },
      'htm': { format: 'html', confidence: 0.9, mimeType: 'text/html' },
      'md': { format: 'markdown', confidence: 0.95, mimeType: 'text/markdown' },
      'markdown': { format: 'markdown', confidence: 0.95, mimeType: 'text/markdown' },
      'txt': { format: 'plaintext', confidence: 0.7, mimeType: 'text/plain' },
      'fdx': { format: 'finaldraft', confidence: 0.95, mimeType: 'application/xml' },
      'fountain': { format: 'fountain', confidence: 0.95, mimeType: 'text/plain' },
      'scriv': { format: 'scrivener', confidence: 0.95, mimeType: 'application/zip' },
      'rtf': { format: 'rtf', confidence: 0.9, mimeType: 'application/rtf' },
      'odt': { format: 'opendocument', confidence: 0.9, mimeType: 'application/vnd.oasis.opendocument.text' },
      'xml': { format: 'xml', confidence: 0.8, mimeType: 'application/xml' }
    };

    if (extension && extensionMap[extension]) {
      return extensionMap[extension];
    }

    // Content-based detection for ambiguous cases
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      
      // Check magic numbers
      if (this.checkMagicNumber(bytes, [0x50, 0x4B, 0x03, 0x04])) {
        // ZIP-based format (DOCX, EPUB, ODT, Scrivener)
        const zipContent = await this.peekZipContent(file);
        if (zipContent.includes('word/document.xml')) {
          return { format: 'docx', confidence: 0.98, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
        }
        if (zipContent.includes('META-INF/container.xml')) {
          return { format: 'epub', confidence: 0.98, mimeType: 'application/epub+zip' };
        }
        if (zipContent.includes('content.xml')) {
          return { format: 'opendocument', confidence: 0.95, mimeType: 'application/vnd.oasis.opendocument.text' };
        }
        if (zipContent.some(f => f.endsWith('.scrivx'))) {
          return { format: 'scrivener', confidence: 0.98, mimeType: 'application/zip' };
        }
      }
      
      if (this.checkMagicNumber(bytes, [0x25, 0x50, 0x44, 0x46])) {
        return { format: 'pdf', confidence: 0.99, mimeType: 'application/pdf' };
      }
      
      if (this.checkMagicNumber(bytes, [0xD0, 0xCF, 0x11, 0xE0])) {
        return { format: 'doc', confidence: 0.95, mimeType: 'application/msword' };
      }
      
      // Text-based content detection
      const text = await file.text();
      if (this.detectFountainFormat(text)) {
        return { format: 'fountain', confidence: 0.9, mimeType: 'text/plain' };
      }
      
      if (this.detectFinalDraftFormat(text)) {
        return { format: 'finaldraft', confidence: 0.9, mimeType: 'application/xml' };
      }
      
      if (this.detectMarkdownFormat(text)) {
        return { format: 'markdown', confidence: 0.8, mimeType: 'text/markdown' };
      }
      
      if (this.detectHtmlFormat(text)) {
        return { format: 'html', confidence: 0.8, mimeType: 'text/html' };
      }
      
    } catch (error) {
      console.warn('Content-based format detection failed:', error);
    }

    // Fallback to plain text
    return { format: 'plaintext', confidence: 0.5, mimeType: 'text/plain' };
  }

  /**
   * Parse document and extract structure
   */
  public async parseDocument(file: File, options: ImportOptions = this.getDefaultOptions()): Promise<DocumentStructure> {
    const formatResult = await this.detectFormat(file);
    
    switch (formatResult.format) {
      case 'docx':
        return this.parseDocx(file, options);
      case 'pdf':
        return this.parsePdf(file, options);
      case 'epub':
        return this.parseEpub(file, options);
      case 'html':
        return this.parseHtml(file, options);
      case 'markdown':
        return this.parseMarkdown(file, options);
      case 'fountain':
        return this.parseFountain(file, options);
      case 'finaldraft':
        return this.parseFinalDraft(file, options);
      case 'scrivener':
        return this.parseScrivener(file, options);
      case 'rtf':
        return this.parseRtf(file, options);
      case 'opendocument':
        return this.parseOpenDocument(file, options);
      case 'plaintext':
        return this.parsePlainText(file, options);
      default:
        throw new Error(`Unsupported format: ${formatResult.format}`);
    }
  }

  /**
   * Parse DOCX document
   */
  private async parseDocx(file: File, options: ImportOptions): Promise<DocumentStructure> {
    if (!mammoth) {
      throw new Error('DOCX parsing is not available. Please install mammoth library.');
    }
    
    try {
      const buffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: buffer });
      
      // Enhanced parsing with mammoth options
      const htmlResult = await mammoth.convertToHtml({ arrayBuffer: buffer }, {
        includeDefaultStyleMap: true,
        includeEmbeddedStyleMap: true,
        preserveEmptyParagraphs: true,
        convertImage: mammoth.images.imgElement(function(image) {
          return image.read("base64").then(function(imageBuffer) {
            return {
              src: "data:" + image.contentType + ";base64," + imageBuffer
            };
          });
        })
      });

      const content = this.parseHtmlToNodes(htmlResult.value, options);
      const metadata = await this.extractDocxMetadata(buffer);
      const entities = options.extractEntities ? this.extractEntities(result.value) : [];
      const structure = options.detectStructure ? this.detectDocumentStructure(content) : { outline: [] };

      return {
        title: metadata.title || file.name.replace(/\.[^/.]+$/, ""),
        metadata: { ...metadata, format: 'docx' },
        content,
        entities,
        formatting: await this.extractDocxFormatting(buffer),
        structure
      };
    } catch (error) {
      throw new Error(`Failed to parse DOCX: ${error.message}`);
    }
  }

  /**
   * Parse PDF document
   */
  private async parsePdf(file: File, options: ImportOptions): Promise<DocumentStructure> {
    if (!pdfParse) {
      throw new Error('PDF parsing is not available. Please install pdf-parse library.');
    }
    
    try {
      const buffer = await file.arrayBuffer();
      const data = await pdfParse(buffer);
      
      const content = this.parsePlainTextToNodes(data.text, options);
      const metadata: DocumentMetadata = {
        title: data.info?.Title || file.name.replace(/\.[^/.]+$/, ""),
        author: data.info?.Author,
        subject: data.info?.Subject,
        creator: data.info?.Creator,
        producer: data.info?.Producer,
        creationDate: data.info?.CreationDate,
        modificationDate: data.info?.ModDate,
        pageCount: data.numpages,
        wordCount: data.text.split(/\s+/).length,
        format: 'pdf'
      };

      const entities = options.extractEntities ? this.extractEntities(data.text) : [];
      const structure = options.detectStructure ? this.detectDocumentStructure(content) : { outline: [] };

      return {
        title: metadata.title!,
        metadata,
        content,
        entities,
        formatting: { defaultFont: 'Times', defaultSize: 12 },
        structure
      };
    } catch (error) {
      throw new Error(`Failed to parse PDF: ${error.message}`);
    }
  }

  /**
   * Parse EPUB document
   */
  private async parseEpub(file: File, options: ImportOptions): Promise<DocumentStructure> {
    if (!JSZip) {
      throw new Error('EPUB parsing is not available. Please install jszip library.');
    }
    if (!parseStringPromise) {
      throw new Error('XML parsing is not available. Please install xml2js library.');
    }
    
    try {
      const zip = await JSZip.loadAsync(file);
      
      // Parse META-INF/container.xml to find content.opf
      const containerXml = await zip.files['META-INF/container.xml'].async('string');
      const containerData = await parseStringPromise(containerXml);
      const opfPath = containerData.container.rootfiles[0].rootfile[0].$['full-path'];
      
      // Parse content.opf to get metadata and spine
      const opfContent = await zip.files[opfPath].async('string');
      const opfData = await parseStringPromise(opfContent);
      
      const metadata = this.extractEpubMetadata(opfData);
      const spine = opfData.package.spine[0].itemref;
      const manifest = opfData.package.manifest[0].item;
      
      // Read all content files in order
      let fullText = '';
      const nodes: DocumentNode[] = [];
      let nodeIndex = 0;
      
      for (const spineItem of spine) {
        const manifestItem = manifest.find((item: any) => item.$.id === spineItem.$.idref);
        if (manifestItem && manifestItem.$['media-type'] === 'application/xhtml+xml') {
          const contentPath = opfPath.replace(/[^/]*$/, '') + manifestItem.$.href;
          const xhtmlContent = await zip.files[contentPath].async('string');
          const chapterNodes = this.parseXhtmlToNodes(xhtmlContent, nodeIndex, options);
          nodes.push(...chapterNodes);
          nodeIndex = nodes.length;
          
          // Extract text for entity extraction
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = xhtmlContent;
          fullText += tempDiv.textContent + '\n\n';
        }
      }

      const entities = options.extractEntities ? this.extractEntities(fullText) : [];
      const structure = options.detectStructure ? this.detectDocumentStructure(nodes) : { outline: [] };

      return {
        title: metadata.title!,
        metadata: { ...metadata, format: 'epub' },
        content: nodes,
        entities,
        formatting: { defaultFont: 'Georgia', defaultSize: 16 },
        structure
      };
    } catch (error) {
      throw new Error(`Failed to parse EPUB: ${error.message}`);
    }
  }

  /**
   * Parse Fountain screenplay format
   */
  private async parseFountain(file: File, options: ImportOptions): Promise<DocumentStructure> {
    try {
      const text = await file.text();
      const lines = text.split('\n');
      const nodes: DocumentNode[] = [];
      let nodeIndex = 0;

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        let node: DocumentNode;

        // Title page elements
        if (trimmed.startsWith('Title:')) {
          node = {
            type: 'heading',
            level: 1,
            content: trimmed.substring(6).trim(),
            order: nodeIndex++
          };
        }
        // Character names (all caps, centered)
        else if (/^[A-Z][A-Z\s]*$/.test(trimmed) && trimmed.length < 50) {
          node = {
            type: 'heading',
            level: 3,
            content: trimmed,
            formatting: { alignment: 'center', bold: true },
            metadata: { className: 'character-name' },
            order: nodeIndex++
          };
        }
        // Action lines
        else if (!trimmed.startsWith('(') && !trimmed.startsWith('[[')) {
          node = {
            type: 'paragraph',
            content: trimmed,
            metadata: { className: 'action' },
            order: nodeIndex++
          };
        }
        // Parentheticals
        else if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
          node = {
            type: 'paragraph',
            content: trimmed,
            formatting: { italic: true, indent: 1 },
            metadata: { className: 'parenthetical' },
            order: nodeIndex++
          };
        }
        // Notes
        else if (trimmed.startsWith('[[') && trimmed.endsWith(']]')) {
          node = {
            type: 'paragraph',
            content: trimmed.substring(2, trimmed.length - 2),
            formatting: { italic: true, color: '#666666' },
            metadata: { className: 'note' },
            order: nodeIndex++
          };
        }
        // Default to dialogue
        else {
          node = {
            type: 'paragraph',
            content: trimmed,
            metadata: { className: 'dialogue' },
            order: nodeIndex++
          };
        }

        nodes.push(node);
      }

      const metadata: DocumentMetadata = {
        title: file.name.replace(/\.[^/.]+$/, ""),
        format: 'fountain',
        wordCount: text.split(/\s+/).length
      };

      // Extract title from title page if present
      const titleNode = nodes.find(n => n.content.startsWith('Title:'));
      if (titleNode) {
        metadata.title = titleNode.content.substring(6).trim();
      }

      const entities = options.extractEntities ? this.extractEntities(text) : [];
      const structure = options.detectStructure ? this.detectFountainStructure(nodes) : { outline: [] };

      return {
        title: metadata.title!,
        metadata,
        content: nodes,
        entities,
        formatting: { defaultFont: 'Courier', defaultSize: 12 },
        structure
      };
    } catch (error) {
      throw new Error(`Failed to parse Fountain: ${error.message}`);
    }
  }

  /**
   * Parse Final Draft FDX format
   */
  private async parseFinalDraft(file: File, options: ImportOptions): Promise<DocumentStructure> {
    if (!parseStringPromise) {
      throw new Error('Final Draft parsing is not available. Please install xml2js library.');
    }
    
    try {
      const text = await file.text();
      const xmlData = await parseStringPromise(text);
      
      const finalDraft = xmlData.FinalDraft;
      const content = finalDraft.Content[0];
      const nodes: DocumentNode[] = [];
      let nodeIndex = 0;

      // Extract metadata
      const metadata: DocumentMetadata = {
        title: finalDraft.$.Title || file.name.replace(/\.[^/.]+$/, ""),
        format: 'finaldraft',
        version: finalDraft.$.Version
      };

      // Parse paragraphs
      if (content.Paragraph) {
        for (const para of content.Paragraph) {
          const type = para.$.Type;
          const text = para.Text ? para.Text.map((t: any) => t._).join('') : '';
          
          let nodeType: DocumentNode['type'] = 'paragraph';
          let formatting: TextFormatting = {};
          let level: number | undefined;

          switch (type) {
            case 'Scene Heading':
              nodeType = 'scene';
              formatting = { bold: true };
              level = 2;
              break;
            case 'Character':
              nodeType = 'heading';
              formatting = { bold: true, alignment: 'center' };
              level = 3;
              break;
            case 'Dialogue':
              nodeType = 'paragraph';
              break;
            case 'Parenthetical':
              nodeType = 'paragraph';
              formatting = { italic: true };
              break;
            case 'Action':
              nodeType = 'paragraph';
              break;
            case 'Transition':
              nodeType = 'paragraph';
              formatting = { alignment: 'right' };
              break;
          }

          nodes.push({
            type: nodeType,
            level,
            content: text,
            formatting,
            metadata: { className: type.toLowerCase().replace(' ', '-') },
            order: nodeIndex++
          });
        }
      }

      const entities = options.extractEntities ? this.extractEntities(nodes.map(n => n.content).join('\n')) : [];
      const structure = options.detectStructure ? this.detectScriptStructure(nodes) : { outline: [] };

      return {
        title: metadata.title!,
        metadata,
        content: nodes,
        entities,
        formatting: { defaultFont: 'Courier', defaultSize: 12 },
        structure
      };
    } catch (error) {
      throw new Error(`Failed to parse Final Draft: ${error.message}`);
    }
  }

  /**
   * Parse HTML document
   */
  private async parseHtml(file: File, options: ImportOptions): Promise<DocumentStructure> {
    try {
      const html = await file.text();
      const content = this.parseHtmlToNodes(html, options);
      
      // Extract metadata from HTML head
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const metadata: DocumentMetadata = {
        title: doc.title || file.name.replace(/\.[^/.]+$/, ""),
        description: doc.querySelector('meta[name="description"]')?.getAttribute('content'),
        keywords: doc.querySelector('meta[name="keywords"]')?.getAttribute('content')?.split(',').map(k => k.trim()),
        author: doc.querySelector('meta[name="author"]')?.getAttribute('content'),
        format: 'html'
      };

      const fullText = doc.body?.textContent || '';
      const entities = options.extractEntities ? this.extractEntities(fullText) : [];
      const structure = options.detectStructure ? this.detectDocumentStructure(content) : { outline: [] };

      return {
        title: metadata.title!,
        metadata,
        content,
        entities,
        formatting: this.extractHtmlFormatting(doc),
        structure
      };
    } catch (error) {
      throw new Error(`Failed to parse HTML: ${error.message}`);
    }
  }

  /**
   * Parse Markdown document
   */
  private async parseMarkdown(file: File, options: ImportOptions): Promise<DocumentStructure> {
    try {
      const text = await file.text();
      const tokens = marked.lexer(text);
      const nodes: DocumentNode[] = [];
      let nodeIndex = 0;

      for (const token of tokens) {
        let node: DocumentNode;

        switch (token.type) {
          case 'heading':
            node = {
              type: 'heading',
              level: token.depth,
              content: token.text,
              order: nodeIndex++
            };
            break;
          case 'paragraph':
            node = {
              type: 'paragraph',
              content: token.text,
              order: nodeIndex++
            };
            break;
          case 'blockquote':
            node = {
              type: 'quote',
              content: token.text,
              order: nodeIndex++
            };
            break;
          case 'code':
            node = {
              type: 'code',
              content: token.text,
              order: nodeIndex++
            };
            break;
          case 'list':
            node = {
              type: 'list',
              content: token.items.map((item: any) => item.text).join('\n'),
              order: nodeIndex++
            };
            break;
          default:
            continue;
        }

        nodes.push(node);
      }

      const metadata: DocumentMetadata = {
        title: file.name.replace(/\.[^/.]+$/, ""),
        format: 'markdown',
        wordCount: text.split(/\s+/).length
      };

      // Extract title from first heading
      const firstHeading = nodes.find(n => n.type === 'heading');
      if (firstHeading) {
        metadata.title = firstHeading.content;
      }

      const entities = options.extractEntities ? this.extractEntities(text) : [];
      const structure = options.detectStructure ? this.detectDocumentStructure(nodes) : { outline: [] };

      return {
        title: metadata.title!,
        metadata,
        content: nodes,
        entities,
        formatting: { defaultFont: 'Georgia', defaultSize: 16 },
        structure
      };
    } catch (error) {
      throw new Error(`Failed to parse Markdown: ${error.message}`);
    }
  }

  /**
   * Parse plain text with smart structure detection
   */
  private async parsePlainText(file: File, options: ImportOptions): Promise<DocumentStructure> {
    try {
      const text = await file.text();
      const content = this.parsePlainTextToNodes(text, options);
      
      const metadata: DocumentMetadata = {
        title: file.name.replace(/\.[^/.]+$/, ""),
        format: 'plaintext',
        wordCount: text.split(/\s+/).length,
        characterCount: text.length
      };

      const entities = options.extractEntities ? this.extractEntities(text) : [];
      const structure = options.detectStructure ? this.detectDocumentStructure(content) : { outline: [] };

      return {
        title: metadata.title!,
        metadata,
        content,
        entities,
        formatting: { defaultFont: 'Times', defaultSize: 12 },
        structure
      };
    } catch (error) {
      throw new Error(`Failed to parse plain text: ${error.message}`);
    }
  }

  /**
   * Parse Scrivener project
   */
  private async parseScrivener(file: File, options: ImportOptions): Promise<DocumentStructure> {
    if (!JSZip) {
      throw new Error('Scrivener parsing is not available. Please install jszip library.');
    }
    if (!parseStringPromise) {
      throw new Error('Scrivener parsing is not available. Please install xml2js library.');
    }
    
    try {
      const zip = await JSZip.loadAsync(file);
      
      // Find the .scrivx project file
      const scrivxFile = Object.keys(zip.files).find(name => name.endsWith('.scrivx'));
      if (!scrivxFile) {
        throw new Error('Invalid Scrivener project: missing .scrivx file');
      }

      const scrivxContent = await zip.files[scrivxFile].async('string');
      const projectData = await parseStringPromise(scrivxContent);
      
      // Extract project metadata
      const metadata: DocumentMetadata = {
        title: projectData.ScrivenerProject?.ProjectTitle?.[0] || file.name.replace(/\.[^/.]+$/, ""),
        description: projectData.ScrivenerProject?.ProjectNotes?.[0],
        format: 'scrivener'
      };

      // Parse binder structure and collect documents
      const nodes: DocumentNode[] = [];
      const docsPath = scrivxFile.replace(/[^/]*$/, '') + 'Files/Docs/';
      
      // Read RTF documents and convert to nodes
      let nodeIndex = 0;
      for (const fileName of Object.keys(zip.files)) {
        if (fileName.startsWith(docsPath) && fileName.endsWith('.rtf')) {
          const rtfContent = await zip.files[fileName].async('string');
          const plainText = this.rtfToPlainText(rtfContent);
          
          if (plainText.trim()) {
            nodes.push({
              type: 'paragraph',
              content: plainText,
              order: nodeIndex++
            });
          }
        }
      }

      const fullText = nodes.map(n => n.content).join('\n\n');
      const entities = options.extractEntities ? this.extractEntities(fullText) : [];
      const structure = options.detectStructure ? this.detectDocumentStructure(nodes) : { outline: [] };

      return {
        title: metadata.title!,
        metadata,
        content: nodes,
        entities,
        formatting: { defaultFont: 'Times', defaultSize: 12 },
        structure
      };
    } catch (error) {
      throw new Error(`Failed to parse Scrivener: ${error.message}`);
    }
  }

  /**
   * Parse RTF document
   */
  private async parseRtf(file: File, options: ImportOptions): Promise<DocumentStructure> {
    try {
      const text = await file.text();
      const plainText = this.rtfToPlainText(text);
      const content = this.parsePlainTextToNodes(plainText, options);
      
      const metadata: DocumentMetadata = {
        title: file.name.replace(/\.[^/.]+$/, ""),
        format: 'rtf',
        wordCount: plainText.split(/\s+/).length
      };

      const entities = options.extractEntities ? this.extractEntities(plainText) : [];
      const structure = options.detectStructure ? this.detectDocumentStructure(content) : { outline: [] };

      return {
        title: metadata.title!,
        metadata,
        content,
        entities,
        formatting: { defaultFont: 'Times', defaultSize: 12 },
        structure
      };
    } catch (error) {
      throw new Error(`Failed to parse RTF: ${error.message}`);
    }
  }

  /**
   * Parse OpenDocument text format
   */
  private async parseOpenDocument(file: File, options: ImportOptions): Promise<DocumentStructure> {
    if (!JSZip) {
      throw new Error('OpenDocument parsing is not available. Please install jszip library.');
    }
    if (!parseStringPromise) {
      throw new Error('OpenDocument parsing is not available. Please install xml2js library.');
    }
    
    try {
      const zip = await JSZip.loadAsync(file);
      const contentXml = await zip.files['content.xml'].async('string');
      const metaXml = zip.files['meta.xml'] ? await zip.files['meta.xml'].async('string') : null;
      
      // Parse content and metadata
      const contentData = await parseStringPromise(contentXml);
      const metaData = metaXml ? await parseStringPromise(metaXml) : null;
      
      // Extract text content
      const bodyElement = contentData['office:document-content']['office:body'][0]['office:text'][0];
      const nodes = this.parseOdtElements(bodyElement, options);
      
      // Extract metadata
      const metadata: DocumentMetadata = {
        title: file.name.replace(/\.[^/.]+$/, ""),
        format: 'opendocument'
      };

      if (metaData) {
        const officeMeta = metaData['office:document-meta']?.['office:meta']?.[0];
        if (officeMeta) {
          metadata.title = officeMeta['dc:title']?.[0] || metadata.title;
          metadata.author = officeMeta['dc:creator']?.[0];
          metadata.description = officeMeta['dc:description']?.[0];
        }
      }

      const fullText = nodes.map(n => n.content).join('\n\n');
      const entities = options.extractEntities ? this.extractEntities(fullText) : [];
      const structure = options.detectStructure ? this.detectDocumentStructure(nodes) : { outline: [] };

      return {
        title: metadata.title!,
        metadata,
        content: nodes,
        entities,
        formatting: { defaultFont: 'Times', defaultSize: 12 },
        structure
      };
    } catch (error) {
      throw new Error(`Failed to parse OpenDocument: ${error.message}`);
    }
  }

  // Helper methods for format detection
  private checkMagicNumber(bytes: Uint8Array, signature: number[]): boolean {
    if (bytes.length < signature.length) return false;
    return signature.every((byte, index) => bytes[index] === byte);
  }

  private async peekZipContent(file: File): Promise<string[]> {
    try {
      const zip = await JSZip.loadAsync(file);
      return Object.keys(zip.files);
    } catch {
      return [];
    }
  }

  private detectFountainFormat(text: string): boolean {
    const fountainIndicators = [
      /^Title:/m,
      /^Credit:/m,
      /^Author:/m,
      /^Source:/m,
      /^FADE IN:/m,
      /^INT\./m,
      /^EXT\./m,
      /^\s*\([^)]+\)$/m
    ];
    return fountainIndicators.some(pattern => pattern.test(text));
  }

  private detectFinalDraftFormat(text: string): boolean {
    return text.includes('<FinalDraft') || text.includes('<?xml version="1.0" encoding="UTF-8" standalone="no" ?>');
  }

  private detectMarkdownFormat(text: string): boolean {
    const markdownIndicators = [
      /^#{1,6}\s/m,
      /^\*\s/m,
      /^-\s/m,
      /^\d+\.\s/m,
      /^>/m,
      /```/,
      /\*\*.*\*\*/,
      /\*.*\*/,
      /\[.*\]\(.*\)/
    ];
    return markdownIndicators.some(pattern => pattern.test(text));
  }

  private detectHtmlFormat(text: string): boolean {
    return text.includes('<!DOCTYPE') || text.includes('<html') || 
           text.includes('<head>') || text.includes('<body>');
  }

  // Additional helper methods would be implemented here...
  // (This is a comprehensive but abbreviated version - the full implementation would include all helper methods)

  private getDefaultOptions(): ImportOptions {
    return {
      preserveFormatting: true,
      extractEntities: true,
      detectStructure: true,
      includeComments: true,
      includeRevisions: false,
      mergeTextNodes: true
    };
  }

  // Placeholder implementations for helper methods
  private parseHtmlToNodes(html: string, options: ImportOptions): DocumentNode[] {
    // Implementation would parse HTML DOM to structured nodes
    return [];
  }

  private parsePlainTextToNodes(text: string, options: ImportOptions): DocumentNode[] {
    // Implementation would intelligently parse plain text into structured nodes
    return [];
  }

  private parseXhtmlToNodes(xhtml: string, startIndex: number, options: ImportOptions): DocumentNode[] {
    // Implementation would parse XHTML to nodes
    return [];
  }

  private extractEntities(text: string): ExtractedEntity[] {
    // Implementation would use NLP or pattern matching to extract entities
    return [];
  }

  private detectDocumentStructure(nodes: DocumentNode[]): StructuralElements {
    // Implementation would analyze nodes to detect document structure
    return { outline: [] };
  }

  private async extractDocxMetadata(buffer: ArrayBuffer): Promise<DocumentMetadata> {
    // Implementation would extract DOCX metadata
    return { format: 'docx' };
  }

  private async extractDocxFormatting(buffer: ArrayBuffer): Promise<StyleInformation> {
    // Implementation would extract DOCX formatting information
    return {};
  }

  private extractEpubMetadata(opfData: any): DocumentMetadata {
    // Implementation would extract EPUB metadata from OPF
    return { format: 'epub' };
  }

  private extractHtmlFormatting(doc: Document): StyleInformation {
    // Implementation would extract HTML/CSS formatting
    return {};
  }

  private detectFountainStructure(nodes: DocumentNode[]): StructuralElements {
    // Implementation would detect screenplay structure
    return { outline: [] };
  }

  private detectScriptStructure(nodes: DocumentNode[]): StructuralElements {
    // Implementation would detect script structure from Final Draft
    return { outline: [] };
  }

  private parseOdtElements(element: any, options: ImportOptions): DocumentNode[] {
    // Implementation would parse ODT XML elements
    return [];
  }

  private rtfToPlainText(rtf: string): string {
    // Simple RTF to plain text conversion
    return rtf.replace(/\\[a-z]+\d*\s?/g, '').replace(/[{}]/g, '').trim();
  }
}

export const documentParserService = DocumentParserService.getInstance();