import { expectTypeOf } from 'vitest';
import type { Brand } from '../../types.js';

type Email = Brand<string, 'Email'>;
type Password = Brand<string, 'Password'>;
type Age = Brand<number, 'Age'>;

describe('Brand type', () => {
  it('Brand<string, "Email"> is string & { __brand: "Email" }', () => {
    expectTypeOf<Email>().toEqualTypeOf<string & { readonly __brand: 'Email' }>();
  });

  it('different brand types are not assignable to each other', () => {
    expectTypeOf<Email>().not.toEqualTypeOf<Password>();
    expectTypeOf<Password>().not.toEqualTypeOf<Email>();
  });

  it('branded types are assignable to base type', () => {
    expectTypeOf<Email>().toMatchTypeOf<string>();
    expectTypeOf<Age>().toMatchTypeOf<number>();
  });

  it('base types are not assignable to branded type', () => {
    expectTypeOf<string>().not.toMatchTypeOf<Email>();
    expectTypeOf<number>().not.toMatchTypeOf<Age>();
  });
});
