import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CreditCard, Hash, Calendar, CheckCircle, AlertCircle, Key, Lock } from 'lucide-react';

const Wallet = ({ user }: { user: any }) => {
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const res = await axios.get(`http://localhost:3000/solicitudes/usuario/${user.id}`);
      setSolicitudes(res.data);
    } catch (error) {
      console.error('Error fetching wallet data', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>
        <Lock size={56} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
        <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>Tu billetera es privada</h3>
        <p style={{ color: 'var(--text-muted)' }}>
          Debes <a href="/login" style={{ color: 'var(--primary)' }}>iniciar sesión</a> para ver tu billetera de identidad.
        </p>
      </div>
    );
  }

  const aprobadas = solicitudes.filter(s => s.estado === 'APROBADA');
  const pendientes = solicitudes.filter(s => s.estado === 'PENDIENTE');

  return (
    <div className="container">
      <h2 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Mi Billetera de Identidad</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Bienvenido, <strong style={{ color: 'var(--primary)' }}>{user.nombre}</strong>. Esta billetera es solo tuya y nadie más puede verla.
      </p>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Cargando billetera...</p>
      ) : (
        <>
          {/* Credenciales aprobadas */}
          {aprobadas.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: 'var(--accent)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Key size={20} /> Credenciales Activas
              </h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {aprobadas.map(s => {
                  let datos: any = {};
                  try { datos = JSON.parse(s.datosJSON); } catch (e) {}
                  return (
                    <div key={s.id} className="glass-card" style={{ border: '1px solid var(--accent)', background: 'rgba(16,185,129,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <CreditCard size={20} color="var(--accent)" />
                          <h4 style={{ color: 'var(--accent)', margin: 0 }}>{s.tipoCredencial}</h4>
                        </div>
                        <span style={{ background: 'rgba(16,185,129,0.2)', color: 'var(--accent)', padding: '0.2rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem' }}>
                          ✓ APROBADA
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem', fontSize: '0.9rem' }}>
                        <div>
                          <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Nombres</span>
                          <span style={{ color: 'var(--text-main)' }}>{datos.nombres} {datos.apellidos}</span>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Cédula Asignada</span>
                          <span style={{ fontFamily: 'monospace', color: 'var(--primary)', fontSize: '1rem', letterSpacing: '0.08em' }}>{datos.cedula}</span>
                        </div>
                        {datos.lugarNacimiento && (
                          <div>
                            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Lugar de Nacimiento</span>
                            <span style={{ color: 'var(--text-main)' }}>{datos.lugarNacimiento}</span>
                          </div>
                        )}
                        {datos.fechaNacimiento && (
                          <div>
                            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Fecha de Nacimiento</span>
                            <span style={{ color: 'var(--text-main)' }}>{datos.fechaNacimiento}</span>
                          </div>
                        )}
                      </div>

                      <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '0.4rem' }}>
                          <Key size={12} style={{ marginRight: '4px' }} />
                          Tu Clave Privada (solo tú puedes verla):
                        </p>
                        <p style={{
                          fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--primary)',
                          wordBreak: 'break-all', background: 'rgba(0,0,0,0.35)',
                          padding: '0.75rem', borderRadius: '8px', userSelect: 'all'
                        }}>
                          {s.hashTemporal}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Solicitudes pendientes */}
          {pendientes.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Solicitudes en Revisión</h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {pendientes.map(s => (
                  <div key={s.id} className="glass-panel" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ color: 'var(--text-main)', marginBottom: '0.25rem' }}>{s.tipoCredencial}</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontFamily: 'monospace' }}>
                        Hash: {s.hashTemporal?.slice(0, 28)}...
                      </p>
                    </div>
                    <span style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '0.25rem 0.85rem', borderRadius: '20px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      ⏳ En revisión
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estado vacío */}
          {solicitudes.length === 0 && (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
              <AlertCircle size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
              <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Tu billetera está vacía</h4>
              <p style={{ color: 'var(--text-muted)' }}>
                Ve a <a href="/solicitar" style={{ color: 'var(--primary)' }}>Solicitar Identidad</a> para iniciar el proceso.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Wallet;
