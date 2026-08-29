import { Zone, Campaign, Bid } from '@/types/zone';
import { INITIAL_ZONES, INITIAL_CAMPAIGN, DEPOSIT_PERCENTAGE } from '@/lib/zones';
import { razorpay, isRazorpayConfigured } from '@/lib/razorpay';

declare global {
  var __zonesCache: Zone[] | undefined;
  var __bidsCache: Bid[] | undefined;
  var __campaignCache: Campaign | undefined;
}

export function getLocalZones(): Zone[] {
  if (!global.__zonesCache) {
    global.__zonesCache = JSON.parse(JSON.stringify(INITIAL_ZONES));
  }
  return global.__zonesCache!;
}

export function getLocalBids(): Bid[] {
  if (!global.__bidsCache) {
    global.__bidsCache = [];
  }
  return global.__bidsCache!;
}

export function getLocalCampaign(): Campaign {
  if (!global.__campaignCache) {
    global.__campaignCache = { ...INITIAL_CAMPAIGN };
  }
  // Sum current top bids
  const zones = getLocalZones();
  const sumTopBids = zones.reduce((acc, z) => acc + (z.current_bid_cents || 0), 0);
  global.__campaignCache!.raised_cents = Math.max(sumTopBids, INITIAL_CAMPAIGN.raised_cents);
  return global.__campaignCache!;
}

export async function processNewBid({
  zone_id,
  bidder_name,
  bidder_email,
  website_url,
  logo_url,
  amount_cents,
  razorpay_payment_id,
  razorpay_order_id,
  razorpay_signature,
}: {
  zone_id: string;
  bidder_name: string;
  bidder_email: string;
  website_url: string;
  logo_url: string;
  amount_cents: number;
  razorpay_payment_id?: string | null;
  razorpay_order_id?: string | null;
  razorpay_signature?: string | null;
}): Promise<{ bid: Bid; zone: Zone }> {
  const zones = getLocalZones();
  const bids = getLocalBids();

  const zoneIndex = zones.findIndex((z) => z.id === zone_id);
  if (zoneIndex === -1) {
    throw new Error('Zone not found');
  }

  const zone = zones[zoneIndex];
  const deposit_cents = Math.round(amount_cents * DEPOSIT_PERCENTAGE);

  // 1. Find previous top bid for this zone (if any) and mark outbid
  const prevTopBid = bids
    .filter((b) => b.zone_id === zone_id && b.status === 'active')
    .sort((a, b) => b.amount_cents - a.amount_cents)[0];

  if (prevTopBid) {
    prevTopBid.status = 'outbid';
    prevTopBid.refunded = true;
    console.log(`Auto-refund flagged for outbid user deposit: ${prevTopBid.bidder_email}`);
  }

  // 2. Create new active top bid
  const newBid: Bid = {
    id: `bid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    zone_id,
    bidder_name,
    bidder_email,
    website_url,
    logo_url,
    amount_cents,
    deposit_cents,
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    status: 'active',
    refunded: false,
    created_at: new Date().toISOString(),
  };

  bids.push(newBid);

  // 3. Update zone's current highest bid & logo
  zones[zoneIndex] = {
    ...zone,
    current_bid_cents: amount_cents,
    price_cents: amount_cents,
    bids_count: (zone.bids_count || 0) + 1,
    status: 'paid',
    brand_name: bidder_name,
    website_url,
    logo_url,
    top_bidder_email: bidder_email,
  };

  getLocalCampaign(); // refresh total raised

  return { bid: newBid, zone: zones[zoneIndex] };
}
