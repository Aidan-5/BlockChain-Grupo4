import { useEffect, useState } from 'react';
import {
  CheckCircle, Clock, Key, History, Search, Filter,
  Users, Pencil, Trash2, X, Save, Send, Ban, CheckCircle2, XCircle,
} from 'lucide-react';
import apiClient from '../config/axios';
import Issuer from './Issuer';

type Tab = 'pendientes' | 'historial' | 'usuarios' | 'emitir';
type HistorialFiltro = 'APROBADA' | 'RECHAZADA';

// Panel de la institución autenticada (rol INSTITUCION). Reúne lo que antes
// vivía repartido en el AdminDashboard genérico (aprobar solicitudes) más
// gestión de ciudadanos y emisión de credenciales, todo scoped a la propia
// institución vía el JWT — nunca se elige otra institución en un combo.
const InstitutionDashboard = () => {
  const [activeTab, setActiveTab] = useState<Tab>('pendientes');

  // Solicitudes
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [historial, setHistorial] = useState<any[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [aprobando, setAprobando] = useState<number | null>(null);
  const [rechazando, setRechazando] = useState<number | null>(null);
  const [resultadoAprobacion, setResultadoAprobacion] = useState<{ cedula: string; clave: string; nombre: string; credencialId: number } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [historialFiltroEstado, setHistorialFiltroEstado] = useState<HistorialFiltro>('APROBADA');

  // Usuarios / ciudadanos
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ nombre: '', identificacion: '', email: '', wallet: '' });
  const [savingUser, setSavingUser] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [togglingUserId, setTogglingUserId] = useState<number | null>(null);
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => {
    fetchSolicitudes();
    fetchHistorial();
    fetchUsuarios();
  }, []);

  const fetchSolicitudes = async () => {
    try {
      const res = await apiClient.get('/solicitudes/pendientes');
      setSolicitudes(res.data);
    } catch (e) {
      console.error('Error cargando solicitudes pendientes', e);
    }
  };

  const fetchHistorial = async () => {
    setLoadingHistorial(true);
    try {
      const res = await apiClient.get('/solicitudes/historial');
      setHistorial(res.data);
    } catch (e) {
      console.error('Error cargando historial de solicitudes', e);
    } finally {
      setLoadingHistorial(false);
    }
  };

  const fetchUsuarios = async () => {
    setLoadingUsuarios(true);
    try {
      const res = await apiClient.get('/users');
      setUsuarios(res.data);
    } catch (e) {
      console.error('Error cargando usuarios', e);
    } finally {
      setLoadingUsuarios(false);
    }
  };

  const aprobar = async (solicitud: any) => {
    setAprobando(solicitud.id);
    try {
      const res = await apiClient.put(`/solicitudes/${solicitud.id}/aprobar`, {});
      let datos: any = {};
      try { datos = JSON.parse(solicitud.datosJSON); } catch (e) { /* noop */ }
      setResultadoAprobacion({
        cedula: res.data.cedulaAsociada,
        clave: res.data.clavePrivadaAsignada,
        nombre: datos.nombres ? `${datos.nombres} ${datos.apellidos || ''}` : solicitud.usuario.nombre,
        credencialId: res.data.credencialId,
      });
      fetchSolicitudes();
      fetchHistorial();
    } catch (e) {
      alert('Error al aprobar la solicitud');
    } finally {
      setAprobando(null);
    }
  };

  const rechazar = async (solicitud: any) => {
    const respuesta = window.prompt('Motivo del rechazo (opcional):');
    if (respuesta === null) return; // el usuario canceló el prompt
    const motivo = respuesta.trim() || undefined;
    setRechazando(solicitud.id);
    try {
      await apiClient.put(`/solicitudes/${solicitud.id}/rechazar`, { motivo });
      setSolicitudes(prev => prev.filter(s => s.id !== solicitud.id));
      fetchHistorial();
    } catch (e) {
      alert('Error al rechazar la solicitud');
    } finally {
      setRechazando(null);
    }
  };

  const startEditUser = (u: any) => {
    setEditingUser(u);
    setEditForm({
      nombre: u.nombre || '',
      identificacion: u.identificacion || '',
      email: u.email || '',
      wallet: u.wallet || '',
    });
  };

  const cancelEditUser = () => {
    setEditingUser(null);
  };

  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSavingUser(true);
    try {
      const payload: any = {
        nombre: editForm.nombre,
        identificacion: editForm.identificacion,
        email: editForm.email,
      };
      if (editForm.wallet.trim()) payload.wallet = editForm.wallet.trim();

      const res = await apiClient.patch(`/users/${editingUser.id}`, payload);
      setUsuarios(prev => prev.map(u => (u.id === editingUser.id ? res.data : u)));
      setEditingUser(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al actualizar el ciudadano');
    } finally {
      setSavingUser(false);
    }
  };

  const deleteUser = async (u: any) => {
    if (!window.confirm(`¿Eliminar al ciudadano "${u.nombre}"? Esta acción no se puede deshacer.`)) return;
    setDeletingUserId(u.id);
    try {
      await apiClient.delete(`/users/${u.id}`);
      setUsuarios(prev => prev.filter(x => x.id !== u.id));
    } catch (e) {
      alert('Error al eliminar el ciudadano');
    } finally {
      setDeletingUserId(null);
    }
  };

  const toggleUserActivo = async (u: any) => {
    setTogglingUserId(u.id);
    try {
      const res = await apiClient.patch(`/users/${u.id}`, { activo: !u.activo });
      setUsuarios(prev => prev.map(x => (x.id === u.id ? { ...x, ...res.data } : x)));
    } catch (e) {
      alert('Error al cambiar el estado del ciudadano');
    } finally {
      setTogglingUserId(null);
    }
  };

  // Filtrado de historial: por estado (Aprobadas / No Aprobadas) + buscador de texto, combinados
  const historialFiltrado = historial.filter(s => {
    if (s.estado !== historialFiltroEstado) return false;
    let datos: any = {};
    try { datos = JSON.parse(s.datosJSON); } catch (e) { /* noop */ }
    const query = searchTerm.toLowerCase();
    const nombre = (datos.nombres ? `${datos.nombres} ${datos.apellidos}` : s.usuario.nombre || '').toLowerCase();
    const email = (s.usuario.email || '').toLowerCase();
    const cedula = (datos.cedula || '').toLowerCase();
    const estado = (s.estado || '').toLowerCase();
    const lugar = (datos.lugarNacimiento || '').toLowerCase();
    return nombre.includes(query) || email.includes(query) || cedula.includes(query) || estado.includes(query) || lugar.includes(query);
  });

  const usuariosFiltrados = usuarios.filter(u => {
    const q = userSearch.toLowerCase();
    return (u.nombre || '').toLowerCase().includes(q)
      || (u.email || '').toLowerCase().includes(q)
      || (u.identificacion || '').toLowerCase().includes(q);
  });

  const totalAprobadas = historial.filter(h => h.estado === 'APROBADA').length;

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'pendientes', label: 'Solicitudes Pendientes', icon: <Clock size={18} />, count: solicitudes.length },
    { key: 'historial', label: 'Historial de Solicitudes', icon: <History size={18} />, count: historial.length },
    { key: 'usuarios', label: 'Ciudadanos', icon: <Users size={18} />, count: usuarios.length },
    { key: 'emitir', label: 'Emitir Credencial', icon: <Send size={18} /> },
  ];

  return (
    <div className="container">
      <div style={{ marginBottom: '2rem' }}>
        <h2 className="gradient-text" style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>
          Panel de Institución
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Gestiona solicitudes de identidad, ciudadanos y emisión de credenciales de tu institución.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <Clock size={32} color="var(--accent-text)" style={{ marginBottom: '0.5rem' }} />
          <p style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--text-main)', margin: '0.2rem 0' }}>{solicitudes.length}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Solicitudes Pendientes</p>
        </div>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <CheckCircle size={32} color="var(--primary)" style={{ marginBottom: '0.5rem' }} />
          <p style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--text-main)', margin: '0.2rem 0' }}>{totalAprobadas}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Solicitudes Aprobadas</p>
        </div>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <Users size={32} color="var(--primary-light)" style={{ marginBottom: '0.5rem' }} />
          <p style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--text-main)', margin: '0.2rem 0' }}>{usuarios.length}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Ciudadanos Registrados</p>
        </div>
      </div>

      {/* Panel de Notificación de Aprobación */}
      {resultadoAprobacion && (
        <div className="glass-card" style={{ marginBottom: '2rem', border: '1px solid var(--primary-light)', background: 'var(--surface)', boxShadow: '0 8px 24px rgba(0, 51, 160, 0.12)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--glass-border)' }}>
            <Key size={24} color="var(--primary)" />
            <h3 style={{ color: 'var(--primary)', margin: 0, fontSize: '1.25rem' }}>
              Solicitud Aprobada — Cédula Generada
            </h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block', fontWeight: 600 }}>Ciudadano</span>
              <strong style={{ color: 'var(--text-main)', fontSize: '1.05rem' }}>{resultadoAprobacion.nombre}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block', fontWeight: 600 }}>Cédula Asignada (Algoritmo Oficial)</span>
              <span style={{ fontFamily: 'monospace', color: 'var(--primary)', fontSize: '1.2rem', fontWeight: 'bold', letterSpacing: '0.08em' }}>
                {resultadoAprobacion.cedula}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block', fontWeight: 600 }}>ID Público de Credencial</span>
              <span className="badge-primary">
                ID #{resultadoAprobacion.credencialId}
              </span>
            </div>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: 'var(--bg-mid)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', margin: '1rem 0 0 0' }}>
            ✅ La Cédula de Identidad y la clave privada fueron emitidas y asignadas exitosamente en la Billetera del ciudadano.
          </p>

          <button onClick={() => setResultadoAprobacion(null)} className="btn btn-outline" style={{ marginTop: '1rem', fontSize: '0.85rem' }}>
            Cerrar Notificación
          </button>
        </div>
      )}

      {/* Pestañas de Navegación del Panel */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem', flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`btn ${activeTab === t.key ? 'btn-primary' : 'btn-outline'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem' }}
          >
            {t.icon} {t.label}{typeof t.count === 'number' ? ` (${t.count})` : ''}
          </button>
        ))}
      </div>

      {/* SECCIÓN 1: SOLICITUDES PENDIENTES */}
      {activeTab === 'pendientes' && (
        <div>
          <h3 style={{ color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.15rem', fontWeight: 600 }}>
            <Clock size={20} color="var(--primary)" /> Solicitudes por Aprobar
          </h3>

          {solicitudes.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3.5rem', textAlign: 'center' }}>
              <CheckCircle size={48} color="var(--primary)" style={{ marginBottom: '1rem', opacity: 0.7 }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>No hay solicitudes pendientes. ¡Todo al día!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {solicitudes.map(s => {
                let datos: any = {};
                try { datos = JSON.parse(s.datosJSON); } catch (e) { /* noop */ }
                return (
                  <div key={s.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
                    <div>
                      <h4 style={{ color: 'var(--text-main)', marginBottom: '0.35rem', fontSize: '1.1rem', fontWeight: 600 }}>
                        {datos.nombres ? `${datos.nombres} ${datos.apellidos || ''}` : s.usuario.nombre}
                      </h4>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                        <Clock size={14} style={{ marginRight: '4px', verticalAlign: '-2px' }} />
                        {s.tipoCredencial} · Solicitado por: <em>{s.usuario.email}</em>
                      </p>
                      {datos.lugarNacimiento && (
                        <p style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600 }}>
                          📍 {datos.lugarNacimiento} · {datos.sexo} · {datos.edad ? `${datos.edad} años` : ''} {datos.fechaNacimiento ? `(F.Nac: ${datos.fechaNacimiento})` : ''}
                        </p>
                      )}
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'monospace', marginTop: '0.4rem' }}>
                        Hash: {s.hashTemporal?.slice(0, 32)}...
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-primary"
                        onClick={() => aprobar(s)}
                        disabled={aprobando === s.id || rechazando === s.id}
                        style={{ minWidth: '150px', padding: '0.75rem 1.25rem' }}
                      >
                        <CheckCircle size={18} />
                        {aprobando === s.id ? 'Aprobando...' : 'Aceptar Solicitud'}
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => rechazar(s)}
                        disabled={aprobando === s.id || rechazando === s.id}
                        style={{ minWidth: '120px', padding: '0.75rem 1.25rem' }}
                      >
                        <XCircle size={18} />
                        {rechazando === s.id ? 'Rechazando...' : 'Rechazar'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECCIÓN 2: HISTORIAL GENERAL DE SOLICITUDES */}
      {activeTab === 'historial' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <h3 style={{ color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.15rem', fontWeight: 600 }}>
              <History size={20} color="var(--primary)" /> Historial General de Registros
            </h3>

            <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="glass-input"
                placeholder="Buscar por nombre, cédula, estado..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.5rem', fontSize: '0.88rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <button
              className={`btn ${historialFiltroEstado === 'APROBADA' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setHistorialFiltroEstado('APROBADA')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
            >
              <CheckCircle size={15} /> Aprobadas ({historial.filter(h => h.estado === 'APROBADA').length})
            </button>
            <button
              className={`btn ${historialFiltroEstado === 'RECHAZADA' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setHistorialFiltroEstado('RECHAZADA')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
            >
              <XCircle size={15} /> No Aprobadas ({historial.filter(h => h.estado === 'RECHAZADA').length})
            </button>
          </div>

          {loadingHistorial ? (
            <p style={{ color: 'var(--text-muted)' }}>Cargando historial...</p>
          ) : historialFiltrado.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
              <Filter size={40} color="var(--text-muted)" style={{ marginBottom: '0.75rem', opacity: 0.6 }} />
              <p style={{ color: 'var(--text-muted)' }}>No se encontraron registros en el historial.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {historialFiltrado.map(s => {
                let datos: any = {};
                try { datos = JSON.parse(s.datosJSON); } catch (e) { /* noop */ }
                const isApproved = s.estado === 'APROBADA';
                const isRechazada = s.estado === 'RECHAZADA';

                return (
                  <div key={s.id} className="glass-card" style={{ border: `1px solid ${isApproved ? 'var(--glass-border-strong)' : 'var(--glass-border)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                      <div>
                        <h4 style={{ color: 'var(--text-main)', margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
                          {datos.nombres ? `${datos.nombres} ${datos.apellidos || ''}` : s.usuario.nombre}
                        </h4>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          Usuario: {s.usuario.email} · Registrado el: {new Date(s.createdAt).toLocaleDateString()} {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <span className={isApproved ? 'badge-primary' : isRechazada ? 'badge-error' : 'badge-warning'}>
                        {isApproved ? '✓ APROBADA' : isRechazada ? '✗ RECHAZADA' : '⏳ PENDIENTE'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Cédula Asignada</span>
                        <span style={{ fontFamily: 'monospace', color: isApproved ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 'bold', fontSize: '1rem' }}>
                          {datos.cedula || 'Pendiente de emisión'}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Lugar de Nacimiento</span>
                        <span style={{ color: 'var(--text-main)' }}>{datos.lugarNacimiento || 'No especificado'}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Edad / Fecha Nac.</span>
                        <span style={{ color: 'var(--text-main)' }}>
                          {datos.edad ? `${datos.edad} años` : ''} {datos.fechaNacimiento ? `(${datos.fechaNacimiento})` : ''}
                        </span>
                      </div>
                    </div>

                    <div style={{ background: 'var(--bg-mid)', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                      Hash: {s.hashTemporal}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECCIÓN 3: CIUDADANOS */}
      {activeTab === 'usuarios' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <h3 style={{ color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.15rem', fontWeight: 600 }}>
              <Users size={20} color="var(--primary)" /> Ciudadanos Registrados
            </h3>

            <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="glass-input"
                placeholder="Buscar por nombre, email, cédula..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                style={{ paddingLeft: '2.5rem', fontSize: '0.88rem' }}
              />
            </div>
          </div>

          {editingUser && (
            <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '1.5rem', border: '1px solid var(--primary-light)' }}>
              <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Pencil size={18} color="var(--primary)" /> Editar Ciudadano: {editingUser.nombre}
              </h4>
              <form onSubmit={saveUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label>Nombre</label>
                    <input className="glass-input" value={editForm.nombre} onChange={e => setEditForm({ ...editForm, nombre: e.target.value })} required />
                  </div>
                  <div className="input-group">
                    <label>Identificación</label>
                    <input className="glass-input" value={editForm.identificacion} onChange={e => setEditForm({ ...editForm, identificacion: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label>Email</label>
                    <input type="email" className="glass-input" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} required />
                  </div>
                  <div className="input-group">
                    <label>Wallet (0x...)</label>
                    <input className="glass-input" value={editForm.wallet} onChange={e => setEditForm({ ...editForm, wallet: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="submit" className="btn btn-primary" disabled={savingUser} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Save size={16} /> {savingUser ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                  <button type="button" className="btn btn-outline" onClick={cancelEditUser} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <X size={16} /> Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {loadingUsuarios ? (
            <p style={{ color: 'var(--text-muted)' }}>Cargando ciudadanos...</p>
          ) : usuariosFiltrados.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
              <Users size={40} color="var(--text-muted)" style={{ marginBottom: '0.75rem', opacity: 0.6 }} />
              <p style={{ color: 'var(--text-muted)' }}>No se encontraron ciudadanos.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '0.85rem' }}>
              {usuariosFiltrados.map(u => (
                <div key={u.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                      <h4 style={{ color: 'var(--text-main)', margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>
                        {u.nombre}
                      </h4>
                      <span
                        className={u.activo !== false ? 'badge-primary' : 'badge-warning'}
                        style={u.activo !== false ? { background: 'rgba(22, 163, 74, 0.10)', color: 'var(--success)', borderColor: 'rgba(22, 163, 74, 0.35)' } : undefined}
                      >
                        {u.activo !== false ? 'Activo' : 'Suspendido'}
                      </span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                      {u.email} {u.identificacion ? `· Cédula: ${u.identificacion}` : ''}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-outline" onClick={() => startEditUser(u)} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Pencil size={15} /> Editar
                    </button>
                    <button
                      className="btn btn-outline"
                      onClick={() => toggleUserActivo(u)}
                      disabled={togglingUserId === u.id}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      {u.activo !== false ? <Ban size={15} /> : <CheckCircle2 size={15} />}
                      {togglingUserId === u.id ? 'Actualizando...' : u.activo !== false ? 'Suspender' : 'Reactivar'}
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => deleteUser(u)}
                      disabled={deletingUserId === u.id}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Trash2 size={15} /> {deletingUserId === u.id ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECCIÓN 4: EMISIÓN DE CREDENCIALES */}
      {activeTab === 'emitir' && (
        <div style={{ margin: '-1rem' }}>
          <Issuer />
        </div>
      )}
    </div>
  );
};

export default InstitutionDashboard;
