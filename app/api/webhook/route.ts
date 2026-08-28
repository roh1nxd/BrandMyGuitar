import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { processNewBid } from '@/lib/store';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (webhookSecret && sig && stripe) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err: any) {
    console.error(`Webhook signature error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata || {};
    const zoneId = metadata.zone_id;
    const amountCents = parseInt(metadata.amount_cents || '0', 10);
    const bidderName = metadata.bidder_name;
    const bidderEmail = metadata.bidder_email || session.customer_details?.email || '';
    const websiteUrl = metadata.website_url;
    const logoUrl = metadata.logo_url;
    const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : null;

    if (zoneId && amountCents > 0) {
      console.log(`Processing confirmed bid for zone ${zoneId}: ${(amountCents / 100).toFixed(0)} EUR`);
      await processNewBid({
        zone_id: zoneId,
        bidder_name: bidderName,
        bidder_email: bidderEmail,
        website_url: websiteUrl,
        logo_url: logoUrl,
        amount_cents: amountCents,
        stripe_payment_intent_id: paymentIntentId,
        stripe_session_id: session.id,
      });
    }
  }

  return NextResponse.json({ received: true });
}
