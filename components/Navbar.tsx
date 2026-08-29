'use client';

import React, { useState } from 'react';
import { Guitar, Menu, X } from 'lucide-react';
import { useAuction } from '@/lib/AuctionContext';

interface NavbarProps {
  onGetSpotClick: () => void;
  onLeaderboardClick?: () => void;
}

export default function Navbar({ onGetSpotClick, onLeaderboardClick }: NavbarProps) {
  const { currency, setCurrency } = useAuction();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (callback?: () => void) => {
    setMobileMenuOpen(false);
    if (callback) callback();
  };

  return (
    <header className="sticky top-0 z-40 bg-cream border-b border-hairline">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
        {/* Logo + Name */}
        <a href="#" className="flex items-center gap-2 text-primary font-bold text-base tracking-tight hover:opacity-90 transition-opacity">
          <Guitar className="w-5 h-5 text-primary" />
          <span className="truncate">Brand My Guitar</span>
        </a>

        {/* Center Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-8 text-sm text-ink">
          <a href="#auction" className="hover:text-primary transition-colors">Live auction</a>
          <a
            href="#leaderboard"
            onClick={(e) => {
              if (onLeaderboardClick) {
                e.preventDefault();
                onLeaderboardClick();
              }
            }}
            className="hover:text-primary transition-colors"
          >
            Leaderboard
          </a>
          <a href="#how-it-works" className="hover:text-primary transition-colors">How it works</a>
          <a href="#guitar" className="hover:text-primary transition-colors">The guitar</a>
          <a href="#faq" className="hover:text-primary transition-colors">FAQ</a>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setCurrency(currency === 'EUR' ? 'USD' : 'EUR')}
            className="px-2.5 sm:px-3 py-1 text-xs font-medium text-muted hover:text-primary border border-hairline rounded-full hover:border-primary transition-colors shrink-0"
          >
            {currency === 'EUR' ? '€ EUR' : '$ USD'}
          </button>

          <button
            onClick={onGetSpotClick}
            className="px-3.5 sm:px-4 py-2 rounded-full bg-[#034F46] hover:bg-[#023D36] text-[#FFFFEB] text-xs font-semibold transition-colors shadow-xs cursor-pointer whitespace-nowrap"
          >
            Get a spot
          </button>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-ink hover:text-primary md:hidden rounded-lg border border-hairline/60 ml-1"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-hairline bg-cream px-4 py-4 space-y-3 text-sm text-ink font-medium animate-in slide-in-from-top-2">
          <a
            href="#auction"
            onClick={() => handleNavClick()}
            className="block py-2 border-b border-hairline/40 hover:text-primary"
          >
            Live auction
          </a>
          <a
            href="#leaderboard"
            onClick={(e) => {
              if (onLeaderboardClick) {
                e.preventDefault();
                handleNavClick(onLeaderboardClick);
              } else {
                handleNavClick();
              }
            }}
            className="block py-2 border-b border-hairline/40 hover:text-primary"
          >
            Leaderboard
          </a>
          <a
            href="#how-it-works"
            onClick={() => handleNavClick()}
            className="block py-2 border-b border-hairline/40 hover:text-primary"
          >
            How it works
          </a>
          <a
            href="#guitar"
            onClick={() => handleNavClick()}
            className="block py-2 border-b border-hairline/40 hover:text-primary"
          >
            The guitar
          </a>
          <a
            href="#faq"
            onClick={() => handleNavClick()}
            className="block py-2 hover:text-primary"
          >
            FAQ
          </a>
        </div>
      )}
    </header>
  );
}
