import { formatNumber } from './format-number';

/**
 * Truncates a number and formats it using suffixes for large values ("K", "M", "B").
 *
 * - Numbers >= 1,000,000,000 are shown with the "B" suffix (billion).
 * - Numbers >= 1,000,000 are shown with the "M" suffix (million).
 * - Numbers >= 1,000 are shown with the "K" suffix (thousand).
 * - Numbers < 1,000 are formatted with up to 5 decimal places.
 *
 * @param {number | string} value - The value to format and truncate.
 * @param {number} [decimals=2] - Number of decimal places to show after truncation for large numbers.
 * @returns {string} The formatted and truncated number.
 */

const formatNumberTruncate = (value: number | string, decimals = 2) => {
  const num = Number(value);
  if (num >= 1_000_000_000) return Math.floor((num / 1_000_000_000) * 10 ** decimals) / 10 ** decimals + ' B';
  if (num >= 1_000_000) return Math.floor((num / 1_000_000) * 10 ** decimals) / 10 ** decimals + ' M';
  if (num >= 1_000) return Math.floor((num / 1_000) * 10 ** decimals) / 10 ** decimals + ' K';
  return formatNumber(value, 5); // small numbers, use stepSize precision
};

export default formatNumberTruncate;
