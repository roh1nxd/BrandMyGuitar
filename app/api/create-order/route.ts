import { NextRequest, NextResponse } from 'next/server';
import { createPayPalOrder } from '@/lib/paypal';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount_cents, deposit_cents, currency = 'EUR' } = body;

    const effectiveDepositCents = deposit_cents || (amount_cents ? Math.round(amount_cents * 0.20) : 0);
    const numericDepositCents = Number(effectiveDepositCents);

    if (isNaN(numericDepositCents) || numericDepositCents <= 0) {
      console.error('[CREATE-ORDER ERROR] Invalid deposit amount:', { amount_cents, deposit_cents });
      return NextResponse.json(
        { error: 'Deposit amount must be a valid positive number.' },
        { status: 400 }
      );
    }

    // Convert cents to major currency units formatted to 2 decimal places (e.g. 2000 cents -> "20.00")
    const depositUnitsString = (numericDepositCents / 100).toFixed(2);

    console.log('[STEP 1 (SERVER): /api/create-order RECEIVED PAYLOAD]', { numericDepositCents, depositUnitsString, currency });

    const order = await createPayPalOrder(depositUnitsString, currency);

    const responsePayload = {
      order_id: order.id,
      status: order.status,
    };

    console.log('[STEP 2 (SERVER): /api/create-order CREATED PAYPAL ORDER]', responsePayload);
    return NextResponse.json(responsePayload);
  } catch (error: any) {
    console.error('[CREATE-ORDER EXCEPTION]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create PayPal order.' },
      { status: 500 }
    );
  }
}
