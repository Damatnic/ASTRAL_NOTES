/**
 * Editor Stats Component
 * Displays real-time statistics about the document
 */

import React, { useState } from 'react';
import { cn } from '@/utils/cn';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  BarChart3,
  Clock,
  FileText,
  Target,
  TrendingUp,
  Hash,
  BookOpen,
  Timer,
  Settings
} from 'lucide-react';

interface EditorStatsProps {
  stats: {
    characters: number;
    charactersWithoutSpaces: number;
    words: number;
    paragraphs: number;
    readingTime: number;
  };
  wordTarget?: number;
  onWordTargetChange?: (target: number) => void;
  className?: string;
}

export function EditorStats({
  stats,
  wordTarget = 0,
  onWordTargetChange,
  className
}: EditorStatsProps) {
  const [showTargetDialog, setShowTargetDialog] = useState(false);
  const [tempTarget, setTempTarget] = useState(wordTarget.toString());

  const handleTargetSave = () => {
    const target = parseInt(tempTarget) || 0;
    onWordTargetChange?.(target);
    setShowTargetDialog(false);
  };

  const wordProgress = wordTarget > 0 ? Math.min((stats.words / wordTarget) * 100, 100) : 0;
  const wordsRemaining = Math.max(0, wordTarget - stats.words);

  // Calculate average word length
  const avgWordLength = stats.words > 0 
    ? Math.round((stats.charactersWithoutSpaces / stats.words) * 10) / 10
    : 0;

  // Estimate pages (250 words per page standard)
  const estimatedPages = Math.round((stats.words / 250) * 10) / 10;

  return (
    <Card className={cn("editor-stats", className)}>
      <div className="p-3">
        <div className="flex items-center justify-between">
          {/* Main Stats */}
          <div className="flex items-center gap-6">
            {/* Word Count */}
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-semibold">{stats.words.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">words</div>
              </div>
            </div>

            {/* Character Count */}
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-semibold">{stats.characters.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">characters</div>
              </div>
            </div>

            {/* Paragraphs */}
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-semibold">{stats.paragraphs}</div>
                <div className="text-xs text-muted-foreground">paragraphs</div>
              </div>
            </div>

            {/* Reading Time */}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-semibold">{stats.readingTime}m</div>
                <div className="text-xs text-muted-foreground">read time</div>
              </div>
            </div>

            {/* Pages Estimate */}
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-semibold">{estimatedPages}</div>
                <div className="text-xs text-muted-foreground">pages</div>
              </div>
            </div>

            {/* Average Word Length */}
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-semibold">{avgWordLength}</div>
                <div className="text-xs text-muted-foreground">avg length</div>
              </div>
            </div>
          </div>

          {/* Word Target Section */}
          <div className="flex items-center gap-4">
            {wordTarget > 0 ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm">
                      <span className="font-semibold">{stats.words}</span>
                      <span className="text-muted-foreground"> / {wordTarget}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {wordsRemaining > 0 ? `${wordsRemaining} to go` : 'Complete!'}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-32">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full transition-all duration-300",
                        wordProgress >= 100 ? "bg-green-500" : "bg-cosmic-500"
                      )}
                      style={{ width: `${wordProgress}%` }}
                    />
                  </div>
                  <div className="text-xs text-center mt-1 text-muted-foreground">
                    {Math.round(wordProgress)}%
                  </div>
                </div>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowTargetDialog(true)}
                className="flex items-center gap-1"
              >
                <Target className="h-3 w-3" />
                Set Target
              </Button>
            )}

            {/* Settings Button */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowTargetDialog(true)}
              className="p-1"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Target Dialog */}
        {showTargetDialog && (
          <div className="absolute bottom-full right-0 mb-2 p-4 bg-background border rounded-lg shadow-lg z-50">
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Target className="h-4 w-4" />
                Set Word Target
              </h3>
              
              <div className="space-y-2">
                <input
                  type="number"
                  value={tempTarget}
                  onChange={(e) => setTempTarget(e.target.value)}
                  placeholder="Enter word target..."
                  className="w-full px-3 py-2 border rounded bg-background"
                  min="0"
                  autoFocus
                />
                
                {/* Quick presets */}
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-muted-foreground">Quick:</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setTempTarget('500')}
                    className="h-6 px-2"
                  >
                    500
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setTempTarget('1000')}
                    className="h-6 px-2"
                  >
                    1k
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setTempTarget('2500')}
                    className="h-6 px-2"
                  >
                    2.5k
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setTempTarget('5000')}
                    className="h-6 px-2"
                  >
                    5k
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleTargetSave}>
                  Save Target
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setTempTarget('0');
                    onWordTargetChange?.(0);
                    setShowTargetDialog(false);
                  }}
                >
                  Clear
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => {
                    setShowTargetDialog(false);
                    setTempTarget(wordTarget.toString());
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Achievement Badges */}
        {stats.words > 0 && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t">
            {stats.words >= 100 && (
              <Badge variant="outline" className="text-xs">
                <Timer className="h-3 w-3 mr-1" />
                100 words
              </Badge>
            )}
            {stats.words >= 500 && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                <TrendingUp className="h-3 w-3 mr-1" />
                500 words
              </Badge>
            )}
            {stats.words >= 1000 && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300">
                <Target className="h-3 w-3 mr-1" />
                1k milestone
              </Badge>
            )}
            {stats.words >= 2500 && (
              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                <BookOpen className="h-3 w-3 mr-1" />
                2.5k words
              </Badge>
            )}
            {stats.words >= 5000 && (
              <Badge variant="outline" className="text-xs bg-gold-50 text-gold-700 dark:bg-gold-900 dark:text-gold-300">
                <BarChart3 className="h-3 w-3 mr-1" />
                5k achievement
              </Badge>
            )}
            {wordTarget > 0 && wordProgress >= 100 && (
              <Badge className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                <Target className="h-3 w-3 mr-1" />
                Target reached!
              </Badge>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

export default EditorStats;