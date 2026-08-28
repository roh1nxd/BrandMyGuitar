import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { stripe, isStripeConfigured } from '@/lib/stripe';
import { ZONE_DEFINITIONS, MIN_BID_INCREMENT_CENTS, DEPOSIT_PERCENTAGE } from '@/lib/zones';
import { getLocalZones, processNewBid } from '@/lib/store';

const BidCheckoutSchema = z.object({
  zone_id: z.string().min(1, 'Zone ID is required'),
  amount_cents: z.coerce.number().int().positive('Bid amount must be a positive number'),
  bidder_name: z.string().min(1, 'Please enter your brand or company name').max(100),
  bidder_email: z.string().email('Please enter a valid email address (e.g. name@domain.com)'),
  website_url: z.string().min(1, 'Please enter your website URL').refine((val) => {
    try {
      const url = val.startsWith('http://') || val.startsWith('https://') ? val : `https://${val}`;
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }, 'Please enter a valid website URL'),
  logo_url: z.string().min(1, 'Please attach a brand logo artwork'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Received bid checkout payload:', body);

    const validation = BidCheckoutSchema.safeParse(body);

    if (!validation.success) {
      const details = validation.error.flatten();
      console.log('Zod validation details:', JSON.stringify(details));

      // Extract specific friendly error message
      const firstField = Object.keys(details.fieldErrors)[0];
      const specificMessage = details.fieldErrors[firstField as keyof typeof details.fieldErrors]?.[0] || 'Invalid input';

      return NextResponse.json(
        { error: specificMessage, details },
        { status: 400 }
      );
    }

    const { zone_id, amount_cents, bidder_name, bidder_email, logo_url } = validation.data;
    let website_url = validation.data.website_url.trim();
    if (!/^https?:\/\//i.test(website_url)) {
      website_url = `https://${website_url}`;
    }

    const zoneDef = ZONE_DEFINITIONS.find((z) => z.id === zone_id);
    if (!zoneDef) {
      return NextResponse.json({ error: 'Selected zone not found' }, { status: 404 });
    }

    // Check current zone state
    const zones = getLocalZones();
    const currentZone = zones.find((z) => z.id === zone_id);
    const hasCurrentBid = currentZone?.current_bid_cents !== null && (currentZone?.current_bid_cents || 0) > 0;
    
    const minRequiredBid = hasCurrentBid
      ? currentZone!.current_bid_cents! + MIN_BID_INCREMENT_CENTS
      : zoneDef.min_bid_cents;

    if (amount_cents < minRequiredBid) {
      return NextResponse.json(
        { error: `Bid must be at least ${(minRequiredBid / 100).toFixed(0)} €.` },
        { status: 400 }
      );
    }

    const deposit_cents = Math.round(amount_cents * DEPOSIT_PERCENTAGE);
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // If Stripe is configured, create checkout session for the deposit
    if (isStripeConfigured && stripe) {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer_email: bidder_email,
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: `20% Auction Deposit — ${zoneDef.name} Spot (${(amount_cents / 100).toFixed(0)} € Bid)`,
                description: `20% refundable deposit for placing a ${(amount_cents / 100).toFixed(0)} € bid on the ${zoneDef.name}. Automatically refunded if you are outbid.`,
                images: logo_url.startsWith('http') ? [logo_url] : undefined,
              },
              unit_amount: deposit_cents,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}&zone_id=${zone_id}`,
        cancel_url: `${origin}/cancel?zone_id=${zone_id}`,
        metadata: {
          zone_id,
          amount_cents: amount_cents.toString(),
          deposit_cents: deposit_cents.toString(),
          bidder_name,
          bidder_email,
          website_url,
          logo_url,
        },
      });

      return NextResponse.json({ url: session.url, sessionId: session.id });
    }

    // Demo Mode: Process bid immediately
    const mockSessionId = `mock_bid_${Date.now()}`;
    await processNewBid({
      zone_id,
      bidder_name,
      bidder_email,
      website_url,
      logo_url,
      amount_cents,
      stripe_session_id: mockSessionId,
    });

    return NextResponse.json({
      url: `${origin}/success?session_id=${mockSessionId}&zone_id=${zone_id}&mock=true`,
      sessionId: mockSessionId,
      mock: true,
    });
  } catch (error: any) {
    console.error('Bid checkout API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
