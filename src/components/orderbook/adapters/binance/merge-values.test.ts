import mergeValues from './merge-values';

interface IOrder {
  price: number;
  size: number;
}

describe('mergeValues', () => {
  it('should reuse previous object if `price` and `size` are unchanged', () => {
    const prevValues: IOrder[] = [
      { price: 1, size: 10 },
      { price: 2, size: 20 },
    ];
    const newValues: IOrder[] = [
      { price: 1, size: 10 },
      { price: 2, size: 20 },
    ];

    const merged = mergeValues(prevValues, newValues);

    expect(merged[0]).toBe(prevValues[0]); // same reference
    expect(merged[1]).toBe(prevValues[1]); // same reference
  });

  it('should replace object if `size` changed', () => {
    const prevValues: IOrder[] = [
      { price: 1, size: 10 },
      { price: 2, size: 20 },
    ];
    const newValues: IOrder[] = [
      { price: 1, size: 15 }, // size changed
      { price: 2, size: 20 }, // unchanged
    ];

    const merged = mergeValues(prevValues, newValues);

    expect(merged[0]).not.toBe(prevValues[0]); // replaced
    expect(merged[1]).toBe(prevValues[1]); // reused
  });

  it('should add new orders if `price` did not exist before', () => {
    const prevValues: IOrder[] = [{ price: 1, size: 10 }];
    const newValues: IOrder[] = [
      { price: 1, size: 10 },
      { price: 2, size: 20 }, // new price
    ];

    const merged = mergeValues(prevValues, newValues);

    expect(merged.length).toBe(2);
    expect(merged[0]).toBe(prevValues[0]); // reused
    expect(merged[1]).toEqual({ price: 2, size: 20 }); // new
  });

  it('should work with empty `previous values`', () => {
    const prevValues: IOrder[] = [];
    const newValues: IOrder[] = [{ price: 1, size: 10 }];

    const merged = mergeValues(prevValues, newValues);
    expect(merged).toEqual(newValues);
  });

  it('should work with empty `new values`', () => {
    const prevValues: IOrder[] = [{ price: 1, size: 10 }];
    const newValues: IOrder[] = [];

    const merged = mergeValues(prevValues, newValues);
    expect(merged).toEqual([]);
  });
});
