import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

export const isStripeConfigured = Boolean(
  stripeSecretKey && !stripeSecretKey.includes('placeholder')
);

export const stripe = isStripeConfigured
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2024-04-10' as any,
      appInfo: {
        name: 'Brand My Guitar',
        version: '1.0.0',
      },
    })
  : null;
