import { useEffect, useState } from 'react';
import { Building2, PlusCircle, Trash2, X, Landmark, Pencil, Save, Ban, CheckCircle2, Users, ClipboardList, Plus } from 'lucide-react';
import apiClient from '../config/axios';

// Panel de ADMIN: gestión exclusiva de instituciones (crear, listar, eliminar).
// La gestión de solicitudes/usuarios/emisión de credenciales se movió al
// panel propio de la institución (rol INSTITUCION) en /institucion, ya que
// el backend ahora deriva esos flujos del JWT de la institución logueada,
// no de un admin global.
const emptyForm = { nombre: '', tipo: '', wallet: '', email: '', password: '' };
const emptyEditForm = { nombre: '', tipo: '', wallet: '' };
const emptyTramiteForm = { nombre: '', descripcion: '' };

const AdminDashboard = () => {
  const [instituciones, setInstituciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Edición y suspensión de instituciones
  const [editingInst, setEditingInst] = useState<any | null>(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [savingInst, setSavingInst] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Catálogo fijo de atributos de identidad + selección por institución
  const [atributosCatalogo, setAtributosCatalogo] = useState<{ clave: string; etiqueta: string; tipo: string }[]>([]);
  const [atributosSeleccionados, setAtributosSeleccionados] = useState<string[]>([]);

  // Trámites de la institución en edición
  const [tramites, setTramites] = useState<any[]>([]);
  const [loadingTramites, setLoadingTramites] = useState(false);
  const [tramiteForm, setTramiteForm] = useState(emptyTramiteForm);
  const [addingTramite, setAddingTramite] = useState(false);
  const [editingTramite, setEditingTramite] = useState<any | null>(null);
  const [editTramiteForm, setEditTramiteForm] = useState(emptyTramiteForm);
  const [savingTramite, setSavingTramite] = useState(false);
  const [deletingTramiteId, setDeletingTramiteId] = useState<number | null>(null);
  const [togglingTramiteId, setTogglingTramiteId] = useState<number | null>(null);

  useEffect(() => {
    fetchInstituciones();
    fetchAtributosCatalogo();
  }, []);

  const fetchAtributosCatalogo = async () => {
    try {
      const res = await apiClient.get('/institutions/atributos-catalogo');
      setAtributosCatalogo(res.data);
    } catch (e) {
      console.error('Error cargando catálogo de atributos', e);
    }
  };

  const fetchTramites = async (institucionId: number) => {
    setLoadingTramites(true);
    try {
      const res = await apiClient.get(`/institutions/${institucionId}/tramites`);
      setTramites(res.data);
    } catch (e) {
      console.error('Error cargando trámites', e);
    } finally {
      setLoadingTramites(false);
    }
  };

  const fetchInstituciones = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/institutions');
      setInstituciones(res.data);
    } catch (e) {
      console.error('Error cargando instituciones', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setCreating(true);
    try {
      const payload: any = {
        nombre: formData.nombre,
        tipo: formData.tipo,
        email: formData.email,
        password: formData.password,
      };
      if (formData.wallet.trim()) payload.wallet = formData.wallet.trim();

      await apiClient.post('/institutions', payload);
      setSuccessMsg(`Institución "${formData.nombre}" creada correctamente.`);
      setFormData(emptyForm);
      setShowForm(false);
      fetchInstituciones();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear la institución');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (institucion: any) => {
    if (!window.confirm(`¿Eliminar la institución "${institucion.nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    setDeletingId(institucion.id);
    try {
      await apiClient.delete(`/institutions/${institucion.id}`);
      setInstituciones(prev => prev.filter(i => i.id !== institucion.id));
    } catch (e) {
      alert('Error al eliminar la institución');
    } finally {
      setDeletingId(null);
    }
  };

  const startEditInst = (institucion: any) => {
    setEditingInst(institucion);
    setEditForm({
      nombre: institucion.nombre || '',
      tipo: institucion.tipo || '',
      wallet: institucion.wallet || '',
    });
    setAtributosSeleccionados(institucion.atributos || []);
    setTramiteForm(emptyTramiteForm);
    setEditingTramite(null);
    setTramites([]);
    fetchTramites(institucion.id);
  };

  const cancelEditInst = () => {
    setEditingInst(null);
    setAtributosSeleccionados([]);
    setTramites([]);
    setEditingTramite(null);
  };

  const toggleAtributo = (clave: string) => {
    setAtributosSeleccionados(prev => (prev.includes(clave) ? prev.filter(c => c !== clave) : [...prev, clave]));
  };

  const saveEditInst = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInst) return;
    setSavingInst(true);
    try {
      const payload: any = {
        nombre: editForm.nombre,
        tipo: editForm.tipo,
        atributos: atributosSeleccionados,
      };
      if (editForm.wallet.trim()) payload.wallet = editForm.wallet.trim();

      const res = await apiClient.patch(`/institutions/${editingInst.id}`, payload);
      setInstituciones(prev => prev.map(i => (i.id === editingInst.id ? { ...i, ...res.data } : i)));
      setEditingInst(null);
      setAtributosSeleccionados([]);
      setTramites([]);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al actualizar la institución');
    } finally {
      setSavingInst(false);
    }
  };

  const addTramite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInst) return;
    setAddingTramite(true);
    try {
      const payload: any = { nombre: tramiteForm.nombre };
      if (tramiteForm.descripcion.trim()) payload.descripcion = tramiteForm.descripcion.trim();

      const res = await apiClient.post(`/institutions/${editingInst.id}/tramites`, payload);
      setTramites(prev => [...prev, res.data]);
      setTramiteForm(emptyTramiteForm);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al crear el trámite');
    } finally {
      setAddingTramite(false);
    }
  };

  const startEditTramite = (tramite: any) => {
    setEditingTramite(tramite);
    setEditTramiteForm({ nombre: tramite.nombre || '', descripcion: tramite.descripcion || '' });
  };

  const cancelEditTramite = () => {
    setEditingTramite(null);
  };

  const saveTramite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInst || !editingTramite) return;
    setSavingTramite(true);
    try {
      const payload: any = {
        nombre: editTramiteForm.nombre,
        descripcion: editTramiteForm.descripcion,
      };
      const res = await apiClient.patch(`/institutions/${editingInst.id}/tramites/${editingTramite.id}`, payload);
      setTramites(prev => prev.map(t => (t.id === editingTramite.id ? res.data : t)));
      setEditingTramite(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al actualizar el trámite');
    } finally {
      setSavingTramite(false);
    }
  };

  const deleteTramite = async (tramite: any) => {
    if (!editingInst) return;
    if (!window.confirm(`¿Eliminar el trámite "${tramite.nombre}"? Esta acción no se puede deshacer.`)) return;
    setDeletingTramiteId(tramite.id);
    try {
      await apiClient.delete(`/institutions/${editingInst.id}/tramites/${tramite.id}`);
      setTramites(prev => prev.filter(t => t.id !== tramite.id));
    } catch (e) {
      alert('Error al eliminar el trámite');
    } finally {
      setDeletingTramiteId(null);
    }
  };

  const toggleTramiteActivo = async (tramite: any) => {
    if (!editingInst) return;
    setTogglingTramiteId(tramite.id);
    try {
      const res = await apiClient.patch(`/institutions/${editingInst.id}/tramites/${tramite.id}`, { activo: !tramite.activo });
      setTramites(prev => prev.map(t => (t.id === tramite.id ? res.data : t)));
    } catch (e) {
      alert('Error al cambiar el estado del trámite');
    } finally {
      setTogglingTramiteId(null);
    }
  };

  const toggleActivo = async (institucion: any) => {
    setTogglingId(institucion.id);
    try {
      const res = await apiClient.patch(`/institutions/${institucion.id}`, { activo: !institucion.activo });
      setInstituciones(prev => prev.map(i => (i.id === institucion.id ? { ...i, ...res.data } : i)));
    } catch (e) {
      alert('Error al cambiar el estado de la institución');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h2 className="gradient-text" style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>
            Panel de Administrador
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Gestiona las instituciones acreditadas para emitir credenciales en la red.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => { setShowForm(v => !v); setError(''); }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          {showForm ? <><X size={18} /> Cancelar</> : <><PlusCircle size={18} /> Nueva Institución</>}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <Landmark size={32} color="var(--primary)" style={{ marginBottom: '0.5rem' }} />
          <p style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--text-main)', margin: '0.2rem 0' }}>{instituciones.length}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Instituciones Registradas</p>
        </div>
      </div>

      {successMsg && (
        <div style={{ background: 'rgba(22, 163, 74, 0.1)', border: '1px solid var(--success)', padding: '1rem', borderRadius: '8px', color: 'var(--success)', marginBottom: '1.5rem' }}>
          {successMsg}
        </div>
      )}

      {/* Formulario de creación */}
      {showForm && (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building2 size={20} color="var(--primary)" /> Registrar Nueva Institución
          </h3>

          {error && (
            <div style={{ color: 'var(--error)', marginBottom: '1rem' }}>{error}</div>
          )}

          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label>Nombre de la Institución</label>
                <input
                  type="text"
                  className="glass-input"
                  value={formData.nombre}
                  onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej. Registro Civil"
                  required
                />
              </div>
              <div className="input-group">
                <label>Tipo</label>
                <input
                  type="text"
                  className="glass-input"
                  value={formData.tipo}
                  onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                  placeholder="Ej. Gubernamental, Educativa..."
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>Wallet (opcional, dirección 0x...)</label>
              <input
                type="text"
                className="glass-input"
                value={formData.wallet}
                onChange={e => setFormData({ ...formData, wallet: e.target.value })}
                placeholder="0x..."
              />
            </div>

            <hr style={{ borderColor: 'var(--glass-border)', margin: '0.25rem 0' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
              Credenciales de acceso para el usuario de la institución (rol INSTITUCION):
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label>Correo Electrónico</label>
                <input
                  type="email"
                  className="glass-input"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="input-group">
                <label>Contraseña</label>
                <input
                  type="password"
                  className="glass-input"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  minLength={6}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={creating} style={{ marginTop: '0.5rem' }}>
              {creating ? 'Creando...' : <><PlusCircle size={18} /> Crear Institución</>}
            </button>
          </form>
        </div>
      )}

      {/* Listado de instituciones */}
      <h3 style={{ color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.15rem', fontWeight: 600 }}>
        <Building2 size={20} color="var(--primary)" /> Instituciones Registradas
      </h3>

      {editingInst && (
        <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '1.5rem', border: '1px solid var(--primary-light)' }}>
          <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Pencil size={18} color="var(--primary)" /> Editar Institución: {editingInst.nombre}
          </h4>
          <form onSubmit={saveEditInst} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label>Nombre</label>
                <input className="glass-input" value={editForm.nombre} onChange={e => setEditForm({ ...editForm, nombre: e.target.value })} required />
              </div>
              <div className="input-group">
                <label>Tipo</label>
                <input className="glass-input" value={editForm.tipo} onChange={e => setEditForm({ ...editForm, tipo: e.target.value })} required />
              </div>
              <div className="input-group">
                <label>Wallet (0x...)</label>
                <input className="glass-input" value={editForm.wallet} onChange={e => setEditForm({ ...editForm, wallet: e.target.value })} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Atributos de Identidad</label>
              {atributosCatalogo.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Cargando catálogo de atributos...</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
                  {atributosCatalogo.map(attr => (
                    <label key={attr.clave} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={atributosSeleccionados.includes(attr.clave)}
                        onChange={() => toggleAtributo(attr.clave)}
                      />
                      {attr.etiqueta}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" className="btn btn-primary" disabled={savingInst} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Save size={16} /> {savingInst ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              <button type="button" className="btn btn-outline" onClick={cancelEditInst} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <X size={16} /> Cancelar
              </button>
            </div>
          </form>

          <hr style={{ borderColor: 'var(--glass-border)', margin: '1.5rem 0' }} />
          <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ClipboardList size={18} color="var(--primary)" /> Trámites Habilitados
          </h4>

          <form onSubmit={addTramite} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '1.25rem' }}>
            <div className="input-group" style={{ flex: '1 1 200px' }}>
              <label>Nombre del trámite</label>
              <input
                className="glass-input"
                value={tramiteForm.nombre}
                onChange={e => setTramiteForm({ ...tramiteForm, nombre: e.target.value })}
                placeholder="Ej. Duplicado de cédula"
                required
              />
            </div>
            <div className="input-group" style={{ flex: '2 1 260px' }}>
              <label>Descripción (opcional)</label>
              <input
                className="glass-input"
                value={tramiteForm.descripcion}
                onChange={e => setTramiteForm({ ...tramiteForm, descripcion: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={addingTramite} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Plus size={16} /> {addingTramite ? 'Agregando...' : 'Agregar'}
            </button>
          </form>

          {loadingTramites ? (
            <p style={{ color: 'var(--text-muted)' }}>Cargando trámites...</p>
          ) : tramites.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Esta institución no tiene trámites configurados.</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {tramites.map(t => (
                <div key={t.id} className="glass-card" style={{ padding: '1rem' }}>
                  {editingTramite?.id === t.id ? (
                    <form onSubmit={saveTramite} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div className="input-group">
                          <label>Nombre</label>
                          <input
                            className="glass-input"
                            value={editTramiteForm.nombre}
                            onChange={e => setEditTramiteForm({ ...editTramiteForm, nombre: e.target.value })}
                            required
                          />
                        </div>
                        <div className="input-group">
                          <label>Descripción</label>
                          <input
                            className="glass-input"
                            value={editTramiteForm.descripcion}
                            onChange={e => setEditTramiteForm({ ...editTramiteForm, descripcion: e.target.value })}
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="submit" className="btn btn-primary" disabled={savingTramite} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Save size={15} /> {savingTramite ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button type="button" className="btn btn-outline" onClick={cancelEditTramite} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <X size={15} /> Cancelar
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                          <strong style={{ color: 'var(--text-main)' }}>{t.nombre}</strong>
                          <span
                            className={t.activo ? 'badge-primary' : 'badge-warning'}
                            style={t.activo ? { background: 'rgba(22, 163, 74, 0.10)', color: 'var(--success)', borderColor: 'rgba(22, 163, 74, 0.35)' } : undefined}
                          >
                            {t.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        {t.descripcion && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>{t.descripcion}</p>}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button className="btn btn-outline" onClick={() => startEditTramite(t)} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Pencil size={14} /> Editar
                        </button>
                        <button
                          className="btn btn-outline"
                          onClick={() => toggleTramiteActivo(t)}
                          disabled={togglingTramiteId === t.id}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          {t.activo ? <Ban size={14} /> : <CheckCircle2 size={14} />}
                          {togglingTramiteId === t.id ? 'Actualizando...' : t.activo ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => deleteTramite(t)}
                          disabled={deletingTramiteId === t.id}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          <Trash2 size={14} /> {deletingTramiteId === t.id ? 'Eliminando...' : 'Eliminar'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Cargando instituciones...</p>
      ) : instituciones.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <Building2 size={40} color="var(--text-muted)" style={{ marginBottom: '0.75rem', opacity: 0.6 }} />
          <p style={{ color: 'var(--text-muted)' }}>No hay instituciones registradas todavía.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {instituciones.map(inst => (
            <div key={inst.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                  <h4 style={{ color: 'var(--text-main)', margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
                    {inst.nombre}
                  </h4>
                  <span
                    className={inst.activo ? 'badge-primary' : 'badge-warning'}
                    style={inst.activo ? { background: 'rgba(22, 163, 74, 0.10)', color: 'var(--success)', borderColor: 'rgba(22, 163, 74, 0.35)' } : undefined}
                  >
                    {inst.activo ? 'Activa' : 'Suspendida'}
                  </span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  Tipo: {inst.tipo}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Users size={14} /> {inst.usuariosRegistrados ?? 0} ciudadanos registrados
                </p>
                {inst.wallet && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                    Wallet: {inst.wallet}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-outline"
                  onClick={() => startEditInst(inst)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Pencil size={15} /> Editar
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => toggleActivo(inst)}
                  disabled={togglingId === inst.id}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  {inst.activo ? <Ban size={15} /> : <CheckCircle2 size={15} />}
                  {togglingId === inst.id ? 'Actualizando...' : inst.activo ? 'Suspender' : 'Reactivar'}
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDelete(inst)}
                  disabled={deletingId === inst.id}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Trash2 size={16} /> {deletingId === inst.id ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
