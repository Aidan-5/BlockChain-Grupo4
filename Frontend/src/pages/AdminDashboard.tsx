import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CheckCircle, Clock, FileText, ShieldCheck, Key } from 'lucide-react';

const AdminDashboard = () => {
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [aprobando, setAprobando] = useState<number | null>(null);
  const [resultadoAprobacion, setResultadoAprobacion] = useState<{ cedula: string; clave: string; nombre: string; credencialId: number } | null>(null);

  useEffect(() => {
    fetchSolicitudes();
  }, []);

  const fetchSolicitudes = async () => {
    try {
      const res = await axios.get('http://localhost:3000/solicitudes/pendientes');
      setSolicitudes(res.data);
    } catch (e) {
      console.error('Error cargando solicitudes', e);
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
        nombre: datos.nombres + ' ' + datos.apellidos,
        credencialId: res.data.credencialId
      });
      fetchSolicitudes();
    } catch (e) {
      alert('Error al aprobar la solicitud');
    } finally {
      setAprobando(null);
    }
  };

  return (
    <div className="container">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 className="gradient-text" style={{ fontSize: '2rem' }}>Panel de Administrador</h2>
        <p style={{ color: 'var(--text-muted)' }}>Gestiona las solicitudes de identidad ciudadana. Acceso restringido.</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <FileText size={32} color="var(--primary)" style={{ marginBottom: '0.5rem' }} />
          <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)' }}>{solicitudes.length}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Solicitudes Pendientes</p>
        </div>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <ShieldCheck size={32} color="var(--accent)" style={{ marginBottom: '0.5rem' }} />
          <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)' }}>SSI</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Red Blockchain Activa</p>
        </div>
      </div>

      {/* Key generated panel */}
      {resultadoAprobacion && (
        <div className="glass-card" style={{ marginBottom: '2rem', border: '1px solid var(--accent)', background: 'rgba(16, 185, 129, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Key size={24} color="var(--accent)" />
            <h3 style={{ color: 'var(--accent)', margin: 0 }}>Solicitud Aprobada</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            Ciudadano: <strong style={{ color: 'var(--text-main)' }}>{resultadoAprobacion.nombre}</strong>
          </p>
          <p style={{ color: 'var(--text-muted)' }}>
            Cédula Asignada: <span style={{ fontFamily: 'monospace', color: 'var(--primary)', fontSize: '1.1rem', letterSpacing: '0.1em' }}>{resultadoAprobacion.cedula}</span>
          </p>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            ID Público de Credencial: <span style={{ background: 'rgba(16,185,129,0.2)', padding: '0.2rem 0.6rem', borderRadius: '4px', color: 'var(--accent)', fontWeight: 'bold' }}>{resultadoAprobacion.credencialId}</span> (Usa este número en el Verificador)
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
            ✅ La clave privada fue enviada de forma segura a la Billetera del ciudadano. Solo él puede verla.
          </p>
          <button onClick={() => setResultadoAprobacion(null)} className="btn btn-outline" style={{ marginTop: '1rem', fontSize: '0.8rem' }}>Cerrar</button>
        </div>
      )}

      {/* Solicitudes list */}
      <h3 style={{ color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <FileText size={20} /> Solicitudes de Identidad
      </h3>
      {solicitudes.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <CheckCircle size={48} color="var(--accent)" style={{ marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>No hay solicitudes pendientes. ¡Todo al día!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {solicitudes.map(s => {
            let datos: any = {};
            try { datos = JSON.parse(s.datosJSON); } catch (e) {}
            return (
              <div key={s.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h4 style={{ color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                    {datos.nombres || s.usuario.nombre} {datos.apellidos || ''}
                  </h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <Clock size={12} style={{ marginRight: '4px' }} />
                    {s.tipoCredencial} · Solicitado por: <em>{s.usuario.email}</em>
                  </p>
                  {datos.lugarNacimiento && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                      {datos.sexo} · {datos.edad} años · Nacido en {datos.lugarNacimiento}
                    </p>
                  )}
                  <p style={{ color: 'var(--primary)', fontSize: '0.75rem', fontFamily: 'monospace', marginTop: '0.5rem' }}>
                    Hash: {s.hashTemporal?.slice(0, 32)}...
                  </p>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => aprobar(s)}
                  disabled={aprobando === s.id}
                  style={{ minWidth: '140px' }}
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
  );
};

export default AdminDashboard;
