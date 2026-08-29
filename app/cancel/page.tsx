'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ZONE_DEFINITIONS } from '@/lib/zones';

function CancelContent() {
  const searchParams = useSearchParams();
  const zoneId = searchParams.get('zone_id');
  const zoneDef = ZONE_DEFINITIONS.find((z) => z.id === zoneId);

  return (
    <div className="w-full max-w-md bg-cream border border-hairline rounded-xl p-8 text-center shadow-sm">
      <h1 className="text-2xl font-bold font-serif text-ink mb-2">
        Bid Cancelled
      </h1>

      <p className="text-muted text-sm mb-6">
        No charges or deposits were made for {zoneDef ? `the ${zoneDef.name}` : 'your spot'}.
      </p>

      <Link
        href="/"
        className="px-6 py-3 rounded-full bg-[#034F46] hover:bg-[#023D36] text-[#FFFFEB] font-bold text-sm transition-colors shadow-xs inline-block"
      >
        Return to Auction
      </Link>
    </div>
  );
}

export default function CancelPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-cream text-ink">
      <Suspense fallback={<div className="text-sm text-muted">Loading...</div>}>
        <CancelContent />
      </Suspense>
    </main>
  );
}
