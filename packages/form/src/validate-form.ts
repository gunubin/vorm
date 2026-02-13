import type { FormSchema, FieldSchema, FormErrors, FormInputValues, AnyFieldSchema } from './types.js';
import { isArrayFieldSchema } from './types.js';
import { validateField } from './validate-field.js';
import { validateArrayField } from './validate-array-field.js';

export function validateForm<TFields extends Record<string, AnyFieldSchema>>(
  values: FormInputValues<TFields>,
  schema: FormSchema<TFields>,
): FormErrors {
  const errors: FormErrors = {};

  for (const [name, fieldSchema] of Object.entries(schema.fields)) {
    const value = (values as Record<string, unknown>)[name];
    const formMessages = schema.messages?.[name];

    if (isArrayFieldSchema(fieldSchema)) {
      const arrayErrors = validateArrayField(value as unknown[] | undefined | null, fieldSchema, formMessages);
      for (const [suffix, error] of Object.entries(arrayErrors)) {
        const key = suffix === '' ? name : `${name}${suffix}`;
        errors[key] = error;
      }
    } else {
      const error = validateField(value, fieldSchema as FieldSchema<any, any, boolean, any>, formMessages);
      if (error) {
        errors[name] = error;
      }
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
