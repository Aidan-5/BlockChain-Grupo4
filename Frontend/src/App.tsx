import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Wallet as WalletIcon, ShieldCheck, Building2, LogIn, UserCircle, LogOut } from 'lucide-react';
import './App.css';

import Wallet from './pages/Wallet';
import Issuer from './pages/Issuer';
import Verifier from './pages/Verifier';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import CitizenRequest from './pages/CitizenRequest';

function App() {
  const [user, setUser] = useState<{ nombre: string; rol: string } | null>(null);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <BrowserRouter>
      <header className="glass-panel" style={{ margin: '1rem 2rem', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ background: 'var(--primary)', padding: '0.5rem', borderRadius: '8px', display: 'flex' }}>
            <ShieldCheck size={24} color="white" />
          </div>
          <h1 style={{ fontSize: '1.25rem', margin: 0 }}>Ecuador SSI</h1>
        </div>
        
        <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {user?.rol !== 'ADMIN' && (
            <Link to="/" className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
              <WalletIcon size={18} /> Billetera
            </Link>
          )}
          
          {user?.rol !== 'ADMIN' && (
            <Link to="/solicitar" className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
              <UserCircle size={18} /> Solicitar Identidad
            </Link>
          )}

          {user?.rol !== 'ADMIN' && (
            <Link to="/verificador" className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
              <ShieldCheck size={18} /> Verificador
            </Link>
          )}
          
          <div style={{ width: '1px', height: '24px', background: 'var(--glass-border)', margin: '0 0.5rem' }}></div>

          {user ? (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              {user.rol === 'ADMIN' && (
                <Link to="/admin" className="btn" style={{ background: 'var(--accent)', color: 'white', padding: '0.5rem 1rem' }}>
                  Panel Admin
                </Link>
              )}
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Hola, {user.nombre}</span>
              <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '0.5rem', borderColor: 'var(--error)', color: 'var(--error)' }}>
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
          <Route path="/solicitar" element={<CitizenRequest user={user} />} />
          <Route path="/emisor" element={<Issuer />} />
          <Route path="/verificador" element={<Verifier />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/login" element={<Login onLogin={setUser} />} />
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
