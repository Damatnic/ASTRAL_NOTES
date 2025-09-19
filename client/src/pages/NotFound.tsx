/**
 * 404 Not Found Page
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export function NotFound() {
  return (
    <div className="p-6 space-y-6" data-testid="not-found">
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-6xl font-bold text-muted-foreground mb-4">404</CardTitle>
            <h1 className="text-2xl font-bold">Page Not Found</h1>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <Button asChild variant="primary">
              <Link to="/">Go Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}