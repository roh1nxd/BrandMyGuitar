'use client';

import React from 'react';
import { ZONE_DEFINITIONS } from '@/lib/zones';
import ZoneOverlay from './ZoneOverlay';

export default function GuitarFlatMockup() {
  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
      {/* Real Guitar Container without hard border */}
      <div className="relative w-full max-w-[380px] bg-card-bg rounded-2xl p-6 flex items-center justify-center overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
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
