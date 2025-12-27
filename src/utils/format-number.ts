/**
 * Formats a number according to the given locale and maximum significant digits.
 *
 * @param {number} number - The number to format.
 * @param {string} [lang='en-IN'] - The locale to use for formatting.
 * @param {number} [maxDigits=3] - The maximum number of significant digits.
 * @returns {string} The formatted number as a string.
 */

// export default function formatNumber(number: number | string, maxDigits = 3, lang = 'en-IN') {
//   return new Intl.NumberFormat(lang, { maximumSignificantDigits: maxDigits }).format(Number(number));
// }

export function formatNumber(value: number | string, decimals = 2, lang = 'en-IN') {
  return new Intl.NumberFormat(lang, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number(value));
}
