/**
 * Character Profiles Page
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export function CharacterProfiles() {
  const { characterId } = useParams();
  
  // If we have a characterId, show character detail view
  if (characterId) {
    return (
      <div className="p-6 space-y-6" data-testid="character-detail">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">Character Details</h1>
          <p className="text-muted-foreground">
            Detailed view for character: {characterId}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Character Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Character details and development notes would appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="p-6 space-y-6" data-testid="character-profiles">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Character Profiles</h1>
        <p className="text-muted-foreground">
          Develop rich, complex characters for your stories.
        </p>
      </div>

      <div className="flex justify-between items-center">
        <div></div>
        <Button variant="primary">
          Create Character
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>No characters yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Start building your character profiles to bring your stories to life.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}