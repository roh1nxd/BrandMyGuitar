import { ZoneDefinition, Zone, Campaign } from '@/types/zone';

export const MIN_BID_INCREMENT_CENTS = 1000; // 10 EUR/USD minimum step
export const DEPOSIT_PERCENTAGE = 0.20; // 20% partial deposit at bid time

export interface EnhancedZoneDefinition extends ZoneDefinition {
  spotNumber: number;
  dimensions: string;
}

export const ZONE_DEFINITIONS: EnhancedZoneDefinition[] = [
  {
    id: 'headstock',
    spotNumber: 1,
    name: 'Headstock Face',
    size: 'small',
    dimensions: 'Small sticker · 5.5 × 3.0 cm',
    min_bid_cents: 10000, // 100 €
    description: 'At the top of the guitar, visible in every video and close-up.',
    flatView: {
      x: 50,
      y: 9,
      width: 18,
      height: 10,
    },
    threeDView: {
      position: [0.32, 0.058, 0.0],
      rotation: [-Math.PI / 2, 0, -Math.PI / 2],
      scale: [0.045, 0.035, 0.04],
    },
  },
  {
    id: 'upper-bout-left',
    spotNumber: 2,
    name: 'Upper Left Body',
    size: 'medium',
    dimensions: 'Medium sticker · 7.5 × 4.5 cm',
    min_bid_cents: 15000, // 150 €
    description: 'Top left curve of the guitar face.',
    flatView: {
      x: 34,
      y: 54,
      width: 20,
      height: 12,
    },
    threeDView: {
      position: [-0.05, 0.060, -0.075],
      rotation: [-Math.PI / 2, 0, -Math.PI / 2],
      scale: [0.055, 0.05, 0.04],
    },
  },
  {
    id: 'upper-bout-right',
    spotNumber: 3,
    name: 'Upper Right Body',
    size: 'medium',
    dimensions: 'Medium sticker · 7.5 × 4.5 cm',
    min_bid_cents: 15000, // 150 €
    description: 'Top right curve of the guitar face.',
    flatView: {
      x: 66,
      y: 54,
      width: 20,
      height: 12,
    },
    threeDView: {
      position: [-0.05, 0.060, 0.075],
      rotation: [-Math.PI / 2, 0, -Math.PI / 2],
      scale: [0.055, 0.05, 0.04],
    },
  },
  {
    id: 'pickguard',
    spotNumber: 4,
    name: 'Pickguard Zone',
    size: 'medium',
    dimensions: 'Medium sticker · 8.0 × 5.0 cm',
    min_bid_cents: 20000, // 200 €
    description: 'Right next to the soundhole where my strumming hand sits.',
    flatView: {
      x: 60,
      y: 67,
      width: 20,
      height: 12,
    },
    threeDView: {
      position: [-0.12, 0.061, 0.045],
      rotation: [-Math.PI / 2, 0, -Math.PI / 2],
      scale: [0.06, 0.05, 0.04],
    },
  },
  {
    id: 'lower-bout-left',
    spotNumber: 5,
    name: 'Lower Left Body',
    size: 'large',
    dimensions: 'Large sticker · 9.5 × 5.5 cm',
    min_bid_cents: 25000, // 250 €
    description: 'Large surface area on the lower left soundboard.',
    flatView: {
      x: 32,
      y: 78,
      width: 24,
      height: 14,
    },
    threeDView: {
      position: [-0.26, 0.060, -0.085],
      rotation: [-Math.PI / 2, 0, -Math.PI / 2],
      scale: [0.07, 0.065, 0.04],
    },
  },
  {
    id: 'lower-bout-right',
    spotNumber: 6,
    name: 'Lower Right Body',
    size: 'large',
    dimensions: 'Large sticker · 9.5 × 5.5 cm',
    min_bid_cents: 25000, // 250 €
    description: 'Large surface area on the lower right soundboard.',
    flatView: {
      x: 68,
      y: 78,
      width: 24,
      height: 14,
    },
    threeDView: {
      position: [-0.26, 0.060, 0.085],
      rotation: [-Math.PI / 2, 0, -Math.PI / 2],
      scale: [0.07, 0.065, 0.04],
    },
  },
  {
    id: 'bottom-center',
    spotNumber: 7,
    name: 'Bottom Center Body',
    size: 'medium',
    dimensions: 'Medium sticker · 8.0 × 4.5 cm',
    min_bid_cents: 20000, // 200 €
    description: 'Directly below the bridge at the base of the guitar.',
    flatView: {
      x: 50,
      y: 89,
      width: 22,
      height: 10,
    },
    threeDView: {
      position: [-0.33, 0.060, 0.0],
      rotation: [-Math.PI / 2, 0, -Math.PI / 2],
      scale: [0.06, 0.05, 0.04],
    },
  },
];

const futureEndDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

export const INITIAL_CAMPAIGN: Campaign = {
  id: 1,
  goal_cents: 200000,
  raised_cents: 34000,
  ends_at: futureEndDate,
  currency: 'EUR',
};

export const INITIAL_ZONES: Zone[] = ZONE_DEFINITIONS.map((def, idx) => {
  if (idx === 0) {
    return {
      id: def.id,
      name: def.name,
      size: def.size,
      min_bid_cents: def.min_bid_cents,
      current_bid_cents: 12000, // 120 €
      bids_count: 3,
      status: 'paid',
      price_cents: 12000,
      brand_name: 'Nordic Audio',
      website_url: 'https://nordicaudio.com',
      logo_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=60',
      top_bidder_email: 'bidder@nordicaudio.com',
    };
  }
  if (idx === 3) {
    return {
      id: def.id,
      name: def.name,
      size: def.size,
      min_bid_cents: def.min_bid_cents,
      current_bid_cents: 22000, // 220 €
      bids_count: 5,
      status: 'paid',
      price_cents: 22000,
      brand_name: 'Tonecraft Cables',
      website_url: 'https://tonecraft.io',
      logo_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=60',
      top_bidder_email: 'sponsorship@tonecraft.io',
    };
  }
  return {
    id: def.id,
    name: def.name,
    size: def.size,
    min_bid_cents: def.min_bid_cents,
    current_bid_cents: null,
    bids_count: 0,
    status: 'available',
    price_cents: def.min_bid_cents,
    brand_name: null,
    website_url: null,
    logo_url: null,
    top_bidder_email: null,
  };
});
