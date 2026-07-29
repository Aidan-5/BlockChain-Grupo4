# Configuración del Backend

## Tecnologías

| Tecnología | Versión |
|------------|---------|
| Node.js | v22.x |
| NestJS | v11 |
| Prisma ORM | v6.19.3 |
| MySQL Server | 8.x |
| TypeScript | 5.x |
| ethers.js | v6.17.0 |
| JWT | @nestjs/jwt v11 |
| bcrypt | v6 |

## Estructura del Proyecto (Backend)

```
Backend/
├── prisma/
│   ├── migrations/        # Migraciones de base de datos
│   │   ├── 20260707071529_init/
│   │   ├── 20260707073116_add_did_wallet/
│   │   ├── 20260707074945_add_institucion/
│   │   └── 20260708000000_add_solicitudes_credenciales/
│   └── schema.prisma       # Esquema de datos
├── src/
│   ├── auth/               # Autenticación JWT
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   └── auth.service.ts
│   ├── blockchain/         # Conexión con Hyperledger Besu
│   │   ├── blockchain.controller.ts
│   │   ├── blockchain.module.ts
│   │   ├── blockchain.service.ts
│   │   └── credential-registry.abi.ts
│   ├── credentials/        # Gestión de credenciales
│   │   ├── dto/
│   │   ├── credentials.controller.ts
│   │   ├── credentials.module.ts
│   │   └── credentials.service.ts
│   ├── institutions/       # Gestión de instituciones
│   │   ├── dto/
│   │   ├── institutions.controller.ts
│   │   ├── institutions.module.ts
│   │   └── institutions.service.ts
│   ├── prisma/             # Servicio global Prisma ORM
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── solicitudes/        # Solicitudes de identidad
│   │   ├── solicitudes.controller.ts
│   │   ├── solicitudes.module.ts
│   │   └── solicitudes.service.ts
│   ├── users/              # Gestión de usuarios
│   │   ├── dto/
│   │   ├── users.controller.ts
│   │   ├── users.module.ts
│   │   └── users.service.ts
│   ├── wallet/             # DID y hash de credenciales
│   │   ├── dto/
│   │   ├── wallet.controller.ts
│   │   ├── wallet.module.ts
│   │   └── wallet.service.ts
│   ├── app.controller.ts
│   ├── app.module.ts       # Módulo raíz
│   ├── app.service.ts
│   └── main.ts             # Entry point
├── test/
├── .env
├── nest-cli.json
├── package.json
├── tsconfig.json
└── tsconfig.build.json
```

## Modelo de Datos (Prisma)

### Enum Rol
```
CIUDADANO, ADMIN
```

### Enum EstadoSolicitud
```
PENDIENTE, APROBADA, RECHAZADA
```

### Modelo Usuario
| Campo | Tipo | Atributos |
|-------|------|-----------|
| id | Int | @id @default(autoincrement()) |
| nombre | String | |
| identificacion | String? | @unique |
| email | String | @unique |
| password | String | @default("123456") |
| rol | Rol | @default(CIUDADANO) |
| wallet | String? | @unique |
| did | String? | @unique |
| createdAt | DateTime | @default(now()) |
| credenciales | Credencial[] | |
| solicitudes | Solicitud[] | |

### Modelo Institucion
| Campo | Tipo | Atributos |
|-------|------|-----------|
| id | Int | @id @default(autoincrement()) |
| nombre | String | |
| tipo | String | |
| wallet | String? | @unique |
| createdAt | DateTime | @default(now()) |
| credenciales | Credencial[] | |

### Modelo Credencial
| Campo | Tipo | Atributos |
|-------|------|-----------|
| id | Int | @id @default(autoincrement()) |
| titulo | String | |
| descripcion | String | |
| hashBlockchain | String? | |
| emitidaEn | DateTime | @default(now()) |
| usuarioId | Int | FK → Usuario |
| institucionId | Int | FK → Institucion |

### Modelo Solicitud
| Campo | Tipo | Atributos |
|-------|------|-----------|
| id | Int | @id @default(autoincrement()) |
| tipoCredencial | String | |
| datosJSON | String | @db.Text |
| estado | EstadoSolicitud | @default(PENDIENTE) |
| hashTemporal | String? | @unique |
| usuarioId | Int | FK → Usuario |
| createdAt | DateTime | @default(now()) |

## Endpoints de la API

### Auth (`/auth`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /auth/register | Registra usuario (CIUDADANO o ADMIN con código secreto) |
| POST | /auth/login | Login JWT, retorna access_token + datos usuario |

### Users (`/users`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /users | Lista todos los usuarios |
| POST | /users | Crea un usuario (con wallet y DID opcional) |

### Institutions (`/institutions`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /institutions | Lista instituciones |
| POST | /institutions | Crea institución |
| GET | /institutions/:id | Obtiene institución por ID |
| DELETE | /institutions/:id | Elimina institución |

### Credentials (`/credentials`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /credentials | Lista credenciales |
| POST | /credentials | Emite credencial (registra hash en Blockchain) |
| GET | /credentials/:id | Obtiene credencial por ID |
| GET | /credentials/:id/verify | Verifica credencial contra Blockchain |

### Solicitudes (`/solicitudes`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /solicitudes | Crea solicitud de identidad |
| GET | /solicitudes/pendientes | Lista solicitudes pendientes |
| GET | /solicitudes/usuario/:id | Solicitudes por usuario |
| PUT | /solicitudes/:id/aprobar | Aprueba solicitud y emite credencial |

### Blockchain (`/blockchain`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /blockchain/status | Estado de conexión con Besu |
| GET | /blockchain/verify/:hash | Verifica hash en la blockchain |

### Wallet (`/wallet`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /wallet/did | Genera DID a partir de dirección de wallet |

## Instalación y Ejecución

```bash
cd Backend
npm install

# Configurar .env
# DATABASE_URL="mysql://root:TU_PASSWORD@localhost:3306/identidad_digital_ssi"

npx prisma generate
npx prisma migrate dev

npm run start:dev
# Servidor en http://localhost:3000
```

## Servicios Clave

### AuthService
- `register()` → Hash de password con bcrypt, roles CIUDADANO/ADMIN
- `login()` → Validación de credenciales, firma JWT

### BlockchainService
- Conexión a Hyperledger Besu via ethers.js
- Carga contrato CredentialRegistry desde ABI
- `registerCredential(hash)` → TX on-chain
- `verifyCredential(hash)` → Verificación contra blockchain

### CredentialsService
- Emite credenciales y registra hash SHA-256 en blockchain
- `verify(id)` → Verifica integridad (hash local vs on-chain)

### SolicitudesService
- `create()` → Solicitud con hash temporal SHA-256
- `approve()` → Aprueba, genera clave privada, crea credencial

### WalletService
- `generateDid(wallet)` → `did:besu:0x...`
- `generateCredentialHash()` → SHA-256 de datos de credencial

## Migraciones Realizadas

```bash
npx prisma migrate dev --name init
npx prisma migrate dev --name add_did_wallet
npx prisma migrate dev --name add_institucion
npx prisma migrate dev --name add_solicitudes_credenciales
```

## Problemas y Soluciones

| Problema | Solución |
|----------|----------|
| Prisma 7 incompatible | Usar Prisma 6 (`npm install prisma@6 @prisma/client@6`) |
| Error EPERM en Windows | Detener servidor, `taskkill /F /IM node.exe`, luego `npx prisma generate` |
