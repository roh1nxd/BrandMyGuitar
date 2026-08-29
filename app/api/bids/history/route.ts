import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let adminClient;
    try {
      adminClient = getSupabaseAdmin();
    } catch {
      adminClient = null;
    }

    if (!adminClient) {
      return NextResponse.json({ bids: [], totalCount: 0 });
    }

    // Fetch all bids ordered by created_at desc
    const { data: bids, error, count } = await adminClient
      .from('bids')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bid history:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const normalizedBids = (bids || []).map((b: any) => ({
      ...b,
      brand_name: b.brand_name || b.bidder_name || '',
      email: b.email || b.bidder_email || '',
    }));

    return NextResponse.json({
      bids: normalizedBids,
      totalCount: count || (bids ? bids.length : 0),
    });
  } catch (error: any) {
    console.error('Bid history API exception:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
