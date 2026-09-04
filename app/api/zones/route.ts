import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { ZONE_DEFINITIONS, MIN_BID_INCREMENT_CENTS } from '@/lib/zones';
import { Zone } from '@/types/zone';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function noCacheJson(body: any, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...(init?.headers || {}),
    },
  });
}

import { getCachedZonesData, setCachedZonesData } from '@/lib/cache';

export async function GET() {
  const reqStart = Date.now();
  console.log(`[STAGE 1 - ENTRY] GET /api/zones handler entered at +0ms`);

  try {
    const cached = getCachedZonesData();
    if (cached) {
      console.log(`[CACHE HIT] GET /api/zones (served from cache, age: ${cached.ageMs}ms, handler execution time: ${Date.now() - reqStart}ms)`);
      return noCacheJson(cached.data);
    }

    console.log(`[STAGE 2 - CACHE MISS] GET /api/zones at +${Date.now() - reqStart}ms`);

    let adminClient;
    const clientStart = Date.now();
    try {
      adminClient = getSupabaseAdmin();
    } catch (e) {
      adminClient = null;
    }
    console.log(`[STAGE 3 - CLIENT SETUP] getSupabaseAdmin took ${Date.now() - clientStart}ms (total elapsed: +${Date.now() - reqStart}ms)`);

    if (adminClient) {
      const dbStart = Date.now();
      // Execute DB queries concurrently via Promise.all with specific column selection
      const [zonesRes, activeBidsRes, allBidsRes] = await Promise.all([
        adminClient.from('zones').select('id, name, size, starting_price_cents'),
        adminClient.from('bids').select('id, zone_id, brand_name, email, website_url, logo_url, amount_cents, status').eq('status', 'active'),
        adminClient.from('bids').select('zone_id'),
      ]);

      const dbDuration = Date.now() - dbStart;
      console.log(`[STAGE 4 - DB QUERIES] Supabase Promise.all took ${dbDuration}ms (total elapsed: +${Date.now() - reqStart}ms)`);

      let dbZones = zonesRes.data;
      const zonesErr = zonesRes.error;
      const activeBids = activeBidsRes.data;
      const bidsErr = activeBidsRes.error;
      const allBids = allBidsRes.data;

      if (zonesErr) {
        console.error('Error fetching zones from Supabase:', zonesErr);
      }
      if (bidsErr) {
        console.error('Error fetching active bids:', bidsErr);
      }

      // If no zones exist in DB, seed them automatically
      if (!dbZones || dbZones.length === 0) {
        const seedPayload = ZONE_DEFINITIONS.map((def) => ({
          id: def.id,
          name: def.name,
          size: def.size,
          starting_price_cents: def.min_bid_cents,
          min_increment_cents: MIN_BID_INCREMENT_CENTS,
        }));

        const { data: seeded, error: seedErr } = await adminClient
          .from('zones')
          .insert(seedPayload)
          .select('id, name, size, starting_price_cents');

        if (!seedErr && seeded) {
          dbZones = seeded;
        }
      }

      const mapStart = Date.now();
      const bidsCountMap: Record<string, number> = {};
      if (allBids) {
        allBids.forEach((b: any) => {
          bidsCountMap[b.zone_id] = (bidsCountMap[b.zone_id] || 0) + 1;
        });
      }

      const activeBidsMap: Record<string, any> = {};
      if (activeBids) {
        activeBids.forEach((b: any) => {
          if (!activeBidsMap[b.zone_id] || b.amount_cents > activeBidsMap[b.zone_id].amount_cents) {
            activeBidsMap[b.zone_id] = b;
          }
        });
      }

      if (dbZones && dbZones.length > 0) {
        const resultZones: Zone[] = dbZones.map((dbZone: any) => {
          const activeBid = activeBidsMap[dbZone.id];
          const hasBid = Boolean(activeBid);

          return {
            id: dbZone.id,
            name: dbZone.name,
            size: dbZone.size,
            min_bid_cents: dbZone.starting_price_cents,
            current_bid_cents: hasBid ? activeBid.amount_cents : null,
            bids_count: bidsCountMap[dbZone.id] || 0,
            status: hasBid ? 'paid' : 'available',
            price_cents: hasBid ? activeBid.amount_cents : dbZone.starting_price_cents,
            brand_name: hasBid ? (activeBid.brand_name || activeBid.bidder_name || null) : null,
            website_url: hasBid ? activeBid.website_url || null : null,
            logo_url: hasBid ? activeBid.logo_url : null,
            top_bidder_email: hasBid ? (activeBid.email || activeBid.bidder_email || null) : null,
          };
        });

        const orderedZones = ZONE_DEFINITIONS.map((def) => {
          return resultZones.find((z) => z.id === def.id) || {
            id: def.id,
            name: def.name,
            size: def.size,
            min_bid_cents: def.min_bid_cents,
            current_bid_cents: null,
            bids_count: 0,
            status: 'available',
            price_cents: def.min_bid_cents,
            brand_name: null,
            website_url: null,
            logo_url: null,
            top_bidder_email: null,
          };
        });

        console.log(`[STAGE 5 - DATA MAPPING] Data mapping took ${Date.now() - mapStart}ms`);
        const payload = { zones: orderedZones };
        setCachedZonesData(payload);
        console.log(`[STAGE 6 - RESPONSE COMPLETE] Total route execution time: ${Date.now() - reqStart}ms`);
        return noCacheJson(payload);
      }
    }

    // Fallback if Supabase fails or isn't configured
    const fallbackZones: Zone[] = ZONE_DEFINITIONS.map((def) => ({
      id: def.id,
      name: def.name,
      size: def.size,
      min_bid_cents: def.min_bid_cents,
      current_bid_cents: null,
      bids_count: 0,
      status: 'available',
      price_cents: def.min_bid_cents,
      brand_name: null,
      website_url: null,
      logo_url: null,
      top_bidder_email: null,
    }));

    console.log(`[STAGE 6 - FALLBACK RESPONSE] Total route execution time: ${Date.now() - reqStart}ms`);
    return noCacheJson({ zones: fallbackZones });
  } catch (error: any) {
    console.error('Failed to get zones:', error);
    return noCacheJson({ error: error.message }, { status: 500 });
  }
}
