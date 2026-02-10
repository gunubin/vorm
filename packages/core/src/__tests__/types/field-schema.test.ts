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

  it('required omitted → FieldSchema<string, Password, false> (defaults to false)', () => {
    const field = passwordField();
    expectTypeOf(field.required).toEqualTypeOf<false>();
  });
});

describe('createField (primitive) type inference', () => {
  it('createField<string>() → FieldSchema<string, string, false>', () => {
    const field = createField<string>();
    expectTypeOf(field).toMatchTypeOf<FieldSchema<string, string, false>>();
    expectTypeOf(field.required).toEqualTypeOf<false>();
  });

  it('createField<string>({ required: true }) → FieldSchema<string, string, true>', () => {
    const field = createField<string>({ required: true });
    expectTypeOf(field).toMatchTypeOf<FieldSchema<string, string, true>>();
    expectTypeOf(field.required).toEqualTypeOf<true>();
  });
});
