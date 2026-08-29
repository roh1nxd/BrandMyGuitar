'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Is this real? Will my logo actually go on your guitar?',
      a: 'Yes, 100%. Once the auction closes, every winning bid\'s logo is prepared as a custom vinyl decal and applied to the face of my guitar beneath a protective lacquer layer before my upcoming gigs.',
    },
    {
      q: 'How does the deposit and auto-refund work?',
      a: 'When you place a bid, you only pay a 20% deposit by card. If someone outbids you, Razorpay automatically sends a full refund of your 20% deposit back to your original payment method right away.',
    },
    {
      q: 'What happens when the auction ends?',
      a: 'If you have the winning top bid when the countdown expires, your 20% deposit is credited toward your total, and you\'ll receive an email with a secure link to pay the remaining 80% balance.',
    },
    {
      q: 'What kind of logo should I upload?',
      a: 'A clean transparent PNG or vector SVG file works best. High-resolution JPEG files are also fine.',
    },
    {
      q: 'Will you promote my brand link?',
      a: 'Yes! Anyone who clicks your spot in either the live auction grid, 2D view, or 3D view is taken directly to your official website.',
    },
  ];

  return (
    <section id="faq" className="py-16 sm:py-20 px-4 sm:px-8 max-w-3xl mx-auto border-t border-hairline">
      <div className="text-center mb-10">
        <h2 className="text-2xl sm:text-3xl font-serif text-ink mb-2">
          Frequently asked questions
        </h2>
        <p className="text-sm text-muted">
          Honest answers about the auction, refunds, and the guitar.
        </p>
      </div>

      <div className="divide-y divide-hairline border border-hairline rounded-xl overflow-hidden bg-cream">
        {faqs.map((f, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={i} className="p-4 sm:p-5">
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full text-left flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-ink hover:text-primary transition-colors"
              >
                <span>{f.q}</span>
                <span className="text-muted shrink-0">
                  {isOpen ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4" />}
                </span>
              </button>
              {isOpen && (
                <div className="pt-2 text-xs sm:text-sm text-muted leading-relaxed">
                  {f.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
