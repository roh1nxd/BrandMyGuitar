import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { MIN_BID_INCREMENT_CENTS } from '@/lib/zones';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { zone_id, amount_cents, bidder_name, bidder_email, website_url, twitter_handle, logo_url } = body;

    if (!zone_id || !bidder_name || !bidder_email || !website_url || !logo_url || !amount_cents) {
      return NextResponse.json(
        { error: 'Missing required bid parameters (zone, brand name, email, website URL, logo artwork, or amount).' },
        { status: 400 }
      );
    }

    // Normalize website URL to ensure valid protocol
    let formattedWebsiteUrl = website_url.trim();
    if (!formattedWebsiteUrl.startsWith('http://') && !formattedWebsiteUrl.startsWith('https://')) {
      formattedWebsiteUrl = `https://${formattedWebsiteUrl}`;
    }

    // Basic domain validation
    try {
      const parsedUrl = new URL(formattedWebsiteUrl);
      if (!parsedUrl.hostname.includes('.')) {
        return NextResponse.json({ error: 'Please enter a valid website domain (e.g. company.com).' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid website URL format. Please enter a valid domain.' }, { status: 400 });
    }

    let adminClient;
    try {
      adminClient = getSupabaseAdmin();
    } catch (err: any) {
      console.error('Supabase Admin initialization failed in /api/bid:', err.message);
      return NextResponse.json(
        { error: err.message || 'SUPABASE_SERVICE_ROLE_KEY is missing in .env.local.' },
        { status: 500 }
      );
    }

    // 1. Fetch zone starting price
    const { data: dbZone, error: zoneErr } = await adminClient
      .from('zones')
      .select('*')
      .eq('id', zone_id)
      .single();

    const minStartingCents = dbZone?.starting_price_cents || 10000;

    // 2. Fetch current active bid for this zone
    const { data: currentActiveBids } = await adminClient
      .from('bids')
      .select('*')
      .eq('zone_id', zone_id)
      .eq('status', 'active')
      .order('amount_cents', { ascending: false });

    const topActiveBid = currentActiveBids && currentActiveBids.length > 0 ? currentActiveBids[0] : null;

    const minRequiredCents = topActiveBid
      ? topActiveBid.amount_cents + MIN_BID_INCREMENT_CENTS
      : minStartingCents;

    if (amount_cents < minRequiredCents) {
      return NextResponse.json(
        { error: `Bid amount must be at least ${minRequiredCents / 100} €.` },
        { status: 400 }
      );
    }

    // 3. Mark previous active bids on this zone as 'outbid' (Preserves historical bid rows!)
    if (topActiveBid) {
      await adminClient
        .from('bids')
        .update({ status: 'outbid' })
        .eq('zone_id', zone_id)
        .eq('status', 'active');
    }

    // 4. Insert new active bid
    const deposit_cents = Math.round(amount_cents * 0.20);
    const { data: newBid, error: insertErr } = await adminClient
      .from('bids')
      .insert({
        zone_id,
        brand_name: bidder_name,
        email: bidder_email,
        website_url: formattedWebsiteUrl,
        x_handle: twitter_handle || null,
        logo_url,
        amount_cents,
        deposit_cents,
        status: 'active',
      })
      .select('*')
      .single();

    if (insertErr) {
      console.error('Error inserting bid:', insertErr);
      return NextResponse.json(
        { error: `Failed to record bid in database: ${insertErr.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, bid: newBid });
  } catch (error: any) {
    console.error('Bid API exception:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error processing bid.' },
      { status: 500 }
    );
  }
}
