import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Beaker, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f2f5f3]">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-forest-600 to-forest-800 shadow-lg shadow-forest-900/25">
          <Beaker className="h-7 w-7 text-white" />
        </span>
        <div className="flex items-center gap-2 text-sm text-ink-500">
          <Loader2 className="h-4 w-4 animate-spin text-forest-600" />
          Verificando credenciais institucionais...
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
