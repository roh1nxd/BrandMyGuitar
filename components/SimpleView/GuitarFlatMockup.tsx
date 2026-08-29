'use client';

import React from 'react';
import { ZONE_DEFINITIONS } from '@/lib/zones';
import ZoneOverlay from './ZoneOverlay';

export default function GuitarFlatMockup() {
  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
      {/* Real Guitar Container */}
      <div className="relative w-full max-w-[380px] bg-card border border-hairline rounded-2xl p-6 flex items-center justify-center overflow-hidden shadow-xs">
        {/* Real 2D Guitar Image */}
        <div className="relative w-full aspect-[290/486] max-h-[580px] flex items-center justify-center">
          <img
            src="/images/guitar-2d.png"
            alt="Taylor Guitar - 2D View"
            className="w-full h-full object-contain filter drop-shadow-md select-none pointer-events-none"
          />

          {/* Clickable Zone Overlays mapped on the real photo */}
          {ZONE_DEFINITIONS.map((zoneDef) => (
            <ZoneOverlay
              key={zoneDef.id}
              definition={zoneDef}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
