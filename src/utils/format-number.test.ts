import { formatNumber } from '@/utils/format-number';

describe('formatNumber', () => {
  it('should format number with default 2 decimals', () => {
    expect(formatNumber(1234.567)).toBe('1,234.57');
  });

  it('should respect custom decimals', () => {
    expect(formatNumber(1234.567, 3)).toBe('1,234.567');
  });

  it('should format string numbers', () => {
    expect(formatNumber('9876.543')).toBe('9,876.54');
  });
});
