'use client';

import React from 'react';
import { useAuction } from '@/lib/AuctionContext';
import { formatPrice } from '@/lib/currency';
import { Plus } from 'lucide-react';

export default function SpotGrid() {
  const { zones, currency, setSelectedZoneId } = useAuction();

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-8">
      {/* Light Grey Container without hard border */}
      <div className="bg-card-bg rounded-2xl p-5 sm:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {zones.map((zone) => {
            const hasBid = zone.current_bid_cents !== null && zone.current_bid_cents > 0;
            const priceEurCents = hasBid ? zone.current_bid_cents! : zone.min_bid_cents;

            return (
              <div
                key={zone.id}
                onClick={() => setSelectedZoneId(zone.id)}
                className="bg-white rounded-xl p-4 cursor-pointer hover:shadow-md transition-all flex flex-col justify-between group shadow-[0_1px_3px_rgba(0,0,0,0.06)] min-h-[220px]"
              >
                {/* Top: Zone Name + Size */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-xs font-semibold text-text truncate">
                    {zone.name}
                  </span>
                  <span className="text-[10px] text-text-muted uppercase font-medium tracking-wide">
                    {zone.size}
                  </span>
                </div>

                {/* Center: Logo / Spot Graphic */}
                <div className="w-full h-24 bg-card-bg rounded-lg mb-3 flex items-center justify-center p-2 overflow-hidden relative">
                  {zone.logo_url ? (
                    <img
                      src={zone.logo_url}
                      alt={zone.brand_name || 'Brand Logo'}
                      className="max-h-full max-w-full object-contain filter drop-shadow-xs"
                    />
                  ) : (
                    <div className="text-center flex flex-col items-center justify-center">
                      <div className="w-7 h-7 rounded-full bg-white shadow-xs flex items-center justify-center text-text-muted mb-1 group-hover:bg-text group-hover:text-white transition-colors">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[11px] font-medium text-text-muted">Place first bid</span>
                    </div>
                  )}
                </div>

                {/* Bottom Info: Prominent Top Bid */}
                <div>
                  <div className="text-xs font-medium text-text truncate mb-1">
                    {zone.brand_name || 'Open for bids'}
                  </div>

                  <div className="flex items-baseline justify-between pt-2 border-t border-card-bg text-xs">
                    <span className="text-text-muted text-[11px]">
                      {hasBid ? 'Top bid' : 'Starting from'}
                    </span>
                    <span className="text-sm font-bold text-text">
                      {formatPrice(priceEurCents, currency)}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[10px] text-text-muted">
                    <span>
                      {hasBid ? `${zone.bids_count} ${zone.bids_count === 1 ? 'bid' : 'bids'}` : 'No bids yet'}
                    </span>
                    {hasBid ? (
                      <span className="text-accent-green font-medium">Active</span>
                    ) : (
                      <span className="text-text-muted">Available</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
