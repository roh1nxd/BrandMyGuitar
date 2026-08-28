'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ZONE_DEFINITIONS } from '@/lib/zones';
import { CheckCircle2 } from 'lucide-react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const zoneId = searchParams.get('zone_id');
  const zoneDef = ZONE_DEFINITIONS.find((z) => z.id === zoneId);

  return (
    <div className="w-full max-w-md bg-bg border-hairline rounded-xl p-8 text-center shadow-sm">
      <div className="w-12 h-12 mx-auto mb-4 bg-green-50 text-accent-green rounded-full flex items-center justify-center">
        <CheckCircle2 className="w-6 h-6" />
      </div>

      <h1 className="text-2xl font-bold text-text mb-2">
        Bid Placed Successfully
      </h1>

      <p className="text-text-muted text-sm mb-6 leading-relaxed">
        Your bid on the{' '}
        <strong className="text-text font-semibold">{zoneDef?.name || 'Guitar Spot'}</strong> has been
        recorded and your 20% deposit is locked in.
      </p>

      <div className="p-4 bg-card-bg border-hairline rounded-lg text-left text-xs space-y-2 mb-6 text-text-muted">
        <div className="flex justify-between">
          <span>Spot:</span>
          <span className="text-text font-semibold">{zoneDef?.name || zoneId}</span>
        </div>
        <div className="flex justify-between">
          <span>Status:</span>
          <span className="text-accent-green font-semibold">Active Highest Bidder</span>
        </div>
        <div className="flex justify-between">
          <span>Outbid protection:</span>
          <span className="text-text">Instant full deposit refund</span>
        </div>
      </div>

      <Link
        href="/"
        className="btn-blue w-full"
      >
        View Live Auction
      </Link>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-bg text-text">
      <Suspense fallback={<div className="text-sm text-text-muted">Loading...</div>}>
        <SuccessContent />
      </Suspense>
    </main>
  );
}
