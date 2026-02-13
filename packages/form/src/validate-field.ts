import type { FieldSchema, FieldError, ErrorMessages } from './types.js';
import { resolveMessage } from './resolve-message.js';

export function validateField<T>(
  value: T | undefined | null,
  fieldSchema: FieldSchema<T, any, boolean, any>,
  formMessages?: ErrorMessages,
): FieldError | null {
  if (fieldSchema.required) {
    if (value === undefined || value === null || value === '') {
      const code = 'REQUIRED';
      const message = resolveMessage(code, formMessages, fieldSchema.messages);
      return { code, message };
    }
  } else {
    if (value === undefined || value === null || value === '') {
      return null;
    }
  }

  for (const rule of fieldSchema.rules) {
    if (!rule.validate(value as T)) {
      const message = resolveMessage(rule.code, formMessages, fieldSchema.messages);
      return { code: rule.code, message };
    }
  }

  return null;
}
