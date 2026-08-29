import React from 'react';

export default function HowItWorks() {
  const steps = [
    {
      num: '1',
      title: 'Pick a spot and place your bid',
      desc: 'Select any zone on the guitar and submit your bid amount along with your logo artwork. Bids must increase by at least 10 €.',
    },
    {
      num: '2',
      title: '20% deposit holds your bid',
      desc: 'You only pay a 20% refundable deposit by card to place a bid, not the full amount upfront.',
    },
    {
      num: '3',
      title: 'Instant refund if you are outbid',
      desc: 'If someone bids higher on your spot, your 20% deposit is automatically refunded to your original card right away.',
    },
    {
      num: '4',
      title: 'Winning bids go on the guitar',
      desc: 'When the auction ends, the highest bid for each spot wins. Your logo is permanently lacquered onto the guitar body.',
    },
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-20 px-4 sm:px-8 max-w-5xl mx-auto border-t border-hairline">
      <div className="text-center max-w-xl mx-auto mb-12">
        <h2 className="text-2xl sm:text-3xl font-serif text-ink mb-3">
          How bidding works
        </h2>
        <p className="text-sm text-muted">
          Transparent auction mechanics with automatic deposit refunds when outbid.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((s, idx) => (
          <div key={idx} className="bg-card border border-hairline rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="w-6 h-6 rounded-full bg-primary text-cream text-xs font-bold flex items-center justify-center mb-3">
                {s.num}
              </div>
              <h3 className="font-semibold text-ink text-sm mb-1.5">
                {s.title}
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                {s.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
