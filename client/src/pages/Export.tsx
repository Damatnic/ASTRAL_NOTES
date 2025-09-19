/**
 * Export Page
 */

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export function Export() {
  return (
    <div className="p-6 space-y-6" data-testid="export">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Export Center</h1>
        <p className="text-muted-foreground">
          Export your projects in various formats for publishing and sharing.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Export Options</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Choose from multiple export formats including PDF, DOCX, and EPUB.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Publishing Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Prepare your manuscripts for submission and publication.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}