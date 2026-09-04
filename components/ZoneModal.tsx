'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuction } from '@/lib/AuctionContext';
import { MIN_BID_INCREMENT_CENTS, DEPOSIT_PERCENTAGE } from '@/lib/zones';
import { formatPrice, getConvertedUnits, convertInputToEurCents } from '@/lib/currency';
import { Upload, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

export default function ZoneModal() {
  const { selectedZoneId, setSelectedZoneId, zones, currency, getZoneDefinition, syncPaidBid, showToast } = useAuction();

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
  const logoUrlRef = useRef<string | null>(null);

  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';

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
    logoUrlRef.current = null;
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

  const validateForm = (): string | null => {
    if (canonicalEurCents < minRequiredEurCents) {
      return `Your bid must be at least ${formatPrice(minRequiredEurCents, currency)}.`;
    }

    if (!brandName.trim()) {
      return 'Please enter your brand or company name.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!bidderEmail.trim() || !emailRegex.test(bidderEmail.trim())) {
      return 'Please enter a valid email address (e.g. name@company.com).';
    }

    if (!websiteUrl.trim()) {
      return 'Please enter your website URL.';
    }

    const cleanWebsite = websiteUrl.trim();
    if (!cleanWebsite.includes('.')) {
      return 'Please enter a valid website domain (e.g. acmeaudio.com).';
    }

    if (!file && !logoPreview) {
      return 'Logo artwork is required. Please upload a logo image before submitting.';
    }

    return null;
  };

  const handleCreatePayPalOrder = async (): Promise<string> => {
    setErrorMsg(null);
    const validationError = validateForm();
    if (validationError) {
      setErrorMsg(validationError);
      throw new Error(validationError);
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
        setLogoPreview(finalLogoUrl);
      }

      if (!finalLogoUrl) {
        throw new Error('Logo upload URL missing. Please re-upload your logo file.');
      }

      logoUrlRef.current = finalLogoUrl;

      const createPayload = {
        amount_cents: canonicalEurCents,
        deposit_cents: depositEurCents,
        currency: currency,
      };

      const orderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createPayload),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.order_id) {
        throw new Error(orderData.error || 'Failed to create PayPal payment order.');
      }

      return orderData.order_id;
    } catch (err: any) {
      console.error('PayPal create-order error:', err.message || err);
      setErrorMsg(err.message || 'Failed to initiate PayPal checkout.');
      setSubmitting(false);
      throw err;
    }
  };

  const handleApprovePayPalOrder = async (data: { orderID: string }) => {
    setSubmitting(true);
    try {
      const cleanWebsite = websiteUrl.trim();
      const normalizedWebsite = cleanWebsite.startsWith('http://') || cleanWebsite.startsWith('https://')
        ? cleanWebsite
        : `https://${cleanWebsite}`;

      const finalLogoUrl = logoUrlRef.current || logoPreview || '';

      const capturePayload = {
        order_id: data.orderID,
        bid_data: {
          zone_id: selectedZoneId,
          amount_cents: canonicalEurCents,
          brand_name: brandName.trim(),
          email: bidderEmail.trim(),
          website_url: normalizedWebsite,
          x_handle: twitterHandle.trim() || undefined,
          logo_url: finalLogoUrl,
        },
      };

      const captureRes = await fetch('/api/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(capturePayload),
      });

      const captureData = await captureRes.json();

      if (!captureRes.ok || !captureData.success) {
        throw new Error(captureData.error || 'PayPal payment capture verification failed.');
      }

      // Sync paid bid in local context and refresh state
      await syncPaidBid({
        zone_id: selectedZoneId,
        amount_cents: canonicalEurCents,
        brand_name: brandName.trim(),
        email: bidderEmail.trim(),
        website_url: normalizedWebsite,
        x_handle: twitterHandle.trim() || undefined,
        logo_url: finalLogoUrl,
      });

      showToast({
        type: 'success',
        message: 'Payment successful! Your logo is now live.',
      });

      setSelectedZoneId(null);
    } catch (err: any) {
      console.error('PayPal capture order error:', err.message || err);
      setErrorMsg(err.message || 'Payment capture failed.');
      showToast({
        type: 'error',
        message: 'Payment cancelled or failed. No charge was made.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 overflow-y-auto">

      {/* Darkened Backdrop (No backdrop-blur filter to prevent iframe text rasterization blur) */}
      <div
        onClick={() => setSelectedZoneId(null)}
        className="fixed inset-0 bg-black/75 transition-opacity"
      />

      {/* Modal Card with scrollable body — Fully opaque and un-blurred */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-lg bg-[#FFFFEB] border border-hairline rounded-2xl shadow-2xl text-ink max-h-[90vh] my-auto flex flex-col overflow-hidden opacity-100"
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

        {/* Scrollable Form Body — Contains form inputs and PayPal Checkout */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
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

          {/* PayPal Checkout Buttons Section inside scrollable body */}
          <div className="pt-2 space-y-1.5">
            <label className="block font-semibold text-ink mb-1 text-xs">
              Pay deposit to confirm bid
            </label>
            {!paypalClientId ? (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-md text-xs text-center">
                NEXT_PUBLIC_PAYPAL_CLIENT_ID is not configured in .env.local
              </div>
            ) : (
              <div className="p-3 bg-[#FBF9DE] border border-hairline/70 rounded-xl shadow-xs">
                <PayPalScriptProvider
                  options={{
                    clientId: paypalClientId,
                    currency: currency.toUpperCase(),
                    intent: 'capture',
                  }}
                >
                  <PayPalButtons
                    disabled={submitting}
                    style={{ layout: 'vertical', shape: 'rect', color: 'gold', label: 'pay' }}
                    createOrder={handleCreatePayPalOrder}
                    onApprove={handleApprovePayPalOrder}
                    onError={(err) => {
                      console.error('PayPal Buttons error:', err);
                      setSubmitting(false);
                      setErrorMsg('PayPal checkout encountered an error. Please try again.');
                      showToast({
                        type: 'error',
                        message: 'Payment cancelled or failed. No charge was made.',
                      });
                    }}
                    onCancel={() => {
                      setSubmitting(false);
                      setErrorMsg('Payment cancelled. Deposit was not charged.');
                      showToast({
                        type: 'error',
                        message: 'Payment cancelled or failed. No charge was made.',
                      });
                    }}
                  />
                </PayPalScriptProvider>
              </div>
            )}
          </div>
        </div>

        {/* Footer Note */}
        <div className="bg-[#FFFFEB] border-t border-hairline p-3 sm:px-6 shrink-0 text-center">
          <p className="text-[11px] text-muted text-center">
            I check every logo by hand before it goes live.
          </p>
        </div>
      </div>
    </div>
  );
}
