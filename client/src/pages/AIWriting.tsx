/**
 * AI Writing Page
 * Unified AI writing assistant interface
 */

import React from 'react';
import { AIWritingPanel } from '@/components/ai/AIWritingPanel';

export function AIWriting() {
  return (
    <div data-testid="ai-writing">
      <AIWritingPanel />
    </div>
  );
}
