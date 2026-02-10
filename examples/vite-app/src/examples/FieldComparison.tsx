import { vo, createRule, createField, createFormSchema, validateAndCreate } from '@gunubin/vorm-core';
import type { Infer } from '@gunubin/vorm-core';
import { useForm, useField } from '@gunubin/vorm-react';

const minLength = createRule<string, number>(
  'minLength',
  (value, min) => value.length >= min,
);

// --- Defined with vo() ---
const Username = vo('Username', [minLength(3)]);
type Username = Infer<typeof Username>;

// --- Handwritten definition (without vo()) ---
type Nickname = string & { readonly __brand: 'Nickname' };
const nicknameRules = [minLength(2)] as const;
const NicknameDef = {
  rules: [...nicknameRules],
  create: (value: string): Nickname => validateAndCreate(value, nicknameRules, 'Nickname') as Nickname,
};

const usernameField = createField(Username, {
  messages: { minLength: 'Must be at least 3 characters' },
});
const nicknameField = createField(NicknameDef, {
  messages: { minLength: 'Must be at least 2 characters' },
});

const schemaA = createFormSchema({
  fields: {
    username: usernameField({ required: true, messages: { REQUIRED: 'Required' } }),
  },
});

const schemaB = createFormSchema({
  fields: {
    nickname: nicknameField({ required: true, messages: { REQUIRED: 'Required' } }),
  },
});

function FormWithVO() {
  const form = useForm(schemaA, {
    defaultValues: { username: '' },
    mode: 'onChange',
  });

  const username = form.field('username');

  return (
    <div className="column">
      <h3>Defined with vo()</h3>
      <p className="description">vo('Username', rules) → createField → useForm</p>
      <form onSubmit={form.handleSubmit((v) => alert(JSON.stringify(v)))}>
        <div className="form-group">
          <label htmlFor="vo-username">Username</label>
          <input
            id="vo-username"
            className={username.error ? 'has-error' : ''}
            value={username.value}
            onChange={(e) => username.onChange(e.target.value)}
            onBlur={username.onBlur}
          />
          {username.error && <p className="error-message">{username.error.message}</p>}
        </div>
        <button type="submit">Submit</button>
      </form>
      <div className="state-display">
{JSON.stringify({ value: username.value, error: username.error, isDirty: username.isDirty, isTouched: username.isTouched }, null, 2)}
      </div>
    </div>
  );
}

function FormWithHandwritten() {
  const form = useForm(schemaB, {
    defaultValues: { nickname: '' },
    mode: 'onChange',
  });

  const nickname = useField(form, 'nickname');

  return (
    <div className="column">
      <h3>Handwritten definition</h3>
      <p className="description">{'{ rules, create }' } defined directly → createField → useField</p>
      <form onSubmit={form.handleSubmit((v) => alert(JSON.stringify(v)))}>
        <div className="form-group">
          <label htmlFor="hw-nickname">Nickname</label>
          <input
            id="hw-nickname"
            className={nickname.error ? 'has-error' : ''}
            value={nickname.value}
            onChange={(e) => nickname.onChange(e.target.value)}
            onBlur={nickname.onBlur}
          />
          {nickname.error && <p className="error-message">{nickname.error.message}</p>}
        </div>
        <button type="submit">Submit</button>
      </form>
      <div className="state-display">
{JSON.stringify({ value: nickname.value, error: nickname.error, isDirty: nickname.isDirty, isTouched: nickname.isTouched }, null, 2)}
      </div>
    </div>
  );
}

export function FieldComparison() {
  return (
    <div>
      <h2>VO Definition Comparison</h2>
      <p className="description">
        Comparing a VO defined with the vo() factory vs. a handwritten {'{ rules, create }'} VO.
        Both can be passed to createField.
      </p>
      <div className="side-by-side">
        <FormWithVO />
        <FormWithHandwritten />
      </div>
    </div>
  );
}
