import { describe, it, expect } from 'vitest';
import { buildOutputValues } from '../build-output-values.js';
import { vo } from '../vo.js';
import { createField } from '../create-field.js';

const Price = vo('Price', [
  { code: 'POSITIVE', validate: (v: number) => v > 0 },
]);

describe('buildOutputValues', () => {
  it('transform なし・VO なしの場合、値をそのまま返す', () => {
    const field = createField<string>()({ required: true });
    const result = buildOutputValues({ name: 'hello' }, { name: field });

    expect(result).toEqual({ name: 'hello' });
  });

  it('VO がある場合 vo.create を適用する', () => {
    const field = createField(Price)({ required: true });
    const result = buildOutputValues({ price: 100 }, { price: field });

    expect(result.price).toBe(100);
  });

  it('空値は undefined を返す', () => {
    const field = createField<string>()({ required: true });

    expect(buildOutputValues({ name: '' }, { name: field })).toEqual({ name: undefined });
    expect(buildOutputValues({ name: null }, { name: field as any })).toEqual({ name: undefined });
    expect(buildOutputValues({ name: undefined }, { name: field })).toEqual({ name: undefined });
  });

  it('parse 済みの値をそのまま vo.create に渡す', () => {
    const field = createField(Price, {
      parse: (v: string) => Number(v.replace(/,/g, '')),
      format: (v: number) => v.toLocaleString(),
    })({ required: true });

    // parse は form state 保存時に適用済み。buildOutputValues は T を受け取る
    const result = buildOutputValues({ price: 1000 }, { price: field });
    expect(result.price).toBe(1000);
  });

  it('VO なしの場合、値をそのまま返す', () => {
    const field = createField<number>({
      parse: (v: string) => Number(v),
      format: (v: number) => String(v),
    })({ required: true });

    const result = buildOutputValues({ age: 25 }, { age: field });
    expect(result.age).toBe(25);
  });

  it('複数フィールドを処理する', () => {
    const priceField = createField(Price, {
      parse: (v: string) => Number(v.replace(/,/g, '')),
    })({ required: true });

    const nameField = createField<string>()({ required: true });

    const result = buildOutputValues(
      { price: 1000, name: 'hello' },
      { price: priceField, name: nameField },
    );

    expect(result.price).toBe(1000);
    expect(result.name).toBe('hello');
  });

  it('空値の optional フィールドは undefined', () => {
    const field = createField<number>({
      parse: (v: string) => Number(v),
    })({ required: false });

    const result = buildOutputValues({ age: '' }, { age: field });
    expect(result.age).toBe(undefined);
  });
});
