/**
 * Returns the number of decimal digits up to the last non-zero digit in the string.
 * If the string consists of all zeros, returns undefined.
 *
 *  Examples:
 * "0.01000000" → 2
 * "0.00001000" → 5
 * "0.00000000" → 0
 * "" → 0
 *
 * @param {string} text - The string representing the decimal portion (e.g., '00100')
 * @returns {number | undefined} The count of decimal digits up to last non-zero, or undefined if all zeros
 */
export const extractDecimals = (text: string | undefined): number => {
  if (!text) return 0;

  const decimalPart = text?.split('.')[1];

  if (!decimalPart) return 0;

  let size = decimalPart?.length ?? 0;
  let index = 0;

  while (size > 0 && index === 0) {
    if (decimalPart[size - 1] !== '0') {
      index = size;
    }

    size--;
  }

  return index;
};
