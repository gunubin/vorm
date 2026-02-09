import type { ValidationRule } from './types.js';

type RuleCreator<T, O> = O extends void
  ? () => ValidationRule<T>
  : (option: O) => ValidationRule<T>;

export function createRule<T, O = void>(
  code: string,
  validate: (value: T, option: O) => boolean,
): RuleCreator<T, O> {
  return ((option: O) => ({
    code,
    validate: (value: T) => validate(value, option),
  })) as RuleCreator<T, O>;
}
