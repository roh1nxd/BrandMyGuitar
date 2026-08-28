'use client';

import React, { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { AuctionProvider, useAuction } from '@/lib/AuctionContext';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import SpotGrid from '@/components/SpotGrid';
import ViewToggle from '@/components/ViewToggle';
import GuitarFlatMockup from '@/components/SimpleView/GuitarFlatMockup';
import Narrative from '@/components/Narrative';
import HowItWorks from '@/components/HowItWorks';
import Specs from '@/components/Specs';
import FAQ from '@/components/FAQ';
import Footer from '@/components/Footer';
import ZoneModal from '@/components/ZoneModal';
import { Loader2 } from 'lucide-react';

const GuitarScene = dynamic(() => import('@/components/ThreeDView/GuitarScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full max-w-5xl h-[520px] sm:h-[600px] bg-card-bg rounded-2xl flex flex-col items-center justify-center text-xs text-text-muted gap-2 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <Loader2 className="w-5 h-5 animate-spin text-text" />
      <span>Loading 3D Guitar...</span>
    </div>
  ),
});

function AuctionPageContent() {
  const [viewMode, setViewMode] = useState<'grid' | '2d' | '3d'>('grid');
  const auctionSectionRef = useRef<HTMLDivElement>(null);

  const scrollToAuction = () => {
    auctionSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen bg-bg text-text flex flex-col selection:bg-accent-blue selection:text-white">
      {/* 1. Top Navbar */}
      <Navbar onGetSpotClick={scrollToAuction} />

      {/* 2. Hero with Live Total Raised & Countdown */}
      <Hero />

      {/* 3. Live Auction / Spot Grid / 2D / 3D Section */}
      <section id="auction" ref={auctionSectionRef} className="pb-8 w-full">
        {/* Toggle Switch */}
        <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />

        {/* View Switcher */}
        {viewMode === 'grid' && <SpotGrid />}
        {viewMode === '2d' && <GuitarFlatMockup />}
        {viewMode === '3d' && <GuitarScene />}
      </section>

      {/* 4. Personal Narrative & Bottom CTA */}
      <Narrative onBidClick={scrollToAuction} />

      {/* 5. How It Works */}
      <HowItWorks />

      {/* 6. Guitar Specs */}
      <Specs />

      {/* 7. FAQ */}
      <FAQ />

      {/* 8. Footer */}
      <Footer />

      {/* Rebuilt Bidding Modal */}
      <ZoneModal />
    </main>
  );
}

export default function HomePage() {
  return (
    <AuctionProvider>
      <AuctionPageContent />
    </AuctionProvider>
  );
}
