/**
 * Collaboration Page
 */

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export function Collaboration() {
  return (
    <div className="p-6 space-y-6" data-testid="collaboration">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Collaboration Hub</h1>
        <p className="text-muted-foreground">
          Work together with other writers on shared projects.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Shared Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              View and manage projects you're collaborating on.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Manage your writing team and permissions.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}