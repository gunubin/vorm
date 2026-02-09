import { expectTypeOf } from 'vitest';
import type { Brand } from '../../types.js';

type Email = Brand<string, 'Email'>;
type Password = Brand<string, 'Password'>;
type Age = Brand<number, 'Age'>;

describe('Brand 型', () => {
  it('Brand<string, "Email"> は string & { __brand: "Email" } である', () => {
    expectTypeOf<Email>().toEqualTypeOf<string & { readonly __brand: 'Email' }>();
  });

  it('異なるブランド型は互いに代入不可', () => {
    expectTypeOf<Email>().not.toEqualTypeOf<Password>();
    expectTypeOf<Password>().not.toEqualTypeOf<Email>();
  });

  it('ブランド型は基底型に代入可能', () => {
    expectTypeOf<Email>().toMatchTypeOf<string>();
    expectTypeOf<Age>().toMatchTypeOf<number>();
  });

  it('基底型はブランド型に代入不可', () => {
    expectTypeOf<string>().not.toMatchTypeOf<Email>();
    expectTypeOf<number>().not.toMatchTypeOf<Age>();
  });
});
