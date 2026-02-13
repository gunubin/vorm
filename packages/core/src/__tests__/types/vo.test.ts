import { expectTypeOf } from 'vitest';
import { vo, createRule, validateAndCreate, safeValidateAndCreate } from '../../index.js';
import type { Brand, VODefinition, VOLike, CreateResult, Infer } from '../../index.js';

const strRule = createRule<string>('STR', (v) => v.length > 0);
const numRule = createRule<number, number>('NUM', (v, min) => v >= min);

// =============================================
// vo() generic inference
// =============================================
describe('vo() generic inference', () => {
  it('vo("Email", [strRule]) → VODefinition<string, "Email">: B is literal inferred', () => {
    const Email = vo('Email', [strRule()]);
    expectTypeOf(Email).toEqualTypeOf<VODefinition<string, 'Email'>>();
    expectTypeOf(Email.brand).toEqualTypeOf<'Email'>();
  });

  it('vo("Age", [numRule]) → VODefinition<number, "Age">: T is inferred from rules', () => {
    const Age = vo('Age', [numRule(0)]);
    expectTypeOf(Age).toEqualTypeOf<VODefinition<number, 'Age'>>();
  });

  it('vo("Empty", []) → VODefinition<string, "Empty">: T defaults to string', () => {
    const Empty = vo('Empty', []);
    expectTypeOf(Empty).toEqualTypeOf<VODefinition<string, 'Empty'>>();
  });

  it('vo<"Rating", number>("Rating", []) → both explicitly specified', () => {
    const Rating = vo<'Rating', number>('Rating', []);
    expectTypeOf(Rating).toEqualTypeOf<VODefinition<number, 'Rating'>>();
  });
});

// =============================================
// create / safeCreate return types
// =============================================
describe('create / safeCreate return types', () => {
  const Email = vo('Email', [strRule()]);
  const Password = vo('Password', [strRule()]);
  const Age = vo('Age', [numRule(0)]);

  it('create() returns Brand<T, B>', () => {
    const email = Email.create('test@example.com');
    expectTypeOf(email).toEqualTypeOf<Brand<string, 'Email'>>();
  });

  it('create() returns Brand<number, "Age"> (number VO)', () => {
    const age = Age.create(25);
    expectTypeOf(age).toEqualTypeOf<Brand<number, 'Age'>>();
  });

  it('safeCreate() returns CreateResult<Brand<T, B>>', () => {
    const result = Email.safeCreate('test@example.com');
    expectTypeOf(result).toEqualTypeOf<CreateResult<Brand<string, 'Email'>>>();
  });

  it('safeCreate success data is branded type', () => {
    const result = Email.safeCreate('test@example.com');
    if (result.success) {
      expectTypeOf(result.data).toEqualTypeOf<Brand<string, 'Email'>>();
    }
  });

  it('create results of different VOs are not assignable to each other', () => {
    type EmailBrand = ReturnType<typeof Email.create>;
    type PasswordBrand = ReturnType<typeof Password.create>;
    expectTypeOf<EmailBrand>().not.toEqualTypeOf<PasswordBrand>();
    expectTypeOf<PasswordBrand>().not.toEqualTypeOf<EmailBrand>();
  });

  it('create result is assignable to base type', () => {
    type EmailBrand = ReturnType<typeof Email.create>;
    type AgeBrand = ReturnType<typeof Age.create>;
    expectTypeOf<EmailBrand>().toMatchTypeOf<string>();
    expectTypeOf<AgeBrand>().toMatchTypeOf<number>();
  });

  it('base type is not assignable to create result', () => {
    type EmailBrand = ReturnType<typeof Email.create>;
    expectTypeOf<string>().not.toMatchTypeOf<EmailBrand>();
  });
});

// =============================================
// Infer utility type
// =============================================
describe('Infer', () => {
  const Email = vo('Email', [strRule()]);
  const Age = vo('Age', [numRule(0)]);
  const Empty = vo('Empty', []);

  it('Infer<VODefinition> → Brand<T, B>', () => {
    type EmailType = Infer<typeof Email>;
    expectTypeOf<EmailType>().toEqualTypeOf<Brand<string, 'Email'>>();
  });

  it('Infer<number VO> → Brand<number, B>', () => {
    type AgeType = Infer<typeof Age>;
    expectTypeOf<AgeType>().toEqualTypeOf<Brand<number, 'Age'>>();
  });

  it('Infer<empty rules VO> → Brand<string, B>', () => {
    type EmptyType = Infer<typeof Empty>;
    expectTypeOf<EmptyType>().toEqualTypeOf<Brand<string, 'Empty'>>();
  });

  it('Infer types of different VOs are not assignable to each other', () => {
    const Password = vo('Password', [strRule()]);
    type EmailType = Infer<typeof Email>;
    type PasswordType = Infer<typeof Password>;
    expectTypeOf<EmailType>().not.toEqualTypeOf<PasswordType>();
  });

  it('Infer of hand-written VO extracts create return type', () => {
    type Nickname = string & { readonly __brand: 'Nickname' };
    const NicknameDef = {
      rules: [strRule()],
      create: (v: string): Nickname => v as Nickname,
    };
    type NicknameInferred = Infer<typeof NicknameDef>;
    expectTypeOf<NicknameInferred>().toEqualTypeOf<Nickname>();
  });
});

// =============================================
// VOLike structural compatibility
// =============================================
describe('VOLike', () => {
  it('VODefinition is assignable to VOLike', () => {
    const Email = vo('Email', [strRule()]);
    expectTypeOf(Email).toMatchTypeOf<VOLike<string, Brand<string, 'Email'>>>();
  });

  it('hand-written VO is assignable to VOLike', () => {
    type Nickname = string & { readonly __brand: 'Nickname' };
    const NicknameDef = {
      rules: [strRule()],
      create: (v: string): Nickname => v as Nickname,
    };
    expectTypeOf(NicknameDef).toMatchTypeOf<VOLike<string, Nickname>>();
  });

});

// =============================================
// validateAndCreate / safeValidateAndCreate types
// =============================================
describe('validateAndCreate / safeValidateAndCreate', () => {
  it('validateAndCreate returns the same type as input', () => {
    const result = validateAndCreate('test', [strRule()], 'Test');
    expectTypeOf(result).toEqualTypeOf<string>();
  });

  it('safeValidateAndCreate can discriminate success/failure', () => {
    const result = safeValidateAndCreate('test', [strRule()]);
    if (result.success) {
      expectTypeOf(result.data).toEqualTypeOf<string>();
    } else {
      expectTypeOf(result.error).toEqualTypeOf<{ code: string }>();
    }
  });

  it('number validateAndCreate', () => {
    const result = validateAndCreate(42, [numRule(0)], 'Score');
    expectTypeOf(result).toEqualTypeOf<number>();
  });
});
