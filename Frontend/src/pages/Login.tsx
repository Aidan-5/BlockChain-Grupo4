import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';

const Login = ({ onLogin }: { onLogin: (user: any) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axios.post('http://localhost:3000/auth/login', { email, password });
      localStorage.setItem('token', response.data.access_token);
      onLogin(response.data.user);
      
      if (response.data.user.rol === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="container flex-center" style={{ minHeight: '60vh' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 className="gradient-text" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Iniciar Sesión</h2>
        
        {error && <div style={{ color: 'var(--error)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group">
            <label>Correo Electrónico</label>
            <input type="email" className="glass-input" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Contraseña</label>
            <input type="password" className="glass-input" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            <LogIn size={18} /> Entrar
          </button>
        </form>
        
        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          ¿No tienes una cuenta? <Link to="/registro" style={{ color: 'var(--primary)' }}>Crea una aquí</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
