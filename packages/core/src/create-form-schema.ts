import type { FieldSchema, FormSchema, FormSchemaConfig, ErrorMessages, FormInputValues, FormErrors } from './types.js';

export function createFormSchema<TFields extends Record<string, FieldSchema<any, any, boolean>>>(
  config: FormSchemaConfig<TFields>,
): FormSchema<TFields> {
  return {
    fields: config.fields,
    messages: config.messages,
    resolver: config.resolver,
  };
}
