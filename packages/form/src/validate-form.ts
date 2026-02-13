import type { FormSchema, FieldSchema, FormErrors, FormInputValues } from './types.js';
import { validateField } from './validate-field.js';

export function validateForm<TFields extends Record<string, FieldSchema<any, any, boolean, any>>>(
  values: FormInputValues<TFields>,
  schema: FormSchema<TFields>,
): FormErrors {
  const errors: FormErrors = {};

  for (const [name, fieldSchema] of Object.entries(schema.fields)) {
    const value = (values as Record<string, unknown>)[name];
    const formMessages = schema.messages?.[name];
    const error = validateField(value, fieldSchema as FieldSchema<any, any, boolean, any>, formMessages);
    if (error) {
      errors[name] = error;
    }
  }

  if (Object.keys(errors).length > 0) {
    return errors;
  }

  if (schema.resolver) {
    const resolverErrors = schema.resolver(values);
    if (resolverErrors) {
      return { ...errors, ...resolverErrors };
    }
  }

  return errors;
}
