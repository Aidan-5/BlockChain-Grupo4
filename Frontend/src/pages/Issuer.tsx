import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Send, FileText, CheckCircle } from 'lucide-react';

const Issuer = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    usuarioId: '',
    institucionId: ''
  });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, instRes] = await Promise.all([
        axios.get('http://localhost:3000/users'),
        axios.get('http://localhost:3000/institutions')
      ]);
      setUsers(usersRes.data);
      setInstitutions(instRes.data);
      if(instRes.data.length > 0) {
        setFormData(prev => ({...prev, institucionId: instRes.data[0].id}));
      }
    } catch (error) {
      console.error('Error fetching data for issuer form', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    try {
      await axios.post('http://localhost:3000/credentials', {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        usuarioId: parseInt(formData.usuarioId),
        institucionId: parseInt(formData.institucionId)
      });
      setSuccessMsg('¡Credencial emitida y registrada en Blockchain con éxito!');
      setFormData({ ...formData, titulo: '', descripcion: '', usuarioId: '' });
    } catch (error) {
      console.error('Error emitting credential', error);
      alert('Error al emitir la credencial. Verifica que la blockchain esté corriendo o revisa los logs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <h2 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '2rem' }}>Dashboard de Emisión</h2>
      
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={20} color="var(--primary)" /> Nueva Credencial Verificable
        </h3>
        
        {successMsg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--accent)', padding: '1rem', borderRadius: '8px', color: 'var(--accent)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={20} /> {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group">
            <label>Institución Emisora</label>
            <select 
              className="glass-input" 
              value={formData.institucionId}
              onChange={(e) => setFormData({...formData, institucionId: e.target.value})}
              required
            >
              {institutions.map(inst => (
                <option key={inst.id} value={inst.id} style={{ color: 'black' }}>{inst.nombre}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>Ciudadano (Titular)</label>
            <select 
              className="glass-input" 
              value={formData.usuarioId}
              onChange={(e) => setFormData({...formData, usuarioId: e.target.value})}
              required
            >
              <option value="" style={{ color: 'black' }}>Seleccione un ciudadano...</option>
              {users.map(u => (
                <option key={u.id} value={u.id} style={{ color: 'black' }}>{u.nombre} - {u.identificacion}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>Título de la Credencial</label>
            <input 
              type="text" 
              className="glass-input" 
              placeholder="Ej. Certificado de Vacunación"
              value={formData.titulo}
              onChange={(e) => setFormData({...formData, titulo: e.target.value})}
              required
            />
          </div>

          <div className="input-group">
            <label>Descripción / Datos Adicionales</label>
            <textarea 
              className="glass-input" 
              rows={3} 
              placeholder="Detalles de la credencial..."
              value={formData.descripcion}
              onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary mt-4" disabled={loading}>
            {loading ? 'Emitiendo en Blockchain...' : <><Send size={18} /> Emitir Credencial</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Issuer;
