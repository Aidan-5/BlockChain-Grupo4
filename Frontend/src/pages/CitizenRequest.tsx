import React, { useState } from 'react';
import axios from 'axios';
import { Send, FileCheck } from 'lucide-react';

const CitizenRequest = ({ user }: { user: any }) => {
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    edad: '',
    fechaNacimiento: '',
    sexo: 'Hombre',
    lugarNacimiento: ''
  });
  const [success, setSuccess] = useState<{ hash: string; cedula: string } | null>(null);
  const [error, setError] = useState('');

  const generarCedula = (): string => {
    // Generate a random 10-digit cedula
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return setError('Debes iniciar sesión para solicitar una identidad');
    setError('');

    const cedulaGenerada = generarCedula();

    try {
      const res = await axios.post('http://localhost:3000/solicitudes', {
        usuarioId: user.id,
        tipoCredencial: 'Cédula de Identidad',
        datosJSON: JSON.stringify({ ...formData, cedula: cedulaGenerada })
      });
      setSuccess({ hash: res.data.hashTemporal, cedula: cedulaGenerada });
      setFormData({ nombres: '', apellidos: '', edad: '', fechaNacimiento: '', sexo: 'Hombre', lugarNacimiento: '' });
    } catch (e: any) {
      setError(e.response?.data?.message || 'Error al enviar solicitud');
    }
  };

  if (!user) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '3rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>Debes <a href="/login" style={{ color: 'var(--primary)' }}>iniciar sesión</a> para solicitar tu identidad oficial.</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '700px' }}>
      <h2 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '2rem' }}>Solicitar Identidad Oficial</h2>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Completa este formulario. Al enviarlo, el sistema generará tu número de cédula automáticamente. Cuando el Administrador apruebe tu solicitud, recibirás tu clave privada en tu Billetera.
        </p>

        {error && <div style={{ color: 'var(--error)', marginBottom: '1rem' }}>{error}</div>}

        {success && (
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--accent)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
            <FileCheck size={28} color="var(--accent)" style={{ marginBottom: '0.75rem' }} />
            <p style={{ color: 'var(--accent)', fontWeight: 600, marginBottom: '0.5rem' }}>¡Solicitud enviada exitosamente!</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Tu Número de Cédula Asignado:</p>
            <p style={{ fontFamily: 'monospace', fontSize: '1.2rem', color: 'var(--text-main)', letterSpacing: '0.1em', marginBottom: '1rem' }}>{success.cedula}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Hash de Seguimiento:</p>
            <p style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--primary)', wordBreak: 'break-all' }}>{success.hash}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '1rem' }}>Guarda este hash. Tu clave privada aparecerá en tu Billetera cuando el Administrador apruebe la solicitud.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="input-group">
            <label>Primer Nombre</label>
            <input type="text" className="glass-input" value={formData.nombres} placeholder="Ej: Juan Carlos" onChange={e => setFormData({ ...formData, nombres: e.target.value })} required />
          </div>
          <div className="input-group">
            <label>Dos Apellidos</label>
            <input type="text" className="glass-input" value={formData.apellidos} placeholder="Ej: García López" onChange={e => setFormData({ ...formData, apellidos: e.target.value })} required />
          </div>
          <div className="input-group">
            <label>Edad</label>
            <input type="number" className="glass-input" value={formData.edad} min="1" max="120" onChange={e => setFormData({ ...formData, edad: e.target.value })} required />
          </div>
          <div className="input-group">
            <label>Fecha de Nacimiento</label>
            <input type="date" className="glass-input" value={formData.fechaNacimiento} onChange={e => setFormData({ ...formData, fechaNacimiento: e.target.value })} required />
          </div>
          <div className="input-group">
            <label>Sexo</label>
            <select className="glass-input" value={formData.sexo} onChange={e => setFormData({ ...formData, sexo: e.target.value })}>
              <option value="Hombre" style={{ color: 'black' }}>Hombre</option>
              <option value="Mujer" style={{ color: 'black' }}>Mujer</option>
            </select>
          </div>
          <div className="input-group">
            <label>Lugar de Nacimiento</label>
            <input type="text" className="glass-input" value={formData.lugarNacimiento} placeholder="Ej: Quito, Ecuador" onChange={e => setFormData({ ...formData, lugarNacimiento: e.target.value })} required />
          </div>

          <button type="submit" className="btn btn-primary" style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
            <Send size={18} /> Enviar Solicitud a la Red
          </button>
        </form>
      </div>
    </div>
  );
};

export default CitizenRequest;
