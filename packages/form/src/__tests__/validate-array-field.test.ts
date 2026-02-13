import { describe, it, expect } from 'vitest';
import { vo } from '@gunubin/vorm-core';
import { createArrayField } from '../create-array-field.js';
import { validateArrayField } from '../validate-array-field.js';

const TagVO = vo('Tag', [
  { code: 'TOO_SHORT', validate: (v: string) => v.length >= 2 },
]);

describe('validateArrayField', () => {
  describe('required check', () => {
    it('returns REQUIRED when value is undefined and required: true', () => {
      const field = createArrayField(TagVO)({ required: true });
      const errors = validateArrayField(undefined, field);

      expect(errors['']).toEqual({ code: 'REQUIRED', message: 'This field is required' });
    });

    it('returns REQUIRED when value is null and required: true', () => {
      const field = createArrayField(TagVO)({ required: true });
      const errors = validateArrayField(null, field);

      expect(errors['']).toEqual({ code: 'REQUIRED', message: 'This field is required' });
    });

    it('returns REQUIRED when value is empty array and required: true', () => {
      const field = createArrayField(TagVO)({ required: true });
      const errors = validateArrayField([], field);

      expect(errors['']).toEqual({ code: 'REQUIRED', message: 'This field is required' });
    });

    it('returns no errors when value is undefined and required: false', () => {
      const field = createArrayField(TagVO)();
      const errors = validateArrayField(undefined, field);

      expect(errors).toEqual({});
    });

    it('returns no errors when value is empty array and required: false', () => {
      const field = createArrayField(TagVO)();
      const errors = validateArrayField([], field);

      expect(errors).toEqual({});
    });

    it('uses custom REQUIRED message', () => {
      const field = createArrayField(TagVO)({
        required: true,
        messages: { REQUIRED: 'Please add at least one tag' },
      });
      const errors = validateArrayField([], field);

      expect(errors['']).toEqual({ code: 'REQUIRED', message: 'Please add at least one tag' });
    });
  });

  describe('minLength / maxLength', () => {
    it('returns MIN_LENGTH when array is shorter than minLength', () => {
      const field = createArrayField(TagVO)({ required: true, minLength: 2 });
      const errors = validateArrayField(['ab'], field);

      expect(errors['']).toEqual({ code: 'MIN_LENGTH', message: 'MIN_LENGTH' });
    });

    it('returns MAX_LENGTH when array is longer than maxLength', () => {
      const field = createArrayField(TagVO)({ required: true, maxLength: 2 });
      const errors = validateArrayField(['ab', 'cd', 'ef'], field);

      expect(errors['']).toEqual({ code: 'MAX_LENGTH', message: 'MAX_LENGTH' });
    });

    it('passes when array length is within bounds', () => {
      const field = createArrayField(TagVO)({ required: true, minLength: 1, maxLength: 3 });
      const errors = validateArrayField(['ab', 'cd'], field);

      expect(errors).toEqual({});
    });

    it('uses custom MIN_LENGTH message', () => {
      const field = createArrayField(TagVO)({
        required: true,
        minLength: 2,
        messages: { MIN_LENGTH: 'At least 2 tags required' },
      });
      const errors = validateArrayField(['ab'], field);

      expect(errors['']).toEqual({ code: 'MIN_LENGTH', message: 'At least 2 tags required' });
    });

    it('uses custom MAX_LENGTH message', () => {
      const field = createArrayField(TagVO)({
        required: true,
        maxLength: 1,
        messages: { MAX_LENGTH: 'Too many tags' },
      });
      const errors = validateArrayField(['ab', 'cd'], field);

      expect(errors['']).toEqual({ code: 'MAX_LENGTH', message: 'Too many tags' });
    });
  });

  describe('per-item validation', () => {
    it('validates each item with the item FieldSchema', () => {
      const field = createArrayField(TagVO)({ required: true });
      const errors = validateArrayField(['ab', 'x', 'cd', 'y'], field);

      expect(errors['[1]']).toEqual({ code: 'TOO_SHORT', message: 'TOO_SHORT' });
      expect(errors['[3]']).toEqual({ code: 'TOO_SHORT', message: 'TOO_SHORT' });
      expect(errors['[0]']).toBeUndefined();
      expect(errors['[2]']).toBeUndefined();
    });

    it('returns no errors when all items are valid', () => {
      const field = createArrayField(TagVO)({ required: true });
      const errors = validateArrayField(['ab', 'cd', 'ef'], field);

      expect(errors).toEqual({});
    });
  });

  describe('primitive array', () => {
    it('validates primitive array items with custom rules', () => {
      const field = createArrayField<string>({
        rules: [{ code: 'TOO_LONG', validate: (v) => v.length <= 5 }],
      })({ required: true });

      const errors = validateArrayField(['hello', 'toolong', 'ok'], field);

      expect(errors['[1]']).toEqual({ code: 'TOO_LONG', message: 'TOO_LONG' });
      expect(errors['[0]']).toBeUndefined();
      expect(errors['[2]']).toBeUndefined();
    });

    it('empty string items fail REQUIRED on item schema', () => {
      const field = createArrayField<string>()({ required: true });

      const errors = validateArrayField(['hello', '', 'world'], field);

      expect(errors['[1]']).toEqual({ code: 'REQUIRED', message: 'This field is required' });
    });
  });
});
