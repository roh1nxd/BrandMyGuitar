import Razorpay from 'razorpay';

const razorpayKeyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || '';

export const isRazorpayConfigured = Boolean(
  razorpayKeyId &&
    razorpayKeySecret &&
    !razorpayKeyId.includes('placeholder') &&
    !razorpayKeySecret.includes('placeholder')
);

export const razorpay = isRazorpayConfigured
  ? new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    })
  : null;
