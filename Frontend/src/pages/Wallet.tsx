import { useEffect, useState } from 'react';
import axios from 'axios';
import { CreditCard, AlertCircle, Key, Lock, Clock, CheckCircle } from 'lucide-react';

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
          Debes <a href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>iniciar sesión</a> para ver tu billetera de identidad.
        </p>
      </div>
    );
  }

  const aprobadas = solicitudes.filter(s => s.estado === 'APROBADA');
  const pendientes = solicitudes.filter(s => s.estado === 'PENDIENTE');

  return (
    <div className="container">
      <h2 className="gradient-text" style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>
        Mi Billetera de Identidad
      </h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Bienvenido, <strong style={{ color: 'var(--primary)' }}>{user.nombre}</strong>. Aquí residen tus credenciales de identidad verificadas en la red Blockchain.
      </p>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Cargando billetera...</p>
      ) : (
        <>
          {/* Credenciales aprobadas */}
          {aprobadas.length > 0 && (
            <div style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                <Key size={20} color="var(--primary)" /> Credenciales Activas
              </h3>
              <div style={{ display: 'grid', gap: '1.25rem' }}>
                {aprobadas.map(s => {
                  let datos: any = {};
                  try { datos = JSON.parse(s.datosJSON); } catch (e) {}
                  return (
                    <div
                      key={s.id}
                      className="glass-card"
                      style={{
                        border: '1px solid var(--primary-light)',
                        background: 'var(--surface)',
                        boxShadow: '0 4px 20px rgba(0, 51, 160, 0.08)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <CreditCard size={22} color="var(--primary)" />
                          <h4 style={{ color: 'var(--primary)', margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                            {s.tipoCredencial}
                          </h4>
                        </div>
                        <span className="badge-primary">
                          <CheckCircle size={14} /> APROBADA
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                        <div>
                          <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>
                            Titular
                          </span>
                          <span style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '1rem' }}>
                            {datos.nombres} {datos.apellidos}
                          </span>
                        </div>

                        <div>
                          <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>
                            Cédula Asignada
                          </span>
                          <span style={{
                            fontFamily: 'monospace',
                            color: 'var(--primary)',
                            fontSize: '1.15rem',
                            fontWeight: 'bold',
                            letterSpacing: '0.08em'
                          }}>
                            {datos.cedula || 'En emisión'}
                          </span>
                        </div>

                        {datos.lugarNacimiento && (
                          <div>
                            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>
                              Lugar de Nacimiento
                            </span>
                            <span style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>
                              {datos.lugarNacimiento}
                            </span>
                          </div>
                        )}

                        {datos.fechaNacimiento && (
                          <div>
                            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>
                              Fecha de Nacimiento
                            </span>
                            <span style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>
                              {datos.fechaNacimiento}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Clave Privada y Hash */}
                      <div style={{ background: 'var(--bg-mid)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                        <p style={{ color: 'var(--text-main)', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Key size={14} color="var(--primary)" /> Tu Clave Privada Descentralizada:
                        </p>
                        <p style={{
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          color: 'var(--primary)',
                          wordBreak: 'break-all',
                          background: '#ffffff',
                          border: '1px solid var(--glass-border)',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '8px',
                          userSelect: 'all',
                          margin: 0
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
              <h3 style={{ color: 'var(--text-main)', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>
                Solicitudes en Revisión
              </h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {pendientes.map(s => {
                  let datos: any = {};
                  try { datos = JSON.parse(s.datosJSON); } catch (e) {}
                  return (
                    <div key={s.id} className="glass-panel" style={{ padding: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '1rem' }}>
                          {s.tipoCredencial} — {datos.provinciaNombre ? `Prov. ${datos.provinciaNombre}` : ''}
                        </span>
                        <span className="badge-warning">
                          <Clock size={14} /> ⏳ En revisión por Administrador
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', margin: 0 }}>
                        Lugar solicitado: {datos.lugarNacimiento || 'No especificado'}. Tu número de cédula oficial y clave privada se mostrarán aquí cuando el Administrador apruebe la solicitud.
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Estado vacío */}
          {solicitudes.length === 0 && (
            <div className="glass-panel" style={{ padding: '3.5rem', textAlign: 'center' }}>
              <AlertCircle size={48} color="var(--primary)" style={{ marginBottom: '1rem', opacity: 0.7 }} />
              <h4 style={{ color: 'var(--text-main)', marginBottom: '0.5rem', fontSize: '1.2rem' }}>
                Tu billetera está vacía
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                Ve a <a href="/solicitar" style={{ color: 'var(--primary)', fontWeight: 600 }}>Solicitar Identidad</a> para iniciar el proceso.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Wallet;
