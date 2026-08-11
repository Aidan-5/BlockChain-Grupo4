import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Wallet as WalletIcon, ShieldCheck, LogIn, UserCircle, LogOut, Landmark, Search } from 'lucide-react';
import './App.css';

import Wallet from './pages/Wallet';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import InstitutionDashboard from './pages/InstitutionDashboard';
import CitizenRequest from './pages/CitizenRequest';
import Verifier from './pages/Verifier';
import ProtectedRoute from './components/ProtectedRoute';
import NotificationBell from './components/NotificationBell';

interface AuthUser {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}

function App() {
  // Rehidrata la sesión desde localStorage al montar: antes solo se guardaba
  // el token, así que un refresh de página dejaba la UI "deslogueada" aunque
  // el token siguiera siendo válido.
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('user');
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  });

  const handleLogin = (userData: AuthUser) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const isCiudadanoOGuest = !user || user.rol === 'CIUDADANO';

  return (
    <BrowserRouter>
      <header className="glass-panel" style={{ margin: '1rem 2rem', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ background: 'var(--primary)', padding: '0.5rem', borderRadius: '8px', display: 'flex' }}>
            <ShieldCheck size={24} color="white" />
          </div>
          <h1 style={{ fontSize: '1.25rem', margin: 0 }}>Ecuador SSI</h1>
        </div>

        <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {isCiudadanoOGuest && (
            <Link to="/" className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
              <WalletIcon size={18} /> Billetera
            </Link>
          )}

          {isCiudadanoOGuest && (
            <Link to="/solicitar" className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
              <UserCircle size={18} /> Solicitar Identidad
            </Link>
          )}

          <Link to="/verificar" className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
            <Search size={18} /> Verificar
          </Link>

          <div style={{ width: '1px', height: '24px', background: 'var(--glass-border)', margin: '0 0.5rem' }}></div>

          {user ? (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <NotificationBell user={user} />
              {user.rol === 'ADMIN' && (
                <Link to="/admin" className="btn btn-accent" style={{ padding: '0.5rem 1rem' }}>
                  Panel Admin
                </Link>
              )}
              {user.rol === 'INSTITUCION' && (
                <Link to="/institucion" className="btn btn-accent" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Landmark size={16} /> Panel Institución
                </Link>
              )}
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Hola, {user.nombre}</span>
              <button onClick={handleLogout} className="btn btn-danger" style={{ padding: '0.5rem' }}>
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary" style={{ padding: '0.5rem 1.5rem' }}>
              <LogIn size={18} /> Iniciar Sesión
            </Link>
          )}
        </nav>
      </header>

      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Wallet user={user} />} />
          <Route
            path="/solicitar"
            element={
              <ProtectedRoute user={user} allowedRoles={['CIUDADANO']}>
                <CitizenRequest user={user} />
              </ProtectedRoute>
            }
          />
          <Route path="/verificar" element={<Verifier />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute user={user} allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/institucion"
            element={
              <ProtectedRoute user={user} allowedRoles={['INSTITUCION']}>
                <InstitutionDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/registro" element={<Register />} />
        </Routes>
      </main>

      <footer style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        Identidad Digital Descentralizada y Soberanía mediante Tecnología Blockchain © 2026
      </footer>
    </BrowserRouter>
  );
}

export default App;
