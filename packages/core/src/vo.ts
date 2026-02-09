import type { Brand, ValidationRule, VODefinition } from './types.js';

export function vo<T, B extends string = string>(
  brand: B,
  rules: ValidationRule<T>[],
): VODefinition<T, B> {
  return {
    brand,
    rules,
    parse: (input: T) => input as Brand<T, B>,
  };
}
