import React from 'react';

export default function Specs() {
  const specs = [
    { label: 'Guitar', value: 'Taylor Grand Auditorium Custom Acoustic-Electric' },
    { label: 'Top', value: 'Solid Sitka Spruce' },
    { label: 'Back & Sides', value: 'Indian Rosewood' },
    { label: 'Fretboard', value: 'West African Crelicam Ebony' },
    { label: 'Pickups', value: 'Taylor Expression System 2' },
    { label: 'Logo Application', value: 'Durable vinyl decal sealed under clear protective lacquer' },
  ];

  return (
    <section id="guitar" className="py-16 sm:py-20 px-4 sm:px-8 max-w-5xl mx-auto border-t border-hairline">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
        <div className="md:col-span-5">
          <h2 className="text-2xl sm:text-3xl font-serif text-ink mb-3">
            The Guitar
          </h2>
          <p className="text-sm text-muted leading-relaxed mb-4">
            This is my primary performance guitar. It's the instrument I use for live gigs, open mics, recording sessions, and videos.
          </p>
          <div className="text-xs text-muted leading-relaxed">
            Every logo decal is professionally applied and sealed beneath protective lacquer so it won't peel or wear during playing.
          </div>
        </div>

        <div className="md:col-span-7 bg-card border border-hairline rounded-xl p-5">
          <div className="divide-y divide-hairline">
            {specs.map((item, idx) => (
              <div key={idx} className="py-2.5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 text-xs">
                <span className="text-muted sm:w-40 shrink-0 font-medium">{item.label}</span>
                <span className="text-ink font-semibold sm:text-right">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
