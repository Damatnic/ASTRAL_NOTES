/**
 * User Profile Page
 */

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export function Profile() {
  return (
    <div className="p-6 space-y-6" data-testid="profile">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">User Profile</h1>
        <p className="text-muted-foreground">
          Manage your profile and writing preferences.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Writing Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Set and track your writing objectives.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Customize your writing environment.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}