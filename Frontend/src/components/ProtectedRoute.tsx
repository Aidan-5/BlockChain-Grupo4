import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

interface AuthUser {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}

interface ProtectedRouteProps {
  user: AuthUser | null;
  allowedRoles?: string[];
  children: ReactNode;
}

// Guard de rutas: sin sesión -> /login. Con sesión pero rol no permitido -> /.
// Antes cualquiera podía navegar directo a /admin o /emisor sin token; la
// visibilidad en el nav era la única "protección" (solo UI).
const ProtectedRoute = ({ user, allowedRoles, children }: ProtectedRouteProps) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
