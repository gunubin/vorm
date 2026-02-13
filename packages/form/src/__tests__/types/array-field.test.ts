import { expectTypeOf } from 'vitest';
import { vo } from '@gunubin/vorm-core';
import type { Brand } from '@gunubin/vorm-core';
import { createField } from '../../create-field.js';
import { createArrayField } from '../../create-array-field.js';
import { createFormSchema } from '../../create-form-schema.js';
import type { FormInputValues, FormOutputValues } from '../../types.js';

type Tag = Brand<string, 'Tag'>;

const TagVO = vo('Tag', [
  { code: 'TOO_SHORT', validate: (v: string) => v.length >= 2 },
]);

const tagArray = createArrayField(TagVO);
const primitiveArray = createArrayField<string>();

const schema = createFormSchema({
  fields: {
    name: createField<string>()({ required: true }),
    tags: tagArray({ required: true, minLength: 1 }),
    optionalTags: tagArray(),
    labels: primitiveArray({ required: true }),
    optionalLabels: primitiveArray(),
  },
});

describe('FormInputValues with ArrayFieldSchema', () => {
  it('required array field resolves to T[]', () => {
    type Input = FormInputValues<typeof schema.fields>;
    expectTypeOf<Input['tags']>().toEqualTypeOf<string[]>();
  });

  it('optional array field resolves to T[] | undefined', () => {
    type Input = FormInputValues<typeof schema.fields>;
    expectTypeOf<Input['optionalTags']>().toEqualTypeOf<string[] | undefined>();
  });

  it('primitive required array resolves to T[]', () => {
    type Input = FormInputValues<typeof schema.fields>;
    expectTypeOf<Input['labels']>().toEqualTypeOf<string[]>();
  });

  it('primitive optional array resolves to T[] | undefined', () => {
    type Input = FormInputValues<typeof schema.fields>;
    expectTypeOf<Input['optionalLabels']>().toEqualTypeOf<string[] | undefined>();
  });

  it('scalar field is unaffected', () => {
    type Input = FormInputValues<typeof schema.fields>;
    expectTypeOf<Input['name']>().toEqualTypeOf<string>();
  });
});

describe('FormOutputValues with ArrayFieldSchema', () => {
  it('required VO array field resolves to Brand[]', () => {
    type Output = FormOutputValues<typeof schema.fields>;
    expectTypeOf<Output['tags']>().toEqualTypeOf<Tag[]>();
  });

  it('optional VO array field resolves to Brand[] | undefined', () => {
    type Output = FormOutputValues<typeof schema.fields>;
    expectTypeOf<Output['optionalTags']>().toEqualTypeOf<Tag[] | undefined>();
  });

  it('primitive required array resolves to T[]', () => {
    type Output = FormOutputValues<typeof schema.fields>;
    expectTypeOf<Output['labels']>().toEqualTypeOf<string[]>();
  });

  it('primitive optional array resolves to T[] | undefined', () => {
    type Output = FormOutputValues<typeof schema.fields>;
    expectTypeOf<Output['optionalLabels']>().toEqualTypeOf<string[] | undefined>();
  });

  it('scalar field is unaffected', () => {
    type Output = FormOutputValues<typeof schema.fields>;
    expectTypeOf<Output['name']>().toEqualTypeOf<string>();
  });
});
