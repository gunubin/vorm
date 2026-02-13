import { describe, it, expect } from 'vitest';
import { vo } from '@gunubin/vorm-core';
import { createArrayField } from '../create-array-field.js';

const TagVO = vo('Tag', [
  { code: 'TOO_SHORT', validate: (v: string) => v.length >= 2 },
]);

describe('createArrayField (VO)', () => {
  it('creates a factory function from VO definition', () => {
    const tagArray = createArrayField(TagVO);
    expect(typeof tagArray).toBe('function');
  });

  it('factory returns an ArrayFieldSchema with __array: true', () => {
    const tagArray = createArrayField(TagVO);
    const field = tagArray({ required: true });

    expect(field.__array).toBe(true);
    expect(field.item.vo).toBe(TagVO);
    expect(field.required).toBe(true);
    expect(field.item.rules).toHaveLength(1);
  });

  it('creates ArrayFieldSchema with required: true', () => {
    const tagArray = createArrayField(TagVO);
    const field = tagArray({ required: true });

    expect(field.required).toBe(true);
  });

  it('creates ArrayFieldSchema with required: false', () => {
    const tagArray = createArrayField(TagVO);
    const field = tagArray({ required: false });

    expect(field.required).toBe(false);
  });

  it('defaults to required: false when no arguments', () => {
    const tagArray = createArrayField(TagVO);
    const field = tagArray();

    expect(field.required).toBe(false);
  });

  it('sets minLength and maxLength', () => {
    const tagArray = createArrayField(TagVO);
    const field = tagArray({ required: true, minLength: 1, maxLength: 10 });

    expect(field.minLength).toBe(1);
    expect(field.maxLength).toBe(10);
  });

  it('sets messages at factory level', () => {
    const tagArray = createArrayField(TagVO);
    const field = tagArray({
      required: true,
      messages: {
        REQUIRED: 'Tags are required',
        MIN_LENGTH: 'Add at least one tag',
      },
    });

    expect(field.messages).toEqual({
      REQUIRED: 'Tags are required',
      MIN_LENGTH: 'Add at least one tag',
    });
  });

  it('merges definition and factory messages', () => {
    const tagArray = createArrayField(TagVO, {
      messages: { TOO_SHORT: 'Tag is too short' },
    });
    const field = tagArray({
      required: true,
      messages: { REQUIRED: 'Tags are required' },
    });

    expect(field.messages).toEqual({
      TOO_SHORT: 'Tag is too short',
      REQUIRED: 'Tags are required',
    });
  });

  it('item schema has required: true always', () => {
    const tagArray = createArrayField(TagVO);
    const field = tagArray();

    expect(field.item.required).toBe(true);
  });
});

describe('createArrayField (primitive)', () => {
  it('returns a factory function', () => {
    const factory = createArrayField<string>();
    expect(typeof factory).toBe('function');
  });

  it('factory returns an ArrayFieldSchema with vo: null on item', () => {
    const factory = createArrayField<string>();
    const field = factory();

    expect(field.__array).toBe(true);
    expect(field.item.vo).toBeNull();
  });

  it('creates ArrayFieldSchema with required: true', () => {
    const factory = createArrayField<string>();
    const field = factory({ required: true });

    expect(field.required).toBe(true);
  });

  it('defaults to required: false when no arguments', () => {
    const factory = createArrayField<string>();
    const field = factory();

    expect(field.required).toBe(false);
  });

  it('sets custom rules on item schema', () => {
    const factory = createArrayField<string>({
      rules: [{ code: 'NOT_EMPTY', validate: (v) => v.length > 0 }],
    });
    const field = factory();

    expect(field.item.rules).toHaveLength(1);
    expect(field.item.rules[0].code).toBe('NOT_EMPTY');
  });

  it('sets minLength and maxLength', () => {
    const factory = createArrayField<string>();
    const field = factory({ minLength: 1, maxLength: 5 });

    expect(field.minLength).toBe(1);
    expect(field.maxLength).toBe(5);
  });
});
