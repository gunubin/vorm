import { expectTypeOf } from 'vitest';
import { vo } from '../../vo.js';
import { createField } from '../../create-field.js';
import type { Brand, FieldSchema } from '../../types.js';

type Password = Brand<string, 'Password'>;

const PasswordVO = vo('Password', [
  { code: 'TOO_SHORT', validate: (v: string) => v.length >= 8 },
]);

describe('createField (VO) type inference', () => {
  const passwordField = createField(PasswordVO);

  it('required: true yields FieldSchema<string, Password, true>', () => {
    const field = passwordField({ required: true });
    expectTypeOf(field.required).toEqualTypeOf<true>();
    expectTypeOf(field).toMatchTypeOf<FieldSchema<string, Password, true, 'TOO_SHORT'>>();
  });

  it('required: false yields FieldSchema<string, Password, false>', () => {
    const field = passwordField({ required: false });
    expectTypeOf(field.required).toEqualTypeOf<false>();
    expectTypeOf(field).toMatchTypeOf<FieldSchema<string, Password, false, 'TOO_SHORT'>>();
  });

  it('no arguments defaults to FieldSchema<string, Password, false>', () => {
    const field = passwordField();
    expectTypeOf(field.required).toEqualTypeOf<false>();
  });
});

describe('createField (primitive) type inference', () => {
  it('createField<string>()() yields FieldSchema<string, string, false>', () => {
    const field = createField<string>()();
    expectTypeOf(field).toMatchTypeOf<FieldSchema<string, string, false>>();
    expectTypeOf(field.required).toEqualTypeOf<false>();
  });

  it('createField<string>()({ required: true }) yields FieldSchema<string, string, true>', () => {
    const field = createField<string>()({ required: true });
    expectTypeOf(field).toMatchTypeOf<FieldSchema<string, string, true>>();
    expectTypeOf(field.required).toEqualTypeOf<true>();
  });

  it('createField returns a factory function', () => {
    const factory = createField<string>();
    expectTypeOf(factory).toBeFunction();
  });
});

describe('parse/format type inference', () => {
  it('parse type: (raw: string) => T', () => {
    const field = createField<number>({
      parse: (v: string) => Number(v),
      format: (v: number) => String(v),
    })({ required: true });

    expectTypeOf(field.parse).toEqualTypeOf<((raw: string) => number) | undefined>();
    expectTypeOf(field.format).toEqualTypeOf<((value: number) => string) | undefined>();
  });

  it('VO + parse/format', () => {
    const PriceVO = vo('Price', [
      { code: 'POSITIVE', validate: (v: number) => v > 0 },
    ]);

    const field = createField(PriceVO, {
      parse: (v: string) => Number(v),
      format: (v: number) => String(v),
    })({ required: true });

    expectTypeOf(field.parse).toEqualTypeOf<((raw: string) => number) | undefined>();
    expectTypeOf(field.format).toEqualTypeOf<((value: number) => string) | undefined>();
  });
});
