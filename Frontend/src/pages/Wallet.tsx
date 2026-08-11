import { useEffect, useState } from 'react';
import { CreditCard, AlertCircle, Key, Lock, Clock, CheckCircle, Building2, XCircle, ClipboardList, ChevronDown, ChevronUp } from 'lucide-react';
import apiClient from '../config/axios';

// La Credencial (Backend/prisma/schema.prisma) NO tiene datosJSON/cedula/nombres:
// esos datos personales solo viven en Solicitud.datosJSON. GET /credentials/usuario/:id
// incluye la Solicitud completa (o null) que originó cada credencial, así que el
// titular y la cédula asignada se leen directo de credencial.solicitud.datosJSON.
const TITULO_POR_TIPO: Record<string, string> = {
  CEDULA: 'Cédula de Identidad',
  DISCAPACIDAD: 'Carnet de Discapacidad',
};
const TITULOS_IDENTIDAD_PRINCIPAL = Object.values(TITULO_POR_TIPO);

// Claves de Solicitud.datosJSON que ya se muestran en otra parte de la tarjeta
// (titular / cédula / nacimiento) y no deben repetirse en "Datos Registrados".
const CLAVES_DATOS_PERSONALES = new Set(['nombres', 'apellidos', 'cedula', 'lugarNacimiento', 'fechaNacimiento']);

interface AtributoCatalogo {
  clave: string;
  etiqueta: string;
  tipo: 'STRING' | 'BOOLEAN';
}

interface GrupoInstitucion {
  institucion: any;
  credenciales: any[];
}

const agruparPorInstitucion = (credenciales: any[]): GrupoInstitucion[] => {
  const mapa = new Map<number, GrupoInstitucion>();
  for (const c of credenciales) {
    const institucionId = c.institucion?.id ?? c.institucionId;
    if (!mapa.has(institucionId)) {
      mapa.set(institucionId, { institucion: c.institucion, credenciales: [] });
    }
    mapa.get(institucionId)!.credenciales.push(c);
  }
  return Array.from(mapa.values());
};

const Wallet = ({ user }: { user: any }) => {
  const [credenciales, setCredenciales] = useState<any[]>([]);
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Catálogo de atributos de identidad (para traducir claves de datosJSON a etiquetas)
  const [atributosCatalogo, setAtributosCatalogo] = useState<AtributoCatalogo[]>([]);

  // Trámites activos por institución, cargados on-demand cuando se conocen las
  // instituciones representadas en la billetera.
  const [tramitesPorInstitucion, setTramitesPorInstitucion] = useState<Record<number, any[]>>({});

  // Qué grupos de institución tienen sus credenciales "extra" expandidas.
  const [expandedInstituciones, setExpandedInstituciones] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (user) {
      fetchData();
      fetchAtributosCatalogo();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Una vez cargadas las credenciales, se conocen las instituciones involucradas
  // y se piden sus trámites activos (uno por institución, sin repetir pedidos).
  useEffect(() => {
    if (credenciales.length === 0) return;
    const idsUnicos = Array.from(
      new Set(credenciales.map(c => c.institucion?.id).filter((id): id is number => !!id))
    );
    idsUnicos.forEach(async institucionId => {
      if (tramitesPorInstitucion[institucionId] !== undefined) return;
      try {
        const res = await apiClient.get(`/institutions/${institucionId}/tramites`);
        setTramitesPorInstitucion(prev => ({ ...prev, [institucionId]: res.data }));
      } catch (error) {
        console.error('Error fetching trámites for institución', institucionId, error);
      }
    });
  }, [credenciales]);

  const fetchData = async () => {
    try {
      const [credencialesRes, solicitudesRes] = await Promise.all([
        apiClient.get(`/credentials/usuario/${user.id}`),
        apiClient.get(`/solicitudes/usuario/${user.id}`),
      ]);
      setCredenciales(credencialesRes.data);
      setSolicitudes(solicitudesRes.data);
    } catch (error) {
      console.error('Error fetching wallet data', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAtributosCatalogo = async () => {
    try {
      const res = await apiClient.get('/institutions/atributos-catalogo');
      setAtributosCatalogo(res.data);
    } catch (error) {
      console.error('Error fetching atributos catálogo', error);
    }
  };

  const toggleExpanded = (institucionId: number) => {
    setExpandedInstituciones(prev => {
      const next = new Set(prev);
      if (next.has(institucionId)) {
        next.delete(institucionId);
      } else {
        next.add(institucionId);
      }
      return next;
    });
  };

  // Devuelve, de los datos que el ciudadano llenó al solicitar la identidad,
  // solo los que corresponden a atributos específicos de la institución
  // (ignora nombres/apellidos/cedula/nacimiento, que ya se muestran aparte).
  const getAtributosExtra = (datos: Record<string, any>) => {
    return Object.entries(datos)
      .filter(([clave]) => !CLAVES_DATOS_PERSONALES.has(clave))
      .map(([clave, valor]) => {
        const meta = atributosCatalogo.find(a => a.clave === clave);
        if (!meta) return null;
        let valorMostrado = valor;
        if (meta.tipo === 'BOOLEAN') {
          valorMostrado = valor === true || valor === 'true' ? 'Sí' : 'No';
        }
        return { clave, etiqueta: meta.etiqueta, valor: valorMostrado };
      })
      .filter((a): a is { clave: string; etiqueta: string; valor: any } => a !== null);
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

  const pendientes = solicitudes.filter(s => s.estado === 'PENDIENTE');
  const rechazadas = solicitudes.filter(s => s.estado === 'RECHAZADA');
  const grupos = agruparPorInstitucion(credenciales);

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
          {/* Credenciales aprobadas, agrupadas por institución emisora */}
          {grupos.length > 0 && (
            <div style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                <Key size={20} color="var(--primary)" /> Credenciales Activas
              </h3>
              <div style={{ display: 'grid', gap: '1.25rem' }}>
                {grupos.map(grupo => {
                  const institucion = grupo.institucion;
                  const institucionId = institucion?.id;
                  const principal =
                    grupo.credenciales.find(c => TITULOS_IDENTIDAD_PRINCIPAL.includes(c.titulo)) ??
                    grupo.credenciales[0];
                  const adicionales = grupo.credenciales.filter(c => c.id !== principal.id);
                  const expanded = institucionId !== undefined && expandedInstituciones.has(institucionId);

                  let datos: Record<string, any> = {};
                  if (principal.solicitud?.datosJSON) {
                    try { datos = JSON.parse(principal.solicitud.datosJSON); } catch (e) { /* ignore */ }
                  }
                  const atributosExtra = getAtributosExtra(datos);
                  const tramitesInst = (institucionId !== undefined && tramitesPorInstitucion[institucionId]) || [];

                  return (
                    <div
                      key={institucionId ?? principal.id}
                      className="glass-card"
                      style={{
                        border: '1px solid var(--primary-light)',
                        background: 'var(--surface)',
                        boxShadow: '0 4px 20px rgba(0, 51, 160, 0.08)'
                      }}
                    >
                      {institucion && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', paddingBottom: '0.85rem', borderBottom: '1px solid var(--glass-border)' }}>
                          <Building2 size={20} color="var(--primary)" />
                          <h4 style={{ color: 'var(--text-main)', margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                            {institucion.nombre}
                          </h4>
                        </div>
                      )}

                      {/* Tarjeta principal (identidad si existe, si no la primera credencial del grupo) */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <CreditCard size={22} color="var(--primary)" />
                          <h4 style={{ color: 'var(--primary)', margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                            {principal.titulo}
                          </h4>
                        </div>
                        <span className="badge-primary">
                          <CheckCircle size={14} /> APROBADA
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                        {(datos.nombres || datos.apellidos) && (
                          <div>
                            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>
                              Titular
                            </span>
                            <span style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '1rem' }}>
                              {datos.nombres} {datos.apellidos}
                            </span>
                          </div>
                        )}

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

                        {principal.emitidaEn && (
                          <div>
                            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>
                              Fecha de Emisión
                            </span>
                            <span style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>
                              {new Date(principal.emitidaEn).toLocaleDateString()}
                            </span>
                          </div>
                        )}

                        {principal.fechaCaducidad && (
                          <div>
                            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>
                              Válida Hasta
                            </span>
                            <span style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>
                              {new Date(principal.fechaCaducidad).toLocaleDateString()}
                            </span>
                          </div>
                        )}

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
                      <div style={{ background: 'var(--bg-mid)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--glass-border)', display: 'grid', gap: '0.75rem' }}>
                        <div>
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
                            {principal.hashBlockchain}
                          </p>
                        </div>

                        {principal.firmaEmisorHash && (
                          <div>
                            <p style={{ color: 'var(--text-main)', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <Key size={14} color="var(--primary)" /> Firma del Emisor:
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
                              {principal.firmaEmisorHash}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Datos registrados: atributos propios de la institución llenados en la solicitud */}
                      {atributosExtra.length > 0 && (
                        <div style={{ marginTop: '1.25rem' }}>
                          <p style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.6rem' }}>
                            Datos Registrados
                          </p>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                            {atributosExtra.map(a => (
                              <div key={a.clave}>
                                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>
                                  {a.etiqueta}
                                </span>
                                <span style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>
                                  {a.valor}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Trámites activos que la institución ofrece a este ciudadano */}
                      {tramitesInst.length > 0 && (
                        <div style={{ marginTop: '1.25rem' }}>
                          <p style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <ClipboardList size={16} color="var(--primary)" /> Trámites Disponibles
                          </p>
                          <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'grid', gap: '0.35rem' }}>
                            {tramitesInst.map((t: any) => (
                              <li key={t.id} style={{ color: 'var(--text-main)', fontSize: '0.88rem' }}>
                                <strong>{t.nombre}</strong>
                                {t.descripcion && <span style={{ color: 'var(--text-muted)' }}> — {t.descripcion}</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Ver más: resto de credenciales sueltas emitidas por esta misma institución */}
                      {adicionales.length > 0 && institucionId !== undefined && (
                        <>
                          <button
                            onClick={() => toggleExpanded(institucionId)}
                            style={{
                              marginTop: '1.25rem',
                              background: 'transparent',
                              border: '1px solid var(--primary-light)',
                              color: 'var(--primary)',
                              padding: '0.5rem 1rem',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem'
                            }}
                          >
                            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            {expanded ? 'Ver menos' : `Ver más (${adicionales.length} credenciales adicionales)`}
                          </button>

                          {expanded && (
                            <div style={{ display: 'grid', gap: '0.75rem', marginTop: '0.75rem' }}>
                              {adicionales.map(c => (
                                <div
                                  key={c.id}
                                  className="glass-panel"
                                  style={{ padding: '1rem' }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: c.descripcion ? '0.4rem' : 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <CreditCard size={16} color="var(--primary)" />
                                      <span style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '0.95rem' }}>
                                        {c.titulo}
                                      </span>
                                    </div>
                                    {c.emitidaEn && (
                                      <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                        {new Date(c.emitidaEn).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                  {c.descripcion && (
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 0.5rem' }}>
                                      {c.descripcion}
                                    </p>
                                  )}
                                  <p style={{
                                    fontFamily: 'monospace',
                                    fontSize: '0.72rem',
                                    color: 'var(--primary)',
                                    wordBreak: 'break-all',
                                    margin: 0
                                  }}>
                                    Hash: {c.hashBlockchain}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
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
                          {s.tipoCredencial === 'DISCAPACIDAD' ? 'Carnet de Discapacidad' : 'Cédula de Identidad'}
                          {s.institucion ? ` — ${s.institucion.nombre}` : ''}
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

          {/* Solicitudes rechazadas */}
          {rechazadas.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: 'var(--error-light)', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <XCircle size={20} color="var(--error-light)" /> Solicitudes Rechazadas
              </h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {rechazadas.map(s => {
                  let datos: any = {};
                  try { datos = JSON.parse(s.datosJSON); } catch (e) {}
                  return (
                    <div key={s.id} className="glass-panel" style={{ padding: '1.25rem', border: '1px solid var(--error)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '1rem' }}>
                          {s.tipoCredencial === 'DISCAPACIDAD' ? 'Carnet de Discapacidad' : 'Cédula de Identidad'}
                          {s.institucion ? ` — ${s.institucion.nombre}` : ''}
                        </span>
                        <span className="badge-error">
                          <XCircle size={14} /> Rechazada
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', margin: 0 }}>
                        Lugar solicitado: {datos.lugarNacimiento || 'No especificado'}. Puedes enviar una nueva solicitud desde <a href="/solicitar" style={{ color: 'var(--primary)', fontWeight: 600 }}>Solicitar Identidad</a>.
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Estado vacío */}
          {credenciales.length === 0 && pendientes.length === 0 && rechazadas.length === 0 && (
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
