import type { ValidationRule } from './types.js';

type RuleCreator<T, O, C extends string = string> = O extends void
  ? () => ValidationRule<T, C>
  : (option: O) => ValidationRule<T, C>;

export function createRule<T, O = void, C extends string = string>(
  code: C,
  validate: (value: T, option: O) => boolean,
): RuleCreator<T, O, C> {
  return ((option: O) => ({
    code,
    validate: (value: T) => validate(value, option),
  })) as RuleCreator<T, O, C>;
}
