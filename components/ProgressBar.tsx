'use client';

import React from 'react';
import { Zone } from '@/types/zone';

interface ProgressBarProps {
  raisedCents: number;
  goalCents: number;
  zones: Zone[];
}

export default function ProgressBar({ raisedCents, goalCents, zones }: ProgressBarProps) {
  const percentage = Math.min(100, Math.round((raisedCents / (goalCents || 1)) * 100));
  const paidCount = zones.filter((z) => z.status === 'paid').length;
  const totalCount = zones.length;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-8 mb-12">
      <div className="hairline-all p-6 sm:p-8 bg-paper">
        {/* Metric Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-walnut mb-1">
              Campaign Progress
            </div>
            <div className="flex items-baseline gap-3">
              <span className="font-serif text-3xl sm:text-4xl text-ink font-normal">
                ${(raisedCents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
              <span className="text-sm text-walnut">
                raised of ${(goalCents / 100).toLocaleString('en-US')} goal
              </span>
            </div>
          </div>

          <div className="text-xs text-walnut">
            <span className="font-semibold text-ink">{paidCount}</span> of {totalCount} spots claimed ({percentage}%)
          </div>
        </div>

        {/* Minimal Progress Bar */}
        <div className="w-full h-2 bg-line rounded-none overflow-hidden">
          <div
            className="h-full bg-brass transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
