import type { Brand, VODefinition, FieldSchema, ErrorMessages, ValidationRule } from './types.js';

export function createField<TInput, TBrand extends string>(
  vo: VODefinition<TInput, TBrand>,
): {
  (config: { required: true; messages?: ErrorMessages }): FieldSchema<TInput, Brand<TInput, TBrand>, true>;
  (config?: { required?: false; messages?: ErrorMessages }): FieldSchema<TInput, Brand<TInput, TBrand>, false>;
};
export function createField<T>(config: { required: true; rules?: ValidationRule<T>[]; messages?: ErrorMessages }): FieldSchema<T, T, true>;
export function createField<T>(config?: { required?: false; rules?: ValidationRule<T>[]; messages?: ErrorMessages }): FieldSchema<T, T, false>;
export function createField<T, TBrand extends string>(
  voOrConfig?: VODefinition<T, TBrand> | { required?: boolean; rules?: ValidationRule<T>[]; messages?: ErrorMessages },
): any {
  if (voOrConfig && 'brand' in voOrConfig && 'parse' in voOrConfig) {
    const voDef = voOrConfig as VODefinition<T, TBrand>;
    function factory(config: { required: true; messages?: ErrorMessages }): FieldSchema<T, Brand<T, TBrand>, true>;
    function factory(config?: { required?: false; messages?: ErrorMessages }): FieldSchema<T, Brand<T, TBrand>, false>;
    function factory(config: { required?: boolean; messages?: ErrorMessages } = {}): FieldSchema<T, Brand<T, TBrand>, boolean> {
      const required = config.required ?? false;
      return {
        vo: voDef,
        required: required as any,
        messages: config.messages ?? {},
        rules: [...voDef.rules],
      };
    }
    return factory;
  }

  const config = (voOrConfig ?? {}) as { required?: boolean; rules?: ValidationRule<T>[]; messages?: ErrorMessages };
  return {
    vo: null,
    required: (config.required ?? false) as any,
    messages: config.messages ?? {},
    rules: config.rules ?? [],
  };
}
