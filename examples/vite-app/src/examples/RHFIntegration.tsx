import { vo, createRule, createField, createFormSchema } from '@vorm/core';
import type { Infer } from '@vorm/core';
import { useVorm } from '@vorm/rhf';

const minLength = createRule(
  'minLength',
  (value: string, min: number) => value.length >= min,
);

const emailPattern = createRule(
  'email',
  (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
);

const Email = vo('Email', [emailPattern()]);
type Email = Infer<typeof Email>;

const Password = vo('Password', [minLength(8)]);
type Password = Infer<typeof Password>;

const emailField = createField(Email);
const passwordField = createField(Password);

const schema = createFormSchema({
  fields: {
    email: emailField({ required: true, messages: { REQUIRED: '必須です', email: 'メールアドレスの形式が正しくありません' } }),
    password: passwordField({ required: true, messages: { REQUIRED: '必須です', minLength: '8文字以上で入力してください' } }),
  },
});

export function RHFIntegration() {
  // useVorm = RHF の useForm + createVormResolver を設定するだけ
  // 返り値は RHF の UseFormReturn そのもの
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useVorm(schema, {
    defaultValues: { email: '', password: '' },
    mode: 'onBlur',
  });

  const onSubmit = handleSubmit((values) => {
    // values.email: Brand<string, 'Email'>
    // values.password: Brand<string, 'Password'>
    // 型安全: const cross: Password = values.email; → 型エラー
    alert(JSON.stringify(values, null, 2));
  });

  return (
    <div>
      <h2>RHF Integration (@vorm/rhf)</h2>
      <p className="description">
        React Hook Form の API をそのまま使いつつ、submit 時に Branded Type を受け取る。
        register, formState, watch 等は全て RHF 標準。パフォーマンスも RHF と同一（uncontrolled / ref ベース）。
      </p>

      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label htmlFor="rhf-email">Email</label>
          <input
            id="rhf-email"
            type="email"
            className={errors.email ? 'has-error' : ''}
            {...register('email')}
          />
          {errors.email && <p className="error-message">{errors.email.message}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="rhf-password">Password</label>
          <input
            id="rhf-password"
            type="password"
            className={errors.password ? 'has-error' : ''}
            {...register('password')}
          />
          {errors.password && <p className="error-message">{errors.password.message}</p>}
        </div>

        <button type="submit" disabled={isSubmitting}>
          Login
        </button>
      </form>

      <div className="state-display">
        <strong>Comparison with @vorm/react:</strong>{'\n\n'}
        {'@vorm/react: useForm → form.field("email") → value, onChange, onBlur\n'}
        {'@vorm/rhf:   useVorm → register("email") → RHF standard props\n\n'}
        <strong>Key difference:</strong>{'\n'}
        {'@vorm/react manages its own state (controlled, useSyncExternalStore)\n'}
        {'@vorm/rhf delegates to RHF (uncontrolled, ref-based)\n\n'}
        {'Both provide Branded Types in handleSubmit callback.'}
      </div>
    </div>
  );
}
