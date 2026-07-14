import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({ nombre: '', email: '', identificacion: '', password: '', codigoSecreto: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('http://localhost:3000/auth/register', formData);
      setSuccess('Cuenta creada exitosamente. ' + (res.data.rol === 'ADMIN' ? '¡Eres Administrador!' : ''));
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrar');
    }
  };

  return (
    <div className="container flex-center" style={{ minHeight: '60vh' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '500px' }}>
        <h2 className="gradient-text" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Crear Cuenta</h2>
        
        {error && <div style={{ color: 'var(--error)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
        {success && <div style={{ color: 'var(--accent)', marginBottom: '1rem', textAlign: 'center' }}>{success}</div>}
        
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group">
            <label>Nombre Completo</label>
            <input type="text" className="glass-input" onChange={e => setFormData({...formData, nombre: e.target.value})} required />
          </div>
          <div className="input-group">
            <label>Correo Electrónico</label>
            <input type="email" className="glass-input" onChange={e => setFormData({...formData, email: e.target.value})} required />
          </div>
          <div className="input-group">
            <label>Contraseña</label>
            <input type="password" className="glass-input" onChange={e => setFormData({...formData, password: e.target.value})} required />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Registrarse</button>
        </form>
        
        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          ¿Ya tienes cuenta? <Link to="/login" style={{ color: 'var(--primary)' }}>Inicia sesión</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
