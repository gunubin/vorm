import { describe, it, expect } from 'vitest';
import { vo } from '@gunubin/vorm-core';
import { createField } from '../create-field.js';

const PasswordVO = vo('Password', [
  { code: 'TOO_SHORT', validate: (v: string) => v.length >= 8 },
  { code: 'NO_UPPERCASE', validate: (v: string) => /[A-Z]/.test(v) },
]);

describe('createField (VO)', () => {
  it('creates a factory function from VO definition', () => {
    const passwordField = createField(PasswordVO);
    expect(typeof passwordField).toBe('function');
  });

  it('factory returns a FieldSchema', () => {
    const passwordField = createField(PasswordVO);
    const field = passwordField({ required: true });

    expect(field.vo).toBe(PasswordVO);
    expect(field.required).toBe(true);
    expect(field.rules).toHaveLength(2);
  });

  it('creates FieldSchema with required: true', () => {
    const passwordField = createField(PasswordVO);
    const field = passwordField({ required: true });

    expect(field.required).toBe(true);
  });

  it('creates FieldSchema with required: false', () => {
    const passwordField = createField(PasswordVO);
    const field = passwordField({ required: false });

    expect(field.required).toBe(false);
  });

  it('defaults to required: false when no arguments', () => {
    const passwordField = createField(PasswordVO);
    const field = passwordField();

    expect(field.required).toBe(false);
  });

  it('sets Record-style messages at factory level', () => {
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

  it('sets messages at definition level', () => {
    const passwordField = createField(PasswordVO, {
      messages: {
        TOO_SHORT: 'definition: Must be at least 8 characters',
        NO_UPPERCASE: 'definition: Uppercase required',
      },
    });
    const field = passwordField({ required: true });

    expect(field.messages).toEqual({
      TOO_SHORT: 'definition: Must be at least 8 characters',
      NO_UPPERCASE: 'definition: Uppercase required',
    });
  });

  it('merges definition and factory messages (factory takes precedence)', () => {
    const passwordField = createField(PasswordVO, {
      messages: {
        TOO_SHORT: 'definition level',
        NO_UPPERCASE: 'definition level',
      },
    });
    const field = passwordField({
      required: true,
      messages: {
        REQUIRED: 'factory only',
        TOO_SHORT: 'factory override',
      },
    });

    expect(field.messages).toEqual({
      NO_UPPERCASE: 'definition level',
      REQUIRED: 'factory only',
      TOO_SHORT: 'factory override',
    });
  });

  it('sets function-style messages at factory level', () => {
    const messageFn = ({ code }: { code: string }) => `Error: ${code}`;
    const passwordField = createField(PasswordVO);
    const field = passwordField({
      required: true,
      messages: messageFn,
    });

    expect(field.messages).toBe(messageFn);
  });

  it('inherits VO rules in FieldSchema', () => {
    const passwordField = createField(PasswordVO);
    const field = passwordField({ required: true });

    expect(field.rules).toHaveLength(2);
    expect(field.rules[0].code).toBe('TOO_SHORT');
    expect(field.rules[1].code).toBe('NO_UPPERCASE');
  });

  it('sets parse at definition level', () => {
    const passwordField = createField(PasswordVO, {
      parse: (v: string) => v.trim(),
    });
    const field = passwordField({ required: true });

    expect(field.parse).toBeDefined();
    expect(field.parse!('  Password1  ')).toBe('Password1');
  });

  it('sets format at definition level', () => {
    const passwordField = createField(PasswordVO, {
      format: (v: string) => v.toUpperCase(),
    });
    const field = passwordField({ required: true });

    expect(field.format).toBeDefined();
    expect(field.format!('Password1')).toBe('PASSWORD1');
  });

  it('sets both parse and format', () => {
    const passwordField = createField(PasswordVO, {
      parse: (v: string) => v.trim(),
      format: (v: string) => v.toUpperCase(),
    });
    const field = passwordField({ required: true });

    expect(field.parse!('  Password1  ')).toBe('Password1');
    expect(field.format!('Password1')).toBe('PASSWORD1');
  });
});
