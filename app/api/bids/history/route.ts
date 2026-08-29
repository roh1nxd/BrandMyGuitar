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

export async function GET() {
  try {
    let adminClient;
    try {
      adminClient = getSupabaseAdmin();
    } catch {
      adminClient = null;
    }

    if (!adminClient) {
      return noCacheJson({ bids: [], totalCount: 0 });
    }

    // Fetch all bids ordered by created_at desc
    const { data: bids, error, count } = await adminClient
      .from('bids')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bid history:', error);
      return noCacheJson({ error: error.message }, { status: 500 });
    }

    const normalizedBids = (bids || []).map((b: any) => ({
      ...b,
      brand_name: b.brand_name || b.bidder_name || '',
      email: b.email || b.bidder_email || '',
    }));

    return noCacheJson({
      bids: normalizedBids,
      totalCount: count || (bids ? bids.length : 0),
    });
  } catch (error: any) {
    console.error('Bid history API exception:', error);
    return noCacheJson({ error: error.message }, { status: 500 });
  }
}
