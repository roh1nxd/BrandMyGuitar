'use client';

import React from 'react';

interface ViewToggleProps {
  viewMode: 'grid' | '2d' | '3d';
  onViewChange: (mode: 'grid' | '2d' | '3d') => void;
}

export default function ViewToggle({ viewMode, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center justify-center my-6">
      <div className="border border-hairline rounded-full p-1 inline-flex bg-card text-xs shadow-xs">
        <button
          onClick={() => onViewChange('grid')}
          className={`px-4 py-1.5 rounded-full transition-colors font-semibold cursor-pointer ${
            viewMode === 'grid'
              ? 'bg-[#034F46] text-[#FFFFEB] shadow-xs'
              : 'text-muted hover:text-primary'
          }`}
        >
          Live auction
        </button>

        <button
          onClick={() => onViewChange('2d')}
          className={`px-4 py-1.5 rounded-full transition-colors font-semibold cursor-pointer ${
            viewMode === '2d'
              ? 'bg-[#034F46] text-[#FFFFEB] shadow-xs'
              : 'text-muted hover:text-primary'
          }`}
        >
          2D view
        </button>

        <button
          onClick={() => onViewChange('3d')}
          className={`px-4 py-1.5 rounded-full transition-colors font-semibold cursor-pointer ${
            viewMode === '3d'
              ? 'bg-[#034F46] text-[#FFFFEB] shadow-xs'
              : 'text-muted hover:text-primary'
          }`}
        >
          3D view
        </button>
      </div>
    </div>
  );
}
