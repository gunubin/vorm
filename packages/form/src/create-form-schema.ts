import type { FieldSchema, FormSchema, FormSchemaConfig } from './types.js';

export function createFormSchema<TFields extends Record<string, FieldSchema<any, any, boolean, any>>>(
  config: FormSchemaConfig<TFields>,
): FormSchema<TFields> {
  return {
    fields: config.fields,
    messages: config.messages,
    resolver: config.resolver,
  };
}
