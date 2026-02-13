import type { Brand, VODefinition } from './types.js';

// Standard Schema v1 interface (inlined to maintain zero-dependency)
// See: https://github.com/standard-schema/standard-schema

export interface StandardSchemaV1<Input = unknown, Output = Input> {
  readonly '~standard': StandardSchemaV1.Props<Input, Output>;
}

export declare namespace StandardSchemaV1 {
  interface Props<Input = unknown, Output = Input> {
    readonly version: 1;
    readonly vendor: string;
    readonly validate: (
      value: unknown,
    ) => Result<Output> | Promise<Result<Output>>;
    readonly types?: Types<Input, Output> | undefined;
  }

  type Result<Output> = SuccessResult<Output> | FailureResult;

  interface SuccessResult<Output> {
    readonly value: Output;
    readonly issues?: undefined;
  }

  interface FailureResult {
    readonly issues: ReadonlyArray<Issue>;
  }

  interface Issue {
    readonly message: string;
    readonly path?: ReadonlyArray<PropertyKey | PathSegment> | undefined;
  }

  interface PathSegment {
    readonly key: PropertyKey;
  }

  interface Types<Input = unknown, Output = Input> {
    readonly input?: Input;
    readonly output?: Output;
  }

  type InferInput<Schema extends StandardSchemaV1> = NonNullable<
    Schema['~standard']['types']
  >['input'];

  type InferOutput<Schema extends StandardSchemaV1> = NonNullable<
    Schema['~standard']['types']
  >['output'];
}

/**
 * Wraps a VODefinition as a Standard Schema v1 compliant object.
 */
export function toStandardSchema<TInput, TBrand extends string, TCodes extends string>(
  voDef: VODefinition<TInput, TBrand, TCodes>,
): StandardSchemaV1<TInput, Brand<TInput, TBrand>> {
  return {
    '~standard': {
      version: 1,
      vendor: 'vorm',
      validate(value: unknown): StandardSchemaV1.Result<Brand<TInput, TBrand>> {
        const issues: StandardSchemaV1.Issue[] = [];
        for (const rule of voDef.rules) {
          if (!rule.validate(value as TInput)) {
            issues.push({ message: rule.code });
          }
        }
        if (issues.length > 0) {
          return { issues };
        }
        return { value: value as Brand<TInput, TBrand> };
      },
      types: undefined as unknown as StandardSchemaV1.Types<TInput, Brand<TInput, TBrand>>,
    },
  };
}
