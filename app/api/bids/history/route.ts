import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

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

import { getCachedHistoryData, setCachedHistoryData } from '@/lib/cache';

export async function GET() {
  const reqStart = Date.now();
  console.log(`[STAGE 1 - ENTRY] GET /api/bids/history handler entered at +0ms`);

  try {
    const cached = getCachedHistoryData();
    if (cached) {
      console.log(`[CACHE HIT] GET /api/bids/history (served from cache, age: ${cached.ageMs}ms, handler execution time: ${Date.now() - reqStart}ms)`);
      return noCacheJson(cached.data);
    }

    console.log(`[STAGE 2 - CACHE MISS] GET /api/bids/history at +${Date.now() - reqStart}ms`);

    let adminClient;
    const clientStart = Date.now();
    try {
      adminClient = getSupabaseAdmin();
    } catch {
      adminClient = null;
    }
    console.log(`[STAGE 3 - CLIENT SETUP] getSupabaseAdmin took ${Date.now() - clientStart}ms (total elapsed: +${Date.now() - reqStart}ms)`);

    if (!adminClient) {
      return noCacheJson({ bids: [], totalCount: 0 });
    }

    const dbStart = Date.now();
    // Fetch bids selecting specific columns ordered by created_at desc
    const { data: bids, error, count } = await adminClient
      .from('bids')
      .select('id, zone_id, brand_name, email, website_url, x_handle, logo_url, amount_cents, deposit_cents, status, created_at', { count: 'exact' })
      .order('created_at', { ascending: false });

    console.log(`[STAGE 4 - DB QUERIES] Query completed in ${Date.now() - dbStart}ms (total elapsed: +${Date.now() - reqStart}ms)`);

    if (error) {
      console.error('Error fetching bid history:', error);
      return noCacheJson({ error: error.message }, { status: 500 });
    }

    const mapStart = Date.now();
    const normalizedBids = (bids || []).map((b: any) => ({
      ...b,
      brand_name: b.brand_name || b.bidder_name || '',
      email: b.email || b.bidder_email || '',
    }));

    const resultPayload = {
      bids: normalizedBids,
      totalCount: count || (bids ? bids.length : 0),
    };

    console.log(`[STAGE 5 - DATA MAPPING] Data mapping took ${Date.now() - mapStart}ms`);
    setCachedHistoryData(resultPayload);

    console.log(`[STAGE 6 - RESPONSE COMPLETE] Total route execution time: ${Date.now() - reqStart}ms`);
    return noCacheJson(resultPayload);
  } catch (error: any) {
    console.error('Bid history API exception:', error);
    return noCacheJson({ error: error.message }, { status: 500 });
  }
}
