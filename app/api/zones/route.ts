import { NextResponse } from 'next/server';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { ZONE_DEFINITIONS, MIN_BID_INCREMENT_CENTS } from '@/lib/zones';
import { Zone } from '@/types/zone';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let adminClient;
    try {
      adminClient = getSupabaseAdmin();
    } catch (e) {
      // Return unseeded defaults if service role key isn't configured yet
      adminClient = null;
    }

    if (adminClient) {
      // 1. Fetch zones
      let { data: dbZones, error: zonesErr } = await adminClient
        .from('zones')
        .select('*');

      if (zonesErr) {
        console.error('Error fetching zones from Supabase:', zonesErr);
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
          .select('*');

        if (!seedErr && seeded) {
          dbZones = seeded;
        }
      }

      // 2. Fetch active bids
      const { data: activeBids, error: bidsErr } = await adminClient
        .from('bids')
        .select('*')
        .eq('status', 'active');

      if (bidsErr) {
        console.error('Error fetching active bids:', bidsErr);
      }

      // 3. Fetch all bids to count bids per zone
      const { data: allBids } = await adminClient
        .from('bids')
        .select('zone_id');

      const bidsCountMap: Record<string, number> = {};
      if (allBids) {
        allBids.forEach((b) => {
          bidsCountMap[b.zone_id] = (bidsCountMap[b.zone_id] || 0) + 1;
        });
      }

      const activeBidsMap: Record<string, any> = {};
      if (activeBids) {
        activeBids.forEach((b) => {
          if (!activeBidsMap[b.zone_id] || b.amount_cents > activeBidsMap[b.zone_id].amount_cents) {
            activeBidsMap[b.zone_id] = b;
          }
        });
      }

      if (dbZones && dbZones.length > 0) {
        const resultZones: Zone[] = dbZones.map((dbZone) => {
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
            brand_name: hasBid ? activeBid.brand_name : null,
            website_url: hasBid ? activeBid.website_url || null : null,
            logo_url: hasBid ? activeBid.logo_url : null,
            top_bidder_email: hasBid ? activeBid.email : null,
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

        return NextResponse.json({ zones: orderedZones });
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

    return NextResponse.json({ zones: fallbackZones });
  } catch (error: any) {
    console.error('Failed to get zones:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
