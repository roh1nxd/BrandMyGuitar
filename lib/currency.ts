export type Currency = 'EUR' | 'USD';

export const EUR_TO_USD_RATE = 1.08;

/**
 * Formats EUR cents into localized currency display string
 * e.g. formatPrice(15000, 'EUR') -> "150 €"
 * e.g. formatPrice(15000, 'USD') -> "$162"
 */
export function formatPrice(amountInEurCents: number | null | undefined, currency: Currency): string {
  if (amountInEurCents === null || amountInEurCents === undefined) return '';
  
  if (currency === 'USD') {
    const usdCents = Math.round(amountInEurCents * EUR_TO_USD_RATE);
    return `$${(usdCents / 100).toLocaleString('en-US')}`;
  }
  
  return `${(amountInEurCents / 100).toLocaleString('en-US')} €`;
}

/**
 * Returns raw numeric amount in selected currency units (not cents)
 */
export function getConvertedUnits(amountInEurCents: number, currency: Currency): number {
  if (currency === 'USD') {
    return Math.round((amountInEurCents * EUR_TO_USD_RATE) / 100);
  }
  return Math.round(amountInEurCents / 100);
}

/**
 * Converts user input in selected currency back to canonical EUR cents for storage & bidding
 */
export function convertInputToEurCents(inputUnits: number, currency: Currency): number {
  if (currency === 'USD') {
    return Math.round((inputUnits / EUR_TO_USD_RATE) * 100);
  }
  return Math.round(inputUnits * 100);
}
