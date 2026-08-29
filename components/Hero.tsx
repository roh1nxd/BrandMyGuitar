'use client';

import React, { useState, useEffect } from 'react';
import { useAuction } from '@/lib/AuctionContext';
import { formatPrice } from '@/lib/currency';

export default function Hero() {
  const { zones, campaign, currency } = useAuction();
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 13,
    hours: 21,
    minutes: 45,
    seconds: 30,
  });

  const liveTotalEurCents = zones.reduce((sum, z) => sum + (z.current_bid_cents || 0), 0);
  const activeSpotsCount = zones.filter((z) => (z.current_bid_cents || 0) > 0).length;
  const totalSpots = zones.length;
  const activePercentage = Math.round((activeSpotsCount / (totalSpots || 1)) * 100);

  useEffect(() => {
    const calculateTime = () => {
      const difference = +new Date(campaign.ends_at) - +new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [campaign.ends_at]);

  return (
    <section className="pt-16 pb-8 sm:pt-20 sm:pb-10 px-4 sm:px-8 text-center max-w-3xl mx-auto">
      {/* Eyebrow Label */}
      <div className="inline-block px-3 py-1 bg-card border border-hairline rounded-full text-[11px] font-bold text-muted uppercase tracking-[0.2em] mb-4">
        Live Auction · 7 Spots Available
      </div>

      {/* Centered Headline with Display Serif */}
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif text-ink leading-[1.1] mb-4 tracking-tight">
        Your brand, on my guitar.
      </h1>

      {/* Subtext */}
      <p className="text-base sm:text-lg text-muted mb-8 max-w-xl mx-auto leading-relaxed">
        Your logo travels with me everywhere I play, the moment your bid wins.
      </p>

      {/* Live Total Raised Stat Row (No Goal) */}
      <div className="max-w-md mx-auto mb-2">
        <div className="mb-3">
          <div className="text-3xl sm:text-4xl font-bold text-primary tracking-tight">
            {formatPrice(liveTotalEurCents, currency)} raised so far
          </div>
          <div className="text-xs text-muted mt-1 font-medium">
            {activeSpotsCount} of {totalSpots} spots currently active
          </div>
        </div>

        {/* Ambient Activity Bar */}
        <div className="w-full h-2.5 bg-[#E2DDD0] border border-[#DCD6C2] rounded-full overflow-hidden p-0 my-3.5">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.max(8, activePercentage)}%` }}
          />
        </div>

        {/* Countdown */}
        <div className="text-xs text-muted">
          Auction ends in {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
        </div>
      </div>
    </section>
  );
}
