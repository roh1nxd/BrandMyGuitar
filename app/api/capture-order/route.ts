import { NextRequest, NextResponse } from 'next/server';
import { capturePayPalOrder } from '@/lib/paypal';
import { processNewBid } from '@/lib/store';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { invalidateZonesCache, invalidateHistoryCache } from '@/lib/cache';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('[CAPTURE-ORDER REQUEST RECEIVED]', { order_id: body?.order_id, zone_id: body?.bid_data?.zone_id });

    const { order_id, bid_data } = body;

    if (!order_id) {
      console.error('[CAPTURE-ORDER ERROR] Missing PayPal order_id.');
      return NextResponse.json(
        { error: 'Missing PayPal order_id.' },
        { status: 400 }
      );
    }

    // Capture payment via PayPal Orders v2 API
    console.log('[STEP 5 (SERVER): CALLING PAYPAL CAPTURE API] order_id:', order_id);
    const captureResult = await capturePayPalOrder(order_id);
    console.log('[STEP 5 (SERVER): PAYPAL CAPTURE RESPONSE STATUS]', { status: captureResult.status, id: captureResult.id });

    if (captureResult.status !== 'COMPLETED') {
      console.error('[STEP 5 ERROR: PAYPAL CAPTURE NOT COMPLETED]', captureResult.status);
      return NextResponse.json(
        { error: `Payment capture incomplete. PayPal status: ${captureResult.status}` },
        { status: 400 }
      );
    }

    const paypal_order_id = captureResult.id;
    const paypal_capture_id = captureResult.purchase_units?.[0]?.payments?.captures?.[0]?.id || captureResult.id;

    console.log('[STEP 5 (SERVER): PAYPAL CAPTURE VERIFIED COMPLETED]', { paypal_order_id, paypal_capture_id });

    let recordedBid = null;

    if (bid_data) {
      const { zone_id, brand_name, bidder_name, email, bidder_email, website_url, x_handle, twitter_handle, logo_url, amount_cents } = bid_data;
      const finalBrandName = brand_name || bidder_name;
      const finalEmail = email || bidder_email;
      const finalXHandle = x_handle || twitter_handle || null;

      if (zone_id && finalBrandName && finalEmail && amount_cents) {
        // 1. Process in local store
        const storeResult = await processNewBid({
          zone_id,
          brand_name: finalBrandName,
          email: finalEmail,
          website_url: website_url || '',
          x_handle: finalXHandle,
          logo_url: logo_url || '',
          amount_cents,
          paypal_order_id,
          paypal_capture_id,
        });
        recordedBid = storeResult.bid;

        // 2. If Supabase is configured, record in database
        if (isSupabaseConfigured) {
          const adminClient = getSupabaseAdmin();
          const deposit_cents = Math.round(amount_cents * 0.20);

          // 2a. Mark previous active bids for this zone as outbid
          console.log('[STEP 6a (SERVER): SUPABASE OUTBID UPDATE START]', { zone_id });
          const { error: outbidErr } = await adminClient
            .from('bids')
            .update({ status: 'outbid' })
            .eq('zone_id', zone_id)
            .eq('status', 'active');

          if (outbidErr) {
            console.warn('[STEP 6a (SERVER): SUPABASE OUTBID UPDATE NOTICE]', outbidErr);
          }

          // 2b. Insert new active bid matching exact Supabase bids table schema (brand_name, email, x_handle)
          // Omit 'id' so Supabase automatically generates a valid UUID via gen_random_uuid()
          const cleanPayload = {
            zone_id,
            brand_name: finalBrandName,
            email: finalEmail,
            website_url: website_url || '',
            x_handle: finalXHandle,
            logo_url: logo_url || '',
            amount_cents,
            deposit_cents,
            paypal_order_id,
            paypal_capture_id,
            status: 'active',
          };

          console.log('[STEP 6b (SERVER): SUPABASE INSERT START]', {
            zone_id: cleanPayload.zone_id,
            amount_cents: cleanPayload.amount_cents,
            deposit_cents: cleanPayload.deposit_cents,
            paypal_order_id: cleanPayload.paypal_order_id
          });

          const { data: insertedData, error: insertErr } = await adminClient
            .from('bids')
            .insert(cleanPayload)
            .select('*')
            .single();

          if (insertErr) {
            console.error('[STEP 7 (SERVER): SUPABASE INSERT CRITICAL ERROR]', insertErr);
            return NextResponse.json(
              { error: `Database insertion failed: ${insertErr.message}` },
              { status: 500 }
            );
          }

          console.log('[STEP 7 (SERVER): SUPABASE INSERT SUCCESS]', {
            id: insertedData?.id,
            zone_id: insertedData?.zone_id,
            status: insertedData?.status
          });
          recordedBid = insertedData;
        }
        invalidateZonesCache();
        invalidateHistoryCache();
      }
    }

    const responsePayload = {
      success: true,
      message: 'PayPal payment captured and verified successfully.',
      paypal_order_id,
      paypal_capture_id,
      bid: recordedBid,
    };

    console.log('[CAPTURE-ORDER SUCCESS RESPONSE]', {
      success: true,
      paypal_order_id,
      paypal_capture_id,
      zone_id: bid_data?.zone_id
    });
    return NextResponse.json(responsePayload);
  } catch (error: any) {
    console.error('[CAPTURE-ORDER EXCEPTION]', error);
    return NextResponse.json(
      { error: error.message || 'Payment capture encountered an internal server error.' },
      { status: 500 }
    );
  }
}
