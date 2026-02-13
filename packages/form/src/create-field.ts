import type { VOLike, ValidationRule } from '@gunubin/vorm-core';
import type { FieldSchema, ErrorMessages } from './types.js';

type FieldFactory<TInput, TOutput, TCodes extends string> = {
  (config: { required: true; messages?: ErrorMessages<TCodes | 'REQUIRED'> }): FieldSchema<TInput, TOutput, true, TCodes>;
  (config?: { required?: false; messages?: ErrorMessages<TCodes> }): FieldSchema<TInput, TOutput, false, TCodes>;
};

export function createField<TInput, TOutput, TCodes extends string>(
  vo: VOLike<TInput, TOutput, TCodes>,
  options?: { messages?: ErrorMessages<TCodes>; parse?: (raw: string) => TInput; format?: (value: TInput) => string },
): FieldFactory<TInput, TOutput, TCodes>;
export function createField<T, TOut = T, TCodes extends string = string>(
  config?: { rules?: ValidationRule<T, TCodes>[]; messages?: ErrorMessages<TCodes>; parse?: (raw: string) => T; format?: (value: T) => string },
): FieldFactory<T, TOut, TCodes>;
export function createField(
  voOrConfig?: any,
  options?: any,
): any {
  if (voOrConfig && 'create' in voOrConfig && typeof voOrConfig.create === 'function') {
    const voDef = voOrConfig;
    const definitionMessages = options?.messages;
    const parse = options?.parse;
    const format = options?.format;

    function factory(config: any = {}): any {
      return {
        vo: voDef,
        required: config.required ?? false,
        messages: mergeMessages(definitionMessages, config.messages),
        rules: [...voDef.rules],
        parse,
        format,
      };
    }
    return factory;
  }

  const config = voOrConfig ?? {};
  const definitionMessages = config.messages;
  const definitionRules = config.rules ?? [];
  const parse = config.parse;
  const format = config.format;

  function factory(factoryConfig: any = {}): any {
    return {
      vo: null,
      required: factoryConfig.required ?? false,
      messages: mergeMessages(definitionMessages, factoryConfig.messages),
      rules: [...definitionRules],
      parse,
      format,
    };
  }
  return factory;
}

function mergeMessages(
  definition: ErrorMessages<any> | undefined,
  factory: ErrorMessages<any> | undefined,
): ErrorMessages<any> {
  if (!definition && !factory) return {};
  if (!definition) return factory!;
  if (!factory) return definition;
  if (typeof factory === 'function') return factory;
  if (typeof definition === 'function') return factory;
  return { ...definition, ...factory };
}
