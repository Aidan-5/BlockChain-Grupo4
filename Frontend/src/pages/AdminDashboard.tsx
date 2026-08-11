import { useEffect, useState } from 'react';
import axios from 'axios';
import { CheckCircle, Clock, ShieldCheck, Key, History, Search, Filter } from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'pendientes' | 'historial'>('pendientes');
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [historial, setHistorial] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [aprobando, setAprobando] = useState<number | null>(null);
  const [resultadoAprobacion, setResultadoAprobacion] = useState<{ cedula: string; clave: string; nombre: string; credencialId: number } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSolicitudes();
    fetchHistorial();
  }, []);

  const fetchSolicitudes = async () => {
    try {
      const res = await axios.get('http://localhost:3000/solicitudes/pendientes');
      setSolicitudes(res.data);
    } catch (e) {
      console.error('Error cargando solicitudes pendientes', e);
    }
  };

  const fetchHistorial = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:3000/solicitudes/historial');
      setHistorial(res.data);
    } catch (e) {
      console.error('Error cargando historial de solicitudes', e);
    } finally {
      setLoading(false);
    }
  };

  const aprobar = async (solicitud: any) => {
    setAprobando(solicitud.id);
    try {
      const res = await axios.put(`http://localhost:3000/solicitudes/${solicitud.id}/aprobar`, {});
      let datos: any = {};
      try { datos = JSON.parse(solicitud.datosJSON); } catch (e) {}
      setResultadoAprobacion({
        cedula: res.data.cedulaAsociada,
        clave: res.data.clavePrivadaAsignada,
        nombre: datos.nombres ? `${datos.nombres} ${datos.apellidos || ''}` : solicitud.usuario.nombre,
        credencialId: res.data.credencialId
      });
      fetchSolicitudes();
      fetchHistorial();
    } catch (e) {
      alert('Error al aprobar la solicitud');
    } finally {
      setAprobando(null);
    }
  };

  // Filtrado de historial
  const historialFiltrado = historial.filter(s => {
    let datos: any = {};
    try { datos = JSON.parse(s.datosJSON); } catch (e) {}
    const query = searchTerm.toLowerCase();
    const nombre = (datos.nombres ? `${datos.nombres} ${datos.apellidos}` : s.usuario.nombre || '').toLowerCase();
    const email = (s.usuario.email || '').toLowerCase();
    const cedula = (datos.cedula || '').toLowerCase();
    const estado = (s.estado || '').toLowerCase();
    const lugar = (datos.lugarNacimiento || '').toLowerCase();
    return nombre.includes(query) || email.includes(query) || cedula.includes(query) || estado.includes(query) || lugar.includes(query);
  });

  const totalAprobadas = historial.filter(h => h.estado === 'APROBADA').length;

  return (
    <div className="container">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 className="gradient-text" style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>
          Panel de Administrador
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Gestiona y aprueba las solicitudes de identidad ciudadana. Emisión oficial descentralizada.
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
          <ShieldCheck size={32} color="var(--primary-light)" style={{ marginBottom: '0.5rem' }} />
          <p style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--text-main)', margin: '0.2rem 0' }}>{historial.length}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Total Historial en Blockchain</p>
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
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
        <button
          onClick={() => setActiveTab('pendientes')}
          className={`btn ${activeTab === 'pendientes' ? 'btn-primary' : 'btn-outline'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem' }}
        >
          <Clock size={18} /> Solicitudes Pendientes ({solicitudes.length})
        </button>
        <button
          onClick={() => { setActiveTab('historial'); fetchHistorial(); }}
          className={`btn ${activeTab === 'historial' ? 'btn-primary' : 'btn-outline'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem' }}
        >
          <History size={18} /> Historial de Solicitudes ({historial.length})
        </button>
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
                try { datos = JSON.parse(s.datosJSON); } catch (e) {}
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
                    <button
                      className="btn btn-primary"
                      onClick={() => aprobar(s)}
                      disabled={aprobando === s.id}
                      style={{ minWidth: '150px', padding: '0.75rem 1.25rem' }}
                    >
                      <CheckCircle size={18} />
                      {aprobando === s.id ? 'Aprobando...' : 'Aceptar Solicitud'}
                    </button>
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

            {/* Barra de búsqueda */}
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

          {loading ? (
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
                try { datos = JSON.parse(s.datosJSON); } catch (e) {}
                const isApproved = s.estado === 'APROBADA';

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

                      <span className={isApproved ? 'badge-primary' : 'badge-warning'}>
                        {isApproved ? '✓ APROBADA' : '⏳ PENDIENTE'}
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
    </div>
  );
};

export default AdminDashboard;
