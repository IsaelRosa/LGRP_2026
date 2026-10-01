import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { apiGet, apiPost } from '../lib/api';

export type Perfil = {
  id: number | null;
  nome: string;
  email: string;
  papel: string;
  setor: string;
  crq: string;
  telefone: string;
  ativo: boolean;
};

type AuthCtx = {
  user: any | null;
  perfil: Perfil | null;
  session: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  podeEditar: boolean;
  podeGerenciarUsuarios: boolean;
};

const AuthContext = createContext<AuthCtx>({
  user: null,
  perfil: null,
  session: null,
  loading: true,
  signIn: async () => ({}),
  signOut: async () => {},
  podeEditar: true,
  podeGerenciarUsuarios: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ativo = true;
    const carregarSessao = async () => {
      const token = window.localStorage.getItem('lgrp_access_token');
      if (!token) {
        if (ativo) setLoading(false);
        return;
      }
      setSession({ access_token: token });
      try {
        const { user: atual } = await apiGet<{ user: Perfil }>('/api/auth/me');
        if (!ativo) return;
        setUser(atual);
        setPerfil(atual);
        setSession({ access_token: token, user: atual });
      } catch {
        window.localStorage.removeItem('lgrp_access_token');
        if (ativo) {
          setSession(null);
          setUser(null);
          setPerfil(null);
        }
      } finally {
        if (ativo) setLoading(false);
      }
    };
    const atualizarSessao = () => {
      setLoading(true);
      void carregarSessao();
    };
    void carregarSessao();
    window.addEventListener('lgrp-auth-change', atualizarSessao);
    window.addEventListener('storage', atualizarSessao);

    return () => {
      ativo = false;
      window.removeEventListener('lgrp-auth-change', atualizarSessao);
      window.removeEventListener('storage', atualizarSessao);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const resultado = await apiPost<{ token: string; user: Perfil }>('/api/auth/login', {
        email,
        password,
      });
      window.localStorage.setItem('lgrp_access_token', resultado.token);
      setSession({ access_token: resultado.token, user: resultado.user });
      setUser(resultado.user);
      setPerfil(resultado.user);
      return {};
    } catch (error) {
      return { error: traduzirErro(error instanceof Error ? error.message : String(error)) };
    }
  };

  const signOut = async () => {
    window.localStorage.removeItem('lgrp_access_token');
    setSession(null);
    setUser(null);
    setPerfil(null);
  };

  const papel = perfil?.papel || 'Consultor';
  const podeEditar = papel !== 'Consultor';
  const podeGerenciarUsuarios = papel === 'Administrador';

  return (
    <AuthContext.Provider
      value={{
        user,
        perfil,
        session,
        loading,
        signIn,
        signOut,
        podeEditar,
        podeGerenciarUsuarios,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function traduzirErro(msg: string) {
  const m = msg.toLowerCase();
  if (m.includes('invalid login credentials'))
    return 'E-mail ou senha inválidos. Verifique os dados e tente novamente.';
  if (m.includes('already registered')) return 'Este e-mail já está cadastrado. Faça login.';
  if (m.includes('password')) return 'A senha deve ter no mínimo 8 caracteres.';
  if (m.includes('email')) return 'Informe um endereço de e-mail válido.';
  if (m.includes('rate limit')) return 'Muitas tentativas. Aguarde alguns instantes.';
  return msg;
}

export const useAuth = () => useContext(AuthContext);
