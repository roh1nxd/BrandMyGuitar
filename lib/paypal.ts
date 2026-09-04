import 'server-only';

function getPayPalBaseUrl() {
  const mode = (process.env.PAYPAL_MODE || 'sandbox').toLowerCase();
  return mode === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

/**
 * Server-side helper to acquire PayPal OAuth 2.0 Access Token
 */
export async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials missing. Ensure NEXT_PUBLIC_PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are configured in .env.local.');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const baseURL = getPayPalBaseUrl();

  const res = await fetch(`${baseURL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${auth}`,
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });

  const data = await res.json();

  if (!res.ok || !data.access_token) {
    console.error('[PAYPAL OAUTH ERROR]', data);
    throw new Error(data.error_description || data.error || 'Failed to authenticate with PayPal API.');
  }

  return data.access_token;
}

/**
 * Creates a PayPal Checkout order (Orders v2 API)
 */
export async function createPayPalOrder(amountValue: string, currency: string = 'EUR'): Promise<{ id: string; status: string }> {
  const accessToken = await getPayPalAccessToken();
  const baseURL = getPayPalBaseUrl();

  const payload = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: {
          currency_code: currency.toUpperCase(),
          value: amountValue,
        },
      },
    ],
  };

  console.log('[PAYPAL CREATE ORDER REQUEST]', { baseURL, payload });

  const res = await fetch(`${baseURL}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  const data = await res.json();

  if (!res.ok || !data.id) {
    console.error('[PAYPAL CREATE ORDER ERROR]', data);
    throw new Error(data.message || 'Failed to create PayPal checkout order.');
  }

  console.log('[PAYPAL CREATE ORDER SUCCESS]', { id: data.id, status: data.status });
  return { id: data.id, status: data.status };
}

/**
 * Captures a authorized PayPal Checkout order (Orders v2 API)
 */
export async function capturePayPalOrder(orderId: string): Promise<any> {
  const accessToken = await getPayPalAccessToken();
  const baseURL = getPayPalBaseUrl();

  console.log('[PAYPAL CAPTURE ORDER REQUEST]', { orderId });

  const res = await fetch(`${baseURL}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  });

  const data = await res.json();

  if (!res.ok) {
    console.error('[PAYPAL CAPTURE ORDER ERROR]', data);
    throw new Error(data.message || data.details?.[0]?.description || 'Failed to capture PayPal checkout order.');
  }

  console.log('[PAYPAL CAPTURE ORDER SUCCESS]', { id: data.id, status: data.status });
  return data;
}
