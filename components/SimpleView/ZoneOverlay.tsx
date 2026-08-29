'use client';

import React from 'react';
import { useAuction } from '@/lib/AuctionContext';
import { EnhancedZoneDefinition } from '@/lib/zones';
import { formatPrice } from '@/lib/currency';

interface ZoneOverlayProps {
  definition: EnhancedZoneDefinition;
}

export default function ZoneOverlay({ definition }: ZoneOverlayProps) {
  const { getZoneState, currency, setSelectedZoneId } = useAuction();
  const zoneState = getZoneState(definition.id);

  const hasBid = zoneState?.current_bid_cents !== null && (zoneState?.current_bid_cents || 0) > 0;
  const priceEurCents = hasBid ? zoneState!.current_bid_cents! : definition.min_bid_cents;

  const { flatView } = definition;

  return (
    <div
      style={{
        left: `${flatView.x}%`,
        top: `${flatView.y}%`,
        width: `${flatView.width}%`,
        height: `${flatView.height}%`,
        transform: 'translate(-50%, -50%)',
      }}
      className="absolute group z-20 cursor-pointer"
      onClick={() => setSelectedZoneId(definition.id)}
    >
      {/* Zone Container */}
      <div
        className={`w-full h-full rounded-md transition-all duration-150 flex flex-col items-center justify-center p-1 relative shadow-sm ${
          hasBid
            ? 'bg-cream/95 ring-1 ring-primary'
            : 'bg-cream/90 border border-hairline hover:border-primary hover:bg-cream hover:shadow-md'
        }`}
      >
        {/* Has Top Bid Logo */}
        {hasBid && zoneState?.logo_url ? (
          <div className="w-full h-full flex flex-col items-center justify-center relative p-0.5">
            <img
              src={zoneState.logo_url}
              alt={zoneState.brand_name || 'Top Bidder'}
              className="max-h-full max-w-full object-contain filter drop-shadow-xs"
            />
            {zoneState.brand_name && (
              <span className="text-[9px] font-semibold text-ink truncate bg-cream border border-hairline/60 px-1 py-0.5 rounded shadow-xs mt-0.5 max-w-full text-center">
                {zoneState.brand_name}
              </span>
            )}
          </div>
        ) : (
          /* Unclaimed / Open for Bids chip */
          <div className="text-center px-1">
            <span className="text-[10px] font-bold text-ink block leading-tight">
              {formatPrice(priceEurCents, currency)}
            </span>
            <span className="text-[8px] text-muted uppercase font-medium block leading-tight">
              1st bid
            </span>
          </div>
        )}
      </div>

      {/* Floating Hover Label */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-30 min-w-[130px]">
        <div className="bg-cream border border-hairline rounded-md p-2 text-center shadow-lg">
          <div className="text-xs font-bold text-ink">{definition.name}</div>
          <div className="text-[11px] text-primary font-semibold mt-0.5">
            {hasBid ? `Top bid: ${formatPrice(priceEurCents, currency)}` : `Starting from ${formatPrice(priceEurCents, currency)}`}
          </div>
        </div>
      </div>
    </div>
  );
}
