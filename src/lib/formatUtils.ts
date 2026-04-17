/**
 * Formats a currency value using Venezuelan style:
 * Decimal separator: comma (,)
 * Thousands separator: dot (.)
 * Example: 1500.50 -> 1.500,50
 */
export function formatBs(amount: number): string {
  return new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats a currency value using US style:
 * Decimal separator: dot (.)
 * Thousands separator: comma (,)
 * Example: 1500.50 -> 1,500.50
 */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
