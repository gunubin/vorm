export type Brand<T, B extends string> = T & { readonly __brand: B };

export type ValidationRule<T> = {
  code: string;
  validate: (value: T) => boolean;
};

export type CreateResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string } };

export type VODefinition<TInput, TBrand extends string> = {
  brand: TBrand;
  rules: ValidationRule<TInput>[];
  create: (input: TInput) => Brand<TInput, TBrand>;
  safeCreate: (input: TInput) => CreateResult<Brand<TInput, TBrand>>;
};

export type Infer<D> = D extends VODefinition<infer T, infer B>
  ? Brand<T, B>
  : D extends { create: (input: any) => infer R }
    ? R
    : never;

export type ErrorMessageMap = Record<string, string>;
export type ErrorMessageFn = (error: { code: string }) => string;
export type ErrorMessages = ErrorMessageMap | ErrorMessageFn;

export type VOLike<TInput, TOutput> = {
  rules: ValidationRule<TInput>[];
  create: (input: TInput) => TOutput;
};

export type FieldSchema<TInput, TOutput, TRequired extends boolean> = {
  vo: VOLike<TInput, TOutput> | null;
  required: TRequired;
  messages: ErrorMessages;
  rules: ValidationRule<TInput>[];
};

export type FieldError = {
  code: string;
  message: string;
};

export type FormErrors = Record<string, FieldError>;

export type FormSchemaConfig<TFields extends Record<string, FieldSchema<any, any, boolean>>> = {
  fields: TFields;
  messages?: Record<string, ErrorMessages>;
  resolver?: (values: FormInputValues<TFields>) => FormErrors | null;
};

export type FormSchema<TFields extends Record<string, FieldSchema<any, any, boolean>>> = {
  fields: TFields;
  messages?: Record<string, ErrorMessages>;
  resolver?: (values: FormInputValues<TFields>) => FormErrors | null;
};

export type FormInputValues<TFields extends Record<string, FieldSchema<any, any, boolean>>> = {
  [K in keyof TFields]: TFields[K] extends FieldSchema<infer TInput, any, infer TRequired>
    ? TRequired extends true
      ? TInput
      : TInput | undefined
    : never;
};

export type FormOutputValues<TFields extends Record<string, FieldSchema<any, any, boolean>>> = {
  [K in keyof TFields]: TFields[K] extends FieldSchema<any, infer TOutput, infer TRequired>
    ? TRequired extends true
      ? TOutput
      : TOutput | undefined
    : never;
};
