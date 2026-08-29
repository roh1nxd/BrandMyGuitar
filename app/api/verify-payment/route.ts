import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { processNewBid } from '@/lib/store';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { MIN_BID_INCREMENT_CENTS } from '@/lib/zones';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bid_data } = body;

    // Validate missing fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing required payment verification fields (order_id, payment_id, or signature).' },
        { status: 400 }
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json(
        { error: 'RAZORPAY_KEY_SECRET is not configured on the server.' },
        { status: 500 }
      );
    }

    // HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const generated_signature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    // Compare generated signature with razorpay_signature using timingSafeEqual or direct comparison
    const isSignatureValid = crypto.timingSafeEqual(
      Buffer.from(generated_signature, 'utf-8'),
      Buffer.from(razorpay_signature, 'utf-8')
    );

    if (!isSignatureValid) {
      return NextResponse.json(
        { error: 'Invalid payment signature. Verification failed.' },
        { status: 400 }
      );
    }

    // Signature verified successfully!
    let recordedBid = null;

    // If bid_data is provided, record the bid in DB / Store
    if (bid_data) {
      const { zone_id, bidder_name, bidder_email, website_url, twitter_handle, logo_url, amount_cents } = bid_data;

      if (zone_id && bidder_name && bidder_email && amount_cents) {
        // 1. Process in local store
        const storeResult = await processNewBid({
          zone_id,
          bidder_name,
          bidder_email,
          website_url: website_url || '',
          logo_url: logo_url || '',
          amount_cents,
          razorpay_payment_id,
          razorpay_order_id,
          razorpay_signature,
        });
        recordedBid = storeResult.bid;

        // 2. If Supabase is configured, record in database
        if (isSupabaseConfigured) {
          try {
            const adminClient = getSupabaseAdmin();
            // Mark previous active bids on zone as outbid
            await adminClient
              .from('bids')
              .update({ status: 'outbid' })
              .eq('zone_id', zone_id)
              .eq('status', 'active');

            // Insert new active bid with unique text ID and column compatibility
            const deposit_cents = Math.round(amount_cents * 0.20);
            const newBidId = `bid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

            const bidPayload: any = {
              id: newBidId,
              zone_id,
              bidder_name: bidder_name,
              bidder_email: bidder_email,
              brand_name: bidder_name,
              email: bidder_email,
              website_url: website_url || '',
              x_handle: twitter_handle || null,
              twitter_handle: twitter_handle || null,
              logo_url: logo_url || '',
              amount_cents,
              deposit_cents,
              razorpay_payment_id,
              razorpay_order_id,
              razorpay_signature,
              status: 'active',
            };

            const { error: insertErr } = await adminClient.from('bids').insert(bidPayload);
            if (insertErr) {
              console.warn('Initial insert payload notice, retrying with schema.sql fallback:', insertErr.message);
              const cleanPayload = {
                id: newBidId,
                zone_id,
                bidder_name: bidder_name,
                bidder_email: bidder_email,
                website_url: website_url || '',
                logo_url: logo_url || '',
                amount_cents,
                deposit_cents,
                razorpay_payment_id,
                razorpay_order_id,
                razorpay_signature,
                status: 'active',
              };
              const { error: retryErr } = await adminClient.from('bids').insert(cleanPayload);
              if (retryErr) {
                console.error('Database insertion failed on retry:', retryErr);
              }
            }
          } catch (dbErr) {
            console.error('Database update error after Razorpay verification:', dbErr);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payment signature verified successfully.',
      razorpay_order_id,
      razorpay_payment_id,
      bid: recordedBid,
    });
  } catch (error: any) {
    console.error('Verify payment error:', error);
    return NextResponse.json(
      { error: error.message || 'Payment verification encountered an internal server error.' },
      { status: 500 }
    );
  }
}
