import type { VOLike, FieldSchema, ErrorMessages, ValidationRule } from './types.js';

export function createField<TInput, TOutput, TCodes extends string>(
  vo: VOLike<TInput, TOutput, TCodes>,
): {
  (config: { required: true; messages?: ErrorMessages<TCodes | 'REQUIRED'> }): FieldSchema<TInput, TOutput, true, TCodes>;
  (config?: { required?: false; messages?: ErrorMessages<TCodes> }): FieldSchema<TInput, TOutput, false, TCodes>;
};
export function createField<T, TCodes extends string = string>(config: { required: true; rules?: ValidationRule<T, TCodes>[]; messages?: ErrorMessages<TCodes | 'REQUIRED'> }): FieldSchema<T, T, true, TCodes>;
export function createField<T, TCodes extends string = string>(config?: { required?: false; rules?: ValidationRule<T, TCodes>[]; messages?: ErrorMessages<TCodes> }): FieldSchema<T, T, false, TCodes>;
export function createField<T, TOutput, TCodes extends string>(
  voOrConfig?: VOLike<T, TOutput, TCodes> | { required?: boolean; rules?: ValidationRule<T, TCodes>[]; messages?: ErrorMessages<TCodes> },
): any {
  if (voOrConfig && 'rules' in voOrConfig && 'create' in voOrConfig && typeof (voOrConfig as any).create === 'function') {
    const voDef = voOrConfig as VOLike<T, TOutput, TCodes>;
    function factory(config: { required: true; messages?: ErrorMessages<TCodes | 'REQUIRED'> }): FieldSchema<T, TOutput, true, TCodes>;
    function factory(config?: { required?: false; messages?: ErrorMessages<TCodes> }): FieldSchema<T, TOutput, false, TCodes>;
    function factory(config: { required?: boolean; messages?: ErrorMessages<any> } = {}): FieldSchema<T, TOutput, boolean, TCodes> {
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

  const config = (voOrConfig ?? {}) as { required?: boolean; rules?: ValidationRule<T, TCodes>[]; messages?: ErrorMessages<TCodes> };
  return {
    vo: null,
    required: (config.required ?? false) as any,
    messages: config.messages ?? {},
    rules: config.rules ?? [],
  };
}
