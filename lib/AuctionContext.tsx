'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Zone, Campaign, ZoneDefinition } from '@/types/zone';
import { INITIAL_ZONES, INITIAL_CAMPAIGN, ZONE_DEFINITIONS } from '@/lib/zones';
import { Currency } from '@/lib/currency';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface AuctionContextType {
  zones: Zone[];
  campaign: Campaign;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  selectedZoneId: string | null;
  setSelectedZoneId: (id: string | null) => void;
  placeBid: (bidData: {
    zone_id: string;
    amount_cents: number;
    bidder_name: string;
    bidder_email: string;
    website_url?: string;
    twitter_handle?: string;
    logo_url: string;
  }) => Promise<boolean>;
  syncPaidBid: (bidData: {
    zone_id: string;
    amount_cents: number;
    bidder_name: string;
    bidder_email: string;
    website_url?: string;
    twitter_handle?: string;
    logo_url: string;
  }) => Promise<boolean>;
  getZoneDefinition: (zoneId: string) => ZoneDefinition | undefined;
  getZoneState: (zoneId: string) => Zone | undefined;
  refreshData: () => Promise<void>;
}

const AuctionContext = createContext<AuctionContextType | null>(null);

export function AuctionProvider({ children }: { children: React.ReactNode }) {
  const [zones, setZones] = useState<Zone[]>(INITIAL_ZONES);
  const [campaign, setCampaign] = useState<Campaign>(INITIAL_CAMPAIGN);
  const [currency, setCurrency] = useState<Currency>('EUR');
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    try {
      const res = await fetch('/api/zones', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.zones && Array.isArray(data.zones)) {
          setZones(data.zones);

          // Compute total raised from active bids
          const totalRaised = data.zones.reduce((sum: number, z: Zone) => {
            return sum + (z.current_bid_cents || 0);
          }, 0);

          setCampaign((prev) => ({
            ...prev,
            raised_cents: totalRaised,
          }));
        }
      }
    } catch (e) {
      console.warn('Sync notice:', e);
    }
  }, []);

  useEffect(() => {
    refreshData();

    // 1. Subscribe to Supabase Realtime changes on 'bids' table safely
    if (isSupabaseConfigured && supabase) {
      try {
        const bidsChannel = supabase
          .channel('public:bids')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'bids' },
            () => {
              refreshData();
            }
          )
          .subscribe();

        // Backup polling interval
        const interval = setInterval(refreshData, 5000);

        return () => {
          try {
            supabase?.removeChannel(bidsChannel);
          } catch (e) {
            // ignore cleanup warning
          }
          clearInterval(interval);
        };
      } catch (err) {
        console.warn('Realtime subscription fallback to polling:', err);
        const interval = setInterval(refreshData, 4000);
        return () => clearInterval(interval);
      }
    } else {
      const interval = setInterval(refreshData, 4000);
      return () => clearInterval(interval);
    }
  }, [refreshData]);

  const getZoneDefinition = (zoneId: string) => {
    return ZONE_DEFINITIONS.find((z) => z.id === zoneId);
  };

  const getZoneState = (zoneId: string) => {
    return zones.find((z) => z.id === zoneId);
  };

  const placeBid = async (bidData: {
    zone_id: string;
    amount_cents: number;
    bidder_name: string;
    bidder_email: string;
    website_url?: string;
    twitter_handle?: string;
    logo_url: string;
  }): Promise<boolean> => {
    // Optimistic local UI state update
    setZones((prevZones) =>
      prevZones.map((zone) => {
        if (zone.id === bidData.zone_id) {
          return {
            ...zone,
            status: 'paid',
            price_cents: bidData.amount_cents,
            current_bid_cents: bidData.amount_cents,
            bids_count: (zone.bids_count || 0) + 1,
            brand_name: bidData.bidder_name,
            website_url: bidData.website_url || null,
            logo_url: bidData.logo_url,
            top_bidder_email: bidData.bidder_email,
          };
        }
        return zone;
      })
    );

    // Call server-side /api/bid endpoint
    const res = await fetch('/api/bid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bidData),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      // Revert optimistic update on failure
      await refreshData();
      throw new Error(data.error || 'Failed to place bid on server.');
    }

    // Trigger full state refresh from DB
    await refreshData();
    return true;
  };

  const syncPaidBid = async (bidData: {
    zone_id: string;
    amount_cents: number;
    bidder_name: string;
    bidder_email: string;
    website_url?: string;
    twitter_handle?: string;
    logo_url: string;
  }): Promise<boolean> => {
    setZones((prevZones) =>
      prevZones.map((zone) => {
        if (zone.id === bidData.zone_id) {
          return {
            ...zone,
            status: 'paid',
            price_cents: bidData.amount_cents,
            current_bid_cents: bidData.amount_cents,
            bids_count: (zone.bids_count || 0) + 1,
            brand_name: bidData.bidder_name,
            website_url: bidData.website_url || null,
            logo_url: bidData.logo_url,
            top_bidder_email: bidData.bidder_email,
          };
        }
        return zone;
      })
    );

    await refreshData();
    return true;
  };

  return (
    <AuctionContext.Provider
      value={{
        zones,
        campaign,
        currency,
        setCurrency,
        selectedZoneId,
        setSelectedZoneId,
        placeBid,
        syncPaidBid,
        getZoneDefinition,
        getZoneState,
        refreshData,
      }}
    >
      {children}
    </AuctionContext.Provider>
  );
}

export function useAuction() {
  const context = useContext(AuctionContext);
  if (!context) {
    throw new Error('useAuction must be used within an AuctionProvider');
  }
  return context;
}
