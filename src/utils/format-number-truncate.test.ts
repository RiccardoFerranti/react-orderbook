import formatNumberTruncate from './format-number-truncate';

describe('formatNumberTruncate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should format billions with `B` suffix', () => {
    const result = formatNumberTruncate(1_234_567_890);
    expect(result).toBe('1.23 B');
  });

  it('should format millions with `M` suffix', () => {
    const result = formatNumberTruncate(2_987_654);
    expect(result).toBe('2.98 M');
  });

  it('should format thousands with `K` suffix', () => {
    const result = formatNumberTruncate(12_345);
    expect(result).toBe('12.34 K');
  });

  it('should truncate numbers instead of rounding', () => {
    const result = formatNumberTruncate(1_999_999);
    expect(result).toBe('1.99 M');
  });

  it('should support custom decimal places', () => {
    const result = formatNumberTruncate(1_234_567, 3);
    expect(result).toBe('1.234 M');
  });

  it('should accept numbers as strings', () => {
    const result = formatNumberTruncate('1500000');
    expect(result).toBe('1.5 M');
  });

  it('should format small numbers with 5 decimal places', () => {
    const result = formatNumberTruncate('150');
    expect(result).toBe('150.00000');
  });

  it('should format numbers with decimal places with 5 decimal places', () => {
    const result = formatNumberTruncate('152.45');
    expect(result).toBe('152.45000');
  });
});
