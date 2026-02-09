import type { Brand, ValidationRule, VODefinition, CreateResult } from './types.js';

export class VOValidationError extends Error {
  constructor(
    public readonly brand: string,
    public readonly code: string,
    public readonly input: unknown,
  ) {
    super(`${brand} is not valid (${code})`);
    this.name = 'VOValidationError';
  }
}

export function vo<B extends string, T = string>(
  brand: B,
  rules: ValidationRule<T>[],
): VODefinition<T, B> {
  return {
    brand,
    rules,
    create(input: T): Brand<T, B> {
      for (const rule of rules) {
        if (!rule.validate(input)) {
          throw new VOValidationError(brand, rule.code, input);
        }
      }
      return input as Brand<T, B>;
    },
    safeCreate(input: T): CreateResult<Brand<T, B>> {
      for (const rule of rules) {
        if (!rule.validate(input)) {
          return { success: false, error: { code: rule.code } };
        }
      }
      return { success: true, data: input as Brand<T, B> };
    },
  };
}
