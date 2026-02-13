import { expectTypeOf } from 'vitest';
import { z } from 'zod';
import { vo } from '@gunubin/vorm-core';
import type { ValidationRule, Brand, Infer, VODefinition } from '@gunubin/vorm-core';
import { createField, createFormSchema } from '@gunubin/vorm-form';
import type { FormOutputValues, FormInputValues } from '@gunubin/vorm-form';
import { fromZod } from '../../from-zod.js';

describe('fromZod type tests', () => {
  it('fromZod<string> → ValidationRule<string>[]', () => {
    const rules = fromZod(z.string().min(1));
    expectTypeOf(rules).toEqualTypeOf<ValidationRule<string>[]>();
  });

  it('fromZod<number> → ValidationRule<number>[]', () => {
    const rules = fromZod(z.number().min(0));
    expectTypeOf(rules).toEqualTypeOf<ValidationRule<number>[]>();
  });
});

describe('fromZod → vo() brand type flow', () => {
  const Email = vo('Email', fromZod(z.string().email()));
  const Password = vo('Password', fromZod(z.string().min(8)));

  it('fromZod → vo() → VODefinition<string, B>', () => {
    expectTypeOf(Email).toEqualTypeOf<VODefinition<string, 'Email'>>();
    expectTypeOf(Password).toEqualTypeOf<VODefinition<string, 'Password'>>();
  });

  it('create() returns Brand<string, B>', () => {
    const email = Email.create('test@example.com');
    expectTypeOf(email).toEqualTypeOf<Brand<string, 'Email'>>();
  });

  it('type can be extracted with Infer', () => {
    type EmailType = Infer<typeof Email>;
    expectTypeOf<EmailType>().toEqualTypeOf<Brand<string, 'Email'>>();
  });

  it('full form brand type flow', () => {
    const emailField = createField(Email);
    const passwordField = createField(Password);
    const schema = createFormSchema({
      fields: {
        email: emailField({ required: true }),
        password: passwordField({ required: true }),
      },
    });

    type Output = FormOutputValues<typeof schema.fields>;
    type Input = FormInputValues<typeof schema.fields>;

    expectTypeOf<Output['email']>().toEqualTypeOf<Brand<string, 'Email'>>();
    expectTypeOf<Output['password']>().toEqualTypeOf<Brand<string, 'Password'>>();
    expectTypeOf<Input['email']>().toEqualTypeOf<string>();
    expectTypeOf<Input['password']>().toEqualTypeOf<string>();
  });
});
