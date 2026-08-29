import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { processNewBid } from '@/lib/store';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('[VERIFY-PAYMENT PAYLOAD RECEIVED]', body);

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bid_data } = body;

    // Validate missing fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.error('[VERIFY-PAYMENT ERROR] Missing required payment verification fields.');
      return NextResponse.json(
        { error: 'Missing required payment verification fields (order_id, payment_id, or signature).' },
        { status: 400 }
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      console.error('[VERIFY-PAYMENT ERROR] RAZORPAY_KEY_SECRET is missing on server.');
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

    const isSignatureValid = crypto.timingSafeEqual(
      Buffer.from(generated_signature, 'utf-8'),
      Buffer.from(razorpay_signature, 'utf-8')
    );

    if (!isSignatureValid) {
      console.error('[VERIFY-PAYMENT ERROR] Invalid payment signature:', {
        expected: generated_signature,
        received: razorpay_signature,
      });
      return NextResponse.json(
        { error: 'Invalid payment signature. Verification failed.' },
        { status: 400 }
      );
    }

    console.log('[VERIFY-PAYMENT SIGNATURE VALIDATED]');

    let recordedBid = null;

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
          const adminClient = getSupabaseAdmin();
          const deposit_cents = Math.round(amount_cents * 0.20);
          const newBidId = `bid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

          // 2a. Mark previous active bids as outbid
          console.log('[SUPABASE OUTBID UPDATE START]', { zone_id });
          const { error: outbidErr } = await adminClient
            .from('bids')
            .update({ status: 'outbid' })
            .eq('zone_id', zone_id)
            .eq('status', 'active');

          if (outbidErr) {
            console.warn('[SUPABASE OUTBID UPDATE NOTICE]', outbidErr);
          }

          // 2b. Insert new active bid matching exact schema.sql columns
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

          console.log('[SUPABASE INSERT START]', { newBidId, cleanPayload });

          const { data: insertedData, error: insertErr } = await adminClient
            .from('bids')
            .insert(cleanPayload)
            .select('*')
            .single();

          if (insertErr) {
            console.error('[SUPABASE INSERT CRITICAL ERROR]', insertErr);
            return NextResponse.json(
              { error: `Database insertion failed: ${insertErr.message}` },
              { status: 500 }
            );
          }

          console.log('[SUPABASE INSERT SUCCESS]', insertedData);
          recordedBid = insertedData;
        }
      }
    }

    const responsePayload = {
      success: true,
      message: 'Payment signature verified successfully.',
      razorpay_order_id,
      razorpay_payment_id,
      bid: recordedBid,
    };

    console.log('[VERIFY-PAYMENT SUCCESS RESPONSE]', responsePayload);
    return NextResponse.json(responsePayload);
  } catch (error: any) {
    console.error('[VERIFY-PAYMENT EXCEPTION]', error);
    return NextResponse.json(
      { error: error.message || 'Payment verification encountered an internal server error.' },
      { status: 500 }
    );
  }
}
