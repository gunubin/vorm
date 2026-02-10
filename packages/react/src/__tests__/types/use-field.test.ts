import { expectTypeOf } from 'vitest';
import { vo, createField, createFormSchema } from '@gunubin/vorm-core';
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

describe('useField type tests', () => {
  it('value type is the field input type (not branded)', () => {
    type EmailFieldState = ReturnType<typeof useField<SchemaFields, 'email'>>;
    expectTypeOf<EmailFieldState['value']>().toEqualTypeOf<string>();
  });

  it('name parameter is constrained to schema field names', () => {
    type AllowedNames = string & keyof SchemaFields;
    expectTypeOf<AllowedNames>().toEqualTypeOf<'email' | 'name'>();
  });

  it('onChange receives string', () => {
    type EmailFieldState = ReturnType<typeof useField<SchemaFields, 'email'>>;
    expectTypeOf<EmailFieldState['onChange']>().toEqualTypeOf<(raw: string) => void>();
  });

  it('formattedValue is string', () => {
    type EmailFieldState = ReturnType<typeof useField<SchemaFields, 'email'>>;
    expectTypeOf<EmailFieldState['formattedValue']>().toEqualTypeOf<string>();
  });
});
