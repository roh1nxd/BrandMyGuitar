'use client';

import React from 'react';

interface ViewToggleProps {
  viewMode: 'grid' | '2d' | '3d';
  onViewChange: (mode: 'grid' | '2d' | '3d') => void;
}

export default function ViewToggle({ viewMode, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center justify-center my-6">
      <div className="border-hairline rounded-full p-1 inline-flex bg-bg text-xs">
        <button
          onClick={() => onViewChange('grid')}
          className={`px-4 py-1.5 rounded-full transition-colors font-medium ${
            viewMode === 'grid'
              ? 'bg-text text-bg'
              : 'text-text-muted hover:text-text'
          }`}
        >
          Live auction
        </button>

        <button
          onClick={() => onViewChange('2d')}
          className={`px-4 py-1.5 rounded-full transition-colors font-medium ${
            viewMode === '2d'
              ? 'bg-text text-bg'
              : 'text-text-muted hover:text-text'
          }`}
        >
          2D view
        </button>

        <button
          onClick={() => onViewChange('3d')}
          className={`px-4 py-1.5 rounded-full transition-colors font-medium ${
            viewMode === '3d'
              ? 'bg-text text-bg'
              : 'text-text-muted hover:text-text'
          }`}
        >
          3D view
        </button>
      </div>
    </div>
  );
}
