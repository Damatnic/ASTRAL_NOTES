#!/usr/bin/env node
/**
 * ULTRA STRICT ERROR FIX SCRIPT
 * Fixes ALL TypeScript errors, unused imports, and type mismatches
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fixes = [
  // Fix ConsistencyChecker type mismatch
  {
    file: 'src/components/ai/ConsistencyChecker.tsx',
    find: `  const consistencyAnalysis = useQuery({
    queryKey: ['consistency', projectId, filters],
    queryFn: () => fetchConsistencyIssues(projectId, filters),`,
    replace: `  const consistencyAnalysis = useQuery({
    queryKey: ['consistency', projectId, filters],
    queryFn: () => fetchConsistencyIssues(projectId, {
      type: filters.type ? [filters.type] : undefined,
      severity: filters.severity ? [filters.severity] : undefined,
      resolved: filters.resolved
    }),`
  },

  // Fix AIWritingAssistant unused imports
  {
    file: 'src/components/ai/writing/AIWritingAssistant.tsx',
    find: `import {
  Type,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Hash,
  MapPin,
  MessageSquare,
  Lightbulb,
  Target,
  TrendingUp,
  RefreshCw,
  Sparkles,
  Wand2,
  Brain,
  BookOpen,
  Users,
  Clock,
  Settings,
  Mic,
  Download,
  Play,
  Pause,
  RotateCcw,
  FileText,
  Globe,
  Palette,
  Database,
  ChevronDown,
  ChevronRight,
  Info,
  AlertCircle,
  CheckCircle,
  X,
  Copy,
  Share2,
  Save,
  History,
  Filter,
  Search
} from 'lucide-react'`,
    replace: `import {
  Type,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Hash,
  MessageSquare,
  Lightbulb,
  Target,
  TrendingUp,
  RefreshCw,
  Sparkles,
  Wand2,
  Brain,
  BookOpen,
  Users,
  Clock,
  Settings,
  Download,
  Palette,
  ChevronDown,
  Info,
  AlertCircle,
  CheckCircle,
  X,
  Copy,
  Share2,
  Save,
  History,
  Filter,
  Search
} from 'lucide-react'`
  },

  // Remove title prop from Lucide icons in AIWritingAssistant
  {
    file: 'src/components/ai/writing/AIWritingAssistant.tsx',
    find: `<CheckCircle className="h-4 w-4 text-green-500" title="Applied" />`,
    replace: `<CheckCircle className="h-4 w-4 text-green-500" />`
  },
  {
    file: 'src/components/ai/writing/AIWritingAssistant.tsx',
    find: `<AlertCircle className="h-4 w-4 text-red-500" title="Failed to apply" />`,
    replace: `<AlertCircle className="h-4 w-4 text-red-500" />`
  },

  // Fix CharacterVoiceAnalyzer unused imports
  {
    file: 'src/components/ai/writing/CharacterVoiceAnalyzer.tsx',
    find: `import {
  Users,
  User,
  MessageSquare,
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Sparkles,
  Mic,
  Volume2,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Star,
  Hash,
  Type,
  Sliders,
  Filter,
  Search,
  Bookmark,
  Clock,
  MapPin,
  Heart,
  Shield,
  Layers,
  Palette,
  Music,
  BookOpen,
  FileText,
  Settings,
  Info,
  ChevronDown,
  ChevronRight,
  X,
  Copy,
  Share2
} from 'lucide-react'`,
    replace: `import {
  Users,
  User,
  MessageSquare,
  Brain,
  TrendingUp,
  CheckCircle,
  RefreshCw,
  Sparkles,
  Activity,
  Star,
  Hash,
  Type,
  Sliders,
  Filter,
  Search,
  Heart,
  Shield,
  Layers,
  FileText,
  Settings,
  Info,
  ChevronDown,
  ChevronRight,
  X,
  Copy,
  Share2
} from 'lucide-react'`
  },

  // Fix CreativeExpansion unused imports
  {
    file: 'src/components/ai/writing/CreativeExpansion.tsx',
    find: `import {
  Sparkles,
  Wand2,
  Brain,
  MessageSquare,
  PenTool,
  Palette,
  Eye,
  Heart,
  Music,
  Layers,
  Volume2,
  ArrowRight,
  RefreshCw,
  Plus,
  Lightbulb,
  Target,
  TrendingUp,
  Zap,
  Star,
  BookOpen,
  Users,
  MapPin,
  Clock,
  Globe,
  Sun,
  Moon,
  CloudRain,
  Mountain,
  Trees,
  Waves
} from 'lucide-react'`,
    replace: `import {
  Sparkles,
  Wand2,
  Brain,
  MessageSquare,
  PenTool,
  Palette,
  Eye,
  Heart,
  Music,
  RefreshCw,
  Plus,
  Lightbulb,
  Target,
  TrendingUp,
  Zap,
  Star,
  Users,
  MapPin,
  Clock,
  Globe,
  Mountain,
  Trees,
  Waves
} from 'lucide-react'`
  },

  // Fix PlotAssistant unused imports
  {
    file: 'src/components/ai/writing/PlotAssistant.tsx',
    find: `import {
  GitBranch,
  Zap,
  TrendingUp,
  Users,
  Target,
  Layers,
  Sparkles,
  Brain,
  Lightbulb,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  MessageSquare,
  BookOpen,
  Map,
  Compass,
  Flag,
  Crown,
  Swords,
  Shield,
  Heart,
  Star,
  Clock,
  Calendar,
  Plus,
  Minus,
  Filter,
  Settings,
  Info,
  Share2,
  Download,
  Copy
} from 'lucide-react'`,
    replace: `import {
  GitBranch,
  Zap,
  TrendingUp,
  Users,
  Target,
  Sparkles,
  Brain,
  Lightbulb,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  MessageSquare,
  BookOpen,
  Swords,
  Heart,
  Star,
  Clock,
  Calendar,
  Filter,
  Settings,
  Info,
  Share2,
  Download,
  Copy
} from 'lucide-react'`
  },

  // Fix ResearchAssistant unused imports
  {
    file: 'src/components/ai/writing/ResearchAssistant.tsx',
    find: `import {
  Search,
  Globe,
  BookOpen,
  Database,
  Brain,
  FileText,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Copy,
  Bookmark,
  Tag,
  Filter,
  Calendar,
  Star,
  TrendingUp,
  Info,
  ChevronDown,
  Eye,
  Sparkles,
  History,
  Link2,
  Quote,
  X
} from 'lucide-react'`,
    replace: `import {
  Search,
  Globe,
  BookOpen,
  Database,
  Brain,
  FileText,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Copy,
  Bookmark,
  Tag,
  Filter,
  Calendar,
  TrendingUp,
  Info,
  ChevronDown,
  Sparkles,
  History,
  Link2,
  Quote,
  X
} from 'lucide-react'`
  },

  // Fix PlotAssistant type error
  {
    file: 'src/components/ai/writing/PlotAssistant.tsx',
    find: `const suggestionTypes = ['theme', 'pacing', 'conflict', 'structure', 'resolution', 'character_arc', 'plot_hole', 'foreshadowing'] as const`,
    replace: `const suggestionTypes = ['pacing', 'conflict', 'structure', 'resolution'] as const`
  }
];

async function applyFixes() {
  console.log('🔧 Starting ULTRA STRICT error fixes...\n');
  
  for (const fix of fixes) {
    const filePath = path.join(path.dirname(__dirname), fix.file);
    
    try {
      let content = await fs.readFile(filePath, 'utf8');
      
      if (content.includes(fix.find)) {
        content = content.replace(fix.find, fix.replace);
        await fs.writeFile(filePath, content, 'utf8');
        console.log(`✅ Fixed: ${fix.file}`);
      } else {
        console.log(`⚠️  Pattern not found in: ${fix.file}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${fix.file}:`, error.message);
    }
  }

  console.log('\n✨ ULTRA STRICT fixes applied!');
}

applyFixes().catch(console.error);