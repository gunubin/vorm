import type { VOLike, ValidationRule } from '@gunubin/vorm-core';
import type { ArrayFieldSchema, FieldSchema, ErrorMessages } from './types.js';

type ArrayFieldFactory<TInput, TOutput, TCodes extends string> = {
  (config: {
    required: true;
    minLength?: number;
    maxLength?: number;
    messages?: ErrorMessages<TCodes | 'REQUIRED' | 'MIN_LENGTH' | 'MAX_LENGTH'>;
  }): ArrayFieldSchema<TInput, TOutput, true, TCodes>;
  (config?: {
    required?: false;
    minLength?: number;
    maxLength?: number;
    messages?: ErrorMessages<TCodes | 'MIN_LENGTH' | 'MAX_LENGTH'>;
  }): ArrayFieldSchema<TInput, TOutput, false, TCodes>;
};

export function createArrayField<TInput, TOutput, TCodes extends string>(
  vo: VOLike<TInput, TOutput, TCodes>,
  options?: { messages?: ErrorMessages<TCodes> },
): ArrayFieldFactory<TInput, TOutput, TCodes>;
export function createArrayField<T, TOut = T, TCodes extends string = string>(
  config?: { rules?: ValidationRule<T, TCodes>[]; messages?: ErrorMessages<TCodes> },
): ArrayFieldFactory<T, TOut, TCodes>;
export function createArrayField(
  voOrConfig?: any,
  options?: any,
): any {
  if (voOrConfig && 'create' in voOrConfig && typeof voOrConfig.create === 'function') {
    const voDef = voOrConfig;
    const definitionMessages = options?.messages;

    function factory(config: any = {}): any {
      return {
        __array: true,
        item: {
          vo: voDef,
          required: true,
          messages: mergeMessages(definitionMessages, config.messages),
          rules: [...voDef.rules],
        } as FieldSchema<any, any, true, any>,
        required: config.required ?? false,
        minLength: config.minLength,
        maxLength: config.maxLength,
        messages: mergeMessages(definitionMessages, config.messages),
      };
    }
    return factory;
  }

  const config = voOrConfig ?? {};
  const definitionMessages = config.messages;
  const definitionRules = config.rules ?? [];

  function factory(factoryConfig: any = {}): any {
    return {
      __array: true,
      item: {
        vo: null,
        required: true,
        messages: mergeMessages(definitionMessages, factoryConfig.messages),
        rules: [...definitionRules],
      } as FieldSchema<any, any, true, any>,
      required: factoryConfig.required ?? false,
      minLength: factoryConfig.minLength,
      maxLength: factoryConfig.maxLength,
      messages: mergeMessages(definitionMessages, factoryConfig.messages),
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
