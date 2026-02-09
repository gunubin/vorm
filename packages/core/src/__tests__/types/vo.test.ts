import { expectTypeOf } from 'vitest';
import { vo, createRule, createField, createFormSchema, validateAndCreate, safeValidateAndCreate } from '../../index.js';
import type { Brand, VODefinition, VOLike, CreateResult, Infer } from '../../index.js';

const strRule = createRule<string>('STR', (v) => v.length > 0);
const numRule = createRule<number, number>('NUM', (v, min) => v >= min);

// =============================================
// vo() ジェネリック推論
// =============================================
describe('vo() ジェネリック推論', () => {
  it('vo("Email", [strRule]) → VODefinition<string, "Email">: B はリテラル推論', () => {
    const Email = vo('Email', [strRule()]);
    expectTypeOf(Email).toEqualTypeOf<VODefinition<string, 'Email'>>();
    expectTypeOf(Email.brand).toEqualTypeOf<'Email'>();
  });

  it('vo("Age", [numRule]) → VODefinition<number, "Age">: T は rules から推論', () => {
    const Age = vo('Age', [numRule(0)]);
    expectTypeOf(Age).toEqualTypeOf<VODefinition<number, 'Age'>>();
  });

  it('vo("Empty", []) → VODefinition<string, "Empty">: T は string にデフォルト', () => {
    const Empty = vo('Empty', []);
    expectTypeOf(Empty).toEqualTypeOf<VODefinition<string, 'Empty'>>();
  });

  it('vo<"Rating", number>("Rating", []) → 両方明示指定', () => {
    const Rating = vo<'Rating', number>('Rating', []);
    expectTypeOf(Rating).toEqualTypeOf<VODefinition<number, 'Rating'>>();
  });
});

// =============================================
// create / safeCreate 返り値の型
// =============================================
describe('create / safeCreate の返り値', () => {
  const Email = vo('Email', [strRule()]);
  const Password = vo('Password', [strRule()]);
  const Age = vo('Age', [numRule(0)]);

  it('create() は Brand<T, B> を返す', () => {
    const email = Email.create('test@example.com');
    expectTypeOf(email).toEqualTypeOf<Brand<string, 'Email'>>();
  });

  it('create() は Brand<number, "Age"> を返す（number VO）', () => {
    const age = Age.create(25);
    expectTypeOf(age).toEqualTypeOf<Brand<number, 'Age'>>();
  });

  it('safeCreate() は CreateResult<Brand<T, B>> を返す', () => {
    const result = Email.safeCreate('test@example.com');
    expectTypeOf(result).toEqualTypeOf<CreateResult<Brand<string, 'Email'>>>();
  });

  it('safeCreate success の data はブランド型', () => {
    const result = Email.safeCreate('test@example.com');
    if (result.success) {
      expectTypeOf(result.data).toEqualTypeOf<Brand<string, 'Email'>>();
    }
  });

  it('異なる VO の create 結果は互いに代入不可', () => {
    type EmailBrand = ReturnType<typeof Email.create>;
    type PasswordBrand = ReturnType<typeof Password.create>;
    expectTypeOf<EmailBrand>().not.toEqualTypeOf<PasswordBrand>();
    expectTypeOf<PasswordBrand>().not.toEqualTypeOf<EmailBrand>();
  });

  it('create 結果は基底型に代入可能', () => {
    type EmailBrand = ReturnType<typeof Email.create>;
    type AgeBrand = ReturnType<typeof Age.create>;
    expectTypeOf<EmailBrand>().toMatchTypeOf<string>();
    expectTypeOf<AgeBrand>().toMatchTypeOf<number>();
  });

  it('基底型は create 結果に代入不可', () => {
    type EmailBrand = ReturnType<typeof Email.create>;
    expectTypeOf<string>().not.toMatchTypeOf<EmailBrand>();
  });
});

// =============================================
// Infer ユーティリティ型
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

  it('Infer<空ルール VO> → Brand<string, B>', () => {
    type EmptyType = Infer<typeof Empty>;
    expectTypeOf<EmptyType>().toEqualTypeOf<Brand<string, 'Empty'>>();
  });

  it('異なる VO の Infer 型は互いに代入不可', () => {
    const Password = vo('Password', [strRule()]);
    type EmailType = Infer<typeof Email>;
    type PasswordType = Infer<typeof Password>;
    expectTypeOf<EmailType>().not.toEqualTypeOf<PasswordType>();
  });

  it('手書き VO の Infer は create の返り値型を抽出', () => {
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
// VOLike 構造的互換性
// =============================================
describe('VOLike', () => {
  it('VODefinition は VOLike に代入可能', () => {
    const Email = vo('Email', [strRule()]);
    expectTypeOf(Email).toMatchTypeOf<VOLike<string, Brand<string, 'Email'>>>();
  });

  it('手書き VO は VOLike に代入可能', () => {
    type Nickname = string & { readonly __brand: 'Nickname' };
    const NicknameDef = {
      rules: [strRule()],
      create: (v: string): Nickname => v as Nickname,
    };
    expectTypeOf(NicknameDef).toMatchTypeOf<VOLike<string, Nickname>>();
  });

  it('createField は VOLike を受け入れる', () => {
    type Nickname = string & { readonly __brand: 'Nickname' };
    const NicknameDef: VOLike<string, Nickname> = {
      rules: [strRule()],
      create: (v: string): Nickname => v as Nickname,
    };
    const nicknameField = createField(NicknameDef);
    const field = nicknameField({ required: true });
    expectTypeOf(field.required).toEqualTypeOf<true>();
  });
});

// =============================================
// 手書き VO → createField → createFormSchema のブランド保持
// =============================================
describe('手書き VO のブランド型フロー', () => {
  type Nickname = string & { readonly __brand: 'Nickname' };
  const rules = [strRule()];
  const NicknameDef = {
    rules,
    create: (v: string): Nickname => validateAndCreate(v, rules, 'Nickname') as Nickname,
  };

  const nicknameField = createField(NicknameDef);
  const schema = createFormSchema({
    fields: {
      nickname: nicknameField({ required: true }),
    },
  });

  it('FormOutputValues のフィールドが手書きブランド型になる', () => {
    type Output = import('../../types.js').FormOutputValues<typeof schema.fields>;
    expectTypeOf<Output['nickname']>().toEqualTypeOf<Nickname>();
  });

  it('FormInputValues は基底型（string）', () => {
    type Input = import('../../types.js').FormInputValues<typeof schema.fields>;
    expectTypeOf<Input['nickname']>().toEqualTypeOf<string>();
  });
});

// =============================================
// validateAndCreate / safeValidateAndCreate の型
// =============================================
describe('validateAndCreate / safeValidateAndCreate', () => {
  it('validateAndCreate は入力と同じ型を返す', () => {
    const result = validateAndCreate('test', [strRule()], 'Test');
    expectTypeOf(result).toEqualTypeOf<string>();
  });

  it('safeValidateAndCreate は success/failure を判別できる', () => {
    const result = safeValidateAndCreate('test', [strRule()]);
    if (result.success) {
      expectTypeOf(result.data).toEqualTypeOf<string>();
    } else {
      expectTypeOf(result.error).toEqualTypeOf<{ code: string }>();
    }
  });

  it('number の validateAndCreate', () => {
    const result = validateAndCreate(42, [numRule(0)], 'Score');
    expectTypeOf(result).toEqualTypeOf<number>();
  });
});
