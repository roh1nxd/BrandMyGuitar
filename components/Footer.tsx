import React from 'react';
import { Guitar } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-hairline bg-cream py-10 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted">
        <div className="flex items-center gap-2 text-primary font-bold">
          <Guitar className="w-4 h-4 text-primary" />
          <span>Brand My Guitar</span>
        </div>

        <div className="flex items-center gap-6">
          <a href="#auction" className="hover:text-primary transition-colors">Live auction</a>
          <a href="#how-it-works" className="hover:text-primary transition-colors">How it works</a>
          <a href="#guitar" className="hover:text-primary transition-colors">The guitar</a>
          <a href="#faq" className="hover:text-primary transition-colors">FAQ</a>
          <a href="mailto:hello@brandmyguitar.com" className="hover:text-primary transition-colors">Contact</a>
        </div>

        <div>
          © {new Date().getFullYear()} Brand My Guitar.
        </div>
      </div>
    </footer>
  );
}
