'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuction } from '@/lib/AuctionContext';
import { MIN_BID_INCREMENT_CENTS, DEPOSIT_PERCENTAGE } from '@/lib/zones';
import { formatPrice, getConvertedUnits, convertInputToEurCents } from '@/lib/currency';
import { Upload, AlertCircle, X } from 'lucide-react';

export default function ZoneModal() {
  const { selectedZoneId, setSelectedZoneId, zones, currency, getZoneDefinition, placeBid, syncPaidBid } = useAuction();

  const zoneDef = selectedZoneId ? getZoneDefinition(selectedZoneId) : null;
  const zoneState = selectedZoneId ? zones.find((z) => z.id === selectedZoneId) : null;

  const hasCurrentBid = Boolean(zoneState?.current_bid_cents && zoneState.current_bid_cents > 0);
  const currentTopBidEurCents = hasCurrentBid ? zoneState!.current_bid_cents! : zoneDef?.min_bid_cents || 10000;
  
  const minRequiredEurCents = hasCurrentBid
    ? currentTopBidEurCents + MIN_BID_INCREMENT_CENTS
    : (zoneDef?.min_bid_cents || 10000);

  const defaultBidUnits = getConvertedUnits(minRequiredEurCents, currency);

  const [bidInput, setBidInput] = useState<string>(defaultBidUnits.toString());
  const [brandName, setBrandName] = useState('');
  const [bidderEmail, setBidderEmail] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [twitterHandle, setTwitterHandle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync default input and reset all form state when zone changes
  useEffect(() => {
    setBidInput(defaultBidUnits.toString());
    setBrandName('');
    setBidderEmail('');
    setWebsiteUrl('');
    setTwitterHandle('');
    setFile(null);
    setLogoPreview(null);
    setErrorMsg(null);
    setSubmitting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [selectedZoneId, currency, minRequiredEurCents]);

  if (!selectedZoneId || !zoneDef) return null;

  const numericInputUnits = parseFloat(bidInput) || defaultBidUnits;
  const canonicalEurCents = convertInputToEurCents(numericInputUnits, currency);
  const depositEurCents = Math.round(canonicalEurCents * DEPOSIT_PERCENTAGE);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 5 * 1024 * 1024) {
      setErrorMsg('File must be smaller than 5MB.');
      return;
    }

    setFile(selectedFile);
    const objectUrl = URL.createObjectURL(selectedFile);
    setLogoPreview(objectUrl);
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (canonicalEurCents < minRequiredEurCents) {
      setErrorMsg(`Your bid must be at least ${formatPrice(minRequiredEurCents, currency)}.`);
      return;
    }

    if (!brandName.trim()) {
      setErrorMsg('Please enter your brand or company name.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!bidderEmail.trim() || !emailRegex.test(bidderEmail.trim())) {
      setErrorMsg('Please enter a valid email address (e.g. name@company.com).');
      return;
    }

    if (!websiteUrl.trim()) {
      setErrorMsg('Please enter your website URL.');
      return;
    }

    const cleanWebsite = websiteUrl.trim();
    if (!cleanWebsite.includes('.')) {
      setErrorMsg('Please enter a valid website domain (e.g. acmeaudio.com).');
      return;
    }

    const normalizedWebsite = cleanWebsite.startsWith('http://') || cleanWebsite.startsWith('https://')
      ? cleanWebsite
      : `https://${cleanWebsite}`;

    if (!file && !logoPreview) {
      setErrorMsg('Logo artwork is required. Please upload a logo image before submitting.');
      return;
    }

    setSubmitting(true);

    try {
      let finalLogoUrl = logoPreview || '';

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('zoneId', selectedZoneId);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadRes.json();

        if (!uploadRes.ok || !uploadData.url) {
          throw new Error(uploadData.error || 'Failed to upload logo artwork. Please try again.');
        }

        finalLogoUrl = uploadData.url;
      }

      if (!finalLogoUrl) {
        throw new Error('Logo upload URL missing. Please re-upload your logo file.');
      }

      // Step 1: Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay payment gateway SDK. Please check your network connection.');
      }

      // Step 2: Create Razorpay Order on Backend
      const depositPaise = Math.max(100, Math.round(depositEurCents));

      const orderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: depositPaise,
          currency: 'INR',
          receipt: `rcpt_${selectedZoneId.substring(0, 8)}_${Date.now()}`,
          notes: {
            zone_id: selectedZoneId,
            bidder_name: brandName.trim(),
            bidder_email: bidderEmail.trim(),
          },
        }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.order_id) {
        throw new Error(orderData.error || 'Failed to create Razorpay payment order.');
      }

      // Step 3: Configure Razorpay Checkout Modal
      const keyId = orderData.key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      if (!keyId) {
        throw new Error('NEXT_PUBLIC_RAZORPAY_KEY_ID is not configured');
      }

      console.log('Launching Razorpay checkout popup:', { keyId, order_id: orderData.order_id });

      const options = {
        key: keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Brand My Guitar',
        description: `20% Deposit for ${zoneDef.name} Spot`,
        image: finalLogoUrl.startsWith('http') ? finalLogoUrl : undefined,
        order_id: orderData.order_id,
        prefill: {
          name: brandName.trim(),
          email: bidderEmail.trim(),
        },
        handler: async function (response: any) {
          try {
            // Step 4: Verify Payment Signature on Backend
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bid_data: {
                  zone_id: selectedZoneId,
                  amount_cents: canonicalEurCents,
                  bidder_name: brandName.trim(),
                  bidder_email: bidderEmail.trim(),
                  website_url: normalizedWebsite,
                  twitter_handle: twitterHandle.trim() || undefined,
                  logo_url: finalLogoUrl,
                },
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.error || 'Razorpay payment signature verification failed.');
            }

            // Sync paid bid in local context and refresh state
            await syncPaidBid({
              zone_id: selectedZoneId,
              amount_cents: canonicalEurCents,
              bidder_name: brandName.trim(),
              bidder_email: bidderEmail.trim(),
              website_url: normalizedWebsite,
              twitter_handle: twitterHandle.trim() || undefined,
              logo_url: finalLogoUrl,
            });

            setSelectedZoneId(null);
          } catch (verifyErr: any) {
            console.error('Razorpay verification error:', verifyErr);
            setErrorMsg(verifyErr.message || 'Payment verification failed.');
          } finally {
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: function () {
            setSubmitting(false);
            setErrorMsg('Payment cancelled by user. Deposit was not charged.');
          },
        },
      };

      const razorpayInstance = new (window as any).Razorpay(options);

      razorpayInstance.on('payment.failed', function (failResponse: any) {
        setSubmitting(false);
        const reason = failResponse.error?.description || failResponse.error?.reason || 'Payment failed.';
        setErrorMsg(`Payment error: ${reason}`);
      });

      razorpayInstance.open();
    } catch (err: any) {
      console.error('Bid submission error:', err);
      setErrorMsg(err.message || 'An error occurred during payment checkout.');
      setSubmitting(false);
    }
  };

  const buttonText = submitting
    ? 'Processing…'
    : hasCurrentBid
    ? `Outbid ${zoneState?.brand_name || 'current leader'}`
    : 'Place first bid';

  return (
    <div
      onClick={() => setSelectedZoneId(null)}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    >
      {/* Modal Card with scrollable body and pinned footer */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[#FFFFEB] border border-hairline rounded-2xl shadow-2xl text-ink max-h-[88vh] flex flex-col overflow-hidden opacity-100"
      >
        {/* Top Header (Pinned at top) */}
        <div className="p-5 sm:p-6 pb-4 border-b border-hairline shrink-0 flex items-start justify-between bg-[#FFFFEB]">
          <div>
            <span className="text-[11px] font-bold text-muted uppercase tracking-widest block mb-1">
              SPOT {zoneDef.spotNumber} · {zoneDef.name.toUpperCase()}
            </span>
            <h2 className="text-2xl font-bold font-serif text-ink tracking-tight">
              {zoneDef.name}
            </h2>
            <div className="text-xs text-muted mt-1">
              {zoneDef.dimensions}
            </div>
            <div className="text-xs text-muted mt-1.5">
              {hasCurrentBid ? (
                <>
                  Current bid <strong className="text-primary font-bold">{formatPrice(zoneState!.current_bid_cents, currency)}</strong> by {zoneState?.brand_name || 'Leader'} · {zoneState?.bids_count || 1} {zoneState?.bids_count === 1 ? 'bid' : 'bids'}
                </>
              ) : (
                <span className="text-ink font-medium">No bids yet</span>
              )}
            </div>
          </div>
          <button
            onClick={() => setSelectedZoneId(null)}
            className="p-1.5 text-muted hover:text-primary rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="bid-form" onSubmit={handleBidSubmit} className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Bid Input */}
          <div>
            <label className="block font-semibold text-ink mb-1 text-xs">
              Your bid ({currency})
            </label>
            <div className="relative">
              <input
                type="number"
                min={defaultBidUnits}
                step="10"
                required
                value={bidInput}
                onChange={(e) => setBidInput(e.target.value)}
                className="w-full px-4 py-2.5 bg-cream border border-hairline rounded-lg text-base text-ink font-bold focus:outline-none focus:border-primary shadow-xs"
              />
            </div>
            <span className="text-[11px] text-muted mt-1 block">
              Minimum {formatPrice(minRequiredEurCents, currency)}
            </span>
          </div>

          {/* Deposit Breakdown Box (Darker cream tint e.g. #FBF9DE) */}
          <div className="p-3.5 bg-card border border-hairline/70 rounded-xl space-y-1.5 text-xs text-muted">
            <div className="flex justify-between items-center text-ink">
              <span>Deposit, 20% of {formatPrice(canonicalEurCents, currency)}</span>
              <span className="font-semibold text-ink">{formatPrice(depositEurCents, currency)}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold text-ink pt-1 border-t border-hairline">
              <span>Due now</span>
              <span className="text-primary font-bold">{formatPrice(depositEurCents, currency)}</span>
            </div>
            <div className="text-[11px] text-muted pt-0.5">
              If you're outbid, your deposit is automatically refunded in full to your card.
            </div>
          </div>

          {/* Row 1: Brand name + Email (Required) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-ink mb-1 text-xs">
                Brand name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Acme Audio"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full px-3.5 py-2 bg-cream border border-hairline rounded-lg text-xs text-ink focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block font-semibold text-ink mb-1 text-xs">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="you@company.com"
                value={bidderEmail}
                onChange={(e) => setBidderEmail(e.target.value)}
                className="w-full px-3.5 py-2 bg-cream border border-hairline rounded-lg text-xs text-ink focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Row 2: Website (Required) + X handle (Optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-ink mb-1 text-xs">
                Website <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="acmeaudio.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="w-full px-3.5 py-2 bg-cream border border-hairline rounded-lg text-xs text-ink focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block font-semibold text-ink mb-1 text-xs">
                X / Twitter <span className="text-muted font-normal">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="@acmeaudio"
                value={twitterHandle}
                onChange={(e) => setTwitterHandle(e.target.value)}
                className="w-full px-3.5 py-2 bg-cream border border-hairline rounded-lg text-xs text-ink focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Logo Upload Drop Zone */}
          <div>
            <label className="block font-semibold text-ink mb-1 text-xs">
              Logo artwork
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/webp, image/svg+xml"
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer border border-dashed border-hairline hover:border-primary p-3 bg-card rounded-xl text-center flex items-center justify-center min-h-[65px] transition-colors"
            >
              {logoPreview ? (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-cream border border-hairline rounded-md p-1 flex items-center justify-center">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="text-left text-xs">
                    <span className="text-ink font-medium block">Logo attached</span>
                    <span className="text-muted text-[11px]">Click to change file</span>
                  </div>
                </div>
              ) : (
                <div className="text-muted">
                  <Upload className="w-4 h-4 mx-auto mb-1 text-primary" />
                  <span className="font-medium text-ink block text-xs">Upload your logo</span>
                  <span className="text-[10px] text-muted">PNG, SVG, or JPEG</span>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Pinned Sticky Submit Footer — Guaranteed to always be visible */}
        <div className="sticky bottom-0 bg-[#FFFFEB] border-t border-hairline p-4 sm:px-6 shrink-0 z-20">
          <button
            type="submit"
            form="bid-form"
            disabled={submitting}
            className="w-full py-3.5 px-6 rounded-full bg-[#034F46] hover:bg-[#023D36] text-[#FFFFEB] font-bold text-sm tracking-tight transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center cursor-pointer"
          >
            {buttonText}
          </button>

          <p className="text-[11px] text-muted text-center mt-2">
            I check every logo by hand before it goes live.
          </p>
        </div>
      </div>
    </div>
  );
}
