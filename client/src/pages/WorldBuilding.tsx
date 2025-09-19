/**
 * World Building Page
 */

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export function WorldBuilding() {
  return (
    <div className="p-6 space-y-6" data-testid="world-building">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">World Building</h1>
        <p className="text-muted-foreground">
          Create immersive worlds and settings for your stories.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Design and describe the places in your world.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cultures</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Develop the societies and cultures that inhabit your world.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}