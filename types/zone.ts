export type ZoneSize = 'small' | 'medium' | 'large';

export interface Bid {
  id: string;
  zone_id: string;
  bidder_name: string;
  bidder_email: string;
  website_url: string;
  logo_url: string;
  amount_cents: number;
  deposit_cents: number;
  stripe_payment_intent_id?: string | null;
  stripe_session_id?: string | null;
  status: 'active' | 'outbid' | 'won';
  refunded: boolean;
  created_at: string;
}

export interface Zone {
  id: string;
  name: string;
  size: ZoneSize;
  min_bid_cents: number;
  current_bid_cents: number | null;
  bids_count: number;
  brand_name?: string | null;
  website_url?: string | null;
  logo_url?: string | null;
  top_bidder_email?: string | null;
  created_at?: string;
}

export interface ZoneDefinition {
  id: string;
  name: string;
  size: ZoneSize;
  min_bid_cents: number;
  description: string;
  flatView: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  threeDView: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
  };
}

export interface Campaign {
  id: number;
  goal_cents: number;
  raised_cents: number;
  ends_at: string;
  currency: 'EUR' | 'USD';
}
