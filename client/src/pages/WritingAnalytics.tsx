/**
 * Writing Analytics Page
 */

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export function WritingAnalytics() {
  return (
    <div className="p-6 space-y-6" data-testid="writing-analytics">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Writing Analytics</h1>
        <p className="text-muted-foreground">
          Track your writing progress and analyze your productivity.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Progress Charts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Visualize your writing progress over time.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Writing Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              View detailed statistics about your writing habits.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}