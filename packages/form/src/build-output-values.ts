import type { FieldSchema, AnyFieldSchema } from './types.js';
import { isArrayFieldSchema } from './types.js';

export function buildOutputValues(
  values: Record<string, unknown>,
  fields: Record<string, AnyFieldSchema>,
): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  for (const [name, fieldSchema] of Object.entries(fields)) {
    let value = values[name];

    if (isArrayFieldSchema(fieldSchema)) {
      if (!Array.isArray(value) || value.length === 0) {
        output[name] = undefined;
        continue;
      }
      if (fieldSchema.item.vo) {
        output[name] = value.map((item) => fieldSchema.item.vo!.create(item));
      } else {
        output[name] = [...value];
      }
      continue;
    }

    const fs = fieldSchema as FieldSchema<any, any, boolean, any>;
    const isEmpty = value === undefined || value === null || value === '';

    if (isEmpty) {
      output[name] = undefined;
      continue;
    }

    if (fs.vo) {
      value = fs.vo.create(value);
    }

    output[name] = value;
  }
  return output;
}
