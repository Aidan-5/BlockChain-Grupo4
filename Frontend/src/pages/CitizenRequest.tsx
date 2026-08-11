import React, { useState, useEffect, useMemo } from 'react';
import { Send, FileCheck, HelpCircle, MapPin, Info, X, ShieldCheck, Clock } from 'lucide-react';
import { PROVINCIAS_ECUADOR } from '../data/provincias';
import apiClient from '../config/axios';

const CitizenRequest = ({ user }: { user: any }) => {
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    fechaNacimiento: '',
    sexo: 'Hombre',
  });

  // Institución y tipo de identidad a solicitar
  const [instituciones, setInstituciones] = useState<any[]>([]);
  const [loadingInstituciones, setLoadingInstituciones] = useState(true);
  const [institucionId, setInstitucionId] = useState('');
  const [tipoCredencial, setTipoCredencial] = useState<'CEDULA' | 'DISCAPACIDAD'>('CEDULA');

  // Catálogo completo de atributos de identidad (clave -> {etiqueta, tipo}) y
  // los valores que el ciudadano llena para los atributos que la institución
  // seleccionada haya elegido (institucion.atributos).
  const [atributosCatalogo, setAtributosCatalogo] = useState<Record<string, { clave: string; etiqueta: string; tipo: 'STRING' | 'BOOLEAN' }>>({});
  const [atributosValues, setAtributosValues] = useState<Record<string, string>>({});

  // Provincia y Parroquia de Nacimiento
  const [selectedProvinciaCodigo, setSelectedProvinciaCodigo] = useState('17'); // 17 Pichincha por defecto
  const [selectedParroquia, setSelectedParroquia] = useState('Quito - Iñaquito');

  useEffect(() => {
    const fetchInstituciones = async () => {
      setLoadingInstituciones(true);
      try {
        const res = await apiClient.get('/institutions');
        setInstituciones(res.data);
        if (res.data.length > 0) {
          setInstitucionId(String(res.data[0].id));
        }
      } catch (e) {
        console.error('Error cargando instituciones', e);
      } finally {
        setLoadingInstituciones(false);
      }
    };
    fetchInstituciones();
  }, []);

  useEffect(() => {
    const fetchAtributosCatalogo = async () => {
      try {
        const res = await apiClient.get('/institutions/atributos-catalogo');
        const catalogo: Record<string, { clave: string; etiqueta: string; tipo: 'STRING' | 'BOOLEAN' }> = {};
        for (const attr of res.data) {
          catalogo[attr.clave] = attr;
        }
        setAtributosCatalogo(catalogo);
      } catch (e) {
        console.error('Error cargando catálogo de atributos', e);
      }
    };
    fetchAtributosCatalogo();
  }, []);

  // Institución actualmente seleccionada (para leer sus atributos requeridos).
  const institucionActual = useMemo(
    () => instituciones.find(inst => String(inst.id) === institucionId),
    [instituciones, institucionId]
  );

  const atributosInstitucion: string[] = institucionActual?.atributos ?? [];

  // Si el ciudadano cambia de institución, se limpian los valores ya
  // ingresados para no enviar datos de atributos que ya no aplican.
  const handleInstitucionChange = (nuevoId: string) => {
    setInstitucionId(nuevoId);
    setAtributosValues({});
  };

  // Control de Modal informativo
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Estados de solicitud y servidor
  const [success, setSuccess] = useState<{ hash: string; provincia: string; parroquia: string } | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calcular edad dinámica
  const edadCalculada = useMemo(() => {
    if (!formData.fechaNacimiento) return 0;
    const hoy = new Date();
    const nacimiento = new Date(formData.fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad >= 0 ? edad : 0;
  }, [formData.fechaNacimiento]);

  // Provincia objeto actual
  const provinciaActual = useMemo(() => {
    return PROVINCIAS_ECUADOR.find(p => p.codigo === selectedProvinciaCodigo) || PROVINCIAS_ECUADOR[16];
  }, [selectedProvinciaCodigo]);

  // Al cambiar provincia, actualizar la parroquia por defecto
  useEffect(() => {
    if (provinciaActual && provinciaActual.parroquias.length > 0) {
      if (!provinciaActual.parroquias.includes(selectedParroquia)) {
        setSelectedParroquia(provinciaActual.parroquias[0]);
      }
    }
  }, [selectedProvinciaCodigo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return setError('Debes iniciar sesión para solicitar una identidad');
    if (!institucionId) return setError('Selecciona una institución para tu solicitud');
    setError('');
    setIsSubmitting(true);

    const lugarNacimientoCompleto = `Parroquia ${selectedParroquia}, Prov. ${provinciaActual.nombre} (Código ${selectedProvinciaCodigo})`;

    try {
      const res = await apiClient.post('/solicitudes', {
        tipoCredencial,
        institucionId: Number(institucionId),
        datosJSON: JSON.stringify({
          ...formData,
          edad: edadCalculada.toString(),
          provinciaCodigo: selectedProvinciaCodigo,
          provinciaNombre: provinciaActual.nombre,
          parroquia: selectedParroquia,
          lugarNacimiento: lugarNacimientoCompleto,
          ...atributosValues
        })
      });

      setSuccess({
        hash: res.data.hashTemporal,
        provincia: provinciaActual.nombre,
        parroquia: selectedParroquia
      });

      setFormData({ nombres: '', apellidos: '', fechaNacimiento: '', sexo: 'Hombre' });
      setAtributosValues({});
    } catch (e: any) {
      setError(e.response?.data?.message || 'Error al enviar la solicitud a la red');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '3rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>
          Debes <a href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>iniciar sesión</a> para solicitar tu identidad oficial.
        </p>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h2 className="gradient-text" style={{ fontSize: '2.1rem', marginBottom: '0.5rem' }}>
            Solicitar Identidad Oficial
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Completa tus datos personales y lugar de nacimiento para registrar tu Cédula de Identidad en la red Blockchain.
          </p>
        </div>

        {/* Botón modal informativo */}
        <button
          type="button"
          onClick={() => setShowInfoModal(true)}
          className="btn btn-outline"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
        >
          <HelpCircle size={18} color="var(--primary)" />
          ¿Cómo ingresar tu cédula?
        </button>
      </div>

      {/* Panel del Formulario */}
      <div className="glass-panel" style={{ padding: '2.25rem' }}>
        {error && (
          <div style={{
            background: 'var(--error-subtle)',
            border: '1px solid var(--error)',
            color: 'var(--error)',
            padding: '1rem',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: 'rgba(0, 51, 160, 0.04)',
            border: '1px solid var(--primary-light)',
            padding: '1.5rem',
            borderRadius: '14px',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <FileCheck size={28} color="var(--primary)" />
              <h3 style={{ color: 'var(--primary)', margin: 0, fontSize: '1.25rem' }}>
                ¡Solicitud Registrada en la Red!
              </h3>
            </div>

            <p style={{ color: 'var(--text-main)', fontSize: '0.92rem', marginBottom: '1rem', lineHeight: 1.5 }}>
              Tu solicitud para la provincia de <strong>{success.provincia}</strong> ({success.parroquia}) ha sido registrada correctamente.
            </p>

            <div style={{ background: 'var(--bg-mid)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--glass-border)', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Clock size={16} color="var(--accent-text)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  Estado: <span className="badge-warning">⏳ Pendiente de Aprobación por Administrador</span>
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>
                💡 Tu <strong>Número de Cédula</strong> (generado con el algoritmo oficial Módulo 10 según tu provincia) y tu <strong>Clave Privada</strong> estarán disponibles en tu <strong style={{ color: 'var(--primary)' }}>Billetera</strong> una vez que el Administrador apruebe tu registro.
              </p>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' }}>Hash de Transacción Temporal</span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--primary)', wordBreak: 'break-all', background: '#ffffff', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--glass-border)', display: 'block' }}>
                {success.hash}
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Institución y Tipo de Identidad */}
          <div>
            <h4 style={{ color: 'var(--primary)', marginBottom: '1rem', fontSize: '1.05rem', fontWeight: 600 }}>
              Institución y Tipo de Identidad
            </h4>
            {!loadingInstituciones && instituciones.length === 0 ? (
              <div style={{
                background: 'var(--error-subtle)',
                border: '1px solid var(--error)',
                color: 'var(--error)',
                padding: '1rem',
                borderRadius: '10px',
                fontSize: '0.9rem'
              }}>
                No hay instituciones disponibles todavía. Contacta al administrador para poder enviar tu solicitud.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label>Institución</label>
                  <select
                    className="glass-input"
                    value={institucionId}
                    onChange={e => handleInstitucionChange(e.target.value)}
                    disabled={loadingInstituciones}
                    required
                  >
                    {loadingInstituciones && <option value="">Cargando instituciones...</option>}
                    {!loadingInstituciones && instituciones.map(inst => (
                      <option key={inst.id} value={inst.id}>
                        {inst.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label>Tipo de identidad</label>
                  <select
                    className="glass-input"
                    value={tipoCredencial}
                    onChange={e => setTipoCredencial(e.target.value as 'CEDULA' | 'DISCAPACIDAD')}
                  >
                    <option value="CEDULA">Cédula de Identidad (estándar)</option>
                    <option value="DISCAPACIDAD">Carnet de Discapacidad</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Campos dinámicos requeridos por la institución seleccionada */}
          {institucionActual && atributosInstitucion.length > 0 && (
            <div>
              <h4 style={{ color: 'var(--primary)', marginBottom: '1rem', fontSize: '1.05rem', fontWeight: 600 }}>
                Datos requeridos por {institucionActual.nombre}
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {atributosInstitucion.map(clave => {
                  const attr = atributosCatalogo[clave];
                  if (!attr) return null;
                  return (
                    <div className="input-group" key={clave}>
                      <label>{attr.etiqueta}</label>
                      {attr.tipo === 'BOOLEAN' ? (
                        <select
                          className="glass-input"
                          value={atributosValues[clave] ?? ''}
                          onChange={e => setAtributosValues({ ...atributosValues, [clave]: e.target.value })}
                          required
                        >
                          <option value="" disabled>Selecciona una opción</option>
                          <option value="true">Sí</option>
                          <option value="false">No</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          className="glass-input"
                          value={atributosValues[clave] ?? ''}
                          placeholder={attr.etiqueta}
                          onChange={e => setAtributosValues({ ...atributosValues, [clave]: e.target.value })}
                          required
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <hr style={{ borderColor: 'var(--glass-border)', margin: '0.25rem 0' }} />

          {/* Datos Personales */}
          <div>
            <h4 style={{ color: 'var(--primary)', marginBottom: '1rem', fontSize: '1.05rem', fontWeight: 600 }}>
              Información del Ciudadano
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label>Primer Nombre</label>
                <input
                  type="text"
                  className="glass-input"
                  value={formData.nombres}
                  placeholder="Ej: Juan Carlos"
                  onChange={e => setFormData({ ...formData, nombres: e.target.value })}
                  required
                />
              </div>
              <div className="input-group">
                <label>Dos Apellidos</label>
                <input
                  type="text"
                  className="glass-input"
                  value={formData.apellidos}
                  placeholder="Ej: García López"
                  onChange={e => setFormData({ ...formData, apellidos: e.target.value })}
                  required
                />
              </div>
              <div className="input-group">
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Fecha de Nacimiento</span>
                  {formData.fechaNacimiento && (
                    <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.8rem' }}>
                      (Edad: {edadCalculada} años)
                    </span>
                  )}
                </label>
                <input
                  type="date"
                  className="glass-input"
                  value={formData.fechaNacimiento}
                  onChange={e => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                  required
                />
              </div>
              <div className="input-group">
                <label>Sexo</label>
                <select
                  className="glass-input"
                  value={formData.sexo}
                  onChange={e => setFormData({ ...formData, sexo: e.target.value })}
                >
                  <option value="Hombre">Hombre</option>
                  <option value="Mujer">Mujer</option>
                </select>
              </div>
            </div>
          </div>

          <hr style={{ borderColor: 'var(--glass-border)', margin: '0.25rem 0' }} />

          {/* Lugar de Nacimiento (Provincia y Parroquia) */}
          <div>
            <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem', fontSize: '1.05rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={18} color="var(--primary)" /> Lugar de Nacimiento (Provincia y Parroquia)
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Selecciona tu provincia y parroquia. Los <strong>primeros 2 dígitos de tu cédula</strong> corresponderán al código oficial de tu provincia de nacimiento.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Selección de Provincia */}
              <div className="input-group">
                <label>Provincia (Código de 2 dígitos)</label>
                <select
                  className="glass-input"
                  value={selectedProvinciaCodigo}
                  onChange={e => setSelectedProvinciaCodigo(e.target.value)}
                >
                  {PROVINCIAS_ECUADOR.map(prov => (
                    <option key={prov.codigo} value={prov.codigo}>
                      [{prov.codigo}] {prov.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selección de Parroquia */}
              <div className="input-group">
                <label>Parroquia de Nacimiento</label>
                <select
                  className="glass-input"
                  value={selectedParroquia}
                  onChange={e => setSelectedParroquia(e.target.value)}
                >
                  {provinciaActual.parroquias.map(parroquia => (
                    <option key={parroquia} value={parroquia}>
                      {parroquia}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tarjeta Informativa de la Cédula */}
          <div style={{
            background: 'var(--bg-mid)',
            border: '1px solid var(--glass-border-strong)',
            borderRadius: '12px',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.85rem'
          }}>
            <ShieldCheck size={24} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h5 style={{ color: 'var(--text-main)', fontSize: '0.92rem', marginBottom: '0.35rem', fontWeight: 600 }}>
                Asignación de Cédula Oficial
              </h5>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', lineHeight: 1.5, margin: 0 }}>
                Tu número de cédula será asignado utilizando el <strong>Código de Provincia [{selectedProvinciaCodigo}]</strong> ({provinciaActual.nombre}) y el <strong>Algoritmo Módulo 10</strong>. El número de cédula y la clave privada se generarán y mostrarán en tu <strong>Billetera</strong> cuando el Administrador apruebe la solicitud.
              </p>
            </div>
          </div>

          {/* Botón de Enviar */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || instituciones.length === 0}
            style={{
              padding: '0.85rem',
              fontSize: '1rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginTop: '0.5rem'
            }}
          >
            <Send size={18} /> {isSubmitting ? 'Enviando Solicitud...' : 'Enviar Solicitud a la Red'}
          </button>
        </form>
      </div>

      {/* MODAL INFORMATIVO: "¿Cómo ingresar tu cédula?" */}
      {showInfoModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 51, 160, 0.25)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="glass-card" style={{
            maxWidth: '650px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
            padding: '2rem',
            boxShadow: '0 12px 32px rgba(0, 51, 160, 0.2)'
          }}>
            <button
              onClick={() => setShowInfoModal(false)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={22} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <Info size={26} color="var(--primary)" />
              <h3 style={{ color: 'var(--primary)', fontSize: '1.35rem', margin: 0, fontWeight: 700 }}>
                ¿Cómo ingresar tu cédula?
              </h3>
            </div>

            <div style={{ background: 'var(--bg-mid)', padding: '1.25rem', borderRadius: '10px', marginBottom: '1.5rem', border: '1px solid var(--glass-border)' }}>
              <p style={{ color: 'var(--text-main)', fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                Tu número consta de 10 dígitos consecutivos:
              </p>

              <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>•</span>
                  <span><strong>Primeros 2 dígitos:</strong> Código de provincia (ej. 17 para Pichincha, 09 para Guayas).</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>•</span>
                  <span><strong>Siguientes 7 dígitos:</strong> Número secuencial único (el 3er dígito es menor a 6 para personas naturales).</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>•</span>
                  <span><strong>Último dígito:</strong> Código verificador (calculado con el Algoritmo Oficial Módulo 10).</span>
                </li>
              </ul>

              <div style={{ marginTop: '1rem', padding: '0.6rem 0.8rem', background: 'var(--accent-subtle)', borderRadius: '6px', color: 'var(--accent-text)', fontSize: '0.85rem', fontWeight: 700, border: '1px solid rgba(255, 209, 0, 0.4)' }}>
                Ingresa solo números, sin guiones.
              </div>
            </div>

            <h4 style={{ color: 'var(--text-main)', marginBottom: '0.75rem', fontSize: '1rem', fontWeight: 600 }}>
              Códigos de Provincia (Ecuador)
            </h4>

            {/* Grilla de códigos de provincias */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
              gap: '0.6rem',
              maxHeight: '260px',
              overflowY: 'auto',
              paddingRight: '0.25rem'
            }}>
              {PROVINCIAS_ECUADOR.map(p => (
                <div
                  key={p.codigo}
                  style={{
                    background: selectedProvinciaCodigo === p.codigo ? 'var(--primary-subtle)' : 'var(--surface)',
                    border: `1px solid ${selectedProvinciaCodigo === p.codigo ? 'var(--primary)' : 'var(--glass-border)'}`,
                    padding: '0.45rem 0.65rem',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.82rem'
                  }}
                >
                  <span style={{
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    color: 'var(--primary)',
                    background: 'var(--bg-mid)',
                    padding: '0.15rem 0.4rem',
                    borderRadius: '4px',
                    border: '1px solid var(--glass-border)'
                  }}>
                    {p.codigo}
                  </span>
                  <span style={{ color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: selectedProvinciaCodigo === p.codigo ? 600 : 400 }}>
                    {p.nombre}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowInfoModal(false)}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1.5rem' }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitizenRequest;
