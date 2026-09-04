'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuction } from '@/lib/AuctionContext';
import { formatPrice } from '@/lib/currency';
import { ZONE_DEFINITIONS } from '@/lib/zones';
import { ExternalLink, ArrowUpDown, ChevronRight } from 'lucide-react';

interface HistoricalBid {
  id: string;
  zone_id: string;
  brand_name: string;
  email: string;
  website_url?: string;
  x_handle?: string;
  logo_url: string;
  amount_cents: number;
  deposit_cents: number;
  status: 'active' | 'outbid';
  created_at: string;
}

// Utility for relative time formatting (e.g. "6h ago")
function formatRelativeTime(dateString?: string): string {
  if (!dateString) return 'Just now';
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now.getTime() - past.getTime();

  if (diffMs < 0) return 'Just now';

  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMins > 0) return `${diffMins}m ago`;
  return `${Math.max(1, diffSecs)}s ago`;
}

function renderXHandle(handle?: string) {
  if (!handle) return null;
  const cleanHandle = handle.trim().replace(/^@/, '');
  if (!cleanHandle) return null;
  return (
    <a
      href={`https://x.com/${cleanHandle}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[11px] text-muted hover:text-primary transition-colors inline-flex items-center font-normal ml-1"
      onClick={(e) => e.stopPropagation()}
    >
      @{cleanHandle}
    </a>
  );
}

export default function Leaderboard() {
  const { zones, campaign, currency, setSelectedZoneId } = useAuction();
  const [activeTab, setActiveTab] = useState<'spots' | 'history'>('spots');
  const [sortBy, setSortBy] = useState<'highest' | 'newest'>('highest');
  const [historyBids, setHistoryBids] = useState<HistoricalBid[]>([]);
  const [totalHistoryCount, setTotalHistoryCount] = useState<number>(0);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(true);

  // Fetch full bid history from /api/bids/history
  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/bids/history', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
      });
      if (res.ok) {
        const data = await res.json();
        setHistoryBids(data.bids || []);
        setTotalHistoryCount(data.totalCount || (data.bids ? data.bids.length : 0));
      }
    } catch (err) {
      console.warn('Failed to fetch history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 15000);
    return () => clearInterval(interval);
  }, [fetchHistory]);

  // Calculate spots taken
  const takenSpotsCount = zones.filter((z) => (z.current_bid_cents || 0) > 0).length;

  // Process & Sort Spots
  const processedSpots = zones.map((z) => {
    const def = ZONE_DEFINITIONS.find((d) => d.id === z.id);
    const hasBid = (z.current_bid_cents || 0) > 0;
    
    // Find latest bid for this zone from history
    const zoneBids = historyBids.filter((b) => b.zone_id === z.id);
    const latestBid = zoneBids[0]; // sorted created_at desc

    return {
      ...z,
      dimensions: def?.dimensions || '',
      spotNumber: def?.spotNumber || 0,
      hasBid,
      latestBidTime: latestBid?.created_at,
      websiteUrl: z.website_url || latestBid?.website_url,
      xHandle: (z as any).x_handle || latestBid?.x_handle,
    };
  });

  const sortedSpots = [...processedSpots].sort((a, b) => {
    if (sortBy === 'highest') {
      const priceA = a.hasBid ? a.current_bid_cents || 0 : a.min_bid_cents;
      const priceB = b.hasBid ? b.current_bid_cents || 0 : b.min_bid_cents;
      return priceB - priceA;
    } else {
      const timeA = a.latestBidTime ? new Date(a.latestBidTime).getTime() : 0;
      const timeB = b.latestBidTime ? new Date(b.latestBidTime).getTime() : 0;
      return timeB - timeA;
    }
  });

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-4">
      {/* Header Area */}
      <div className="bg-card border border-hairline rounded-2xl p-5 sm:p-8 mb-6 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-widest mb-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
          </span>
          <span>Auction live · {takenSpotsCount} of 7 spots taken</span>
        </div>

        <h2 className="text-2xl sm:text-4xl font-bold font-serif text-ink tracking-tight mb-2">
          The auction, live.
        </h2>
        <p className="text-muted text-xs sm:text-sm max-w-2xl">
          Real-time leaderboard ranking current spot leaders and complete historical log of all bids placed.
        </p>

        {/* Tab & Sort Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 pt-6 border-t border-hairline/70">
          {/* Two Pill Tabs: Spots & History */}
          <div className="flex items-center gap-1.5 p-1 bg-cream border border-hairline rounded-full text-xs font-semibold self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('spots')}
              className={`px-4 py-2 rounded-full transition-all cursor-pointer ${
                activeTab === 'spots'
                  ? 'bg-[#034F46] text-[#FFFFEB] shadow-xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Spots ranking
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-full transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-[#034F46] text-[#FFFFEB] shadow-xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              History ({totalHistoryCount})
            </button>
          </div>

          {/* Sort controls (only visible in Spots tab) */}
          {activeTab === 'spots' && (
            <div className="flex items-center gap-2 text-xs text-muted self-end sm:self-auto">
              <ArrowUpDown className="w-3.5 h-3.5 text-muted" />
              <span>Sort by:</span>
              <button
                onClick={() => setSortBy('highest')}
                className={`px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                  sortBy === 'highest'
                    ? 'border-primary text-primary font-bold bg-primary/5'
                    : 'border-hairline text-muted hover:text-ink'
                }`}
              >
                Highest
              </button>
              <button
                onClick={() => setSortBy('newest')}
                className={`px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                  sortBy === 'newest'
                    ? 'border-primary text-primary font-bold bg-primary/5'
                    : 'border-hairline text-muted hover:text-ink'
                }`}
              >
                Newest
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Spots Tab View */}
      {activeTab === 'spots' && (
        <>
          {/* Desktop Table View (md+) */}
          <div className="hidden md:block bg-card border border-hairline rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-hairline bg-cream/70 text-muted uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-3.5 px-6">Spot</th>
                  <th className="py-3.5 px-6">Held by</th>
                  <th className="py-3.5 px-6">Current Bid</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {sortedSpots.map((spot) => (
                  <tr key={spot.id} className="hover:bg-cream/40 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-bold text-ink text-sm block">{spot.name}</span>
                      <span className="text-[11px] text-muted block">Spot #{spot.spotNumber} · {spot.dimensions}</span>
                    </td>
                    <td className="py-4 px-6">
                      {spot.hasBid && spot.brand_name ? (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-cream border border-hairline rounded-md p-0.5 flex items-center justify-center shrink-0">
                            {spot.logo_url ? (
                              <img src={spot.logo_url} alt={spot.brand_name} className="max-h-full max-w-full object-contain" />
                            ) : (
                              <div className="w-full h-full bg-primary/10 rounded flex items-center justify-center text-[10px] font-bold text-primary">
                                {spot.brand_name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {spot.websiteUrl ? (
                                <a
                                  href={spot.websiteUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-bold text-ink hover:text-primary transition-colors inline-flex items-center gap-1 group"
                                >
                                  <span>{spot.brand_name}</span>
                                  <ExternalLink className="w-3 h-3 text-muted group-hover:text-primary" />
                                </a>
                              ) : (
                                <span className="font-bold text-ink">{spot.brand_name}</span>
                              )}
                              {renderXHandle(spot.xHandle)}
                            </div>
                            <span className="text-[10px] text-emerald-700 block font-medium">Active leader</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted font-medium italic">Unclaimed spot</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-primary text-sm block">
                        {formatPrice(spot.current_bid_cents || spot.min_bid_cents, currency)}
                      </span>
                      <span className="text-[11px] text-muted block">
                        {spot.hasBid
                          ? `${spot.bids_count || 1} ${spot.bids_count === 1 ? 'bid' : 'bids'} · ${formatRelativeTime(spot.latestBidTime)}`
                          : 'Starting price'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setSelectedZoneId(spot.id)}
                        className="px-4 py-2 rounded-full bg-[#034F46] hover:bg-[#023D36] text-[#FFFFEB] font-bold text-xs transition-colors shadow-xs cursor-pointer inline-flex items-center gap-1"
                      >
                        <span>{spot.hasBid ? 'Outbid' : 'Place first bid'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Card View (< md) */}
          <div className="md:hidden space-y-3">
            {sortedSpots.map((spot) => (
              <div key={spot.id} className="bg-card border border-hairline rounded-2xl p-4 flex flex-col gap-3 shadow-xs">
                {/* Row 1: Header + Price */}
                <div className="flex items-start justify-between border-b border-hairline/60 pb-3">
                  <div>
                    <span className="font-bold text-ink text-base block">{spot.name}</span>
                    <span className="text-[11px] text-muted block">Spot #{spot.spotNumber} · {spot.dimensions}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-primary text-base block">
                      {formatPrice(spot.current_bid_cents || spot.min_bid_cents, currency)}
                    </span>
                    <span className="text-[10px] text-muted block">
                      {spot.hasBid ? `${spot.bids_count || 1} ${spot.bids_count === 1 ? 'bid' : 'bids'}` : 'Starting price'}
                    </span>
                  </div>
                </div>

                {/* Row 2: Held By */}
                <div className="flex items-center justify-between text-xs py-1">
                  <span className="text-muted text-xs font-medium">Held by:</span>
                  {spot.hasBid && spot.brand_name ? (
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-cream border border-hairline rounded p-0.5 flex items-center justify-center shrink-0">
                        {spot.logo_url ? (
                          <img src={spot.logo_url} alt={spot.brand_name} className="max-h-full max-w-full object-contain" />
                        ) : (
                          <span className="text-[10px] font-bold text-primary">{spot.brand_name.charAt(0)}</span>
                        )}
                      </div>
                      {spot.websiteUrl ? (
                        <a
                          href={spot.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-ink hover:text-primary transition-colors inline-flex items-center gap-1"
                        >
                          <span>{spot.brand_name}</span>
                          <ExternalLink className="w-3 h-3 text-muted" />
                        </a>
                      ) : (
                        <span className="font-bold text-ink">{spot.brand_name}</span>
                      )}
                      {renderXHandle(spot.xHandle)}
                    </div>
                  ) : (
                    <span className="text-muted italic">Unclaimed spot</span>
                  )}
                </div>

                {/* Row 3: Action Button (Full Width Tappable on Mobile) */}
                <button
                  onClick={() => setSelectedZoneId(spot.id)}
                  className="w-full py-3 px-4 rounded-full bg-[#034F46] hover:bg-[#023D36] text-[#FFFFEB] font-bold text-xs transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5 mt-1"
                >
                  <span>{spot.hasBid ? 'Outbid' : 'Place first bid'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* History Tab View */}
      {activeTab === 'history' && (
        <div className="bg-card border border-hairline rounded-2xl overflow-hidden shadow-xs">
          {loadingHistory ? (
            <div className="p-8 text-center text-muted text-xs">Loading bid history...</div>
          ) : historyBids.length === 0 ? (
            <div className="p-12 text-center text-muted text-xs">
              No bids have been placed yet. Be the first to place a bid on any spot!
            </div>
          ) : (
            <>
              {/* Desktop History Table (md+) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-hairline bg-cream/70 text-muted uppercase text-[10px] font-bold tracking-wider">
                      <th className="py-3.5 px-6">Spot</th>
                      <th className="py-3.5 px-6">Bidder</th>
                      <th className="py-3.5 px-6">Amount</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {historyBids.map((bid) => {
                      const zoneDef = ZONE_DEFINITIONS.find((d) => d.id === bid.zone_id);
                      const isOutbid = bid.status === 'outbid';

                      return (
                        <tr key={bid.id} className="hover:bg-cream/40 transition-colors">
                          <td className="py-3.5 px-6 font-semibold text-ink">
                            {zoneDef?.name || bid.zone_id}
                          </td>
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 bg-cream border border-hairline rounded p-0.5 flex items-center justify-center shrink-0">
                                {bid.logo_url ? (
                                  <img src={bid.logo_url} alt={bid.brand_name} className="max-h-full max-w-full object-contain" />
                                ) : (
                                  <div className="w-full h-full bg-primary/10 rounded flex items-center justify-center text-[10px] font-bold text-primary">
                                    {bid.brand_name?.charAt(0) || 'B'}
                                  </div>
                                )}
                              </div>
                              {bid.website_url ? (
                                <a
                                  href={bid.website_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-bold text-ink hover:text-primary transition-colors inline-flex items-center gap-1 group"
                                >
                                  <span>{bid.brand_name}</span>
                                  <ExternalLink className="w-3 h-3 text-muted group-hover:text-primary" />
                                </a>
                              ) : (
                                <span className="font-bold text-ink">{bid.brand_name}</span>
                              )}
                              {renderXHandle(bid.x_handle)}
                            </div>
                          </td>
                          <td className="py-3.5 px-6 font-bold text-ink">
                            {formatPrice(bid.amount_cents, currency)}
                          </td>
                          <td className="py-3.5 px-6">
                            {isOutbid ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200 inline-block">
                                Outbid
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block">
                                Active Leader
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-6 text-right text-muted text-[11px]">
                            {formatRelativeTime(bid.created_at)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile History Stacked Cards (< md) */}
              <div className="md:hidden divide-y divide-hairline">
                {historyBids.map((bid) => {
                  const zoneDef = ZONE_DEFINITIONS.find((d) => d.id === bid.zone_id);
                  const isOutbid = bid.status === 'outbid';

                  return (
                    <div key={bid.id} className="p-4 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-ink text-sm">{zoneDef?.name || bid.zone_id}</span>
                        {isOutbid ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                            Outbid
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active Leader
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-hairline/50">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-cream border border-hairline rounded p-0.5 flex items-center justify-center shrink-0">
                            {bid.logo_url ? (
                              <img src={bid.logo_url} alt={bid.brand_name} className="max-h-full max-w-full object-contain" />
                            ) : (
                              <span className="text-[9px] font-bold text-primary">{bid.brand_name?.charAt(0) || 'B'}</span>
                            )}
                          </div>
                          {bid.website_url ? (
                            <a
                              href={bid.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold text-ink hover:text-primary transition-colors inline-flex items-center gap-1"
                            >
                              <span>{bid.brand_name}</span>
                              <ExternalLink className="w-3 h-3 text-muted" />
                            </a>
                          ) : (
                            <span className="font-bold text-ink">{bid.brand_name}</span>
                          )}
                          {renderXHandle(bid.x_handle)}
                        </div>

                        <span className="font-bold text-primary text-sm">{formatPrice(bid.amount_cents, currency)}</span>
                      </div>

                      <div className="text-[10px] text-muted text-right">
                        {formatRelativeTime(bid.created_at)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
