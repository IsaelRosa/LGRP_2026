import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  Beaker,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Recycle,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { signInWithGoogle } from '../lib/googleAuth';
import { apiPost } from '../lib/api';
import { Button, Input } from '../components/ui';

const DESTAQUES = [
  {
    icone: <Recycle className="h-4 w-4" />,
    titulo: 'Rastreabilidade ponta a ponta',
    texto: 'Da solicitação no laboratório gerador até o certificado de destinação final.',
  },
  {
    icone: <ShieldCheck className="h-4 w-4" />,
    titulo: 'Conformidade normativa',
    texto: 'NBR 10004, RDC ANVISA 222/2018 e Resoluções CONAMA 313 e 452.',
  },
  {
    icone: <Beaker className="h-4 w-4" />,
    titulo: 'Indicadores para decisão',
    texto: 'Métricas mensais calculadas automaticamente a partir dos registros operacionais.',
  },
];

export default function Login() {
  const { user, loading, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [errosCampo, setErrosCampo] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState('');
  const [enviandoLink, setEnviandoLink] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  const validar = () => {
    const e: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Informe um e-mail institucional válido.';
    if (senha.length < 8) e.senha = 'A senha deve ter no mínimo 8 caracteres.';
    setErrosCampo(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setErro('');
    setAviso('');
    if (!validar()) return;
    setEnviando(true);
    try {
      const r = await signIn(email.trim(), senha);
      if (r.error) setErro(r.error);
    } catch (e: any) {
      setErro(e?.message || 'Não foi possível concluir a operação.');
    } finally {
      setEnviando(false);
    }
  };

  const solicitarLinkSenha = async () => {
    setErro('');
    setAviso('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErro('Informe seu e-mail para solicitar o link de senha.');
      return;
    }
    setEnviandoLink(true);
    try {
      const resposta = await apiPost<{ message: string }>('/api/auth/password/request', {
        email: email.trim(),
      });
      setAviso(resposta.message);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível solicitar o link.');
    } finally {
      setEnviandoLink(false);
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 bg-[#f2f5f3] lg:grid-cols-[1.05fr_1fr]">
      {/* Painel institucional */}
      <div className="relative hidden overflow-hidden bg-forest-950 lg:block">
        <img
          src="/img/lab-hero.jpg"
          alt="Laboratório de química"
          className="absolute inset-0 h-full w-full object-cover opacity-[0.28]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-forest-950 via-forest-950/92 to-forest-900/80" />
        <div className="absolute inset-0 grid-paper opacity-40" />

        <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
          <div className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-forest-400 to-forest-600 shadow-lg shadow-forest-900/40">
              <Beaker className="h-6.5 w-6.5 text-white" />
            </span>
            <div>
              <p className="font-display text-xl font-bold leading-none tracking-tight text-white">
                LGRP
              </p>
              <p className="mt-1 text-[10.5px] font-medium uppercase tracking-[0.16em] text-forest-300">
                Gestão de Resíduos Químicos
              </p>
            </div>
          </div>

          <div className="max-w-xl">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-display text-[2.6rem] font-bold leading-[1.1] tracking-tight text-white xl:text-5xl"
            >
              Laboratório de Gestão de{' '}
              <span className="text-forest-300">Resíduos Perigosos</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="mt-5 text-[15px] leading-relaxed text-forest-100/75"
            >
              Plataforma institucional de controle de pedidos de coleta, tratamentos, destinação final,
              banco de reagentes, solventes, vidrarias contaminadas e indicadores ambientais — em
              substituição à planilha de controle do LGRP.
            </motion.p>

            <ul className="mt-9 space-y-4">
              {DESTAQUES.map((d, i) => (
                <motion.li
                  key={d.titulo}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.16 + i * 0.08 }}
                  className="flex items-start gap-3.5"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-forest-300">
                    {d.icone}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{d.titulo}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-forest-100/60">{d.texto}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-6">
            <p className="text-[11px] leading-relaxed text-forest-200/50">
              Universidade Pública Federal
              <br />
              Pró-Reitoria de Pesquisa · Departamento de Química
            </p>
            <p className="text-right text-[11px] leading-relaxed text-forest-200/50">
              v2.4 · Ambiente de produção
              <br />Acesso restrito a servidores autorizados
            </p>
          </div>
        </div>
      </div>

      {/* Formulário */}
      <div className="flex items-center justify-center px-5 py-12 sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[26rem]"
        >
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-forest-600 to-forest-800">
              <Beaker className="h-6 w-6 text-white" />
            </span>
            <div>
              <p className="font-display text-lg font-bold leading-none text-ink-900">LGRP</p>
              <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-ink-500">
                Gestão de Resíduos Químicos
              </p>
            </div>
          </div>

          <h2 className="font-display text-2xl font-bold tracking-tight text-ink-900">
            Acessar o sistema
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
            Utilize suas credenciais institucionais para acessar o painel de gestão de resíduos.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>

            <div>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <Input
                  className="pl-9"
                  type="email"
                  placeholder="E-mail institucional"
                  value={email}
                  invalid={!!errosCampo.email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              {errosCampo.email && (
                <p className="mt-1 text-[11px] font-medium text-brick-600">{errosCampo.email}</p>
              )}
            </div>

            <div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <Input
                  className="pl-9 pr-10"
                  type={verSenha ? 'text' : 'password'}
                  placeholder="Senha"
                  value={senha}
                  invalid={!!errosCampo.senha}
                  onChange={(e) => setSenha(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setVerSenha((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-ink-400 transition hover:text-ink-700"
                  aria-label={verSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {verSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errosCampo.senha && (
                <p className="mt-1 text-[11px] font-medium text-brick-600">{errosCampo.senha}</p>
              )}
            </div>

            {erro && (
              <div className="flex items-start gap-2.5 rounded-lg border border-brick-200 bg-brick-50 px-3.5 py-2.5">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-brick-600" />
                <p className="text-xs leading-relaxed text-brick-700">{erro}</p>
              </div>
            )}
            {aviso && (
              <div className="flex items-start gap-2.5 rounded-lg border border-forest-200 bg-forest-50 px-3.5 py-2.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" />
                <p className="text-xs leading-relaxed text-forest-800">{aviso}</p>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" loading={enviando}>
              Entrar no sistema
              {!enviando && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <button
            type="button"
            onClick={solicitarLinkSenha}
            disabled={enviandoLink}
            className="mt-3 w-full text-center text-xs font-medium text-forest-700 transition hover:text-forest-900 disabled:opacity-60"
          >
            {enviandoLink ? 'Enviando...' : 'Esqueci ou preciso configurar minha senha'}
          </button>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-ink-200" />
            <span className="text-[11px] font-medium uppercase tracking-wider text-ink-400">ou</span>
            <span className="h-px flex-1 bg-ink-200" />
          </div>

          <button
            type="button"
            onClick={() => signInWithGoogle()}
            className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-ink-200 bg-white text-sm font-medium text-ink-700 transition hover:border-ink-300 hover:bg-ink-50"
          >
            <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continuar com Google
            {enviando && <Loader2 className="h-4 w-4 animate-spin text-ink-400" />}
          </button>

          <p className="mt-8 text-center text-[11px] leading-relaxed text-ink-400">
            Acesso monitorado e registrado. Toda operação realizada nesta plataforma é armazenada na
            trilha de auditoria do LGRP, conforme política institucional de segurança da informação.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
