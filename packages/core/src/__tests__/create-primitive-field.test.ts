import { describe, it, expect } from 'vitest';
import { createField } from '../create-field.js';

describe('createField (primitive)', () => {
  it('returns a FieldSchema with vo as null', () => {
    const field = createField<string>();

    expect(field.vo).toBeNull();
  });

  it('generates FieldSchema with required: true', () => {
    const field = createField<string>({ required: true });

    expect(field.required).toBe(true);
  });

  it('generates FieldSchema with required: false', () => {
    const field = createField<string>({ required: false });

    expect(field.required).toBe(false);
  });

  it('defaults to required: false when omitted', () => {
    const field = createField<string>();

    expect(field.required).toBe(false);
  });

  it('can set custom rules', () => {
    const field = createField<string>({
      rules: [
        { code: 'TOO_LONG', validate: (v) => v.length <= 100 },
      ],
    });

    expect(field.rules).toHaveLength(1);
    expect(field.rules[0].code).toBe('TOO_LONG');
  });

  it('can set messages in Record format', () => {
    const field = createField<string>({
      required: true,
      messages: {
        REQUIRED: 'Please enter a name',
      },
    });

    expect(field.messages).toEqual({
      REQUIRED: 'Please enter a name',
    });
  });

  it('can set messages in function format', () => {
    const messageFn = ({ code }: { code: string }) => `Error: ${code}`;
    const field = createField<string>({
      messages: messageFn,
    });

    expect(field.messages).toBe(messageFn);
  });

  it('uses default values when rules and messages are omitted', () => {
    const field = createField<string>();

    expect(field.rules).toEqual([]);
    expect(field.messages).toEqual({});
  });
});
