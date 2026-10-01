import { Field, Input, Select, Textarea } from './ui';

export type FieldDef = {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'datetime' | 'select' | 'textarea' | 'boolean';
  options?: string[];
  required?: boolean;
  span?: 1 | 2;
  placeholder?: string;
  step?: string;
  hint?: string;
  disabled?: boolean;
};

export function DynamicForm({
  campos,
  values,
  erros,
  onChange,
}: {
  campos: FieldDef[];
  values: Record<string, any>;
  erros: Record<string, string>;
  onChange: (name: string, value: any) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {campos.map((c) => {
        const span = c.span === 2 ? 'sm:col-span-2' : '';
        const v = values[c.name] ?? '';

        if (c.type === 'textarea') {
          return (
            <Field key={c.name} label={c.label} obrigatorio={c.required} erro={erros[c.name]} dica={c.hint} className={span}>
              <Textarea
                value={v}
                disabled={c.disabled}
                invalid={!!erros[c.name]}
                placeholder={c.placeholder}
                onChange={(e) => onChange(c.name, e.target.value)}
              />
            </Field>
          );
        }

        if (c.type === 'select') {
          return (
            <Field key={c.name} label={c.label} obrigatorio={c.required} erro={erros[c.name]} dica={c.hint} className={span}>
              <Select
                value={v}
                disabled={c.disabled}
                invalid={!!erros[c.name]}
                onChange={(e) => onChange(c.name, e.target.value)}
              >
                <option value="">Selecione...</option>
                {(c.options || []).map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </Select>
            </Field>
          );
        }

        if (c.type === 'boolean') {
          return (
            <Field key={c.name} label={c.label} erro={erros[c.name]} dica={c.hint} className={span}>
              <div className="flex h-10 items-center gap-2.5 rounded-lg border border-ink-200 bg-white px-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={!!v}
                  disabled={c.disabled}
                  onClick={() => onChange(c.name, !v)}
                  className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                    v ? 'bg-forest-600' : 'bg-ink-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
                      v ? 'left-[1.15rem]' : 'left-0.5'
                    }`}
                  />
                </button>
                <span className="text-sm text-ink-600">{v ? 'Sim' : 'Não'}</span>
              </div>
            </Field>
          );
        }

        return (
          <Field key={c.name} label={c.label} obrigatorio={c.required} erro={erros[c.name]} dica={c.hint} className={span}>
            <Input
              type={c.type === 'number' ? 'number' : c.type === 'date' ? 'date' : c.type === 'datetime' ? 'datetime-local' : 'text'}
              step={c.step}
              min={c.type === 'number' ? '0' : undefined}
              value={v}
              disabled={c.disabled}
              invalid={!!erros[c.name]}
              placeholder={c.placeholder}
              onChange={(e) => onChange(c.name, e.target.value)}
            />
          </Field>
        );
      })}
    </div>
  );
}
