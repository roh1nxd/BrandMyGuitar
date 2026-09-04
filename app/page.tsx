'use client';

import React, { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { AuctionProvider, useAuction } from '@/lib/AuctionContext';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import SpotGrid from '@/components/SpotGrid';
import ViewToggle from '@/components/ViewToggle';
import Narrative from '@/components/Narrative';
import Footer from '@/components/Footer';
import { Loader2 } from 'lucide-react';

const ZoneModal = dynamic(() => import('@/components/ZoneModal'), { ssr: false });
const Leaderboard = dynamic(() => import('@/components/Leaderboard'), { ssr: false });
const GuitarFlatMockup = dynamic(() => import('@/components/SimpleView/GuitarFlatMockup'), { ssr: false });
const HowItWorks = dynamic(() => import('@/components/HowItWorks'));
const Specs = dynamic(() => import('@/components/Specs'));
const FAQ = dynamic(() => import('@/components/FAQ'));

const GuitarScene = dynamic(() => import('@/components/ThreeDView/GuitarScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full max-w-5xl h-[420px] sm:h-[600px] bg-card border border-hairline rounded-2xl flex flex-col items-center justify-center text-xs text-muted gap-2 shadow-xs">
      <Loader2 className="w-5 h-5 animate-spin text-primary" />
      <span>Loading 3D Guitar...</span>
    </div>
  ),
});

function AuctionPageContent() {
  const [viewMode, setViewMode] = useState<'grid' | '2d' | '3d'>('grid');
  const auctionSectionRef = useRef<HTMLDivElement>(null);
  const leaderboardSectionRef = useRef<HTMLDivElement>(null);
  const { zones, selectedZoneId, setSelectedZoneId } = useAuction();

  const handleGetSpotClick = () => {
    const firstAvailable = zones.find((z) => !z.current_bid_cents)?.id || zones[0]?.id || 'headstock';
    setSelectedZoneId(firstAvailable);
    auctionSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLeaderboardClick = () => {
    leaderboardSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen bg-cream text-ink flex flex-col selection:bg-primary selection:text-cream overflow-x-hidden">
      {/* 1. Top Navbar */}
      <Navbar onGetSpotClick={handleGetSpotClick} onLeaderboardClick={handleLeaderboardClick} />

      {/* 2. Hero with Live Total Raised & Countdown */}
      <Hero />

      {/* 3. Live Auction Viewer Section (Grid / 2D / 3D) */}
      <section id="auction" ref={auctionSectionRef} className="pb-8 w-full">
        {/* Toggle Switch: Live auction | 2D view | 3D view */}
        <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />

        {/* View Switcher */}
        {viewMode === 'grid' && <SpotGrid />}
        {viewMode === '2d' && <GuitarFlatMockup />}
        {viewMode === '3d' && <GuitarScene />}
      </section>

      {/* 4. Personal Narrative & Bottom CTA */}
      <Narrative onBidClick={handleGetSpotClick} />

      {/* 5. How It Works */}
      <HowItWorks />

      {/* 6. Dedicated Standalone Leaderboard Section */}
      <section id="leaderboard" ref={leaderboardSectionRef} className="py-10 sm:py-16 w-full bg-cream border-t border-hairline">
        <Leaderboard />
      </section>

      {/* 7. Guitar Specs */}
      <Specs />

      {/* 8. FAQ */}
      <FAQ />

      {/* 9. Footer */}
      <Footer />

      {/* Rebuilt Bidding Modal */}
      <ZoneModal key={selectedZoneId || 'modal'} />
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
