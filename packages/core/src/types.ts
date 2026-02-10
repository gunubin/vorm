export type Brand<T, B extends string> = T & { readonly __brand: B };

export type ValidationRule<T, C extends string = string> = {
  code: C;
  validate: (value: T) => boolean;
};

export type CreateResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string } };

export type VODefinition<TInput, TBrand extends string, TCodes extends string = string> = {
  brand: TBrand;
  rules: ValidationRule<TInput, TCodes>[];
  create: (input: TInput) => Brand<TInput, TBrand>;
  safeCreate: (input: TInput) => CreateResult<Brand<TInput, TBrand>>;
};

export type Infer<D> = D extends VODefinition<infer T, infer B, any>
  ? Brand<T, B>
  : D extends { create: (input: any) => infer R }
    ? R
    : never;

export type ErrorMessageMap<C extends string = string> = { [K in C]?: string };
export type ErrorMessageFn<C extends string = string> = (error: { code: C }) => string;
export type ErrorMessages<C extends string = string> = ErrorMessageMap<C> | ErrorMessageFn<C>;

export type VOLike<TInput, TOutput, TCodes extends string = string> = {
  rules: ValidationRule<TInput, TCodes>[];
  create: (input: TInput) => TOutput;
};

export type FieldSchema<T, TOutput, TRequired extends boolean, TCodes extends string = string> = {
  vo: VOLike<T, TOutput, TCodes> | null;
  required: TRequired;
  messages: ErrorMessages<TCodes | (TRequired extends true ? 'REQUIRED' : never)>;
  rules: ValidationRule<T, TCodes>[];
  parse?: (raw: string) => T;
  format?: (value: T) => string;
};

export type FieldError = {
  code: string;
  message: string;
};

export type FormErrors = Record<string, FieldError>;

export type FormSchemaConfig<TFields extends Record<string, FieldSchema<any, any, boolean, any>>> = {
  fields: TFields;
  messages?: Record<string, ErrorMessages>;
  resolver?: (values: FormInputValues<TFields>) => FormErrors | null;
};

export type FormSchema<TFields extends Record<string, FieldSchema<any, any, boolean, any>>> = {
  fields: TFields;
  messages?: Record<string, ErrorMessages>;
  resolver?: (values: FormInputValues<TFields>) => FormErrors | null;
};

export type FormInputValues<TFields extends Record<string, FieldSchema<any, any, boolean, any>>> = {
  [K in keyof TFields]: TFields[K] extends FieldSchema<infer TInput, any, infer TRequired, any>
    ? TRequired extends true
      ? TInput
      : TInput | undefined
    : never;
};

export type FormOutputValues<TFields extends Record<string, FieldSchema<any, any, boolean, any>>> = {
  [K in keyof TFields]: TFields[K] extends FieldSchema<any, infer TOutput, infer TRequired, any>
    ? TRequired extends true
      ? TOutput
      : TOutput | undefined
    : never;
};
