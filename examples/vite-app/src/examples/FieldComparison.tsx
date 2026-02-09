import { vo, createRule, createField, createFormSchema, validateAndCreate } from '@vorm/core';
import type { Infer } from '@vorm/core';
import { useForm, useField } from '@vorm/react';

const minLength = createRule<string, number>(
  'minLength',
  (value, min) => value.length >= min,
);

// --- vo() で定義 ---
const Username = vo('Username', [minLength(3)]);
type Username = Infer<typeof Username>;

// --- 手書きで定義（vo() なし） ---
type Nickname = string & { readonly __brand: 'Nickname' };
const nicknameRules = [minLength(2)] as const;
const NicknameDef = {
  rules: [...nicknameRules],
  create: (value: string): Nickname => validateAndCreate(value, nicknameRules, 'Nickname') as Nickname,
};

const usernameField = createField(Username);
const nicknameField = createField(NicknameDef);

const schemaA = createFormSchema({
  fields: {
    username: usernameField({ required: true, messages: { REQUIRED: '必須です', minLength: '3文字以上で入力してください' } }),
  },
});

const schemaB = createFormSchema({
  fields: {
    nickname: nicknameField({ required: true, messages: { REQUIRED: '必須です', minLength: '2文字以上で入力してください' } }),
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
      <h3>vo() で定義</h3>
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
      <h3>手書きで定義</h3>
      <p className="description">{'{ rules, create }' } を直接定義 → createField → useField</p>
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
        vo() ファクトリで定義した VO と、手書きで {'{ rules, create }'} を直接定義した VO の比較。
        どちらも createField に渡せる。
      </p>
      <div className="side-by-side">
        <FormWithVO />
        <FormWithHandwritten />
      </div>
    </div>
  );
}
