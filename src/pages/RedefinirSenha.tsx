import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowRight, Beaker, CheckCircle2, Lock } from 'lucide-react';
import { apiPost } from '../lib/api';
import { Button, Input } from '../components/ui';

export default function RedefinirSenha() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function salvar(event: FormEvent) {
    event.preventDefault();
    setErro('');
    if (senha.length < 8) {
      setErro('A senha deve ter no mínimo 8 caracteres.');
      return;
    }
    if (senha !== confirmacao) {
      setErro('As senhas não conferem.');
      return;
    }
    setSalvando(true);
    try {
      await apiPost('/api/auth/password/complete', { token, password: senha });
      setSucesso(true);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível configurar a senha.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f2f5f3] px-5 py-12">
      <section className="w-full max-w-md rounded-xl border border-ink-200 bg-white p-7 shadow-sm sm:p-9">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-forest-600 to-forest-800">
            <Beaker className="h-6 w-6 text-white" />
          </span>
          <div>
            <p className="font-display text-lg font-bold leading-none text-ink-900">LGRP</p>
            <p className="mt-1 text-[10px] font-medium uppercase text-ink-500">Gestão de Resíduos Químicos</p>
          </div>
        </div>

        {sucesso ? (
          <>
            <CheckCircle2 className="mb-4 h-8 w-8 text-forest-700" />
            <h1 className="font-display text-2xl font-bold text-ink-900">Senha configurada</h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">Agora você pode entrar no sistema com sua nova senha.</p>
            <Button className="mt-6 w-full" onClick={() => navigate('/login', { replace: true })}>
              Ir para o login <ArrowRight className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <h1 className="font-display text-2xl font-bold text-ink-900">Definir senha</h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">Use uma senha com pelo menos 8 caracteres. O link é válido por 24 horas e só pode ser usado uma vez.</p>
            {!token ? (
              <div className="mt-6 rounded-lg border border-brick-200 bg-brick-50 p-4 text-sm text-brick-700">
                <p className="flex items-start gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> Este link está incompleto ou expirou.</p>
                <Link className="mt-3 inline-block font-semibold underline" to="/login">Solicitar outro pelo login</Link>
              </div>
            ) : (
              <form onSubmit={salvar} className="mt-6 space-y-4" noValidate>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                  <Input className="pl-9" type="password" autoComplete="new-password" placeholder="Nova senha" value={senha} onChange={(event) => setSenha(event.target.value)} />
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                  <Input className="pl-9" type="password" autoComplete="new-password" placeholder="Confirmar nova senha" value={confirmacao} onChange={(event) => setConfirmacao(event.target.value)} />
                </div>
                {erro && <p role="alert" className="flex items-start gap-2 rounded-lg border border-brick-200 bg-brick-50 px-3 py-2.5 text-xs text-brick-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{erro}</p>}
                <Button type="submit" className="w-full" loading={salvando}>
                  Salvar senha {!salvando && <ArrowRight className="h-4 w-4" />}
                </Button>
              </form>
            )}
          </>
        )}
      </section>
    </main>
  );
}