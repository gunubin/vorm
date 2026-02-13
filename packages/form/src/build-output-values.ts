import type { FieldSchema } from './types.js';

export function buildOutputValues(
  values: Record<string, unknown>,
  fields: Record<string, FieldSchema<any, any, boolean, any>>,
): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  for (const [name, fieldSchema] of Object.entries(fields)) {
    let value = values[name];
    const isEmpty = value === undefined || value === null || value === '';

    if (isEmpty) {
      output[name] = undefined;
      continue;
    }

    if (fieldSchema.vo) {
      value = fieldSchema.vo.create(value);
    }

    output[name] = value;
  }
  return output;
}
