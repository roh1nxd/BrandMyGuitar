import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { getLocalZones } from '@/lib/store';
import { INITIAL_ZONES } from '@/lib/zones';
import { Zone } from '@/types/zone';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    if (isSupabaseConfigured && supabaseAdmin) {
      // Revert stale pending zones older than 30 mins
      await supabaseAdmin
        .from('zones')
        .update({
          status: 'available',
          brand_name: null,
          website_url: null,
          logo_url: null,
          stripe_session_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('status', 'pending')
        .lt('updated_at', thirtyMinutesAgo);

      const { data, error } = await supabaseAdmin
        .from('zones')
        .select('*')
        .order('price_cents', { ascending: true });

      if (error) {
        console.error('Error querying Supabase zones:', error);
        return NextResponse.json({ zones: getLocalZones() });
      }

      // If database is empty, seed it
      if (!data || data.length === 0) {
        await supabaseAdmin.from('zones').insert(INITIAL_ZONES);
        return NextResponse.json({ zones: INITIAL_ZONES });
      }

      return NextResponse.json({ zones: data });
    }

    return NextResponse.json({ zones: getLocalZones() });
  } catch (error: any) {
    console.error('Failed to get zones:', error);
    return NextResponse.json({ zones: getLocalZones() });
  }
}
