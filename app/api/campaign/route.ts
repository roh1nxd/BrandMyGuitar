import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { getLocalCampaign, getLocalZones } from '@/lib/store';
import { INITIAL_CAMPAIGN } from '@/lib/zones';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('campaign')
        .select('*')
        .eq('id', 1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching campaign:', error);
      }

      if (data) {
        return NextResponse.json({ campaign: data });
      }

      // If missing, seed campaign
      await supabaseAdmin.from('campaign').upsert(INITIAL_CAMPAIGN);
      return NextResponse.json({ campaign: INITIAL_CAMPAIGN });
    }

    // Local fallback: calculate raised from paid zones or stored campaign
    const localCampaign = getLocalCampaign();
    const paidZones = getLocalZones().filter((z) => z.status === 'paid');
    const calculatedRaised = paidZones.reduce((sum, z) => sum + z.price_cents, 0);
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
