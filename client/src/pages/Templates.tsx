/**
 * Templates Page
 */

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export function Templates() {
  return (
    <div className="p-6 space-y-6" data-testid="templates">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Project Templates</h1>
        <p className="text-muted-foreground">
          Start your projects with pre-built templates and structures.
        </p>
      </div>

      <div className="flex justify-between items-center">
        <div></div>
        <Button variant="primary">
          Create Template
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Novel Template</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Structure for writing full-length novels.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Short Story Template</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Template for crafting compelling short stories.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}