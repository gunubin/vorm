import { describe, it, expect } from 'vitest';
import { createField } from '../create-field.js';

describe('createField (primitive)', () => {
  it('returns a factory function', () => {
    const factory = createField<string>();
    expect(typeof factory).toBe('function');
  });

  it('factory returns a FieldSchema with vo: null', () => {
    const factory = createField<string>();
    const field = factory();

    expect(field.vo).toBeNull();
  });

  it('creates FieldSchema with required: true', () => {
    const factory = createField<string>();
    const field = factory({ required: true });

    expect(field.required).toBe(true);
  });

  it('creates FieldSchema with required: false', () => {
    const factory = createField<string>();
    const field = factory({ required: false });

    expect(field.required).toBe(false);
  });

  it('defaults to required: false when no arguments', () => {
    const factory = createField<string>();
    const field = factory();

    expect(field.required).toBe(false);
  });

  it('sets custom rules at definition level', () => {
    const factory = createField<string>({
      rules: [
        { code: 'TOO_LONG', validate: (v) => v.length <= 100 },
      ],
    });
    const field = factory();

    expect(field.rules).toHaveLength(1);
    expect(field.rules[0].code).toBe('TOO_LONG');
  });

  it('sets Record-style messages at definition level', () => {
    const factory = createField<string>({
      messages: {
        TOO_LONG: 'Must be 100 characters or less',
      },
    });
    const field = factory();

    expect(field.messages).toEqual({
      TOO_LONG: 'Must be 100 characters or less',
    });
  });

  it('sets messages at factory level', () => {
    const factory = createField<string>();
    const field = factory({
      required: true,
      messages: {
        REQUIRED: 'Please enter a name',
      },
    });

    expect(field.messages).toEqual({
      REQUIRED: 'Please enter a name',
    });
  });

  it('merges definition and factory messages (factory takes precedence)', () => {
    const factory = createField<string>({
      messages: {
        TOO_LONG: 'definition level',
      },
    });
    const field = factory({
      required: true,
      messages: {
        REQUIRED: 'factory level',
        TOO_LONG: 'factory override',
      },
    });

    expect(field.messages).toEqual({
      REQUIRED: 'factory level',
      TOO_LONG: 'factory override',
    });
  });

  it('sets function-style messages', () => {
    const messageFn = ({ code }: { code: string }) => `Error: ${code}`;
    const factory = createField<string>({
      messages: messageFn,
    });
    const field = factory();

    expect(field.messages).toBe(messageFn);
  });

  it('uses default values when rules and messages are omitted', () => {
    const factory = createField<string>();
    const field = factory();

    expect(field.rules).toEqual([]);
    expect(field.messages).toEqual({});
  });

  it('sets parse at definition level', () => {
    const factory = createField<string>({
      parse: (v: string) => v.trim(),
    });
    const field = factory();

    expect(field.parse).toBeDefined();
    expect(field.parse!('  hello  ')).toBe('hello');
  });

  it('sets format at definition level', () => {
    const factory = createField<string, number>({
      format: (v: string) => `formatted: ${v}`,
    });
    const field = factory({ required: true });

    expect(field.format).toBeDefined();
    expect(field.format!('42')).toBe('formatted: 42');
  });

  it('sets both parse and format', () => {
    const factory = createField<number>({
      parse: (v: string) => Number(v.replace(/,/g, '')),
      format: (v: number) => v.toLocaleString(),
    });
    const field = factory({ required: true });

    expect(field.parse!('1,000')).toBe(1000);
    expect(field.format!(1000)).toBe('1,000');
  });
});
