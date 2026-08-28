'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuction } from '@/lib/AuctionContext';
import { MIN_BID_INCREMENT_CENTS, DEPOSIT_PERCENTAGE } from '@/lib/zones';
import { formatPrice, getConvertedUnits, convertInputToEurCents } from '@/lib/currency';
import { Upload, AlertCircle, X } from 'lucide-react';

export default function ZoneModal() {
  const { selectedZoneId, setSelectedZoneId, zones, currency, getZoneDefinition, placeBid } = useAuction();

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

  // Sync default input when zone or currency changes
  useEffect(() => {
    setBidInput(defaultBidUnits.toString());
    setErrorMsg(null);
    setSubmitting(false);
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

    let finalLogoUrl = logoPreview || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=60';

    setSubmitting(true);

    // Safety timeout
    const timeoutId = setTimeout(() => {
      setSubmitting(false);
    }, 5000);

    try {
      if (file) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('zoneId', selectedZoneId);

          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            if (uploadData.url) {
              finalLogoUrl = uploadData.url;
            }
          }
        } catch (uploadErr) {
          console.warn('Logo upload fallback to local preview:', uploadErr);
        }
      }

      await placeBid({
        zone_id: selectedZoneId,
        amount_cents: canonicalEurCents,
        bidder_name: brandName.trim(),
        bidder_email: bidderEmail.trim(),
        website_url: websiteUrl.trim() ? (websiteUrl.startsWith('http') ? websiteUrl.trim() : `https://${websiteUrl.trim()}`) : undefined,
        twitter_handle: twitterHandle.trim() || undefined,
        logo_url: finalLogoUrl,
      });

      setSelectedZoneId(null);
    } catch (err: any) {
      console.error('Bid error:', err);
      setErrorMsg(err.message || 'An error occurred during submission.');
    } finally {
      clearTimeout(timeoutId);
      setSubmitting(false);
    }
  };

  const buttonText = submitting
    ? 'Processing…'
    : hasCurrentBid
    ? `Outbid ${zoneState?.brand_name || 'current leader'}`
    : 'Place first bid';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      {/* Modal Card with scrollable body and pinned footer */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl text-text max-h-[88vh] flex flex-col overflow-hidden">
        {/* Top Header (Pinned at top) */}
        <div className="p-5 sm:p-6 pb-4 border-b border-border shrink-0 flex items-start justify-between bg-white">
          <div>
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-widest block mb-1">
              SPOT {zoneDef.spotNumber} · {zoneDef.name.toUpperCase()}
            </span>
            <h2 className="text-2xl font-bold text-text tracking-tight">
              {zoneDef.name}
            </h2>
            <div className="text-xs text-text-muted mt-1">
              {zoneDef.dimensions}
            </div>
            <div className="text-xs text-text-muted mt-1.5">
              {hasCurrentBid ? (
                <>
                  Current bid <strong className="text-text font-bold">{formatPrice(zoneState!.current_bid_cents, currency)}</strong> by {zoneState?.brand_name || 'Leader'} · {zoneState?.bids_count || 1} {zoneState?.bids_count === 1 ? 'bid' : 'bids'}
                </>
              ) : (
                <span className="text-text font-medium">No bids yet</span>
              )}
            </div>
          </div>
          <button
            onClick={() => setSelectedZoneId(null)}
            className="p-1.5 text-text-muted hover:text-text rounded-md transition-colors"
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
            <label className="block font-semibold text-text mb-1 text-xs">
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
                className="w-full px-4 py-2.5 bg-white border border-border rounded-lg text-base text-text font-bold focus:outline-none focus:border-text shadow-xs"
              />
            </div>
            <span className="text-[11px] text-text-muted mt-1 block">
              Minimum {formatPrice(minRequiredEurCents, currency)}
            </span>
          </div>

          {/* Deposit Breakdown Box (Filled background, no hard borders) */}
          <div className="p-3.5 bg-card-bg rounded-xl space-y-1.5 text-xs text-text-muted">
            <div className="flex justify-between items-center text-text">
              <span>Deposit, 20% of {formatPrice(canonicalEurCents, currency)}</span>
              <span className="font-semibold text-text">{formatPrice(depositEurCents, currency)}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold text-text pt-1 border-t border-border/60">
              <span>Due now</span>
              <span className="text-accent-green">{formatPrice(depositEurCents, currency)}</span>
            </div>
            <div className="text-[11px] text-text-muted pt-0.5">
              If you're outbid, your deposit is automatically refunded in full to your card.
            </div>
          </div>

          {/* Row 1: Brand name + Email (Required) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-text mb-1 text-xs">
                Brand name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Acme Audio"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-border rounded-lg text-xs text-text focus:outline-none focus:border-text"
              />
            </div>

            <div>
              <label className="block font-semibold text-text mb-1 text-xs">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="you@company.com"
                value={bidderEmail}
                onChange={(e) => setBidderEmail(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-border rounded-lg text-xs text-text focus:outline-none focus:border-text"
              />
            </div>
          </div>

          {/* Row 2: Website + X handle (Optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-text mb-1 text-xs">
                Website <span className="text-text-muted font-normal">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="acmeaudio.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-border rounded-lg text-xs text-text focus:outline-none focus:border-text"
              />
            </div>

            <div>
              <label className="block font-semibold text-text mb-1 text-xs">
                X / Twitter <span className="text-text-muted font-normal">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="@acmeaudio"
                value={twitterHandle}
                onChange={(e) => setTwitterHandle(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-border rounded-lg text-xs text-text focus:outline-none focus:border-text"
              />
            </div>
          </div>

          {/* Logo Upload Drop Zone */}
          <div>
            <label className="block font-semibold text-text mb-1 text-xs">
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
              className="cursor-pointer border border-dashed border-border hover:border-text p-3 bg-card-bg rounded-xl text-center flex items-center justify-center min-h-[65px] transition-colors"
            >
              {logoPreview ? (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white border border-border rounded-md p-1 flex items-center justify-center">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="text-left text-xs">
                    <span className="text-text font-medium block">Logo attached</span>
                    <span className="text-text-muted text-[11px]">Click to change file</span>
                  </div>
                </div>
              ) : (
                <div className="text-text-muted">
                  <Upload className="w-4 h-4 mx-auto mb-1 text-text" />
                  <span className="font-medium text-text block text-xs">Upload your logo</span>
                  <span className="text-[10px] text-text-muted">PNG, SVG, or JPEG</span>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Pinned Sticky Submit Footer — Guaranteed to always be visible */}
        <div className="sticky bottom-0 bg-white border-t border-border p-4 sm:px-6 shrink-0 z-20">
          <button
            type="submit"
            form="bid-form"
            disabled={submitting}
            className="w-full py-3.5 px-6 rounded-full bg-accent-blue hover:bg-accent-blue-hover text-white font-bold text-sm tracking-tight transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center"
          >
            {buttonText}
          </button>

          <p className="text-[11px] text-text-muted text-center mt-2">
            I check every logo by hand before it goes live.
          </p>
        </div>
      </div>
    </div>
  );
}
