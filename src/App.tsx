import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Pedidos from './pages/Pedidos';
import Tratamentos from './pages/Tratamentos';
import Solventes from './pages/Solventes';
import Reagentes from './pages/Reagentes';
import Vidrarias from './pages/Vidrarias';
import Indicadores from './pages/Indicadores';
import Relatorios from './pages/Relatorios';
import Rastreabilidade from './pages/Rastreabilidade';
import Notificacoes from './pages/Notificacoes';
import Usuarios from './pages/Usuarios';
import RedefinirSenha from './pages/RedefinirSenha';

function Rota({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/redefinir-senha" element={<RedefinirSenha />} />
        <Route path="/" element={<Rota><Dashboard /></Rota>} />
        <Route path="/pedidos" element={<Rota><Pedidos /></Rota>} />
        <Route path="/tratamentos" element={<Rota><Tratamentos /></Rota>} />
        <Route path="/solventes" element={<Rota><Solventes /></Rota>} />
        <Route path="/reagentes" element={<Rota><Reagentes /></Rota>} />
        <Route path="/vidrarias" element={<Rota><Vidrarias /></Rota>} />
        <Route path="/indicadores" element={<Rota><Indicadores /></Rota>} />
        <Route path="/relatorios" element={<Rota><Relatorios /></Rota>} />
        <Route path="/rastreabilidade" element={<Rota><Rastreabilidade /></Rota>} />
        <Route path="/notificacoes" element={<Rota><Notificacoes /></Rota>} />
        <Route path="/usuarios" element={<Rota><Usuarios /></Rota>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
