/**
 * Research Center Page
 */

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export function ResearchCenter() {
  return (
    <div className="p-6 space-y-6" data-testid="research-center">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Research Center</h1>
        <p className="text-muted-foreground">
          Organize your research materials and reference documents.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Research Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Collect and organize research materials for your stories.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reference Library</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Store links, documents, and inspiration sources.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}