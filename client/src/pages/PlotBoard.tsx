/**
 * Plot Board Page
 */

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export function PlotBoard() {
  return (
    <div className="p-6 space-y-6" data-testid="plot-board">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Visual Plot Board</h1>
        <p className="text-muted-foreground">
          Visualize and organize your story's plot structure.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Track events and plot points across your story timeline.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plot Points</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Organize key story moments and turning points.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}