import { vo, createRule, createField, createFormSchema } from '@gunubin/vorm-core';
import type { Infer } from '@gunubin/vorm-core';
import { useVorm } from '@gunubin/vorm-rhf';

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

const emailField = createField(Email, {
  messages: { email: 'Invalid email format' },
});
const passwordField = createField(Password, {
  messages: { minLength: 'Must be at least 8 characters' },
});

const schema = createFormSchema({
  fields: {
    email: emailField({ required: true, messages: { REQUIRED: 'Required' } }),
    password: passwordField({ required: true, messages: { REQUIRED: 'Required' } }),
  },
});

export function RHFIntegration() {
  // useVorm = RHF's useForm + createVormResolver setup
  // Return value is RHF's UseFormReturn as-is
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useVorm(schema, {
    defaultValues: { email: '', password: '' },
    mode: 'onBlur',
  });

  const onSubmit = handleSubmit((values) => {
    // values.email: Brand<string, 'Email'>
    // values.password: Brand<string, 'Password'>
    // Type-safe: const cross: Password = values.email; -> type error
    alert(JSON.stringify(values, null, 2));
  });

  return (
    <div>
      <h2>RHF Integration (@gunubin/vorm-rhf)</h2>
      <p className="description">
        Use React Hook Form API as-is while receiving Branded Types on submit.
        register, formState, watch, etc. are all standard RHF. Performance is identical to RHF (uncontrolled / ref-based).
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
        <strong>Comparison with @gunubin/vorm-react:</strong>{'\n\n'}
        {'@gunubin/vorm-react: useForm → form.field("email") → value, onChange, onBlur\n'}
        {'@gunubin/vorm-rhf:   useVorm → register("email") → RHF standard props\n\n'}
        <strong>Key difference:</strong>{'\n'}
        {'@gunubin/vorm-react manages its own state (controlled, useSyncExternalStore)\n'}
        {'@gunubin/vorm-rhf delegates to RHF (uncontrolled, ref-based)\n\n'}
        {'Both provide Branded Types in handleSubmit callback.'}
      </div>
    </div>
  );
}
