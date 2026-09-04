'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Zone, Campaign, ZoneDefinition } from '@/types/zone';
import { INITIAL_ZONES, INITIAL_CAMPAIGN, ZONE_DEFINITIONS } from '@/lib/zones';
import { Currency } from '@/lib/currency';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

import { CheckCircle2, AlertCircle, X } from 'lucide-react';

import { createPortal } from 'react-dom';

interface ToastData {
  type: 'success' | 'error';
  message: string;
}

interface AuctionContextType {
  zones: Zone[];
  campaign: Campaign;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  selectedZoneId: string | null;
  setSelectedZoneId: (id: string | null) => void;
  toastNotification: ToastData | null;
  showToast: (toast: ToastData) => void;
  hideToast: () => void;
  syncPaidBid: (bidData: {
    zone_id: string;
    amount_cents: number;
    brand_name?: string;
    bidder_name?: string;
    email?: string;
    bidder_email?: string;
    website_url?: string;
    x_handle?: string;
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
  const [toastNotification, setToastNotification] = useState<ToastData | null>(null);
  const [activeToast, setActiveToast] = useState<ToastData | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (toastNotification) {
      setActiveToast(toastNotification);
    }
  }, [toastNotification]);

  const showToast = useCallback((toast: ToastData) => {
    setToastNotification(toast);
  }, []);

  const hideToast = useCallback(() => {
    setToastNotification(null);
  }, []);

  useEffect(() => {
    if (toastNotification) {
      const timer = setTimeout(() => {
        setToastNotification(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [toastNotification]);

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

        // Backup polling interval (15s)
        const interval = setInterval(refreshData, 15000);

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
        const interval = setInterval(refreshData, 15000);
        return () => clearInterval(interval);
      }
    } else {
      const interval = setInterval(refreshData, 15000);
      return () => clearInterval(interval);
    }
  }, [refreshData]);

  const getZoneDefinition = (zoneId: string) => {
    return ZONE_DEFINITIONS.find((z) => z.id === zoneId);
  };

  const getZoneState = (zoneId: string) => {
    return zones.find((z) => z.id === zoneId);
  };



  const syncPaidBid = async (bidData: {
    zone_id: string;
    amount_cents: number;
    brand_name?: string;
    bidder_name?: string;
    email?: string;
    bidder_email?: string;
    website_url?: string;
    x_handle?: string;
    twitter_handle?: string;
    logo_url: string;
  }): Promise<boolean> => {
    const finalBrandName = bidData.brand_name || bidData.bidder_name || '';
    const finalEmail = bidData.email || bidData.bidder_email || '';

    setZones((prevZones) =>
      prevZones.map((zone) => {
        if (zone.id === bidData.zone_id) {
          return {
            ...zone,
            status: 'paid',
            price_cents: bidData.amount_cents,
            current_bid_cents: bidData.amount_cents,
            bids_count: (zone.bids_count || 0) + 1,
            brand_name: finalBrandName,
            website_url: bidData.website_url || null,
            logo_url: bidData.logo_url,
            top_bidder_email: finalEmail,
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
        toastNotification,
        showToast,
        hideToast,
        syncPaidBid,
        getZoneDefinition,
        getZoneState,
        refreshData,
      }}
    >
      {/* Global Toast Notification Portal */}
      {mounted &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed bottom-6 right-6 z-[2147483647] max-w-sm w-[calc(100vw-3rem)]"
            style={{
              opacity: toastNotification ? 1 : 0,
              transform: toastNotification ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.95)',
              pointerEvents: toastNotification ? 'auto' : 'none',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {activeToast && (
              <div
                className={`flex items-start gap-3.5 p-4 rounded-2xl shadow-2xl border-2 ${
                  activeToast.type === 'success'
                    ? 'bg-[#061C14] border-emerald-500/80 text-emerald-50 shadow-black/80'
                    : 'bg-[#240A0F] border-rose-500/80 text-rose-50 shadow-black/80'
                }`}
              >
                {activeToast.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 text-xs">
                  <p className="font-bold text-sm mb-0.5 text-white">
                    {activeToast.type === 'success' ? 'Payment Verified' : 'Payment Status'}
                  </p>
                  <p className="text-gray-200 leading-relaxed font-medium">{activeToast.message}</p>
                </div>
                <button
                  onClick={hideToast}
                  className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 shrink-0 cursor-pointer"
                  aria-label="Close notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>,
          document.body
        )}
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
