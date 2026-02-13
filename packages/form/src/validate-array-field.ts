import type { ArrayFieldSchema, FieldError, ErrorMessages } from './types.js';
import { validateField } from './validate-field.js';
import { resolveMessage } from './resolve-message.js';

export function validateArrayField(
  value: unknown[] | undefined | null,
  schema: ArrayFieldSchema<any, any, boolean, any>,
  formMessages?: ErrorMessages,
): Record<string, FieldError> {
  const errors: Record<string, FieldError> = {};

  if (schema.required) {
    if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
      const code = 'REQUIRED';
      const message = resolveMessage(code, formMessages, schema.messages);
      errors[''] = { code, message };
      return errors;
    }
  } else {
    if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
      return errors;
    }
  }

  if (schema.minLength !== undefined && value!.length < schema.minLength) {
    const code = 'MIN_LENGTH';
    const message = resolveMessage(code, formMessages, schema.messages);
    errors[''] = { code, message };
    return errors;
  }

  if (schema.maxLength !== undefined && value!.length > schema.maxLength) {
    const code = 'MAX_LENGTH';
    const message = resolveMessage(code, formMessages, schema.messages);
    errors[''] = { code, message };
    return errors;
  }

  for (let i = 0; i < value!.length; i++) {
    const itemError = validateField(value![i], schema.item, formMessages);
    if (itemError) {
      errors[`[${i}]`] = itemError;
    }
  }

  return errors;
}
