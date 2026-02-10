import { vo, createRule, createField, createFormSchema } from '@gunubin/vorm-core';
import type { Infer } from '@gunubin/vorm-core';
import { useForm } from '@gunubin/vorm-react';

const minLength = createRule<string, number>(
  'minLength',
  (value, min) => value.length >= min,
);

const Name = vo('Name', [minLength(2)]);
type Name = Infer<typeof Name>;

const nameField = createField(Name, {
  messages: { minLength: 'Must be at least 2 characters' },
});

const schema = createFormSchema({
  fields: {
    name: nameField({ required: true, messages: { REQUIRED: 'Required' } }),
  },
});

function ModeForm({ mode, label }: { mode: 'onChange' | 'onBlur' | 'onSubmit'; label: string }) {
  const form = useForm(schema, {
    defaultValues: { name: '' },
    mode,
  });

  const name = form.field('name');

  return (
    <div className="column">
      <h3>{label}</h3>
      <p className="description">mode: "{mode}"</p>
      <form onSubmit={form.handleSubmit((v) => alert(`${label}: ${JSON.stringify(v)}`))}>
        <div className="form-group">
          <label htmlFor={`${mode}-name`}>Name</label>
          <input
            id={`${mode}-name`}
            className={name.error ? 'has-error' : ''}
            value={name.value}
            onChange={(e) => name.onChange(e.target.value)}
            onBlur={name.onBlur}
          />
          {name.error && <p className="error-message">{name.error.message}</p>}
        </div>
        <button type="submit">Submit</button>
      </form>
      <div className="state-display">
{JSON.stringify({ value: name.value, error: name.error, isDirty: name.isDirty, isTouched: name.isTouched, formErrors: form.errors }, null, 2)}
      </div>
    </div>
  );
}

export function ValidationModes() {
  return (
    <div>
      <h2>Validation Modes</h2>
      <p className="description">
        Same schema displayed in 3 modes: onChange / onBlur / onSubmit. Type to compare validation trigger timing.
      </p>
      <div className="three-columns">
        <ModeForm mode="onChange" label="onChange" />
        <ModeForm mode="onBlur" label="onBlur" />
        <ModeForm mode="onSubmit" label="onSubmit" />
      </div>
    </div>
  );
}
