// Buyer-facing allocation only. Checkout and escrow retain their existing logic.
export function getPlatformCommissionRate(price) {
  if (!Number.isFinite(price) || price < 0) throw new RangeError('Invalid product price');
  return price <= 1000 ? 5 : price <= 5000 ? 4 : price <= 15000 ? 3.5 : 3;
}

export function getRevenueAllocation(price) {
  const commissionPercent = getPlatformCommissionRate(price);
  const totalPaisa = Math.round((price + Number.EPSILON) * 100);
  const commissionPaisa = Math.round(totalPaisa * commissionPercent / 100);
  return {
    commissionPercent,
    artisanPercent: 100 - commissionPercent,
    commissionAmount: commissionPaisa / 100,
    artisanAmount: (totalPaisa - commissionPaisa) / 100,
  };
}

export function formatAllocationMoney(amount, language = 'en') {
  const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
  const locale = {en: 'en-IN', hi: 'hi-IN', bn: 'bn-IN'}[language.split('-')[0]] || 'en-IN';
  return new Intl.NumberFormat(locale, {
    style: 'currency', currency: 'INR',
    minimumFractionDigits: Number.isInteger(rounded) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(rounded);
}
