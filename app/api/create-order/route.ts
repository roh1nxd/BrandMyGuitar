import { NextRequest, NextResponse } from 'next/server';
import { razorpay, isRazorpayConfigured } from '@/lib/razorpay';

export async function POST(req: NextRequest) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error('[CREATE-ORDER ERROR] Missing Razorpay API keys on server.');
      return NextResponse.json(
        { error: 'Razorpay API keys are not configured on the server.' },
        { status: 401 }
      );
    }

    if (!isRazorpayConfigured || !razorpay) {
      console.error('[CREATE-ORDER ERROR] Razorpay SDK is not configured.');
      return NextResponse.json(
        { error: 'Razorpay integration is not configured properly.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { amount, currency = 'INR', receipt, notes } = body;

    // Validate amount
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount < 100) {
      console.error('[CREATE-ORDER ERROR] Invalid amount:', amount);
      return NextResponse.json(
        { error: 'Amount must be a valid number and at least 100 paise (₹1).' },
        { status: 400 }
      );
    }

    // Call Razorpay API to create order
    const options = {
      amount: Math.round(numericAmount),
      currency: currency.toUpperCase(),
      receipt: receipt || `receipt_${Date.now()}`,
      notes: notes || {},
    };

    const order = await razorpay.orders.create(options);

    const responsePayload = {
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      id: order.id,
      receipt: order.receipt,
      status: order.status,
      key_id: keyId,
    };

    console.log('[CREATE-ORDER SUCCESS]', responsePayload);

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    console.error('[CREATE-ORDER EXCEPTION]', error);
    const statusCode = error.statusCode || error.status || 500;
    return NextResponse.json(
      { error: error.message || error.description || 'Failed to create Razorpay order.' },
      { status: statusCode === 401 ? 401 : 500 }
    );
  }
}
