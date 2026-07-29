# Configuración del Frontend

## Tecnologías

| Tecnología | Versión |
|------------|---------|
| React | v19.2.7 |
| TypeScript | v6.0 |
| Vite | v8.1 |
| React Router DOM | v7.18 |
| Axios | v1.18 |
| Lucide React | v1.23 |
| Oxlint | v1.71 |

## Estructura del Proyecto (Frontend)

```
Frontend/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── assets/
│   │   ├── hero.png
│   │   ├── react.svg
│   │   └── vite.svg
│   ├── pages/
│   │   ├── AdminDashboard.tsx
│   │   ├── CitizenRequest.tsx
│   │   ├── Issuer.tsx
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Verifier.tsx
│   │   └── Wallet.tsx
│   ├── App.css
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── .gitignore
├── .oxlintrc.json
├── index.html
├── package.json
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## Instalación y Ejecución

```bash
cd Frontend
npm install
npm run dev
# Servidor en http://localhost:5173
```

## Rutas del Frontend

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/` | Wallet | Billetera de identidad del ciudadano |
| `/solicitar` | CitizenRequest | Solicitar identidad oficial |
| `/emisor` | Issuer | Dashboard de emisión de credenciales |
| `/verificador` | Verifier | Portal de verificación de credenciales |
| `/admin` | AdminDashboard | Panel de administración (solo ADMIN) |
| `/login` | Login | Inicio de sesión |
| `/registro` | Register | Registro de nuevo usuario |

## Componentes (Páginas)

### App.tsx
- Navegación principal con React Router
- Estado global de usuario (`user` con nombre y rol)
- Header con enlaces contextuales según el rol
- Footer institucional
- Manejo de autenticación y logout

### Wallet.tsx
- Muestra credenciales activas del ciudadano
- Muestra solicitudes en revisión
- Visualización de clave privada por credencial
- Diseño glassmorphism con estado vacío
- Integración con API: `GET /solicitudes/usuario/:id`

### CitizenRequest.tsx
- Formulario de solicitud de identidad
- Campos: nombres, apellidos, edad, fecha nacimiento, sexo, lugar nacimiento
- Generación automática de número de cédula
- Hash de seguimiento temporal
- Integración con API: `POST /solicitudes`

### Issuer.tsx
- Selección de institución emisora
- Selección de ciudadano titular
- Formulario de emisión (título, descripción)
- Integración con API: `POST /credentials`, `GET /users`, `GET /institutions`
- Mensaje de éxito al emitir en blockchain

### Verifier.tsx
- Input para ID de credencial
- Verificación contra blockchain
- Resultados: auténtica vs inválida/alterada
- Muestra titular, emisor, fecha, hash criptográfico
- Integración con API: `GET /credentials/:id/verify`

### AdminDashboard.tsx
- Estadísticas de solicitudes
- Lista de solicitudes pendientes
- Aprobación de solicitudes con generación de clave privada
- Asignación de cédula y hash temporal
- Integración con API: `GET /solicitudes/pendientes`, `PUT /solicitudes/:id/aprobar`

### Login.tsx
- Formulario de inicio de sesión
- Almacenamiento de JWT en localStorage
- Redirección según rol (ADMIN → /admin, CIUDADANO → /)

### Register.tsx
- Formulario de registro
- Campos: nombre, email, password
- Código secreto opcional para ADMIN
- Redirección automática a login tras registro

## Estilos

### App.css / index.css
- Tema oscuro con glassmorphism
- Variables CSS personalizadas
- Animaciones y transiciones
- Diseño responsive

## Integración con Backend

Todas las páginas se comunican con el backend NestJS en `http://localhost:3000` mediante Axios:

| Página | Endpoints |
|--------|-----------|
| Wallet | `GET /solicitudes/usuario/:id` |
| CitizenRequest | `POST /solicitudes` |
| Issuer | `GET /users`, `GET /institutions`, `POST /credentials` |
| Verifier | `GET /credentials/:id/verify` |
| AdminDashboard | `GET /solicitudes/pendientes`, `PUT /solicitudes/:id/aprobar` |
| Login | `POST /auth/login` |
| Register | `POST /auth/register` |
| Wallet | `POST /wallet/did` |

## Configuraciones Adicionales

### vite.config.ts
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

### tsconfig.json
```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

### .gitignore
Excluye: node_modules, dist, archivos .local, .vscode, .idea, .DS_Store

## Notas

- El frontend asume que el backend corre en `localhost:3000`
- La autenticación usa JWT almacenado en localStorage
- El diseño usa glassmorphism (fondos semitransparentes con blur)
- Los iconos son de Lucide React
