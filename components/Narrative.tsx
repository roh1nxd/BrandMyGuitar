'use client';

import React from 'react';

interface NarrativeProps {
  onBidClick: () => void;
}

export default function Narrative({ onBidClick }: NarrativeProps) {
  return (
    <section className="py-14 sm:py-18 px-4 sm:px-8 max-w-2xl mx-auto text-center">
      {/* Personal Narrative */}
      <p className="text-base sm:text-lg text-text-muted leading-relaxed mb-8">
        I'm financing my next guitar by selling the one surface everyone sees when I play. Gigs, open mics, YouTube videos, wherever this guitar goes, your brand goes with it.
      </p>

      {/* Bottom CTA Row */}
      <div className="flex items-center justify-center gap-5">
        <button
          onClick={onBidClick}
          className="btn-blue"
        >
          Place a bid
        </button>
        <a
          href="#how-it-works"
          className="text-sm font-medium text-text hover:underline transition"
        >
          How bidding works
        </a>
      </div>
    </section>
  );
}
