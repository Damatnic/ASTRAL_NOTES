/**
 * Professional Page
 * Professional writing business management tools and comprehensive writing suite
 */

import React from 'react';
import ProfessionalDashboard from '../components/professional/ProfessionalDashboard';

export function Professional() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProfessionalDashboard />
      </div>
    </div>
  );
}