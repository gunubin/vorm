import { expectTypeOf } from 'vitest';
import { vo, createRule, toStandardSchema } from '../../index.js';
import type { Brand, StandardSchemaV1 } from '../../index.js';

const strRule = createRule<string>('STR', (v) => v.length > 0);
const numRule = createRule<number, number>('NUM', (v, min) => v >= min);

describe('toStandardSchema type conformance', () => {
  it('returns StandardSchemaV1<TInput, Brand<TInput, TBrand>>', () => {
    const Email = vo('Email', [strRule()]);
    const schema = toStandardSchema(Email);
    expectTypeOf(schema).toEqualTypeOf<StandardSchemaV1<string, Brand<string, 'Email'>>>();
  });

  it('works with number VOs', () => {
    const Age = vo('Age', [numRule(0)]);
    const schema = toStandardSchema(Age);
    expectTypeOf(schema).toEqualTypeOf<StandardSchemaV1<number, Brand<number, 'Age'>>>();
  });

  it('InferInput extracts TInput', () => {
    const Email = vo('Email', [strRule()]);
    const schema = toStandardSchema(Email);
    type Input = StandardSchemaV1.InferInput<typeof schema>;
    expectTypeOf<Input>().toEqualTypeOf<string | undefined>();
  });

  it('InferOutput extracts Brand<TInput, TBrand>', () => {
    const Email = vo('Email', [strRule()]);
    const schema = toStandardSchema(Email);
    type Output = StandardSchemaV1.InferOutput<typeof schema>;
    expectTypeOf<Output>().toEqualTypeOf<Brand<string, 'Email'> | undefined>();
  });

  it('validate accepts unknown input', () => {
    const Email = vo('Email', [strRule()]);
    const schema = toStandardSchema(Email);
    expectTypeOf(schema['~standard'].validate).parameter(0).toEqualTypeOf<unknown>();
  });

  it('validate returns Result<Brand<TInput, TBrand>>', () => {
    const Email = vo('Email', [strRule()]);
    const schema = toStandardSchema(Email);
    type ValidateReturn = globalThis.ReturnType<typeof schema['~standard']['validate']>;
    expectTypeOf<Awaited<ValidateReturn>>().toEqualTypeOf<
      StandardSchemaV1.Result<Brand<string, 'Email'>>
    >();
  });
});
