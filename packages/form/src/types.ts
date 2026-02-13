import type { VOLike, ValidationRule, StandardSchemaV1 } from '@gunubin/vorm-core';

export type ErrorMessageMap<C extends string = string> = { [K in C]?: string };
export type ErrorMessageFn<C extends string = string> = (error: { code: C }) => string;
export type ErrorMessages<C extends string = string> = ErrorMessageMap<C> | ErrorMessageFn<C>;

export type FieldSchema<T, TOutput, TRequired extends boolean, TCodes extends string = string> = {
  vo: VOLike<T, TOutput, TCodes> | null;
  required: TRequired;
  messages: ErrorMessages<TCodes | (TRequired extends true ? 'REQUIRED' : never)>;
  rules: ValidationRule<T, TCodes>[];
  parse?: (raw: string) => T;
  format?: (value: T) => string;
};

export type ArrayFieldSchema<T, TOutput, TRequired extends boolean, TCodes extends string = string> = {
  __array: true;
  item: FieldSchema<T, TOutput, true, TCodes>;
  required: TRequired;
  minLength?: number;
  maxLength?: number;
  messages: ErrorMessages<TCodes | 'REQUIRED' | 'MIN_LENGTH' | 'MAX_LENGTH'>;
};

export type AnyFieldSchema =
  | FieldSchema<any, any, boolean, any>
  | ArrayFieldSchema<any, any, boolean, any>;

export function isArrayFieldSchema(s: AnyFieldSchema): s is ArrayFieldSchema<any, any, boolean, any> {
  return '__array' in s && s.__array === true;
}

export type FieldError = {
  code: string;
  message: string;
};

export type FormErrors = Record<string, FieldError>;

export type FormSchemaConfig<TFields extends Record<string, AnyFieldSchema>> = {
  fields: TFields;
  messages?: Record<string, ErrorMessages>;
  resolver?: (values: FormInputValues<TFields>) => FormErrors | null;
};

export type FormSchema<TFields extends Record<string, AnyFieldSchema>> =
  StandardSchemaV1<FormInputValues<TFields>, FormOutputValues<TFields>> & {
    fields: TFields;
    messages?: Record<string, ErrorMessages>;
    resolver?: (values: FormInputValues<TFields>) => FormErrors | null;
  };

export type FormInputValues<TFields extends Record<string, AnyFieldSchema>> = {
  [K in keyof TFields]: TFields[K] extends ArrayFieldSchema<infer TInput, any, infer TRequired, any>
    ? TRequired extends true
      ? TInput[]
      : TInput[] | undefined
    : TFields[K] extends FieldSchema<infer TInput, any, infer TRequired, any>
      ? TRequired extends true
        ? TInput
        : TInput | undefined
      : never;
};

export type FormOutputValues<TFields extends Record<string, AnyFieldSchema>> = {
  [K in keyof TFields]: TFields[K] extends ArrayFieldSchema<any, infer TOutput, infer TRequired, any>
    ? TRequired extends true
      ? TOutput[]
      : TOutput[] | undefined
    : TFields[K] extends FieldSchema<any, infer TOutput, infer TRequired, any>
      ? TRequired extends true
        ? TOutput
        : TOutput | undefined
      : never;
};
