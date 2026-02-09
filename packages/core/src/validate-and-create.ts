import type { CreateResult } from './types.js';
import { VOValidationError } from './vo.js';

export function validateAndCreate<T>(
  value: T,
  rules: readonly { code: string; validate: (value: T) => boolean }[],
  name: string,
): T {
  for (const rule of rules) {
    if (!rule.validate(value)) {
      throw new VOValidationError(name, rule.code, value);
    }
  }
  return value;
}

export function safeValidateAndCreate<T>(
  value: T,
  rules: readonly { code: string; validate: (value: T) => boolean }[],
): CreateResult<T> {
  for (const rule of rules) {
    if (!rule.validate(value)) {
      return { success: false, error: { code: rule.code } };
    }
  }
  return { success: true, data: value };
}
