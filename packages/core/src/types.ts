export type Brand<T, B extends string> = T & { readonly __brand: B };

export type ValidationRule<T> = {
  code: string;
  validate: (value: T) => boolean;
};

export type VODefinition<TInput, TBrand extends string> = {
  brand: TBrand;
  rules: ValidationRule<TInput>[];
  parse: (input: TInput) => Brand<TInput, TBrand>;
};

export type ErrorMessageMap = Record<string, string>;
export type ErrorMessageFn = (error: { code: string }) => string;
export type ErrorMessages = ErrorMessageMap | ErrorMessageFn;

export type FieldSchema<TInput, TOutput, TRequired extends boolean> = {
  vo: VODefinition<TInput, string> | null;
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
