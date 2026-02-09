import type { VOLike, FieldSchema, ErrorMessages, ValidationRule } from './types.js';

export function createField<TInput, TOutput>(
  vo: VOLike<TInput, TOutput>,
): {
  (config: { required: true; messages?: ErrorMessages }): FieldSchema<TInput, TOutput, true>;
  (config?: { required?: false; messages?: ErrorMessages }): FieldSchema<TInput, TOutput, false>;
};
export function createField<T>(config: { required: true; rules?: ValidationRule<T>[]; messages?: ErrorMessages }): FieldSchema<T, T, true>;
export function createField<T>(config?: { required?: false; rules?: ValidationRule<T>[]; messages?: ErrorMessages }): FieldSchema<T, T, false>;
export function createField<T, TOutput>(
  voOrConfig?: VOLike<T, TOutput> | { required?: boolean; rules?: ValidationRule<T>[]; messages?: ErrorMessages },
): any {
  if (voOrConfig && 'rules' in voOrConfig && 'create' in voOrConfig && typeof (voOrConfig as any).create === 'function') {
    const voDef = voOrConfig as VOLike<T, TOutput>;
    function factory(config: { required: true; messages?: ErrorMessages }): FieldSchema<T, TOutput, true>;
    function factory(config?: { required?: false; messages?: ErrorMessages }): FieldSchema<T, TOutput, false>;
    function factory(config: { required?: boolean; messages?: ErrorMessages } = {}): FieldSchema<T, TOutput, boolean> {
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
