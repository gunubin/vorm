import { expectTypeOf } from 'vitest';
import { vo, createField, createFormSchema } from '@vorm/core';
import { useField } from '../../use-field.js';
import type { FormState } from '../../use-form.js';

const EmailVO = vo('Email', [
  { code: 'INVALID_FORMAT', validate: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) },
]);

const emailField = createField(EmailVO);

const schema = createFormSchema({
  fields: {
    email: emailField({ required: true }),
    name: createField<string>()({ required: true }),
  },
});

type SchemaFields = typeof schema.fields;

describe('useField 型テスト', () => {
  it('value の型はフィールドの入力型（branded ではない）', () => {
    type EmailFieldState = ReturnType<typeof useField<SchemaFields, 'email'>>;
    expectTypeOf<EmailFieldState['value']>().toEqualTypeOf<string>();
  });

  it('name パラメータはスキーマのフィールド名に制約される', () => {
    type AllowedNames = string & keyof SchemaFields;
    expectTypeOf<AllowedNames>().toEqualTypeOf<'email' | 'name'>();
  });

  it('onChange は string を受け取る', () => {
    type EmailFieldState = ReturnType<typeof useField<SchemaFields, 'email'>>;
    expectTypeOf<EmailFieldState['onChange']>().toEqualTypeOf<(raw: string) => void>();
  });

  it('formattedValue は string', () => {
    type EmailFieldState = ReturnType<typeof useField<SchemaFields, 'email'>>;
    expectTypeOf<EmailFieldState['formattedValue']>().toEqualTypeOf<string>();
  });
});
