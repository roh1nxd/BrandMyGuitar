import { NextResponse } from 'next/server';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { getLocalCampaign, getLocalZones } from '@/lib/store';
import { INITIAL_CAMPAIGN } from '@/lib/zones';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    let adminClient;
    try {
      adminClient = getSupabaseAdmin();
    } catch {
      adminClient = null;
    }

    if (isSupabaseConfigured && adminClient) {
      // Calculate raised_cents dynamically from active bids in database
      const { data: activeBids } = await adminClient
        .from('bids')
        .select('amount_cents')
        .eq('status', 'active');

      const totalRaisedFromBids = activeBids
        ? activeBids.reduce((sum: number, b: any) => sum + (b.amount_cents || 0), 0)
        : 0;

      const campaign = {
        ...INITIAL_CAMPAIGN,
        raised_cents: Math.max(INITIAL_CAMPAIGN.raised_cents, totalRaisedFromBids),
      };

      return NextResponse.json({ campaign });
    }

    // Local fallback: calculate raised from paid zones or stored campaign
    const localCampaign = getLocalCampaign();
    const paidZones = getLocalZones().filter((z) => z.status === 'paid');
    const calculatedRaised = paidZones.reduce((sum, z) => sum + (z.price_cents ?? z.current_bid_cents ?? z.min_bid_cents ?? 0), 0);
    const campaign = {
      ...localCampaign,
      raised_cents: Math.max(localCampaign.raised_cents, calculatedRaised),
    };

    return NextResponse.json({ campaign });
  } catch (error: any) {
    console.error('Campaign route error:', error);
    return NextResponse.json({ campaign: INITIAL_CAMPAIGN });
  }
}
