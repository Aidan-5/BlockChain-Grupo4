import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import apiClient from '../config/axios';

interface Notificacion {
  id: number;
  titulo: string;
  mensaje: string;
  leida: boolean;
  createdAt: string;
}

// Formatea una fecha ISO como "hace X" de forma simple, sin dependencias externas.
const formatRelativo = (iso: string) => {
  const fecha = new Date(iso);
  const diffMs = Date.now() - fecha.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'ahora mismo';
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffHoras = Math.floor(diffMin / 60);
  if (diffHoras < 24) return `hace ${diffHoras} h`;
  const diffDias = Math.floor(diffHoras / 24);
  if (diffDias < 30) return `hace ${diffDias} d`;
  return fecha.toLocaleDateString();
};

// Campana de notificaciones compartida entre roles (ADMIN, INSTITUCION, CIUDADANO).
// Solo se renderiza si hay un usuario logueado. Hace polling cada 30s para
// mantener el contador de no-leídas actualizado sin requerir websockets.
const NotificationBell = ({ user }: { user: any }) => {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchNotificaciones = async () => {
    try {
      const res = await apiClient.get('/notificaciones');
      setNotificaciones(res.data);
    } catch (error) {
      console.error('Error cargando notificaciones', error);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchNotificaciones();
    const interval = setInterval(fetchNotificaciones, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const noLeidas = notificaciones.filter(n => !n.leida).length;

  const handleClickNotificacion = async (n: Notificacion) => {
    if (n.leida) return;
    try {
      await apiClient.patch(`/notificaciones/${n.id}/leida`);
      setNotificaciones(prev => prev.map(item => (item.id === n.id ? { ...item, leida: true } : item)));
    } catch (error) {
      console.error('Error marcando notificación como leída', error);
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="btn btn-outline"
        style={{ padding: '0.5rem', position: 'relative' }}
        aria-label="Notificaciones"
      >
        <Bell size={18} />
        {noLeidas > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: 'var(--error)',
              color: 'white',
              borderRadius: '999px',
              fontSize: '0.65rem',
              fontWeight: 700,
              minWidth: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              lineHeight: 1,
            }}
          >
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {open && (
        <div
          className="glass-panel"
          style={{
            position: 'absolute',
            top: 'calc(100% + 0.5rem)',
            right: 0,
            width: '340px',
            maxHeight: '420px',
            overflowY: 'auto',
            padding: '0.75rem',
            zIndex: 1000,
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.25)',
          }}
        >
          <h4 style={{ margin: '0 0 0.5rem 0.25rem', fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: 700 }}>
            Notificaciones
          </h4>
          {notificaciones.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0.75rem 0.25rem' }}>
              No tienes notificaciones.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {notificaciones.map(n => (
                <div
                  key={n.id}
                  onClick={() => handleClickNotificacion(n)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    padding: '0.6rem 0.65rem',
                    borderRadius: '10px',
                    background: n.leida ? 'transparent' : 'var(--primary-subtle)',
                    cursor: n.leida ? 'default' : 'pointer',
                    border: '1px solid var(--glass-border)',
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '999px',
                      marginTop: '0.35rem',
                      flexShrink: 0,
                      background: n.leida ? 'transparent' : 'var(--primary)',
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: n.leida ? 500 : 700, color: 'var(--text-main)' }}>
                      {n.titulo}
                    </p>
                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {n.mensaje}
                    </p>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {formatRelativo(n.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
