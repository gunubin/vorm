import { describe, it, expect } from 'vitest';
import { vo } from '@gunubin/vorm-core';
import { buildOutputValues } from '../build-output-values.js';
import { createField } from '../create-field.js';
import { createArrayField } from '../create-array-field.js';

const Price = vo('Price', [
  { code: 'POSITIVE', validate: (v: number) => v > 0 },
]);

describe('buildOutputValues', () => {
  it('returns value as-is when no transform and no VO', () => {
    const field = createField<string>()({ required: true });
    const result = buildOutputValues({ name: 'hello' }, { name: field });

    expect(result).toEqual({ name: 'hello' });
  });

  it('applies vo.create when VO is present', () => {
    const field = createField(Price)({ required: true });
    const result = buildOutputValues({ price: 100 }, { price: field });

    expect(result.price).toBe(100);
  });

  it('returns undefined for empty values', () => {
    const field = createField<string>()({ required: true });

    expect(buildOutputValues({ name: '' }, { name: field })).toEqual({ name: undefined });
    expect(buildOutputValues({ name: null }, { name: field as any })).toEqual({ name: undefined });
    expect(buildOutputValues({ name: undefined }, { name: field })).toEqual({ name: undefined });
  });

  it('passes pre-parsed value directly to vo.create', () => {
    const field = createField(Price, {
      parse: (v: string) => Number(v.replace(/,/g, '')),
      format: (v: number) => v.toLocaleString(),
    })({ required: true });

    // parse is applied when saving form state. buildOutputValues receives T
    const result = buildOutputValues({ price: 1000 }, { price: field });
    expect(result.price).toBe(1000);
  });

  it('returns value as-is when no VO', () => {
    const field = createField<number>({
      parse: (v: string) => Number(v),
      format: (v: number) => String(v),
    })({ required: true });

    const result = buildOutputValues({ age: 25 }, { age: field });
    expect(result.age).toBe(25);
  });

  it('processes multiple fields', () => {
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

  it('returns undefined for empty optional field', () => {
    const field = createField<number>({
      parse: (v: string) => Number(v),
    })({ required: false });

    const result = buildOutputValues({ age: '' }, { age: field });
    expect(result.age).toBe(undefined);
  });

  describe('array field', () => {
    const TagVO = vo('Tag', [
      { code: 'TOO_SHORT', validate: (v: string) => v.length >= 2 },
    ]);

    it('applies vo.create to each item in array', () => {
      const field = createArrayField(TagVO)({ required: true });
      const result = buildOutputValues({ tags: ['ab', 'cd'] }, { tags: field });

      expect(result.tags).toEqual(['ab', 'cd']);
    });

    it('returns shallow copy for primitive array (no VO)', () => {
      const field = createArrayField<string>()({ required: true });
      const original = ['hello', 'world'];
      const result = buildOutputValues({ labels: original }, { labels: field });

      expect(result.labels).toEqual(['hello', 'world']);
      expect(result.labels).not.toBe(original);
    });

    it('returns undefined for empty array', () => {
      const field = createArrayField(TagVO)({ required: true });
      const result = buildOutputValues({ tags: [] }, { tags: field });

      expect(result.tags).toBe(undefined);
    });

    it('returns undefined for undefined array', () => {
      const field = createArrayField(TagVO)();
      const result = buildOutputValues({ tags: undefined }, { tags: field });

      expect(result.tags).toBe(undefined);
    });

    it('mixes scalar and array fields', () => {
      const nameField = createField<string>()({ required: true });
      const tagField = createArrayField(TagVO)({ required: true });

      const result = buildOutputValues(
        { name: 'hello', tags: ['ab', 'cd'] },
        { name: nameField, tags: tagField },
      );

      expect(result.name).toBe('hello');
      expect(result.tags).toEqual(['ab', 'cd']);
    });
  });
});
