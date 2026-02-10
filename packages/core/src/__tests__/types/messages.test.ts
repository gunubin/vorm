import { expectTypeOf } from 'vitest';
import { vo, createRule, createField } from '../../index.js';
import type { VODefinition, ErrorMessageMap, FieldSchema, Brand } from '../../index.js';

// =============================================
// createRule: code literal inference
// =============================================
describe('createRule code literal inference', () => {
  it('infers literal code when type params are not explicit', () => {
    const rule = createRule('INVALID_FORMAT', (v: string) => v.length > 0);
    expectTypeOf(rule).returns.toMatchTypeOf<{ code: 'INVALID_FORMAT' }>();
  });

  it('falls back to string when T is explicitly specified', () => {
    const rule = createRule<string>('INVALID_FORMAT', (v) => v.length > 0);
    expectTypeOf(rule).returns.toMatchTypeOf<{ code: string }>();
  });
});

// =============================================
// vo(): codes inference from rules
// =============================================
describe('vo() codes inference', () => {
  it('infers single code from inline rule', () => {
    const Email = vo('Email', [
      { code: 'INVALID_FORMAT', validate: (v: string) => v.includes('@') },
    ]);
    expectTypeOf(Email).toEqualTypeOf<VODefinition<string, 'Email', 'INVALID_FORMAT'>>();
  });

  it('infers union of codes from multiple inline rules', () => {
    const Password = vo('Password', [
      { code: 'TOO_SHORT', validate: (v: string) => v.length >= 8 },
      { code: 'NO_UPPERCASE', validate: (v: string) => /[A-Z]/.test(v) },
    ]);
    expectTypeOf(Password).toEqualTypeOf<VODefinition<string, 'Password', 'TOO_SHORT' | 'NO_UPPERCASE'>>();
  });

  it('falls back to string when using createRule<T>', () => {
    const strRule = createRule<string>('STR', (v) => v.length > 0);
    const Name = vo('Name', [strRule()]);
    expectTypeOf(Name).toEqualTypeOf<VODefinition<string, 'Name'>>();
  });
});

// =============================================
// ErrorMessageMap<C>
// =============================================
describe('ErrorMessageMap<C>', () => {
  it('allows partial keys', () => {
    const map: ErrorMessageMap<'FOO' | 'BAR'> = { FOO: 'foo error' };
    expectTypeOf(map).toEqualTypeOf<{ FOO?: string; BAR?: string }>();
  });

  it('ErrorMessageMap<string> is { [K in string]?: string }', () => {
    const map: ErrorMessageMap = { anything: 'ok' };
    expectTypeOf(map).toEqualTypeOf<{ [K in string]?: string }>();
  });
});

// =============================================
// createField(VO) factory: messages type constraint
// =============================================
describe('createField(VO) messages type constraint', () => {
  const PasswordVO = vo('Password', [
    { code: 'TOO_SHORT', validate: (v: string) => v.length >= 8 },
  ]);
  const passwordField = createField(PasswordVO);

  it('accepts valid code in messages (required: true)', () => {
    const field = passwordField({
      required: true,
      messages: { TOO_SHORT: 'Too short', REQUIRED: 'Required' },
    });
    expectTypeOf(field).toMatchTypeOf<FieldSchema<string, Brand<string, 'Password'>, true, 'TOO_SHORT'>>();
  });

  it('accepts valid code in messages (required: false)', () => {
    const field = passwordField({
      required: false,
      messages: { TOO_SHORT: 'Too short' },
    });
    expectTypeOf(field).toMatchTypeOf<FieldSchema<string, Brand<string, 'Password'>, false, 'TOO_SHORT'>>();
  });

  it('rejects invalid code in messages (required: true)', () => {
    passwordField({
      required: true,
      // @ts-expect-error TYPO is not a valid code
      messages: { TYPO: 'invalid' },
    });
  });

  it('rejects invalid code in messages (required: false)', () => {
    passwordField({
      // @ts-expect-error TYPO is not a valid code
      messages: { TYPO: 'invalid' },
    });
  });

  it('REQUIRED is not allowed when required: false', () => {
    // @ts-expect-error REQUIRED not valid without required: true
    passwordField({ required: false, messages: { REQUIRED: 'nope' } });
  });

  it('allows partial messages (some codes omitted)', () => {
    const MultiVO = vo('Multi', [
      { code: 'A', validate: (v: string) => true },
      { code: 'B', validate: (v: string) => true },
    ]);
    const multiField = createField(MultiVO);
    // Only providing one of two codes — should be valid
    const field = multiField({ required: true, messages: { A: 'a error' } });
    expectTypeOf(field).toMatchTypeOf<FieldSchema<string, Brand<string, 'Multi'>, true, 'A' | 'B'>>();
  });

  it('accepts ErrorMessageFn with correct code type', () => {
    const field = passwordField({
      required: true,
      messages: (error) => {
        expectTypeOf(error.code).toEqualTypeOf<'TOO_SHORT' | 'REQUIRED'>();
        return 'error';
      },
    });
    expectTypeOf(field).toMatchTypeOf<FieldSchema<string, Brand<string, 'Password'>, true, 'TOO_SHORT'>>();
  });
});
