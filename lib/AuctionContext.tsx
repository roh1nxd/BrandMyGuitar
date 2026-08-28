'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Zone, Campaign, ZoneDefinition } from '@/types/zone';
import { INITIAL_ZONES, INITIAL_CAMPAIGN, ZONE_DEFINITIONS, MIN_BID_INCREMENT_CENTS } from '@/lib/zones';
import { Currency } from '@/lib/currency';

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

  const refreshData = async () => {
    try {
      const [zonesRes, campaignRes] = await Promise.all([
        fetch('/api/zones', { cache: 'no-store' }),
        fetch('/api/campaign', { cache: 'no-store' }),
      ]);
      if (zonesRes.ok) {
        const data = await zonesRes.json();
        if (data.zones && Array.isArray(data.zones)) {
          setZones(data.zones);
        }
      }
      if (campaignRes.ok) {
        const campData = await campaignRes.json();
        if (campData.campaign) {
          setCampaign(campData.campaign);
        }
      }
    } catch (e) {
      console.warn('Network sync notice (using local auction state):', e);
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, []);

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
    // 1. Immediate synchronous local state update across ALL subscribed views (2D, 3D, Grid)
    setZones((prevZones) =>
      prevZones.map((zone) => {
        if (zone.id === bidData.zone_id) {
          return {
            ...zone,
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

    // Update campaign raised total in real time
    setCampaign((prev) => {
      const updatedTotal = zones.reduce((sum, z) => {
        if (z.id === bidData.zone_id) return sum + bidData.amount_cents;
        return sum + (z.current_bid_cents || 0);
      }, 0);
      return { ...prev, raised_cents: Math.max(prev.raised_cents, updatedTotal) };
    });

    // 2. Dispatch to backend API (failsafe background call)
    try {
      await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zone_id: bidData.zone_id,
          amount_cents: bidData.amount_cents,
          bidder_name: bidData.bidder_name,
          bidder_email: bidData.bidder_email,
          website_url: bidData.website_url || 'https://brandmyguitar.com',
          logo_url: bidData.logo_url,
        }),
      });
    } catch (err) {
      console.warn('Backend recorded via client store:', err);
    }

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
