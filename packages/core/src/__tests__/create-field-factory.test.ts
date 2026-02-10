import { describe, it, expect } from 'vitest';
import { vo } from '../vo.js';
import { createField } from '../create-field.js';

const PasswordVO = vo('Password', [
  { code: 'TOO_SHORT', validate: (v: string) => v.length >= 8 },
  { code: 'NO_UPPERCASE', validate: (v: string) => /[A-Z]/.test(v) },
]);

describe('createField (VO)', () => {
  it('generates a factory function from VODefinition', () => {
    const passwordField = createField(PasswordVO);
    expect(typeof passwordField).toBe('function');
  });

  it('factory returns FieldSchema', () => {
    const passwordField = createField(PasswordVO);
    const field = passwordField({ required: true });

    expect(field.vo).toBe(PasswordVO);
    expect(field.required).toBe(true);
    expect(field.rules).toHaveLength(2);
  });

  it('generates FieldSchema with required: true', () => {
    const passwordField = createField(PasswordVO);
    const field = passwordField({ required: true });

    expect(field.required).toBe(true);
  });

  it('generates FieldSchema with required: false', () => {
    const passwordField = createField(PasswordVO);
    const field = passwordField({ required: false });

    expect(field.required).toBe(false);
  });

  it('defaults to required: false when omitted', () => {
    const passwordField = createField(PasswordVO);
    const field = passwordField();

    expect(field.required).toBe(false);
  });

  it('can set messages in Record format', () => {
    const passwordField = createField(PasswordVO);
    const field = passwordField({
      required: true,
      messages: {
        REQUIRED: 'Please enter a password',
        TOO_SHORT: 'Must be at least 8 characters',
      },
    });

    expect(field.messages).toEqual({
      REQUIRED: 'Please enter a password',
      TOO_SHORT: 'Must be at least 8 characters',
    });
  });

  it('can set messages in function format', () => {
    const messageFn = ({ code }: { code: string }) => `Error: ${code}`;
    const passwordField = createField(PasswordVO);
    const field = passwordField({
      required: true,
      messages: messageFn,
    });

    expect(field.messages).toBe(messageFn);
  });

  it('VO rules are inherited by FieldSchema', () => {
    const passwordField = createField(PasswordVO);
    const field = passwordField({ required: true });

    expect(field.rules).toHaveLength(2);
    expect(field.rules[0].code).toBe('TOO_SHORT');
    expect(field.rules[1].code).toBe('NO_UPPERCASE');
  });
});
