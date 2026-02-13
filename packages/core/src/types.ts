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

export type VOLike<TInput, TOutput, TCodes extends string = string> = {
  rules: ValidationRule<TInput, TCodes>[];
  create: (input: TInput) => TOutput;
};
