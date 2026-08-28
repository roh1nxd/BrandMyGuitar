'use client';

import React from 'react';
import { Guitar } from 'lucide-react';
import { useAuction } from '@/lib/AuctionContext';

interface NavbarProps {
  onGetSpotClick: () => void;
}

export default function Navbar({ onGetSpotClick }: NavbarProps) {
  const { currency, setCurrency } = useAuction();

  return (
    <header className="sticky top-0 z-40 bg-bg border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
        {/* Logo + Name */}
        <a href="#" className="flex items-center gap-2 text-text font-semibold text-base tracking-tight hover:opacity-80 transition-opacity">
          <Guitar className="w-5 h-5 text-text" />
          <span>Brand My Guitar</span>
        </a>

        {/* Center Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm text-text-muted">
          <a href="#auction" className="hover:text-text transition-colors">Live auction</a>
          <a href="#how-it-works" className="hover:text-text transition-colors">How it works</a>
          <a href="#guitar" className="hover:text-text transition-colors">The guitar</a>
          <a href="#faq" className="hover:text-text transition-colors">FAQ</a>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrency(currency === 'EUR' ? 'USD' : 'EUR')}
            className="px-2.5 py-1 text-xs font-medium text-text-muted hover:text-text border border-border rounded-sm transition-colors"
          >
            {currency === 'EUR' ? '€ EUR' : '$ USD'}
          </button>
          <button
            onClick={onGetSpotClick}
            className="btn-black text-xs"
          >
            Get a spot
          </button>
        </div>
      </div>
    </header>
  );
}
