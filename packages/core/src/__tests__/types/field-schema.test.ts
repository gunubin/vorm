import { expectTypeOf } from 'vitest';
import { vo } from '../../vo.js';
import { createField } from '../../create-field.js';
import type { Brand, FieldSchema } from '../../types.js';

type Password = Brand<string, 'Password'>;

const PasswordVO = vo('Password', [
  { code: 'TOO_SHORT', validate: (v: string) => v.length >= 8 },
]);

describe('createField (VO) 型推論', () => {
  const passwordField = createField(PasswordVO);

  it('required: true → FieldSchema<string, Password, true>', () => {
    const field = passwordField({ required: true });
    expectTypeOf(field.required).toEqualTypeOf<true>();
    expectTypeOf(field).toMatchTypeOf<FieldSchema<string, Password, true, 'TOO_SHORT'>>();
  });

  it('required: false → FieldSchema<string, Password, false>', () => {
    const field = passwordField({ required: false });
    expectTypeOf(field.required).toEqualTypeOf<false>();
    expectTypeOf(field).toMatchTypeOf<FieldSchema<string, Password, false, 'TOO_SHORT'>>();
  });

  it('引数省略 → FieldSchema<string, Password, false> (デフォルト false)', () => {
    const field = passwordField();
    expectTypeOf(field.required).toEqualTypeOf<false>();
  });
});

describe('createField (primitive) 型推論', () => {
  it('createField<string>()() → FieldSchema<string, string, false>', () => {
    const field = createField<string>()();
    expectTypeOf(field).toMatchTypeOf<FieldSchema<string, string, false>>();
    expectTypeOf(field.required).toEqualTypeOf<false>();
  });

  it('createField<string>()({ required: true }) → FieldSchema<string, string, true>', () => {
    const field = createField<string>()({ required: true });
    expectTypeOf(field).toMatchTypeOf<FieldSchema<string, string, true>>();
    expectTypeOf(field.required).toEqualTypeOf<true>();
  });

  it('createField はファクトリ関数を返す', () => {
    const factory = createField<string>();
    expectTypeOf(factory).toBeFunction();
  });
});

describe('parse/format 型推論', () => {
  it('parse の型: (raw: string) => T', () => {
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
